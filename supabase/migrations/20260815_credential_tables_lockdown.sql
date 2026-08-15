-- ═══════════════════════════════════════════════════════════════════════════
-- Credential tables lockdown  -  close the public anon key's read of plaintext
-- PINs + PII on the HBB installer / DSE / supervisor tables and the Airtel Money
-- agents table.  Created: 2026-08-15.
--
-- Before this, the anon key could read name + phone + plaintext PIN from all
-- eight tables below (~2,700 rows), the same full-account-takeover exposure that
-- app_users had. Logins for every one of these populations are now server-side
-- (login / am-login / supervisor-auth Edge Functions, service role), so the
-- public key no longer needs to read them.
--
-- Posture set here (matches app_users):
--   * anon: nothing.
--   * authenticated: may READ (USING true) - leaderboards, dashboards, directories
--     all read as a logged-in user. Column-scoped UPDATE only on the operational
--     columns the app actually writes (installer availability / job, last_login),
--     so a logged-in user cannot rewrite anyone's PIN.
--   * service_role (Edge Functions): bypasses RLS; unaffected.
--
-- Residual (documented, next phase - defence in depth, not a public hole):
--   * authenticated users can still READ the PIN columns (select * dashboards).
--     Column-level SELECT restriction + nulling the plaintext PINs is the follow-up.
--   * HBB source-table self PIN change and AM self-registration are retired here
--     (they wrote plaintext credentials from the client); onboarding is admin/
--     server managed. Re-enable only behind a service-role Edge Function.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Read-only tables (no client writes): SELECT to authenticated only ──────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'DSE_14TOWNS','installer_supervisor','agents_HBB','HBB_INSTALLER_GA_MONTHLY','HBB_HQ_TEAM'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_auth_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t||'_auth_read', t);
  END LOOP;
END $$;

-- ── installers: read + operational UPDATE (availability / current job / odu opt-in) ──
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.installers;
REVOKE ALL ON public.installers FROM anon;
REVOKE ALL ON public.installers FROM authenticated;
GRANT SELECT ON public.installers TO authenticated;
GRANT UPDATE (is_available, current_job_id, odu_opt_in) ON public.installers TO authenticated;
DROP POLICY IF EXISTS installers_auth_read ON public.installers;
CREATE POLICY installers_auth_read ON public.installers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS installers_auth_update ON public.installers;
CREATE POLICY installers_auth_update ON public.installers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── INHOUSE_INSTALLER_6TOWNS_MARCH: read + operational UPDATE (availability / job) ──
-- Supervisor login + PIN change run through supervisor-auth (service role).
ALTER TABLE public."INHOUSE_INSTALLER_6TOWNS_MARCH" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" FROM anon;
REVOKE ALL ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" FROM authenticated;
GRANT SELECT ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" TO authenticated;
GRANT UPDATE (is_available, current_job_id) ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" TO authenticated;
DROP POLICY IF EXISTS inhouse_auth_read ON public."INHOUSE_INSTALLER_6TOWNS_MARCH";
CREATE POLICY inhouse_auth_read ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS inhouse_auth_update ON public."INHOUSE_INSTALLER_6TOWNS_MARCH";
CREATE POLICY inhouse_auth_update ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── airtelmoney_agents: read + operational UPDATE (last_login_at) ──────────────
-- RLS already on; drop the legacy PUBLIC read policy. Self-registration retired.
ALTER TABLE public.airtelmoney_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AIRTELMONEY_AGENTS - Can read" ON public.airtelmoney_agents;
REVOKE ALL ON public.airtelmoney_agents FROM anon;
REVOKE ALL ON public.airtelmoney_agents FROM authenticated;
GRANT SELECT ON public.airtelmoney_agents TO authenticated;
GRANT UPDATE (last_login_at) ON public.airtelmoney_agents TO authenticated;
DROP POLICY IF EXISTS airtelmoney_agents_auth_read ON public.airtelmoney_agents;
CREATE POLICY airtelmoney_agents_auth_read ON public.airtelmoney_agents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS airtelmoney_agents_auth_update ON public.airtelmoney_agents;
CREATE POLICY airtelmoney_agents_auth_update ON public.airtelmoney_agents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

COMMIT;

-- ── Rollback (per table if a read/write path breaks) ──────────────────────────
--   ALTER TABLE public."<t>" DISABLE ROW LEVEL SECURITY;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public."<t>" TO anon;
