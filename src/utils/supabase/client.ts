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

/**
 * Sends the signed-in user's session token on every database request.
 *
 * Without this, every query reaches Postgres as the anonymous public role with
 * no identity attached, so row level security has nobody to authorise and the
 * only workable policy is "allow everyone". That is why the tables had to stay
 * open.
 *
 * The token is minted at sign-in by the se-login Edge Function and signed with
 * the project JWT secret, so PostgREST accepts it as `authenticated` and
 * `auth.uid()` resolves to the caller. `apikey` is left untouched because
 * Supabase still requires it for routing.
 *
 * Signed-out callers fall through unchanged and remain anonymous, which is the
 * correct posture once anon grants are revoked.
 */
function authedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let token: string | null = null;
  try {
    const raw = localStorage.getItem('acp.session');
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.accessToken && (!s.expiresAt || s.expiresAt > Date.now())) token = s.accessToken;
    }
  } catch {
    // Storage unavailable or malformed: stay anonymous rather than fail the call.
  }
  if (!token) return fetch(input, init);

  const headers = new Headers(init?.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('apikey')) headers.set('apikey', SUPABASE_ANON_KEY);

  return fetch(input, { ...init, headers }).then((res) => {
    // A token signed with a retired secret is rejected outright, which would
    // otherwise break every request until the user happened to sign in again.
    // Drop the stale session and retry as an anonymous caller so the app keeps
    // working; the next sign-in issues a valid token.
    if (res.status === 401) {
      try { localStorage.removeItem('acp.session'); } catch { /* ignore */ }
      const retry = new Headers(init?.headers || {});
      if (!retry.has('apikey')) retry.set('apikey', SUPABASE_ANON_KEY);
      retry.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      return fetch(input, { ...init, headers: retry });
    }
    return res;
  });
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
    global: { fetch: authedFetch },
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