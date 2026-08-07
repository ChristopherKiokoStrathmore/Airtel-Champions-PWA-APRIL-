-- TAI Database Schema for Supabase
-- Phase 7: Backend Integration

-- =====================================================
-- USERS TABLE (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  
  -- Role & Hierarchy
  role TEXT NOT NULL DEFAULT 'field_agent',
  zone TEXT,
  region TEXT,
  zsm TEXT, -- Zone Sales Manager
  zbm TEXT, -- Zone Business Manager
  
  -- Gamification
  total_points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 999,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_submission_date DATE,
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_upload_enabled BOOLEAN DEFAULT TRUE,
  gps_tracking_enabled BOOLEAN DEFAULT TRUE
);

-- Create index for faster queries
CREATE INDEX idx_users_rank ON users(rank);
CREATE INDEX idx_users_zone ON users(zone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(total_points DESC);

-- =====================================================
-- PROGRAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  color TEXT,
  points_value INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default programs
INSERT INTO programs (name, icon, description, color, points_value) VALUES
('Network Experience', '📶', 'Capture network quality and customer experience data', 'bg-blue-50 border-blue-200 text-blue-600', 10),
('Competition Conversion', '🎯', 'Document competitor customer conversions to Airtel', 'bg-green-50 border-green-200 text-green-600', 15),
('New Site Launch', '🚀', 'Report new network site launches and coverage', 'bg-purple-50 border-purple-200 text-purple-600', 12),
('AMB Visitation', '🏢', 'Track visits to Airtel Money Business locations', 'bg-orange-50 border-orange-200 text-orange-600', 8)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  
  -- Agent info
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_employee_id TEXT NOT NULL,
  
  -- Program info
  program_id INTEGER NOT NULL REFERENCES programs(id),
  program_name TEXT NOT NULL,
  program_icon TEXT NOT NULL,
  
  -- Submission content
  photo_url TEXT NOT NULL,
  photo_storage_path TEXT, -- Supabase Storage path
  notes TEXT NOT NULL,
  
  -- Location data
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  location_name TEXT,
  
  -- EXIF metadata
  camera_make TEXT,
  camera_model TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_by_name TEXT,
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Points
  points_earned INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes for faster queries
CREATE INDEX idx_submissions_agent ON submissions(agent_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_program ON submissions(program_id);
CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
CREATE INDEX idx_submissions_zone ON submissions(agent_id, created_at);

-- =====================================================
-- DAILY MISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_missions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Mission 1: Network Scout
  mission_1_title TEXT DEFAULT 'Network Scout',
  mission_1_description TEXT DEFAULT 'Submit 3 Network Experience reports',
  mission_1_target INTEGER DEFAULT 3,
  mission_1_progress INTEGER DEFAULT 0,
  mission_1_points INTEGER DEFAULT 15,
  mission_1_completed BOOLEAN DEFAULT FALSE,
  mission_1_claimed BOOLEAN DEFAULT FALSE,
  
  -- Mission 2: Quality Agent
  mission_2_title TEXT DEFAULT 'Quality Agent',
  mission_2_description TEXT DEFAULT 'Get 2 submissions approved by your ZSM',
  mission_2_target INTEGER DEFAULT 2,
  mission_2_progress INTEGER DEFAULT 0,
  mission_2_points INTEGER DEFAULT 20,
  mission_2_completed BOOLEAN DEFAULT FALSE,
  mission_2_claimed BOOLEAN DEFAULT FALSE,
  
  -- Mission 3: Early Bird
  mission_3_title TEXT DEFAULT 'Early Bird',
  mission_3_description TEXT DEFAULT 'Submit before 10:00 AM',
  mission_3_target INTEGER DEFAULT 1,
  mission_3_progress INTEGER DEFAULT 0,
  mission_3_points INTEGER DEFAULT 10,
  mission_3_completed BOOLEAN DEFAULT FALSE,
  mission_3_claimed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one set of missions per user per day
  UNIQUE(user_id, mission_date)
);

CREATE INDEX idx_daily_missions_user_date ON daily_missions(user_id, mission_date);

-- =====================================================
-- BADGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL, -- bronze, silver, gold, platinum
  criteria_type TEXT NOT NULL, -- submissions, streak, approval_rate, etc.
  criteria_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 25,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_rarity CHECK (rarity IN ('bronze', 'silver', 'gold', 'platinum'))
);

