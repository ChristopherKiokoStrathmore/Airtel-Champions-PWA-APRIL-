// ============================================================================
// HEALTH CHECK MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Comprehensive health monitoring for production readiness
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { getPool } from "./performance.tsx";
import { circuitBreakers } from "./performance.tsx";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// TYPES
// ============================================================================

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  details?: any;
}

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

// ============================================================================
// INDIVIDUAL HEALTH CHECKS
// ============================================================================

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const { error } = await supabase
      .from('app_users')
      .select('count')
      .limit(1)
      .single();
    
    const latency = Date.now() - start;
    
    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        latency,
        message: `Database error: ${error.message}`
      };
    }
    
    // Check latency
    if (latency > 1000) {
      return {
        name: 'database',
        status: 'degraded',
        latency,
        message: 'Database responding slowly'
      };
    }
    
    return {
      name: 'database',
      status: 'healthy',
      latency,
      message: 'Database connected'
    };
    
  } catch (error: any) {
    return {
      name: 'database',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: `Database unreachable: ${error.message}`
    };
  }
}

/**
 * Check connection pool
 */
async function checkConnectionPool(): Promise<HealthCheck> {
  try {
    const pool = getPool();
    
    return {
      name: 'connection_pool',
      status: 'healthy',
      message: 'Connection pool available',
      details: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error: any) {
    return {
      name: 'connection_pool',
      status: 'degraded',
      message: `Pool error: ${error.message}`
    };
  }
}

/**
 * Check storage availability
 */
async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const { data, error } = await supabase.storage
      .from('submissions-photos')
      .list('', { limit: 1 });
    
    const latency = Date.now() - start;
    
    if (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        latency,
        message: `Storage error: ${error.message}`
      };
    }
    
    return {
      name: 'storage',
      status: 'healthy',
      latency,
      message: 'Storage accessible'
    };
    
  } catch (error: any) {
    return {
      name: 'storage',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: `Storage unreachable: ${error.message}`
    };
  }
}

/**
 * Check KV store
 */
async function checkKVStore(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    const testKey = 'health_check_test';
    const testValue = Date.now().toString();
    
    // Write test
    await kv.set(testKey, testValue);
    
    // Read test
    const { value } = await kv.get(testKey);
    
    // Cleanup
    await kv.del(testKey);
    
    const latency = Date.now() - start;
    
    if (value !== testValue) {
      return {
        name: 'kv_store',
        status: 'degraded',
        latency,
        message: 'KV store read/write mismatch'
      };
    }
    
    return {
      name: 'kv_store',
      status: 'healthy',
      latency,
      message: 'KV store operational'
    };
    
  } catch (error: any) {
    return {
      name: 'kv_store',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: `KV store error: ${error.message}`
    };
  }
}

/**
 * Check circuit breakers status
 */
async function checkCircuitBreakers(): Promise<HealthCheck> {
  const dbState = circuitBreakers.database.getState();
  const storageState = circuitBreakers.storage.getState();
  
  const allClosed = dbState === 'CLOSED' && storageState === 'CLOSED';
  const anyOpen = dbState === 'OPEN' || storageState === 'OPEN';
  
  return {
    name: 'circuit_breakers',
    status: anyOpen ? 'unhealthy' : (allClosed ? 'healthy' : 'degraded'),
    message: `Database: ${dbState}, Storage: ${storageState}`,
    details: {
      database: dbState,
      storage: storageState
    }
  };
}

/**
 * Check API performance
 */
async function checkPerformance(): Promise<HealthCheck> {
  try {
    const { getPerformanceStats } = await import('./performance.tsx');
    const stats = getPerformanceStats();
    
    if (stats.totalRequests === 0) {
      return {
        name: 'performance',
        status: 'healthy',
        message: 'No requests yet'
      };
    }
    
    // Check if p95 latency is acceptable
    const p95Acceptable = stats.p95 < 1000; // 1 second
    const avgAcceptable = stats.avgDuration < 500; // 500ms
    
    const status = (p95Acceptable && avgAcceptable) ? 'healthy' : 'degraded';
    
    return {
      name: 'performance',
      status,
      message: `Avg: ${stats.avgDuration}ms, P95: ${stats.p95}ms`,
      details: {
        avgDuration: stats.avgDuration,
        p50: stats.p50,
        p95: stats.p95,
        p99: stats.p99,
        totalRequests: stats.totalRequests
      }
    };
  } catch (error: any) {
    return {
      name: 'performance',
      status: 'degraded',
      message: 'Performance metrics unavailable'
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheck {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_DB_URL',
    'JWT_SECRET'
  ];
  
  const missing = requiredEnvVars.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'unhealthy',
      message: `Missing env vars: ${missing.join(', ')}`,
      details: { missing }
    };
  }
  
  // Check optional but recommended vars
  const optional = ['FCM_SERVER_KEY', 'REDIS_URL'];
  const missingOptional = optional.filter(key => !Deno.env.get(key));
  
  if (missingOptional.length > 0) {
    return {
      name: 'environment',
      status: 'degraded',
      message: `Optional env vars missing: ${missingOptional.join(', ')}`,
      details: { missingOptional }
    };
  }
  
  return {
    name: 'environment',
    status: 'healthy',
    message: 'All environment variables configured'
  };
}

