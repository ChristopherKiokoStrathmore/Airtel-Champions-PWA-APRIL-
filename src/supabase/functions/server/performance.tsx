// ============================================================================
// PERFORMANCE MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles: Connection pooling, caching, circuit breakers, query optimization
// ============================================================================

import { Pool, PoolClient } from "npm:pg@8";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// ============================================================================
// DATABASE CONNECTION POOL
// ============================================================================

let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export function initializeConnectionPool(): Pool {
  if (pool) return pool;
  
  pool = new Pool({
    connectionString: Deno.env.get('SUPABASE_DB_URL'),
    max: 20, // Maximum 20 connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Timeout connection attempts after 2s
    allowExitOnIdle: false,
  });
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });
  
  console.log('✅ Database connection pool initialized');
  
  return pool;
}

/**
 * Get database pool
 */
export function getPool(): Pool {
  if (!pool) {
    return initializeConnectionPool();
  }
  return pool;
}

/**
 * Execute query with connection pool
 */
export async function queryWithPool<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } finally {
    client.release();
  }
}

/**
 * Execute transaction with connection pool
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// QUERY TIMEOUT PROTECTION
// ============================================================================

/**
 * Execute query with timeout
 */
export async function queryWithTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = 5000,
  queryName: string = 'unknown'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timeout: ${queryName} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message.includes('Query timeout')) {
      console.error(`⏱️ Query timeout: ${queryName}`);
      // Log slow query
      await logSlowQuery(queryName, timeoutMs);
    }
    throw error;
  }
}

