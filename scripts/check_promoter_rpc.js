#!/usr/bin/env node

const fs = require('fs');

function readEnvValue(key) {
  const envPath = '.env';
  if (!fs.existsSync(envPath)) return '';

  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find(entry => entry.startsWith(`${key}=`));

  return line ? line.split('=').slice(1).join('=').trim() : '';
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || readEnvValue('VITE_SUPABASE_URL');
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || readEnvValue('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(2);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/promoter_add_member`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_team_lead_id: '00000000-0000-0000-0000-000000000000',
      p_promoter_name: 'Smoke Test',
      p_msisdn: '0712345678',
    }),
  });

  const body = await response.text();

  if (response.status === 404 && body.includes('PGRST202')) {
    console.error('promoter_add_member is missing from the live schema cache');
    process.exit(1);
  }

  if (response.status === 400 && body.includes('PGRST202')) {
    console.error('promoter_add_member is missing from the live schema cache');
    process.exit(1);
  }

  if (response.status >= 500) {
    console.error(`promoter_add_member returned server error ${response.status}`);
    console.error(body);
    process.exit(1);
  }

  console.log(`promoter_add_member is exposed (HTTP ${response.status})`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});