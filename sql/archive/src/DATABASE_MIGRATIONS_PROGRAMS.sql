-- ============================================
-- TAI PROGRAMS FEATURE - DATABASE MIGRATIONS
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor

-- ============================================
-- 1. CREATE PROGRAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_value INTEGER DEFAULT 10 CHECK (points_value >= 1 AND points_value <= 500),
  target_roles TEXT[] DEFAULT ARRAY['sales_executive'],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_target_roles ON programs USING GIN(target_roles);
CREATE INDEX idx_programs_created_at ON programs(created_at DESC);

-- Add RLS policies
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Everyone can read active programs they're targeted for
CREATE POLICY "Users can view programs for their role"
  ON programs FOR SELECT
  USING (
    status = 'active' AND
    (
      target_roles @> ARRAY['sales_executive'] OR
      target_roles @> ARRAY['zonal_sales_manager'] OR
      target_roles @> ARRAY['zonal_business_manager'] OR
      target_roles @> ARRAY['director'] OR
      target_roles @> ARRAY['hq_command_center']
    )
  );

-- Only Director and HQ can create/update/delete programs
CREATE POLICY "Director and HQ can manage programs"
  ON programs FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM app_users 
      WHERE role IN ('director', 'hq_command_center')
    )
  );

COMMENT ON TABLE programs IS 'Dynamic field programs created by Directors/HQ Team';

-- ============================================
-- 2. CREATE PROGRAM_FIELDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS program_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (
    field_type IN (
      'text', 'number', 'dropdown', 'multi_select', 'date', 'time',
      'photo', 'location', 'yes_no', 'rating', 'long_text'
    )
  ),
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- For dropdown/multi_select: {"options": ["Option 1", "Option 2"]}
  validation JSONB, -- For validation rules: {"min": 0, "max": 100, "pattern": "regex"}
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX idx_program_fields_order ON program_fields(program_id, order_index);

-- Add RLS policies
ALTER TABLE program_fields ENABLE ROW LEVEL SECURITY;

-- Everyone can read fields for active programs
CREATE POLICY "Users can view program fields"
  ON program_fields FOR SELECT
  USING (
    program_id IN (SELECT id FROM programs WHERE status = 'active')
  );

-- Only Director and HQ can manage fields
CREATE POLICY "Director and HQ can manage program fields"
  ON program_fields FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM app_users 
      WHERE role IN ('director', 'hq_command_center')
    )
  );

COMMENT ON TABLE program_fields IS 'Form fields for each program';

-- ============================================
-- 3. CREATE PROGRAM_SUBMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS program_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  responses JSONB NOT NULL, -- {"field_name": "value", "shop_name": "ABC Store"}
  photos JSONB, -- {"field_name": {"url": "https://...", "gps": {...}, "timestamp": "..."}}
  location JSONB, -- {"lat": -1.286389, "lng": 36.817223, "accuracy": 10, "timestamp": "2026-01-02T..."}
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES app_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_program_submissions_program_id ON program_submissions(program_id);
CREATE INDEX idx_program_submissions_user_id ON program_submissions(user_id);
CREATE INDEX idx_program_submissions_status ON program_submissions(status);
CREATE INDEX idx_program_submissions_submitted_at ON program_submissions(submitted_at DESC);
CREATE INDEX idx_program_submissions_user_program ON program_submissions(user_id, program_id);

-- Add RLS policies
ALTER TABLE program_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON program_submissions FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own submissions
CREATE POLICY "Users can create submissions"
  ON program_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Director and HQ can view all submissions
CREATE POLICY "Director and HQ can view all submissions"
  ON program_submissions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM app_users 
      WHERE role IN ('director', 'hq_command_center')
    )
  );

-- Director and HQ can update submissions (approve/reject)
CREATE POLICY "Director and HQ can update submissions"
  ON program_submissions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM app_users 
      WHERE role IN ('director', 'hq_command_center')
    )
  );

COMMENT ON TABLE program_submissions IS 'User responses to programs with GPS-tagged photos';

-- ============================================
-- 4. CREATE FUNCTION TO INCREMENT USER POINTS
-- ============================================

CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE app_users
  SET total_points = COALESCE(total_points, 0) + points_to_add
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_user_points IS 'Safely increment or decrement user points (pass negative to deduct)';

-- ============================================
-- 5. CREATE TRIGGER TO AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CREATE VIEWS FOR ANALYTICS
-- ============================================

