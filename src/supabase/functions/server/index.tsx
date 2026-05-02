// Airtel Champions Server v3.4 - Modularized for Performance
import { initializeStorageBucket } from "./storage-setup.tsx";
import { setupDatabase } from "./database-setup.tsx";
import { setupVanDatabase } from "./van-db-setup.tsx";
import { fixKvPermissions } from "./fix-kv-permissions.tsx";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Import modularized route handlers
import programsApp from "./programs.tsx";
import socialApp from "./social.tsx";
import announcementsApp from "./announcements.tsx";
import groupsApp from "./groups.tsx";
import vansApp from "./vans.tsx";
import databaseDropdownApp from "./database-dropdown.tsx";
import vanCalendarApp from "./van-calendar.tsx";
import submissionsApp from "./submissions.tsx";
import analyticsApp from "./analytics.tsx";
import locationsApp from "./locations.tsx";
import adminApp from "./admin.tsx";
import webPushApp from "./web-push.tsx";
import hbbApp from "./hbb.tsx";
import checkinApp from "./checkin.tsx";
import userUploadApp from "./user-upload.tsx";
import hqDirectorsApp from "./hq-directors.tsx";
import activityApp from "./activity.tsx";

const app = new Hono();

// Supabase client (server-side with service role key)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

async function requireAdminAuth(c: any): Promise<{ ok: true } | { ok: false; response: Response }> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, response: c.json({ error: 'Unauthorized' }, 401) };
  }
  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { ok: false, response: c.json({ error: 'Unauthorized' }, 401) };
  }
  const { data: userData, error: roleError } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (roleError || !userData) {
    return { ok: false, response: c.json({ error: 'Unauthorized' }, 401) };
  }
  const adminRoles = ['admin', 'zsm', 'asm', 'rsm', 'director', 'hq_command_center'];
  if (!adminRoles.includes(userData.role)) {
    return { ok: false, response: c.json({ error: 'Forbidden' }, 403) };
  }
  return { ok: true };
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const allowed = [
        'https://airtel-champions.vercel.app',
        'https://airtel-champions-pwa-april-6gnsktent.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ];
      return allowed.includes(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization", "apikey", "X-User-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/make-server-28f2f653/health", (c) => {
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Sales Intelligence Network API",
    version: "3.4.0"
  });
});

// ============================================================================
// DATABASE SETUP
// ============================================================================

app.post("/make-server-28f2f653/setup-database", async (c) => {
  const auth = await requireAdminAuth(c);
  if (!auth.ok) return auth.response;
  try {
    console.log('[Endpoint] Database setup requested');
    const result = await setupDatabase();
    
    if (result.success) {
      return c.json(result, 200);
    } else {
      return c.json(result, 500);
    }
  } catch (error: any) {
    console.error('[Endpoint] Database setup error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      code: 'SETUP_ERROR'
    }, 500);
  }
});

// ============================================================================
// VAN DATABASE SETUP
// ============================================================================

app.post("/make-server-28f2f653/setup-van-database", async (c) => {
  const auth = await requireAdminAuth(c);
  if (!auth.ok) return auth.response;
  try {
    console.log('[Endpoint] Van database setup requested');
    const result = await setupVanDatabase();
    
    if (result.success) {
      return c.json(result, 200);
    } else {
      return c.json(result, 500);
    }
  } catch (error: any) {
    console.error('[Endpoint] Van database setup error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      code: 'VAN_SETUP_ERROR'
    }, 500);
  }
});

// ============================================================================
// KV STORE PERMISSION FIX (manual trigger)
// ============================================================================

app.post("/make-server-28f2f653/fix-kv-permissions", async (c) => {
  const auth = await requireAdminAuth(c);
  if (!auth.ok) return auth.response;
  try {
    console.log('[Endpoint] KV permission fix requested');
    const result = await fixKvPermissions();
    return c.json(result, result.success ? 200 : 500);
  } catch (error: any) {
    console.error('[Endpoint] KV permission fix error:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      code: 'KV_PERMISSION_FIX_ERROR'
    }, 500);
  }
});

// ============================================================================
// MOUNT MODULAR ROUTE HANDLERS
// ============================================================================

