import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { job_id, installer_id, reason } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data, error } = await supabase.rpc('handle_job_rejection', {
      p_job_id: job_id,
      p_installer_id: installer_id,
      p_reason: reason
    });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      reallocated: data?.reallocated || false,
      escalated: data?.escalated || false
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
