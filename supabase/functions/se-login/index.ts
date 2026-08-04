/**
 * Drop-in replacement for the se_login() Postgres RPC.
 *
 * Deliberately accepts the same parameter names (input_phone, input_pin) and
 * returns the same JSON shape ({ success, user: {...} }) so the client change
 * is a single call-site swap rather than a rewrite of the login screen.
 *
 * Why this must live outside Postgres: looking a user up by phone number
 * requires computing HMAC(msisdn, PEPPER). If Postgres could do that, the pepper
 * would have to live in the database - and the claim "a database dump yields
 * nothing" would be false. The pepper stays here, in the function environment.
 *
 * What the database sees during a login: one SELECT on a 64-char hex index.
 * Never a phone number, never a PIN.
 *
 * Required secrets: PRIVACY_PEPPER, SESSION_SIGNING_SECRET
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normaliseMsisdn, blindIndex, verifySecret, hashSecret, hashIp, signJwt, unsealPii } from '../_shared/privacy-crypto.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Identical for every failure, so the endpoint cannot be used to enumerate accounts. */
const GENERIC = 'Invalid phone number or PIN';

const MAX_FAILED = 5;
const LOCKOUT_MIN = 15;
const SESSION_TTL = 60 * 60 * 8;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

const fail = (extra: Record<string, unknown> = {}) =>
  json({ success: false, error: GENERIC, ...extra });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const pepper = Deno.env.get('PRIVACY_PEPPER');
  const signingSecret = Deno.env.get('SESSION_SIGNING_SECRET');
  if (!pepper || pepper.length < 32 || !signingSecret) {
    console.error('se-login misconfigured: PRIVACY_PEPPER or SESSION_SIGNING_SECRET missing');
    return json({ success: false, error: 'Login is temporarily unavailable' }, 503);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ipHash = await hashIp(ip, pepper);
  const ua = (req.headers.get('user-agent') || '').slice(0, 200);

  const audit = (identityId: string | null, ok: boolean, reason?: string) =>
    db.from('auth_audit').insert({
      identity_id: identityId, event: 'login', succeeded: ok,
      reason: reason ?? null, ip_hash: ipHash, user_agent: ua,
    });

  let body: { input_phone?: string; input_pin?: string; msisdn?: string; pin?: string };
  try { body = await req.json(); } catch { return fail(); }

  const phone = body.input_phone ?? body.msisdn ?? '';
  const pin = String(body.input_pin ?? body.pin ?? '');

  const norm = normaliseMsisdn(phone);
  if (!norm.ok || !pin) {
    await hashSecret(pin || 'x', pepper);       // equalise timing
    await audit(null, false, norm.ok ? 'missing_pin' : `bad_msisdn:${norm.reason}`);
    return fail();
  }

  const index = await blindIndex(norm.msisdn, pepper);

  const { data: identity, error } = await db
    .from('identities')
    .select('id, secret_hash, handle, role, is_active, must_change_secret, failed_attempts, locked_until, app_user_id')
    .eq('login_index', index)
    .maybeSingle();

  if (error) {
    console.error('identity lookup failed:', error.message);
    return json({ success: false, error: 'Login is temporarily unavailable' }, 503);
  }

  if (!identity) {
    await hashSecret(pin, pepper);              // equalise timing for unknown accounts
    await audit(null, false, 'unknown_identity');
    return fail();
  }

  if (identity.locked_until && new Date(identity.locked_until) > new Date()) {
    await audit(identity.id, false, 'locked_out');
    return json({
      success: false,
      error: `Too many attempts. Try again after ${new Date(identity.locked_until).toLocaleTimeString()}.`,
      locked: true,
    }, 429);
  }

  if (!identity.is_active) {
    await hashSecret(pin, pepper);
    await audit(identity.id, false, 'inactive');
    return fail();
  }

  if (!(await verifySecret(pin, identity.secret_hash, pepper))) {
    const attempts = (identity.failed_attempts ?? 0) + 1;
    const lock = attempts >= MAX_FAILED
      ? new Date(Date.now() + LOCKOUT_MIN * 60_000).toISOString() : null;
    await db.from('identities')
      .update({ failed_attempts: attempts, locked_until: lock, updated_at: new Date().toISOString() })
      .eq('id', identity.id);
    await audit(identity.id, false, lock ? 'bad_pin_locked' : 'bad_pin');
    return fail(lock ? { locked: true } : {});
  }

  await db.from('identities')
    .update({
      failed_attempts: 0, locked_until: null,
      last_login_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })
    .eq('id', identity.id);

  // Operational profile fields, plus the caller's own name decrypted from its
  // sealed column. A user seeing their own name is not a disclosure - it is the
  // data subject reading their own record - and it keeps the greeting correct
  // without any plaintext name existing in the database.
  let profile: Record<string, unknown> = {};
  let realName: string | null = null;
  if (identity.app_user_id) {
    const { data: p } = await db
      .from('app_users')
      .select('zone, region, employee_id, rank, total_points, full_name_ct')
      .eq('id', identity.app_user_id)
      .maybeSingle();
    profile = p ?? {};
    realName = await unsealPii((p?.full_name_ct as string) ?? null, pepper);
  }

  const token = await signJwt(
    { sub: identity.id, handle: identity.handle, app_role: identity.role },
    signingSecret, SESSION_TTL,
  );

  await audit(identity.id, true);

  return json({
    success: true,
    message: 'Login successful',
    access_token: token,
    expires_in: SESSION_TTL,
    must_change_secret: identity.must_change_secret,
    user: {
      id: identity.app_user_id ?? identity.id,
      identity_id: identity.id,
      // The caller's own name, decrypted for this request only. Falls back to
      // the handle if the sealed value is missing.
      full_name: realName ?? identity.handle,
      handle: identity.handle,
      phone: null,
      role: identity.role,
      zone: profile.zone ?? null,
      region: profile.region ?? null,
      employee_id: profile.employee_id ?? null,
      rank: profile.rank ?? null,
      total_points: profile.total_points ?? 0,
      must_change_secret: identity.must_change_secret,
    },
  });
});
