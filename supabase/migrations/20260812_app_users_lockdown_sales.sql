-- ═══════════════════════════════════════════════════════════════════════════
-- app_users lockdown  (SALES scope)  -  read + write policies
-- Created: 2026-08-12
--
-- ⚠️  STAGING-VALIDATE BEFORE PROD.  ⚠️
-- This denies the anon key all access to app_users and re-expresses every access
-- as a policy for the `authenticated` role. Logged-in sales users reach the table
-- authenticated (JWT minted by se-login, attached by the client's authedFetch).
--
-- Why this supersedes 20260812_credential_tables_lockdown.sql for app_users:
-- that file granted SELECT only, which would break the client-side WRITES the app
-- performs on app_users (profile edits, last_login_at, admin user management).
-- This migration keeps those working by role/own-row policy instead.
--
-- Residual items to check on staging before prod:
--   * HBB / Airtel Money users have NO JWT (held) -> they read app_users as anon
--     and will be denied. Confirm no HBB/AM screen depends on app_users.
--   * Self-signup (signup-screen) inserts app_users; confirm it is server-side or
--     add an INSERT path, else it breaks under anon revoke.
--   * Points / system updates must run server-side (service_role bypasses RLS).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Maps the JWT subject to the app_users row the caller owns.
--   * identity token:  sub = identities.id  -> identities.app_user_id
--   * legacy token:    sub = app_users.id    (se-login legacy fallback path)
-- SECURITY DEFINER so the policy can read identities regardless of its RLS, and
-- it never reads app_users, so there is no policy recursion.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT i.app_user_id FROM public.identities i WHERE i.id = auth.uid()),
    auth.uid()
  );
$$;

-- True when the caller's JWT app_role is an elevated management role.
CREATE OR REPLACE FUNCTION public.current_is_admin()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'app_role') IN ('admin','developer','director','hq_staff'),
    false
  );
$$;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Public anon key: nothing.
REVOKE ALL ON public.app_users FROM anon;

-- authenticated: table privileges gated further by the policies below.
GRANT SELECT, INSERT, UPDATE ON public.app_users TO authenticated;

-- Read: any authenticated caller may read (leaderboards, directories, dashboards).
-- Names are still sealed; the caller sees handles unless resolve-names unseals.
DROP POLICY IF EXISTS app_users_authenticated_read ON public.app_users;
CREATE POLICY app_users_authenticated_read ON public.app_users
  FOR SELECT TO authenticated USING (true);

-- Update: a caller may update its own row; admins may update any row.
DROP POLICY IF EXISTS app_users_update ON public.app_users;
CREATE POLICY app_users_update ON public.app_users
  FOR UPDATE TO authenticated
  USING (id = public.current_app_user_id() OR public.current_is_admin())
  WITH CHECK (id = public.current_app_user_id() OR public.current_is_admin());

-- Insert: admins only (self-signup should move server-side; see header).
DROP POLICY IF EXISTS app_users_insert ON public.app_users;
CREATE POLICY app_users_insert ON public.app_users
  FOR INSERT TO authenticated
  WITH CHECK (public.current_is_admin());

-- service_role (edge functions, backfills) bypasses RLS entirely; no grant change.

COMMIT;

-- ── Rollback (if a read/write path breaks in staging) ──────────────────────
--   ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO anon;
-- ── Verify as anon (must be denied) ────────────────────────────────────────
--   select * from app_users limit 1;            -- expect: permission denied
-- ── Verify as an authenticated sales token (must work) ─────────────────────
--   select id from app_users limit 1;           -- expect: rows
