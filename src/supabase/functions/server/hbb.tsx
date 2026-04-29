// HBB CRM Server Routes — Production-hardened
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

// Frontend Supabase client — HBB tables live here
// FRONTEND_SUPABASE_URL env var may contain just a project ref or an invalid value,
// so we validate it's a proper URL before using it.
const HARDCODED_FRONTEND_URL = 'https://xspogpfohjmkykfjadhk.supabase.co';
const HARDCODED_FRONTEND_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';

function getValidUrl(envVar: string | undefined, fallback: string): string {
  if (!envVar) return fallback;
  // Must start with https:// to be a valid Supabase URL
  if (envVar.startsWith('https://') || envVar.startsWith('http://')) return envVar;
  // Might be just a project ref — construct URL from it
  if (/^[a-z]{20}$/.test(envVar)) return `https://${envVar}.supabase.co`;
  return fallback;
}

const FRONTEND_SUPABASE_URL = getValidUrl(Deno.env.get('FRONTEND_SUPABASE_URL'), HARDCODED_FRONTEND_URL);
const FRONTEND_SUPABASE_ANON_KEY = Deno.env.get('FRONTEND_SUPABASE_ANON_KEY') || HARDCODED_FRONTEND_KEY;

console.log('[HBB] Frontend Supabase URL:', FRONTEND_SUPABASE_URL);

function getFrontendSupabase() {
  return createClient(FRONTEND_SUPABASE_URL, FRONTEND_SUPABASE_ANON_KEY);
}

// ─── RATE LIMIT MIDDLEWARE ──────────────────────────────────────────────────
// Apply rate limiting per-IP for write operations
function getRateLimitKey(c: any, suffix: string): string {
  const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
  return `hbb:${suffix}:${ip}`;
}

