-- ============================================================================
-- DATABASE TRIGGERS - AUTO-AWARD ACHIEVEMENTS
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- This migration creates triggers to automatically award achievements
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================================

-- Function to award achievement to user
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_achievement_code TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id UUID;
  v_already_awarded BOOLEAN;
BEGIN
  -- Get achievement ID
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE code = p_achievement_code AND is_active = true;
  
  IF v_achievement_id IS NULL THEN
    RAISE NOTICE 'Achievement % not found or inactive', p_achievement_code;
    RETURN;
  END IF;
  
  -- Check if already awarded
  SELECT EXISTS (
    SELECT 1 FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id
  ) INTO v_already_awarded;
  
  IF v_already_awarded THEN
    RAISE NOTICE 'User % already has achievement %', p_user_id, p_achievement_code;
    RETURN;
  END IF;
  
  -- Award achievement
  INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
  VALUES (p_user_id, v_achievement_id, now());
  
  RAISE NOTICE '✅ Awarded achievement % to user %', p_achievement_code, p_user_id;
END;
$$;

-- Function to get user's submission count
CREATE OR REPLACE FUNCTION get_user_submission_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM submissions
  WHERE user_id = p_user_id AND status = 'approved';
$$;

-- Function to get user's total points
CREATE OR REPLACE FUNCTION get_user_total_points(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(points_awarded), 0)::INTEGER
  FROM submissions
  WHERE user_id = p_user_id AND status = 'approved';
$$;

-- Function to get user's current streak
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
  v_has_submission BOOLEAN;
BEGIN
  -- Count consecutive days with submissions
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM submissions
      WHERE user_id = p_user_id
      AND DATE(created_at) = v_date
      AND status = 'approved'
    ) INTO v_has_submission;
    
    EXIT WHEN NOT v_has_submission;
    
    v_streak := v_streak + 1;
    v_date := v_date - INTERVAL '1 day';
    
    -- Safety: max 365 days
    EXIT WHEN v_streak >= 365;
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- ============================================================================
-- SECTION 2: SUBMISSION TRIGGERS
-- ============================================================================

-- Trigger: Auto-award achievements on submission approval
CREATE OR REPLACE FUNCTION trigger_award_submission_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission_count INTEGER;
  v_total_points INTEGER;
  v_streak INTEGER;
BEGIN
  -- Only process on approval
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Get user stats
  v_submission_count := get_user_submission_count(NEW.user_id);
  v_total_points := get_user_total_points(NEW.user_id);
  v_streak := get_user_streak(NEW.user_id);
  
  -- Achievement: First Blood (1st submission)
  IF v_submission_count = 1 THEN
    PERFORM award_achievement(NEW.user_id, 'FIRST_BLOOD');
  END IF;
  
  -- Achievement: Getting Started (5 submissions)
  IF v_submission_count = 5 THEN
    PERFORM award_achievement(NEW.user_id, 'GETTING_STARTED');
  END IF;
  
  -- Achievement: Regular Contributor (10 submissions)
  IF v_submission_count = 10 THEN
    PERFORM award_achievement(NEW.user_id, 'REGULAR_CONTRIBUTOR');
  END IF;
  
  -- Achievement: Dedicated Agent (25 submissions)
  IF v_submission_count = 25 THEN
    PERFORM award_achievement(NEW.user_id, 'DEDICATED_AGENT');
  END IF;
  
  -- Achievement: Elite Operative (50 submissions)
  IF v_submission_count = 50 THEN
    PERFORM award_achievement(NEW.user_id, 'ELITE_OPERATIVE');
  END IF;
  
  -- Achievement: Master Spy (100 submissions)
  IF v_submission_count = 100 THEN
    PERFORM award_achievement(NEW.user_id, 'MASTER_SPY');
  END IF;
  
  -- Achievement: Legend (250 submissions)
  IF v_submission_count = 250 THEN
    PERFORM award_achievement(NEW.user_id, 'LEGEND');
  END IF;
  
  -- Achievement: Bronze Rank (500 points)
  IF v_total_points >= 500 AND v_total_points < 1000 THEN
    PERFORM award_achievement(NEW.user_id, 'BRONZE_RANK');
  END IF;
  
  -- Achievement: Silver Rank (1000 points)
  IF v_total_points >= 1000 AND v_total_points < 2500 THEN
    PERFORM award_achievement(NEW.user_id, 'SILVER_RANK');
  END IF;
  
  -- Achievement: Gold Rank (2500 points)
  IF v_total_points >= 2500 AND v_total_points < 5000 THEN
    PERFORM award_achievement(NEW.user_id, 'GOLD_RANK');
  END IF;
  
  -- Achievement: Platinum Rank (5000 points)
  IF v_total_points >= 5000 AND v_total_points < 10000 THEN
    PERFORM award_achievement(NEW.user_id, 'PLATINUM_RANK');
  END IF;
  
  -- Achievement: Diamond Rank (10000+ points)
  IF v_total_points >= 10000 THEN
    PERFORM award_achievement(NEW.user_id, 'DIAMOND_RANK');
  END IF;
  
  -- Achievement: 3 Day Streak
  IF v_streak >= 3 THEN
    PERFORM award_achievement(NEW.user_id, 'STREAK_3');
  END IF;
  
  -- Achievement: 7 Day Streak
  IF v_streak >= 7 THEN
    PERFORM award_achievement(NEW.user_id, 'STREAK_7');
  END IF;
  
  -- Achievement: 30 Day Streak
  IF v_streak >= 30 THEN
    PERFORM award_achievement(NEW.user_id, 'STREAK_30');
  END IF;
  
  -- Achievement: Weekend Warrior (submission on weekend)
  IF EXTRACT(DOW FROM NEW.created_at) IN (0, 6) THEN
    PERFORM award_achievement(NEW.user_id, 'WEEKEND_WARRIOR');
  END IF;
  
  -- Achievement: Early Bird (submission before 8 AM)
  IF EXTRACT(HOUR FROM NEW.created_at) < 8 THEN
    PERFORM award_achievement(NEW.user_id, 'EARLY_BIRD');
  END IF;
  
  -- Achievement: Night Owl (submission after 8 PM)
  IF EXTRACT(HOUR FROM NEW.created_at) >= 20 THEN
    PERFORM award_achievement(NEW.user_id, 'NIGHT_OWL');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_achievements ON submissions;
