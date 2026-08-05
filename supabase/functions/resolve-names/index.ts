/**
 * Resolves display names for a set of app_users ids.
 *
 * The database stores names only as AES-GCM ciphertext plus a pseudonymous
 * handle, so no plaintext name exists at rest. UI surfaces that legitimately
 * show other people - leaderboards, team views, top performers - call this
 * endpoint, which decrypts using the pepper held in the function environment.
 *
 * Controls:
 *   - a valid session token is required; anonymous callers get nothing
 *   - the batch is capped, so this cannot be used to bulk-harvest the directory
 *   - every resolution is written to auth_audit, so "who looked up whom" is an
 *     answerable question
 *
 * If a name cannot be decrypted the handle is returned instead, so the UI always
 * has something sensible to render and never shows a raw digest.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { unsealPii, hashIp } from '../_shared/privacy-crypto.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_IDS = 100;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

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
  // Must match whatever se-login signed with. The SUPABASE_ prefix is reserved
  // by the platform, hence PROJECT_JWT_SECRET.
  const signingSecret = Deno.env.get('PROJECT_JWT_SECRET') || Deno.env.get('SESSION_SIGNING_SECRET');
  if (!pepper || !signingSecret) return json({ error: 'Service unavailable' }, 503);

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const claims = token ? await verifyJwt(token, signingSecret) : null;
  if (!claims?.sub) return json({ error: 'Unauthorized' }, 401);

  let body: { ids?: string[] };
  try { body = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.map(String).filter(Boolean))].slice(0, MAX_IDS)
    : [];
  if (!ids.length) return json({ names: {} });

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await db
    .from('app_users')
    .select('id, full_name, full_name_ct')
    .in('id', ids);

  if (error) {
    console.error('resolve-names lookup failed:', error.message);
    return json({ error: 'Lookup failed' }, 500);
  }

  const names: Record<string, string> = {};
  for (const row of data ?? []) {
    const real = await unsealPii(row.full_name_ct as string | null, pepper);
    // full_name now holds the handle, which is the correct fallback.
    names[row.id as string] = real ?? (row.full_name as string) ?? 'USER';
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  await db.from('auth_audit').insert({
    identity_id: claims.sub as string,
    event: 'name_resolution',
    succeeded: true,
    reason: `${ids.length} id(s)`,
    ip_hash: await hashIp(ip, pepper),
    user_agent: (req.headers.get('user-agent') || '').slice(0, 200),
  });

  return json({ names });
});
