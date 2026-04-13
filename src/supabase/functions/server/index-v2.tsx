// ============================================================================
// MAIN SERVER - SALES INTELLIGENCE NETWORK
// Airtel Kenya - 662 Sales Executives
// ============================================================================
// VERSION 2.0 - Production Ready with all 24 critical fixes
// ============================================================================

import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// Import all modules
import * as kv from "./kv_store.tsx";
import { middleware } from "./middleware.tsx";
import { security } from "./security.tsx";
import { performance } from "./performance.tsx";
import { health } from "./health.tsx";
import { offlineSync } from "./offline-sync.tsx";
import { schemas, validate, validateOrThrow } from "./validation.tsx";

// Import existing mobile API
import { mobileAPI } from "./mobile-api.tsx";
import { handleWebhook } from "./webhooks.tsx";

// ============================================================================
// APPLICATION SETUP
// ============================================================================

const app = new Hono();

// Initialize connection pool on startup
performance.initializeConnectionPool();

// Run startup checks
console.log('🚀 Starting server...');
health.performStartupCheck().then((success) => {
  if (success) {
    console.log('✅ Server started successfully');
  } else {
    console.error('⚠️  Server started with warnings');
  }
});

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// 1. Logger
app.use('*', logger(console.log));

// 2. CORS with security headers
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['X-Request-ID', 'X-Response-Time', 'X-API-Version'],
  credentials: true,
  maxAge: 86400
}));

// 3. Security headers
app.use('/*', middleware.securityHeaders);

// 4. API Gateway (request tracking, performance monitoring)
app.use('/make-server-28f2f653/*', middleware.apiGateway);

// ============================================================================
// HEALTH & MONITORING ENDPOINTS
// ============================================================================

/**
 * Comprehensive health check
 * GET /make-server-28f2f653/health
 */
app.get("/make-server-28f2f653/health", async (c) => {
  const report = await health.performHealthCheck();
  health.recordHealthCheck(report.status);
  
  const statusCode = report.status === 'healthy' ? 200 : 
                     report.status === 'degraded' ? 200 : 503;
  
  return c.json(report, statusCode);
});

/**
 * Readiness check (for load balancers)
 * GET /make-server-28f2f653/ready
 */
app.get("/make-server-28f2f653/ready", async (c) => {
  const { ready, message } = await health.checkReadiness();
  return c.json({ ready, message }, ready ? 200 : 503);
});

/**
 * Liveness check (for Kubernetes)
 * GET /make-server-28f2f653/alive
 */
app.get("/make-server-28f2f653/alive", (c) => {
  const result = health.checkLiveness();
  return c.json(result);
});

/**
 * Performance metrics
 * GET /make-server-28f2f653/metrics
 */
app.get("/make-server-28f2f653/metrics", middleware.requireAuth, async (c) => {
  const stats = performance.getPerformanceStats();
  return c.json({
    success: true,
    data: stats
  });
});

/**
 * Health history
 * GET /make-server-28f2f653/health/history
 */
app.get("/make-server-28f2f653/health/history", middleware.requireAuth, (c) => {
  const history = health.getHealthHistory();
  return c.json({
    success: true,
    data: history
  });
});

// ============================================================================
// V1 MOBILE API - AUTHENTICATION
// ============================================================================

/**
 * Request OTP for login
 * POST /make-server-28f2f653/v1/auth/request-otp
 */
app.post(
  "/make-server-28f2f653/v1/auth/request-otp",
  middleware.validateBody(schemas.RequestOTPSchema),
  middleware.rateLimiter,
  async (c) => {
    const { phone } = c.get('validatedBody');
    
    // Check auth rate limit
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const { allowed, retryAfter } = await security.checkAuthRateLimit(phone, ip, false);
    
    if (!allowed) {
      return c.json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter
      }, 429);
    }
    
    // Call existing mobile API function
    const result = await mobileAPI.requestOTP(phone);
    
    return c.json(result);
  }
);

/**
 * Verify OTP and login
 * POST /make-server-28f2f653/v1/auth/verify-otp
 */
app.post(
  "/make-server-28f2f653/v1/auth/verify-otp",
  middleware.validateBody(schemas.VerifyOTPSchema),
  middleware.rateLimiter,
  async (c) => {
    const { phone, code } = c.get('validatedBody');
    
    // Verify OTP
    const result = await mobileAPI.verifyOTP(phone, code);
    
    if (result.success && result.data) {
      // Create signed JWT token
      const token = await security.createJWT({
        id: result.data.user.id,
        phone: result.data.user.phone,
        role: result.data.user.role
      });
      
      // Set secure cookie
      const cookie = security.generateSecureCookie('session', token);
      c.header('Set-Cookie', cookie);
      
      // Record successful auth
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      await security.checkAuthRateLimit(phone, ip, true);
      
      return c.json({
        success: true,
        data: {
          ...result.data,
          accessToken: token
        }
      });
    }
    
    return c.json(result);
  }
);