-- Insert default badges
INSERT INTO badges (name, description, icon, rarity, criteria_type, criteria_value, points_reward) VALUES
('First Step', 'Complete your first submission', '🎯', 'bronze', 'submissions', 1, 10),
('Early Bird', 'Submit before 10:00 AM for 5 days', '🌅', 'silver', 'early_submissions', 5, 20),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'gold', 'streak', 7, 25),
('Quality Agent', 'Get 10 submissions approved', '⭐', 'gold', 'approvals', 10, 30),
('Perfect Week', 'Get 100% approval rate for 7 days', '💯', 'platinum', 'perfect_week', 7, 50),
('Top 10', 'Reach top 10 on the leaderboard', '🏆', 'gold', 'rank', 10, 40),
('Century Club', 'Earn 100 total points', '💰', 'silver', 'points', 100, 25),
('Speed Demon', 'Submit 10 reports in one day', '⚡', 'gold', 'daily_submissions', 10, 35),
('Network Expert', 'Submit 50 Network Experience reports', '📶', 'gold', 'program_submissions', 50, 40),
('Conversion Master', 'Convert 25 competitor customers', '🎯', 'platinum', 'conversions', 25, 60),
('Month Streak', 'Maintain a 30-day streak', '📅', 'platinum', 'streak', 30, 100),
('Elite Agent', 'Reach Level 20', '👑', 'platinum', 'level', 20, 75)
ON CONFLICT DO NOTHING;

-- =====================================================
-- USER BADGES TABLE (Junction)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only unlock each badge once
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  short_message TEXT,
  
  -- Author info
  author_id UUID REFERENCES users(id),
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  
  -- Priority and targeting
  priority TEXT NOT NULL DEFAULT 'normal', -- high, important, normal
  target_audience TEXT DEFAULT 'all', -- all, zone_X, role_field_agent, etc.
  
  -- Display
  icon TEXT DEFAULT '📢',
  color TEXT DEFAULT 'blue',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'important', 'normal'))
);

CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX idx_announcements_target ON announcements(target_audience);

-- =====================================================
-- ANNOUNCEMENT READS TABLE (Track who read what)
-- =====================================================
CREATE TABLE IF NOT EXISTS announcement_reads (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only mark as read once per announcement
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_reads_user ON announcement_reads(user_id);

-- =====================================================
-- LEADERBOARD VIEW (Materialized for performance)
-- =====================================================
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  id,
  full_name,
  employee_id,
  zone,
  total_points,
  rank,
  level,
  current_streak,
  (SELECT COUNT(*) FROM submissions WHERE agent_id = users.id AND status = 'approved') as approved_submissions,
  (SELECT COUNT(*) FROM user_badges WHERE user_id = users.id) as badges_count
FROM users
WHERE role = 'field_agent'
ORDER BY total_points DESC, approved_submissions DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_leaderboard_id ON leaderboard(id);

-- Refresh function for leaderboard
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate rank on points update
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate ranks for all users
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, approved_submissions DESC) as new_rank
    FROM (
      SELECT 
        u.id,
        u.total_points,
        COUNT(s.id) FILTER (WHERE s.status = 'approved') as approved_submissions
      FROM users u
      LEFT JOIN submissions s ON u.id = s.agent_id
      WHERE u.role = 'field_agent'
      GROUP BY u.id
    ) user_stats
  )
  UPDATE users
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE users.id = ranked_users.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rank AFTER UPDATE OF total_points ON users
  FOR EACH ROW EXECUTE FUNCTION update_user_rank();

-- Auto-award points on submission approval
CREATE OR REPLACE FUNCTION award_points_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  program_points INTEGER;
BEGIN
  -- Only process if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get points for this program
    SELECT points_value INTO program_points
    FROM programs
    WHERE id = NEW.program_id;
    
    -- Update submission points
    NEW.points_earned = program_points;
    
    -- Add points to user's total
    UPDATE users
    SET total_points = total_points + program_points
    WHERE id = NEW.agent_id;
    
    -- Update daily missions progress
    -- Mission 2: Quality Agent (get approvals)
    UPDATE daily_missions
    SET 
      mission_2_progress = mission_2_progress + 1,
      mission_2_completed = (mission_2_progress + 1 >= mission_2_target)
    WHERE user_id = NEW.agent_id 
      AND mission_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_points BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION award_points_on_approval();

