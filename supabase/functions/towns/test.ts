import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Simple test - return hardcoded towns for now
  const towns = [
    { id: 1, name: 'Nairobi' },
    { id: 2, name: 'Mombasa' },
    { id: 3, name: 'Kisumu' },
    { id: 4, name: 'Nakuru' },
    { id: 5, name: 'Eldoret' },
  ];

  return new Response(
    JSON.stringify(towns),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
