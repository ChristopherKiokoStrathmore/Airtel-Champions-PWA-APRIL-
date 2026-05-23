-- ============================================================================
-- PRODUCTION-READY DATABASE ENHANCEMENTS
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- This migration adds:
-- 1. Row Level Security (RLS) policies
-- 2. Performance indexes
-- 3. Auto-award achievement triggers
-- 4. Materialized views for fast analytics
-- ============================================================================

-- ============================================================================
-- PART 1: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: USERS TABLE
-- ============================================================================

-- Admins can see all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- Users can see their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can update any user
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- RLS POLICIES: SUBMISSIONS TABLE
-- ============================================================================

-- Admins can see all submissions
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- SEs can see their own submissions
CREATE POLICY "SEs can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SEs can insert their own submissions
CREATE POLICY "SEs can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can update any submission (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- RLS POLICIES: MISSION TYPES
-- ============================================================================

-- Everyone can view mission types
CREATE POLICY "Anyone can view mission types"
  ON mission_types FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify mission types
CREATE POLICY "Admins can modify mission types"
  ON mission_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- RLS POLICIES: ANNOUNCEMENTS
-- ============================================================================

-- Everyone can view announcements
CREATE POLICY "Anyone can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- Only admins can update/delete announcements
CREATE POLICY "Admins can modify announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- RLS POLICIES: DAILY CHALLENGES
-- ============================================================================

-- Everyone can view challenges
CREATE POLICY "Anyone can view challenges"
  ON daily_challenges FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/modify challenges
CREATE POLICY "Admins can modify challenges"
  ON daily_challenges FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- RLS POLICIES: ACHIEVEMENTS
-- ============================================================================

-- Everyone can view achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/modify achievements
CREATE POLICY "Admins can modify achievements"
  ON achievements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- RLS POLICIES: USER ACHIEVEMENTS
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
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- System can auto-award achievements (via triggers)
CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: OTP CODES
-- ============================================================================

-- Users can only view their own OTPs
CREATE POLICY "Users can view own OTPs"
  ON otp_codes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can insert OTPs (for login/registration)
CREATE POLICY "Anyone can insert OTPs"
  ON otp_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own OTPs (mark as used)
CREATE POLICY "Users can update own OTPs"
  ON otp_codes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: COMPETITOR SIGHTINGS
-- ============================================================================

-- Admins can see all competitor sightings
CREATE POLICY "Admins can view all sightings"
  ON competitor_sightings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- SEs can see their own sightings
CREATE POLICY "SEs can view own sightings"
  ON competitor_sightings FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- SEs can insert sightings
CREATE POLICY "SEs can insert sightings"
  ON competitor_sightings FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- ============================================================================
-- RLS POLICIES: HOTSPOTS
-- ============================================================================

-- Everyone can view hotspots
CREATE POLICY "Anyone can view hotspots"
  ON hotspots FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/modify hotspots
CREATE POLICY "Admins can modify hotspots"
  ON hotspots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.admin_access = true
    )
  );

-- ============================================================================
-- PART 2: PERFORMANCE INDEXES
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);
CREATE INDEX IF NOT EXISTS idx_users_admin_access ON users(admin_access);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Submissions table indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_submissions_mission_type_id ON submissions(mission_type_id);
CREATE INDEX IF NOT EXISTS idx_submissions_region ON submissions(region);
CREATE INDEX IF NOT EXISTS idx_submissions_points ON submissions(points_awarded);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submissions_status_created 
  ON submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_status 
  ON submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_region_status 
  ON submissions(region, status);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_used ON otp_codes(used);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);