/**
 * Login with PIN
 * POST /make-server-28f2f653/v1/auth/login-pin
 */
app.post(
  "/make-server-28f2f653/v1/auth/login-pin",
  middleware.validateBody(schemas.LoginPINSchema),
  middleware.rateLimiter,
  async (c) => {
    const { phone, pin } = c.get('validatedBody');
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    
    // Check auth rate limit (aggressive for PIN)
    const { allowed, retryAfter } = await security.checkAuthRateLimit(phone, ip, false);
    
    if (!allowed) {
      return c.json({
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
        retryAfter
      }, 429);
    }
    
    // Verify PIN
    const result = await mobileAPI.loginWithPIN(phone, pin);
    
    if (result.success && result.data) {
      // Create signed JWT
      const token = await security.createJWT({
        id: result.data.user.id,
        phone: result.data.user.phone,
        role: result.data.user.role
      });
      
      // Set secure cookie
      const cookie = security.generateSecureCookie('session', token);
      c.header('Set-Cookie', cookie);
      
      // Record successful auth
      await security.checkAuthRateLimit(phone, ip, true);
      
      return c.json({
        success: true,
        data: {
          ...result.data,
          accessToken: token
        }
      });
    }
    
    // Record failed auth
    await security.checkAuthRateLimit(phone, ip, false);
    
    return c.json(result, 401);
  }
);

/**
 * Refresh JWT token
 * POST /make-server-28f2f653/v1/auth/refresh
 */
app.post(
  "/make-server-28f2f653/v1/auth/refresh",
  middleware.requireAuth,
  async (c) => {
    const currentToken = c.req.header('Authorization')?.substring(7);
    
    if (!currentToken) {
      return c.json({
        success: false,
        error: 'No token provided'
      }, 400);
    }
    
    try {
      const newToken = await security.refreshJWT(currentToken);
      
      return c.json({
        success: true,
        data: {
          accessToken: newToken
        }
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 401);
    }
  }
);

// ============================================================================
// V1 MOBILE API - OFFLINE SYNC
// ============================================================================

/**
 * Sync offline submissions
 * POST /make-server-28f2f653/v1/sync/submissions
 */
app.post(
  "/make-server-28f2f653/v1/sync/submissions",
  middleware.requireAuth,
  middleware.validateBody(schemas.SyncSubmissionsSchema),
  middleware.requestSizeLimit(20 * 1024 * 1024), // 20MB max
  async (c) => {
    const user = c.get('user');
    const { submissions } = c.get('validatedBody');
    
    console.log(`📤 Syncing ${submissions.length} submissions for user ${user.id}`);
    
    const result = await offlineSync.syncSubmissions(user.id, submissions);
    
    return c.json(result);
  }
);

/**
 * Get sync status and updates
 * GET /make-server-28f2f653/v1/sync/status
 */
app.get(
  "/make-server-28f2f653/v1/sync/status",
  middleware.requireAuth,
  middleware.cacheMiddleware(60), // 1 minute cache
  async (c) => {
    const user = c.get('user');
    const since = c.req.query('since');
    
    const result = await offlineSync.getSyncStatus(user.id, since);
    
    return c.json(result);
  }
);

/**
 * Resolve sync conflict
 * POST /make-server-28f2f653/v1/sync/resolve-conflict
 */
app.post(
  "/make-server-28f2f653/v1/sync/resolve-conflict",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const { clientId, strategy } = await c.req.json();
    
    if (!['use_server', 'use_client', 'merge'].includes(strategy)) {
      return c.json({
        success: false,
        error: 'Invalid resolution strategy'
      }, 400);
    }
    
    const result = await offlineSync.resolveConflict(user.id, clientId, strategy);
    
    return c.json(result);
  }
);

/**
 * Get sync history
 * GET /make-server-28f2f653/v1/sync/history
 */
app.get(
  "/make-server-28f2f653/v1/sync/history",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '50');
    
    const result = await offlineSync.getSyncHistory(user.id, limit);
    
    return c.json(result);
  }
);

/**
 * Retry failed syncs
 * POST /make-server-28f2f653/v1/sync/retry
 */
app.post(
  "/make-server-28f2f653/v1/sync/retry",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const { clientIds } = await c.req.json();
    
    const result = await offlineSync.retryFailedSyncs(user.id, clientIds);
    
    return c.json(result);
  }
);

/**
 * Create resumable upload URL
 * POST /make-server-28f2f653/v1/sync/upload-url
 */
