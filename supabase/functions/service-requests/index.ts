import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // DEBUG: Log database connection info
    console.log('DEBUG: DEPLOYMENT MARKER v2.0 - Using jobs table');
    console.log('DEBUG: Supabase URL:', supabaseUrl);
    console.log('DEBUG: Checking available tables...');
    
    // DEBUG: Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .eq('table_name', 'jobs');
    
    console.log('DEBUG: Jobs table exists:', tables);
    console.log('DEBUG: Tables error:', tablesError);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET /service-requests - List service requests (using jobs table)
    if (req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const status = url.searchParams.get('status');
      const agent_phone = url.searchParams.get('agent_phone');
      const installer_id = url.searchParams.get('installer_id');
      const town_id = url.searchParams.get('town_id');

      let query = supabase
        .from('jobs')  // Changed from service_request to jobs
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (agent_phone) {
        query = query.eq('agent_phone', agent_phone);
      }
      if (installer_id) {
        query = query.eq('installer_id', parseInt(installer_id));
      }
      if (town_id) {
        query = query.eq('town_id', parseInt(town_id));
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ data: data || [], count: count || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /service-requests - Create new service request (using jobs table)
    if (req.method === 'POST') {
      const body = await req.json();
      
      const { data, error } = await supabase
        .from('jobs')  // Changed from service_request to jobs
        .insert([{
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          town_id: body.town_id,
          estate_name: body.estate,  // jobs table uses estate_name
          package: body.package,
          scheduled_date: body.preferred_date,  // jobs table uses scheduled_date
          scheduled_time: body.preferred_time,  // jobs table uses scheduled_time
          agent_name: body.agent_name,
          agent_phone: body.agent_phone,
          remarks: body.remarks,
          source_type: body.source_type || 'agent',
          source_id: body.source_id,
          source_name: body.source_name,
          status: 'pending'  // jobs table uses 'pending' as default
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /service-requests/:id - Update service request (jobs table)
    if (req.method === 'PUT' && path && path !== 'service-requests') {
      const body = await req.json();

      const VALID_STATUSES = ['pending', 'open', 'assigned', 'on_way', 'arrived', 'completed', 'failed', 'cancelled', 'rescheduled', 'unreachable', 'not_ready', 'scheduled'];
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        return new Response(
          JSON.stringify({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: Record<string, unknown> = { status: body.status };
      if (body.remarks !== undefined) updates.remarks = body.remarks;
      if (body.status === 'completed') updates.completed_at = new Date().toISOString();

      // GPS coordinates (flat fields from client)
      if (body.customer_lat !== undefined && !isNaN(Number(body.customer_lat))) {
        updates.completion_lat = Number(body.customer_lat);
      }
      if (body.customer_lng !== undefined && !isNaN(Number(body.customer_lng))) {
        updates.completion_lng = Number(body.customer_lng);
      }

      // Nested location object (alternative format)
      if (body.location && typeof body.location === 'object') {
        const lat = Number(body.location.lat);
        const lng = Number(body.location.lng);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          updates.completion_lat = lat;
          updates.completion_lng = lng;
        }
      }

      // Determine if path is a UUID or legacy bigint
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path);

      let query = supabase.from('jobs').update(updates);
      if (isUUID) {
        query = query.eq('id', path);
      } else {
        const legacyId = Number(path);
        if (isNaN(legacyId)) {
          return new Response(
            JSON.stringify({ error: 'Invalid job ID format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        query = query.eq('legacy_sr_id', legacyId);
      }

      const { data, error } = await query.select('*').single();

      if (error) {
        console.error('[service-requests] PUT error:', JSON.stringify(error));
        // If a DB trigger fails due to column mismatch, retry without GPS fields.
        // The job status update still succeeds; only the location log is skipped.
        if (
          error.message?.includes('INSERT has more expressions') ||
          error.message?.includes('INSERT has fewer expressions')
        ) {
          console.warn('[service-requests] Trigger column mismatch — retrying without GPS fields');
          const safeUpdates: Record<string, unknown> = {};
          if (updates.status !== undefined) safeUpdates.status = updates.status;
          if (updates.remarks !== undefined) safeUpdates.remarks = updates.remarks;
          if (updates.completed_at !== undefined) safeUpdates.completed_at = updates.completed_at;

          let retryQuery = supabase.from('jobs').update(safeUpdates);
          retryQuery = isUUID ? retryQuery.eq('id', path) : retryQuery.eq('legacy_sr_id', Number(path));
          const { data: retryData, error: retryErr } = await retryQuery.select('*').single();
          if (retryErr) throw retryErr;
          return new Response(
            JSON.stringify({ ...retryData, _warning: 'GPS location not saved due to a database trigger issue. Run FIX_JOBS_TRIGGER.sql to resolve.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Service requests error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
