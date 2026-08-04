/**
 * Mints short-lived signed URLs for private storage objects.
 *
 * The personal-data buckets are private and grant nothing to anon, so the
 * browser can no longer build a public URL. It asks this function instead,
 * which verifies the caller's session token before signing.
 *
 * Every issued URL is recorded in auth_audit, which turns "who looked at this
 * person's photo" into an answerable question - the evidence a DPO asks for.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hashIp } from '../_shared/privacy-crypto.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Buckets this function will sign for. Anything else is refused outright. */
const ALLOWED_BUCKETS = new Set([
  'make-28f2f653-profile-pictures',
  'make-28f2f653-profile-banners',
  'make-28f2f653-program-photos',
  'program-photos',
  'installer_photos',
  'am-complaint-photos',
  'odu_documents',
  'bazuu-stories',
]);

const URL_TTL_SECONDS = 300;
const MAX_BATCH = 50;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

/** Verifies the HS256 session token minted by auth-login. */
async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sig = Uint8Array.from(
    atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0)
  );
  const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(`${parts[0]}.${parts[1]}`));
  if (!ok) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const pepper = Deno.env.get('PRIVACY_PEPPER');
  const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!pepper || !jwtSecret) return json({ error: 'Service unavailable' }, 503);

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = token ? await verifyJwt(token, jwtSecret) : null;
  if (!claims?.sub) return json({ error: 'Unauthorized' }, 401);

  let body: { bucket?: string; paths?: string[] };
  try { body = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const bucket = String(body.bucket ?? '');
  const paths = Array.isArray(body.paths) ? body.paths.slice(0, MAX_BATCH).map(String) : [];
  if (!ALLOWED_BUCKETS.has(bucket)) return json({ error: 'Unknown bucket' }, 400);
  if (!paths.length) return json({ error: 'No paths supplied' }, 400);

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await db.storage.from(bucket).createSignedUrls(paths, URL_TTL_SECONDS);
  if (error) return json({ error: 'Could not sign' }, 500);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  await db.from('auth_audit').insert({
    identity_id: claims.sub as string,
    event: 'storage_access',
    succeeded: true,
    reason: `${bucket}:${paths.length} object(s)`,
    ip_hash: await hashIp(ip, pepper),
    user_agent: (req.headers.get('user-agent') || '').slice(0, 200),
  });

  return json({
    urls: (data ?? []).map(d => ({ path: d.path, signedUrl: d.signedUrl, error: d.error })),
    expires_in: URL_TTL_SECONDS,
  });
});
