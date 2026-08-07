-- ============================================================================
-- CRITICAL SCHEMA FIXES
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- Fixes for database errors found in production
-- ============================================================================

-- ============================================================================
-- FIX #1: submissions.user_id vs submissions.se_id
-- ============================================================================
-- The actual column is 'se_id', not 'user_id'
-- Admin dashboard and mobile API are querying wrong column name

-- Option A: Add user_id as an alias (backwards compatible)
-- This is a view that the admin dashboard can query
DROP VIEW IF EXISTS submissions_view CASCADE;

CREATE OR REPLACE VIEW submissions_view AS
SELECT 
  id,
  se_id AS user_id,  -- Alias se_id as user_id for backwards compatibility
  se_id,             -- Keep original column name
  mission_type_id,
  photo_url,
  location_lat,
  location_lng,
  location_address,
  notes,
  exif_timestamp,
  exif_gps_lat,
  exif_gps_lng,
  exif_valid,
  status,
  points_awarded,
  bonus_multiplier,
  reviewed_by,
  reviewed_at,
  rejection_reason,
  submitted_at,
  created_at,
  updated_at
FROM submissions;

-- Grant access
GRANT SELECT ON submissions_view TO authenticated;
GRANT ALL ON submissions_view TO service_role;

COMMENT ON VIEW submissions_view IS 'View with user_id alias for backwards compatibility';

-- ============================================================================
-- FIX #2: Ambiguous relationship - users and submissions
-- ============================================================================
-- Problem: submissions table has TWO foreign keys to users:
-- 1. se_id (the person who submitted)
-- 2. reviewed_by (the admin who reviewed)
--
-- Solution: Use explicit relationship names in queries

-- The queries should use:
-- .select('*, users!submissions_se_id_fkey(full_name, phone)')  -- For SE
-- .select('*, users!submissions_reviewed_by_fkey(full_name)')   -- For reviewer

-- Or create separate views for clarity:

DROP VIEW IF EXISTS submissions_with_se CASCADE;
DROP VIEW IF EXISTS submissions_with_reviewer CASCADE;

-- View with SE information
CREATE OR REPLACE VIEW submissions_with_se AS
SELECT 
  s.*,
  u.full_name AS se_name,
  u.phone AS se_phone,
  u.email AS se_email,
  u.region AS se_region,
  u.team AS se_team,
  u.avatar_url AS se_avatar
FROM submissions s
INNER JOIN users u ON s.se_id = u.id;

-- View with reviewer information
CREATE OR REPLACE VIEW submissions_with_reviewer AS
SELECT 
  s.*,
  u.full_name AS reviewer_name,
  u.email AS reviewer_email
FROM submissions s
LEFT JOIN users u ON s.reviewed_by = u.id;

-- View with BOTH SE and reviewer (for admin dashboard)
CREATE OR REPLACE VIEW submissions_full AS
SELECT 
  s.id,
  s.se_id,
  s.mission_type_id,
  s.photo_url,
  s.location_lat,
  s.location_lng,
  s.location_address,
  s.notes,
  s.status,
  s.points_awarded,
  s.reviewed_by,
  s.reviewed_at,
  s.rejection_reason,
  s.submitted_at,
  s.created_at,
  
  -- SE information
  se.full_name AS se_name,
  se.phone AS se_phone,
  se.email AS se_email,
  se.region AS se_region,
  se.team AS se_team,
  se.avatar_url AS se_avatar,
  
  -- Mission type information
  mt.name AS mission_type_name,
  mt.description AS mission_type_description,
  mt.base_points AS mission_base_points,
  mt.category AS mission_category,
  mt.icon AS mission_icon,
  
  -- Reviewer information (if reviewed)
  reviewer.full_name AS reviewer_name,
  reviewer.email AS reviewer_email

FROM submissions s
INNER JOIN users se ON s.se_id = se.id
INNER JOIN mission_types mt ON s.mission_type_id = mt.id
LEFT JOIN users reviewer ON s.reviewed_by = reviewer.id;

