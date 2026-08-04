/**
 * Client-side entry point for the zero-PII login.
 *
 * What changed and why it matters:
 *
 *   Before, LoginPage.tsx fetched a user row with the public anon key and
 *   compared the PIN in JavaScript. That required the browser to be able to
 *   read the PIN, which required RLS to be open, which is what left the whole
 *   database publicly readable.
 *
 *   Now the phone and PIN are posted to an Edge Function. The browser never
 *   reads a credential, so RLS can be closed everywhere.
 *
 * Nothing in this module stores a name, phone number, or email.
 */

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const SESSION_KEY = 'acp.session';

export interface Session {
  accessToken: string;
  expiresAt: number;
  identity: {
    id: string;
    handle: string;
    role: string;
    must_change_secret: boolean;
  };
}

export interface LoginResult {
  ok: boolean;
  session?: Session;
  error?: string;
  locked?: boolean;
  mustChangeSecret?: boolean;
}

export async function login(msisdn: string, pin: string): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_BASE}/auth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ msisdn, pin }),
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' };
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: body.error ?? 'Sign in failed.', locked: !!body.locked };
  }

  const session: Session = {
    accessToken: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 0) * 1000,
    identity: body.identity,
  };
  saveSession(session);

  return { ok: true, session, mustChangeSecret: body.identity?.must_change_secret };
}

export function saveSession(s: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function getSession(): Session | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (!s.accessToken || s.expiresAt <= Date.now()) { clearSession(); return null; }
    return s;
  } catch { clearSession(); return null; }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Authorization header for any request that must run as the signed-in identity. */
export function authHeader(): Record<string, string> {
  const s = getSession();
  return s ? { Authorization: `Bearer ${s.accessToken}` } : {};
}

/**
 * Signed URLs for private storage objects. The personal-data buckets grant
 * nothing to anon, so a public URL can no longer be constructed client-side.
 * URLs expire in five minutes and every issue is audited.
 */
export async function getSignedUrls(
  bucket: string, paths: string[],
): Promise<Record<string, string>> {
  const s = getSession();
  if (!s || !paths.length) return {};

  const res = await fetch(`${FUNCTIONS_BASE}/storage-signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${s.accessToken}`,
    },
    body: JSON.stringify({ bucket, paths }),
  });
  if (!res.ok) return {};

  const body = await res.json().catch(() => ({ urls: [] }));
  const out: Record<string, string> = {};
  for (const u of body.urls ?? []) if (u.signedUrl) out[u.path] = u.signedUrl;
  return out;
}

/** Convenience for a single object. */
export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  const map = await getSignedUrls(bucket, [path]);
  return map[path] ?? null;
}

/**
 * Resolves real display names for app_users ids.
 *
 * Names are not stored in plaintext, so any surface showing other people
 * (leaderboards, team lists, top performers) has to ask for them. Requires a
 * session; anonymous callers receive nothing. Results are cached for the tab so
 * a leaderboard re-render does not re-request the same people.
 */
const nameCache = new Map<string, string>();

export async function resolveNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const id of unique) {
    const hit = nameCache.get(id);
    if (hit) out[id] = hit; else missing.push(id);
  }
  if (!missing.length) return out;

  const s = getSession();
  if (!s) return out;

  try {
    const res = await fetch(`${FUNCTIONS_BASE}/resolve-names`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${s.accessToken}`,
      },
      body: JSON.stringify({ ids: missing.slice(0, 100) }),
    });
    if (!res.ok) return out;
    const body = await res.json();
    for (const [id, name] of Object.entries(body.names ?? {})) {
      nameCache.set(id, String(name));
      out[id] = String(name);
    }
  } catch {
    // Network failure: callers fall back to whatever they already have.
  }
  return out;
}

/** Replaces full_name on a list of records with the resolved real name. */
export async function withResolvedNames<T extends { id: string; full_name?: string }>(
  rows: T[],
): Promise<T[]> {
  if (!rows.length) return rows;
  const names = await resolveNames(rows.map(r => r.id));
  return rows.map(r => (names[r.id] ? { ...r, full_name: names[r.id] } : r));
}
