// FIXED DEPLOYMENT: Minimal wrapper with essential routes bundled
// Cache bust: 2026-05-08-cors-preflight-fix
import { Hono } from "npm:hono@4.7.9";
import { cors } from "npm:hono@4.7.9/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyJwt } from "../_shared/privacy-crypto.ts";

// Route modules live inside this function directory. They previously sat in
// src/supabase/functions/server/ and were imported via ../../../, a path that
// escapes the supabase/functions/ root. The Supabase CLI bundles only what is
// reachable inside that root, which is the most likely cause of the BOOT_ERROR
// this function has been returning. Do not move them back out.
import announcementsApp from "./announcements.tsx";
import userUploadApp from "./user-upload.tsx";
import programsApp from "./programs.tsx";
import checkinApp from "./checkin.tsx";

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
    // X-User-Id removed 2026-08-10. Identity now comes from the verified token
    // and nothing else. Leaving it in allowHeaders would invite it back.
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

// ============================================================================
// Authentication
// ============================================================================
//
// Added 2026-08-10. Until this existed, all 43 routes below were reachable by
// anyone who knew the URL, on a function holding SUPABASE_SERVICE_ROLE_KEY,
// which bypasses row level security. See
// privacy-evidence/EDGE-FUNCTION-AUTH-AUDIT-2026-08-10.md, Finding 1.
//
// This is defence in depth, not the only control. config.toml should also carry
// verify_jwt = true for this function so the platform rejects unsigned callers
// before any of this code runs. This middleware exists so that if someone flips
// that flag back, the routes fail closed rather than becoming public again.
//
// The token is the one se-login mints: an HS256 JWT signed with
// PROJECT_JWT_SECRET, carrying sub = identities.id and app_role. It is not a
// GoTrue session, so supabase.auth.getUser() cannot validate it. Verify the
// signature against the same secret se-login signs with.
//
// Rules for anyone changing this:
//   1. Never read identity from a request header. Headers are caller-supplied.
//   2. Never add a route to the allowlist that reads or writes data.
//   3. Fail closed. Missing config is 503, not a bypass.

const PUBLIC_ROUTES = [
  "/make-server-28f2f653/health",
];

app.use("/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();
  if (PUBLIC_ROUTES.includes(c.req.path) || c.req.path === "/") return next();

  const secret =
    Deno.env.get("PROJECT_JWT_SECRET") || Deno.env.get("SESSION_SIGNING_SECRET");
  if (!secret) {
    // Refuse to serve rather than fall through unauthenticated. A missing
    // secret is a deployment fault, and the safe response to it is no service.
    console.error("make-server-28f2f653: PROJECT_JWT_SECRET is not set");
    return c.json({ error: "Service unavailable" }, 503);
  }

  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const claims = await verifyJwt(token, secret);
  if (!claims) return c.json({ error: "Unauthorized" }, 401);

  // The token's `sub` is identities.id. Route handlers query app_users.id, so
  // resolve the mapping here, once, rather than in each handler. A token whose
  // identity has no linked app_user is authenticated but has no profile to act
  // as, so it gets no userId and every handler that needs one will refuse it.
  const db = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: identity } = await db
    .from("identities")
    .select("app_user_id")
    .eq("id", claims.sub)
    .maybeSingle();

  // Route handlers read identity from here. Nothing else is trustworthy.
  c.set("identityId", claims.sub);
  c.set("userId", identity?.app_user_id ?? null);
  c.set("appRole", claims.app_role ?? null);
  c.set("handle", claims.handle ?? null);
  return next();
});

// Health check. Deliberately the only unauthenticated route, and it reports
// liveness only: no version-dependent behaviour, no data, no environment.
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
