/**
 * Server-side authentication.
 *
 * This function exists so that a phone number and a PIN never reach Postgres.
 * The browser sends them here over TLS; this function converts the phone to a
 * blind index and verifies the PIN against a peppered hash, both using a secret
 * held only in the function environment. Postgres sees an opaque 64-char index
 * and nothing else.
 *
 * It replaces the previous client-side check in LoginPage.tsx, which compared
 * PINs in JavaScript after fetching them with the public anon key - and which
 * forced RLS to stay open across the whole database.
 *
 * Required environment:
 *   PRIVACY_PEPPER            256-bit secret. NEVER stored in the database.
 *   SUPABASE_URL              provided by the platform
 *   SUPABASE_SERVICE_ROLE_KEY provided by the platform
 *   SUPABASE_JWT_SECRET       project JWT secret, so issued tokens satisfy RLS
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  normaliseMsisdn, blindIndex, verifySecret, hashSecret, hashIp, signJwt,
} from '../_shared/privacy-crypto.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Deliberately identical for every failure mode - never reveal which part was wrong. */
const GENERIC_ERROR = 'Invalid phone number or PIN.';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const pepper = Deno.env.get('PRIVACY_PEPPER');
  const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
  if (!pepper || pepper.length < 32 || !jwtSecret) {
    console.error('auth-login misconfigured: PRIVACY_PEPPER or SUPABASE_JWT_SECRET missing');
    return json({ error: 'Authentication is temporarily unavailable.' }, 503);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ipHash = await hashIp(ip, pepper);
  const userAgent = (req.headers.get('user-agent') || '').slice(0, 200);

  const audit = async (
    identityId: string | null, event: string, succeeded: boolean, reason?: string,
  ) => {
    await db.from('auth_audit').insert({
      identity_id: identityId, event, succeeded,
      reason: reason ?? null, ip_hash: ipHash, user_agent: userAgent,
    });
  };

  let body: { msisdn?: string; pin?: string };
  try { body = await req.json(); } catch { return json({ error: GENERIC_ERROR }, 400); }

  const normalised = normaliseMsisdn(body.msisdn);
  const pin = String(body.pin ?? '');

  if (!normalised.ok || !pin) {
    // Burn comparable time so a malformed number is not distinguishable by latency.
    await hashSecret(pin || 'x', pepper);
    await audit(null, 'login', false, normalised.ok ? 'missing_pin' : `bad_msisdn:${normalised.reason}`);
    return json({ error: GENERIC_ERROR }, 401);
  }

  const index = await blindIndex(normalised.msisdn, pepper);

  const { data: identity, error } = await db
    .from('identities')
    .select('id, secret_hash, handle, role, is_active, must_change_secret, failed_attempts, locked_until, app_user_id')
    .eq('login_index', index)
    .maybeSingle();

  if (error) {
    console.error('identity lookup failed', error.message);
    return json({ error: 'Authentication is temporarily unavailable.' }, 503);
  }

  if (!identity) {
    // Unknown account: still pay the KDF cost so response time cannot be used
    // to enumerate which phone numbers are registered.
    await hashSecret(pin, pepper);
    await audit(null, 'login', false, 'unknown_identity');
    return json({ error: GENERIC_ERROR }, 401);
  }

  if (identity.locked_until && new Date(identity.locked_until) > new Date()) {
    await audit(identity.id, 'login', false, 'locked_out');
    return json({
      error: `Too many attempts. Try again after ${new Date(identity.locked_until).toLocaleTimeString()}.`,
      locked: true,
    }, 429);
  }

  if (!identity.is_active) {
    await hashSecret(pin, pepper);
    await audit(identity.id, 'login', false, 'inactive');
    return json({ error: GENERIC_ERROR }, 401);
  }

  const valid = await verifySecret(pin, identity.secret_hash, pepper);

  if (!valid) {
    const attempts = (identity.failed_attempts ?? 0) + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;
    await db.from('identities')
      .update({ failed_attempts: attempts, locked_until: lock, updated_at: new Date().toISOString() })
      .eq('id', identity.id);
    await audit(identity.id, 'login', false, lock ? 'bad_pin_locked' : 'bad_pin');
    return json({ error: GENERIC_ERROR, ...(lock ? { locked: true } : {}) }, 401);
  }

  await db.from('identities')
    .update({
      failed_attempts: 0, locked_until: null,
      last_login_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    .eq('id', identity.id);

  const token = await signJwt(
    { sub: identity.id, handle: identity.handle, app_role: identity.role },
    jwtSecret, SESSION_TTL_SECONDS,
  );

  await audit(identity.id, 'login', true);

  // The response carries no personal data - only the opaque id and the handle.
  return json({
    access_token: token,
    expires_in: SESSION_TTL_SECONDS,
    identity: {
      id: identity.id,
      handle: identity.handle,
      role: identity.role,
      must_change_secret: identity.must_change_secret,
    },
  });
});
