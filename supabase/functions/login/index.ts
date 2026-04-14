// your function code here 
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
interface reqPayload {
  name: string;
}

const allowedOrigin = "https://airtelchampionsapp.vercel.app";

console.info('server started');

Deno.serve(async (req: Request) => {
  // Common CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    // Uncomment if you need credentials:
    // "Access-Control-Allow-Credentials": "true",
  };

  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { name }: reqPayload = await req.json();
    const data = {
      message: `Hello ${name}!`,
    };

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Connection": "keep-alive",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request payload" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});