-- Auto-update daily missions on submission
CREATE OR REPLACE FUNCTION update_missions_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  submission_hour INTEGER;
BEGIN
  -- Get hour of submission
  submission_hour = EXTRACT(HOUR FROM NEW.captured_at);
  
  -- Ensure missions exist for today
  INSERT INTO daily_missions (user_id, mission_date)
  VALUES (NEW.agent_id, CURRENT_DATE)
  ON CONFLICT (user_id, mission_date) DO NOTHING;
  
  -- Mission 1: Network Scout (submit Network Experience reports)
  IF NEW.program_name = 'Network Experience' THEN
    UPDATE daily_missions
    SET 
      mission_1_progress = mission_1_progress + 1,
      mission_1_completed = (mission_1_progress + 1 >= mission_1_target)
    WHERE user_id = NEW.agent_id 
      AND mission_date = CURRENT_DATE;
  END IF;
  
  -- Mission 3: Early Bird (submit before 10 AM)
  IF submission_hour < 10 THEN
    UPDATE daily_missions
    SET 
      mission_3_progress = 1,
      mission_3_completed = TRUE
    WHERE user_id = NEW.agent_id 
      AND mission_date = CURRENT_DATE;
  END IF;
  
  -- Update streak
  UPDATE users
  SET 
    last_submission_date = CURRENT_DATE,
    current_streak = CASE 
      WHEN last_submission_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
      WHEN last_submission_date = CURRENT_DATE THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, 
      CASE 
        WHEN last_submission_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
        WHEN last_submission_date = CURRENT_DATE THEN current_streak
        ELSE 1
      END
    )
  WHERE id = NEW.agent_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_missions AFTER INSERT ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_missions_on_submission();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Field agents can read all submissions (for leaderboard)
CREATE POLICY submissions_select_all ON submissions
  FOR SELECT
  USING (true);

-- Users can insert their own submissions
CREATE POLICY submissions_insert_own ON submissions
  FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

-- ZSMs can update submissions in their zone
CREATE POLICY submissions_update_zsm ON submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'zone_commander'
        AND users.zone = (SELECT zone FROM users WHERE id = submissions.agent_id)
    )
  );

-- Users can read their own missions
CREATE POLICY missions_select_own ON daily_missions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own missions
CREATE POLICY missions_update_own ON daily_missions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Everyone can read announcements
CREATE POLICY announcements_select_all ON announcements
  FOR SELECT
  USING (is_active = true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get user's current rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT rank INTO user_rank
  FROM users
  WHERE id = p_user_id;
  
  RETURN COALESCE(user_rank, 999);
END;
$$ LANGUAGE plpgsql;

-- Check if user unlocked a badge
CREATE OR REPLACE FUNCTION check_badge_unlock(p_user_id UUID, p_badge_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  already_unlocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO already_unlocked;
  
  RETURN already_unlocked;
END;
$$ LANGUAGE plpgsql;

-- Award badge to user
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_id INTEGER)
RETURNS void AS $$
DECLARE
  badge_points INTEGER;
BEGIN
  -- Get badge points
  SELECT points_reward INTO badge_points
  FROM badges
  WHERE id = p_badge_id;
  
  -- Insert badge (will fail if already exists due to unique constraint)
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  -- Award points
  UPDATE users
  SET total_points = total_points + badge_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Note: Run this separately after authentication is set up
-- This is just for reference

/*
-- Create sample user (via Supabase Auth first, then update users table)
INSERT INTO users (id, email, phone_number, full_name, employee_id, role, zone, region)
VALUES 
  ('UUID_HERE', 'john@example.com', '0712345678', 'John Kamau', 'EMP001', 'field_agent', 'Zone 1', 'Nairobi'),
  ('UUID_HERE', 'mary@example.com', '0723456789', 'Mary Njeri', 'EMP002', 'field_agent', 'Zone 1', 'Nairobi'),
  ('UUID_HERE', 'james@example.com', '0734567890', 'James Mwangi', 'ZSM001', 'zone_commander', 'Zone 1', 'Nairobi');
*/

-- =====================================================
-- COMPLETED!
-- =====================================================
-- This schema provides:
-- ✅ Complete user management with gamification
-- ✅ Submissions with review workflow
-- ✅ Daily missions system
-- ✅ Badges and achievements
-- ✅ Announcements with read tracking
-- ✅ Leaderboard with materialized view
-- ✅ Automatic rank calculation
-- ✅ Point awards on approval
-- ✅ Mission progress tracking
-- ✅ Streak management
-- ✅ Row Level Security
-- ✅ Performance indexes
-- ✅ Trigger-based automation
