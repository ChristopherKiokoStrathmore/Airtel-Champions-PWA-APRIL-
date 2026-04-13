// Session-Based Check-In Routes
// Handles day-long check-in sessions for programs with session_checkin_enabled = true
// Sessions are stored in the make-server KV store (no external table needed)
// Key pattern: cs:{programId}:{userId}:{YYYY-MM-DD} → session object

import { Hono } from 'npm:hono';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Frontend Supabase client — for submissions and user points only
const FRONTEND_SUPABASE_URL = Deno.env.get('FRONTEND_SUPABASE_URL')?.startsWith('https://')
  ? Deno.env.get('FRONTEND_SUPABASE_URL')!
  : 'https://xspogpfohjmkykfjadhk.supabase.co';
const FRONTEND_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';
const frontendSupabase = createClient(FRONTEND_SUPABASE_URL, FRONTEND_ANON_KEY);

console.log('[CheckIn] Session Check-In routes initialized (KV-backed)');

// ============================================
// HELPERS
// ============================================

function getUserId(c: any): string | null {
  return c.req.header('X-User-Id') || null;
}

// Get today's date string in EAT (UTC+3) → "YYYY-MM-DD"
function getTodayDateEAT(): string {
  const now = new Date();
  const eatOffset = 3 * 60 * 60 * 1000;
  const eatNow = new Date(now.getTime() + eatOffset);
  return eatNow.toISOString().split('T')[0];
}

// Check if it's after 6 PM EAT (PRODUCTION: >= 18 | set to >= 0 for testing)
function isAfter6PMEAT(): boolean {
  const now = new Date();
  const eatOffset = 3 * 60 * 60 * 1000;
  const eatNow = new Date(now.getTime() + eatOffset);
  return eatNow.getUTCHours() >= 18;
}

// Build the KV key for a session
function sessionKey(programId: string, userId: string, dateStr: string): string {
  return `cs:${programId}:${userId}:${dateStr}`;
}

// Generate a simple UUID-like ID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper: extract all promoters from sites (per-site promoter model)
function getAllPromotersFromSites(sites: any[]): any[] {
  const all: any[] = [];
  for (const site of sites || []) {
    for (const p of site.promoters || []) {
      all.push({ ...p, _site_id: site.id, _site_name: site.name });
    }
  }
  return all;
}

// Helper: count total promoters across all sites
function countPromoters(sites: any[]): number {
  return (sites || []).reduce((sum: number, s: any) => sum + (s.promoters?.length || 0), 0);
}

// Helper: calculate total GAs across all sites (site-level ga_actual)
function calcTotalGAs(sites: any[]): number {
  let total = 0;
  for (const site of sites || []) {
    total += (site.ga_actual || 0);
  }
  return total;
}

// Helper: extract promoters/MSISDNs and site info from a regular form submission's responses
// Used when check-in is a normal form (not session-based) and no KV session exists
async function extractPromotersFromSubmission(
  programId: string,
  responses: Record<string, any>
): Promise<{ promoters: { id: string; msisdn: string; site_name?: string }[]; sites: { id: string; name: string }[]; odometer_reading: number | null }> {
  const result = { promoters: [] as any[], sites: [] as any[], odometer_reading: null as number | null };

  try {
    // Fetch the program field definitions to know which fields contain MSISDNs and sites
    const { data: fieldDefs, error: fieldError } = await frontendSupabase
      .from('program_fields')
      .select('id, field_name, field_label, field_type, options')
      .eq('program_id', programId)
      .order('order_index', { ascending: true });

    if (fieldError || !fieldDefs) {
      console.error('[CheckIn] Error fetching program fields for extraction:', fieldError);
      return result;
    }

    console.log(`[CheckIn] EXTRACT: Found ${fieldDefs.length} field definitions for program=${programId}`);

    let siteName: string | null = null;

    // First pass: find site name from dropdown fields sourced from sitewise
    for (const field of fieldDefs) {
      if (field.field_type === 'dropdown' && field.options?.database_source?.table === 'sitewise') {
        const val = responses[field.id];
        if (val && typeof val === 'string') {
          siteName = val;
          result.sites.push({ id: field.id, name: val });
          console.log(`[CheckIn] EXTRACT: Found site \"${val}\" from field \"${field.field_label}\"`);
        }
      }
    }

    // Extract odometer reading from number fields named 'odometer' or similar
    for (const field of fieldDefs) {
      if (field.field_type === 'number') {
        const fieldNameLower = (field.field_name || '').toLowerCase();
        const fieldLabelLower = (field.field_label || '').toLowerCase();
        if (fieldNameLower.includes('odometer') || fieldLabelLower.includes('odometer')) {
          const val = responses[field.id];
          if (val !== undefined && val !== null && val !== '') {
            result.odometer_reading = Number(val);
            console.log(`[CheckIn] EXTRACT: Found odometer reading ${result.odometer_reading} from field \"${field.field_label}\"`);
          }
        }
      }
    }

    // Second pass: find MSISDNs from repeatable_number fields
    for (const field of fieldDefs) {
      if (field.field_type === 'repeatable_number') {
        const val = responses[field.id];
        if (Array.isArray(val)) {
          const msisdnArray = val
            .filter((v: any) => v !== '' && v !== null && v !== undefined)
            .map((msisdn: any, index: number) => ({
              id: `sub-${field.id}-${index}`,
              msisdn: String(msisdn),
              site_name: siteName || undefined,
            }));
          result.promoters.push(...msisdnArray);
          console.log(`[CheckIn] EXTRACT: Found ${msisdnArray.length} MSISDNs from field \"${field.field_label}\"`);
        }
      }
    }

    // Also check _session_type submissions that store data in nested structure
    if (responses._session_type === 'session_checkin' && responses.sites) {
      const allPromoters = getAllPromotersFromSites(responses.sites || []);
      if (allPromoters.length > 0) {
        result.promoters = allPromoters.map((p: any) => ({
          id: p.id,
          msisdn: p.msisdn,
          site_name: p._site_name,
        }));
        result.sites = (responses.sites || []).map((s: any) => ({
          id: s.id,
          name: s.name,
        }));
      }
    }
    
    // 🔥 FIX: Also check for _linked_msisdns from checkout form submissions
    // This is stored when a checkout form auto-populates MSISDNs from check-in
    if (responses._linked_checkout && Array.isArray(responses._linked_msisdns) && responses._linked_msisdns.length > 0) {
      console.log(`[CheckIn] EXTRACT: Found ${responses._linked_msisdns.length} MSISDNs in _linked_msisdns field`);
      const linkedMsisdns = responses._linked_msisdns.map((m: any, index: number) => ({
        id: m.id || `linked-${index}`,
        msisdn: String(m.msisdn),
        site_name: m.site_name || undefined,
      }));
      // Merge with existing promoters (avoid duplicates)
      const existingMsisdns = new Set(result.promoters.map((p: any) => p.msisdn));
      for (const m of linkedMsisdns) {
        if (!existingMsisdns.has(m.msisdn)) {
          result.promoters.push(m);
          existingMsisdns.add(m.msisdn);
        }
      }
    }
  } catch (err: any) {
    console.error('[CheckIn] Error extracting promoters from submission:', err);
  }

  return result;
}