-- Grant access
GRANT SELECT ON submissions_with_se TO authenticated;
GRANT SELECT ON submissions_with_reviewer TO authenticated;
GRANT SELECT ON submissions_full TO authenticated;

GRANT ALL ON submissions_with_se TO service_role;
GRANT ALL ON submissions_with_reviewer TO service_role;
GRANT ALL ON submissions_full TO service_role;

-- ============================================================================
-- FIX #3: user_achievements.unlocked_at vs awarded_at
-- ============================================================================
-- Check what column actually exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' 
    AND column_name = 'unlocked_at'
  ) THEN
    -- Column exists, no action needed
    RAISE NOTICE 'user_achievements.unlocked_at exists';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' 
    AND column_name = 'awarded_at'
  ) THEN
    -- Rename awarded_at to unlocked_at
    ALTER TABLE user_achievements 
    RENAME COLUMN awarded_at TO unlocked_at;
    RAISE NOTICE 'Renamed awarded_at to unlocked_at';
  ELSE
    -- Add the column
    ALTER TABLE user_achievements 
    ADD COLUMN unlocked_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added unlocked_at column';
  END IF;
END $$;

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
  ON user_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked 
  ON user_achievements(unlocked_at DESC);

-- ============================================================================
-- FIX #4: Add missing columns from offline-sync-schema.sql
-- ============================================================================

-- Add client_id to submissions (for offline sync)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS client_id VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_submissions_client_id 
  ON submissions(client_id);

-- Add created_at_device to submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS created_at_device TIMESTAMPTZ;

-- Add photo_metadata to submissions (for EXIF data)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS photo_metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- FIX #5: Update materialized view to use correct column
-- ============================================================================

-- Drop and recreate with correct column names
DROP MATERIALIZED VIEW IF EXISTS leaderboard CASCADE;

CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.region,
  u.team,
  u.avatar_url,
  COUNT(s.id) AS total_submissions,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS approved_submissions,
  COALESCE(SUM(s.points_awarded), 0) AS total_points,
  COALESCE(
    ROUND(100.0 * COUNT(CASE WHEN s.status = 'approved' THEN 1 END) / NULLIF(COUNT(s.id), 0), 2),
    0
  ) AS approval_rate,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points_awarded), 0) DESC) AS rank
FROM users u
LEFT JOIN submissions s ON u.id = s.se_id  -- Using se_id, not user_id!
WHERE u.role = 'se' AND u.is_active = true
GROUP BY u.id, u.full_name, u.phone, u.region, u.team, u.avatar_url;

-- Indexes
CREATE UNIQUE INDEX idx_leaderboard_id ON leaderboard(id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_region ON leaderboard(region);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW leaderboard IS 'Cached leaderboard data for performance (refreshed every 5 minutes)';

-- ============================================================================
-- FIX #6: Create helper function to get submissions for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_submissions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  mission_type_name VARCHAR,
  photo_url TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  status VARCHAR,
  points_awarded INTEGER,
  submitted_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    mt.name AS mission_type_name,
    s.photo_url,
    s.location_lat,
    s.location_lng,
    s.status,
    s.points_awarded,
    s.submitted_at
  FROM submissions s
  INNER JOIN mission_types mt ON s.mission_type_id = mt.id
  WHERE s.se_id = p_user_id
  ORDER BY s.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_submissions IS 'Get all submissions for a specific user (avoids relationship ambiguity)';

-- ============================================================================
-- FIX #7: Create helper function for admin to get all SEs with submissions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_ses_with_stats()
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  region VARCHAR,
  team VARCHAR,
  total_submissions BIGINT,
  approved_submissions BIGINT,
  pending_submissions BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.phone,
    u.email,
    u.region,
    u.team,
    COUNT(s.id) AS total_submissions,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS approved_submissions,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) AS pending_submissions,
    COALESCE(SUM(s.points_awarded), 0) AS total_points
  FROM users u
  LEFT JOIN submissions s ON u.id = s.se_id
  WHERE u.role = 'se' AND u.is_active = true
  GROUP BY u.id, u.full_name, u.phone, u.email, u.region, u.team
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_all_ses_with_stats IS 'Get all SEs with their submission statistics (avoids relationship ambiguity)';

