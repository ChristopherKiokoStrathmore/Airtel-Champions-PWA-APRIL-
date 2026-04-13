import { Hono } from "npm:hono";

const app = new Hono();

// ============================================================================
// IN-MEMORY LOCATION STORAGE
// ============================================================================
const locationStore = new Map<string, any>();   // key: userId → current location
const historyStore  = new Map<string, any[]>(); // key: userId → breadcrumb array

// ── Bulletproof body reader ───────────────────────────────────────────────────
//
// Root cause of "end of file before message length reached":
//   Deno's streaming body reader (used by both c.req.text() and c.req.json())
//   crashes when c.req.raw.body is null OR when Supabase's edge-function gateway
//   closes the TCP stream before the handler begins reading it.
//
// Two-layer defence:
//   1. Check c.req.raw.body !== null  → skip read entirely if no body stream
//   2. Use arrayBuffer() instead of text() → reads the full payload into memory
//      in a single syscall, bypassing the streaming reader that fails on partial
//      delivery or premature stream close.
//
async function safeJsonBody(c: any): Promise<{ data: any; error: string | null }> {
  // Layer 1 — null body guard (OPTIONS preflight, GET masquerading as POST, etc.)
  if (!c.req.raw.body) {
    return { data: null, error: "No request body (body stream is null)" };
  }

  try {
    // Layer 2 — read entire payload into an ArrayBuffer first, then decode.
    // arrayBuffer() is far more resilient than the streaming text/json readers
    // in Deno's edge runtime when the connection delivers bytes in chunks.
    const buffer = await c.req.raw.arrayBuffer();

    if (!buffer || buffer.byteLength === 0) {
      return { data: null, error: "Empty request body (0 bytes received)" };
    }

    const text = new TextDecoder("utf-8").decode(buffer);

    if (!text.trim()) {
      return { data: null, error: "Empty request body (blank after decode)" };
    }

    const data = JSON.parse(text);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: `Body parse error: ${err.message}` };
  }
}

// ── POST /update ──────────────────────────────────────────────────────────────
app.post("/update", async (c) => {
  const { data: body, error: parseError } = await safeJsonBody(c);

  if (parseError || !body) {
    // Location tracking is non-critical — log at warn level, not error.
    console.warn("[Location Update] Could not parse body:", parseError);
    return c.json({ error: `Invalid request body: ${parseError}` }, 400);
  }

  const { userId, lat, lng, userDetails } = body;

  if (!userId || lat === undefined || lng === undefined) {
    console.warn("[Location Update] Missing required fields:", { userId, lat, lng });
    return c.json({ error: "Missing required fields: userId, lat, lng" }, 400);
  }

  try {
    const timestamp = Date.now();
    const locationData = { userId, lat, lng, timestamp, userDetails: userDetails || {} };

    locationStore.set(userId, locationData);

    const history = historyStore.get(userId) || [];
    history.push({ lat: Number(lat), lng: Number(lng), t: timestamp });
    if (history.length > 50) history.splice(0, history.length - 50);
    historyStore.set(userId, history);

    console.log(`[Location Update] ✅ ${userId}: (${lat}, ${lng})`);
    return c.json({ success: true, timestamp });
  } catch (error: any) {
    console.error("[Location Update] Store error:", error.message);
    return c.json({ error: error.message }, 500);
  }
});

// ── GET /list ─────────────────────────────────────────────────────────────────
app.get("/list", (c) => {
  try {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const activeLocations: any[] = [];

    locationStore.forEach((loc) => {
      if (loc?.timestamp > fiveMinutesAgo) activeLocations.push(loc);
    });

    console.log(`[Location List] ✅ ${activeLocations.length} active`);
    return c.json({ locations: activeLocations });
  } catch (error: any) {
    console.error("[Location List] Error:", error.message);
    return c.json({ error: error.message }, 500);
  }
});

// ── GET /history/:userId ──────────────────────────────────────────────────────
app.get("/history/:userId", (c) => {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId param required" }, 400);

  try {
    const history = historyStore.get(userId) || [];
    return c.json({ userId, history });
  } catch (error: any) {
    console.error(`[Location History] Error for ${userId}:`, error.message);
    return c.json({ error: error.message }, 500);
  }
});

export default app;