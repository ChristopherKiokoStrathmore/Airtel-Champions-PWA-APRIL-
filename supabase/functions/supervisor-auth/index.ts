/**
 * In-house installer supervisor login + PIN change (server-side).
 *
 * The supervisor sign-in used to read INHOUSE_INSTALLER_6TOWNS_MARCH with the
 * public anon key and compare the "Supervisor PIN" in the browser, which is why
 * that table (name + phone + plaintext PIN) had to stay anon-readable. This
 * function does the read and the PIN check with the service role instead and
 * mints an authenticated JWT, so INHOUSE can be closed to the public key.
 *
 * Actions (POST body { action, ... }):
 *   login       { number, pin }                 -> { supervisor, access_token }
 *   change-pin  { supervisorId, oldPin, newPin } -> { ok }
 *
 * Required secrets: PROJECT_JWT_SECRET (or SESSION_SIGNING_SECRET fallback),
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { signJwt } from '../_shared/privacy-crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SESSION_TTL = 60 * 60 * 8;
const TABLE = 'INHOUSE_INSTALLER_6TOWNS_MARCH';

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const signingSecret = Deno.env.get('PROJECT_JWT_SECRET') || Deno.env.get('SESSION_SIGNING_SECRET');
  if (!signingSecret) return json({ error: 'Login is temporarily unavailable' }, 503);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const action = String(body.action || 'login');

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  try {
    if (action === 'login') {
      const number = Number(String(body.number ?? '').replace(/\D/g, ''));
      const pin = String(body.pin ?? '').trim();
      if (!number || !pin) return json({ error: 'Supervisor number and PIN required' }, 400);

      // One supervisor number can appear on several installer rows; they share the
      // same Supervisor PIN. Match any row for the number whose PIN matches.
      const { data: rows } = await db.from(TABLE).select('*').eq('Supervisor number', number).limit(200);
      const row = (rows ?? []).find(r => String(r?.['Supervisor PIN'] ?? '').trim() === pin);
      if (!row) return json({ success: false, error: 'Supervisor not found or incorrect PIN' }, 401);

      // Do not send the PIN back to the client. Old-PIN checks happen server-side.
      const { ['Supervisor PIN']: _pin, PIN: _installerPin, ...safe } = row;
      const access_token = await signJwt(
        { sub: String(row.ID), app_role: 'hbb_installer_supervisor' },
        signingSecret, SESSION_TTL,
      );
      return json({ success: true, supervisor: safe, access_token, session_token: access_token, expires_in: SESSION_TTL });
    }

    if (action === 'change-pin') {
      const supervisorId = Number(body.supervisorId);
      const oldPin = String(body.oldPin ?? '').trim();
      const newPin = String(body.newPin ?? '').trim();
      if (!supervisorId || !oldPin || newPin.length < 4) return json({ error: 'Invalid PIN change request' }, 400);

      const { data: row } = await db.from(TABLE).select('ID, "Supervisor PIN"').eq('ID', supervisorId).maybeSingle();
      if (!row) return json({ error: 'Supervisor not found' }, 404);
      if (String(row['Supervisor PIN'] ?? '').trim() !== oldPin) return json({ error: 'Old PIN is incorrect' }, 403);

      const { error } = await db.from(TABLE).update({ 'Supervisor PIN': newPin }).eq('ID', supervisorId);
      if (error) return json({ error: 'Failed to update PIN' }, 500);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e: any) {
    console.error('[supervisor-auth] error:', e?.message);
    return json({ error: 'Internal server error' }, 500);
  }
});
