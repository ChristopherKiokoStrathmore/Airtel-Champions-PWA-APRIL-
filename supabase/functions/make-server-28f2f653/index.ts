// DIAGNOSTIC TEST: hono with cors and logger sub-path imports
import { Hono } from "npm:hono@4.7.9";
import { cors } from "npm:hono@4.7.9/cors";
import { logger } from "npm:hono@4.7.9/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();
app.use('*', logger(console.log));
app.use('*', cors({ origin: '*' }));
app.get("/make-server-28f2f653/health", (c) => c.json({ status: "ok", test: "hono-full" }));
Deno.serve(app.fetch);
