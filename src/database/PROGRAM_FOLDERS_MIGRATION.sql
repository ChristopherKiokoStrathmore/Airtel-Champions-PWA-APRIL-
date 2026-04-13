-- ============================================================================
-- PROGRAM FOLDERS & ANALYTICS MIGRATION
-- ============================================================================
-- This migration adds folder organization and analytics for programs
-- Run this in Supabase SQL Editor after the main DATABASE-SETUP.sql
-- ============================================================================

-- ============================================================================
-- 1. CREATE PROGRAM_FOLDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ADD FOLDER_ID TO PROGRAMS TABLE
-- ============================================================================

-- Add folder_id column to programs table (nullable - programs can be unfoldered)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES program_folders(id) ON DELETE SET NULL;

-- ============================================================================
-- 3. DISABLE RLS AND GRANT PERMISSIONS
-- ============================================================================

ALTER TABLE program_folders DISABLE ROW LEVEL SECURITY;
GRANT ALL ON program_folders TO anon, authenticated, service_role;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_program_folders_order ON program_folders(order_index);
CREATE INDEX IF NOT EXISTS idx_programs_folder_id ON programs(folder_id);

-- ============================================================================
-- 5. CREATE ANALYTICS VIEW FOR PROGRAM PERFORMANCE
-- ============================================================================

CREATE OR REPLACE VIEW program_analytics AS
SELECT 
  p.id AS program_id,
  p.title AS program_title,
  p.folder_id,
  p.category,
  p.points_value,
  p.status,
  
  -- Submission counts
  COUNT(DISTINCT s.id) AS total_submissions,
  COUNT(DISTINCT s.user_id) AS unique_users,
  
  -- Points analytics
  SUM(s.points_awarded) AS total_points_awarded,
  AVG(s.points_awarded) AS avg_points_per_submission,
  
  -- Time analytics
  MIN(s.submitted_at) AS first_submission,
  MAX(s.submitted_at) AS last_submission,
  
  -- Status breakdown
  COUNT(DISTINCT CASE WHEN s.status = 'pending' THEN s.id END) AS pending_count,
  COUNT(DISTINCT CASE WHEN s.status = 'approved' THEN s.id END) AS approved_count,
  COUNT(DISTINCT CASE WHEN s.status = 'rejected' THEN s.id END) AS rejected_count,
  
  -- Daily submission rate (last 7 days)
  COUNT(DISTINCT CASE WHEN s.submitted_at >= NOW() - INTERVAL '7 days' THEN s.id END) AS submissions_last_7_days,
  
  -- Weekly submission rate (last 30 days)
  COUNT(DISTINCT CASE WHEN s.submitted_at >= NOW() - INTERVAL '30 days' THEN s.id END) AS submissions_last_30_days

FROM programs p
LEFT JOIN submissions s ON p.id = s.program_id
GROUP BY p.id, p.title, p.folder_id, p.category, p.points_value, p.status;

-- Grant access to analytics view
GRANT SELECT ON program_analytics TO anon, authenticated, service_role;

-- ============================================================================
-- 6. CREATE DAILY SUBMISSION TREND VIEW
-- ============================================================================

CREATE OR REPLACE VIEW program_daily_trends AS
SELECT 
  s.program_id,
  DATE(s.submitted_at) AS submission_date,
  COUNT(*) AS submissions_count,
  COUNT(DISTINCT s.user_id) AS unique_users,
  SUM(s.points_awarded) AS total_points
FROM submissions s
WHERE s.submitted_at >= NOW() - INTERVAL '30 days'
GROUP BY s.program_id, DATE(s.submitted_at)
ORDER BY s.program_id, DATE(s.submitted_at) DESC;

GRANT SELECT ON program_daily_trends TO anon, authenticated, service_role;

-- ============================================================================
-- 7. CREATE TOP PERFORMERS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW program_top_performers AS
SELECT 
  s.program_id,
  s.user_id,
  COUNT(*) AS submission_count,
  SUM(s.points_awarded) AS total_points,
  MAX(s.submitted_at) AS last_submission
FROM submissions s
WHERE s.submitted_at >= NOW() - INTERVAL '30 days'
GROUP BY s.program_id, s.user_id
ORDER BY s.program_id, submission_count DESC;

GRANT SELECT ON program_top_performers TO anon, authenticated, service_role;

-- ============================================================================
-- 8. INSERT SAMPLE FOLDERS (Optional)
-- ============================================================================

INSERT INTO program_folders (name, description, icon, color, order_index)
VALUES
  ('Sales Programs', 'Programs focused on sales activities and targets', '💰', 'green', 1),
  ('Customer Experience', 'Programs for improving customer satisfaction', '😊', 'blue', 2),
  ('Network Quality', 'Programs for network testing and feedback', '📡', 'purple', 3),
  ('Training & Development', 'Learning and skill development programs', '📚', 'orange', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. CREATE FUNCTION TO UPDATE FOLDER UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folder_timestamp
BEFORE UPDATE ON program_folders
FOR EACH ROW
EXECUTE FUNCTION update_folder_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Verify tables created: SELECT * FROM program_folders;
-- 2. Test analytics: SELECT * FROM program_analytics;
-- 3. Check indexes: \d program_folders
-- ============================================================================
