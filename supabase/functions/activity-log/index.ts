import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      userId, 
      userName, 
      userRole,
      actionType,      // client sends this
      action,          // fallback if client sends directly
      actionDetails,   // client sends this
      metadata,        // fallback
      sessionId, 
      deviceInfo, 
      timestamp
    } = body;

    // Normalise fields: client uses actionType/actionDetails, DB expects action/metadata
    const finalAction = action || actionType;
    const finalMetadata = metadata || actionDetails;

    if (!finalAction) {
      throw new Error('Missing required field: action (or actionType)');
    }
    
    if (typeof finalMetadata === 'string') {
      try {
        finalMetadata = JSON.parse(finalMetadata);
      } catch (err) {
        console.error('Error parsing metadata:', err);
        throw new Error('Invalid metadata format. Expected JSON.');
      }
    }

    // DEBUG: Log the mapping
    console.log('DEBUG: actionType=', actionType, 'action=', action, 'finalAction=', finalAction);
    console.log('DEBUG: actionDetails=', actionDetails, 'metadata=', metadata, 'finalMetadata=', finalMetadata);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        action: finalAction,
        metadata: finalMetadata || {},
        session_id: sessionId,
        device_info: deviceInfo,
        created_at: timestamp || new Date().toISOString(),
      });

    if (error) {
      console.error('Error inserting into activity_logs:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error handling request:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});