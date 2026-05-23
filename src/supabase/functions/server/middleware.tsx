// ============================================================================
// MIDDLEWARE MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles: API Gateway, request validation, auth, rate limiting, monitoring
// ============================================================================

import { Context } from "npm:hono@4";
import { verifyJWT } from "./security.tsx";
import { checkMultiTierRateLimit } from "./security.tsx";
import { validate } from "./validation.tsx";
import { recordMetric } from "./performance.tsx";
import { z } from "npm:zod@3";

// ============================================================================
// API GATEWAY MIDDLEWARE
// ============================================================================

/**
 * Main API Gateway - Handles all incoming requests
 * - Generates request ID
 * - Tracks performance
 * - Adds standard headers
 * - Centralized error handling
 */
export async function apiGateway(c: Context, next: Function) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  // Set request context
  c.set('requestId', requestId);
  c.set('startTime', startTime);
  
  // Log incoming request
  console.log(`[${requestId}] --> ${method} ${path}`);
  
  try {
    await next();
    
    // Log successful response
    const duration = Date.now() - startTime;
    const statusCode = c.res.status;
    
    console.log(`[${requestId}] <-- ${statusCode} (${duration}ms)`);
    
    // Record metrics
    recordMetric({
      endpoint: path,
      method,
      duration,
      statusCode,
      timestamp: new Date().toISOString()
    });
    
    // Add standard response headers
    c.header('X-Request-ID', requestId);
    c.header('X-Response-Time', `${duration}ms`);
    c.header('X-API-Version', 'v1');
    
  } catch (error: any) {
    // Centralized error handling
    const duration = Date.now() - startTime;
    const statusCode = error.statusCode || 500;
    
    console.error(`[${requestId}] ERROR (${duration}ms):`, error.message);
    
    // Record error metric
    recordMetric({
      endpoint: path,
      method,
      duration,
      statusCode,
      timestamp: new Date().toISOString()
    });
    
    // Return error response
    return c.json({
      success: false,
      error: error.message,
      requestId,
      ...(error.validationErrors && { validationErrors: error.validationErrors })
    }, statusCode);
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require authentication for endpoint
 * Usage: app.use('/v1/protected/*', requireAuth)
 */
export async function requireAuth(c: Context, next: Function) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error: any = new Error('Missing or invalid authorization header');
    error.statusCode = 401;
    throw error;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify JWT
    const payload = await verifyJWT(token);
    
    // Set user in context
    c.set('user', {
      id: payload.sub,
      phone: payload.phone,
      role: payload.role
    });
    c.set('userId', payload.sub);
    
    await next();
    
  } catch (error: any) {
    console.error('Authentication failed:', error.message);
    const authError: any = new Error('Invalid or expired token');
    authError.statusCode = 401;
    throw authError;
  }
}

/**
 * Require specific role
 * Usage: app.use('/v1/admin/*', requireRole(['admin', 'super_admin']))
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Function) => {
    const user = c.get('user');
    
    if (!user) {
      const error: any = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }
    
    if (!allowedRoles.includes(user.role)) {
      const error: any = new Error('Insufficient permissions');
      error.statusCode = 403;
      throw error;
    }
    
    await next();
  };
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Apply rate limiting to endpoint
 * Usage: app.post('/v1/expensive', rateLimiter, handler)
 */
export async function rateLimiter(c: Context, next: Function) {
  const user = c.get('user');
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For') || 
             'unknown';
  const endpoint = `${c.req.method} ${c.req.path}`;
  
  if (!user) {
    // For unauthenticated requests, only check IP
    const { allowed, retryAfter } = await checkMultiTierRateLimit(
      'anonymous',
      endpoint,
      ip
    );
    
    if (!allowed) {
      c.header('Retry-After', retryAfter?.toString() || '60');
      const error: any = new Error('Rate limit exceeded');
      error.statusCode = 429;
      throw error;
    }
  } else {
    // For authenticated requests, check all tiers
    const { allowed, reason, retryAfter } = await checkMultiTierRateLimit(
      user.id,
      endpoint,
      ip
    );
    
    if (!allowed) {
      c.header('Retry-After', retryAfter?.toString() || '60');
      const error: any = new Error(reason || 'Rate limit exceeded');
      error.statusCode = 429;
      throw error;
    }
  }
  
  await next();
}

// ============================================================================
// REQUEST VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate request body against Zod schema
 * Usage: app.post('/v1/submit', validateBody(CreateSubmissionSchema), handler)
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Function) => {
    try {
      const body = await c.req.json();
      const result = validate(schema, body);
      
      if (!result.success) {
        const error: any = new Error('Request validation failed');
        error.statusCode = 400;
        error.validationErrors = result.errors;
        throw error;
      }
      
      // Store validated data in context
      c.set('validatedBody', result.data);
      
      await next();
      
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw error;
      }
      
      const validationError: any = new Error('Invalid request body');
      validationError.statusCode = 400;
      throw validationError;
    }
  };
}

