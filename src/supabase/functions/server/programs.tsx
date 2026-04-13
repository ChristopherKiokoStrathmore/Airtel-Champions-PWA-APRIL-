import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from "./kv_store.tsx";

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

// Initialize Supabase client (make-server project — for KV store only)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Frontend Supabase client — connects to the PRODUCTION project (xspogpfohjmkykfjadhk)
// where programs, submissions, app_users, van_db, and all actual data lives.
// The make-server project (mcbbtrrhqweypfnlzwht) does NOT have these tables.
const FRONTEND_SUPABASE_URL = Deno.env.get('FRONTEND_SUPABASE_URL')?.startsWith('https://') 
  ? Deno.env.get('FRONTEND_SUPABASE_URL')! 
  : 'https://xspogpfohjmkykfjadhk.supabase.co';
// Use the anon key (same one the frontend app uses successfully for reads).
// The old service_role key was rotated/invalidated, causing "Invalid API key" errors.
// Anon key works because RLS on programs/submissions allows reads.
const FRONTEND_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';
const frontendSupabase = createClient(FRONTEND_SUPABASE_URL, FRONTEND_ANON_KEY);
console.log('[Programs] 🔧 Frontend Supabase client initialized:', FRONTEND_SUPABASE_URL);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Verify user has permission to create/manage programs (Director or HQ only)
// Direct DB mode: Uses X-User-Id header instead of JWT auth
async function verifyProgramCreator(req: any) {
  const userId = req.header('X-User-Id');
  if (!userId) {
    return { authorized: false, userId: null, role: null };
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('id, role')
    .eq('id', userId)
    .single();

  if (!userData) {
    return { authorized: false, userId: null, role: null };
  }

  const allowedRoles = ['director', 'hq_command_center'];
  const authorized = allowedRoles.includes(userData?.role);

  return { authorized, userId: userData.id, role: userData?.role };
}

// Verify user is logged in (direct DB mode)
async function verifyUser(req: any) {
  const userId = req.header('X-User-Id');
  if (!userId) {
    return { authorized: false, userId: null };
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!userData) {
    return { authorized: false, userId: null };
  }
  return { authorized: true, userId: userData.id };
}

// Check if user can view analytics/submissions (Director, HQ, or Managers)
async function canViewProgramData(req: any) {
  const userId = req.header('X-User-Id');
  if (!userId) {
    return { authorized: false, userId: null, role: null, region: null, zone: null };
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('id, role, region, zone')
    .eq('id', userId)
    .single();

  if (!userData) {
    return { authorized: false, userId: null, role: null, region: null, zone: null };
  }

  const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
  const authorized = allowedRoles.includes(userData?.role);

  return { 
    authorized, 
    userId: userData.id, 
    role: userData?.role, 
    region: userData?.region, 
    zone: userData?.zone 
  };
}

// ============================================
// VAN CHECKOUT ENFORCEMENT HELPERS
// ============================================

// Safe KV get wrapper
async function safeKvGet(key: string): Promise<any> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Programs] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

// Safe KV set wrapper
async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Programs] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

// Check if a program title indicates a "check-in" program
function isCheckinProgram(title: string): boolean {
  const t = (title || '').toLowerCase();
  return t.includes('check in') || t.includes('check-in') || t.includes('checkin');
}

// Check if a program title indicates a "check-out" program
function isCheckoutProgram(title: string): boolean {
  const t = (title || '').toLowerCase();
  return t.includes('check out') || t.includes('check-out') || t.includes('checkout');
}

