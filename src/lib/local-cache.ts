/**
 * localStorage-based persistent cache with TTL
 * Survives page refreshes — reduces DB load for heavy read data.
 *
 * Usage:
 *   import { localCache } from '../lib/local-cache';
 *
 *   // Simple get/set
 *   localCache.set('key', data, 10 * 60 * 1000); // 10 min TTL
 *   const cached = localCache.get<MyType>('key');
 *
 *   // Fetch-with-cache pattern (recommended)
 *   const data = await localCache.fetchWithCache('key', fetcherFn, TTL_MS);
 */

const CACHE_PREFIX = 'ac_cache_';

interface CacheEntry<T> {
  data: T;
  ts: number;   // timestamp when cached
  ttl: number;  // time-to-live in ms
}

class LocalCache {
  /**
   * Store a value in localStorage with TTL
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    try {
      const entry: CacheEntry<T> = { data, ts: Date.now(), ttl };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // localStorage full or not available — silently skip
      console.debug('[LocalCache] Could not write:', key, e);
    }
  }

  /**
   * Retrieve a value — returns null if missing or expired
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      // Expired?
      if (Date.now() - entry.ts > entry.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Check if a key exists and is fresh
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific cache key
   */
  delete(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  /**
   * Remove all keys matching a prefix (e.g. 'programs_')
   */
  deleteByPrefix(prefix: string): void {
    const fullPrefix = CACHE_PREFIX + prefix;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  /**
   * Clear all cache entries (leaves other localStorage data untouched)
   */
  clearAll(): void {
    this.deleteByPrefix('');
  }

  /**
   * Fetch-with-cache: return cached data if fresh, otherwise call fetcher and cache the result.
   * Optionally returns stale data immediately while re-fetching in background (stale-while-revalidate).
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000,
    options?: { staleWhileRevalidate?: boolean; onRevalidated?: (data: T) => void }
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      // If stale-while-revalidate, fire off background refresh
      if (options?.staleWhileRevalidate) {
        fetcher().then(freshData => {
          this.set(key, freshData, ttl);
          options.onRevalidated?.(freshData);
        }).catch(() => { /* silent background failure */ });
      }
      return cached;
    }

    // No cache — fetch fresh
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Get the age of a cache entry in seconds (for debugging/UI)
   */
  getAge(key: string): number | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      return Math.round((Date.now() - entry.ts) / 1000);
    } catch {
      return null;
    }
  }
}

export const localCache = new LocalCache();

// Cache TTL constants (centralized)
export const CACHE_TTL = {
  TOP_PERFORMERS: 10 * 60 * 1000,   // 10 minutes
  PROGRAMS_LIST:  15 * 60 * 1000,    // 15 minutes
  PROGRAM_FIELDS: 15 * 60 * 1000,    // 15 minutes
  SHOPS_BULK:     30 * 60 * 1000,    // 30 minutes
  ANNOUNCEMENTS:  5  * 60 * 1000,    // 5 minutes
  USER_PROFILE:   5  * 60 * 1000,    // 5 minutes
} as const;