/**
 * Validate query parameters
 * Usage: app.get('/v1/list', validateQuery(PaginationSchema), handler)
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async (c: Context, next: Function) => {
    const query = c.req.query();
    const result = validate(schema, query);
    
    if (!result.success) {
      const error: any = new Error('Query validation failed');
      error.statusCode = 400;
      error.validationErrors = result.errors;
      throw error;
    }
    
    // Store validated query in context
    c.set('validatedQuery', result.data);
    
    await next();
  };
}

// ============================================================================
// CORS MIDDLEWARE (Already handled by Hono, but customizable)
// ============================================================================

/**
 * Custom CORS configuration
 */
export const corsConfig = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-app-domain.com'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-Response-Time', 'X-API-Version'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// ============================================================================
// CACHE MIDDLEWARE
// ============================================================================

/**
 * Cache GET responses with ETag
 * Usage: app.get('/v1/data', cacheMiddleware(300), handler)
 */
export function cacheMiddleware(ttlSeconds: number) {
  return async (c: Context, next: Function) => {
    // Only cache GET requests
    if (c.req.method !== 'GET') {
      return await next();
    }
    
    // Generate ETag from URL
    const encoder = new TextEncoder();
    const data = encoder.encode(c.req.url);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const etag = `"${hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)}"`;
    
    // Check If-None-Match header
    const clientEtag = c.req.header('If-None-Match');
    if (clientEtag === etag) {
      return c.body(null, 304); // Not Modified
    }
    
    await next();
    
    // Add cache headers to response
    c.header('ETag', etag);
    c.header('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
    c.header('Vary', 'Authorization');
  };
}

// ============================================================================
// REQUEST SIZE LIMIT MIDDLEWARE
// ============================================================================

/**
 * Limit request body size
 * Usage: app.post('/v1/upload', requestSizeLimit(10 * 1024 * 1024), handler)
 */
export function requestSizeLimit(maxBytes: number) {
  return async (c: Context, next: Function) => {
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      const error: any = new Error(`Request too large (max ${Math.floor(maxBytes / 1024 / 1024)}MB)`);
      error.statusCode = 413;
      throw error;
    }
    
    await next();
  };
}

// ============================================================================
// CONDITIONAL REQUEST MIDDLEWARE
// ============================================================================

/**
 * Handle If-Modified-Since for GET requests
 */
export async function conditionalRequest(c: Context, next: Function) {
  if (c.req.method !== 'GET') {
    return await next();
  }
  
  const ifModifiedSince = c.req.header('If-Modified-Since');
  
  if (ifModifiedSince) {
    // This would need to be implemented per-endpoint with actual data timestamps
    // For now, just pass through
    await next();
  } else {
    await next();
  }
}

// ============================================================================
// SANITIZATION MIDDLEWARE
// ============================================================================

/**
 * Sanitize request data automatically
 * Usage: app.use('/v1/*', sanitizeRequest)
 */
export async function sanitizeRequest(c: Context, next: Function) {
  // This is handled in validation schemas
  // But you can add additional sanitization here if needed
  await next();
}

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

/**
 * Detailed request logging
 * Usage: app.use('/v1/*', requestLogger)
 */
export async function requestLogger(c: Context, next: Function) {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const startTime = Date.now();
  
  console.log({
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    headers: {
      userAgent: c.req.header('User-Agent'),
      contentType: c.req.header('Content-Type'),
      authorization: c.req.header('Authorization') ? 'Bearer ***' : undefined
    },
    timestamp: new Date().toISOString()
  });
  
  await next();
  
  const duration = Date.now() - startTime;
  console.log({
    requestId,
    status: c.res.status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// ERROR RECOVERY MIDDLEWARE
// ============================================================================

/**
 * Graceful error recovery
 */
export async function errorRecovery(c: Context, next: Function) {
  try {
    await next();
  } catch (error: any) {
    // Log error for monitoring
    console.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      requestId: c.get('requestId'),
      path: c.req.path,
      method: c.req.method
    });
    
    // Don't expose internal errors to client
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 
      ? 'Internal server error' 
      : error.message;
    
    return c.json({
      success: false,
      error: message,
      requestId: c.get('requestId')
    }, statusCode);
  }
}

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

/**
 * Add security headers to all responses
 * Usage: app.use('/*', securityHeaders)
 */
export async function securityHeaders(c: Context, next: Function) {
  await next();
  
  // Add security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(self), camera=(self)');
  
  // Don't send server info
  c.header('X-Powered-By', ''); // Remove
}

// ============================================================================
// EXPORTS
// ============================================================================

export const middleware = {
  // Core
  apiGateway,
  
  // Auth
  requireAuth,
  requireRole,
  
  // Rate limiting
  rateLimiter,
  
  // Validation
  validateBody,
  validateQuery,
  
  // CORS
  corsConfig,
  
  // Caching
  cacheMiddleware,
  
  // Security
  requestSizeLimit,
  securityHeaders,
  
  // Logging
  requestLogger,
  
  // Error handling
  errorRecovery,
  
  // Conditional requests
  conditionalRequest,
};
