-- =====================================================
-- CLEANUP SCRIPT
-- Run this FIRST if you get errors about existing objects
-- This safely drops all objects so you can start fresh
-- =====================================================

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS competitor_sightings CASCADE;
DROP VIEW IF EXISTS daily_challenges CASCADE;
DROP VIEW IF EXISTS admin_users CASCADE;
DROP VIEW IF EXISTS sales_executives CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS leaderboard CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS refresh_leaderboard_trigger ON submissions;
DROP TRIGGER IF EXISTS update_streak_trigger ON submissions;
DROP TRIGGER IF EXISTS update_hotspots_updated_at ON hotspots;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
DROP TRIGGER IF EXISTS update_user_challenges_updated_at ON user_challenges;
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
DROP TRIGGER IF EXISTS update_point_config_updated_at ON point_config;
DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
DROP TRIGGER IF EXISTS update_mission_types_updated_at ON mission_types;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop all functions
DROP FUNCTION IF EXISTS refresh_leaderboard() CASCADE;
DROP FUNCTION IF EXISTS update_streak() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_rank(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_total_points(UUID) CASCADE;

-- Drop all tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS competitor_activity CASCADE;
DROP TABLE IF EXISTS hotspots CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS point_config CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS mission_types CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Cleanup complete! All existing objects dropped.';
  RAISE NOTICE '   Now run: 001_initial_schema.sql';
END $$;
