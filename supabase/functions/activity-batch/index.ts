import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Guard: an empty or non-JSON body would otherwise throw
    // "Unexpected end of JSON input" and surface as a 500.
    const raw = await req.text();
    const body = raw ? JSON.parse(raw) : {};
    const events = Array.isArray(body?.events) ? body.events : [];

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, inserted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert all events
    const { error } = await supabase
      .from('activity_logs')
      .insert(events.map((e: any) => ({
        user_id: e.userId,
        user_name: e.userName,
        user_role: e.userRole,
        action: e.action,
        metadata: e.metadata,
        created_at: e.timestamp || new Date().toISOString(),
      })));

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: events.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