-- Daily challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON daily_challenges(start_date);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON daily_challenges(end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON daily_challenges(is_active);

-- User achievements indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- Competitor sightings indexes
CREATE INDEX IF NOT EXISTS idx_sightings_location ON competitor_sightings USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_sightings_created_at ON competitor_sightings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sightings_competitor ON competitor_sightings(competitor_name);

-- Hotspots indexes
CREATE INDEX IF NOT EXISTS idx_hotspots_location ON hotspots USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_hotspots_priority ON hotspots(priority_level);
CREATE INDEX IF NOT EXISTS idx_hotspots_active ON hotspots(is_active);

-- ============================================================================
-- PART 3: AUTO-AWARD ACHIEVEMENT TRIGGERS
-- ============================================================================

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_count INTEGER;
  total_points INTEGER;
  streak_days INTEGER;
  achievement_record RECORD;
BEGIN
  -- Only process approved submissions
  IF NEW.status = 'approved' THEN
    
    -- Get user stats
    SELECT COUNT(*), COALESCE(SUM(points_awarded), 0)
    INTO submission_count, total_points
    FROM submissions
    WHERE user_id = NEW.user_id
    AND status = 'approved';
    
    -- Achievement: First Submission
    IF submission_count = 1 THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'First Mission'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: 10 Submissions
    IF submission_count = 10 THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Rising Star'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: 50 Submissions
    IF submission_count = 50 THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Veteran Scout'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: 100 Submissions
    IF submission_count = 100 THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Elite Agent'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: 1000 Points
    IF total_points >= 1000 AND total_points < 1000 + COALESCE(NEW.points_awarded, 0) THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Point Master'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: 5000 Points
    IF total_points >= 5000 AND total_points < 5000 + COALESCE(NEW.points_awarded, 0) THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Point Legend'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
    -- Achievement: Weekend Warrior (submission on Saturday or Sunday)
    IF EXTRACT(DOW FROM NEW.created_at) IN (0, 6) THEN
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      SELECT NEW.user_id, id, now()
      FROM achievements
      WHERE name = 'Weekend Warrior'
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-awarding achievements
DROP TRIGGER IF EXISTS award_achievements_on_approval ON submissions;
CREATE TRIGGER award_achievements_on_approval
  AFTER INSERT OR UPDATE OF status ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_achievements();

-- ============================================================================
-- Function to calculate user streak
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_count INTEGER := 0;
  last_date DATE;
  current_date_iter DATE;
BEGIN
  -- Get the most recent submission date
  SELECT DATE(created_at) INTO last_date
  FROM submissions
  WHERE user_id = user_uuid
  AND status = 'approved'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- If last submission was not yesterday or today, streak is broken
  IF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    RETURN 0;
  END IF;
  
  -- Count consecutive days backwards
  current_date_iter := last_date;
  
  WHILE EXISTS (
    SELECT 1 FROM submissions
    WHERE user_id = user_uuid
    AND DATE(created_at) = current_date_iter
    AND status = 'approved'
  ) LOOP
    streak_count := streak_count + 1;
    current_date_iter := current_date_iter - INTERVAL '1 day';
  END LOOP;
  
  RETURN streak_count;
END;
$$;

-- ============================================================================
-- PART 4: MATERIALIZED VIEWS FOR FAST ANALYTICS
-- ============================================================================

-- Materialized view: Leaderboard
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_view AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.phone,
  u.region,
  u.team,
  u.role,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submissions,
  COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions,
  COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_submissions,
  COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_points,
  COALESCE(AVG(CASE WHEN s.status = 'approved' THEN s.points_awarded END), 0) as avg_points,
  MAX(s.created_at) as last_submission_at,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) DESC) as global_rank,
  RANK() OVER (PARTITION BY u.region ORDER BY COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) DESC) as regional_rank,
  RANK() OVER (PARTITION BY u.team ORDER BY COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) DESC) as team_rank
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
WHERE u.role = 'se'
GROUP BY u.id, u.full_name, u.phone, u.region, u.team, u.role;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard_view(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_points ON leaderboard_view(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_region ON leaderboard_view(region);
CREATE INDEX IF NOT EXISTS idx_leaderboard_team ON leaderboard_view(team);

-- Materialized view: Daily analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics_view AS
SELECT 
  DATE(s.created_at) as date,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(DISTINCT s.user_id) as active_users,
  COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_points_awarded,
  COUNT(DISTINCT s.region) as regions_active,
  s.region,
  mt.name as mission_type,
  COUNT(CASE WHEN mt.id = s.mission_type_id THEN 1 END) as mission_count
FROM submissions s
LEFT JOIN mission_types mt ON s.mission_type_id = mt.id
GROUP BY DATE(s.created_at), s.region, mt.name
ORDER BY date DESC;

-- Create indexes on daily analytics
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics_view(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_region ON daily_analytics_view(region);

-- Materialized view: Regional performance
CREATE MATERIALIZED VIEW IF NOT EXISTS regional_performance_view AS
SELECT 
  u.region,
  COUNT(DISTINCT u.id) as total_ses,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submissions,
  COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) as total_points,
  COALESCE(AVG(CASE WHEN s.status = 'approved' THEN s.points_awarded END), 0) as avg_points_per_submission,
  COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END) / NULLIF(COUNT(DISTINCT u.id), 0), 0) as avg_points_per_se,
  COUNT(DISTINCT DATE(s.created_at)) as active_days,
  RANK() OVER (ORDER BY COALESCE(SUM(CASE WHEN s.status = 'approved' THEN s.points_awarded ELSE 0 END), 0) DESC) as region_rank
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
WHERE u.role = 'se'
GROUP BY u.region;