// Extract van identifier from submission responses
// Handles BOTH field-name-keyed responses AND UUID-keyed responses (from formData)
function extractVanFromResponses(responses: Record<string, any>): string | null {
  if (!responses || typeof responses !== 'object') return null;
  
  // Strategy 1: Look through keys for van-related field names
  const vanKeys = ['van', 'van_selection', 'number_plate', 'numberplate', 'van_number_plate', 'plate', 'van_numberplate', 'vehicle', 'van number plate', 'van selection'];
  for (const [key, value] of Object.entries(responses)) {
    // Skip internal metadata fields
    if (key.startsWith('_')) continue;
    
    const k = key.toLowerCase().replace(/[_\s-]+/g, '');
    for (const vanKey of vanKeys) {
      const normalizedVanKey = vanKey.toLowerCase().replace(/[_\s-]+/g, '');
      if (k.includes(normalizedVanKey) && value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  
  // Strategy 2: For UUID-keyed responses, look for values that match number plate patterns
  // Kenyan plates: KAA-KDZ followed by 3 digits and optional letter (e.g., KDA 743F)
  const platePattern = /^K[A-Z]{2}\s?\d{3}[A-Z]?$/i;
  for (const [key, value] of Object.entries(responses)) {
    if (key.startsWith('_')) continue;
    if (value && typeof value === 'string' && platePattern.test(value.trim())) {
      console.log(`[Programs] 🔍 Found plate-like value in UUID-keyed response: "${value.trim()}" (key: ${key})`);
      return value.trim();
    }
  }
  
  return null;
}

// Check if a specific van identifier exists anywhere in submission responses
function responseContainsVan(responses: Record<string, any>, vanIdentifier: string): boolean {
  if (!responses || typeof responses !== 'object' || !vanIdentifier) return false;
  const normalizedVan = vanIdentifier.toUpperCase().trim();
  for (const [key, value] of Object.entries(responses)) {
    if (key.startsWith('_')) continue;
    if (value && typeof value === 'string' && value.toUpperCase().trim() === normalizedVan) {
      return true;
    }
  }
  return false;
}

// Check for unclosed van check-in (a check-in without a subsequent check-out)
async function checkUnclosedVanCheckin(vanIdentifier: string): Promise<{ hasUnclosed: boolean, debug: { steps: string[] } }> {
  const debug: any = { van: vanIdentifier.toUpperCase().trim(), steps: [], supabaseTarget: FRONTEND_SUPABASE_URL };
  try {
    const normalizedVan = vanIdentifier.toUpperCase().trim();
    console.log(`[VanCheck] ========== ENFORCEMENT CHECK START ==========`);
    console.log(`[VanCheck] 🔍 Checking van: "${normalizedVan}"`);
    console.log(`[VanCheck] 🔧 Using FRONTEND Supabase: ${FRONTEND_SUPABASE_URL}`);

    // Get all check-in and check-out programs
    // NOTE: We fetch ALL programs and filter in code because the .or() ilike filter
    // with spaces (e.g., "check in") fails silently in PostgREST
    // CRITICAL: Use frontendSupabase — programs table lives on frontend project, NOT make-server
    const { data: allPrograms, error: programsError } = await frontendSupabase
      .from('programs')
      .select('id, title');

    if (programsError) {
      debug.steps.push(`CRITICAL ERROR querying programs: ${programsError.message}`);
      console.error(`[VanCheck] ❌ CRITICAL: Failed to query programs table: ${programsError.message}`);
      // FAIL CLOSED — if we can't verify, block the check-in to be safe
      return { hasUnclosed: true, debug };
    }

    // Filter to only check-in and check-out programs in code
    const programs = (allPrograms || []).filter(p => isCheckinProgram(p.title) || isCheckoutProgram(p.title));

    if (!programs || programs.length === 0) {
      debug.steps.push(`No check-in/check-out programs found in DB (total programs: ${(allPrograms || []).length})`);
      return { hasUnclosed: false, debug };
    }

    // Separate check-in and check-out programs
    // IMPORTANT: "CHECK OUT" also contains "CHECK" but NOT "CHECK IN" as a substring
    // However "MINI ROAD SHOW -CHECK IN " does NOT contain "check out" — so standard filtering works
    // But to be safe, exclude checkout programs from check-in list
    const checkinPrograms = programs.filter(p => isCheckinProgram(p.title) && !isCheckoutProgram(p.title));
    const checkoutPrograms = programs.filter(p => isCheckoutProgram(p.title));
    
    const checkinProgramIds = checkinPrograms.map(p => p.id);
    const checkoutProgramIds = checkoutPrograms.map(p => p.id);

    debug.checkinPrograms = checkinPrograms.map(p => ({ id: p.id, title: p.title }));
    debug.checkoutPrograms = checkoutPrograms.map(p => ({ id: p.id, title: p.title }));
    debug.steps.push(`Found ${checkinPrograms.length} check-in programs, ${checkoutPrograms.length} check-out programs`);

    console.log(`[VanCheck] Check-IN programs (${checkinPrograms.length}):`, checkinPrograms.map(p => `"${p.title}" [${p.id}]`).join(', '));
    console.log(`[VanCheck] Check-OUT programs (${checkoutPrograms.length}):`, checkoutPrograms.map(p => `"${p.title}" [${p.id}]`).join(', '));

    if (checkinProgramIds.length === 0) {
      debug.steps.push('No check-in programs found after filtering');
      console.log('[VanCheck] No check-in programs found');
      return { hasUnclosed: false, debug };
    }

    // Query check-in submissions with a much higher limit
    // The old limit(100) was way too low — with many agents submitting daily,
    // a specific van's check-in could easily be beyond 100 entries
    // NOTE: Column is created_at (NOT submitted_at — that column does NOT exist)
    // CRITICAL: Use frontendSupabase — submissions table lives on frontend project, NOT make-server
    const { data: lastCheckins, error: checkinError } = await frontendSupabase
      .from('submissions')
      .select('id, created_at, responses, program_id')
      .in('program_id', checkinProgramIds)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (checkinError) {
      console.error('[VanCheck] Error querying check-ins:', checkinError);
      debug.steps.push(`CRITICAL ERROR querying check-ins: ${checkinError.message}`);
      // FAIL CLOSED — if we can't verify, block the check-in
      return { hasUnclosed: true, debug };
    }

    debug.totalCheckinSubmissionsFetched = (lastCheckins || []).length;
    debug.steps.push(`Fetched ${(lastCheckins || []).length} total check-in submissions`);
    console.log(`[VanCheck] Fetched ${(lastCheckins || []).length} total check-in submissions`);

    // Filter check-ins for this specific van
    const vanCheckins = (lastCheckins || []).filter(sub => {
      return responseContainsVan(sub.responses, normalizedVan);
    });

    debug.vanCheckinCount = vanCheckins.length;
    debug.steps.push(`Found ${vanCheckins.length} check-in submissions matching van "${normalizedVan}"`);
    console.log(`[VanCheck] Found ${vanCheckins.length} check-in submissions for van "${normalizedVan}"`);

    if (vanCheckins.length === 0) {
      // No previous check-ins — first time checking in, allow it
      debug.steps.push(`No previous check-ins for "${normalizedVan}" — first check-in, ALLOWING`);
      console.log(`[VanCheck] No previous check-ins for "${normalizedVan}" — first check-in, ALLOWING`);
      // Add sample submissions to debug so we can see what's actually stored
      if ((lastCheckins || []).length > 0) {
        debug.sampleSubmissions = lastCheckins!.slice(0, 5).map(sub => {
          const vals = Object.entries(sub.responses || {})
            .filter(([k]) => !k.startsWith('_'))
            .map(([k, v]) => ({ key: k, value: v }));
          return { id: sub.id, created_at: sub.created_at, program_id: sub.program_id, responseValues: vals };
        });
      }
      return { hasUnclosed: false, debug };
    }

    const lastCheckin = vanCheckins[0]; // Most recent check-in
    debug.lastCheckin = { id: lastCheckin.id, created_at: lastCheckin.created_at };
    debug.steps.push(`Last check-in: ${lastCheckin.created_at} (id: ${lastCheckin.id})`);
    console.log(`[VanCheck] Last check-in for "${normalizedVan}": ${lastCheckin.created_at} (submission ${lastCheckin.id})`);

    // Check if there's a check-out after this check-in
    if (checkoutProgramIds.length === 0) {
      debug.steps.push('No check-out programs exist — check-in is unclosed by definition');
      console.log('[VanCheck] No check-out programs exist — check-in is unclosed by definition');
      return { hasUnclosed: true, debug };
    }

    const { data: checkoutsAfter, error: checkoutError } = await frontendSupabase
      .from('submissions')
      .select('id, created_at, responses, program_id')
      .in('program_id', checkoutProgramIds)
      .gte('created_at', lastCheckin.created_at)
      .order('created_at', { ascending: false })
      .limit(500);

    if (checkoutError) {
      console.error('[VanCheck] Error querying check-outs:', checkoutError);
      debug.steps.push(`CRITICAL ERROR querying check-outs: ${checkoutError.message}`);
      // FAIL CLOSED — if we can't verify checkout, block the check-in
      return { hasUnclosed: true, debug };
    }

    debug.totalCheckoutSubmissionsFetched = (checkoutsAfter || []).length;
    debug.steps.push(`Fetched ${(checkoutsAfter || []).length} check-out submissions since ${lastCheckin.created_at}`);
    console.log(`[VanCheck] Fetched ${(checkoutsAfter || []).length} check-out submissions since ${lastCheckin.created_at}`);

    // Filter check-outs for this specific van
    const vanCheckouts = (checkoutsAfter || []).filter(sub => {
      return responseContainsVan(sub.responses, normalizedVan);
    });

    debug.vanCheckoutCount = vanCheckouts.length;

    if (vanCheckouts.length === 0) {
      debug.steps.push(`BLOCKED: No checkout found for "${normalizedVan}" after check-in at ${lastCheckin.created_at}`);
      console.log(`[VanCheck] BLOCKED: Van "${normalizedVan}" has unclosed check-in from ${lastCheckin.created_at} — NO checkout found after it`);
      return { hasUnclosed: true, debug }; // Unclosed check-in!
    }

    debug.lastCheckout = { id: vanCheckouts[0].id, created_at: vanCheckouts[0].created_at };
    debug.steps.push(`ALLOWED: Van checked out at ${vanCheckouts[0].created_at} (id: ${vanCheckouts[0].id})`);
    console.log(`[VanCheck] ALLOWED: Van "${normalizedVan}" was checked out at ${vanCheckouts[0].created_at} (submission ${vanCheckouts[0].id})`);
    console.log(`[VanCheck] ========== ENFORCEMENT CHECK END ==========`);
    return { hasUnclosed: false, debug };
  } catch (error) {
    console.error('[VanCheck] Exception in checkUnclosedVanCheckin:', error);
    debug.steps.push(`EXCEPTION: ${error?.message || error}`);
    // FAIL CLOSED — don't let errors silently allow check-ins
    return { hasUnclosed: true, debug };
  }
}

// ============================================
// VAN CHECKOUT ENFORCEMENT ROUTES
// ============================================

// GET /make-server-28f2f653/van-checkout-enforcement/status
app.get('/make-server-28f2f653/van-checkout-enforcement/status', async (c) => {
  try {
    const result = await safeKvGet('van_checkout_enforcement_enabled');
    const enabled = result?.value === true;
    console.log('[Programs] Van checkout enforcement status:', enabled);
    return c.json({ success: true, enabled });
  } catch (error: any) {
    console.error('[Programs] Error getting van checkout enforcement status:', error);
    return c.json({ success: false, enabled: false, error: error.message }, 500);
  }
});

// GET /make-server-28f2f653/van-checkout-enforcement/check?van=KDA743F
// Real-time check when agent selects a van number plate in a check-in form
app.get('/make-server-28f2f653/van-checkout-enforcement/check', async (c) => {
  try {
    const van = c.req.query('van');
    if (!van) {
      return c.json({ success: false, error: 'Missing van parameter' }, 400);
    }

    console.log(`[Programs] 🔍 Real-time van checkout check for: ${van}`);

    // Check if this is a per-program enforcement call (skip global KV check)
    const programEnforced = c.req.query('program_enforced');
    
    if (!programEnforced) {
      // Legacy: check global KV setting only if not called from per-program enforcement
      const enforcementResult = await safeKvGet('van_checkout_enforcement_enabled');
      const enforcementEnabled = enforcementResult?.value === true;

      if (!enforcementEnabled) {
        console.log('[Programs] Van checkout enforcement is DISABLED globally — allowing check-in');
        return c.json({ 
          success: true, 
          allowed: true, 
          enforcement_enabled: false,
          message: 'Van checkout enforcement is not enabled' 
        });
      }
    }

    // Check for unclosed check-in
    const { hasUnclosed, debug } = await checkUnclosedVanCheckin(van);

    if (hasUnclosed) {
      console.log(`[Programs] ❌ Van ${van} has unclosed check-in — BLOCKED`);
      return c.json({ 
        success: true, 
        allowed: false, 
        enforcement_enabled: true,
        message: 'Kindly check out previous trip before you can check in again',
        debug
      });
    }

    console.log(`[Programs] ✅ Van ${van} is clear — check-in allowed`);
    return c.json({ 
      success: true, 
      allowed: true, 
      enforcement_enabled: true,
      message: 'Van was checked out — you can proceed with check-in',
      debug
    });
  } catch (error: any) {
    console.error('[Programs] Error checking van checkout status:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-28f2f653/van-checkout-enforcement/toggle
app.post('/make-server-28f2f653/van-checkout-enforcement/toggle', async (c) => {
  try {
    const body = await c.req.json();
    const { enabled } = body;

    // Verify caller is HQ or Director
    const userId = c.req.header('X-User-Id');
    if (userId) {
      const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userData && !['hq_command_center', 'director'].includes(userData.role)) {
        return c.json({ success: false, error: 'Only HQ and Directors can toggle this setting' }, 403);
      }
    }

    const saved = await safeKvSet('van_checkout_enforcement_enabled', enabled === true);
    console.log(`[Programs] Van checkout enforcement toggled to: ${enabled}, saved: ${saved}`);

    return c.json({
      success: true,
      enabled: enabled === true,
      message: `Van checkout enforcement ${enabled ? 'ENABLED' : 'DISABLED'} successfully`
    });
  } catch (error: any) {
    console.error('[Programs] Error toggling van checkout enforcement:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================
// PROGRAMS ROUTES
// ============================================

// GET /make-server-28f2f653/programs - List all active programs for user's role
app.get('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[Programs] === NEW REQUEST ===');
    
    // Support both auth token and query parameters (for TAI's custom auth)
    let userRole = 'sales_executive';
    let userId = '';

    // Try getting role and user_id from query params first (TAI custom auth)
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');

    if (roleParam && userIdParam) {
      // Using query parameters (TAI custom auth)
      userRole = roleParam;
      userId = userIdParam;
      console.log('[Programs] Using query params - role:', userRole, 'userId:', userId);
    } else {
      // Direct DB auth via X-User-Id header
      const headerUserId = c.req.header('X-User-Id');
      if (!headerUserId) {
        console.log('[Programs] No user identification found');
        return c.json({ error: 'Unauthorized - missing user identification' }, 401);
      }

      userId = headerUserId;

      // Get user's role from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single();

      userRole = userData?.role || 'sales_executive';
      console.log('[Programs] Using X-User-Id header - role:', userRole, 'userId:', userId);
    }

    console.log('[Programs] Querying programs for role:', userRole);

    // Get active programs for user's role
    // Note: Using overlap operator (&&) instead of contains for array matching
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Programs] Database error details:', JSON.stringify(error, null, 2));
      console.error('[Programs] Error code:', error.code);
      console.error('[Programs] Error message:', error.message);
      
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.error('[Programs] ❌ CRITICAL: programs table does not exist!');
        console.error('[Programs] 📋 Please run the SQL schema in /database/programs-schema.sql');
        return c.json({ 
          error: 'Database tables not set up. Please run the programs schema SQL in Supabase Dashboard.',
          hint: 'Check /database/programs-schema.sql file and run it in Supabase SQL Editor',
          code: 'TABLE_NOT_FOUND'
        }, 500);
      }
      
      throw error;
    }

    console.log('[Programs] Found programs:', programs?.length || 0);
    if (programs && programs.length > 0) {
      console.log('[Programs] First program:', programs[0].title);
    }

    // Get submission count and user's submission status for each program
    const programsWithStatus = await Promise.all(
      (programs || []).map(async (program) => {
        try {
          // Total submissions count
          const { count: totalSubmissions } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);

          // User's submissions for this program
          const { data: userSubmissions, count: userSubmissionCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact' })
            .eq('program_id', program.id)
            .eq('user_id', userId);

          // Check if user submitted today
          const today = new Date().toISOString().split('T')[0];
          const submittedToday = userSubmissions?.some(sub => 
            sub.submitted_at.startsWith(today)
          ) || false;

          return {
            ...program,
            total_submissions: totalSubmissions || 0,
            user_submission_count: userSubmissionCount || 0,
            submitted_today: submittedToday,
          };
        } catch (err) {
          console.error('[Programs] Error processing program:', program.id, err);
          return {
            ...program,
            total_submissions: 0,
            user_submission_count: 0,
            submitted_today: false,
          };
        }
      })
    );

    console.log('[Programs] Returning programs with status:', programsWithStatus.length);

    return c.json({ programs: programsWithStatus });
  } catch (error) {
    console.error('[Programs] ERROR fetching programs:', error);
    console.error('[Programs] Error stack:', error?.stack);
    console.error('[Programs] Error message:', error?.message);
    return c.json({ error: 'Failed to fetch programs', details: error?.message }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id - Get program details with fields
app.get('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const { authorized, userId } = await verifyUser(c.req);

    if (!authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const programId = c.req.param('id');

    // Get program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError) throw programError;

    // Get program fields
    const { data: fields, error: fieldsError } = await supabase
      .from('program_fields')
      .select('*')
      .eq('program_id', programId)
      .order('order_index');

    if (fieldsError) throw fieldsError;

    return c.json({ program: { ...program, fields } });
  } catch (error) {
    console.error('[Programs] Error fetching program details:', error);
    return c.json({ error: 'Failed to fetch program details' }, 500);
  }
});

// POST /make-server-28f2f653/programs - Create program
app.post('/make-server-28f2f653/programs', async (c) => {
  try {
    // Get user info from query params (TAI authentication)
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs] ========================================');
    console.log('[Programs] CREATE PROGRAM REQUEST');
    console.log('[Programs] ========================================');
    console.log('[Programs] User ID:', userId);
    console.log('[Programs] User Role:', userRole);

    const body = await c.req.json();
    const { title, description, category, icon, color, points_value = 10, target_roles, start_date, end_date, fields } = body;

    console.log('[Programs] Title:', title);
    console.log('[Programs] Target Roles:', target_roles);
    console.log('[Programs] Fields count:', fields?.length);

    // Validate required fields
    if (!title || !target_roles || !Array.isArray(target_roles) || target_roles.length === 0) {
      console.log('[Programs] ❌ Validation failed - missing required fields');
      return c.json({ error: 'Missing required fields: title, target_roles' }, 400);
    }

    console.log('[Programs] ✅ Validation passed');
    console.log('[Programs] Attempting database insert...');

    // Direct insert without RPC
    const { data: program, error: insertError } = await supabase
      .from('programs')
      .insert({
        title,
        description,
        category,
        icon,
        color,
        points_value,
        target_roles,
        start_date,
        end_date,
        status: 'active',
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Programs] ❌ INSERT ERROR:');
      console.error('[Programs] Error code:', insertError.code);
      console.error('[Programs] Error message:', insertError.message);
      console.error('[Programs] Error details:', insertError.details);
      console.error('[Programs] Error hint:', insertError.hint);
      console.error('[Programs] Full error object:', JSON.stringify(insertError, null, 2));
      
      return c.json({ 
        error: insertError.message || 'Database insert failed',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, 500);
    }

    console.log('[Programs] ✅ Program inserted! ID:', program.id);

    // Create program fields
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToInsert = fields.map((field, index) => ({
        program_id: program.id,
        field_name: field.field_name,
        field_label: field.field_label || field.field_name,
        field_type: field.field_type,
        is_required: field.is_required ?? false,
        placeholder: field.placeholder || null,
        help_text: field.help_text || null,
        options: field.options || null,
        validation: field.validation || null,
        conditional_logic: field.conditional_logic || null,
        section_id: field.section_id || null,
        section_title: field.section_title || null,
        section_index: field.section_index ?? 0,
        order_index: field.order_index ?? index,
      }));

      console.log('[Programs] Inserting fields:', fieldsToInsert.length);

      const { error: fieldsError } = await supabase
        .from('program_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('[Programs] Fields insert error:', fieldsError);
        throw fieldsError;
      }
    }

    console.log(`[Programs] Created program: ${title} by user ${userId}`);
    return c.json({ program, message: 'Program created successfully' });
  } catch (error: any) {
    console.error('[Programs] Error creating program:', error);
    console.error('[Programs] Error details:', error.message, error.code, error.details);
    return c.json({ 
      error: error.message || 'Failed to create program',
      details: error.details || null,
      code: error.code || null 
    }, 500);
  }
});

// PUT /make-server-28f2f653/programs/:id - Update program
app.put('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const { authorized, userId } = await verifyProgramCreator(c.req);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can update programs' }, 403);
    }

    const programId = c.req.param('id');
    const body = await c.req.json();
    const { title, description, points_value, target_roles, start_date, end_date, status } = body;

    const { data: program, error } = await supabase
      .from('programs')
      .update({
        title,
        description,
        points_value,
        target_roles,
        start_date,
        end_date,
        status,
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[Programs] Updated program: ${programId} by user ${userId}`);
    return c.json({ program, message: 'Program updated successfully' });
  } catch (error) {
    console.error('[Programs] Error updating program:', error);
    return c.json({ error: 'Failed to update program' }, 500);
  }
});

// DELETE /make-server-28f2f653/programs/:id - Delete program
app.delete('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userId = '';
    let userRole = '';
    
    const userIdParam = c.req.query('user_id');
    const roleParam = c.req.query('role');
    
    if (userIdParam && roleParam) {
      // TAI custom auth
      userId = userIdParam;
      userRole = roleParam;
      console.log('[Programs] DELETE using TAI auth - userId:', userId, 'role:', userRole);
    } else {
      // Supabase auth
      const authResult = await verifyProgramCreator(c.req);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director and HQ Team can delete programs' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
    }
    
    // Verify user has permission
    const allowedRoles = ['director', 'hq_command_center'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can delete programs' }, 403);
    }

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;

    console.log(`[Programs] Deleted program: ${programId} by user ${userId}`);
    return c.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('[Programs] Error deleting program:', error);
    return c.json({ error: 'Failed to delete program' }, 500);
  }
});

// ============================================
// SUBMISSIONS ROUTES
// ============================================

// POST /make-server-28f2f653/programs/:id/submit - Submit program response
app.post('/make-server-28f2f653/programs/:id/submit', async (c) => {
  try {
    const { authorized, userId } = await verifyUser(c.req);

    if (!authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const programId = c.req.param('id');
    const body = await c.req.json();
    const { responses, photos, location } = body;

    // Get program details (include title for check-in/check-out detection)
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('points_value, title, van_checkout_enforcement_enabled')
      .eq('id', programId)
      .single();

    if (programError) throw programError;

    // ── Van Checkout Enforcement Check ──
    if (isCheckinProgram(program.title)) {
      console.log(`[Programs] 🚐 Detected check-in program: "${program.title}"`);

      // Check per-program flag first; only fall back to global KV if the column hasn't been set (null/undefined)
      // If the per-program flag is explicitly false, respect that — do NOT enforce
      let enforcementEnabled: boolean;
      
      if (program.van_checkout_enforcement_enabled !== null && program.van_checkout_enforcement_enabled !== undefined) {
        // Per-program flag is explicitly set — use it (true or false)
        enforcementEnabled = program.van_checkout_enforcement_enabled === true;
        console.log(`[Programs] 🚐 Van checkout enforcement: per-program=${enforcementEnabled} (explicitly set)`);
      } else {
        // Per-program flag not set — fall back to global KV for backward compatibility
        const enforcementResult = await safeKvGet('van_checkout_enforcement_enabled');
        enforcementEnabled = enforcementResult?.value === true;
        console.log(`[Programs] 🚐 Van checkout enforcement: global KV=${enforcementEnabled} (per-program not set)`);
      }

      if (enforcementEnabled) {
        console.log('[Programs] 🔒 Van checkout enforcement is ENABLED — checking for unclosed check-ins');

        // Extract van identifier from responses
        const vanIdentifier = extractVanFromResponses(responses);

        if (vanIdentifier) {
          const { hasUnclosed } = await checkUnclosedVanCheckin(vanIdentifier);

          if (hasUnclosed) {
            console.log(`[Programs] ❌ BLOCKED: Van ${vanIdentifier} has unclosed check-in`);
            return c.json({
              error: 'Kindly check out previous trip before you can check in again'
            }, 400);
          }
        } else {
          console.log('[Programs] ⚠️ Could not identify van in responses — skipping enforcement');
        }
      } else {
        console.log('[Programs] Van checkout enforcement is DISABLED — allowing check-in');
      }
    }

    const pointsAwarded = program.points_value ?? 10;

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        program_id: programId,
        user_id: userId,
        responses,
        photos,
        location,
        status: 'approved', // Auto-approve by default
        points_awarded: pointsAwarded,
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Award points to user
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      user_id: userId,
      points_to_add: pointsAwarded,
    });

    if (pointsError) {
      console.error('[Programs] Error awarding points:', pointsError);
      // Continue even if points award fails - we can manually fix later
    }

    console.log(`[Programs] Submission created: ${submission.id} by user ${userId}, awarded ${pointsAwarded} points`);
    return c.json({ submission, points_awarded: pointsAwarded, message: 'Submission successful' });
  } catch (error) {
    console.error('[Programs] Error creating submission:', error);
    return c.json({ error: 'Failed to submit program' }, 500);
  }
});

// GET /make-server-28f2f653/van-calendar/submissions - Get van calendar submissions
app.get('/make-server-28f2f653/van-calendar/submissions', async (c) => {
  try {
    console.log('[Programs] Fetching van calendar submissions from van_calendar_plans table');
    
    // Query van_calendar_plans table directly
    const { data: plans, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('[Programs] Error querying van_calendar_plans:', error);
      throw error;
    }
    
    console.log('[Programs] Found', plans?.length || 0, 'van calendar plans');
    
    return c.json({ 
      success: true,
      submissions: plans || [],
      count: plans?.length || 0
    });
  } catch (error: any) {
    console.error('[Programs] Error fetching van calendar submissions:', error);
    return c.json({ error: error.message || 'Failed to fetch submissions' }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/kv-submissions - Get submissions from KV store (no auth required)
app.get('/make-server-28f2f653/programs/:id/kv-submissions', async (c) => {
  try {
    const programId = c.req.param('id');
    console.log('[Programs] Fetching KV submissions for program:', programId);
    
    // Query KV store directly
    const { data: kvData, error: kvError } = await supabase
      .from('kv_store_28f2f653')
      .select('key, value')
      .like('key', `submissions:${programId}:%`);
    
    if (kvError) {
      console.error('[Programs] KV query error:', kvError);
      throw kvError;
    }
    
    console.log('[Programs] Found', kvData?.length || 0, 'KV submissions');
    
    // Parse the JSON values
    const submissions = (kvData || []).map(item => {
      try {
        return JSON.parse(item.value as string);
      } catch (e) {
        console.error('[Programs] Failed to parse submission:', e);
        return null;
      }
    }).filter(s => s !== null);
    
    return c.json({ 
      success: true,
      submissions,
      count: submissions.length 
    });
  } catch (error: any) {
    console.error('[Programs] Error fetching KV submissions:', error);
    return c.json({ error: error.message || 'Failed to fetch submissions' }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/submissions - Get all submissions for a program
app.get('/make-server-28f2f653/programs/:id/submissions', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userRole = '';
    let userId = '';
    let region = null;
    let zone = null;
    
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');
    
    if (roleParam && userIdParam) {
      // TAI custom auth via query params
      userRole = roleParam;
      userId = userIdParam;
      
      // Get user's region/zone from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('region, zone')
        .eq('id', userId)
        .single();
      
      region = userData?.region;
      zone = userData?.zone;
      
      console.log('[Programs] Using TAI auth - role:', userRole, 'userId:', userId);
    } else {
      // Supabase auth via token
      const authResult = await canViewProgramData(c.req);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view submissions' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
      region = authResult.region;
      zone = authResult.zone;
    }
    
    // Verify role has permission to view submissions
    const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view submissions' }, 403);
    }

    // Build query based on role
    let query = supabase
      .from('submissions')
      .select(`
        *,
        user:app_users(id, full_name, phone_number, region, zone, zsm, zbm)
      `)
      .eq('program_id', programId);

    // Filter by region/zone for managers
    if (userRole === 'zonal_business_manager' && region) {
      const { data: regionUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('region', region);
      const userIds = regionUsers?.map(u => u.id) || [];
      query = query.in('user_id', userIds);
    } else if (userRole === 'zonal_sales_manager' && zone) {
      const { data: zoneUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('zone', zone);
      const userIds = zoneUsers?.map(u => u.id) || [];
      query = query.in('user_id', userIds);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data: submissions, error } = await query;

    if (error) throw error;

    return c.json({ submissions: submissions || [] });
  } catch (error) {
    console.error('[Programs] Error fetching submissions:', error);
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/approve - Approve submission
app.put('/make-server-28f2f653/submissions/:id/approve', async (c) => {
  try {
    const { authorized, userId } = await verifyProgramCreator(c.req);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can approve submissions' }, 403);
    }

    const submissionId = c.req.param('id');

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[Programs] Approved submission: ${submissionId} by user ${userId}`);
    return c.json({ submission, message: 'Submission approved' });
  } catch (error) {
    console.error('[Programs] Error approving submission:', error);
    return c.json({ error: 'Failed to approve submission' }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/reject - Reject submission
app.put('/make-server-28f2f653/submissions/:id/reject', async (c) => {
  try {
    const { authorized, userId } = await verifyProgramCreator(c.req);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can reject submissions' }, 403);
    }

    const submissionId = c.req.param('id');

    // Get submission to deduct points
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('user_id, points_awarded')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Deduct points from user
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      user_id: submission.user_id,
      points_to_add: -submission.points_awarded,
    });

    if (pointsError) {
      console.error('[Programs] Error deducting points:', pointsError);
    }

    console.log(`[Programs] Rejected submission: ${submissionId} by user ${userId}, deducted ${submission.points_awarded} points`);
    return c.json({ message: 'Submission rejected', points_deducted: submission.points_awarded });
  } catch (error) {
    console.error('[Programs] Error rejecting submission:', error);
    return c.json({ error: 'Failed to reject submission' }, 500);
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// GET /make-server-28f2f653/programs/:id/analytics - Get program analytics
app.get('/make-server-28f2f653/programs/:id/analytics', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userRole = '';
    let userId = '';
    let region = null;
    let zone = null;
    
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');
    const filterView = c.req.query('view') || 'scoped'; // 'scoped', 'national', 'zone', 'zsm'
    
    if (roleParam && userIdParam) {
      // TAI custom auth via query params
      userRole = roleParam;
      userId = userIdParam;
      
      // Get user's region/zone from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('region, zone')
        .eq('id', userId)
        .single();
      
      region = userData?.region;
      zone = userData?.zone;
      
      console.log('[Programs Analytics] Using TAI auth - role:', userRole, 'userId:', userId, 'view:', filterView);
    } else {
      // Supabase auth via token
      const authResult = await canViewProgramData(c.req);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view analytics' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
      region = authResult.region;
      zone = authResult.zone;
    }
    
    // Verify role has permission to view analytics
    const allowedRoles = ['director', 'hq_command_center', 'hq_staff', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view analytics' }, 403);
    }

    // Determine scope based on role and filter view
    let scopeInfo = {
      type: 'national', // 'national', 'region', 'zone'
      value: null,
      label: 'Nationwide'
    };

    // Build user filter based on view and role
    let userIds: string[] = [];
    
    if (filterView === 'national') {
      // Show national data (no filtering)
      scopeInfo = { type: 'national', value: null, label: 'Nationwide' };
    } else if (filterView === 'zone' && zone) {
      // Show zone-level data
      const { data: zoneUsers } = await supabase
        .from('app_users')
        .select('id, zone')
        .eq('zone', zone);
      userIds = zoneUsers?.map(u => u.id) || [];
      scopeInfo = { type: 'zone', value: zone, label: `${zone} Zone` };
    } else if (filterView === 'zsm' && zone) {
      // Show only SEs under specific ZSM
      const { data: zsmUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('zone', zone)
        .eq('role', 'sales_executive');
      userIds = zsmUsers?.map(u => u.id) || [];
      scopeInfo = { type: 'zsm', value: zone, label: `My Team (${zone})` };
    } else {
      // Default scoped view based on role
      if (userRole === 'zonal_business_manager' && region) {
        const { data: regionUsers } = await supabase
          .from('app_users')
          .select('id, region')
          .eq('region', region);
        userIds = regionUsers?.map(u => u.id) || [];
        scopeInfo = { type: 'region', value: region, label: `${region} Region` };
      } else if (userRole === 'zonal_sales_manager' && zone) {
        const { data: zoneUsers } = await supabase
          .from('app_users')
          .select('id')
          .eq('zone', zone)
          .eq('role', 'sales_executive');
        userIds = zoneUsers?.map(u => u.id) || [];
        scopeInfo = { type: 'zone', value: zone, label: `${zone} Zone` };
      }
    }

    // =============================================
    // SCOPED ANALYTICS (filtered by view)
    // =============================================
    
    let submissionsQuery = supabase
      .from('submissions')
      .select('*')
      .eq('program_id', programId);

    if (userIds.length > 0) {
      submissionsQuery = submissionsQuery.in('user_id', userIds);
    }

    const { count: totalSubmissions } = await submissionsQuery;

    // Today's submissions
    const today = new Date().toISOString().split('T')[0];
    let todayQuery = supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .gte('submitted_at', today);
    
    if (userIds.length > 0) {
      todayQuery = todayQuery.in('user_id', userIds);
    }
    
    const { count: todaySubmissions } = await todayQuery;

    // Unique participants
    const { data: allSubmissions } = await submissionsQuery;
    const uniqueParticipants = new Set(allSubmissions?.map(p => p.user_id)).size;

    // Get program target roles to calculate participation rate
    const { data: program } = await supabase
      .from('programs')
      .select('target_roles')
      .eq('id', programId)
      .single();

    let totalTargetUsers = 0;
    if (program?.target_roles) {
      let usersQuery = supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .in('role', program.target_roles);
      
      if (userIds.length > 0) {
        usersQuery = usersQuery.in('id', userIds);
      }
      
      const { count } = await usersQuery;
      totalTargetUsers = count || 0;
    }

    const participationRate = totalTargetUsers > 0 
      ? Math.round((uniqueParticipants / totalTargetUsers) * 100) 
      : 0;

    // =============================================
    // NATIONAL COMPARISON DATA (for benchmarking)
    // =============================================
    
    let nationalComparison = null;
    
    if (scopeInfo.type !== 'national') {
      // Get national stats for comparison
      const { count: nationalTotal } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId);

      const { data: nationalSubs } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('program_id', programId);
      
      const nationalParticipants = new Set(nationalSubs?.map(p => p.user_id)).size;

      let nationalTargetUsers = 0;
      if (program?.target_roles) {
        const { count } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .in('role', program.target_roles);
        nationalTargetUsers = count || 0;
      }

      const nationalParticipationRate = nationalTargetUsers > 0
        ? Math.round((nationalParticipants / nationalTargetUsers) * 100)
        : 0;

      nationalComparison = {
        total_submissions: nationalTotal || 0,
        unique_participants: nationalParticipants,
        participation_rate: nationalParticipationRate,
        your_percentage: nationalTotal > 0 ? Math.round(((totalSubmissions || 0) / nationalTotal) * 100) : 0
      };
    }

    // =============================================
    // TOP PERFORMERS (scoped to current view)
    // =============================================
    
    let topPerformersQuery = supabase
      .from('submissions')
      .select(`
        user_id,
        user:app_users(full_name, zone)
      `)
      .eq('program_id', programId);
    
    if (userIds.length > 0) {
      topPerformersQuery = topPerformersQuery.in('user_id', userIds);
    }
    
    const { data: topPerformers } = await topPerformersQuery;

    const submissionCounts = {};
    topPerformers?.forEach(sub => {
      const userId = sub.user_id;
      submissionCounts[userId] = (submissionCounts[userId] || 0) + 1;
    });

    const topPerformersList = Object.entries(submissionCounts)
      .map(([userId, count]) => {
        const performer = topPerformers.find(p => p.user_id === userId);
        return {
          user_id: userId,
          submission_count: count,
          user_name: performer?.user?.full_name || 'Unknown',
          zone: performer?.user?.zone || 'Unknown'
        };
      })
      .sort((a, b) => b.submission_count - a.submission_count)
      .slice(0, 10);

    // =============================================
    // ZONE BREAKDOWN (always show all zones)
    // =============================================
    
    const { data: allZoneData } = await supabase
      .from('submissions')
      .select(`
        user_id,
        user:app_users(zone)
      `)
      .eq('program_id', programId);

    const zoneBreakdown = {};
    allZoneData?.forEach(sub => {
      const zoneValue = sub.user?.zone || 'Unknown';
      zoneBreakdown[zoneValue] = (zoneBreakdown[zoneValue] || 0) + 1;
    });

    const zoneBreakdownList = Object.entries(zoneBreakdown)
      .map(([zone, count]) => ({ 
        zone, 
        submissions: count,
        is_current: zone === scopeInfo.value
      }))
      .sort((a, b) => b.submissions - a.submissions);

    // =============================================
    // ZSM BREAKDOWN (for ZBM viewing their region)
    // =============================================
    
    let zsmBreakdown = [];
    
    if (userRole === 'zonal_business_manager' && region && filterView !== 'national') {
      // Get all ZSMs in the region
      const { data: zsmsInRegion } = await supabase
        .from('app_users')
        .select('id, full_name, zone')
        .eq('region', region)
        .eq('role', 'zonal_sales_manager');

      for (const zsm of zsmsInRegion || []) {
        // Get SEs under this ZSM
        const { data: sesUnderZsm } = await supabase
          .from('app_users')
          .select('id')
          .eq('zone', zsm.zone)
          .eq('role', 'sales_executive');
        
        const seIds = sesUnderZsm?.map(se => se.id) || [];
        
        // Count submissions from these SEs
        const { count: zsmSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', programId)
          .in('user_id', seIds);

        zsmBreakdown.push({
          zsm_id: zsm.id,
          zsm_name: zsm.full_name,
          zone: zsm.zone,
          submissions: zsmSubmissions || 0,
          team_size: seIds.length
        });
      }

      zsmBreakdown.sort((a, b) => b.submissions - a.submissions);
    }

    return c.json({
      analytics: {
        scope: scopeInfo,
        total_submissions: totalSubmissions || 0,
        today_submissions: todaySubmissions || 0,
        unique_participants: uniqueParticipants,
        total_target_users: totalTargetUsers,
        participation_rate: participationRate,
        top_performers: topPerformersList,
        zone_breakdown: zoneBreakdownList,
        zsm_breakdown: zsmBreakdown,
        national_comparison: nationalComparison
      },
    });
  } catch (error) {
    console.error('[Programs] Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

export default app;