async function logSlowQuery(queryName: string, duration: number): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await supabase.from('audit_logs').insert({
      action: 'SLOW_QUERY',
      metadata: {
        queryName,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch {
    // Ignore logging errors
  }
}

// ============================================================================
// CACHING LAYER
// ============================================================================

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

/**
 * Generic cache wrapper using KV store
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<{ data: T; cached: boolean }> {
  // Check cache
  const cacheKey = `cache:${key}`;
  try {
    const { value: cachedData } = await kv.get(cacheKey);
    if (cachedData) {
      return {
        data: JSON.parse(cachedData as string) as T,
        cached: true
      };
    }
  } catch (err: any) {
    console.warn(`[Performance] KV cache read failed: ${err.message}. Skipping cache.`);
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache (fire and forget)
  kv.set(cacheKey, JSON.stringify(data)).catch(err => {
    console.warn('[Performance] Cache set error (KV permission?):', err.message);
  });
  
  // Set expiration
  setTimeout(async () => {
    try { await kv.del(cacheKey); } catch {}
  }, options.ttl * 1000);
  
  return {
    data,
    cached: false
  };
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string): Promise<void> {
  try { await kv.del(`cache:${key}`); } catch (err: any) {
    console.warn(`[Performance] KV invalidateCache failed: ${err.message}.`);
  }
}

/**
 * Invalidate cache by prefix
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  try {
    const allKeys = await kv.getByPrefix(`cache:${prefix}`);
    if (allKeys && Array.isArray(allKeys)) {
      const deletePromises = allKeys.map((entry: any) => kv.del(entry.key || entry).catch(() => {}));
      await Promise.all(deletePromises);
    }
  } catch (err: any) {
    console.warn(`[Performance] KV invalidateCacheByPrefix failed: ${err.message}.`);
  }
}

// ============================================================================
// CIRCUIT BREAKER PATTERN
// ============================================================================

export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private options: {
      failureThreshold: number; // Number of failures before opening
      successThreshold: number; // Number of successes to close again
      timeout: number; // Timeout in ms
      resetTimeout: number; // Time before trying again (ms)
    }
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should try again
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔵 Circuit breaker: HALF-OPEN (testing)');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Circuit breaker timeout')), this.options.timeout);
    });
    
    return await Promise.race([fn(), timeoutPromise]);
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('🟢 Circuit breaker: CLOSED (recovered)');
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.successCount = 0;
      console.error('🔴 Circuit breaker: OPEN (too many failures)');
      
      // Log circuit breaker event
      this.logCircuitBreakerEvent('OPEN');
    }
  }
  
  private async logCircuitBreakerEvent(state: string): Promise<void> {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      await supabase.from('audit_logs').insert({
        action: 'CIRCUIT_BREAKER_STATE_CHANGE',
        metadata: {
          state,
          failureCount: this.failureCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch {
      // Ignore logging errors
    }
  }
  
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}

// Create circuit breakers for different services
export const circuitBreakers = {
  database: new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000
  }),
  
  storage: new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 60000
  }),
};

// ============================================================================
// GRACEFUL DEGRADATION
// ============================================================================

/**
 * Execute with fallback
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<{ data: T; degraded: boolean }> {
  try {
    const data = await primary();
    return { data, degraded: false };
  } catch (error: any) {
    if (errorHandler) {
      errorHandler(error);
    }
    
    console.warn('⚠️ Primary function failed, using fallback:', error.message);
    
    try {
      const data = await fallback();
      return { data, degraded: true };
    } catch (fallbackError: any) {
      console.error('❌ Both primary and fallback failed:', fallbackError.message);
      throw fallbackError;
    }
  }
}

/**
 * Execute with multiple fallbacks
 */
export async function withMultipleFallbacks<T>(
  strategies: Array<() => Promise<T>>
): Promise<{ data: T; strategyIndex: number }> {
  for (let i = 0; i < strategies.length; i++) {
    try {
      const data = await strategies[i]();
      return { data, strategyIndex: i };
    } catch (error: any) {
      if (i === strategies.length - 1) {
        // Last strategy failed
        throw error;
      }
      console.warn(`Strategy ${i} failed, trying next:`, error.message);
    }
  }
  
  throw new Error('All strategies failed');
}

// ============================================================================
// CURSOR-BASED PAGINATION
// ============================================================================

export interface CursorPaginationParams {
  limit: number;
  cursor?: string; // Timestamp or ID
  orderBy: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Helper for cursor-based pagination
 */
export function buildCursorQuery(params: CursorPaginationParams): string {
  const { limit, cursor, orderBy, orderDirection = 'desc' } = params;
  
  let query = '';
  
  if (cursor) {
    const operator = orderDirection === 'desc' ? '<' : '>';
    query += ` WHERE ${orderBy} ${operator} '${cursor}'`;
  }
  
  query += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`;
  query += ` LIMIT ${limit + 1}`; // Fetch 1 extra to check if more exist
  
  return query;
}

/**
 * Process cursor pagination results
 */
export function processCursorResults<T extends Record<string, any>>(
  results: T[],
  limit: number,
  cursorField: string
): CursorPaginationResult<T> {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore && data.length > 0
    ? data[data.length - 1][cursorField]
    : null;
  
  return {
    data,
    nextCursor,
    hasMore
  };
}

// ============================================================================
// QUERY OPTIMIZATION HELPERS
// ============================================================================

/**
 * Batch queries to reduce round trips
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  return await Promise.all(queries);
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: string;
}

const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Record performance metric
 */
export function recordMetric(metric: PerformanceMetrics): void {
  performanceMetrics.push(metric);
  
  // Keep only last 1000 metrics in memory
  if (performanceMetrics.length > 1000) {
    performanceMetrics.shift();
  }
  
  // Log slow requests
  if (metric.duration > 1000) {
    console.warn(`⏱️ Slow request: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  avgDuration: number;
  p50: number;
  p95: number;
  p99: number;
  totalRequests: number;
} {
  if (performanceMetrics.length === 0) {
    return {
      avgDuration: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      totalRequests: 0
    };
  }
  
  const durations = performanceMetrics.map(m => m.duration).sort((a, b) => a - b);
  const total = durations.reduce((sum, d) => sum + d, 0);
  
  return {
    avgDuration: Math.round(total / durations.length),
    p50: durations[Math.floor(durations.length * 0.5)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)],
    totalRequests: performanceMetrics.length
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const performance = {
  // Connection pool
  initializeConnectionPool,
  getPool,
  queryWithPool,
  transaction,
  
  // Query optimization
  queryWithTimeout,
  batchQueries,
  
  // Caching
  cached,
  invalidateCache,
  invalidateCacheByPrefix,
  
  // Circuit breaker
  CircuitBreaker,
  circuitBreakers,
  
  // Graceful degradation
  withFallback,
  withMultipleFallbacks,
  
  // Pagination
  buildCursorQuery,
  processCursorResults,
  
  // Monitoring
  recordMetric,
  getPerformanceStats,
  
  // Utilities
  debounce,
};