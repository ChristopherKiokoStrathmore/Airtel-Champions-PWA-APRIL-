/**
 * HBB server-side login.
 *
 * Verifies a phone + PIN against every HBB source table server-side (service
 * role) and, on success, mints a Supabase-compatible JWT (role=authenticated)
 * so the browser can run its subsequent reads authenticated rather than anon.
 * This is what lets app_users (and the rest) be closed to the public key while
 * HBB dashboards keep working.
 *
 * The browser never reads a PIN and never reads these tables for login.
 *
 * Required secrets: PROJECT_JWT_SECRET (or SESSION_SIGNING_SECRET fallback).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { signJwt } from '../_shared/privacy-crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SESSION_TTL = 60 * 60 * 8;

function phoneFormats(phone: string): { text: string[]; numeric: number[] } {
  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const m = cleaned.match(/(\d{9})$/);
  if (!m) return { text: [cleaned], numeric: [] };
  const last9 = m[1];
  return {
    text: [last9, '0' + last9, '+254' + last9, '254' + last9],
    numeric: [Number(last9), Number('254' + last9)].filter(n => !isNaN(n) && n > 0),
  };
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Pick the row whose PIN matches (phone numbers are not unique across HBB tables). */
function matchByPin(rows: any[] | null, pinCol: string, entered: string, def = '1234'): any | null {
  for (const r of rows ?? []) {
    if (String(r?.[pinCol] ?? def).trim() === entered) return r;
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const signingSecret = Deno.env.get('PROJECT_JWT_SECRET') || Deno.env.get('SESSION_SIGNING_SECRET');
  if (!signingSecret) {
    console.error('login misconfigured: PROJECT_JWT_SECRET / SESSION_SIGNING_SECRET missing');
    return json({ error: 'Login is temporarily unavailable' }, 503);
  }

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

  // Resolve the user across every HBB table, in the same precedence the client used.
  const resolve = async (): Promise<any | null> => {
    // 1. INHOUSE_INSTALLER_6TOWNS_MARCH (text phone, PIN col)
    {
      const { data } = await db.from('INHOUSE_INSTALLER_6TOWNS_MARCH').select('*').in('Installer contact', f.text).limit(50);
      const row = matchByPin(data, 'PIN', pin, '');
      if (row) return {
        id: row['id'] ?? row['Installer contact'],
        full_name: row['Installer Name'] ?? row['Name'] ?? row['name'] ?? 'Installer',
        phone_number: row['Installer contact'], role: 'hbb_installer',
        town: row['Town'] ?? row['town'] ?? '', status: row['Status'] ?? row['status'] ?? 'active',
        max_jobs_per_day: row['max_jobs_per_day'] ?? null, source_table: 'INHOUSE_INSTALLER_6TOWNS_MARCH',
      };
    }
    // 2. DSE_14TOWNS (text phone, pin col)
    {
      const { data } = await db.from('DSE_14TOWNS').select('*').in('Phone', f.text).limit(50);
      const row = matchByPin(data, 'pin', pin, '');
      if (row) return {
        id: row['ID'], full_name: row['DSE Name'] ?? 'DSE', phone_number: row['Phone'], role: 'hbb_dse',
        town: row['Town'] ?? '', site_name: row['Site Name'] ?? '', estate_name: row['Estate Name'] ?? '',
        source_table: 'DSE_14TOWNS',
      };
    }
    // 3. installer_supervisor (text phone, pin col, default 1234)
    {
      const { data } = await db.from('installer_supervisor').select('"Installers supervisor", "Phone", pin').in('Phone', f.text).limit(50);
      const row = matchByPin(data, 'pin', pin, '1234');
      if (row) return {
        id: row['Phone'], full_name: row['Installers supervisor'], phone_number: row['Phone'],
        role: 'hbb_installer_supervisor', source_table: 'installer_supervisor',
      };
    }
    // 4. HBB_HQ_TEAM (numeric phone, pin col, ROLE normalised)
    {
      const { data } = await db.from('HBB_HQ_TEAM').select('ID, NAME, PHONE, ROLE, pin').in('PHONE', f.numeric).limit(50);
      const row = matchByPin(data, 'pin', pin, '1234');
      if (row) {
        let role = String(row.ROLE || '').trim().toLowerCase().replace(/\s+/g, '_');
        if (!role.startsWith('hbb_')) role = 'hbb_hq';
        return { id: row.ID, full_name: row.NAME, phone_number: String(row.PHONE), role, source_table: 'HBB_HQ_TEAM' };
      }
    }
    // 5. installers (unified; text phone, pin col, default 1234)
    {
      const { data } = await db.from('installers').select('id, name, phone, pin, town, status, max_jobs_per_day').in('phone', f.text).limit(50);
      const row = matchByPin(data, 'pin', pin, '1234');
      if (row) return {
        id: row.id, full_name: row.name, phone_number: row.phone, role: 'hbb_installer',
        town: row.town ?? '', status: row.status ?? 'active', max_jobs_per_day: row.max_jobs_per_day ?? null,
        source_table: 'installers',
      };
    }
    // 6. agents_HBB (numeric phone, pin col, default 1234)
    {
      const { data } = await db.from('agents_HBB').select('*').in('Agent Mobile Number', f.numeric).limit(50);
      const row = matchByPin(data, 'pin', pin, '1234');
      if (row) {
        const raw = String(row['Agent Mobile Number'] || ''); const last9 = raw.slice(-9);
        return {
          id: raw, full_name: row['Agent Name'] || 'HBB Agent', phone_number: '0' + last9,
          role: 'hbb_agent', agent_type: row['Agent Type'] || 'agent', source_table: 'agents_HBB',
        };
      }
    }
    // 7. GA monthly (text phone, NO pin col -> only default 1234 is accepted)
    if (pin === '1234') {
      for (const t of ['hbb_installer_ga_monthly', 'HBB_INSTALLER_GA_MONTHLY']) {
        const { data } = await db.from(t).select('installer_msisdn, installer_name, town, month_year')
          .in('installer_msisdn', f.text).order('month_year', { ascending: false }).limit(1);
        const row = data?.[0];
        if (row) {
          const msisdn = row['installer_msisdn'] ?? phone;
          return {
            id: msisdn, full_name: row['installer_name'] ?? 'Installer',
            phone_number: String(msisdn).startsWith('0') ? String(msisdn) : '0' + msisdn,
            role: 'hbb_installer', town: row['town'] ?? '', status: 'active', max_jobs_per_day: null,
            source_table: t,
          };
        }
      }
    }
    return null;
  };

  let user: any = null;
  try { user = await resolve(); }
  catch (e: any) { console.error('[HBB login] resolve error:', e?.message); return json({ error: 'Internal server error' }, 500); }

  if (!user) return json({ error: 'Invalid phone number or PIN' }, 401);

  const access_token = await signJwt(
    { sub: String(user.id), app_role: user.role }, signingSecret, SESSION_TTL,
  );

  // access_token + session_token (back-compat with hbbLogin) + all user fields.
  return json({ ...user, access_token, session_token: access_token, expires_in: SESSION_TTL, _loginAt: Date.now() });
});
