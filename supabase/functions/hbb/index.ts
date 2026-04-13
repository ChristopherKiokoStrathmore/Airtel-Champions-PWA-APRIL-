// HBB CRM Server Routes - Production-hardened
// All HBB data flows through here. The frontend Supabase (xspogpfohjmkykfjadhk)
// can't be reached directly from the Figma Make preview iframe, so we proxy every query.
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  normalizeKenyanPhone,
  isValidKenyanPhone,
  phoneFormats,
  generateSRNumber,
  sanitizeString,
  sanitizeObject,
  checkRateLimit,
  validateServiceRequest,
  checkDuplicate,
  createSession,
  validateSession,
  destroySession,
  getKenyaToday,
} from "./hbb-utils.tsx";

const hbbApp = new Hono();

// Frontend Supabase client - HBB tables live here
// FRONTEND_SUPABASE_URL env var may contain just a project ref or an invalid value,
// so we validate it's a proper URL before using it.
const HARDCODED_FRONTEND_URL = 'https://xspogpfohjmkykfjadhk.supabase.co';
const HARDCODED_FRONTEND_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';

function getValidUrl(envVar: string | undefined, fallback: string): string {
  if (!envVar) return fallback;
  try {
    const url = new URL(envVar);
    return url.href;
  } catch {
    return fallback;
  }
}

function getFrontendSupabase() {
  const url = getValidUrl(Deno.env.get('FRONTEND_SUPABASE_URL'), HARDCODED_FRONTEND_URL);
  const key = Deno.env.get('FRONTEND_SUPABASE_ANON_KEY') || HARDCODED_FRONTEND_KEY;
  return createClient(url, key);
}

// Rate limiting middleware
hbbApp.use('*', async (c, next) => {
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const rateLimitResult = await checkRateLimit(clientIP, 100, 60000); // 100 requests per minute
  
  if (!rateLimitResult.allowed) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  await next();
});

// CORS middleware
hbbApp.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  
  await next();
});

