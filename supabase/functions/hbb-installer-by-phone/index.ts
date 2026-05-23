import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const phone = url.searchParams.get('phone')
    
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // Direct database query
    const { data, error } = await supabase
      .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
      .select('*')
      .limit(200)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find matching installer in JavaScript
    const normalized = phone.replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '').replace(/^254/, '')
    const installer = data?.find(row => {
      const contact = String(row['Installer contact'] || '').replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '').replace(/^254/, '')
      return contact === normalized
    })

    if (!installer) {
      return new Response(
        JSON.stringify({ error: 'Installer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = {
      id: installer.id,
      name: installer['Installer name'],
      phone: installer['Installer contact'],
      estate: installer['Estate Name']
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
