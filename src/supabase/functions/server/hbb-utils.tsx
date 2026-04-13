// HBB Utility Functions — Shared across all HBB server routes
// Phone normalization, validation, sanitization, SR number generation, rate limiting

// ─── PHONE NORMALIZATION ────────────────────────────────────────────────────
// Canonical format: 0XXXXXXXXX (10 digits, starts with 0)
// This ensures agent_phone stored in service_request always matches login phone
export function normalizeKenyanPhone(phone: string | number): string {
  const str = String(phone).replace(/[\s\-\(\)\+]/g, '');
  // Extract last 9 digits
  const match = str.match(/(\d{9})$/);
  if (!match) return str; // Can't normalize — return as-is
  return '0' + match[1]; // Always 0XXXXXXXXX
}

// Validate that a phone looks like a Kenyan mobile number
export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  // Kenya mobile: 07XX, 01XX (10 digits starting with 0, second digit 7 or 1)
  return /^0[17]\d{8}$/.test(normalized);
}

// Generate all format variants for DB lookup (covers text and bigint columns)
export function phoneFormats(phone: string | number): { text: string[]; numeric: number[] } {
  const norm = normalizeKenyanPhone(phone);
  const last9 = norm.slice(-9);
  return {
    text: [last9, '0' + last9, '+254' + last9, '254' + last9],
    numeric: [Number(last9), Number('254' + last9)].filter(n => !isNaN(n) && n > 0),
  };
}

// ─── SR NUMBER GENERATION ───────────────────────────────────────────────────
// Format: HBB-YYMMDD-XXXX (e.g. HBB-260308-A7K2)
// Uses date + 4-char alphanumeric random suffix for uniqueness
export function generateSRNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HBB-${yy}${mm}${dd}-${suffix}`;
}

// ─── INPUT SANITIZATION ─────────────────────────────────────────────────────
// Strip potential XSS vectors and limit length
export function sanitizeString(str: string | undefined | null, maxLength = 500): string {
  if (!str) return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/[<>]/g, '') // Strip angle brackets
    .replace(/javascript:/gi, '') // Strip JS protocol
    .replace(/on\w+\s*=/gi, '') // Strip event handlers
    .trim()
    .slice(0, maxLength);
}

// Sanitize an object's string fields recursively
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ─── RATE LIMITER ───────────────────────────────────────────────────────────
// In-memory sliding window rate limiter
// Limits per IP/phone to prevent abuse
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

// ─── VALIDATION HELPERS ─────────────────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
}

export function validateServiceRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.customer_name || typeof body.customer_name !== 'string' || body.customer_name.trim().length < 2) {
    errors.push({ field: 'customer_name', message: 'Customer name is required (min 2 characters)' });
  }
  if (body.customer_name && body.customer_name.trim().length > 100) {
    errors.push({ field: 'customer_name', message: 'Customer name too long (max 100 characters)' });
  }

  if (!body.customer_phone || typeof body.customer_phone !== 'string') {
    errors.push({ field: 'customer_phone', message: 'Customer phone is required' });
  } else if (!isValidKenyanPhone(body.customer_phone)) {
    errors.push({ field: 'customer_phone', message: 'Invalid Kenyan phone number (must be 07XX or 01XX format)' });
  }

  if (!body.town_id || isNaN(Number(body.town_id))) {
    errors.push({ field: 'town_id', message: 'Town is required' });
  }

  if (!body.agent_phone || typeof body.agent_phone !== 'string') {
    errors.push({ field: 'agent_phone', message: 'Agent phone is required' });
  }

  if (!body.agent_name || typeof body.agent_name !== 'string') {
    errors.push({ field: 'agent_name', message: 'Agent name is required' });
  }

  // Optional field validation
  if (body.preferred_date) {
    const date = new Date(body.preferred_date);
    if (isNaN(date.getTime())) {
      errors.push({ field: 'preferred_date', message: 'Invalid date format' });
    }
    // Allow today and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      errors.push({ field: 'preferred_date', message: 'Preferred date cannot be in the past' });
    }
  }

  if (body.estate && body.estate.length > 200) {
    errors.push({ field: 'estate', message: 'Estate name too long' });
  }

  if (body.remarks && body.remarks.length > 1000) {
    errors.push({ field: 'remarks', message: 'Remarks too long (max 1000 characters)' });
  }

  return errors;
}

// ─── DUPLICATE DETECTION ────────────────────────────────────────────────────
// Check if a similar SR already exists (same customer phone + town within 24h)
export async function checkDuplicate(
  supabase: any,
  customerPhone: string,
  townId: number
): Promise<{ isDuplicate: boolean; existingSR?: any }> {
  const normalizedPhone = normalizeKenyanPhone(customerPhone);
  const formats = phoneFormats(normalizedPhone);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('service_request')
    .select('id, sr_number, customer_name, status, created_at')
    .eq('town_id', townId)
    .in('customer_phone', formats.text)
    .gte('created_at', since)
    .not('status', 'eq', 'failed') // Allow re-submission of failed SRs
    .limit(1);

  if (data && data.length > 0) {
    return { isDuplicate: true, existingSR: data[0] };
  }
  return { isDuplicate: false };
}

// ─── SESSION HELPERS ────────────────────────────────────────────────────────
// Session tokens for HBB users (simple hash-based, stored in memory)
const sessionStore = new Map<string, { phone: string; role: string; expiresAt: number }>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(phone: string, role: string): string {
  const token = crypto.randomUUID();
  sessionStore.set(token, {
    phone: normalizeKenyanPhone(phone),
    role,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  // Cleanup expired sessions periodically
  if (sessionStore.size > 5000) {
    const now = Date.now();
    for (const [k, v] of sessionStore) {
      if (v.expiresAt < now) sessionStore.delete(k);
    }
  }
  return token;
}

export function validateSession(token: string): { phone: string; role: string } | null {
  const session = sessionStore.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessionStore.delete(token);
    return null;
  }
  return { phone: session.phone, role: session.role };
}

export function destroySession(token: string): void {
  sessionStore.delete(token);
}

// ─── KENYA TIMEZONE HELPERS ─────────────────────────────────────────────────
// Kenya is UTC+3 (EAT). Server runs in UTC, so we need to offset for "today".
export function getKenyaToday(): string {
  const now = new Date();
  // Add 3 hours to get Kenya time, then extract date
  const kenyaTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return kenyaTime.toISOString().split('T')[0];
}

export function getKenyaNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 3 * 60 * 60 * 1000);
}