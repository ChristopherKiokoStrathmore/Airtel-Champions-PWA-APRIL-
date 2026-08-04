import { createClient } from '@supabase/supabase-js';

// Singleton Supabase client to prevent multiple instances
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
    'Please set these in your .env file.'
  );
}

// Check if client already exists in window to prevent duplicates
declare global {
  interface Window {
    __AIRTEL_CHAMPIONS_SUPABASE_CLIENT__?: any;
  }
}

// Create or return existing singleton instance
if (!window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__) {
  // Singleton client creation - logging removed for production
  window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Disable session persistence to avoid conflicts
      storageKey: 'airtel-champions-auth', // Unique storage key to prevent conflicts
      autoRefreshToken: false, // Disable auto-refresh since we're not using auth sessions
      detectSessionInUrl: false, // Don't look for auth tokens in URL
    },
  });
} else {
  // Reusing existing singleton client - logging removed for production
}

/**
 * Display-name resolution for app_users queries.
 *
 * app_users.full_name holds a pseudonymous handle (e.g. SALESE-4BVR8); the real
 * name exists only as ciphertext in full_name_ct, and the decryption key is not
 * in the database. Without this, every screen that renders a name - leaderboards,
 * dashboards, directories, 51 components in total - would show a handle.
 *
 * Resolution is attached here rather than at each call site because all 130
 * import sites share this one client, and patching ~15 query sites individually
 * would leave the rest silently wrong the next time someone adds a query.
 *
 * Behaviour:
 *   - only app_users queries are touched; everything else is untouched
 *   - requires a session, so signed-out callers resolve nothing
 *   - names are cached per tab, so repeated renders cost no extra requests
 *   - any failure is swallowed and the handle is kept, so a resolution problem
 *     can never break a query that would otherwise have succeeded
 */
function attachNameResolution(client: any): any {
  if (!client || client.__nameResolutionAttached) return client;

  const originalFrom = client.from.bind(client);

  client.from = (table: string, ...rest: any[]) => {
    const queryBuilder = originalFrom(table, ...rest);
    if (table !== 'app_users') return queryBuilder;

    const originalSelect = queryBuilder.select?.bind(queryBuilder);
    if (!originalSelect) return queryBuilder;

    queryBuilder.select = (...selectArgs: any[]) => {
      const filterBuilder = originalSelect(...selectArgs);
      const originalThen = filterBuilder.then?.bind(filterBuilder);
      if (!originalThen) return filterBuilder;

      filterBuilder.then = (onFulfilled: any, onRejected: any) =>
        originalThen(async (result: any) => {
          try {
            if (result?.data) {
              // Imported lazily: this module is loaded very early, and the auth
              // helper depends on session storage being available.
              const { withResolvedNames } = await import('../../lib/privacy/auth-client');
              result.data = Array.isArray(result.data)
                ? await withResolvedNames(result.data)
                : (await withResolvedNames([result.data]))[0];
            }
          } catch {
            // Keep the handle rather than failing the query.
          }
          return onFulfilled ? onFulfilled(result) : result;
        }, onRejected);

      return filterBuilder;
    };

    return queryBuilder;
  };

  client.__nameResolutionAttached = true;
  return client;
}

export const supabase = attachNameResolution(window.__AIRTEL_CHAMPIONS_SUPABASE_CLIENT__);

// Getter function for compatibility
export function getSupabaseClient() {
  return supabase;
}

// Export credentials for direct use if needed
export { SUPABASE_URL, SUPABASE_ANON_KEY };