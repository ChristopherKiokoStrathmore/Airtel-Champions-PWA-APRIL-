// HBB CRM API Layer — Production-hardened
// ALL queries go through make-server edge function. The external Supabase
// can't be reached directly from the browser in Figma Make's preview iframe.
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';

const BASE = `https://${projectId}.supabase.co/functions/v1`;

// Get auth headers with proper user session token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ─── EDGE FUNCTION WARM-UP ─────────────────────────────────────────────────
// Fire a lightweight GET once on module load to wake up the edge function.
// This eliminates cold-start "Failed to fetch" errors on the first real request.
let _serverReady: Promise<void> | null = null;

function warmUpServer(): Promise<void> {
  if (_serverReady) return _serverReady;
  _serverReady = (async () => {
    try {
      // Use the health endpoint (fast, no DB work) with a short timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/health`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` }, signal: controller.signal }
      );
      clearTimeout(timeout);
    } catch {
      // Ignore — this is best-effort. Real requests will retry on their own.
    }
  })();
  return _serverReady;
}

// Kick off warm-up immediately
warmUpServer();

// ─── PHONE NORMALIZATION (mirrors server-side logic) ────────────────────────
// Canonical format: 0XXXXXXXXX
export function normalizeKenyanPhone(phone: string | number): string {
  const str = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const match = str.match(/(\d{9})$/);
  if (!match) return str;
  return '0' + match[1];
}

export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  return /^0[17]\d{8}$/.test(normalized);
}

// ─── SESSION MANAGEMENT ─────────────────────────────────────────────────────
const SESSION_KEY = 'hbb_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface HBBSession {
  token: string;
  phone: string;
  role: string;
  loginAt: number;
}

export function setSession(token: string, phone: string, role: string) {
  const session: HBBSession = { token, phone, role, loginAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): HBBSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: HBBSession = JSON.parse(raw);
    // Check expiry
    if (Date.now() - session.loginAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}

// ─── RETRY HELPER ───────────────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err: any) {
      const isNetworkError =
        err instanceof TypeError && /failed to fetch|network/i.test(err.message);
      if (!isNetworkError || attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[HBB] Network error on attempt ${attempt + 1}/${retries + 1}, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

async function hbbFetch(path: string, options?: RequestInit) {
  // Wait for the server warm-up to complete (or timeout) before the first real request
  await warmUpServer();

  // Get fresh auth headers for each request
  const headers = await getAuthHeaders();

  const res = await fetchWithRetry(`${BASE}${path}`, {
    headers,
    ...options,
  });

  // Handle rate limiting
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Rate limit exceeded. Please wait a moment.');
  }

  // Safe JSON parse — server might return HTML on 502/504 gateway errors
  let body: any;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      console.error(`[HBB API] ${path} returned non-JSON (${res.status}):`, text.slice(0, 200));
      throw new Error(`Server error (${res.status}). Please try again.`);
    }
    // Try to parse as JSON anyway (some servers don't set content-type)
    try { body = JSON.parse(text); } catch {
      throw new Error(`Unexpected server response (${res.status}). Please try again.`);
    }
  } else {
    try {
      body = await res.json();
    } catch {
      throw new Error(`Failed to parse server response (${res.status}). Please try again.`);
    }
  }

  if (!res.ok) {
    console.error(`[HBB API] ${path} failed:`, res.status, body);
    throw new Error(body?.error || body?.message || `Request failed (${res.status})`);
  }

  return body;
}

// ─── OFFLINE CACHE ──────────────────────────────────────────────────────────
// Cache responses locally for offline fallback
const CACHE_PREFIX = 'hbb_cache:';

function setCacheItem(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      data,
      expiresAt: Date.now() + ttlMs,
    }));
  } catch { /* localStorage full — silently fail */ }
}

function getCacheItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

// ─── TOWNS ──────────────────────────────────────────────────────────────────
export async function getTowns() {
  try {
    const data = await hbbFetch('/towns');
    setCacheItem('towns', data, 30 * 60 * 1000); // Cache 30min
    return data;
  } catch (err) {
    console.error('[HBB] Error fetching towns:', err);
    // Offline fallback
    const cached = getCacheItem<any[]>('towns');
    if (cached) {
      console.log('[HBB] Using cached towns data');
      return cached;
    }
    return [];
  }
}

// ─── INSTALLERS ─────────────────────────────────────────────────────────────
export async function getInstallers(town?: string) {
  try {
    const qs = town ? `?town=${encodeURIComponent(town)}` : '';
    const data = await hbbFetch(`/installers${qs}`);
    setCacheItem(`installers:${town || 'all'}`, data, 10 * 60 * 1000);
    return data;
  } catch (err) {
    console.error('[HBB] Error fetching installers:', err);
    const cached = getCacheItem<any[]>(`installers:${town || 'all'}`);
    return cached || [];
  }
}

// ─── GET INSTALLER BY PHONE ─────────────────────────────────────────────────
export async function getInstallerByPhone(phone: string) {
  try {
    return await hbbFetch(`/hbb-installer-by-phone?phone=${encodeURIComponent(phone)}`);
  } catch (err) {
    console.warn('[HBB] No installer match for phone:', phone, err);
    return null;
  }
}

