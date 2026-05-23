-- =============================================================================
-- ZONE FILTERING — DATABASE-LEVEL FIX (works on the OLD APK, no code deploy)
-- Run this in: Supabase SQL Editor → project xspogpfohjmkykfjadhk
--
-- HOW IT WORKS:
--   The old APK sends the user's JWT with every Supabase query.
--   Postgres can read auth.uid() from that JWT server-side.
--   RLS policies below look up the user's zone from app_users and
--   automatically filter van_db / sitewise BEFORE rows reach the app.
--   The old APK JS never sees out-of-zone rows — no client code needed.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 1: Helper function — resolve the calling user's zone
-- SECURITY DEFINER so it can read app_users even if RLS is enabled there.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_auth_user_zone()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT zone
  FROM   app_users
  WHERE  id = auth.uid()
  LIMIT  1;
$$;


-- -----------------------------------------------------------------------------
-- STEP 2: Helper function — true if the calling user is a manager-level role
-- Managers (zsm, zbm, admin, director, super_admin) should always see ALL zones.
-- Add or remove roles from the list as needed.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_manager_role()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   app_users
    WHERE  id   = auth.uid()
    AND    role IN ('super_admin', 'admin', 'director', 'zbm', 'zsm')
  );
$$;


-- =============================================================================
-- van_db
-- =============================================================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

-- Drop old policy if re-running this script
DROP POLICY IF EXISTS "van_db_zone_filter" ON van_db;

-- SELECT policy — the core zone filter
-- Logic:
--   1. Manager roles → see every row (no zone restriction)
--   2. User has no zone (NULL / blank) → see every row (graceful fallback)
--   3. Everyone else → only see rows where ZONE matches their zone
CREATE POLICY "van_db_zone_filter"
ON van_db
FOR SELECT
USING (
  is_manager_role()                         -- managers see all zones
  OR get_auth_user_zone() IS NULL           -- user has no zone → see all
  OR get_auth_user_zone() = ''             -- blank zone → see all
  OR "ZONE" = get_auth_user_zone()         -- zone match  (Airtel uppercase column)
);

-- Keep INSERT / UPDATE / DELETE open for authenticated users
-- (so existing write paths in the app are not broken)
DROP POLICY IF EXISTS "van_db_write_authenticated" ON van_db;
CREATE POLICY "van_db_write_authenticated"
ON van_db
FOR ALL                                    -- INSERT, UPDATE, DELETE
USING      (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- =============================================================================
-- sitewise
-- =============================================================================

ALTER TABLE sitewise ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sitewise_zone_filter" ON sitewise;

-- Same logic as van_db above.
-- If sitewise uses a different column name (e.g. "zone" lowercase or "Zone"),
-- replace "ZONE" in the last line with the correct column name.
CREATE POLICY "sitewise_zone_filter"
ON sitewise
FOR SELECT
USING (
  is_manager_role()
  OR get_auth_user_zone() IS NULL
  OR get_auth_user_zone() = ''
  OR zone = get_auth_user_zone()           -- lowercase "zone" confirmed from schema check
);

DROP POLICY IF EXISTS "sitewise_write_authenticated" ON sitewise;
CREATE POLICY "sitewise_write_authenticated"
ON sitewise
FOR ALL
USING      (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- =============================================================================
-- VERIFICATION — run these SELECTs after applying the policies
-- They should return the policies you just created.
-- =============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('van_db', 'sitewise')
ORDER BY tablename, policyname;