/**
 * Check system resources
 */
function checkSystemResources(): HealthCheck {
  const memoryUsage = (Deno.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  
  return {
    name: 'system',
    status: 'healthy',
    message: `Memory: ${memoryUsage}MB`,
    details: {
      memoryMB: parseFloat(memoryUsage),
      platform: Deno.build.os,
      arch: Deno.build.arch
    }
  };
}

// ============================================================================
// COMPREHENSIVE HEALTH CHECK
// ============================================================================

const startTime = Date.now();

/**
 * Run all health checks
 * GET /health
 */
export async function performHealthCheck(): Promise<HealthReport> {
  console.log('🏥 Running health checks...');
  
  const checks = await Promise.all([
    checkDatabase(),
    checkConnectionPool(),
    checkStorage(),
    checkKVStore(),
    checkCircuitBreakers(),
    checkPerformance(),
    checkEnvironment(),
    checkSystemResources()
  ]);
  
  // Calculate overall status
  const healthy = checks.filter(c => c.status === 'healthy').length;
  const degraded = checks.filter(c => c.status === 'degraded').length;
  const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthy > 0) {
    overallStatus = 'unhealthy';
  } else if (degraded > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const report: HealthReport = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime,
    checks,
    summary: {
      total: checks.length,
      healthy,
      degraded,
      unhealthy
    }
  };
  
  console.log(`✅ Health check complete: ${overallStatus} (${healthy}/${checks.length} healthy)`);
  
  return report;
}

// ============================================================================
// READINESS CHECK (for Kubernetes/Load Balancers)
// ============================================================================

/**
 * Simple readiness check - is the service ready to accept traffic?
 * GET /ready
 */
export async function checkReadiness(): Promise<{
  ready: boolean;
  message: string;
}> {
  try {
    // Check only critical services
    const { error: dbError } = await supabase
      .from('app_users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      return {
        ready: false,
        message: 'Database not ready'
      };
    }
    
    // Check circuit breakers
    const dbState = circuitBreakers.database.getState();
    if (dbState === 'OPEN') {
      return {
        ready: false,
        message: 'Circuit breakers open'
      };
    }
    
    return {
      ready: true,
      message: 'Service ready'
    };
    
  } catch (error: any) {
    return {
      ready: false,
      message: `Not ready: ${error.message}`
    };
  }
}

// ============================================================================
// LIVENESS CHECK (for Kubernetes)
// ============================================================================

/**
 * Simple liveness check - is the service alive?
 * GET /alive
 */
export function checkLiveness(): {
  alive: boolean;
  message: string;
  uptime: number;
} {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  return {
    alive: true,
    message: 'Service is alive',
    uptime
  };
}

// ============================================================================
// STARTUP CHECK
// ============================================================================

/**
 * Run startup checks - ensures all systems are initialized
 */
export async function performStartupCheck(): Promise<boolean> {
  console.log('🚀 Running startup checks...');
  
  try {
    // Initialize connection pool
    const { initializeConnectionPool } = await import('./performance.tsx');
    initializeConnectionPool();
    console.log('✅ Connection pool initialized');
    
    // Check database
    const { error: dbError } = await supabase
      .from('app_users')
      .select('count')
      .limit(1);
    
    if (dbError) {
      throw new Error(`Database check failed: ${dbError.message}`);
    }
    console.log('✅ Database connected');
    
    // Check storage
    const { error: storageError } = await supabase.storage
      .from('submissions-photos')
      .list('', { limit: 1 });
    
    if (storageError) {
      throw new Error(`Storage check failed: ${storageError.message}`);
    }
    console.log('✅ Storage accessible');
    
    // Check KV store
    await kv.set('startup_check', Date.now().toString());
    await kv.get('startup_check');
    console.log('✅ KV store operational');
    
    console.log('🎉 All startup checks passed!');
    return true;
    
  } catch (error: any) {
    console.error('❌ Startup check failed:', error.message);
    return false;
  }
}

// ============================================================================
// HEALTH CHECK HISTORY
// ============================================================================

const healthHistory: Array<{ timestamp: string; status: string }> = [];
const MAX_HISTORY = 100;

/**
 * Record health check result
 */
export function recordHealthCheck(status: string): void {
  healthHistory.push({
    timestamp: new Date().toISOString(),
    status
  });
  
  // Keep only last N checks
  if (healthHistory.length > MAX_HISTORY) {
    healthHistory.shift();
  }
}

/**
 * Get health check history
 * GET /health/history
 */
export function getHealthHistory(): Array<{ timestamp: string; status: string }> {
  return healthHistory;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const health = {
  performHealthCheck,
  checkReadiness,
  checkLiveness,
  performStartupCheck,
  recordHealthCheck,
  getHealthHistory,
};