import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { sr_id, rejected_by = [] } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Step 1: Look up sr_number using the UUID
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('sr_number')
      .eq('id', sr_id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({
        allocated: false,
        error: `Job not found for id: ${sr_id}`
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!job.sr_number) {
      return new Response(JSON.stringify({
        allocated: false,
        error: `Job ${sr_id} has no sr_number — run the migration backfill`
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Pass sr_number (bigint) to allocate_installer
    const { data, error } = await supabase.rpc('allocate_installer', {
      p_sr_id: job.sr_number,  // ← bigint, correct
      p_rejected_by: rejected_by
    });

    if (error) throw error;

    if (!data || !data.installer_id) {
      return new Response(JSON.stringify({
        allocated: false,
        escalated: true,
        message: 'No installer available - escalated to ops'
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch installer name for the response
    const { data: installerData } = await supabase
      .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
      .select('"Installer name"')
      .eq('id', data.installer_id)
      .single();

    return new Response(JSON.stringify({
      allocated: true,
      installer_id: data.installer_id,
      installer_name: installerData?.['Installer name'] || `Installer ${data.installer_id}`,
      job_id: data.job_id,
      allocation_tier: data.allocation_tier,
      message: `Assigned to installer ${data.installer_id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      allocated: false,
      error: err.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