-- ============================================================================
-- FIX #8: Add RLS policies for new views
-- ============================================================================

-- Enable RLS on views (if not already enabled)
ALTER VIEW submissions_view SET (security_invoker = true);
ALTER VIEW submissions_with_se SET (security_invoker = true);
ALTER VIEW submissions_with_reviewer SET (security_invoker = true);
ALTER VIEW submissions_full SET (security_invoker = true);

-- ============================================================================
-- FIX #9: Update existing RLS policies to use correct column
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;

-- Recreate with correct column name (se_id)
CREATE POLICY "SEs can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = se_id);

CREATE POLICY "SEs can insert their own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = se_id);

CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'zsm', 'asm', 'rsm')
    )
  );

CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'zsm', 'asm', 'rsm')
    )
  );

-- ============================================================================
-- FIX #10: Create analytics helper function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS TABLE (
  total_submissions BIGINT,
  pending_submissions BIGINT,
  approved_submissions BIGINT,
  rejected_submissions BIGINT,
  total_points_awarded BIGINT,
  total_active_ses BIGINT,
  avg_approval_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(s.id) AS total_submissions,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) AS pending_submissions,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) AS approved_submissions,
    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) AS rejected_submissions,
    COALESCE(SUM(s.points_awarded), 0) AS total_points_awarded,
    COUNT(DISTINCT s.se_id) AS total_active_ses,
    ROUND(
      100.0 * COUNT(CASE WHEN s.status = 'approved' THEN 1 END) / NULLIF(COUNT(s.id), 0),
      2
    ) AS avg_approval_rate
  FROM submissions s;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_analytics_summary IS 'Get overall analytics summary';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify fixes
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - submissions_view (user_id alias)';
  RAISE NOTICE '  - submissions_with_se';
  RAISE NOTICE '  - submissions_with_reviewer';
  RAISE NOTICE '  - submissions_full';
  RAISE NOTICE '';
  RAISE NOTICE 'Created helper functions:';
  RAISE NOTICE '  - get_user_submissions(user_id)';
  RAISE NOTICE '  - get_all_ses_with_stats()';
  RAISE NOTICE '  - get_analytics_summary()';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated:';
  RAISE NOTICE '  - Materialized view: leaderboard';
  RAISE NOTICE '  - RLS policies on submissions';
  RAISE NOTICE '  - Added client_id, created_at_device columns';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update admin dashboard queries';
  RAISE NOTICE '  2. Update mobile API queries';
  RAISE NOTICE '  3. Test all endpoints';
END $$;

-- ============================================================================
-- QUICK REFERENCE FOR FIXING QUERIES
-- ============================================================================

/*
OLD QUERY (BROKEN):
-----------------
const { data } = await supabase
  .from('submissions')
  .select('*, users(full_name)')  // ❌ Ambiguous!
  .eq('user_id', userId);  // ❌ Column doesn't exist!


NEW QUERY (FIXED) - Option 1: Use view
----------------------------------------
const { data } = await supabase
  .from('submissions_full')
  .select('*')
  .eq('se_id', userId);


NEW QUERY (FIXED) - Option 2: Use explicit relationship
---------------------------------------------------------
const { data } = await supabase
  .from('submissions')
  .select('*, users!submissions_se_id_fkey(full_name)')
  .eq('se_id', userId);


NEW QUERY (FIXED) - Option 3: Use helper function
---------------------------------------------------
const { data } = await supabase
  .rpc('get_user_submissions', { p_user_id: userId });


FOR ADMIN DASHBOARD - Get all SEs:
-----------------------------------
const { data } = await supabase
  .rpc('get_all_ses_with_stats');


FOR ANALYTICS:
--------------
const { data } = await supabase
  .rpc('get_analytics_summary')
  .single();
*/
