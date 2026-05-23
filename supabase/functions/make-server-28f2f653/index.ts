// FIXED DEPLOYMENT: Minimal wrapper with essential routes bundled
// Cache bust: 2026-05-08-cors-preflight-fix
import { Hono } from "npm:hono@4.7.9";
import { cors } from "npm:hono@4.7.9/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

import announcementsApp from "../../../src/supabase/functions/server/announcements.tsx";
import userUploadApp from "./user-upload.tsx";
import programsApp from "../../../src/supabase/functions/server/programs.tsx";
import checkinApp from "../../../src/supabase/functions/server/checkin.tsx";

const app = new Hono();

// ============================================================================
// CORS Setup — MUST be first middleware
// ============================================================================
const corsMiddleware = cors({
  origin: (origin) => origin || "*",  // Allow all origins including none
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "apikey",
    "x-client-info",
    "X-User-Id",
    "Accept",
    "Accept-Language",
  ],
  allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
  exposeHeaders: ["Content-Length", "X-JSON-Response-Size"],
  maxAge: 86400,
  credentials: false,
});

app.use("/*", corsMiddleware);

// Explicit OPTIONS handler for preflight requests (should be redundant but ensures coverage)
app.options("/*", (c) => {
  return c.text("", 204);
});

// Health check
app.get("/make-server-28f2f653/health", (c) => {
  return c.json({ 
    status: "ok",
    version: "3.5.1",
    timestamp: new Date().toISOString()
  });
});

// Route handlers
app.route('/make-server-28f2f653', announcementsApp);
app.route('/make-server-28f2f653', userUploadApp);
app.route('/make-server-28f2f653', checkinApp);
app.route('/', programsApp);

// Catch-all 404 handler
app.notFound((c) => {
  return c.json({ error: "Endpoint not found", path: c.req.path }, 404);
});

// Health endpoint for root (Supabase health check)
app.get("/", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);
