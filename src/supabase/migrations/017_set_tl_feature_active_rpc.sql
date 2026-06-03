-- 017_set_tl_feature_active_rpc.sql
-- The app uses custom phone/PIN auth (no Supabase Auth JWT), so auth.uid() is
-- always NULL and RLS-based UPDATE policies silently block every write.
-- This SECURITY DEFINER function bypasses RLS while still enforcing role checks
-- by accepting the caller's app_users UUID and validating it internally.

CREATE OR REPLACE FUNCTION set_tl_feature_active(p_user_id UUID, p_active BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM app_users
    WHERE id = p_user_id
      AND role IN ('hq_staff', 'hq_command_center', 'director', 'developer')
  ) THEN
    RAISE EXCEPTION 'Permission denied: user % does not have a qualifying role', p_user_id;
  END IF;

  UPDATE app_feature_flags
     SET value      = p_active,
         updated_at = now(),
         updated_by = p_user_id
   WHERE key = 'promoter_tl_active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feature flag row not found — run migration 016 first';
  END IF;
END;
$$;

-- Grant anon role the ability to call this function
-- (the app never establishes a Supabase Auth session, so all calls arrive as anon)
GRANT EXECUTE ON FUNCTION set_tl_feature_active(UUID, BOOLEAN) TO anon;

-- Drop the FK to auth.users on updated_by — app users live in app_users, not auth.users
ALTER TABLE app_feature_flags
  DROP CONSTRAINT IF EXISTS app_feature_flags_updated_by_fkey;
