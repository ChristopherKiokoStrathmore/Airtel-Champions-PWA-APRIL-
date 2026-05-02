// ============================================================================
// SECURITY MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles: JWT, input sanitization, rate limiting, auth protection
// ============================================================================

import { create, verify, decode } from "npm:djwt@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const JWT_SECRET = (() => {
  const secret = Deno.env.get('JWT_SECRET');
  if (!secret) throw new Error('JWT_SECRET environment variable is required but not set');
  return secret;
})();

// ============================================================================
// INPUT SANITIZATION (XSS Protection)
// ============================================================================

/**
 * Sanitize text input to prevent XSS attacks
 * Strips all HTML tags and dangerous characters
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .substring(0, 10000); // Max length protection
}

/**
 * Sanitize HTML input (allows safe tags only)
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove dangerous tags and attributes
  const dangerous = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /onload\s*=/gi,
    /javascript:/gi,
    /<embed/gi,
    /<object/gi,
  ];
  
  let cleaned = input;
  dangerous.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  return cleaned.trim().substring(0, 10000);
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must start with + and have 10-15 digits
  if (!/^\+\d{10,15}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize URL
 */
export function sanitizeURL(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

// ============================================================================
// SQL INJECTION PROTECTION
// ============================================================================

/**
 * Escape SQL string (for raw queries)
 * NOTE: Prefer parameterized queries via Supabase client
 */
export function escapeSQLString(input: string): string {
  return input.replace(/'/g, "''");
}

/**
 * Validate table/column name (prevent SQL injection in dynamic queries)
 */
export function isValidSQLIdentifier(identifier: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

/**
 * Create signed JWT token
 */
export async function createJWT(user: {
  id: string;
  phone: string;
  role: string;
}): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const jwt = await create(
    { alg: 'HS256', typ: 'JWT' },
    {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      iat: Math.floor(Date.now() / 1000),
      iss: 'sales-intelligence-network',
      jti: crypto.randomUUID(), // Unique token ID
    },
    key
  );
  
  return jwt;
}

/**
 * Verify and decode JWT token
 */
export async function verifyJWT(token: string): Promise<any> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  try {
    const payload = await verify(token, key);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    // Check issuer
    if (payload.iss !== 'sales-intelligence-network') {
      throw new Error('Invalid token issuer');
    }
    
    return payload;
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

/**
 * Decode JWT without verification (for debugging only)
 */
export function decodeJWT(token: string): any {
  try {
    return decode(token);
  } catch {
    return null;
  }
}

/**
 * Refresh JWT token
 */
export async function refreshJWT(oldToken: string): Promise<string> {
  // Verify old token
  const payload = await verifyJWT(oldToken);
  
  // Get fresh user data
  const { data: user } = await supabase
    .from('app_users')
    .select('id, phone_number, role, is_active')
    .eq('id', payload.sub)
    .single();
  
  if (!user || !user.is_active) {
    throw new Error('User not found or inactive');
  }
  
  // Create new token
  return await createJWT(user);
}

// ============================================================================
// ADVANCED RATE LIMITING
// ============================================================================

export interface RateLimitConfig {
  points: number;  // Number of points allowed
  duration: number; // Time window in seconds
  blockDuration?: number; // How long to block after exceeding (optional)
}

/**
 * Advanced rate limiting with multiple tiers
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number; remaining: number }> {
  const now = Date.now();
  const windowStart = now - (config.duration * 1000);
  
  // Get existing requests
  let requestsData: any = null;
  try {
    const result = await kv.get(`ratelimit:${key}`);
    requestsData = result?.value;
  } catch (err: any) {
    console.warn(`[Security] KV rate-limit read failed: ${err.message}. Allowing request.`);
    return { allowed: true, remaining: config.points - 1 };
  }
  const requests: number[] = requestsData ? JSON.parse(requestsData as string) : [];
  
  // Filter requests within window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  const remaining = config.points - recentRequests.length;
  
  if (remaining <= 0) {
    // Rate limit exceeded
    const oldestRequest = Math.min(...recentRequests);
    const retryAfter = Math.ceil((oldestRequest + (config.duration * 1000) - now) / 1000);
    
    return {
      allowed: false,
      retryAfter,
      remaining: 0
    };
  }
  
  // Add current request
  recentRequests.push(now);
  
  // Store updated requests
  try {
    await kv.set(`ratelimit:${key}`, JSON.stringify(recentRequests));
  } catch (err: any) {
    console.warn(`[Security] KV rate-limit write failed: ${err.message}.`);
  }
  
  return {
    allowed: true,
    remaining: remaining - 1
  };
}

/**
 * Multi-tier rate limiting
 */
export async function checkMultiTierRateLimit(
  userId: string,
  endpoint: string,
  ip: string
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  // Tier 1: Global user limit (1000 req/hour)
  const userLimit = await checkRateLimit(`user:${userId}`, {
    points: 1000,
    duration: 3600
  });
  
  if (!userLimit.allowed) {
    return {
      allowed: false,
      reason: 'User quota exceeded',
      retryAfter: userLimit.retryAfter
    };
  }
  
  // Tier 2: Endpoint-specific limit
  const endpointLimits: Record<string, RateLimitConfig> = {
    'POST /v1/submissions': { points: 50, duration: 3600 },
    'POST /v1/photos/upload': { points: 100, duration: 3600 },
    'POST /v1/auth/login-pin': { points: 3, duration: 900 }, // 3 per 15 min
    'POST /v1/auth/request-otp': { points: 5, duration: 3600 },
  };
  
  const endpointConfig = endpointLimits[endpoint];
  if (endpointConfig) {
    const endpointLimit = await checkRateLimit(
      `endpoint:${userId}:${endpoint}`,
      endpointConfig
    );
    
    if (!endpointLimit.allowed) {
      return {
        allowed: false,
        reason: 'Endpoint quota exceeded',
        retryAfter: endpointLimit.retryAfter
      };
    }
  }
  
  // Tier 3: Burst protection (20 req/sec)
  const burstLimit = await checkRateLimit(`burst:${userId}`, {
    points: 20,
    duration: 1
  });
  
  if (!burstLimit.allowed) {
    return {
      allowed: false,
      reason: 'Too many requests. Please slow down.',
      retryAfter: burstLimit.retryAfter
    };
  }
  
  // Tier 4: IP-based limit (5000 req/hour)
  const ipLimit = await checkRateLimit(`ip:${ip}`, {
    points: 5000,
    duration: 3600
  });
  
  if (!ipLimit.allowed) {
    return {
      allowed: false,
      reason: 'IP quota exceeded',
      retryAfter: ipLimit.retryAfter
    };
  }
  
  return { allowed: true };
}

/**
 * Aggressive auth rate limiting
 */
export async function checkAuthRateLimit(
  phone: string,
  ip: string,
  success: boolean
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Phone-based limit: 3 attempts per 15 minutes
  const phoneLimit = await checkRateLimit(`auth:phone:${phone}`, {
    points: 3,
    duration: 900
  });
  
  if (!phoneLimit.allowed) {
    // Log suspicious activity
    await logSecurityEvent('RATE_LIMIT_AUTH_PHONE', {
      phone,
      ip,
      timestamp: new Date().toISOString()
    });
    
    return {
      allowed: false,
      retryAfter: phoneLimit.retryAfter
    };
  }
  
  // IP-based limit: 10 attempts per 5 minutes
  const ipLimit = await checkRateLimit(`auth:ip:${ip}`, {
    points: 10,
    duration: 300
  });
  
  if (!ipLimit.allowed) {
    // Log suspicious activity
    await logSecurityEvent('RATE_LIMIT_AUTH_IP', {
      ip,
      timestamp: new Date().toISOString()
    });
    
    return {
      allowed: false,
      retryAfter: ipLimit.retryAfter
    };
  }
  
  // If login failed, increment failure counter
  if (!success) {
    const failureKey = `auth:failures:${phone}`;
    try {
      const { value: failuresData } = await kv.get(failureKey);
      const failures = failuresData ? parseInt(failuresData as string) : 0;
      
      await kv.set(failureKey, (failures + 1).toString());
      
      // After 5 failures, block for 1 hour
      if (failures >= 5) {
        await kv.set(`auth:blocked:${phone}`, 'true');
        
        // Log security event
        await logSecurityEvent('AUTH_BLOCKED', {
          phone,
          failures: failures + 1,
          timestamp: new Date().toISOString()
        });
        
        return {
          allowed: false,
          retryAfter: 3600
        };
      }
    } catch (kvErr: any) {
      console.warn(`[Security] KV auth failure tracking failed: ${kvErr.message}. Allowing request.`);
    }
  } else {
    // Clear failure counter on success
    try { await kv.del(`auth:failures:${phone}`); } catch {}
  }
  
  return { allowed: true };
}

// ============================================================================
// SECURITY EVENT LOGGING
// ============================================================================

/**
 * Log security events to database
 */
async function logSecurityEvent(eventType: string, metadata: any): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      action: eventType,
      metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// ============================================================================
// PASSWORD/PIN HASHING
// ============================================================================

/**
 * Hash PIN using bcrypt-compatible algorithm
 * Note: Deno doesn't have native bcrypt, using scrypt instead
 */
export async function hashPIN(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  // Use PBKDF2 (available in Web Crypto API)
  const key = await crypto.subtle.importKey(
    'raw',
    pinData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify PIN against hash
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  try {
    // Decode hash
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Hash the provided PIN with same salt
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    
    const key = await crypto.subtle.importKey(
      'raw',
      pinData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const computedHash = new Uint8Array(derivedBits);
    
    // Compare hashes
    if (storedHash.length !== computedHash.length) return false;
    
    let match = true;
    for (let i = 0; i < storedHash.length; i++) {
      if (storedHash[i] !== computedHash[i]) {
        match = false;
      }
    }
    
    return match;
  } catch (error) {
    console.error('PIN verification error:', error);
    return false;
  }
}

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Generate API key
 */
export function generateAPIKey(): string {
  const uuid = crypto.randomUUID().replace(/-/g, '');
  return `sk_live_${uuid}`;
}

/**
 * Hash API key for storage
 */
export async function hashAPIKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify API key
 */
export async function verifyAPIKey(apiKey: string): Promise<boolean> {
  const keyHash = await hashAPIKey(apiKey);
  
  const { data: keys } = await supabase
    .from('api_keys')
    .select('key_hash, expires_at, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();
  
  if (!keys) return false;
  
  // Check expiration
  if (keys.expires_at && new Date(keys.expires_at) < new Date()) {
    return false;
  }
  
  return true;
}

// ============================================================================
// SECURE COOKIE GENERATION
// ============================================================================

/**
 * Generate secure cookie string
 */
export function generateSecureCookie(
  name: string,
  value: string,
  maxAge: number = 30 * 24 * 60 * 60
): string {
  const options = [
    `${name}=${value}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
    'Path=/'
  ];
  
  return options.join('; ');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const security = {
  // Sanitization
  sanitizeText,
  sanitizeHTML,
  sanitizePhone,
  sanitizeURL,
  isValidUUID,
  isValidSQLIdentifier,
  escapeSQLString,
  
  // JWT
  createJWT,
  verifyJWT,
  decodeJWT,
  refreshJWT,
  
  // Rate Limiting
  checkRateLimit,
  checkMultiTierRateLimit,
  checkAuthRateLimit,
  
  // Hashing
  hashPIN,
  verifyPIN,
  
  // API Keys
  generateAPIKey,
  hashAPIKey,
  verifyAPIKey,
  
  // Cookies
  generateSecureCookie,
};