// ============================================
// ROUTE 1: GET /programs/:id/checkin/open
// Returns the current open session, or creates one if none exists.
// Also lazily auto-closes stale sessions from previous days.
// ============================================

app.get('/programs/:id/checkin/open', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  const programId = c.req.param('id');
  const todayStr = getTodayDateEAT();
  console.log(`[CheckIn] GET open session for program=${programId}, user=${userId}, date=${todayStr}`);

  try {
    // 1. Auto-close stale sessions from previous days
    // Fetch all sessions for this program+user via prefix
    const userSessionPrefix = `cs:${programId}:${userId}:`;
    const allUserSessions = await kv.getByPrefix(userSessionPrefix);

    for (const entry of allUserSessions || []) {
      const session = entry.value;
      // Extract the date from key: cs:{progId}:{userId}:{date}
      const keyParts = entry.key.split(':');
      const sessionDate = keyParts[keyParts.length - 1];

      if (session && session.status === 'open' && sessionDate !== todayStr) {
        console.log(`[CheckIn] Auto-closing stale session from ${sessionDate}: ${session.id}`);
        session.status = 'closed';
        session.closed_at = new Date().toISOString();
        await kv.set(entry.key, session);
      }
    }

    // 2. Look for today's session
    const todayKey = sessionKey(programId, userId, todayStr);
    const kvResult = await kv.get(todayKey);
    const existingSession = kvResult?.value;

    if (existingSession) {
      if (existingSession.status === 'closed') {
        console.log(`[CheckIn] Found today's closed session: ${existingSession.id}`);
        return c.json({
          success: true,
          session: existingSession,
          is_new: false,
          is_after_6pm: isAfter6PMEAT(),
          already_closed: true,
        });
      }

      console.log(`[CheckIn] Found existing open session: ${existingSession.id}`);
      return c.json({
        success: true,
        session: existingSession,
        is_new: false,
        is_after_6pm: isAfter6PMEAT(),
      });
    }

    // 3. No session today — create a new one
    const newSession = {
      id: generateId(),
      program_id: programId,
      user_id: userId,
      status: 'open',
      opened_at: new Date().toISOString(),
      closed_at: null,
      sites: [],          // Each site has its own promoters[] array
      total_gas: 0,
      created_at: new Date().toISOString(),
    };

    console.log(`[CheckIn] Creating new session: ${newSession.id}`);
    await kv.set(todayKey, newSession);

    return c.json({
      success: true,
      session: newSession,
      is_new: true,
      is_after_6pm: isAfter6PMEAT(),
    });
  } catch (err: any) {
    console.error('[CheckIn] Unexpected error in GET open:', err);
    return c.json({ success: false, error: `Unexpected error: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 2: POST /programs/:id/checkin/save
// Auto-save sites, promoters, and GA data to the open session.
// Called on every add/remove action from the frontend.
// ============================================

app.post('/programs/:id/checkin/save', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  const programId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { session_id, sites, total_gas, comments, save_and_continue, number_plate } = body;

    if (!session_id) {
      return c.json({ success: false, error: 'session_id is required' }, 400);
    }

    console.log(`[CheckIn] SAVE session=${session_id}: ${(sites || []).length} sites, total_gas=${total_gas || 0}, comments=${comments ? 'yes' : 'no'}, number_plate=${number_plate || 'none'}, save_and_continue=${!!save_and_continue}`);

    // Find the session — scan by prefix for this program+user
    const userSessionPrefix = `cs:${programId}:${userId}:`;
    const allUserSessions = await kv.getByPrefix(userSessionPrefix);

    let foundKey: string | null = null;
    let foundSession: any = null;

    for (const entry of allUserSessions || []) {
      if (entry.value && entry.value.id === session_id) {
        foundKey = entry.key;
        foundSession = entry.value;
        break;
      }
    }

    if (!foundKey || !foundSession) {
      console.error('[CheckIn] Session not found:', session_id);
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    if (foundSession.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized — session belongs to another user' }, 403);
    }

    if (foundSession.status !== 'open') {
      return c.json({ success: false, error: 'Session is already closed' }, 400);
    }

    // Update the session in KV
    foundSession.sites = sites || [];
    foundSession.total_gas = total_gas || 0;
    if (comments !== undefined) foundSession.comments = comments;
    if (number_plate !== undefined) foundSession.number_plate = number_plate;

    // ============================================
    // INCREMENTAL SUBMISSION on "Save & Continue Later"
    // Only create a submission when the agent explicitly clicks
    // "Save & Continue Later" (not on every auto-save).
    // Track submitted_site_ids / submitted_promoter_ids in the session
    // to avoid double entries across multiple saves.
    // ============================================
    let submissionId: string | null = null;

    if (save_and_continue) {
      const previousSiteIds: string[] = foundSession.submitted_site_ids || [];

      const allSites: any[] = foundSession.sites || [];

      // Compute delta — only items NOT yet submitted
      const newSites = allSites.filter((s: any) => !previousSiteIds.includes(s.id));

      const hasNewData = newSites.length > 0;

      if (hasNewData) {
        try {
          console.log(`[CheckIn] Creating incremental submission: ${newSites.length} new sites`);

          const { data: submission, error: subError } = await frontendSupabase
            .from('submissions')
            .insert({
              program_id: programId,
              user_id: userId,
              responses: {
                _session_id: session_id,
                _session_type: 'session_checkin',
                _save_type: 'save_and_continue',
                _save_number: (foundSession.save_count || 0) + 1,
                _opened_at: foundSession.opened_at,
                _saved_at: new Date().toISOString(),
                _number_plate: foundSession.number_plate || null,
                sites: newSites,
                total_gas: foundSession.total_gas,
                sites_count: newSites.length,
                cumulative_sites_count: allSites.length,
              },
              status: 'in_progress',
              points_awarded: 0,
            })
            .select()
            .single();

          if (subError) {
            console.error('[CheckIn] Error creating incremental submission:', subError);
          } else {
            submissionId = submission.id;
            console.log(`[CheckIn] Incremental submission created: ${submission.id}`);

            // Update tracking arrays — mark these items as submitted
            foundSession.submitted_site_ids = [
              ...previousSiteIds,
              ...newSites.map((s: any) => s.id),
            ];
            foundSession.save_count = (foundSession.save_count || 0) + 1;
            foundSession.last_submission_id = submissionId;
          }
        } catch (subErr: any) {
          console.error('[CheckIn] Error creating incremental submission:', subErr);
        }
      } else {
        console.log('[CheckIn] No new data since last submission — skipping incremental submission');
      }
    }

    await kv.set(foundKey, foundSession);

    console.log(`[CheckIn] Session saved successfully`);
    return c.json({ success: true, session: foundSession, submission_id: submissionId });
  } catch (err: any) {
    console.error('[CheckIn] Unexpected error in SAVE:', err);
    return c.json({ success: false, error: `Unexpected error: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 3: POST /programs/:id/checkin/close
// Close the session — only allowed after 6 PM EAT.
// Saves final GA data and marks session as closed.
// Also creates a submission record so it appears in reports.
// ============================================

app.post('/programs/:id/checkin/close', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  const programId = c.req.param('id');

  try {
    const body = await c.req.json();
    const { session_id, sites, total_gas, comments, number_plate } = body;

    if (!session_id) {
      return c.json({ success: false, error: 'session_id is required' }, 400);
    }

    console.log(`[CheckIn] CLOSE session=${session_id}: total_gas=${total_gas || 0}, number_plate=${number_plate || 'none'}`);

    // Find the session
    const userSessionPrefix = `cs:${programId}:${userId}:`;
    const allUserSessions = await kv.getByPrefix(userSessionPrefix);

    let foundKey: string | null = null;
    let foundSession: any = null;

    for (const entry of allUserSessions || []) {
      if (entry.value && entry.value.id === session_id) {
        foundKey = entry.key;
        foundSession = entry.value;
        break;
      }
    }

    if (!foundKey || !foundSession) {
      return c.json({ success: false, error: 'Session not found' }, 404);
    }

    if (foundSession.user_id !== userId) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    if (foundSession.status === 'closed') {
      return c.json({ success: false, error: 'Session already closed', session: foundSession }, 400);
    }

    // Close the session
    const now = new Date().toISOString();
    const finalSites = sites || foundSession.sites || [];
    const finalGAs = total_gas ?? foundSession.total_gas ?? 0;

    foundSession.status = 'closed';
    foundSession.closed_at = now;
    foundSession.sites = finalSites;
    foundSession.total_gas = finalGAs;
    if (comments !== undefined) foundSession.comments = comments;

    await kv.set(foundKey, foundSession);

    // Create a FINAL submission record for reporting (on frontend Supabase)
    // Only include items NOT already submitted via "Save & Continue Later"
    // to prevent double entries in reports.
    let submissionId: string | null = null;
    try {
      const previousSiteIds: string[] = foundSession.submitted_site_ids || [];

      // Compute remaining (unsubmitted) items
      const remainingSites = finalSites.filter((s: any) => !previousSiteIds.includes(s.id));

      const hadPreviousSaves = (foundSession.save_count || 0) > 0;

      console.log(`[CheckIn] Close submission: ${remainingSites.length} remaining sites (${previousSiteIds.length} sites already submitted in ${foundSession.save_count || 0} saves)`);

      // Always create a close submission — either with remaining delta or as a final summary marker
      const { data: submission, error: subError } = await frontendSupabase
        .from('submissions')
        .insert({
          program_id: programId,
          user_id: userId,
          responses: {
            _session_id: session_id,
            _session_type: 'session_checkin',
            _save_type: 'close',
            _save_number: (foundSession.save_count || 0) + 1,
            _opened_at: foundSession.opened_at,
            _closed_at: now,
            // Include number plate for van-lookup cross-reference
            _number_plate: foundSession.number_plate || null,
            // Only include unsubmitted items to prevent double entries
            sites: remainingSites,
            total_gas: finalGAs,
            sites_count: remainingSites.length,
            // Include cumulative totals for reference
            cumulative_sites_count: finalSites.length,
            _previous_saves: foundSession.save_count || 0,
            _previously_submitted_sites: previousSiteIds.length,
          },
          status: 'submitted',
          points_awarded: 0,
        })
        .select()
        .single();

      if (subError) {
        console.error('[CheckIn] Error creating submission record:', subError);
      } else {
        submissionId = submission.id;
        console.log(`[CheckIn] Final close submission created: ${submission.id} (${remainingSites.length} new sites)`);
      }

      // Also update any previous in_progress submissions to 'submitted' status
      if (hadPreviousSaves) {
        try {
          const { error: updateError } = await frontendSupabase
            .from('submissions')
            .update({ status: 'submitted' })
            .eq('user_id', userId)
            .eq('program_id', programId)
            .eq('status', 'in_progress');

          if (updateError) {
            console.error('[CheckIn] Error updating in_progress submissions:', updateError);
          } else {
            console.log('[CheckIn] Updated previous in_progress submissions to submitted');
          }
        } catch (updateErr) {
          console.error('[CheckIn] Error updating previous submissions:', updateErr);
        }
      }
    } catch (subErr) {
      console.error('[CheckIn] Error creating submission:', subErr);
    }

    // Award points if program has points enabled
    try {
      const { data: program } = await frontendSupabase
        .from('programs')
        .select('points_value, points_enabled')
        .eq('id', programId)
        .single();

      if (program && program.points_enabled !== false && program.points_value > 0) {
        const pointsToAward = program.points_value;

        // Update submission with points
        if (submissionId) {
          await frontendSupabase
            .from('submissions')
            .update({ points_awarded: pointsToAward })
            .eq('id', submissionId);
        }

        // Update user points
        const { data: userData } = await frontendSupabase
          .from('app_users')
          .select('total_points')
          .eq('id', userId)
          .single();

        if (userData) {
          const newTotal = (userData.total_points || 0) + pointsToAward;
          await frontendSupabase
            .from('app_users')
            .update({ total_points: newTotal })
            .eq('id', userId);
          console.log(`[CheckIn] Awarded ${pointsToAward} points. New total: ${newTotal}`);
        }
      }
    } catch (pointsErr) {
      console.error('[CheckIn] Error awarding points:', pointsErr);
    }

    console.log(`[CheckIn] Session closed successfully`);
    return c.json({
      success: true,
      session: foundSession,
      submission_id: submissionId,
    });
  } catch (err: any) {
    console.error('[CheckIn] Unexpected error in CLOSE:', err);
    return c.json({ success: false, error: `Unexpected error: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 4: GET /programs/:id/checkin/sessions
// List all sessions for a program (for HQ/Director reporting)
// ============================================

app.get('/programs/:id/checkin/sessions', async (c) => {
  const programId = c.req.param('id');
  const statusFilter = c.req.query('status'); // optional: 'open' or 'closed'
  const limit = parseInt(c.req.query('limit') || '100');

  console.log(`[CheckIn] LIST sessions for program=${programId}, status=${statusFilter || 'all'}, limit=${limit}`);

  try {
    // Fetch all sessions for this program (across all users)
    const programPrefix = `cs:${programId}:`;
    const allEntries = await kv.getByPrefix(programPrefix);

    let sessions = (allEntries || [])
      .map((entry: any) => entry.value)
      .filter((s: any) => s && s.id);

    // Filter by status if requested
    if (statusFilter) {
      sessions = sessions.filter((s: any) => s.status === statusFilter);
    }

    // Sort by opened_at descending
    sessions.sort((a: any, b: any) =>
      new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
    );

    // Apply limit
    sessions = sessions.slice(0, limit);

    return c.json({ success: true, sessions, count: sessions.length });
  } catch (err: any) {
    console.error('[CheckIn] Unexpected error in LIST:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// ROUTE 5: GET /checkin/flags
// Returns all program IDs that have session_checkin_enabled=true
// Also returns full program form configs
// Stored in the make-server KV store (no DB column needed)
// ============================================

app.get('/checkin/flags', async (c) => {
  console.log('[CheckIn] GET all session checkin flags');
  try {
    const entries = await kv.getByPrefix('session_checkin_flag:');
    const flags: Record<string, boolean> = {};
    for (const entry of entries || []) {
      // Key format: session_checkin_flag:{programId}
      const programId = entry.key.replace('session_checkin_flag:', '');
      // Backward compat: value can be boolean (legacy) or config object (new)
      if (typeof entry.value === 'boolean') {
        flags[programId] = entry.value;
      } else if (entry.value && typeof entry.value === 'object') {
        flags[programId] = entry.value.session_checkin_enabled !== false;
      } else {
        flags[programId] = false;
      }
    }
    console.log(`[CheckIn] Returning ${Object.keys(flags).length} checkin flags`);
    return c.json({ success: true, flags });
  } catch (err: any) {
    console.error('[CheckIn] Error fetching checkin flags:', err);
    return c.json({ success: true, flags: {} }); // Return empty on error, don't break the app
  }
});

// ============================================
// ROUTE 6: POST /checkin/flag/:id
// Set or clear the session_checkin_enabled flag for a program
// Body: { enabled: boolean }
// ============================================

app.post('/checkin/flag/:id', async (c) => {
  const programId = c.req.param('id');
  try {
    const body = await c.req.json();
    const enabled = !!body.enabled;
    console.log(`[CheckIn] SET checkin flag for program=${programId}: ${enabled}`);

    // Read existing config, preserve sub-features
    const existingRaw = await kv.get(`session_checkin_flag:${programId}`);
    const existing = existingRaw?.value;
    if (existing && typeof existing === 'object') {
      existing.session_checkin_enabled = enabled;
      await kv.set(`session_checkin_flag:${programId}`, existing);
    } else {
      await kv.set(`session_checkin_flag:${programId}`, enabled);
    }

    console.log(`[CheckIn] ✅ Flag saved successfully`);
    return c.json({ success: true, program_id: programId, session_checkin_enabled: enabled });
  } catch (err: any) {
    console.error('[CheckIn] Error setting checkin flag:', err);
    return c.json({ success: false, error: `Failed to set flag: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 7: GET /checkin/config/:id
// Get the full form config for a specific program
// ============================================

app.get('/checkin/config/:id', async (c) => {
  const programId = c.req.param('id');
  console.log(`[CheckIn] GET form config for program=${programId}`);
  try {
    const result = await kv.get(`session_checkin_flag:${programId}`);
    const raw = result?.value;

    // Default config — all features ON
    const defaultConfig = {
      session_checkin_enabled: false,
      site_selection_enabled: true,
      msisdn_collection_enabled: true,
      ga_target_enabled: true,
      ga_actual_enabled: true,
      time_gate_enabled: true,
      time_gate_hour: 18,
      gps_capture_enabled: true,
      content_lock_after_gate: true,
    };

    let config;
    if (!raw) {
      config = defaultConfig;
    } else if (typeof raw === 'boolean') {
      // Legacy: boolean flag → convert to full config
      config = { ...defaultConfig, session_checkin_enabled: raw };
    } else if (typeof raw === 'object') {
      config = { ...defaultConfig, ...raw };
    } else {
      config = defaultConfig;
    }

    return c.json({ success: true, program_id: programId, config });
  } catch (err: any) {
    console.error('[CheckIn] Error fetching form config:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// ROUTE 8: POST /checkin/config/:id
// Save the full form config for a program
// Body: { config: ProgramFormConfig }
// ============================================

app.post('/checkin/config/:id', async (c) => {
  const programId = c.req.param('id');
  try {
    const body = await c.req.json();
    const config = body.config;

    if (!config || typeof config !== 'object') {
      return c.json({ success: false, error: 'config object is required' }, 400);
    }

    console.log(`[CheckIn] SAVE form config for program=${programId}:`, JSON.stringify(config));
    await kv.set(`session_checkin_flag:${programId}`, config);

    console.log(`[CheckIn] ✅ Form config saved`);
    return c.json({ success: true, program_id: programId, config });
  } catch (err: any) {
    console.error('[CheckIn] Error saving form config:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ============================================
// ROUTE 9: GET /checkin/configs
// Get all program form configs (for HQ settings overview)
// ============================================

app.get('/checkin/configs', async (c) => {
  console.log('[CheckIn] GET all program form configs');
  try {
    const entries = await kv.getByPrefix('session_checkin_flag:');
    const configs: Record<string, any> = {};

    const defaultConfig = {
      session_checkin_enabled: false,
      site_selection_enabled: true,
      msisdn_collection_enabled: true,
      ga_target_enabled: true,
      ga_actual_enabled: true,
      time_gate_enabled: true,
      time_gate_hour: 18,
      gps_capture_enabled: true,
      content_lock_after_gate: true,
    };

    for (const entry of entries || []) {
      const programId = entry.key.replace('session_checkin_flag:', '');
      if (typeof entry.value === 'boolean') {
        configs[programId] = { ...defaultConfig, session_checkin_enabled: entry.value };
      } else if (entry.value && typeof entry.value === 'object') {
        configs[programId] = { ...defaultConfig, ...entry.value };
      }
    }

    console.log(`[CheckIn] Returning ${Object.keys(configs).length} form configs`);
    return c.json({ success: true, configs });
  } catch (err: any) {
    console.error('[CheckIn] Error fetching form configs:', err);
    return c.json({ success: true, configs: {} });
  }
});

// ============================================
// ROUTE 10: GET /programs/:id/checkin/linked-data
// Fetch today's check-in session data from a linked check-in program.
// Used by checkout programs to auto-populate MSISDNs from the check-in.
// Query param: ?linked_program_id=xxx
// ============================================

app.get('/programs/:id/checkin/linked-data', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  const checkoutProgramId = c.req.param('id');
  const linkedProgramId = c.req.query('linked_program_id');

  if (!linkedProgramId) {
    return c.json({ success: false, error: 'linked_program_id query param is required' }, 400);
  }

  console.log(`[CheckIn] GET linked data for checkout=${checkoutProgramId}, checkin=${linkedProgramId}, user=${userId}`);

  try {
    const todayStr = getTodayDateEAT();

    // Look for today's check-in session on the linked program
    const todayKey = sessionKey(linkedProgramId, userId, todayStr);
    const kvResult = await kv.get(todayKey);
    const checkinSession = kvResult?.value;

    if (!checkinSession) {
      console.log(`[CheckIn] No check-in session found for today (${todayStr})`);
      return c.json({
        success: true,
        has_checkin: false,
        sites: [],
        promoters: [],
        message: 'No check-in session found for today. You can still add MSISDNs manually.',
      });
    }

    console.log(`[CheckIn] Found check-in session: ${checkinSession.id}, status=${checkinSession.status}, sites=${(checkinSession.sites || []).length}`);

    // Extract all promoters across all sites with site context
    const allPromoters = getAllPromotersFromSites(checkinSession.sites || []);

    return c.json({
      success: true,
      has_checkin: true,
      checkin_session_id: checkinSession.id,
      checkin_status: checkinSession.status,
      checkin_opened_at: checkinSession.opened_at,
      sites: (checkinSession.sites || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        ga_target: s.ga_target || 0,
        promoters: (s.promoters || []).map((p: any) => ({
          id: p.id,
          msisdn: p.msisdn,
        })),
      })),
      promoters: allPromoters.map((p: any) => ({
        id: p.id,
        msisdn: p.msisdn,
        site_name: p._site_name,
      })),
      total_promoters: allPromoters.length,
    });
  } catch (err: any) {
    console.error('[CheckIn] Error fetching linked data:', err);
    return c.json({ success: false, error: `Error fetching linked check-in data: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 11: GET /programs/:id/checkin/van-lookup
// Check if a specific van (number plate) was checked in today.
// Searches today's submissions for the linked check-in program
// that contain the given number plate in their responses.
// Also searches check-in sessions and KV van registry.
// Query params: ?number_plate=XXX&linked_program_id=YYY
// ============================================

app.get('/programs/:id/checkin/van-lookup', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  const checkoutProgramId = c.req.param('id');
  const rawPlate = c.req.query('number_plate')?.trim();
  const linkedProgramId = c.req.query('linked_program_id');

  if (!rawPlate) {
    return c.json({ success: false, error: 'number_plate query param is required' }, 400);
  }
  if (!linkedProgramId) {
    return c.json({ success: false, error: 'linked_program_id query param is required' }, 400);
  }

  // Normalize plate to uppercase to match van-register storage format
  const numberPlate = rawPlate.toUpperCase().replace(/\s+/g, '');

  console.log(`[CheckIn] VAN LOOKUP: plate="${numberPlate}" (raw="${rawPlate}"), checkout=${checkoutProgramId}, checkin=${linkedProgramId}`);

  const todayStr = getTodayDateEAT();

  try {
    // PRIMARY STRATEGY: Search ALL today's submissions for this number plate
    // This works for BOTH session-based and form-based check-ins
    console.log(`[CheckIn] VAN LOOKUP: Searching ALL submissions for plate=\"${numberPlate}\" in program=${linkedProgramId}`);
    const todayStart = `${todayStr}T00:00:00`;
    const todayEnd = `${todayStr}T23:59:59`;

    const { data: allSubmissions, error: subError } = await frontendSupabase
      .from('submissions')
      .select('id, user_id, responses, created_at')
      .eq('program_id', linkedProgramId)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .order('created_at', { ascending: false })
      .limit(100);

    if (subError) {
      console.error(`[CheckIn] VAN LOOKUP: Error searching submissions:`, subError);
      return c.json({ success: false, error: `Database error: ${subError.message}` }, 500);
    }

    console.log(`[CheckIn] VAN LOOKUP: Found ${allSubmissions?.length || 0} total check-in submissions today`);
    // Filter submissions that contain this number plate
    const plateNormalized = numberPlate.toUpperCase().replace(/\s+/g, '');
    const matchingSubmissions = (allSubmissions || []).filter(sub => {
      const responsesStr = JSON.stringify(sub.responses || {}).toUpperCase().replace(/\s+/g, '');
      return responsesStr.includes(plateNormalized);
    });

    console.log(`[CheckIn] VAN LOOKUP: Found ${matchingSubmissions.length} submissions containing plate=\"${numberPlate}\"`);
    if (matchingSubmissions.length > 0) {
      // Extract MSISDNs from ALL matching submissions (handles incremental saves)
      const allExtracted = { promoters: [] as any[], sites: [] as any[], odometer_reading: null as number | null };
      const seenMSISDNs = new Set<string>();
      const submittingUserId = matchingSubmissions[0].user_id; // Track who submitted
      
      for (const sub of matchingSubmissions) {
        console.log(`[CheckIn] VAN LOOKUP: Extracting from submission ${sub.id} by user ${sub.user_id}, response keys: ${Object.keys(sub.responses || {}).join(', ')}`);
        const extracted = await extractPromotersFromSubmission(linkedProgramId, sub.responses || {});
        console.log(`[CheckIn] VAN LOOKUP: Extracted ${extracted.promoters.length} promoters, ${extracted.sites.length} sites from submission ${sub.id}`);
        
        for (const p of extracted.promoters) {
          if (!seenMSISDNs.has(p.msisdn)) {
            seenMSISDNs.add(p.msisdn);
            allExtracted.promoters.push(p);
          }
        }
        if (allExtracted.sites.length === 0 && extracted.sites.length > 0) {
          allExtracted.sites = extracted.sites;
        }
        if (allExtracted.odometer_reading === null && extracted.odometer_reading !== null) {
          allExtracted.odometer_reading = extracted.odometer_reading;
        }
      }
      
      console.log(`[CheckIn] VAN LOOKUP: FINAL RESULT - ${allExtracted.promoters.length} MSISDNs, ${allExtracted.sites.length} sites, odometer=${allExtracted.odometer_reading}`);
      
      if (allExtracted.promoters.length > 0) {
        // Register in KV for faster future lookups
        const vanRegKey = `van_ci:${linkedProgramId}:${numberPlate}:${todayStr}`;
        await kv.set(vanRegKey, {
          user_id: submittingUserId,
          submission_id: matchingSubmissions[0].id,
          registered_at: new Date().toISOString(),
          source: 'submission_search',
        });
        
        return c.json({
          success: true,
          has_checkin: true,
          van_checked_in: true,
          number_plate: numberPlate,
          checkin_user_id: submittingUserId,
          sites: allExtracted.sites,
          promoters: allExtracted.promoters,
          total_promoters: allExtracted.promoters.length,
          morning_odometer: allExtracted.odometer_reading,
          message: `Van checked in. ${allExtracted.promoters.length} MSISDNs loaded from check-in submissions.`,
        });
      } else {
        console.log(`[CheckIn] VAN LOOKUP: Found van submissions but extracted 0 promoters - check field configuration`);
        return c.json({
          success: true,
          has_checkin: true,
          van_checked_in: true,
          number_plate: numberPlate,
          checkin_user_id: submittingUserId,
          sites: allExtracted.sites,
          promoters: [],
          total_promoters: 0,
          morning_odometer: allExtracted.odometer_reading,
          message: 'Van was checked in but no promoter MSISDNs found in the check-in form.',
        });
      }
    }

    // FALLBACK STRATEGY: Check KV van registry and sessions (for session-based check-ins only)
    console.log(`[CheckIn] VAN LOOKUP: No submissions found with plate - checking KV registry`);
    const vanRegKey = `van_ci:${linkedProgramId}:${numberPlate}:${todayStr}`;
    const vanReg = await kv.get(vanRegKey);
    if (vanReg?.value) {
      console.log(`[CheckIn] VAN LOOKUP: Found in KV registry for plate="${numberPlate}"`);
      const regData = vanReg.value;

      // Fetch the associated check-in session for MSISDNs
      const sessionUserId = regData.user_id || userId;
      const sessKey = sessionKey(linkedProgramId, sessionUserId, todayStr);
      const sessResult = await kv.get(sessKey);
      const checkinSession = sessResult?.value;

      if (checkinSession) {
        const allPromoters = getAllPromotersFromSites(checkinSession.sites || []);
        return c.json({
          success: true,
          has_checkin: true,
          van_checked_in: true,
          number_plate: numberPlate,
          checkin_user_id: sessionUserId,
          checkin_session_id: checkinSession.id,
          checkin_status: checkinSession.status,
          checkin_opened_at: checkinSession.opened_at,
          sites: (checkinSession.sites || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            ga_target: s.ga_target || 0,
            promoters: (s.promoters || []).map((p: any) => ({
              id: p.id,
              msisdn: p.msisdn,
            })),
          })),
          promoters: allPromoters.map((p: any) => ({
            id: p.id,
            msisdn: p.msisdn,
            site_name: p._site_name,
          })),
          total_promoters: allPromoters.length,
        });
      }

      // KV registry exists but no session found — try extracting from submissions
      console.log(`[CheckIn] VAN LOOKUP: KV registry found but no session — extracting from submissions`);
      
      // Try to find the submission and extract MSISDNs from its responses
      // IMPORTANT: Search ALL users, not just the registered user, because van ownership can change
      const todayStart2 = `${todayStr}T00:00:00`;
      const todayEnd2 = `${todayStr}T23:59:59`;
      
      // First try: submissions by the registered user
      let { data: regSubs } = await frontendSupabase
        .from('submissions')
        .select('id, user_id, responses, created_at')
        .eq('program_id', linkedProgramId)
        .eq('user_id', sessionUserId)
        .gte('created_at', todayStart2)
        .lte('created_at', todayEnd2)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log(`[CheckIn] VAN LOOKUP: Found ${regSubs?.length || 0} submissions for registered user ${sessionUserId} on program ${linkedProgramId} today`);
      if (regSubs && regSubs.length > 0) {
        console.log(`[CheckIn] VAN LOOKUP: First submission ID: ${regSubs[0].id}, response keys: ${Object.keys(regSubs[0].responses || {}).join(', ')}`);
      }

      // If no submissions found for registered user, search ALL users for this van plate
      if (!regSubs || regSubs.length === 0) {
        console.log(`[CheckIn] VAN LOOKUP: No submissions for registered user — searching ALL users for plate="${numberPlate}"`);
        const { data: allSubs } = await frontendSupabase
          .from('submissions')
          .select('id, user_id, responses, created_at')
          .eq('program_id', linkedProgramId)
          .gte('created_at', todayStart2)
          .lte('created_at', todayEnd2)
          .order('created_at', { ascending: false })
          .limit(50);
        
        // Filter submissions that contain this number plate
        if (allSubs && allSubs.length > 0) {
          const plateNormalized = numberPlate.toUpperCase().replace(/\s+/g, '');
          regSubs = allSubs.filter(sub => {
            const responsesStr = JSON.stringify(sub.responses || {}).toUpperCase().replace(/\s+/g, '');
            return responsesStr.includes(plateNormalized);
          });
          console.log(`[CheckIn] VAN LOOKUP: Found ${regSubs.length} submissions containing plate="${numberPlate}" from ${allSubs.length} total submissions`);
        }
      }

      if (regSubs && regSubs.length > 0) {
        // Aggregate MSISDNs from ALL today's submissions (handles incremental saves)
        const allExtracted = { promoters: [] as any[], sites: [] as any[], odometer_reading: null as number | null };
        const seenMSISDNs = new Set<string>();
        
        for (const regSub of regSubs) {
          console.log(`[CheckIn] VAN LOOKUP: Extracting from submission ${regSub.id}, response keys: ${Object.keys(regSub.responses || {}).join(', ')}`);
          const extracted = await extractPromotersFromSubmission(linkedProgramId, regSub.responses || {});
          console.log(`[CheckIn] VAN LOOKUP: Extracted ${extracted.promoters.length} promoters, ${extracted.sites.length} sites from submission ${regSub.id}`);
          for (const p of extracted.promoters) {
            if (!seenMSISDNs.has(p.msisdn)) {
              seenMSISDNs.add(p.msisdn);
              allExtracted.promoters.push(p);
            }
          }
          if (allExtracted.sites.length === 0 && extracted.sites.length > 0) {
            allExtracted.sites = extracted.sites;
          }
          if (allExtracted.odometer_reading === null && extracted.odometer_reading !== null) {
            allExtracted.odometer_reading = extracted.odometer_reading;
          }
        }
        
        if (allExtracted.promoters.length > 0 || allExtracted.odometer_reading !== null) {
          console.log(`[CheckIn] VAN LOOKUP: Extracted ${allExtracted.promoters.length} MSISDNs, odometer=${allExtracted.odometer_reading} from ${regSubs.length} submissions`);
          return c.json({
            success: true,
            has_checkin: true,
            van_checked_in: true,
            number_plate: numberPlate,
            checkin_user_id: sessionUserId,
            sites: allExtracted.sites,
            promoters: allExtracted.promoters,
            total_promoters: allExtracted.promoters.length,
            morning_odometer: allExtracted.odometer_reading,
            message: `Van checked in. ${allExtracted.promoters.length} MSISDNs loaded from check-in submissions.`,
          });
        }
      }
      
      return c.json({
        success: true,
        has_checkin: true,
        van_checked_in: true,
        number_plate: numberPlate,
        checkin_user_id: sessionUserId,
        sites: [],
        promoters: [],
        total_promoters: 0,
        message: 'Van was checked in but no active session data found.',
      });
    }

    // Strategy 2: Search today's submissions for the linked check-in program
    // Look for submissions where responses contain the number plate
    console.log(`[CheckIn] VAN LOOKUP: Searching submissions for plate="${numberPlate}" in program=${linkedProgramId}`);

    const todayStart = `${todayStr}T00:00:00`;
    const todayEnd = `${todayStr}T23:59:59`;

    const { data: submissions, error: subError } = await frontendSupabase
      .from('submissions')
      .select('id, user_id, responses, created_at')
      .eq('program_id', linkedProgramId)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
      .order('created_at', { ascending: false })
      .limit(50);

    if (subError) {
      console.error(`[CheckIn] VAN LOOKUP: Error searching submissions:`, subError);
    }

    if (submissions && submissions.length > 0) {
      // Search through submissions for the number plate in any response field
      const plateNormalized = numberPlate.toUpperCase().replace(/\s+/g, '');

      for (const sub of submissions) {
        const responsesStr = JSON.stringify(sub.responses || {}).toUpperCase().replace(/\s+/g, '');
        if (responsesStr.includes(plateNormalized)) {
          console.log(`[CheckIn] VAN LOOKUP: Found plate="${numberPlate}" in submission ${sub.id} by user ${sub.user_id}`);

          // Found! Now fetch that user's check-in session for MSISDNs
          const sessKey = sessionKey(linkedProgramId, sub.user_id, todayStr);
          const sessResult = await kv.get(sessKey);
          const checkinSession = sessResult?.value;

          // Register in KV for faster future lookups
          await kv.set(vanRegKey, {
            user_id: sub.user_id,
            submission_id: sub.id,
            registered_at: new Date().toISOString(),
            source: 'submission_search',
          });

          if (checkinSession) {
            const allPromoters = getAllPromotersFromSites(checkinSession.sites || []);
            return c.json({
              success: true,
              has_checkin: true,
              van_checked_in: true,
              number_plate: numberPlate,
              checkin_user_id: sub.user_id,
              checkin_session_id: checkinSession.id,
              checkin_status: checkinSession.status,
              checkin_opened_at: checkinSession.opened_at,
              sites: (checkinSession.sites || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                ga_target: s.ga_target || 0,
                promoters: (s.promoters || []).map((p: any) => ({
                  id: p.id,
                  msisdn: p.msisdn,
                })),
              })),
              promoters: allPromoters.map((p: any) => ({
                id: p.id,
                msisdn: p.msisdn,
                site_name: p._site_name,
              })),
              total_promoters: allPromoters.length,
            });
          }

          // Submission found but no KV session — extract MSISDNs directly from submission responses
          console.log(`[CheckIn] VAN LOOKUP: No KV session — extracting MSISDNs from submission responses`);
          
          // Aggregate MSISDNs from ALL matching submissions for this user today
          const matchingSubs = submissions.filter(s => s.user_id === sub.user_id);
          const allExtracted2 = { promoters: [] as any[], sites: [] as any[], odometer_reading: null as number | null };
          const seenMSISDNs2 = new Set<string>();
          
          for (const matchSub of matchingSubs) {
            const extracted = await extractPromotersFromSubmission(linkedProgramId, matchSub.responses || {});
            for (const p of extracted.promoters) {
              if (!seenMSISDNs2.has(p.msisdn)) {
                seenMSISDNs2.add(p.msisdn);
                allExtracted2.promoters.push(p);
              }
            }
            if (allExtracted2.sites.length === 0 && extracted.sites.length > 0) {
              allExtracted2.sites = extracted.sites;
            }
            if (allExtracted2.odometer_reading === null && extracted.odometer_reading !== null) {
              allExtracted2.odometer_reading = extracted.odometer_reading;
            }
          }
          
          console.log(`[CheckIn] VAN LOOKUP: Extracted ${allExtracted2.promoters.length} MSISDNs and ${allExtracted2.sites.length} sites from ${matchingSubs.length} submissions`);
          
          return c.json({
            success: true,
            has_checkin: true,
            van_checked_in: true,
            number_plate: numberPlate,
            checkin_user_id: sub.user_id,
            sites: allExtracted2.sites,
            promoters: allExtracted2.promoters,
            total_promoters: allExtracted2.promoters.length,
            morning_odometer: allExtracted2.odometer_reading,
            message: allExtracted2.promoters.length > 0
              ? `Van checked in. ${allExtracted2.promoters.length} MSISDNs loaded from check-in form.`
              : 'Van was checked in but no promoter MSISDNs found in submission.',
          });
        }
      }
    }

    // Strategy 3: Search ALL today's check-in sessions for the linked program
    // Check if any session has been opened today (broad search)
    console.log(`[CheckIn] VAN LOOKUP: Searching check-in sessions for program=${linkedProgramId}`);
    const programPrefix = `cs:${linkedProgramId}:`;
    const allEntries = await kv.getByPrefix(programPrefix);

    const todaySessions = (allEntries || [])
      .filter((entry: any) => {
        const keyParts = entry.key.split(':');
        const sessionDate = keyParts[keyParts.length - 1];
        return sessionDate === todayStr && entry.value;
      })
      .map((entry: any) => entry.value);

    if (todaySessions.length > 0) {
      console.log(`[CheckIn] VAN LOOKUP: Found ${todaySessions.length} check-in sessions for today, but none matched plate="${numberPlate}"`);
    }

    // No match found — van was NOT checked in
    console.log(`[CheckIn] VAN LOOKUP: No check-in found for plate="${numberPlate}"`);
    return c.json({
      success: true,
      has_checkin: false,
      van_checked_in: false,
      number_plate: numberPlate,
      message: `Van ${numberPlate} was not checked in today. Please complete check-in first.`,
    });

  } catch (err: any) {
    console.error('[CheckIn] VAN LOOKUP error:', err);
    return c.json({ success: false, error: `Van lookup error: ${err.message}` }, 500);
  }
});

// ============================================
// ROUTE 12: POST /checkin/van-register
// Register a van check-in by number plate.
// Called from check-in flow when an agent selects a van.
// Stores KV: van_ci:{programId}:{plate}:{date} → {userId, sessionId}
// ============================================

app.post('/checkin/van-register', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Missing X-User-Id header' }, 401);
  }

  try {
    const body = await c.req.json();
    const { program_id, number_plate, session_id } = body;

    if (!program_id || !number_plate) {
      return c.json({ success: false, error: 'program_id and number_plate are required' }, 400);
    }

    const todayStr = getTodayDateEAT();
    const plateNormalized = number_plate.trim().toUpperCase().replace(/\s+/g, '');
    const vanRegKey = `van_ci:${program_id}:${plateNormalized}:${todayStr}`;

    console.log(`[CheckIn] VAN REGISTER: plate="${plateNormalized}", program=${program_id}, user=${userId}`);

    await kv.set(vanRegKey, {
      user_id: userId,
      session_id: session_id || null,
      number_plate: plateNormalized,
      registered_at: new Date().toISOString(),
      source: 'manual_register',
    });

    console.log(`[CheckIn] VAN REGISTER: Saved ${vanRegKey}`);
    return c.json({ success: true, message: `Van ${plateNormalized} registered for check-in today.` });
  } catch (err: any) {
    console.error('[CheckIn] VAN REGISTER error:', err);
    return c.json({ success: false, error: `Van register error: ${err.message}` }, 500);
  }
});

export default app;