// Core functionality
app.route('/', programsApp);
app.route('/make-server-28f2f653', socialApp);
app.route('/make-server-28f2f653', announcementsApp);
app.route('/make-server-28f2f653', groupsApp);
app.route('/', vansApp);
app.route('/make-server-28f2f653/van-calendar', vanCalendarApp);
app.route('/make-server-28f2f653/database-dropdown', databaseDropdownApp);

// Submissions & Analytics
app.route('/', submissionsApp);
app.route('/', analyticsApp);
app.route('/make-server-28f2f653/locations', locationsApp);
// Alias for simplified routing
app.route('/locations', locationsApp);

// Admin & Developer utilities
app.route('/', adminApp);

// Web Push Notifications
app.route('/make-server-28f2f653', webPushApp);

// HBB CRM Module
app.route('/make-server-28f2f653/hbb', hbbApp);

// Session Check-In Module
app.route('/make-server-28f2f653', checkinApp);

// User Upload Management
app.route('/make-server-28f2f653', userUploadApp);

// HQ/Directors Management  
app.route('/make-server-28f2f653', hqDirectorsApp);

// Activity Management  
app.route('/make-server-28f2f653', activityApp);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: c.req.path 
  }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  }, 500);
});

// ============================================================================
// STORAGE INITIALIZATION (Auto-create bucket on startup)
// ============================================================================

// ============================================================================
// DATABASE INITIALIZATION (Auto-setup on startup)
// ============================================================================

// Run optional startup tasks (database verification, KV fix, storage setup).
// These are potentially heavy and can cause cold-start failures if environment
// variables or DB access are not configured. Keep them opt-in so the function
// can boot by default, then enable explicitly when the environment is ready.
if (Deno.env.get('ENABLE_STARTUP') === 'true') {
  (async () => {
    try {
      console.log('[Startup] 🔑 Fixing KV store permissions...');
      const kvResult = await fixKvPermissions();
      if (kvResult.success) {
        console.log('[Startup] ✅ KV store permissions fixed:', kvResult.message);
        if (kvResult.details) console.log('[Startup]   Details:', kvResult.details);
      } else {
        console.warn('[Startup] ⚠️ KV permission fix failed:', kvResult.message);
        if (kvResult.details) console.warn('[Startup]   Details:', kvResult.details);
      }

      console.log('[Startup] 🔍 Verifying database access...');
      const result = await setupDatabase();
      if (result.success) {
        console.log('[Startup] ✅ Database ready:', result.message);
      } else {
        console.warn('[Startup] ⚠️ Database verification failed');
        console.warn('[Startup] Error:', result.error);
        if (result.needsManualSetup) {
          console.log('[Startup] 💡 Manual Setup Required:');
          console.log('[Startup] → Open Supabase Dashboard → Table Editor');
          console.log('[Startup] → Verify all core tables exist');
          console.log('[Startup] → Check app_users, programs, program_fields, submissions');
        }
      }

      console.log('[Startup] 🚐 Setting up van database...');
      const vanResult = await setupVanDatabase();
      if (vanResult.success) {
        console.log('[Startup] ✅ Van database ready:', vanResult.message);
      } else {
        console.warn('[Startup] ⚠️ Van database setup failed');
        console.warn('[Startup] Error:', vanResult.error);
        if (vanResult.needsManualSetup) {
          console.log('[Startup] 💡 Manual Setup Required:');
          console.log('[Startup] → Run SQL script: /database/VAN_DB_COMPLETE_SETUP.sql');
        }
      }

      console.log('[Startup] 🗄️ Initializing storage buckets...');
      const storageResult = await initializeStorageBucket();
      if (storageResult.success) {
        console.log('[Startup] ✅ Storage buckets ready');
        storageResult.results?.forEach((r: any) => {
          console.log(`[Startup]   - ${r.bucket}: ${r.message || 'OK'}`);
        });
      } else {
        console.warn('[Startup] ⚠️ Storage bucket initialization had issues');
      }
    } catch (error) {
      console.error('[Startup] Startup error:', error);
    }
  })();
} else {
  console.log('[Startup] ⚠️ Startup tasks disabled by default (set ENABLE_STARTUP=true to run)');
}

console.log('[Server] Airtel Champions API v3.4.0 - Modularized for Performance');
console.log('[Server] Van Calendar routes mounted at /make-server-28f2f653/van-calendar');
console.log('[Server] ⚠️ IMPORTANT: Run /database/VAN_DB_COMPLETE_SETUP.sql to create van_db table');

Deno.serve(app.fetch);