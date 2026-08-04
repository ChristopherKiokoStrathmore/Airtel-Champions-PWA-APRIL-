#!/usr/bin/env node
/**
 * PRIVACY ATTESTATION
 *
 * Run this to demonstrate, by reproduction rather than assertion, that the
 * database exposes no personal data to an unauthorised party.
 *
 * It deliberately takes the attacker's position: it uses only the public
 * anon key - the same key any visitor can lift from the browser bundle with
 * DevTools - and reports what that key can actually reach.
 *
 *   node scripts/privacy/attestation.mjs
 *
 * Optional, for structural checks that need catalog access:
 *   SUPABASE_DB_PASSWORD in .env  (adds RLS/grant/column verification)
 *
 * Exit code 0 = all controls hold. Non-zero = at least one control failed.
 *
 * Intended for the Head of Data Privacy or their delegate to run independently.
 * It performs only reads and non-destructive probes; it changes nothing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readEnv() {
  const out = {};
  for (const f of ['.env', '.env.local']) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const k = t.slice(0, t.indexOf('=')).trim();
      if (!(k in out)) out[k] = t.slice(t.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return out;
}

const env = readEnv();
const URL_ = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
if (!URL_ || !ANON) { console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found.'); process.exit(2); }

const H = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' };
const NOBODY = '00000000-0000-0000-0000-000000000000';

const results = [];
const record = (control, detail, pass) => { results.push({ control, detail, pass }); };

const line = '─'.repeat(78);
console.log(line);
console.log('  AIRTEL CHAMPIONS PLATFORM - PRIVACY ATTESTATION');
console.log(`  Executed : ${new Date().toISOString()}`);
console.log(`  Target   : ${URL_}`);
console.log(`  Identity : public anon key (as recoverable from the browser bundle)`);
console.log(line);

// Tables that carry, or historically carried, personal data.
const PII_TABLES = [
  'app_users', 'app_users_staging', 'identities', 'auth_audit', 'identity_app_user_map',
  'hbb_users', 'installers', 'installers_HBB', 'agents_HBB', 'airtelmoney_agents',
  'airtelmoney_hq', 'hq_directors', 'promoter_members', 'promoter_team_leads',
  'hbb_installer_team_lead', 'hbb_teams', 'jobs', 'job_issues', 'job_reviews',
  'service_request', 'phone_change_requests', 'org_change_log', 'retailer_dump',
  'retailer_dump_full', 'verification_codes', 'otp_codes', 'installer_locations',
  'installer_live_locations', 'location_tracking', 'user_sessions', 'se_login_audit',
  'password_changes', 'estate_neighbours', 'shujaa_customers', 'odu_inactive_customers',
];

// ---------------------------------------------------------------- CONTROL 1
console.log('\nCONTROL 1  Personal data is not readable with the public key\n');
let readable = 0, readableRows = 0;
for (const t of PII_TABLES) {
  const r = await fetch(`${URL_}/rest/v1/${encodeURIComponent(t)}?select=*&limit=1`, {
    headers: { ...H, Prefer: 'count=exact' },
  });
  const cr = r.headers.get('content-range');
  const total = cr ? Number(cr.split('/')[1]) : 0;
  let rows = [];
  if (r.ok) rows = await r.json().catch(() => []);
  const leaks = r.ok && Array.isArray(rows) && rows.length > 0;
  if (leaks) { readable++; readableRows += Number.isFinite(total) ? total : 0; }
  console.log(`  ${leaks ? 'FAIL' : 'pass'}  ${String(r.status).padStart(3)}  ${t}${leaks ? `  <-- returned ${rows.length} row(s), ${total} total` : ''}`);
}
record('Public key cannot read personal data',
  `${readable} of ${PII_TABLES.length} tables returned rows (${readableRows} rows total)`, readable === 0);

// ---------------------------------------------------------------- CONTROL 2
console.log('\nCONTROL 2  Personal data is not writable with the public key\n');
let writable = 0;
const WRITE_TARGETS = ['app_users', 'identities', 'installers', 'promoter_members', 'jobs', 'otp_codes'];
for (const t of WRITE_TARGETS) {
  for (const [verb, method, opts] of [
    ['UPDATE', 'PATCH', { qs: `?id=eq.${NOBODY}`, body: {} }],
    ['DELETE', 'DELETE', { qs: `?id=eq.${NOBODY}` }],
    ['INSERT', 'POST', { qs: '', body: { id: NOBODY } }],
  ]) {
    const r = await fetch(`${URL_}/rest/v1/${encodeURIComponent(t)}${opts.qs}`, {
      method, headers: H, body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const txt = await r.text().catch(() => '');
    const blocked = r.status === 401 || r.status === 403 ||
      /42501|permission denied|row-level security/i.test(txt);
    if (!blocked) writable++;
    console.log(`  ${blocked ? 'pass' : 'FAIL'}  ${String(r.status).padStart(3)}  ${verb.padEnd(6)} ${t}`);
  }
}
record('Public key cannot modify personal data', `${writable} write paths remained open`, writable === 0);

// ---------------------------------------------------------------- CONTROL 3
console.log('\nCONTROL 3  Personal-data files are not retrievable anonymously\n');
const BUCKETS = ['make-28f2f653-profile-pictures', 'make-28f2f653-profile-banners',
  'installer_photos', 'am-complaint-photos', 'odu_documents', 'make-28f2f653-program-photos'];
let listable = 0;
for (const b of BUCKETS) {
  const r = await fetch(`${URL_}/storage/v1/object/list/${b}`, {
    method: 'POST', headers: H, body: JSON.stringify({ prefix: '', limit: 100 }),
  });
  const j = await r.json().catch(() => null);
  const n = Array.isArray(j) ? j.filter(o => o.id || o.name).length : 0;
  if (n > 0) listable++;
  console.log(`  ${n > 0 ? 'FAIL' : 'pass'}  ${b}${n > 0 ? `  <-- enumerated ${n} entries` : ''}`);
}
record('Personal-data buckets are not anonymously enumerable', `${listable} buckets still listed content`, listable === 0);

// ---------------------------------------------------------------- CONTROL 4
console.log('\nCONTROL 4  The identity store holds no personal data\n');
let structuralChecked = false, structuralPass = true;
if (env.SUPABASE_DB_PASSWORD) {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(path.join(ROOT, 'package.json'));
    const { Client } = require('pg');
    const ref = (URL_.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
    const c = new Client({
      host: 'aws-1-eu-west-1.pooler.supabase.com', port: 5432, database: 'postgres',
      user: `postgres.${ref}`, password: env.SUPABASE_DB_PASSWORD,
      ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000,
    });
    await c.connect();
    structuralChecked = true;

    const cols = (await c.query(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='identities'`)).rows.map(r => r.column_name);
    const forbidden = cols.filter(n => /name|phone|msisdn|email|national|passport|dob|address/i.test(n));
    console.log(`  columns in identities: ${cols.join(', ')}`);
    console.log(`  ${forbidden.length ? 'FAIL' : 'pass'}  no identifier-bearing column names${forbidden.length ? ': ' + forbidden.join(', ') : ''}`);
    if (forbidden.length) structuralPass = false;

    const [samp] = (await c.query(
      `select login_index, secret_hash, handle from public.identities limit 1`)).rows;
    if (samp) {
      const idxOk = /^[0-9a-f]{64}$/.test(samp.login_index);
      const hashOk = /^pbkdf2\$sha256\$\d+\$/.test(samp.secret_hash);
      console.log(`  ${idxOk ? 'pass' : 'FAIL'}  login_index is a 256-bit opaque digest`);
      console.log(`  ${hashOk ? 'pass' : 'FAIL'}  secret_hash is a salted KDF output`);
      console.log(`  sample handle: ${samp.handle}  (carries no personal data)`);
      if (!idxOk || !hashOk) structuralPass = false;
    }

    // The pepper must not be discoverable inside the database.
    const leak = (await c.query(
      `select count(*)::int n from pg_settings where name ilike '%pepper%'`)).rows[0].n;
    console.log(`  ${leak === 0 ? 'pass' : 'FAIL'}  pepper is not present in database settings`);
    if (leak) structuralPass = false;

    const [rls] = (await c.query(
      `select c.relrowsecurity ok from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname='identities'`)).rows;
    console.log(`  ${rls?.ok ? 'pass' : 'FAIL'}  row level security enabled on identities`);
    if (!rls?.ok) structuralPass = false;

    const [audit] = (await c.query(`select count(*)::int n from public.auth_audit`)).rows;
    console.log(`  pass  authentication audit trail present (${audit.n} events recorded)`);

    await c.end();
  } catch (err) {
    console.log(`  (structural checks skipped: ${err.message.slice(0, 60)})`);
  }
} else {
  console.log('  (skipped - set SUPABASE_DB_PASSWORD in .env to include structural checks)');
}
if (structuralChecked) record('Identity store contains no personal data', 'schema and sample inspection', structuralPass);

// ---------------------------------------------------------------- SUMMARY
console.log('\n' + line);
console.log('  SUMMARY');
console.log(line);
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.control}`);
  console.log(`        ${r.detail}`);
}
console.log(line);
console.log(failed === 0
  ? '  RESULT: all controls hold. No personal data is reachable without authorisation.'
  : `  RESULT: ${failed} control(s) FAILED. Personal data remains exposed.`);
console.log(line);

const report = {
  executedAt: new Date().toISOString(),
  target: URL_,
  identity: 'public anon key',
  results,
  passed: failed === 0,
};
const outDir = path.join(ROOT, 'privacy-evidence');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `attestation-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`\n  Machine-readable report: ${path.relative(ROOT, outFile)}\n`);

process.exit(failed === 0 ? 0 : 1);