// Health check
hbbApp.get('/health', () => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// UPDATE JOB STATUS - Fixed NaN handling
hbbApp.put('/service-requests/:id', async (c) => {
  try {
    const idParam = c.req.param('id');
    if (!idParam) return c.json({ error: 'Invalid job ID' }, 400);

    const rawBody = await c.req.json();
    const body = sanitizeObject(rawBody);
    const supabase = getFrontendSupabase();

    // Validate status
    const VALID_STATUSES = ['pending', 'open', 'assigned', 'on_way', 'arrived', 'completed', 'failed', 'cancelled', 'rescheduled', 'unreachable', 'not_ready', 'scheduled'];
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return c.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, 400);
    }

    const updates: any = { status: body.status };
    if (body.remarks !== undefined) updates.remarks = sanitizeString(body.remarks, 1000);
    if (body.status === 'completed') updates.completed_at = new Date().toISOString();

    // GPS check-in location
    if (body.location && typeof body.location === 'object') {
      console.log('[HBB] Processing location in backend:', body.location);
      
      const lat = Number(body.location.lat);
      const lng = Number(body.location.lng);
      const accuracy = body.location.accuracy ? Number(body.location.accuracy) : null;
      
      console.log('[HBB] Converted location values:', {
        lat,
        lng,
        accuracy,
        latIsNaN: isNaN(lat),
        lngIsNaN: isNaN(lng),
        accuracyIsNaN: accuracy ? isNaN(accuracy) : 'N/A'
      });
      
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        const accuracyRounded = accuracy && !isNaN(accuracy) ? Math.round(accuracy) : null;
        const locStr = `[GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}${accuracyRounded ? ` ±${accuracyRounded}m` : ''}]`;
        updates.remarks = updates.remarks ? `${updates.remarks}\n${locStr}` : locStr;
        updates.completion_lat = lat;
        updates.completion_lng = lng;
        console.log('[HBB] Location added to updates:', { completion_lat: lat, completion_lng: lng });
      } else {
        console.log('[HBB] Invalid GPS coordinates, skipping location update');
      }
    }

    // Determine if idParam is a UUID (jobs.id) or a legacy bigint (legacy_sr_id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);

    let query = supabase.from('jobs').update(updates);
    if (isUUID) {
      query = query.eq('id', idParam);
    } else {
      // Convert to number safely, prevent NaN
      const legacyId = Number(idParam);
      if (isNaN(legacyId)) {
        return c.json({ error: 'Invalid job ID format' }, 400);
      }
      query = query.eq('legacy_sr_id', legacyId);
    }

    const { data, error } = await query.select('*, installers(name, phone)').single();

    if (error) {
      console.log('[HBB] Update job error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (err: any) {
    console.error('[HBB] Update job exception:', err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
  }
});

// GET SERVICE REQUESTS - Fixed NaN handling for installer_id
hbbApp.get('/service-requests', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const { status, agentPhone, installerId, limit, offset } = c.req.query();

    let query = supabase
      .from('jobs')
      .select(`
        id, sr_number, customer_name, customer_phone,
        town, estate_name, package, scheduled_date, scheduled_time,
        status, installer_id, assigned_at,
        agent_name, agent_phone, remarks, completed_at, created_at,
        service_request_id, legacy_sr_id,
        installers(name, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    // PHONE NORMALIZATION: Match agent_phone across all stored formats
    if (agentPhone) {
      const formats = phoneFormats(agentPhone);
      query = query.in('agent_phone', formats.text);
    }

    if (installerId) {
      const installerNum = Number(installerId);
      if (!isNaN(installerNum)) {
        query = query.eq('installer_id', installerNum);
      }
    }

    // Pagination with hard cap
    const maxLimit = Math.min(Number(limit || 50), 200);
    const off = Math.max(Number(offset || 0), 0);
    query = query.range(off, off + maxLimit - 1);

    const { data, error, count } = await query;
    if (error) {
      console.log('[HBB] Jobs query error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json({ data, count, limit: maxLimit, offset: off });
  } catch (err: any) {
    console.error('[HBB] Jobs exception:', err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
  }
});

// CREATE SERVICE REQUEST - Fixed NaN handling
hbbApp.post('/service-requests', async (c) => {
  try {
    const rawBody = await c.req.json();
    const body = sanitizeObject(rawBody);
    const supabase = getFrontendSupabase();

    // Validate required fields
    const validation = validateServiceRequest(body);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicate(body.customer_phone, body.customer_name);
    if (duplicateCheck.isDuplicate) {
      return c.json({ error: 'Duplicate service request detected' }, 409);
    }

    // Generate SR number
    const srNumber = generateSRNumber();

    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        sr_number: srNumber,
        customer_name: sanitizeString(body.customer_name, 100),
        customer_phone: normalizeKenyanPhone(body.customer_phone),
        town: sanitizeString(body.town, 50),
        estate_name: sanitizeString(body.estate_name, 100),
        package: sanitizeString(body.package, 100),
        scheduled_date: body.scheduled_date || null,
        scheduled_time: body.scheduled_time || null,
        agent_name: sanitizeString(body.agent_name, 100),
        agent_phone: normalizeKenyanPhone(body.agent_phone),
        remarks: sanitizeString(body.remarks, 1000),
        source_type: body.source_type || 'agent',
        source_id: body.source_id && !isNaN(Number(body.source_id)) ? Number(body.source_id) : null,
        source_name: sanitizeString(body.source_name, 100),
        customer_lat: body.customer_lat && !isNaN(Number(body.customer_lat)) ? Number(body.customer_lat) : null,
        customer_lng: body.customer_lng && !isNaN(Number(body.customer_lng)) ? Number(body.customer_lng) : null,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      console.log('[HBB] Create SR error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (err: any) {
    console.error('[HBB] Create SR exception:', err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
  }
});

// Export the app
export default hbbApp;
