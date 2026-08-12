-- ═══════════════════════════════════════════════════════════════════════════
-- Credential and PII table lockdown  (TARGET STATE)
-- Created: 2026-08-12
--
-- ⚠️  DO NOT APPLY THIS MIGRATION ON ITS OWN.  ⚠️
--
-- This migration denies the public anon key all access to the login credential
-- and staff PII tables. The application currently reads these tables directly
-- with the anon key in ~166 places across ~63 files (165 of them use
-- `select('*')`). Applying this BEFORE the client authenticates as `authenticated`
-- (with the JWT issued by the server-side login functions) will take the whole
-- app offline: every dashboard, leaderboard, directory and profile read will 401.
--
-- Apply ONLY after Stages 1-3 of SECURITY_REMEDIATION_RUNBOOK.md are complete and
-- verified in staging:
--   1. All login PIN checks run server-side (auth-login / se-login / login funcs).
--   2. The browser attaches the issued JWT to the Supabase client, so reads run
--      as the `authenticated` role rather than `anon`.
--   3. RLS read policies for `authenticated` are in place and tested.
--
-- Design:
--   * anon        -> no access at all to these tables.
--   * authenticated -> SELECT via RLS policy (rows), governed further as needed.
--   * service_role -> full access (bypasses RLS); used by the login/edge funcs.
--   * Plaintext credential columns are nulled and dropped (Section B), since PIN
--     verification now happens server-side against the peppered hash in
--     `identities` (see project zero-PII migration).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ---------------------------------------------------------------------------
-- Section A. Enable RLS, deny anon, allow authenticated SELECT.
-- ---------------------------------------------------------------------------
-- Helper pattern applied per table. Quoted identifiers are used for the
-- upper/mixed-case table names that were imported from spreadsheets.

-- app_users -----------------------------------------------------------------
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_users FROM anon;
GRANT SELECT ON public.app_users TO authenticated;
DROP POLICY IF EXISTS app_users_authenticated_read ON public.app_users;
CREATE POLICY app_users_authenticated_read ON public.app_users
  FOR SELECT TO authenticated USING (true);

-- installers ----------------------------------------------------------------
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.installers FROM anon;
GRANT SELECT ON public.installers TO authenticated;
DROP POLICY IF EXISTS installers_authenticated_read ON public.installers;
CREATE POLICY installers_authenticated_read ON public.installers
  FOR SELECT TO authenticated USING (true);

-- HBB_HQ_TEAM ---------------------------------------------------------------
ALTER TABLE public."HBB_HQ_TEAM" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."HBB_HQ_TEAM" FROM anon;
GRANT SELECT ON public."HBB_HQ_TEAM" TO authenticated;
DROP POLICY IF EXISTS hbb_hq_team_authenticated_read ON public."HBB_HQ_TEAM";
CREATE POLICY hbb_hq_team_authenticated_read ON public."HBB_HQ_TEAM"
  FOR SELECT TO authenticated USING (true);

-- DSE_14TOWNS ---------------------------------------------------------------
ALTER TABLE public."DSE_14TOWNS" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."DSE_14TOWNS" FROM anon;
GRANT SELECT ON public."DSE_14TOWNS" TO authenticated;
DROP POLICY IF EXISTS dse_14towns_authenticated_read ON public."DSE_14TOWNS";
CREATE POLICY dse_14towns_authenticated_read ON public."DSE_14TOWNS"
  FOR SELECT TO authenticated USING (true);

-- airtelmoney_agents --------------------------------------------------------
ALTER TABLE public.airtelmoney_agents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.airtelmoney_agents FROM anon;
GRANT SELECT ON public.airtelmoney_agents TO authenticated;
DROP POLICY IF EXISTS airtelmoney_agents_authenticated_read ON public.airtelmoney_agents;
CREATE POLICY airtelmoney_agents_authenticated_read ON public.airtelmoney_agents
  FOR SELECT TO authenticated USING (true);

-- agents_HBB ----------------------------------------------------------------
ALTER TABLE public."agents_HBB" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."agents_HBB" FROM anon;
GRANT SELECT ON public."agents_HBB" TO authenticated;
DROP POLICY IF EXISTS agents_hbb_authenticated_read ON public."agents_HBB";
CREATE POLICY agents_hbb_authenticated_read ON public."agents_HBB"
  FOR SELECT TO authenticated USING (true);

