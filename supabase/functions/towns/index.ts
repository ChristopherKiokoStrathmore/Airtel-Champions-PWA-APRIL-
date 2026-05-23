import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Return the actual 14 towns from DSE_14TOWNS table
  const towns = [
    { id: 1, name: 'Nairobi' },
    { id: 2, name: 'Mombasa' },
    { id: 3, name: 'Kisumu' },
    { id: 4, name: 'Nakuru' },
    { id: 5, name: 'Eldoret' },
    { id: 6, name: 'Thika' },
    { id: 7, name: 'Kitengela' },
    { id: 8, name: 'Kikuyu' },
    { id: 9, name: 'Limuru' },
    { id: 10, name: 'Ruaka' },
    { id: 11, name: 'Karen' },
    { id: 12, name: 'Westlands' },
    { id: 13, name: 'Kasarani' },
    { id: 14, name: 'Embakasi' },
  ];

  return new Response(
    JSON.stringify(towns),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
