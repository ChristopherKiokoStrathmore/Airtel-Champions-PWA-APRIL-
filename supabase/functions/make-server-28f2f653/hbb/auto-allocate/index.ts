import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { sr_id, rejected_by = [] } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data, error } = await supabase.rpc('allocate_installer', {
      p_sr_id: sr_id,
      p_rejected_by: rejected_by
    });

    if (error) throw error;

    if (!data || !data.installer_id) {
      return new Response(JSON.stringify({
        success: false,
        escalated: true,
        message: 'No installer available - escalated to ops'
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      installer_id: data.installer_id,
      job_id: data.job_id,
      allocation_tier: data.allocation_tier,
      message: `Assigned to installer ${data.installer_id}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: err.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
