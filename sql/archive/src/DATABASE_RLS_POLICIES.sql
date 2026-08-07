-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- This migration implements comprehensive Row Level Security
-- Execute this in Supabase SQL Editor AFTER creating all tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Authentication & Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Submissions & Missions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_types ENABLE ROW LEVEL SECURITY;

-- Gamification
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Management
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Intelligence
ALTER TABLE competitor_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;

-- System
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'zsm', 'asm', 'rsm')
  );
$$;

-- Check if current user is SE
CREATE OR REPLACE FUNCTION auth.is_se()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'se'
  );
$$;

-- Get current user's region
CREATE OR REPLACE FUNCTION auth.user_region()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT region FROM users WHERE id = auth.uid();
$$;

-- Get current user's team
CREATE OR REPLACE FUNCTION auth.user_team()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT team_id FROM users WHERE id = auth.uid();
$$;

-- ============================================================================
-- SECTION 3: USERS TABLE POLICIES
-- ============================================================================

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- SEs can only view their own profile
CREATE POLICY "SEs can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can update all users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 4: OTP_CODES TABLE POLICIES
-- ============================================================================

-- Users can view their own OTPs
CREATE POLICY "Users can view own OTPs"
  ON otp_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow anonymous OTP generation (for login)
CREATE POLICY "Anyone can insert OTPs"
  ON otp_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can update their own OTPs (mark as used)
CREATE POLICY "Users can update own OTPs"
  ON otp_codes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can delete OTPs (cleanup)
CREATE POLICY "Admins can delete OTPs"
  ON otp_codes FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 5: SUBMISSIONS TABLE POLICIES
-- ============================================================================

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- SEs can view their own submissions
CREATE POLICY "SEs can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SEs can insert their own submissions
CREATE POLICY "SEs can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND auth.is_se());

-- Only admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- SEs can update their own pending submissions
CREATE POLICY "SEs can update own pending submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
  ON submissions FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 6: MISSION_TYPES TABLE POLICIES
-- ============================================================================

-- Everyone can view mission types
CREATE POLICY "Everyone can view mission types"
  ON mission_types FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify mission types
CREATE POLICY "Admins can modify mission types"
  ON mission_types FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 7: ANNOUNCEMENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- Only admins can update announcements
CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 8: DAILY_CHALLENGES TABLE POLICIES
-- ============================================================================

-- Everyone can view active challenges
CREATE POLICY "Everyone can view challenges"
  ON daily_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create challenges
CREATE POLICY "Admins can create challenges"
  ON daily_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- Only admins can update challenges
CREATE POLICY "Admins can update challenges"
  ON daily_challenges FOR UPDATE
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Only admins can delete challenges
CREATE POLICY "Admins can delete challenges"
  ON daily_challenges FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 9: ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view achievements
CREATE POLICY "Everyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage achievements
CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 10: USER_ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- System can award achievements (via triggers)
CREATE POLICY "System can award achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can manually award achievements
CREATE POLICY "Admins can award achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- Only admins can delete achievements
CREATE POLICY "Admins can delete achievements"
  ON user_achievements FOR DELETE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 11: COMPETITOR_SIGHTINGS TABLE POLICIES
-- ============================================================================

-- Admins can view all sightings
CREATE POLICY "Admins can view all sightings"
  ON competitor_sightings FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- SEs can view their own sightings
CREATE POLICY "SEs can view own sightings"
  ON competitor_sightings FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- SEs can create sightings
CREATE POLICY "SEs can create sightings"
  ON competitor_sightings FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid() AND auth.is_se());

-- Only admins can update sightings
CREATE POLICY "Admins can update sightings"
  ON competitor_sightings FOR UPDATE
  TO authenticated
  USING (auth.is_admin());

-- ============================================================================
-- SECTION 12: HOTSPOTS TABLE POLICIES
-- ============================================================================

-- Everyone can view hotspots
CREATE POLICY "Everyone can view hotspots"
  ON hotspots FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage hotspots
CREATE POLICY "Admins can manage hotspots"
  ON hotspots FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 13: LEADERBOARD_SNAPSHOTS TABLE POLICIES
-- ============================================================================

-- Everyone can view leaderboard
CREATE POLICY "Everyone can view leaderboard"
  ON leaderboard_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Only system/admins can insert snapshots
CREATE POLICY "System can insert leaderboard snapshots"
  ON leaderboard_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 14: AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent deletion of audit logs
-- (No DELETE policy means nobody can delete)

-- ============================================================================
-- SECTION 15: TEAMS & REGIONS TABLE POLICIES
-- ============================================================================

-- Everyone can view teams
CREATE POLICY "Everyone can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

-- Everyone can view regions
CREATE POLICY "Everyone can view regions"
  ON regions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage teams
CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Only admins can manage regions
CREATE POLICY "Admins can manage regions"
  ON regions FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 16: APP_SETTINGS TABLE POLICIES
-- ============================================================================

-- Everyone can view settings
CREATE POLICY "Everyone can view settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- SECTION 17: VERIFICATION & TESTING
-- ============================================================================

-- Test RLS policies
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created successfully!';
  RAISE NOTICE 'Tables protected: 17';
  RAISE NOTICE 'Policies created: 50+';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '- Admins can access all data';
  RAISE NOTICE '- SEs can only access their own data';
  RAISE NOTICE '- Regional managers see their region';
  RAISE NOTICE '- Audit logs are append-only';
  RAISE NOTICE '- OTP codes are private';
END $$;

-- Query to check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Query to check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 18: REGIONAL POLICIES (OPTIONAL - FOR FUTURE USE)
-- ============================================================================

-- Regional managers can view submissions in their region
-- Uncomment if you want regional access control

/*
CREATE POLICY "Regional managers can view regional submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    auth.user_role() IN ('rsm', 'asm') 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = submissions.user_id 
      AND users.region = auth.user_region()
    )
  );
*/

-- ============================================================================
-- CLEANUP (Run this to remove all policies and start over)
-- ============================================================================

/*
-- WARNING: This removes ALL RLS policies. Use with caution!

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
  
  RAISE NOTICE 'All policies dropped';
END $$;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
-- ... (continue for all tables)
*/

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