CREATE TRIGGER trigger_award_achievements
  AFTER UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_submission_achievements();

-- ============================================================================
-- SECTION 3: AUDIT LOG TRIGGER
-- ============================================================================

-- Trigger: Auto-create audit logs
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action TEXT;
  v_user_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
  END IF;
  
  -- Get current user (if available)
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION
    WHEN OTHERS THEN
      v_user_id := NULL;
  END;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers on important tables
DROP TRIGGER IF EXISTS audit_submissions ON submissions;
CREATE TRIGGER audit_submissions
  AFTER INSERT OR UPDATE OR DELETE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

DROP TRIGGER IF EXISTS audit_mission_types ON mission_types;
CREATE TRIGGER audit_mission_types
  AFTER INSERT OR UPDATE OR DELETE ON mission_types
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log();

-- ============================================================================
-- SECTION 4: LEADERBOARD SNAPSHOT TRIGGER
-- ============================================================================

-- Trigger: Update leaderboard snapshots
CREATE OR REPLACE FUNCTION trigger_update_leaderboard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process on submission approval
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Update or insert daily snapshot
  INSERT INTO leaderboard_snapshots (
    user_id,
    timeframe,
    rank,
    total_points,
    total_submissions,
    snapshot_date
  )
  SELECT 
    NEW.user_id,
    'daily',
    ROW_NUMBER() OVER (ORDER BY SUM(points_awarded) DESC),
    SUM(points_awarded),
    COUNT(*),
    CURRENT_DATE
  FROM submissions
  WHERE user_id = NEW.user_id
    AND status = 'approved'
    AND DATE(created_at) = CURRENT_DATE
  GROUP BY user_id
  ON CONFLICT (user_id, timeframe, snapshot_date)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    total_points = EXCLUDED.total_points,
    total_submissions = EXCLUDED.total_submissions,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_leaderboard_update ON submissions;
CREATE TRIGGER trigger_leaderboard_update
  AFTER UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_leaderboard();

-- ============================================================================
-- SECTION 5: CHALLENGE COMPLETION TRIGGER
-- ============================================================================

-- Trigger: Check challenge completion
CREATE OR REPLACE FUNCTION trigger_check_challenge_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_user_submissions INTEGER;
BEGIN
  -- Only process on submission approval
  IF NEW.status != 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;
  
  -- Check all active challenges
  FOR v_challenge IN 
    SELECT * FROM daily_challenges 
    WHERE is_active = true 
    AND start_date <= CURRENT_DATE 
    AND end_date >= CURRENT_DATE
  LOOP
    -- Count user's submissions for this challenge period
    SELECT COUNT(*) INTO v_user_submissions
    FROM submissions
    WHERE user_id = NEW.user_id
      AND status = 'approved'
      AND created_at >= v_challenge.start_date
      AND created_at <= v_challenge.end_date;
    
    -- Check if target reached
    IF v_user_submissions >= v_challenge.target_value THEN
      -- Award challenge badge/points (implement as needed)
      RAISE NOTICE 'User % completed challenge %!', NEW.user_id, v_challenge.id;
      
      -- You can add logic here to:
      -- 1. Award bonus points
      -- 2. Create notification
      -- 3. Award special achievement
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_challenge_check ON submissions;
CREATE TRIGGER trigger_challenge_check
  AFTER UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_challenge_completion();

-- ============================================================================
-- SECTION 6: NOTIFICATION TRIGGER
-- ============================================================================