// ─── SERVICE REQUESTS ───────────────────────────────────────────────────────
export async function getServiceRequests(filters?: {
  status?: string;
  town_id?: number;
  agent_phone?: string;
  installer_id?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.town_id) params.set('town_id', String(filters.town_id));
    if (filters?.agent_phone) params.set('agent_phone', filters.agent_phone);
    if (filters?.installer_id) params.set('installer_id', String(filters.installer_id));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.offset) params.set('offset', String(filters.offset));

    const qs = params.toString();
    const data = await hbbFetch(`/service-requests${qs ? '?' + qs : ''}`);

    // Cache last fetch for offline
    const cacheKey = `sr:${filters?.agent_phone || 'all'}:${filters?.status || 'all'}`;
    setCacheItem(cacheKey, data, 2 * 60 * 1000); // 2min cache
    return data;
  } catch (err) {
    console.error('[HBB] Error fetching service requests:', err);
    const cacheKey = `sr:${filters?.agent_phone || 'all'}:${filters?.status || 'all'}`;
    const cached = getCacheItem<any>(cacheKey);
    return cached || { data: [], count: 0 };
  }
}

// ─── CREATE SERVICE REQUEST ─────────────────────────────────────────────────
// Single path: always writes to the unified `jobs` table.
// The dual-path (jobs + service_request fallback) has been removed post-migration.
export async function createServiceRequest(sr: {
  customer_name: string;
  customer_phone: string;
  town_id?: number;
  town?: string;              // text town name (resolved from towns_HBB if available)
  estate?: string;
  package: string;
  preferred_date?: string;
  preferred_time?: string;
  agent_name: string;
  agent_phone: string;
  remarks?: string;
  source_type?: 'dse' | 'public' | 'agent';
  source_id?: number;
  source_name?: string;
  // Geocoded coords from Nominatim (optional — enables radius-based matching)
  customer_lat?: number;
  customer_lng?: number;
}) {
  const { supabase } = await import('../../utils/supabase/client');

  // sr_number in jobs is bigint (DB type) — we don't set it here.
  // The caller can use jobs.id (UUID) as the unique reference instead.

  // Filter out NaN values to prevent database errors
  const insertData = {
    customer_name:  sr.customer_name,
    customer_phone: normalizeKenyanPhone(sr.customer_phone),
    town:           sr.town ?? null,
    estate_name:    sr.estate ?? null,
    package:        sr.package,
    scheduled_date: sr.preferred_date ?? null,
    scheduled_time: sr.preferred_time ?? null,
    agent_name:     sr.agent_name,
    agent_phone:    normalizeKenyanPhone(sr.agent_phone),
    remarks:        sr.remarks ?? null,
    source_type:    sr.source_type ?? 'agent',
    // Handle NaN values for numeric fields
    source_id:      (sr.source_id && !isNaN(sr.source_id)) ? sr.source_id : null,
    customer_lat:   (sr.customer_lat && !isNaN(sr.customer_lat)) ? sr.customer_lat : null,
    customer_lng:   (sr.customer_lng && !isNaN(sr.customer_lng)) ? sr.customer_lng : null,
    status:         'pending',
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('[HBB] createServiceRequest error:', error);
    throw error;
  }

  return data;
}