app.post(
  "/make-server-28f2f653/v1/sync/upload-url",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const { fileName } = await c.req.json();
    
    const result = await offlineSync.createResumableUploadURL(user.id, fileName);
    
    return c.json(result);
  }
);

/**
 * Complete resumable upload
 * POST /make-server-28f2f653/v1/sync/upload-complete
 */
app.post(
  "/make-server-28f2f653/v1/sync/upload-complete",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const { fileName } = await c.req.json();
    
    const result = await offlineSync.completeResumableUpload(user.id, fileName);
    
    return c.json(result);
  }
);

// ============================================================================
// V1 MOBILE API - DEVICE MANAGEMENT
// ============================================================================

/**
 * Register device for push notifications
 * POST /make-server-28f2f653/v1/devices/register
 */
app.post(
  "/make-server-28f2f653/v1/devices/register",
  middleware.requireAuth,
  middleware.validateBody(schemas.RegisterDeviceSchema),
  async (c) => {
    const user = c.get('user');
    const { token, platform } = c.get('validatedBody');
    
    try {
      // Upsert device token
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform,
          is_active: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        });
      
      if (error) throw error;
      
      return c.json({
        success: true,
        message: 'Device registered successfully'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  }
);

/**
 * Unregister device
 * POST /make-server-28f2f653/v1/devices/unregister
 */
app.post(
  "/make-server-28f2f653/v1/devices/unregister",
  middleware.requireAuth,
  async (c) => {
    const user = c.get('user');
    const { token } = await c.req.json();
    
    try {
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('token', token);
      
      if (error) throw error;
      
      return c.json({
        success: true,
        message: 'Device unregistered successfully'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  }
);

// ============================================================================
// EXISTING MOBILE API ROUTES (IMPORT FROM mobile-api.tsx)
// ============================================================================

// Mount existing mobile API endpoints with auth middleware
app.use('/make-server-28f2f653/v1/*', middleware.requireAuth);

// Import and mount all existing mobile API routes
// These are now protected by the requireAuth middleware above
app.get("/make-server-28f2f653/v1/missions/available", async (c) => {
  const result = await mobileAPI.getAvailableMissions();
  return c.json(result);
});

app.get("/make-server-28f2f653/v1/submissions/my", async (c) => {
  const user = c.get('user');
  const params = c.req.query();
  const result = await mobileAPI.getMySubmissions(user.id, params);
  return c.json(result);
});

app.get("/make-server-28f2f653/v1/leaderboard", 
  middleware.cacheMiddleware(300), // 5 min cache
  async (c) => {
    const params = c.req.query();
    const result = await mobileAPI.getLeaderboard(params);
    return c.json(result);
  }
);

app.get("/make-server-28f2f653/v1/achievements/my", async (c) => {
  const user = c.get('user');
  const result = await mobileAPI.getMyAchievements(user.id);
  return c.json(result);
});

app.get("/make-server-28f2f653/v1/users/me", async (c) => {
  const user = c.get('user');
  const result = await mobileAPI.getMyProfile(user.id);
  return c.json(result);
});

app.get("/make-server-28f2f653/v1/challenges/active", async (c) => {
  const user = c.get('user');
  const result = await mobileAPI.getActiveChallenges(user.id);
  return c.json(result);
});

// ============================================================================
// WEBHOOKS
// ============================================================================

app.post("/make-server-28f2f653/webhooks/:event", async (c) => {
  const event = c.req.param('event');
  const payload = await c.req.json();
  
  const result = await handleWebhook(event, payload);
  
  return c.json(result);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('❌ Unhandled error:', err);
  
  const requestId = c.get('requestId');
  const statusCode = (err as any).statusCode || 500;
  
  return c.json({
    success: false,
    error: statusCode === 500 ? 'Internal server error' : err.message,
    requestId
  }, statusCode);
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    path: c.req.path
  }, 404);
});

// ============================================================================
// START SERVER
// ============================================================================

console.log('🚀 Sales Intelligence Network API - v2.0');
console.log('📱 Mobile-first, offline-capable, production-ready');
console.log('');
console.log('Features enabled:');
console.log('  ✅ Signed JWT authentication');
console.log('  ✅ Input validation (Zod)');
console.log('  ✅ Multi-tier rate limiting');
console.log('  ✅ Connection pooling');
console.log('  ✅ Circuit breakers');
console.log('  ✅ Offline sync');
console.log('  ✅ Resumable uploads');
console.log('  ✅ Push notifications');
console.log('  ✅ Comprehensive health checks');
console.log('  ✅ Performance monitoring');
console.log('  ✅ Security headers');
console.log('');

Deno.serve(app.fetch);
