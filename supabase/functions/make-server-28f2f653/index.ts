// FIXED DEPLOYMENT: Minimal wrapper with essential routes bundled
// Cache bust: 2026-05-08-user-upload-redeploy-2
import { Hono } from "npm:hono@4.7.9";
import { cors } from "npm:hono@4.7.9/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

import announcementsApp from "../../../src/supabase/functions/server/announcements.tsx";
import userUploadApp from "./user-upload.tsx";
import programsApp from "../../../src/supabase/functions/server/programs.tsx";

const app = new Hono();

// CORS setup for all origins during development
app.use("/*", cors({
  origin: '*',
  allowHeaders: ["Content-Type", "Authorization", "apikey"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Health check
app.get("/make-server-28f2f653/health", (c) => {
  return c.json({ 
    status: "ok",
    version: "3.5.0",
    timestamp: new Date().toISOString()
  });
});

// Route handlers
app.route('/make-server-28f2f653', announcementsApp);
app.route('/make-server-28f2f653', userUploadApp);
app.route('/', programsApp);

// Catch-all 404 handler
app.notFound((c) => {
  return c.json({ error: "Endpoint not found", path: c.req.path }, 404);
});

Deno.serve(app.fetch);
