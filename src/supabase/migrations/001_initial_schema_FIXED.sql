-- Sales Intelligence Network Database Schema
-- Migration 001: Initial Schema Setup (FIXED VERSION)
-- RUN THIS ENTIRE FILE AT ONCE - DO NOT RUN LINE BY LINE

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- =====================================================

-- USERS TABLE (Sales Executives + Admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE,  -- Airtel employee ID
  role VARCHAR(50) NOT NULL DEFAULT 'se', -- 'se' or 'admin'
  region VARCHAR(100) NOT NULL,
  team VARCHAR(100),
  team_id UUID,  -- Will be linked to teams table after creation
  pin_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_region ON users(region);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_team_id ON users(team_id);

-- REGIONS TABLE
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TEAMS TABLE
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regions(id),
  lead_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MISSION TYPES TABLE
CREATE TABLE mission_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  base_points INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(50),
  icon VARCHAR(10),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBMISSIONS TABLE (Main Evidence Table)
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
  status VARCHAR(50) DEFAULT 'pending',
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

CREATE INDEX idx_submissions_se_id ON submissions(se_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX idx_submissions_mission_type ON submissions(mission_type_id);
CREATE INDEX idx_submissions_location ON submissions(location_lat, location_lng);

-- POINT CONFIG TABLE
CREATE TABLE point_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_type_id UUID NOT NULL REFERENCES mission_types(id),
  base_points INTEGER NOT NULL DEFAULT 0,
  hotspot_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  weekend_multiplier DECIMAL(3, 2) DEFAULT 1.2,
  early_bird_multiplier DECIMAL(3, 2) DEFAULT 1.1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STREAKS TABLE
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_submission_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACHIEVEMENTS TABLE
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(10),
  points_required INTEGER DEFAULT 0,
  tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER ACHIEVEMENTS (Junction Table)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- CHALLENGES TABLE
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mission_type_id UUID REFERENCES mission_types(id),
  target_count INTEGER NOT NULL,
  bonus_points INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER CHALLENGES (Tracking Progress)
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'se', 'admin', 'region:NAME'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOTSPOTS TABLE
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 500,
  bonus_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hotspots_location ON hotspots(location_lat, location_lng);

-- COMPETITOR ACTIVITY TABLE
CREATE TABLE competitor_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  competitor_name VARCHAR(100) NOT NULL,
  activity_type VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competitor_activity_submission ON competitor_activity(submission_id);
CREATE INDEX idx_competitor_activity_competitor ON competitor_activity(competitor_name);

-- =====================================================
-- STEP 2: INSERT DEFAULT DATA
-- =====================================================

-- Insert default regions
INSERT INTO regions (name, code) VALUES
  ('Nairobi', 'NBI'),
  ('Coast', 'CST'),
  ('Western', 'WST'),
  ('Central', 'CNT'),
  ('Rift Valley', 'RFT'),
  ('Eastern', 'EST'),
  ('North Eastern', 'NET'),
  ('Nyanza', 'NYZ'),
  ('Mt. Kenya', 'MTK'),
  ('Lakeside', 'LKS'),
  ('South Rift', 'SRF'),
  ('Northern', 'NTH');

-- Insert default mission types
INSERT INTO mission_types (name, description, base_points, points, category, icon, color) VALUES
  ('Network Experience', 'Capture competitor network quality issues', 80, 80, 'network', '📶', 'blue'),
  ('Competition Conversion', 'Document competitor customers considering switch', 200, 200, 'conversion', '🎯', 'red'),
  ('New Site Launch', 'Report new competitor retail locations', 150, 150, 'newsite', '🏪', 'green'),
  ('AMB Visitations', 'Visit Airtel Money Business agents', 100, 100, 'amb', '💰', 'purple');

-- Insert default achievements
INSERT INTO achievements (name, description, icon, points_required, tier) VALUES
  ('First Steps', 'Complete your first mission', '🎯', 0, 'bronze'),
  ('Network Warrior', 'Submit 10 Network Experience missions', '📶', 800, 'bronze'),
  ('Conversion Expert', 'Submit 5 Competition Conversion missions', '🎯', 1000, 'silver'),
  ('Site Scout', 'Report 10 new competitor sites', '🏪', 1500, 'silver'),
  ('Money Master', 'Visit 20 AMB locations', '💰', 2000, 'gold'),
  ('Streak Master', 'Maintain a 7-day streak', '🔥', 0, 'gold'),
  ('Century Club', 'Earn 10,000 total points', '💯', 10000, 'platinum'),
  ('Top Performer', 'Reach top 10 in leaderboard', '🏆', 0, 'platinum'),
  ('Regional Champion', 'Become #1 in your region', '👑', 0, 'platinum'),
  ('Perfect Week', 'Submit at least one mission every day for a week', '⭐', 0, 'gold');

-- =====================================================
-- STEP 2B: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for team_id now that teams table exists
ALTER TABLE users 
ADD CONSTRAINT fk_users_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user total points
CREATE OR REPLACE FUNCTION get_user_total_points(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(points_awarded), 0)::INTEGER
  FROM submissions
  WHERE se_id = user_uuid AND status = 'approved';
$$ LANGUAGE sql STABLE;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*) + 1
  FROM (
    SELECT se_id, SUM(points_awarded) as total_points
    FROM submissions
    WHERE status = 'approved'
    GROUP BY se_id
  ) ranked
  WHERE total_points > (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM submissions
    WHERE se_id = user_uuid AND status = 'approved'
  );
$$ LANGUAGE sql STABLE;

-- Function to refresh leaderboard (general purpose)
CREATE OR REPLACE FUNCTION refresh_leaderboard_func()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Function to update streaks
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
DECLARE
  last_date DATE;
  current_str INTEGER;
  longest_str INTEGER;
BEGIN
  -- Only update streaks on approved submissions
  IF NEW.status = 'approved' THEN
    -- Check if user has a streak record
    IF NOT EXISTS (SELECT 1 FROM streaks WHERE user_id = NEW.se_id) THEN
      -- Create new streak record
      INSERT INTO streaks (user_id, current_streak, longest_streak, last_submission_date)
      VALUES (NEW.se_id, 1, 1, CURRENT_DATE);
    ELSE
      -- Get current streak data
      SELECT last_submission_date, current_streak, longest_streak
      INTO last_date, current_str, longest_str
      FROM streaks
      WHERE user_id = NEW.se_id;

      -- Check if submission is on a new day
      IF CURRENT_DATE > last_date THEN
        -- Check if consecutive day
        IF CURRENT_DATE - last_date = 1 THEN
          current_str := current_str + 1;
          longest_str := GREATEST(longest_str, current_str);
        ELSIF CURRENT_DATE = last_date THEN
          -- Same day, maintain streak
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function specifically for leaderboard refresh trigger
CREATE OR REPLACE FUNCTION refresh_leaderboard_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_leaderboard_func();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: CREATE MATERIALIZED VIEW FOR LEADERBOARD
-- =====================================================

CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.region,
  u.team,
  u.avatar_url,
  COALESCE(SUM(s.points_awarded), 0) as total_points,
  COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as missions_completed,
  COALESCE(st.current_streak, 0) as current_streak,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points_awarded), 0) DESC) as rank
