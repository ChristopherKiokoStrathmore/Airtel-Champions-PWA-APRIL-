-- Sales Intelligence Network Database Schema
-- Migration 001: Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (Sales Executives + Admins)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'se', -- 'se' or 'admin'
  region VARCHAR(100) NOT NULL,
  team VARCHAR(100),
  pin_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_region ON users(region);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- MISSION TYPES TABLE
-- =====================================================
CREATE TABLE mission_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  base_points INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0, -- Alias for base_points for API compatibility
  category VARCHAR(50), -- 'network', 'conversion', 'newsite', 'amb'
  icon VARCHAR(10),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default mission types
INSERT INTO mission_types (name, description, base_points, points, category, icon, color) VALUES
  ('Network Experience', 'Capture competitor network quality issues', 80, 80, 'network', '📶', 'blue'),
  ('Competition Conversion', 'Document competitor customers considering switch', 200, 200, 'conversion', '🎯', 'red'),
  ('New Site Launch', 'Report new competitor retail locations', 150, 150, 'newsite', '🏪', 'green'),
  ('AMB Visitations', 'Visit Airtel Money Business agents', 100, 100, 'amb', '💰', 'purple');

-- =====================================================
-- SUBMISSIONS TABLE (Main Evidence Table)
-- =====================================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  se_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_type_id UUID NOT NULL REFERENCES mission_types(id),
  
  -- Evidence Data
  photo_url TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_address TEXT,
  notes TEXT,
  
  -- EXIF Validation
  exif_timestamp TIMESTAMP WITH TIME ZONE,
  exif_gps_lat DECIMAL(10, 8),
  exif_gps_lng DECIMAL(11, 8),
  exif_valid BOOLEAN DEFAULT false,
  
  -- Status & Points
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'flagged'
  points_awarded INTEGER DEFAULT 0,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  
  -- Review Data
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_submissions_se_id ON submissions(se_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX idx_submissions_mission_type ON submissions(mission_type_id);
CREATE INDEX idx_submissions_location ON submissions(location_lat, location_lng);

-- =====================================================
-- POINTS CONFIGURATION TABLE
-- =====================================================
CREATE TABLE point_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_type_id UUID REFERENCES mission_types(id),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default point configurations
INSERT INTO point_config (config_key, config_value, description) VALUES
  ('weekend_multiplier', 150, 'Weekend bonus multiplier (150%)'),
  ('high_priority_bonus', 50, 'High priority zone bonus points'),
  ('perfect_evidence_bonus', 25, 'Bonus for perfect EXIF validation');

-- =====================================================
-- LEADERBOARD (Materialized View for Performance)
-- =====================================================
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
LEFT JOIN submissions s ON u.id = s.se_id
WHERE u.role = 'se' AND u.is_active = true
GROUP BY u.id, u.full_name, u.phone, u.region, u.team, u.avatar_url;

-- Index on materialized view
CREATE UNIQUE INDEX idx_leaderboard_id ON leaderboard(id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX idx_leaderboard_region ON leaderboard(region);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh trigger
CREATE TRIGGER refresh_leaderboard_trigger
AFTER INSERT OR UPDATE OR DELETE ON submissions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard();

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'milestone', 'activity', 'quality', 'specialty'
  rarity VARCHAR(20) NOT NULL, -- 'common', 'rare', 'epic', 'legendary'
  requirement_type VARCHAR(50) NOT NULL, -- 'points', 'submissions', 'streak', 'custom'
  requirement_value INTEGER,
  bonus_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, rarity, requirement_type, requirement_value, bonus_points) VALUES
  ('Intelligence Rookie', 'Complete your first mission', '🎯', 'milestone', 'common', 'submissions', 1, 100),
  ('Field Operative', 'Reach 1,000 total points', '⭐', 'milestone', 'common', 'points', 1000, 200),
  ('Intelligence Expert', 'Reach 5,000 total points', '💎', 'milestone', 'rare', 'points', 5000, 500),
  ('Master Spy', 'Reach 10,000 total points', '👑', 'milestone', 'epic', 'points', 10000, 1000),
  ('Legend', 'Reach 25,000 total points', '🏆', 'milestone', 'legendary', 'points', 25000, 2000),
  ('3-Day Streak', 'Submit missions 3 days in a row', '🔥', 'activity', 'common', 'streak', 3, 150),
  ('Week Warrior', 'Submit missions 7 days in a row', '⚡', 'activity', 'rare', 'streak', 7, 300),
  ('Unstoppable', 'Submit missions 30 days in a row', '🌟', 'activity', 'legendary', 'streak', 30, 1000),
  ('Photo Ninja', '100% approval rate with 20+ submissions', '📸', 'quality', 'epic', 'custom', 20, 500),
  ('Network Specialist', 'Complete 100 Network Experience missions', '📶', 'specialty', 'rare', 'custom', 100, 400);

-- =====================================================
-- USER ACHIEVEMENTS (Unlocked Badges)
-- =====================================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- =====================================================
-- CHALLENGES TABLE
-- =====================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'special'
  requirement TEXT NOT NULL,
  reward_points INTEGER NOT NULL,
  icon VARCHAR(10),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_challenges_active ON challenges(is_active, start_date, end_date);
CREATE INDEX idx_challenges_type ON challenges(challenge_type);

-- =====================================================
-- USER CHALLENGES (Progress Tracking)
-- =====================================================
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_completed ON user_challenges(is_completed);

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'region', 'team', 'individual'
  target_filter JSONB, -- {region: 'Nairobi'} or {team: 'Alpha'}
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX idx_announcements_priority ON announcements(priority);

-- =====================================================
-- HOTSPOTS TABLE (Battle Map)
-- =====================================================
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  region VARCHAR(100) NOT NULL,
  submission_count INTEGER DEFAULT 0,
  avg_points DECIMAL(8, 2) DEFAULT 0,
  dominant_competitor VARCHAR(100),
  trend VARCHAR(20), -- 'up', 'down', 'stable'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hotspots_location ON hotspots(location_lat, location_lng);
CREATE INDEX idx_hotspots_region ON hotspots(region);

-- =====================================================
-- COMPETITOR ACTIVITY TABLE
-- =====================================================
CREATE TABLE competitor_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_name VARCHAR(100) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  region VARCHAR(100),
  description TEXT,
  threat_level VARCHAR(20), -- 'low', 'medium', 'high'
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competitor_activity_competitor ON competitor_activity(competitor_name);
CREATE INDEX idx_competitor_activity_reported_at ON competitor_activity(reported_at DESC);

-- =====================================================
-- STREAKS TABLE (Track Daily Submission Streaks)
-- =====================================================
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_submission_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_streaks_user ON streaks(user_id);

-- Function to update streaks
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_sub_date DATE;
  current_str INTEGER;
  longest_str INTEGER;
BEGIN
  IF NEW.status = 'approved' THEN
    -- Get current streak data
    SELECT last_submission_date, current_streak, longest_streak
    INTO last_sub_date, current_str, longest_str
    FROM streaks
    WHERE user_id = NEW.se_id;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
      INSERT INTO streaks (user_id, current_streak, longest_streak, last_submission_date)
      VALUES (NEW.se_id, 1, 1, CURRENT_DATE);
    ELSE
      -- Check if submission is consecutive
      IF last_sub_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Continue streak
        current_str := current_str + 1;
        longest_str := GREATEST(longest_str, current_str);
      ELSIF last_sub_date = CURRENT_DATE THEN
        -- Same day, no change
        current_str := current_str;
      ELSE
        -- Streak broken, reset
        current_str := 1;
      END IF;

      -- Update streak record
      UPDATE streaks
      SET current_streak = current_str,
          longest_streak = longest_str,
          last_submission_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE user_id = NEW.se_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update streaks
CREATE TRIGGER update_streak_trigger
AFTER INSERT OR UPDATE OF status ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_streak();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- SEs can read their own submissions
CREATE POLICY "SEs can read own submissions" ON submissions
  FOR SELECT USING (se_id::text = auth.uid()::text OR (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- SEs can insert their own submissions
CREATE POLICY "SEs can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (se_id::text = auth.uid()::text);

-- Admins can update submissions (review)
CREATE POLICY "Admins can update submissions" ON submissions
  FOR UPDATE USING ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- Everyone can read announcements
CREATE POLICY "Everyone can read announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- Admins can create announcements
CREATE POLICY "Admins can create announcements" ON announcements
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin');

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to calculate total points for a user
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(points_awarded), 0)::INTEGER
  FROM submissions
  WHERE se_id = p_user_id AND status = 'approved';
$$ LANGUAGE SQL STABLE;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT rank::INTEGER
  FROM leaderboard
  WHERE id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- INITIAL DATA (Demo Accounts)
-- =====================================================

-- Create admin account (password: Admin@123)
-- Pin hash is bcrypt hash of '1234'
INSERT INTO users (phone, email, full_name, role, region, pin_hash) VALUES
  ('+254712000001', 'admin@airtel.co.ke', 'System Administrator', 'admin', 'Nairobi', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S');

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mission_types_updated_at BEFORE UPDATE ON mission_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_point_config_updated_at BEFORE UPDATE ON point_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE ON user_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE users IS 'All users (SEs and Admins) in the system';
COMMENT ON TABLE submissions IS 'Evidence submissions from Sales Executives';
COMMENT ON TABLE leaderboard IS 'Materialized view of SE rankings by points';
COMMENT ON TABLE achievements IS 'Available badges that can be unlocked';
COMMENT ON TABLE challenges IS 'Daily/weekly challenges for engagement';
COMMENT ON TABLE announcements IS 'System-wide announcements and messages';
COMMENT ON TABLE hotspots IS 'High-activity geographic locations';
COMMENT ON TABLE competitor_activity IS 'Reported competitor intelligence';
COMMENT ON TABLE streaks IS 'Daily submission streak tracking';

-- =====================================================
-- ADDITIONAL TABLES FOR ADMIN DASHBOARD
-- =====================================================

-- Regions Table
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  country VARCHAR(100) DEFAULT 'Kenya',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Kenya regions
INSERT INTO regions (name, code) VALUES
  ('Nairobi', 'NBI'),
  ('Mombasa', 'MBA'),
  ('Kisumu', 'KSM'),
  ('Nakuru', 'NKU'),
  ('Eldoret', 'ELD'),
  ('Central', 'CNT'),
  ('Rift Valley', 'RVL'),
  ('Western', 'WST'),
  ('Nyanza', 'NYZ'),
  ('Eastern', 'EST'),
  ('Coast', 'CST'),
  ('North Eastern', 'NET');

-- Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regions(id),
  leader_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_regions_name ON regions(name);
CREATE INDEX idx_teams_region ON teams(region_id);

-- =====================================================
-- VIEWS FOR API COMPATIBILITY
-- =====================================================

-- Sales Executives View (SEs only)
-- This view provides a clean interface for the API layer
CREATE VIEW sales_executives AS
SELECT 
  id,
  phone AS employee_id,
  full_name AS name,
  email,
  region AS region_id,
  team AS team_id,
  avatar_url,
  is_active,
  join_date,
  created_at
FROM users
WHERE role = 'se';

-- Admin Users View (Admins only)
CREATE VIEW admin_users AS
SELECT 
  id,
  email,
  full_name AS name,
  region,
  created_at
FROM users
WHERE role = 'admin';

-- Daily Challenges View (Alias for challenges table)
CREATE VIEW daily_challenges AS
SELECT 
  id,
  title,
  description,
  requirement AS target_type,
  reward_points AS reward_points,
  start_date,
  end_date,
  is_active,
  created_at
FROM challenges;

-- Competitor Sightings View (Alias for competitor_activity)
CREATE VIEW competitor_sightings AS
SELECT 
  id,
  competitor_name,
  activity_type,
  location_lat,
  location_lng,
  region,
  description,
  threat_level,
  reported_by,
  reported_at AS created_at
FROM competitor_activity;

-- =====================================================
-- ADDITIONAL COMMENTS
-- =====================================================

COMMENT ON TABLE regions IS 'Geographic regions for SE assignments';
COMMENT ON TABLE teams IS 'Team organization structure within regions';
COMMENT ON VIEW sales_executives IS 'View of users with SE role for API compatibility';
COMMENT ON VIEW admin_users IS 'View of users with admin role for API compatibility';
COMMENT ON VIEW daily_challenges IS 'View alias for challenges table';
COMMENT ON VIEW competitor_sightings IS 'View alias for competitor_activity table';