-- installer_supervisor ------------------------------------------------------
ALTER TABLE public.installer_supervisor ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.installer_supervisor FROM anon;
GRANT SELECT ON public.installer_supervisor TO authenticated;
DROP POLICY IF EXISTS installer_supervisor_authenticated_read ON public.installer_supervisor;
CREATE POLICY installer_supervisor_authenticated_read ON public.installer_supervisor
  FOR SELECT TO authenticated USING (true);

-- INHOUSE_INSTALLER_6TOWNS_MARCH --------------------------------------------
ALTER TABLE public."INHOUSE_INSTALLER_6TOWNS_MARCH" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" FROM anon;
GRANT SELECT ON public."INHOUSE_INSTALLER_6TOWNS_MARCH" TO authenticated;
DROP POLICY IF EXISTS inhouse_installer_authenticated_read ON public."INHOUSE_INSTALLER_6TOWNS_MARCH";
CREATE POLICY inhouse_installer_authenticated_read ON public."INHOUSE_INSTALLER_6TOWNS_MARCH"
  FOR SELECT TO authenticated USING (true);

-- HBB_INSTALLER_GA_MONTHLY --------------------------------------------------
ALTER TABLE public."HBB_INSTALLER_GA_MONTHLY" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."HBB_INSTALLER_GA_MONTHLY" FROM anon;
GRANT SELECT ON public."HBB_INSTALLER_GA_MONTHLY" TO authenticated;
DROP POLICY IF EXISTS hbb_ga_monthly_authenticated_read ON public."HBB_INSTALLER_GA_MONTHLY";
CREATE POLICY hbb_ga_monthly_authenticated_read ON public."HBB_INSTALLER_GA_MONTHLY"
  FOR SELECT TO authenticated USING (true);

-- AIRTELMONEY_HQ ------------------------------------------------------------
ALTER TABLE public."AIRTELMONEY_HQ" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."AIRTELMONEY_HQ" FROM anon;
GRANT SELECT ON public."AIRTELMONEY_HQ" TO authenticated;
DROP POLICY IF EXISTS airtelmoney_hq_authenticated_read ON public."AIRTELMONEY_HQ";
CREATE POLICY airtelmoney_hq_authenticated_read ON public."AIRTELMONEY_HQ"
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Section B. Destroy the plaintext credentials.
-- ---------------------------------------------------------------------------
-- Run ONLY after every login path verifies PINs server-side against
-- identities.secret_hash. Nulling first (reversible within the window) then
-- dropping. Keep as two separate deploys if you want a safety gap.

UPDATE public.app_users                          SET pin = NULL, password_hash = NULL WHERE pin IS NOT NULL OR password_hash IS NOT NULL;
UPDATE public.installers                          SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public."HBB_HQ_TEAM"                      SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public."DSE_14TOWNS"                      SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public.airtelmoney_agents                 SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public."agents_HBB"                       SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public.installer_supervisor               SET pin = NULL WHERE pin IS NOT NULL;
UPDATE public."INHOUSE_INSTALLER_6TOWNS_MARCH"   SET "PIN" = NULL, "Supervisor PIN" = NULL WHERE "PIN" IS NOT NULL OR "Supervisor PIN" IS NOT NULL;
UPDATE public."HBB_INSTALLER_GA_MONTHLY"         SET "PIN" = NULL WHERE "PIN" IS NOT NULL;
UPDATE public."AIRTELMONEY_HQ"                   SET "PIN" = NULL WHERE "PIN" IS NOT NULL;

-- Optional, once you are confident (irreversible):
-- ALTER TABLE public.app_users DROP COLUMN pin, DROP COLUMN pin_hash, DROP COLUMN password_hash;
-- ALTER TABLE public.installers DROP COLUMN pin;
-- ... (repeat per table) ...

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification (run as anon AFTER commit; every one must fail / return 0 rows):
--   select * from app_users limit 1;             -- expect: permission denied
--   select * from "DSE_14TOWNS" limit 1;         -- expect: permission denied
--   select pin from installers limit 1;          -- expect: permission denied
-- And as an authenticated (JWT) caller, the non-credential reads must still work.
-- ---------------------------------------------------------------------------