-- Trigger: Send notification on submission status change
CREATE OR REPLACE FUNCTION trigger_submission_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Log notification (in real app, send push notification)
  RAISE NOTICE 'Submission % status changed: % → %', 
    NEW.id, OLD.status, NEW.status;
  
  -- You can implement actual notification logic here:
  -- 1. Insert into notifications table
  -- 2. Trigger push notification via external service
  -- 3. Send SMS/email
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_status_change ON submissions;
CREATE TRIGGER trigger_notify_status_change
  AFTER UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_submission_notification();

-- ============================================================================
-- SECTION 7: UPDATE TIMESTAMPS TRIGGER
-- ============================================================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers on all tables with updated_at
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_submissions_timestamp ON submissions;
CREATE TRIGGER update_submissions_timestamp
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

DROP TRIGGER IF EXISTS update_teams_timestamp ON teams;
CREATE TRIGGER update_teams_timestamp
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

-- ============================================================================
-- SECTION 8: SEED DEFAULT ACHIEVEMENTS
-- ============================================================================

-- Insert default achievements (if not exists)
INSERT INTO achievements (code, name, description, icon, category, tier, criteria, points_reward, is_active)
VALUES
  ('FIRST_BLOOD', 'First Blood', 'Complete your first mission', '🎯', 'submissions', 'bronze', 1, 50, true),
  ('GETTING_STARTED', 'Getting Started', 'Complete 5 missions', '🚀', 'submissions', 'bronze', 5, 100, true),
  ('REGULAR_CONTRIBUTOR', 'Regular Contributor', 'Complete 10 missions', '⭐', 'submissions', 'silver', 10, 200, true),
  ('DEDICATED_AGENT', 'Dedicated Agent', 'Complete 25 missions', '💪', 'submissions', 'silver', 25, 500, true),
  ('ELITE_OPERATIVE', 'Elite Operative', 'Complete 50 missions', '🏆', 'submissions', 'gold', 50, 1000, true),
  ('MASTER_SPY', 'Master Spy', 'Complete 100 missions', '🕵️', 'submissions', 'gold', 100, 2000, true),
  ('LEGEND', 'Legend', 'Complete 250 missions', '👑', 'submissions', 'platinum', 250, 5000, true),
  ('BRONZE_RANK', 'Bronze Rank', 'Earn 500 points', '🥉', 'points', 'bronze', 500, 50, true),
  ('SILVER_RANK', 'Silver Rank', 'Earn 1000 points', '🥈', 'points', 'silver', 1000, 100, true),
  ('GOLD_RANK', 'Gold Rank', 'Earn 2500 points', '🥇', 'points', 'gold', 2500, 250, true),
  ('PLATINUM_RANK', 'Platinum Rank', 'Earn 5000 points', '💎', 'points', 'platinum', 5000, 500, true),
  ('DIAMOND_RANK', 'Diamond Rank', 'Earn 10000 points', '💍', 'points', 'diamond', 10000, 1000, true),
  ('STREAK_3', '3 Day Streak', 'Submit for 3 consecutive days', '🔥', 'streak', 'bronze', 3, 100, true),
  ('STREAK_7', '7 Day Streak', 'Submit for 7 consecutive days', '🔥🔥', 'streak', 'silver', 7, 300, true),
  ('STREAK_30', '30 Day Streak', 'Submit for 30 consecutive days', '🔥🔥🔥', 'streak', 'gold', 30, 1000, true),
  ('WEEKEND_WARRIOR', 'Weekend Warrior', 'Submit on weekend', '🎉', 'special', 'bronze', 1, 50, true),
  ('EARLY_BIRD', 'Early Bird', 'Submit before 8 AM', '🌅', 'special', 'bronze', 1, 50, true),
  ('NIGHT_OWL', 'Night Owl', 'Submit after 8 PM', '🦉', 'special', 'bronze', 1, 50, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SECTION 9: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  achievement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid IN (
    SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
  );
  
  SELECT COUNT(*) INTO achievement_count
  FROM achievements
  WHERE is_active = true;
  
  RAISE NOTICE '✅ Database triggers created successfully!';
  RAISE NOTICE 'Total triggers: %', trigger_count;
  RAISE NOTICE 'Active achievements: %', achievement_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Auto-award features enabled:';
  RAISE NOTICE '- Achievement unlock on milestones';
  RAISE NOTICE '- Audit logging on changes';
  RAISE NOTICE '- Leaderboard auto-update';
  RAISE NOTICE '- Challenge completion tracking';
  RAISE NOTICE '- Status change notifications';
  RAISE NOTICE '- Timestamp auto-update';
END $$;

-- List all triggers
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid::regclass::text IN (
  'submissions', 'users', 'mission_types', 'teams'
)
ORDER BY table_name, trigger_name;

-- ============================================================================
-- END OF TRIGGERS
-- ============================================================================