// ─── UPDATE SERVICE REQUEST STATUS ──────────────────────────────────────────
export async function updateServiceRequestStatus(
  id: string | number,
  status: string,
  remarks?: string,
  location?: { lat: number; lng: number; accuracy?: number }
) {
  // Map location object to match database schema
  const updateData: any = { status, remarks };
  
  console.log('[HBB API] updateServiceRequestStatus called with:', {
    id,
    status,
    remarks,
    location,
    locationType: typeof location,
    locationKeys: location ? Object.keys(location) : 'null',
    locationString: JSON.stringify(location)
  });
  
  if (location) {
    console.log('[HBB API] Processing location:', location);
    console.log('[HBB API] Location values:', {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      latIsNaN: location.lat ? isNaN(location.lat) : 'undefined',
      lngIsNaN: location.lng ? isNaN(location.lng) : 'undefined',
      accuracyIsNaN: location.accuracy ? isNaN(location.accuracy) : 'N/A'
    });
    
    // Handle NaN values for coordinates
    updateData.customer_lat = (location.lat && !isNaN(location.lat)) ? location.lat : null;
    updateData.customer_lng = (location.lng && !isNaN(location.lng)) ? location.lng : null;
    
    console.log('[HBB API] Final updateData:', updateData);
    // Note: location_accuracy column doesn't exist in current schema
    // If you need this field, add it to your database table
  }

  return await hbbFetch(`/service-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
}

// ─── AUTO-ALLOCATE ──────────────────────────────────────────────────────────
// Calls the unified client-side engine directly (no edge function round-trip).
export async function autoAllocateLead(jobId: string) {
  const { unifiedAutoAssign } = await import('./hbb-auto-assign');
  const result = await unifiedAutoAssign(String(jobId));
  return {
    allocated:      result.success,
    installer_id:   result.installerId,
    installer_name: result.installerName,
    error:          result.error,
    escalated:      result.escalated,
  };
}

// ─── AUTO-ALLOCATE ALL OPEN LEADS ───────────────────────────────────────────
export async function autoAllocateAllOpen() {
  const { bulkAutoAssign } = await import('./hbb-auto-assign');
  return bulkAutoAssign();
}

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────
export async function getDashboardStats(agentPhone?: string) {
  try {
    const qs = agentPhone ? `?agent_phone=${encodeURIComponent(agentPhone)}` : '';
    const data = await hbbFetch(`/stats${qs}`);
    setCacheItem(`stats:${agentPhone || 'all'}`, data, 60 * 1000); // 1min cache
    return data;
  } catch (err) {
    console.error('[HBB] Error fetching stats:', err);
    const cached = getCacheItem<any>(`stats:${agentPhone || 'all'}`);
    return cached || { open: 0, assigned: 0, completed: 0, failed: 0, total: 0, todayInstallations: 0 };
  }
}

// ─── CALENDAR AVAILABILITY ──────────────────────────────────────────────────
export async function getCalendarAvailability(townId: number, start: string, end: string) {
  try {
    return await hbbFetch(`/availability?town_id=${townId}&start=${start}&end=${end}`);
  } catch (err) {
    console.error('[HBB] Availability error:', err);
    return { installerCount: 0, totalDailyCapacity: 0, bookings: [] };
  }
}

// ─── HBB LOGIN ──────────────────────────────────────────────────────────────
export async function hbbLogin(phone: string, pin: string) {
  const result = await hbbFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  });

  // Store session token if login succeeded
  if (result?.session_token && result?.phone_number && result?.role) {
    setSession(result.session_token, result.phone_number, result.role);
  }

  return result;
}

// ─── CHANGE PIN ─────────────────────────────────────────────────────────────
export async function changePin(phone: string, currentPin: string, newPin: string, role: string) {
  return await hbbFetch('/change-pin', {
    method: 'POST',
    body: JSON.stringify({ phone, current_pin: currentPin, new_pin: newPin, role }),
  });
}

// ─── TOWNS & ESTATES ────────────────────────────────────────────────────────
export async function get14Towns() {
  try {
    return await hbbFetch('/towns/14');
  } catch (err) {
    console.error('[HBB] Get 14 towns error:', err);
    return [];
  }
}

export async function getEstatesForTownFromDB(townName: string) {
  try {
    return await hbbFetch(`/estates?town=${encodeURIComponent(townName)}`);
  } catch (err) {
    console.error('[HBB] Get estates error:', err);
    return [];
  }
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
export async function getNotifications(userPhone: string, role: 'agent' | 'installer') {
  try {
    return await hbbFetch(`/hbb-notifications?phone=${encodeURIComponent(userPhone)}&role=${role}`);
  } catch (err) {
    console.error('[HBB] Notifications error:', err);
    return [];
  }
}

export async function markNotificationsRead(userPhone: string, _role: 'agent' | 'installer') {
  try {
    // Update directly via Supabase — no edge function needed for this simple operation.
    // Try all common phone formats since installer_id storage format varies.
    const { text: phoneVariants } = phoneFormats(userPhone);
    await supabase
      .from('installer_notifications')
      .update({ is_read: true })
      .in('installer_id', phoneVariants)
      .eq('is_read', false);
  } catch (err) {
    // Non-critical — swallow silently so it never blocks UI
    console.warn('[HBB] Mark read error (non-critical):', err);
  }
}

// ─── ANALYTICS ──────────────────────────────────────────────────────────────
export async function getAnalytics(period: string, agentPhone?: string) {
  try {
    const params = new URLSearchParams({ period });
    if (agentPhone) params.set('agent_phone', agentPhone);
    return await hbbFetch(`/analytics?${params.toString()}`);
  } catch (err) {
    console.error('[HBB] Analytics error:', err);
    return {};
  }
}

// ─── BULK CREATE SERVICE REQUESTS ───────────────────────────────────────────
export async function bulkCreateServiceRequests(leads: any[]) {
  return await hbbFetch('/service-requests/bulk', {
    method: 'POST',
    body: JSON.stringify({ leads }),
  });
}

// ─── WHATSAPP MESSAGE LINK ──────────────────────────────────────────────────
export function generateWhatsAppLink(phone: string, message: string): string {
  let normalized = phone.replace(/[\s\-\(\)\+]/g, '');
  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.slice(1);
  } else if (!normalized.startsWith('254')) {
    normalized = '254' + normalized;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

// ─── SEED TEST DATA ─────────────────────────────────────────────────────────
export async function seedTestData() {
  return await hbbFetch('/seed', { method: 'POST' });
}

// ─── DEBUG / HEALTH CHECK ───────────────────────────────────────────────────
export async function getDebugInfo() {
  return await hbbFetch('/debug');
}