-- Create indexes on regional performance
CREATE INDEX IF NOT EXISTS idx_regional_performance_region ON regional_performance_view(region);
CREATE INDEX IF NOT EXISTS idx_regional_performance_points ON regional_performance_view(total_points DESC);

-- ============================================================================
-- Function to refresh materialized views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY regional_performance_view;
END;
$$;

-- ============================================================================
-- PART 5: UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user's current rank
CREATE OR REPLACE FUNCTION get_user_rank(user_uuid UUID)
RETURNS TABLE(global_rank BIGINT, regional_rank BIGINT, team_rank BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lv.global_rank,
    lv.regional_rank,
    lv.team_rank
  FROM leaderboard_view lv
  WHERE lv.user_id = user_uuid;
END;
$$;

-- Function to get top performers
CREATE OR REPLACE FUNCTION get_top_performers(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  region TEXT,
  total_points NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lv.user_id,
    lv.full_name,
    lv.region,
    lv.total_points,
    lv.global_rank
  FROM leaderboard_view lv
  ORDER BY lv.total_points DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- PART 6: SCHEDULED JOBS (for Supabase pg_cron or external cron)
-- ============================================================================

-- Note: If using Supabase, enable pg_cron extension first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: Refresh materialized views every hour
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views()');

-- Schedule: Cleanup expired OTPs daily at 2 AM
-- SELECT cron.schedule('cleanup-otps', '0 2 * * *', 'SELECT cleanup_expired_otps()');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'submissions', 'announcements', 'daily_challenges')
ORDER BY tablename;

-- Check indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'submissions', 'otp_codes')
ORDER BY tablename, indexname;

-- Check materialized views
SELECT 
  schemaname,
  matviewname,
  hasindexes
FROM pg_matviews
WHERE schemaname = 'public';

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'submissions';

-- Test leaderboard view
SELECT * FROM leaderboard_view LIMIT 10;

-- Test daily analytics view
SELECT * FROM daily_analytics_view 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;

-- Test regional performance view
SELECT * FROM regional_performance_view ORDER BY total_points DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION check_and_award_achievements() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performers(INTEGER) TO authenticated;

-- Grant select on materialized views
GRANT SELECT ON leaderboard_view TO authenticated;
GRANT SELECT ON daily_analytics_view TO authenticated;
GRANT SELECT ON regional_performance_view TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database enhancement complete!';
  RAISE NOTICE '   - Row Level Security enabled on 11 tables';
  RAISE NOTICE '   - 30+ performance indexes created';
  RAISE NOTICE '   - Auto-award achievement triggers active';
  RAISE NOTICE '   - 3 materialized views for fast analytics';
  RAISE NOTICE '   - 5 utility functions created';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next steps:';
  RAISE NOTICE '   1. Run: SELECT refresh_analytics_views();';
  RAISE NOTICE '   2. Test RLS policies with different user roles';
  RAISE NOTICE '   3. Monitor query performance with EXPLAIN ANALYZE';
END $$;
