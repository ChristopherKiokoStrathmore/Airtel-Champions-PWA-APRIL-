// HQ/Directors Management - Permanent Staff (Not Affected by Excel Uploads)
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Frontend Supabase client — hq_directors table lives on the frontend project
const FRONTEND_SUPABASE_URL = Deno.env.get('FRONTEND_SUPABASE_URL')?.startsWith('https://')
  ? Deno.env.get('FRONTEND_SUPABASE_URL')!
  : 'https://xspogpfohjmkykfjadhk.supabase.co';
const FRONTEND_SERVICE_ROLE_KEY = Deno.env.get('FRONTEND_SERVICE_ROLE_KEY') || '';
const FRONTEND_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';
const frontendKey = FRONTEND_SERVICE_ROLE_KEY || FRONTEND_ANON_KEY;
const frontendSupabase = createClient(FRONTEND_SUPABASE_URL, frontendKey);

// ============================================================================
// GET ALL HQ/DIRECTORS
// ============================================================================

app.get("/hq-directors", async (c) => {
  try {
    const { data, error } = await frontendSupabase
      .from("hq_directors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("[HQ Directors] Fetch error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// CREATE HQ/DIRECTOR
// ============================================================================

app.post("/hq-directors", async (c) => {
  try {
    const body = await c.req.json();

    const { data, error } = await frontendSupabase
      .from("hq_directors")
      .insert({
        full_name: body.full_name,
        phone_number: body.phone_number,
        email: body.email,
        role: body.role, // "HQ" or "Director"
        job_title: body.job_title,
        region: body.region,
        is_active: true,
        pin: body.pin || "1234",
      })
      .select()
      .single();

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[HQ Directors] Create error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// UPDATE HQ/DIRECTOR
// ============================================================================

app.put("/hq-directors/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();

    const { data, error } = await frontendSupabase
      .from("hq_directors")
      .update({
        full_name: body.full_name,
        phone_number: body.phone_number,
        email: body.email,
        role: body.role,
        job_title: body.job_title,
        region: body.region,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[HQ Directors] Update error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// DELETE HQ/DIRECTOR
// ============================================================================

app.delete("/hq-directors/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const { error } = await frontendSupabase
      .from("hq_directors")
      .delete()
      .eq("id", id);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("[HQ Directors] Delete error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;