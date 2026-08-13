/**
 * Airtel Money server-side login.
 *
 * Verifies phone + PIN against airtelmoney_agents and airtelmoney_hq server-side
 * (service role) and mints an authenticated JWT, so AM sessions read as
 * `authenticated` and the credential tables can be closed to the public key.
 *
 * Required secrets: PROJECT_JWT_SECRET (or SESSION_SIGNING_SECRET fallback).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { signJwt, unsealPii } from '../_shared/privacy-crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const SESSION_TTL = 60 * 60 * 8;

function phoneFormats(phone: string): string[] {
  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const m = cleaned.match(/(\d{9})$/);
  const last9 = m ? m[1] : cleaned;
  return [last9, '0' + last9, '+254' + last9, '254' + last9];
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const signingSecret = Deno.env.get('PROJECT_JWT_SECRET') || Deno.env.get('SESSION_SIGNING_SECRET');
  if (!signingSecret) return json({ error: 'Login is temporarily unavailable' }, 503);

  let phone = '', pin = '';
  try { ({ phone, pin } = await req.json()); } catch { return json({ error: 'phone and pin required' }, 400); }
  if (!phone || !pin) return json({ error: 'phone and pin required' }, 400);
  pin = String(pin).trim();

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const f = phoneFormats(phone);

  const mint = async (user: any) => {
    const access_token = await signJwt({ sub: String(user.id), app_role: user.role }, signingSecret, SESSION_TTL);
    return json({ success: true, ...user, access_token, session_token: access_token, expires_in: SESSION_TTL, _loginAt: Date.now() });
  };

  try {
    // 1. Agents
    const { data: agents } = await db.from('airtelmoney_agents').select('*').in('phone', f).limit(50);
    const agent = (agents ?? []).find(r => String(r?.pin ?? '').trim() === pin);
    if (agent) return await mint({ ...agent, role: 'airtel_money_agent' });

    // 2. HQ admins: table AIRTELMONEY_HQ, phone in numeric `number`, PIN col,
    //    Name sealed (Name_ct). Unseal the admin's own name for display.
    const numeric = Array.from(new Set(f.map(x => Number(String(x).replace(/\D/g, ''))).filter(n => !isNaN(n) && n > 0)));
    const { data: admins } = await db.from('AIRTELMONEY_HQ').select('*').in('number', numeric).limit(50);
    const admin = (admins ?? []).find(r => String(r?.PIN ?? r?.pin ?? '').trim() === pin);
    if (admin) {
      let name = 'HQ Admin';
      const pepper = Deno.env.get('PRIVACY_PEPPER');
      if (pepper && admin.Name_ct) name = (await unsealPii(admin.Name_ct, pepper)) ?? 'HQ Admin';
      return await mint({ id: admin.id, full_name: name, phone, role: 'airtel_money_admin' });
    }
  } catch (e: any) {
    console.error('[am-login] error:', e?.message);
    return json({ error: 'Internal server error' }, 500);
  }

  return json({ success: false, error: 'Invalid phone number or PIN' }, 401);
});
