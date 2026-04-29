import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function phoneFormats(phone: string): { text: string[]; numeric: number[] } {
  const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
  const match = cleaned.match(/(\d{9})$/);
  if (!match) return { text: [cleaned], numeric: [] };
  const last9 = match[1];
  return {
    text: [last9, '0' + last9, '+254' + last9, '254' + last9],
    numeric: [Number(last9), Number('254' + last9)].filter(n => !isNaN(n) && n > 0),
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, pin } = await req.json();
    if (!phone || !pin) {
      return new Response(JSON.stringify({ error: 'phone and pin required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const formats = phoneFormats(phone);
    console.log('[HBB Login] Checking phone formats:', formats.text);

    // 1. Check agents_HBB (bigint phone column)
    const { data: agents } = await supabase
      .from('agents_HBB')
      .select('*')
      .in('Agent Mobile Number', formats.numeric)
      .limit(1);

    if (agents && agents.length > 0) {
      const agent = agents[0];
      if (pin !== (agent.pin || '1234')) {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const rawPhone = String(agent['Agent Mobile Number'] || '');
      const last9 = rawPhone.slice(-9);
      console.log('[HBB Login] Agent login:', agent['Agent Name']);
      return new Response(JSON.stringify({
        id: rawPhone,
        full_name: agent['Agent Name'] || 'HBB Agent',
        phone_number: '0' + last9,
        role: 'hbb_agent',
        agent_type: agent['Agent Type'] || 'agent',
        source_table: 'agents_HBB',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Check unified installers table
    const { data: installers } = await supabase
      .from('installers')
      .select('id, name, phone, pin, town, status, max_jobs_per_day')
      .in('phone', formats.text)
      .limit(1);

    if (installers && installers.length > 0) {
      const installer = installers[0];
      if (pin !== (installer.pin || '1234')) {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[HBB Login] Installer login:', installer.name);
      return new Response(JSON.stringify({
        id: installer.id,
        full_name: installer.name,
        phone_number: installer.phone,
        role: 'hbb_installer',
        town: installer.town ?? '',
        status: installer.status ?? 'active',
        max_jobs_per_day: installer.max_jobs_per_day ?? null,
        source_table: 'installers',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Check HBB_HQ_TEAM
    const { data: hqUsers } = await supabase
      .from('HBB_HQ_TEAM')
      .select('*')
      .in('phone', formats.text)
      .eq('is_active', true)
      .limit(1);

    if (hqUsers && hqUsers.length > 0) {
      const hqUser = hqUsers[0];
      if (pin !== (hqUser.pin || '1234')) {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('[HBB Login] HQ login:', hqUser.name);
      return new Response(JSON.stringify({
        id: hqUser.id,
        full_name: hqUser.name,
        phone_number: hqUser.phone,
        role: hqUser.role || 'hbb_hq',
        source_table: 'HBB_HQ_TEAM',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('[HBB Login] Not found:', phone);
    return new Response(JSON.stringify({ error: 'Phone number not found. Are you an HBB agent or installer?' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[HBB Login] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