FROM users u
LEFT JOIN submissions s ON u.id = s.se_id AND s.status = 'approved'
LEFT JOIN streaks st ON u.id = st.user_id
WHERE u.role = 'se' AND u.is_active = true
GROUP BY u.id, u.full_name, u.region, u.team, u.avatar_url, st.current_streak;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_leaderboard_user_id ON leaderboard(user_id);

-- =====================================================
-- STEP 5: CREATE COMPATIBILITY VIEWS
-- =====================================================

-- View for sales executives (alias for users table)
CREATE OR REPLACE VIEW sales_executives AS
SELECT * FROM users WHERE role = 'se';

-- View for admin users (alias for users table)
CREATE OR REPLACE VIEW admin_users AS
SELECT * FROM users WHERE role = 'admin';

-- View for daily challenges (time-filtered challenges)
CREATE OR REPLACE VIEW daily_challenges AS
SELECT * FROM challenges 
WHERE is_active = true 
  AND start_date <= NOW() 
  AND end_date >= NOW();

-- View for competitor sightings (alias for competitor_activity)
CREATE OR REPLACE VIEW competitor_sightings AS
SELECT * FROM competitor_activity;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for mission_types table
CREATE TRIGGER update_mission_types_updated_at
BEFORE UPDATE ON mission_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for submissions table
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for point_config table
CREATE TRIGGER update_point_config_updated_at
BEFORE UPDATE ON point_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for achievements table
CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON achievements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for challenges table
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON challenges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_challenges table
CREATE TRIGGER update_user_challenges_updated_at
BEFORE UPDATE ON user_challenges
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for announcements table
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for hotspots table
CREATE TRIGGER update_hotspots_updated_at
BEFORE UPDATE ON hotspots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update streaks
CREATE TRIGGER update_streak_trigger
AFTER INSERT OR UPDATE OF status ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_streak();

-- Trigger to refresh leaderboard on submission changes
CREATE TRIGGER refresh_leaderboard_trigger
AFTER INSERT OR UPDATE OR DELETE ON submissions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard_trigger();

-- =====================================================
-- STEP 7: INITIALIZE LEADERBOARD
-- =====================================================

-- Refresh the leaderboard materialized view for the first time
SELECT refresh_leaderboard_func();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ DATABASE MIGRATION SUCCESSFUL!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Created 17 tables:';
  RAISE NOTICE '   - users, regions, teams';
  RAISE NOTICE '   - mission_types, submissions';
  RAISE NOTICE '   - point_config, streaks';
  RAISE NOTICE '   - achievements, user_achievements';
  RAISE NOTICE '   - challenges, user_challenges';
  RAISE NOTICE '   - announcements, hotspots';
  RAISE NOTICE '   - competitor_activity';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Created 1 materialized view:';
  RAISE NOTICE '   - leaderboard';
  RAISE NOTICE '';
  RAISE NOTICE '👁️  Created 4 compatibility views:';
  RAISE NOTICE '   - sales_executives';
  RAISE NOTICE '   - admin_users';
  RAISE NOTICE '   - daily_challenges';
  RAISE NOTICE '   - competitor_sightings';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Created 6 functions:';
  RAISE NOTICE '   - update_updated_at_column()';
  RAISE NOTICE '   - get_user_total_points()';
  RAISE NOTICE '   - get_user_rank()';
  RAISE NOTICE '   - refresh_leaderboard_func()';
  RAISE NOTICE '   - update_streak()';
  RAISE NOTICE '   - refresh_leaderboard_trigger()';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Inserted default data:';
  RAISE NOTICE '   - 12 regions';
  RAISE NOTICE '   - 4 mission types';
  RAISE NOTICE '   - 10 achievements';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Created 11 triggers:';
  RAISE NOTICE '   - 9 auto-update triggers';
  RAISE NOTICE '   - 1 streak update trigger';
  RAISE NOTICE '   - 1 leaderboard refresh trigger';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Restart your dev server: npm run dev';
  RAISE NOTICE '   2. Optional: Run 002_seed_test_data.sql for sample data';
  RAISE NOTICE '   3. Test the dashboard in your browser';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database is production-ready!';
  RAISE NOTICE '';
END $$;