-- View: Program Analytics Summary
CREATE OR REPLACE VIEW program_analytics AS
SELECT 
  p.id AS program_id,
  p.title,
  p.status,
  COUNT(ps.id) AS total_submissions,
  COUNT(DISTINCT ps.user_id) AS unique_participants,
  SUM(CASE WHEN ps.status = 'approved' THEN 1 ELSE 0 END) AS approved_submissions,
  SUM(CASE WHEN ps.status = 'pending' THEN 1 ELSE 0 END) AS pending_submissions,
  SUM(CASE WHEN ps.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_submissions,
  SUM(ps.points_awarded) AS total_points_awarded,
  AVG(ps.points_awarded) AS avg_points_per_submission,
  MAX(ps.submitted_at) AS last_submission_at
FROM programs p
LEFT JOIN program_submissions ps ON p.id = ps.program_id
GROUP BY p.id, p.title, p.status;

COMMENT ON VIEW program_analytics IS 'Summary analytics for each program';

-- View: Top Performers per Program
CREATE OR REPLACE VIEW program_top_performers AS
SELECT 
  ps.program_id,
  p.title AS program_title,
  ps.user_id,
  u.full_name,
  u.region,
  COUNT(ps.id) AS submission_count,
  SUM(ps.points_awarded) AS total_points_earned,
  MAX(ps.submitted_at) AS last_submission_at,
  ROW_NUMBER() OVER (PARTITION BY ps.program_id ORDER BY COUNT(ps.id) DESC) AS rank
FROM program_submissions ps
JOIN programs p ON ps.program_id = p.id
JOIN app_users u ON ps.user_id = u.id
WHERE ps.status = 'approved'
GROUP BY ps.program_id, p.title, ps.user_id, u.full_name, u.region;

COMMENT ON VIEW program_top_performers IS 'Top performing users for each program';

-- ============================================
-- 7. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ============================================

-- Insert a sample program (run this AFTER you have a Director/HQ user)
-- Replace 'YOUR_DIRECTOR_USER_ID' with actual Director's UUID

/*
INSERT INTO programs (title, description, points_value, target_roles, start_date, end_date, status, created_by)
VALUES (
  'AMBs to Keep List',
  'Daily shop visits - track shops we want to retain. Submit shop details with photo and GPS location.',
  10,
  ARRAY['sales_executive'],
  NOW(),
  NOW() + INTERVAL '30 days',
  'active',
  'YOUR_DIRECTOR_USER_ID'
) RETURNING id;

-- Insert sample fields for the program (replace PROGRAM_ID with the ID from above)
INSERT INTO program_fields (program_id, field_name, field_type, is_required, order_index)
VALUES
  ('PROGRAM_ID', 'Shop Name', 'text', true, 1),
  ('PROGRAM_ID', 'Shop Masterline', 'text', true, 2),
  ('PROGRAM_ID', 'Site ID', 'number', true, 3),
  ('PROGRAM_ID', 'ZSM', 'dropdown', true, 4),
  ('PROGRAM_ID', 'Shop Photo', 'photo', true, 5);

-- Update the dropdown field with ZSM options
UPDATE program_fields 
SET options = jsonb_build_object(
  'options', (
    SELECT jsonb_agg(DISTINCT full_name) 
    FROM app_users 
    WHERE role = 'zonal_sales_manager'
  )
)
WHERE field_name = 'ZSM' AND field_type = 'dropdown';
*/

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT ON programs TO authenticated;
GRANT SELECT ON program_fields TO authenticated;
GRANT SELECT, INSERT ON program_submissions TO authenticated;

-- Grant full access to service role (for Edge Functions)
GRANT ALL ON programs TO service_role;
GRANT ALL ON program_fields TO service_role;
GRANT ALL ON program_submissions TO service_role;

-- Grant access to views
GRANT SELECT ON program_analytics TO authenticated;
GRANT SELECT ON program_top_performers TO authenticated;

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Check if tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('programs', 'program_fields', 'program_submissions');

-- Check if indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('programs', 'program_fields', 'program_submissions');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('programs', 'program_fields', 'program_submissions');

-- ============================================
-- 10. ROLLBACK (if needed)
-- ============================================

/*
-- CAREFUL! This will delete all programs data
DROP VIEW IF EXISTS program_top_performers CASCADE;
DROP VIEW IF EXISTS program_analytics CASCADE;
DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS increment_user_points CASCADE;
DROP TABLE IF EXISTS program_submissions CASCADE;
DROP TABLE IF EXISTS program_fields CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
*/

-- ============================================
-- DONE! 🎉
-- ============================================