// ─── GET TOWNS ──────────────────────────────────────────────────────────────
hbbApp.get('/towns', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const { data, error } = await supabase
      .from('towns_HBB')
      .select('id, name, code')
      .order('name');

    if (error) {
      console.log('[HBB] Towns query error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data || []);
  } catch (err: any) {
    console.error('[HBB] Towns error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET INSTALLERS ─────────────────────────────────────────────────────────
hbbApp.get('/installers', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const town = c.req.query('town');

    let query = supabase
      .from('installers')
      .select('id, name, phone, town, status, max_jobs_per_day, is_available, created_at')
      .order('name');

    if (town) {
      query = query.ilike('town', `%${town}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.log('[HBB] Installers query error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data || []);
  } catch (err: any) {
    console.error('[HBB] Installers error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET INSTALLER BY PHONE ────────────────────────────────��────────────────
hbbApp.get('/installer-by-phone', async (c) => {
  try {
    const phone = c.req.query('phone');
    if (!phone) return c.json({ error: 'phone is required' }, 400);

    const supabase = getFrontendSupabase();
    const formats = phoneFormats(phone);

    const { data, error } = await supabase
      .from('installers')
      .select('id, name, phone, town, status, max_jobs_per_day, is_available, pin')
      .in('phone', formats.text)
      .limit(1);

    if (error) {
      console.log('[HBB] Installer-by-phone error:', error.message);
      return c.json({ error: error.message }, 500);
    }
    if (!data || data.length === 0) {
      return c.json(null);
    }
    return c.json(data[0]);
  } catch (err: any) {
    console.error('[HBB] Installer-by-phone error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── GET SERVICE REQUESTS ───────────────────────────────────────────────────
hbbApp.get('/service-requests', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const status = c.req.query('status');
    const agentPhone = c.req.query('agent_phone');
    const installerId = c.req.query('installer_id');
    const limit = c.req.query('limit');
    const offset = c.req.query('offset');

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
    return c.json({ data: data || [], count: count || 0 });
  } catch (err: any) {
    console.error('[HBB] Jobs query error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── CREATE SERVICE REQUEST ─────────────────────────────────────────────────
hbbApp.post('/service-requests', async (c) => {
  try {
    // Rate limit: 20 creates per minute per IP
    const rl = checkRateLimit(getRateLimitKey(c, 'create-sr'), 20, 60_000);
    if (!rl.allowed) {
      return c.json({ error: 'Rate limit exceeded. Please wait before submitting more leads.', retryAfterMs: rl.retryAfterMs }, 429);
    }

    const rawBody = await c.req.json();
    const body = sanitizeObject(rawBody);
    const supabase = getFrontendSupabase();

    // ── VALIDATION ──────────────────────────────────────────────────────
    const validationErrors = validateServiceRequest(body);
    if (validationErrors.length > 0) {
      console.log('[HBB] Validation errors:', validationErrors);
      return c.json({ error: 'Validation failed', details: validationErrors }, 400);
    }

    // ── NORMALIZE PHONES ────────────────────────────────────────────────
    const normalizedCustomerPhone = normalizeKenyanPhone(body.customer_phone);
    const normalizedAgentPhone = normalizeKenyanPhone(body.agent_phone);

    const insertData = {
      customer_name:  sanitizeString(body.customer_name, 100),
      customer_phone: normalizedCustomerPhone,
      town:           sanitizeString(body.town || body.town_name, 200) || null,
      estate_name:    sanitizeString(body.estate, 200) || '',
      package:        sanitizeString(body.package, 100) || null,
      scheduled_date: body.preferred_date || null,
      scheduled_time: sanitizeString(body.preferred_time, 20) || null,
      agent_name:     sanitizeString(body.agent_name, 100),
      agent_phone:    normalizedAgentPhone,
      remarks:        sanitizeString(body.remarks, 1000) || null,
      source_type:    'agent',
      status:         'pending',
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert([insertData])
      .select('*, installers(name, phone)')
      .single();

    if (error) {
      console.log('[HBB] Create job error:', error.message);
      return c.json({ error: error.message }, 500);
    }

    console.log(`[HBB] Created job: ${data.id} for ${data.customer_name} by agent ${normalizedAgentPhone}`);
    return c.json(data);
  } catch (err: any) {
    console.error('[HBB] Create SR error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── UPDATE JOB STATUS ──────────────────────────────────────────────────────
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
      const lat = Number(body.location.lat);
      const lng = Number(body.location.lng);
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        const accuracy = body.location.accuracy ? Math.round(Number(body.location.accuracy)) : null;
        const locStr = `[GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}${accuracy ? ` \u00b1${accuracy}m` : ''}]`;
        updates.remarks = updates.remarks ? `${updates.remarks}\n${locStr}` : locStr;
        updates.completion_lat = lat;
        updates.completion_lng = lng;
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
    console.error('[HBB] Update job error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DASHBOARD STATS (optimized with count queries) ─────────────────────────
hbbApp.get('/stats', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const agentPhone = c.req.query('agent_phone');

    // Build base filter
    const buildQuery = (status?: string | string[]) => {
      let q = supabase.from('jobs').select('*', { count: 'exact', head: true });
      if (agentPhone) {
        const formats = phoneFormats(agentPhone);
        q = q.in('agent_phone', formats.text);
      }
      if (Array.isArray(status)) q = q.in('status', status);
      else if (status) q = q.eq('status', status);
      return q;
    };

    // Run all count queries in parallel (use Kenya timezone for "today")
    const [openRes, assignedRes, completedRes, failedRes, totalRes, todayRes] = await Promise.all([
      buildQuery(['pending', 'open']),
      buildQuery('assigned'),
      buildQuery('completed'),
      buildQuery('failed'),
      buildQuery(),
      (() => {
        const today = getKenyaToday();
        let q = supabase.from('jobs').select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`);
        if (agentPhone) {
          const formats = phoneFormats(agentPhone);
          q = q.in('agent_phone', formats.text);
        }
        return q;
      })(),
    ]);

    // Check for errors
    const firstError = [openRes, assignedRes, completedRes, failedRes, totalRes, todayRes]
      .find(r => r.error);
    if (firstError?.error) {
      console.log('[HBB] Stats count error:', firstError.error.message);
      return c.json({ error: firstError.error.message }, 500);
    }

    return c.json({
      open: openRes.count || 0,
      assigned: assignedRes.count || 0,
      completed: completedRes.count || 0,
      failed: failedRes.count || 0,
      total: totalRes.count || 0,
      todayInstallations: todayRes.count || 0,
    });
  } catch (err: any) {
    console.error('[HBB] Stats error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── CALENDAR AVAILABILITY ──────────────────────────────────────────────────
hbbApp.get('/availability', async (c) => {
  try {
    const townId = c.req.query('town_id');
    const start = c.req.query('start');
    const end = c.req.query('end');

    if (!townId) return c.json({ error: 'town_id required' }, 400);

    const supabase = getFrontendSupabase();

    const { data: installers } = await supabase
      .from('installers')
      .select('id, max_jobs_per_day')
      .ilike('town', `%${townId}%`)
      .eq('is_available', true);

    const installerList = installers || [];
    const installerIds = installerList.map(i => i.id);

    let bookings: any[] = [];
    if (installerIds.length > 0 && start && end) {
      const { data } = await supabase
        .from('jobs')
        .select('scheduled_date, scheduled_time, installer_id')
        .in('installer_id', installerIds)
        .gte('scheduled_date', start)
        .lte('scheduled_date', end)
        .in('status', ['assigned', 'pending']);

      bookings = data || [];
    }

    return c.json({
      installerCount: installerList.length,
      totalDailyCapacity: installerList.reduce((s, i) => s + i.max_jobs_per_day, 0),
      bookings,
    });
  } catch (err: any) {
    console.error('[HBB] Availability error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── AUTO-ALLOCATE — DEPRECATED ─────────────────────────────────────────────
// As of 2026-04-10 allocation runs client-side via the unified engine in
// hbb-auto-assign.ts (unifiedAutoAssign).  This edge route is kept so that
// any in-flight requests from older clients receive a clear error instead of
// a 404, and so old deployments degrade gracefully.
//
// The client (hbb-api.ts autoAllocateLead) no longer calls this endpoint.
// Safe to delete this block after all clients have updated.
hbbApp.post('/auto-allocate', async (c) => {
  return c.json(
    {
      deprecated: true,
      error:
        'This endpoint is deprecated. Allocation now runs via the unified ' +
        'engine in hbb-auto-assign.ts. Update your client to hbb-api.ts >= 2026-04-10.',
    },
    410 // 410 Gone
  );
});

// ─── AUTO-ALLOCATE SINGLE LEAD (LEGACY — unreachable, kept for reference) ────
hbbApp.post('/auto-allocate-legacy', async (c) => {
  try {
    const { sr_id } = await c.req.json();
    if (!sr_id) return c.json({ error: 'sr_id is required' }, 400);

    const supabase = getFrontendSupabase();

    // 1. Fetch the service request
    const { data: sr, error: srError } = await supabase
      .from('service_request')
      .select('id, town_id, status')
      .eq('id', sr_id)
      .single();

    if (srError || !sr) {
      console.log('[HBB] SR not found:', sr_id, srError?.message);
      return c.json({ error: 'Service request not found', details: srError?.message }, 404);
    }

    if (sr.status !== 'open') {
      return c.json({ allocated: false, message: `SR is already ${sr.status}, not open` });
    }
    if (!sr.town_id) {
      return c.json({ allocated: false, message: 'No town specified on SR' });
    }

    // 2. Find available installers in the same town
    const { data: installers, error: instError } = await supabase
      .from('installers_HBB')
      .select('id, name, phone, max_jobs_per_day')
      .eq('town_id', sr.town_id)
      .eq('status', 'available');

    if (instError) {
      console.log('[HBB] Installer query error:', instError.message);
      return c.json({ error: 'Failed to query installers', details: instError.message }, 500);
    }
    if (!installers || installers.length === 0) {
      return c.json({ allocated: false, message: 'No available installers in this town' });
    }

    // 3. Load-balance: count today's assignments per installer
    const today = getKenyaToday();
    const installerIds = installers.map(i => i.id);

    const { data: todayAssignments } = await supabase
      .from('service_request')
      .select('assigned_installer_id')
      .in('assigned_installer_id', installerIds)
      .in('status', ['assigned', 'completed']) // Count all active assignments, not just assigned
      .gte('assigned_at', `${today}T00:00:00`)
      .lte('assigned_at', `${today}T23:59:59`);

    const assignmentCounts: Record<number, number> = {};
    installerIds.forEach(id => { assignmentCounts[id] = 0; });
    (todayAssignments || []).forEach((a: any) => {
      if (a.assigned_installer_id) {
        assignmentCounts[a.assigned_installer_id] = (assignmentCounts[a.assigned_installer_id] || 0) + 1;
      }
    });

    // 4. Pick installer with fewest assignments who hasn't hit max
    const eligible = installers
      .filter(inst => (assignmentCounts[inst.id] || 0) < inst.max_jobs_per_day)
      .sort((a, b) => (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0));

    if (eligible.length === 0) {
      return c.json({ allocated: false, message: 'All installers at max capacity today' });
    }

    // 5. Try each eligible installer with optimistic lock + post-assignment verification
    for (const chosen of eligible) {
      // Optimistic lock: only update if still 'open'
      const { error: updateError, count: updateCount } = await supabase
        .from('service_request')
        .update({
          status: 'assigned',
          assigned_installer_id: chosen.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', sr_id)
        .eq('status', 'open');

      if (updateError) {
        console.log('[HBB] Assignment update error for installer', chosen.id, ':', updateError.message);
        continue; // Try next installer
      }

      // 6. POST-ASSIGNMENT VERIFICATION: Re-count to protect against race conditions
      const { count: postCount } = await supabase
        .from('service_request')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_installer_id', chosen.id)
        .in('status', ['assigned', 'completed'])
        .gte('assigned_at', `${today}T00:00:00`)
        .lte('assigned_at', `${today}T23:59:59`);

      if ((postCount || 0) > chosen.max_jobs_per_day) {
        // Race condition detected! Rollback this assignment
        console.log(`[HBB] Race condition: installer ${chosen.id} over max (${postCount}/${chosen.max_jobs_per_day}). Rolling back SR ${sr_id}.`);
        await supabase
          .from('service_request')
          .update({ status: 'open', assigned_installer_id: null, assigned_at: null })
          .eq('id', sr_id)
          .eq('assigned_installer_id', chosen.id);
        continue; // Try next installer
      }

      console.log(`[HBB] SR ${sr_id} allocated to installer ${chosen.name} (${chosen.id}), jobs today: ${postCount}/${chosen.max_jobs_per_day}`);
      return c.json({
        allocated: true,
        installer_id: chosen.id,
        installer_name: chosen.name,
        installer_phone: chosen.phone,
        jobs_today: postCount || 0,
        max_jobs: chosen.max_jobs_per_day,
      });
    }

    // All eligible installers failed (race conditions on all of them)
    return c.json({ allocated: false, message: 'All installers at capacity after verification' });

  } catch (err: any) {
    console.error('[HBB] Auto-allocate error:', err);
    return c.json({ error: 'Internal error during auto-allocation', details: err.message }, 500);
  }
});

// ─── AUTO-ALLOCATE-ALL — DEPRECATED ──────────────────────────────────────────
hbbApp.post('/auto-allocate-all', async (c) => {
  return c.json(
    {
      deprecated: true,
      error:
        'This endpoint is deprecated. Use autoAllocateAllOpen() from hbb-api.ts ' +
        'which calls the unified engine (hbb-auto-assign.ts bulkAutoAssign).',
    },
    410
  );
});

// ─── AUTO-ALLOCATE ALL OPEN LEADS (LEGACY — unreachable, kept for reference) ─
hbbApp.post('/auto-allocate-all-legacy', async (c) => {
  try {
    // Rate limit: 5 bulk allocations per minute
    const rl = checkRateLimit(getRateLimitKey(c, 'bulk-allocate'), 5, 60_000);
    if (!rl.allowed) {
      return c.json({ error: 'Rate limit exceeded', retryAfterMs: rl.retryAfterMs }, 429);
    }

    const supabase = getFrontendSupabase();

    const { data: openSRs, error: srError } = await supabase
      .from('service_request')
      .select('id, town_id')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(200); // Hard cap

    if (srError) return c.json({ error: 'Failed to fetch open SRs', details: srError.message }, 500);
    if (!openSRs || openSRs.length === 0) {
      return c.json({ allocated: 0, failed: 0, message: 'No open leads to allocate' });
    }

    const { data: allInstallers } = await supabase
      .from('installers_HBB')
      .select('id, name, phone, town_id, max_jobs_per_day')
      .eq('status', 'available');

    const today = getKenyaToday();
    const { data: todayAssignments } = await supabase
      .from('service_request')
      .select('assigned_installer_id')
      .in('status', ['assigned', 'completed'])
      .gte('assigned_at', `${today}T00:00:00`)
      .lte('assigned_at', `${today}T23:59:59`);

    const assignmentCounts: Record<number, number> = {};
    (allInstallers || []).forEach(i => { assignmentCounts[i.id] = 0; });
    (todayAssignments || []).forEach((a: any) => {
      if (a.assigned_installer_id) {
        assignmentCounts[a.assigned_installer_id] = (assignmentCounts[a.assigned_installer_id] || 0) + 1;
      }
    });

    let allocated = 0, failed = 0;
    const results: any[] = [];

    for (const sr of openSRs) {
      if (!sr.town_id) {
        failed++;
        results.push({ sr_id: sr.id, success: false, reason: 'No town' });
        continue;
      }

      const townInstallers = (allInstallers || [])
        .filter(i => i.town_id === sr.town_id && (assignmentCounts[i.id] || 0) < i.max_jobs_per_day)
        .sort((a, b) => (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0));

      if (townInstallers.length === 0) {
        failed++;
        results.push({ sr_id: sr.id, success: false, reason: 'No available installer' });
        continue;
      }

      const chosen = townInstallers[0];
      const { error: updateError } = await supabase
        .from('service_request')
        .update({
          status: 'assigned',
          assigned_installer_id: chosen.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', sr.id)
        .eq('status', 'open');

      if (updateError) {
        failed++;
        results.push({ sr_id: sr.id, success: false, reason: updateError.message });
      } else {
        assignmentCounts[chosen.id] = (assignmentCounts[chosen.id] || 0) + 1;
        allocated++;
        results.push({ sr_id: sr.id, success: true, installer: chosen.name });
      }
    }

    console.log(`[HBB] Bulk allocate: ${allocated} assigned, ${failed} failed out of ${openSRs.length}`);
    return c.json({ allocated, failed, total: openSRs.length, results });

  } catch (err: any) {
    console.error('[HBB] Bulk auto-allocate error:', err);
    return c.json({ error: 'Internal error during bulk allocation', details: err.message }, 500);
  }
});

// ─── BULK CREATE SERVICE REQUESTS ───────────────────────────────────────────
hbbApp.post('/service-requests/bulk', async (c) => {
  try {
    // Rate limit: 5 bulk imports per 5 minutes
    const rl = checkRateLimit(getRateLimitKey(c, 'bulk-create'), 5, 300_000);
    if (!rl.allowed) {
      return c.json({ error: 'Rate limit exceeded for bulk imports', retryAfterMs: rl.retryAfterMs }, 429);
    }

    const { leads } = await c.req.json();
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return c.json({ error: 'leads array is required' }, 400);
    }

    if (leads.length > 100) {
      return c.json({ error: 'Maximum 100 leads per batch' }, 400);
    }

    const supabase = getFrontendSupabase();

    // Validate and sanitize each lead
    const insertData = leads.map((lead: any) => ({
      customer_name:  sanitizeString(lead.customer_name, 100),
      customer_phone: normalizeKenyanPhone(lead.customer_phone || ''),
      town:           sanitizeString(lead.town || lead.town_name, 200) || null,
      estate:         sanitizeString(lead.estate, 200) || null,
      package:        sanitizeString(lead.package, 100) || null,
      preferred_date: lead.preferred_date || null,
      preferred_time: sanitizeString(lead.preferred_time, 20) || null,
      agent_name:     sanitizeString(lead.agent_name, 100),
      agent_phone:    normalizeKenyanPhone(lead.agent_phone || ''),
      remarks:        sanitizeString(lead.remarks, 1000) || null,
    }));

    // Map to jobs schema (strip old service_request columns, add jobs columns)
    const jobsInsertData = insertData.map(({ sr_number, town_id, estate, preferred_date, preferred_time, ...rest }: any) => ({
      ...rest,
      town: rest.town || null,
      estate_name: estate || '',
      scheduled_date: preferred_date || null,
      scheduled_time: preferred_time || null,
      source_type: 'agent',
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('jobs')
      .insert(jobsInsertData)
      .select('id, town');

    if (error) {
      console.log('[HBB] Bulk insert error:', error.message);
      return c.json({ error: error.message }, 500);
    }

    return await handleBulkAllocation(supabase, data || [], jobsInsertData);

  } catch (err: any) {
    console.error('[HBB] Bulk import error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// Helper for bulk allocation after insert
async function handleBulkAllocation(supabase: any, data: any[], insertData: any[]) {
  const created = data?.length || 0;
  let allocated = 0;
  let failed = 0;

  if (data && data.length > 0) {
    const { data: allInstallers } = await supabase
      .from('installers')
      .select('id, name, phone, town, max_jobs_per_day')
      .eq('is_available', true);

    const today = getKenyaToday();
    const { data: todayAssignments } = await supabase
      .from('jobs')
      .select('installer_id')
      .in('status', ['assigned', 'completed'])
      .gte('assigned_at', `${today}T00:00:00`)
      .lte('assigned_at', `${today}T23:59:59`);

    const assignmentCounts: Record<number, number> = {};
    (allInstallers || []).forEach(i => { assignmentCounts[i.id] = 0; });
    (todayAssignments || []).forEach((a: any) => {
      if (a.installer_id) {
        assignmentCounts[a.installer_id] = (assignmentCounts[a.installer_id] || 0) + 1;
      }
    });

    for (const job of data) {
      if (!job.town) { failed++; continue; }

      const townInstallers = (allInstallers || [])
        .filter(i => i.town?.toLowerCase() === job.town?.toLowerCase() && (assignmentCounts[i.id] || 0) < i.max_jobs_per_day)
        .sort((a, b) => (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0));

      if (townInstallers.length === 0) { failed++; continue; }

      const chosen = townInstallers[0];
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'assigned',
          installer_id: chosen.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .eq('status', 'pending');

      if (updateError) {
        failed++;
      } else {
        assignmentCounts[chosen.id] = (assignmentCounts[chosen.id] || 0) + 1;
        allocated++;
      }
    }
  }

  console.log(`[HBB] Bulk import: ${created} created, ${allocated} allocated, ${failed} allocation failures`);
  return new Response(JSON.stringify({ created, allocated, failed }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── NOTIFICATIONS (with persistent read state) ────────────────────────────
hbbApp.get('/notifications', async (c) => {
  try {
    const phone = c.req.query('phone');
    const role = c.req.query('role');
    if (!phone) return c.json({ error: 'phone is required' }, 400);

    const supabase = getFrontendSupabase();
    const normalizedPhone = normalizeKenyanPhone(phone);

    // Get last-read timestamp from KV store (make-server Supabase)
    const makeSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    let lastReadAt = '1970-01-01T00:00:00Z';
    try {
      const { data: kvData } = await makeSupabase
        .from('kv_store_28f2f653')
        .select('value')
        .eq('key', `hbb_notif_read:${normalizedPhone}`)
        .single();
      if (kvData?.value) {
        lastReadAt = kvData.value;
      }
    } catch { /* KV read failed — treat all as unread */ }

    // Get recent SRs relevant to this user (last 48 hours)
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('jobs')
      .select('id, sr_number, customer_name, status, assigned_at, completed_at, created_at, agent_phone, installer_id, installers(name, phone)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (role === 'agent') {
      const formats = phoneFormats(phone);
      query = query.in('agent_phone', formats.text);
    } else if (role === 'installer') {
      const formats = phoneFormats(phone);
      const { data: inst } = await supabase
        .from('installers')
        .select('id')
        .in('phone', formats.text)
        .limit(1);

      if (inst && inst.length > 0) {
        query = query.eq('installer_id', inst[0].id);
      } else {
        return c.json([]);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.log('[HBB] Notifications query error:', error.message);
      return c.json({ error: error.message }, 500);
    }

    // Transform SRs into notification objects with read state
    const notifications = (data || []).map((sr: any) => {
      let type = 'new_lead';
      let title = 'New Lead Created';
      let message = `${sr.customer_name} \u2014 ${sr.sr_number ? `#${sr.sr_number}` : sr.id?.slice?.(0, 8) || 'N/A'}`;
      let timestamp = sr.created_at;

      if (sr.status === 'assigned' && sr.assigned_at) {
        type = 'allocated';
        title = 'Lead Assigned';
        const installerName = (sr as any).installers?.name || 'an installer';
        message = `Job ${sr.id?.slice?.(0, 8) || sr.sr_number || ''} assigned to ${installerName}`;
        timestamp = sr.assigned_at;
      } else if (sr.status === 'completed') {
        type = 'status_change';
        title = 'Installation Complete';
        message = `${sr.id?.slice?.(0, 8) || sr.sr_number || 'Job'} \u2014 ${sr.customer_name} completed`;
        timestamp = sr.completed_at || sr.created_at;
      } else if (sr.status === 'failed') {
        type = 'status_change';
        title = 'Installation Failed';
        message = `${sr.id?.slice?.(0, 8) || sr.sr_number || 'Job'} \u2014 ${sr.customer_name} marked as failed`;
        timestamp = sr.created_at;
      } else if (sr.status === 'rescheduled') {
        type = 'status_change';
        title = 'Lead Rescheduled';
        message = `${sr.id?.slice?.(0, 8) || sr.sr_number || 'Job'} \u2014 ${sr.customer_name} rescheduled`;
        timestamp = sr.created_at;
      }

      return {
        id: `job-${sr.id}-${sr.status}`,
        type,
        title,
        message,
        timestamp,
        read: timestamp <= lastReadAt,
        job_id: sr.id,
      };
    });

    return c.json(notifications);
  } catch (err: any) {
    console.error('[HBB] Notifications error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── HBB GA: Go-live - persist daily rows and update monthly aggregates ───
hbbApp.post('/hbb-ga-go-live', async (c) => {
  try {
    const { batch_id } = await c.req.json();
    if (!batch_id) return c.json({ success: false, error: 'batch_id required' }, 400);

    const supabase = getFrontendSupabase();

    // Fetch installer and DSE rows that were created/attached to this batch
    const [{ data: installers, error: instErr }, { data: dses, error: dseErr }] = await Promise.all([
      supabase.from('hbb_installer_ga_monthly').select('*').eq('report_batch_id', batch_id).limit(5000),
      supabase.from('hbb_dse_ga_monthly').select('*').eq('report_batch_id', batch_id).limit(5000),
    ]);

    if (instErr || dseErr) {
      console.error('[HBB GA] Fetch batch rows error', instErr || dseErr);
      return c.json({ success: false, error: (instErr || dseErr).message || 'failed to fetch batch rows' }, 500);
    }

    const installerDailyInserts: any[] = [];
    for (const r of (installers || [])) {
      // derive a date for the row: prefer explicit upload_date, fallback to created_at, else use first day of month_year
      let dateStr = r.upload_date || r.created_at || null;
      let gaDate: string | null = null;
      if (dateStr) {
        gaDate = (new Date(dateStr)).toISOString().slice(0, 10);
      } else if (r.month_year) {
        // month_year e.g. '2026-04' -> use first day
        gaDate = `${r.month_year}-01`;
      }
      if (!gaDate) gaDate = (new Date()).toISOString().slice(0,10);

      installerDailyInserts.push({
        installer_msisdn: r.installer_msisdn,
        installer_name: r.installer_name,
        town: r.town || null,
        ga_date: gaDate,
        ga_count: r.ga_count || 0,
        report_batch_id: batch_id,
      });
    }

    const dseDailyInserts: any[] = [];
    for (const r of (dses || [])) {
      let dateStr = r.upload_date || r.created_at || null;
      let gaDate: string | null = null;
      if (dateStr) gaDate = (new Date(dateStr)).toISOString().slice(0,10);
      else if (r.month_year) gaDate = `${r.month_year}-01`;
      if (!gaDate) gaDate = (new Date()).toISOString().slice(0,10);

      dseDailyInserts.push({
        dse_msisdn: r.dse_msisdn,
        dse_name: r.dse_name,
        town: r.town || null,
        ga_date: gaDate,
        ga_count: r.ga_count || 0,
        report_batch_id: batch_id,
      });
    }

    // Insert daily rows in batches
    if (installerDailyInserts.length > 0) {
      const { error: insErr } = await supabase.from('hbb_installer_ga_daily').insert(installerDailyInserts);
      if (insErr) console.error('[HBB GA] Insert installer daily error', insErr);
    }
    if (dseDailyInserts.length > 0) {
      const { error: insDseErr } = await supabase.from('hbb_dse_ga_daily').insert(dseDailyInserts);
      if (insDseErr) console.error('[HBB GA] Insert dse daily error', insDseErr);
    }

    // Recompute monthly aggregates from daily table for the affected month(s)
    // Installer aggregates
    const { data: aggInstaller, error: aggInstErr } = await supabase.rpc('recompute_hbb_installer_monthly_from_daily', { batch_uuid: batch_id });
    if (aggInstErr) console.error('[HBB GA] Recompute installer monthly error', aggInstErr);

    // DSE aggregates
    const { data: aggDse, error: aggDseErr } = await supabase.rpc('recompute_hbb_dse_monthly_from_daily', { batch_uuid: batch_id });
    if (aggDseErr) console.error('[HBB GA] Recompute dse monthly error', aggDseErr);

    // Mark batch as live
    await supabase.from('hbb_ga_upload_batches').update({ status: 'live', went_live_at: new Date().toISOString() }).eq('id', batch_id);

    return c.json({ success: true, installer_rows: installers?.length || 0, dse_rows: dses?.length || 0 });
  } catch (err: any) {
    console.error('[HBB GA] go-live error', err);
    return c.json({ success: false, error: err?.message || String(err) }, 500);
  }
});

hbbApp.post('/notifications/read', async (c) => {
  try {
    const { phone } = await c.req.json();
    if (!phone) return c.json({ error: 'phone required' }, 400);

    const normalizedPhone = normalizeKenyanPhone(phone);
    const now = new Date().toISOString();

    // Persist last-read timestamp to KV store
    const makeSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await makeSupabase
      .from('kv_store_28f2f653')
      .upsert({
        key: `hbb_notif_read:${normalizedPhone}`,
        value: now,
      }, { onConflict: 'key' });

    return c.json({ ok: true, last_read_at: now });
  } catch (err: any) {
    console.error('[HBB] Mark read error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── ANALYTICS (optimized) ──────────────────────────────────────────────────
hbbApp.get('/analytics', async (c) => {
  try {
    const period = c.req.query('period') || '30d';
    const agentPhone = c.req.query('agent_phone');
    const supabase = getFrontendSupabase();

    // Calculate date filter
    let since: string | undefined;
    const now = new Date();
    if (period === '7d') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (period === '30d') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let query = supabase
      .from('jobs')
      .select('id, status, created_at, assigned_at, completed_at, town, package, agent_phone')
      .limit(5000); // Hard cap for analytics

    if (since) query = query.gte('created_at', since);
    if (agentPhone) {
      const formats = phoneFormats(agentPhone);
      query = query.in('agent_phone', formats.text);
    }

    const { data, error } = await query;
    if (error) {
      console.log('[HBB] Analytics query error:', error.message);
      return c.json({ error: error.message }, 500);
    }

    const rows = data || [];
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    rows.forEach(r => {
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    });

    const totalLeads = rows.length;
    const completedCount = statusBreakdown.completed || 0;
    const conversionRate = totalLeads > 0 ? Math.round((completedCount / totalLeads) * 100) : 0;

    const todayLeads = rows.filter(r => r.created_at?.startsWith(today)).length;
    const thisWeekLeads = rows.filter(r => r.created_at >= weekAgo).length;

    // Weekly trend
    const dayMap: Record<string, { total: number; completed: number }> = {};
    const trendDays = period === '7d' ? 7 : period === '30d' ? 30 : 60;
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = { total: 0, completed: 0 };
    }
    rows.forEach(r => {
      const day = r.created_at?.split('T')[0];
      if (day && dayMap[day]) {
        dayMap[day].total++;
        if (r.status === 'completed') dayMap[day].completed++;
      }
    });

    const weeklyTrend = Object.entries(dayMap).map(([date, counts]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
      total: counts.total,
      completed: counts.completed,
    }));

    // Top towns
    const townCounts: Record<string, number> = {};
    rows.forEach(r => {
      const name = (r as any).town || 'Unknown';
      townCounts[name] = (townCounts[name] || 0) + 1;
    });
    const topTowns = Object.entries(townCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top packages
    const pkgCounts: Record<string, number> = {};
    rows.forEach(r => {
      if (r.package) {
        const name = r.package.replace('HBB ', '');
        pkgCounts[name] = (pkgCounts[name] || 0) + 1;
      }
    });
    const topPackages = Object.entries(pkgCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Average times
    let totalAssignTime = 0, assignCount = 0;
    let totalCompleteTime = 0, completeCount = 0;

    rows.forEach(r => {
      if (r.assigned_at && r.created_at) {
        const diff = new Date(r.assigned_at).getTime() - new Date(r.created_at).getTime();
        if (diff > 0 && diff < 30 * 24 * 60 * 60 * 1000) { // Sanity check: < 30 days
          totalAssignTime += diff;
          assignCount++;
        }
      }
      if (r.completed_at && r.created_at) {
        const diff = new Date(r.completed_at).getTime() - new Date(r.created_at).getTime();
        if (diff > 0 && diff < 90 * 24 * 60 * 60 * 1000) { // Sanity check: < 90 days
          totalCompleteTime += diff;
          completeCount++;
        }
      }
    });

    const avgTimeToAssign = assignCount > 0 ? Math.round(totalAssignTime / assignCount / 60000) : 0;
    const avgTimeToComplete = completeCount > 0 ? Math.round(totalCompleteTime / completeCount / 3600000) : 0;

    return c.json({
      statusBreakdown,
      weeklyTrend,
      conversionRate,
      avgTimeToAssign,
      avgTimeToComplete,
      totalLeads,
      todayLeads,
      thisWeekLeads,
      topTowns,
      topPackages,
    });

  } catch (err: any) {
    console.error('[HBB] Analytics error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── LOGIN (HBB user lookup) ────────────────────────────────────────────────
hbbApp.post('/login', async (c) => {
  try {
    const rawBody = await c.req.json();
    const phone = rawBody?.phone;
    const pin = rawBody?.pin;
    if (!phone || !pin) return c.json({ error: 'phone and pin required' }, 400);

    // Rate limit: 10 login attempts per minute per IP
    const rl = checkRateLimit(getRateLimitKey(c, 'login'), 10, 60_000);
    if (!rl.allowed) {
      return c.json({ error: 'Too many login attempts. Please wait.', retryAfterMs: rl.retryAfterMs }, 429);
    }

    const supabase = getFrontendSupabase();
    const formats = phoneFormats(phone);

    // 1. Check agents_HBB first
    // agents_HBB columns: "Agent Name" (text), "Agent Mobile Number" (bigint), "Agent Type" (text), pin (text)
    console.log('[HBB] Agent login: checking numeric formats:', formats.numeric);

    const { data: agents, error: agentErr } = await supabase
      .from('agents_HBB')
      .select('*')
      .in('Agent Mobile Number', formats.numeric)
      .limit(1);

    if (agentErr) {
      console.log('[HBB] Agent login query error:', agentErr.message);
    }

    if (agents && agents.length > 0) {
      const agent = agents[0];
      const storedPin = agent.pin || '1234';
      if (pin !== storedPin) {
        return c.json({ error: 'Invalid PIN' }, 401);
      }
      const agentName = agent['Agent Name'] || 'HBB Agent';
      const rawPhone = String(agent['Agent Mobile Number'] || '');
      const agentPhone = normalizeKenyanPhone(rawPhone); // Canonical format
      const agentType = agent['Agent Type'] || 'agent';

      // Create session token
      const sessionToken = createSession(agentPhone, 'hbb_agent');

      console.log(`[HBB] Agent login successful: ${agentName} (phone: ${agentPhone})`);
      return c.json({
        id: agentPhone,
        full_name: agentName,
        phone_number: agentPhone,
        role: 'hbb_agent',
        agent_type: agentType,
        source_table: 'agents_HBB',
        session_token: sessionToken,
      });
    }

    // 2. Check unified installers table
    const { data: installers, error: instErr } = await supabase
      .from('installers')
      .select('id, name, phone, pin, town, status, max_jobs_per_day')
      .in('phone', formats.text)
      .limit(1);

    if (instErr) {
      console.log('[HBB] Installer login query error:', instErr.message);
    }

    if (installers && installers.length > 0) {
      const installer = installers[0];
      const storedPin = installer.pin || '1234';
      if (pin !== storedPin) {
        return c.json({ error: 'Invalid PIN' }, 401);
      }

      const installerPhone = normalizeKenyanPhone(installer.phone);
      const sessionToken = createSession(installerPhone, 'hbb_installer');

      console.log(`[HBB] Installer login successful: ${installer.name} (ID: ${installer.id})`);
      return c.json({
        id: installer.id,
        full_name: installer.name,
        phone_number: installerPhone,
        role: 'hbb_installer',
        town: installer.town,
        status: installer.status,
        max_jobs_per_day: installer.max_jobs_per_day,
        source_table: 'installers',
        session_token: sessionToken,
      });
    }

    // 3. Check HBB_HQ_TEAM
    const { data: hqUsers, error: hqErr } = await supabase
      .from('HBB_HQ_TEAM')
      .select('*')
      .eq('phone', formats.text[0])
      .eq('is_active', true)
      .limit(1);

    if (hqErr) console.log('[HBB] HQ login query error:', hqErr.message);

    if (hqUsers && hqUsers.length > 0) {
      const hqUser = hqUsers[0];
      if (pin !== (hqUser.pin || '1234')) {
        return c.json({ error: 'Invalid PIN' }, 401);
      }
      const sessionToken = createSession(hqUser.phone, 'hbb_hq');
      console.log(`[HBB] HQ login: ${hqUser.name}`);
      return c.json({
        id: hqUser.id,
        full_name: hqUser.name,
        phone_number: hqUser.phone,
        role: hqUser.role || 'hbb_hq',
        source_table: 'HBB_HQ_TEAM',
        session_token: sessionToken,
      });
    }

    // 4. Not found in any table
    console.log(`[HBB] Login failed: phone ${phone} not found`);
    return c.json({ error: 'Phone number not found. Are you an HBB agent or installer?' }, 401);
  } catch (err: any) {
    console.error('[HBB] Login error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── CHANGE PIN ─────────────────────────────────────────────────────────────
hbbApp.post('/change-pin', async (c) => {
  try {
    const { phone, current_pin, new_pin, role } = await c.req.json();
    if (!phone || !current_pin || !new_pin) {
      return c.json({ error: 'phone, current_pin, and new_pin are required' }, 400);
    }

    // Validate new PIN
    if (!/^\d{4,6}$/.test(new_pin)) {
      return c.json({ error: 'PIN must be 4-6 digits' }, 400);
    }

    if (current_pin === new_pin) {
      return c.json({ error: 'New PIN must be different from current PIN' }, 400);
    }

    const supabase = getFrontendSupabase();
    const formats = phoneFormats(phone);

    if (role === 'hbb_agent') {
      // Verify current PIN
      const { data: agents } = await supabase
        .from('agents_HBB')
        .select('*')
        .in('Agent Mobile Number', formats.numeric)
        .limit(1);

      if (!agents || agents.length === 0) {
        return c.json({ error: 'Agent not found' }, 404);
      }

      const agent = agents[0];
      if ((agent.pin || '1234') !== current_pin) {
        return c.json({ error: 'Current PIN is incorrect' }, 401);
      }

      // Update PIN — agents_HBB has no id column, use Agent Mobile Number
      const { error } = await supabase
        .from('agents_HBB')
        .update({ pin: new_pin })
        .eq('Agent Mobile Number', agent['Agent Mobile Number']);

      if (error) {
        console.log('[HBB] Agent PIN update error:', error.message);
        return c.json({ error: error.message }, 500);
      }

      console.log(`[HBB] Agent PIN changed: ${agent['Agent Name']}`);
      return c.json({ success: true, message: 'PIN changed successfully' });

    } else if (role === 'hbb_installer') {
      const { data: installers } = await supabase
        .from('installers')
        .select('id, name, pin')
        .in('phone', formats.text)
        .limit(1);

      if (!installers || installers.length === 0) {
        return c.json({ error: 'Installer not found' }, 404);
      }

      const installer = installers[0];
      if ((installer.pin || '1234') !== current_pin) {
        return c.json({ error: 'Current PIN is incorrect' }, 401);
      }

      const { error } = await supabase
        .from('installers')
        .update({ pin: new_pin })
        .eq('id', installer.id);

      if (error) {
        console.log('[HBB] Installer PIN update error:', error.message);
        return c.json({ error: error.message }, 500);
      }

      console.log(`[HBB] Installer PIN changed: ${installer.name}`);
      return c.json({ success: true, message: 'PIN changed successfully' });

    } else {
      return c.json({ error: 'Invalid role. Must be hbb_agent or hbb_installer' }, 400);
    }
  } catch (err: any) {
    console.error('[HBB] Change PIN error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── SEED TEST DATA ─────────────────────────────────────────────────────────
hbbApp.post('/seed', async (c) => {
  try {
    const supabase = getFrontendSupabase();
    const results: string[] = [];

    const { data: towns, error: townErr } = await supabase
      .from('towns_HBB')
      .select('id, name')
      .order('name');

    if (townErr) {
      console.log('[HBB Seed] Towns query error:', townErr.message);
      return c.json({ error: `Failed to query towns: ${townErr.message}` }, 500);
    }

    if (!towns || towns.length === 0) {
      const townNames = [
        'Nairobi', 'Mombasa', 'Kisumu', 'Eldoret', 'Nakuru',
        'Thika', 'Nyeri', 'Machakos', 'Nanyuki', 'Malindi',
        'Kitale', 'Kakamega', 'Naivasha', 'Meru'
      ];
      const townInserts = townNames.map((name) => ({
        name,
        code: name.toUpperCase().slice(0, 3),
      }));

      const { data: newTowns, error: insertTownErr } = await supabase
        .from('towns_HBB')
        .insert(townInserts)
        .select('id, name');

      if (insertTownErr) {
        results.push(`Could not seed towns: ${insertTownErr.message}`);
      } else {
        results.push(`Created ${newTowns?.length || 0} towns`);
      }
    } else {
      results.push(`${towns.length} towns already exist`);
    }

    const { data: allTowns } = await supabase
      .from('towns_HBB')
      .select('id, name');

    const nairobiTown = (allTowns || []).find(t => t.name.toLowerCase() === 'nairobi');

    if (!nairobiTown) {
      results.push('Nairobi town not found');
      return c.json({ results, success: false });
    }

    // Installer
    const installerFormats = phoneFormats('0700100200');
    const { data: existingInstaller } = await supabase
      .from('installers_HBB')
      .select('id, name, phone, town_id')
      .in('phone', installerFormats.text)
      .limit(1);

    let installerId: number | null = null;
    if (existingInstaller && existingInstaller.length > 0) {
      installerId = existingInstaller[0].id;
      results.push(`Installer already exists: ${existingInstaller[0].name} (ID: ${installerId})`);
    } else {
      const { data: newInstaller, error: instErr } = await supabase
        .from('installers_HBB')
        .insert([{
          name: 'HBB Test Installer',
          phone: '0700100200',
          town_id: nairobiTown.id,
          status: 'available',
          max_jobs_per_day: 5,
          pin: '1234',
        }])
        .select('id, name')
        .single();

      if (instErr) {
        results.push(`Could not create installer: ${instErr.message}`);
      } else {
        installerId = newInstaller?.id;
        results.push(`Created installer: ${newInstaller?.name} (ID: ${installerId})`);
      }
    }

    // Agent
    const agentNumericFormats = phoneFormats('0700100100').numeric;
    const { data: existingAgent } = await supabase
      .from('agents_HBB')
      .select('*')
      .in('Agent Mobile Number', agentNumericFormats)
      .limit(1);

    if (existingAgent && existingAgent.length > 0) {
      results.push(`Agent already exists: ${existingAgent[0]['Agent Name']}`);
    } else {
      const { error: agentErr } = await supabase
        .from('agents_HBB')
        .insert([{
          'Agent Name': 'HBB Test Agent',
          'Agent Mobile Number': 700100100,
          'Agent Type': 'HBB',
          pin: '1234',
        }]);

      if (agentErr) {
        results.push(`Could not create agent: ${agentErr.message}`);
      } else {
        results.push(`Created agent: HBB Test Agent`);
      }
    }

    results.push(`Nairobi town_id: ${nairobiTown.id}`);
    console.log('[HBB Seed] Results:', results.join('\n'));
    return c.json({ results, success: true, nairobi_town_id: nairobiTown.id, installer_id: installerId });

  } catch (err: any) {
    console.error('[HBB Seed] Error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ─── DEBUG / HEALTH CHECK ───────────────────────────────────────────────────
hbbApp.get('/debug', async (c) => {
  try {
    const supabase = getFrontendSupabase();

    const [townsRes, installersRes, agentsRes, srRes] = await Promise.all([
      supabase.from('towns_HBB').select('id, name').order('name'),
      supabase.from('installers_HBB').select('id, name, phone, town_id, status, max_jobs_per_day').order('name'),
      supabase.from('agents_HBB').select('*'),
      supabase.from('service_request').select('id, sr_number, status, customer_name, town_id, assigned_installer_id, agent_phone, created_at').order('created_at', { ascending: false }).limit(20),
    ]);

    const normalizedAgents = (agentsRes.data || []).map((a: any) => ({
      name: a['Agent Name'],
      phone: normalizeKenyanPhone(a['Agent Mobile Number']),
      type: a['Agent Type'],
      pin: a.pin ? '****' : 'NOT SET',
    }));

    return c.json({
      towns: { count: townsRes.data?.length || 0, data: townsRes.data, error: townsRes.error?.message },
      installers: { count: installersRes.data?.length || 0, data: installersRes.data, error: installersRes.error?.message },
      agents: { count: normalizedAgents.length, data: normalizedAgents, error: agentsRes.error?.message },
      service_requests: { count: srRes.data?.length || 0, data: srRes.data, error: srRes.error?.message },
    });
  } catch (err: any) {
    console.error('[HBB Debug] Error:', err);
    return c.json({ error: err.message }, 500);
  }
});

export default hbbApp;