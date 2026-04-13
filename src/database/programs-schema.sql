-- ============================================================================
-- TAI PROGRAMS SYSTEM - Database Schema
-- ============================================================================
-- This SQL creates all tables needed for the dynamic programs/forms system
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. PROGRAMS TABLE
-- Stores program metadata (like Google Forms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Network Experience',
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#EF4444',
  points_value INTEGER NOT NULL DEFAULT 50,
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['sales_executive'],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_target_roles ON programs USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read active programs, only directors/HQ can create/modify
CREATE POLICY "Anyone can view active programs" ON programs
  FOR SELECT USING (status = 'active' OR auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can insert programs" ON programs
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can update programs" ON programs
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can delete programs" ON programs
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));


-- ============================================================================
-- 2. PROGRAM FIELDS TABLE
-- Stores form fields for each program (like Google Forms questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'long_text', 'number', 'dropdown', 'multi_select', 'radio',
    'date', 'time', 'photo', 'location', 'yes_no', 'rating', 'section'
  )),
  is_required BOOLEAN DEFAULT FALSE,
  placeholder TEXT,
  help_text TEXT,
  options JSONB, -- For dropdown/multi_select: { "options": ["Option 1", "Option 2"] }
  validation JSONB, -- For validation rules: { "min": 0, "max": 100, "pattern": "...", "error_message": "..." }
  conditional_logic JSONB, -- For conditional display: { "show_if_field": "field_name", "show_if_value": "value" }
  order_index INTEGER NOT NULL DEFAULT 0,
  section_id TEXT,
  section_title TEXT,
  section_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX IF NOT EXISTS idx_program_fields_order ON program_fields(program_id, order_index);

-- Enable Row Level Security
ALTER TABLE program_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read fields for active programs
CREATE POLICY "Anyone can view program fields" ON program_fields
  FOR SELECT USING (program_id IN (
    SELECT id FROM programs WHERE status = 'active'
  ) OR auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can insert fields" ON program_fields
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can update fields" ON program_fields
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));

CREATE POLICY "Directors and HQ can delete fields" ON program_fields
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'developer')
  ));


-- ============================================================================
-- 3. PROGRAM SUBMISSIONS TABLE
-- Stores user submissions to programs
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  submission_data JSONB NOT NULL, -- Stores all field values: { "field_name": "value", ... }
  location JSONB, -- GPS coordinates: { "latitude": 0, "longitude": 0 }
  photos TEXT[], -- Array of photo URLs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES app_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_program_submissions_program_id ON program_submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_submissions_user_id ON program_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_program_submissions_status ON program_submissions(status);
CREATE INDEX IF NOT EXISTS idx_program_submissions_submitted_at ON program_submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE program_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own submissions, managers can view all
CREATE POLICY "Users can view own submissions" ON program_submissions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() IN (
      SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'zonal_sales_manager', 'zonal_business_manager', 'developer')
    )
  );

CREATE POLICY "Users can insert own submissions" ON program_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can update submissions" ON program_submissions
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM app_users WHERE role IN ('director', 'hq_command_center', 'zonal_sales_manager', 'zonal_business_manager', 'developer')
  ));


-- ============================================================================
-- 4. ADD job_title COLUMN TO app_users (if not exists)
-- ============================================================================
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Set Ashish's job title
UPDATE app_users
SET job_title = 'Sales & Distribution Director'
WHERE role = 'director' OR full_name ILIKE '%ashish%';


-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get program submission count
CREATE OR REPLACE FUNCTION get_program_submission_count(p_program_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM program_submissions WHERE program_id = p_program_id;
$$ LANGUAGE SQL STABLE;

-- Function to get user's submission count for a program
CREATE OR REPLACE FUNCTION get_user_program_submissions(p_program_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM program_submissions 
  WHERE program_id = p_program_id AND user_id = p_user_id;
$$ LANGUAGE SQL STABLE;


-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT ALL ON programs TO authenticated;
GRANT ALL ON program_fields TO authenticated;
GRANT ALL ON program_submissions TO authenticated;

-- Grant access to service role (for backend operations)
GRANT ALL ON programs TO service_role;
GRANT ALL ON program_fields TO service_role;
GRANT ALL ON program_submissions TO service_role;


-- ============================================================================
-- 7. SAMPLE DATA - Launch Date Program (already created)
-- ============================================================================

-- This will recreate the Launch Date program if it doesn't exist
INSERT INTO programs (title, description, category, icon, color, points_value, target_roles, status)
VALUES (
  'Launch Date',
  'Track and verify network site launch dates across Kenya',
  'Network Experience',
  '🚀',
  '#EF4444',
  50,
  ARRAY['sales_executive'],
  'active'
)
ON CONFLICT DO NOTHING;

-- Get the program ID (you may need to adjust this based on your setup)
DO $$
DECLARE
  launch_program_id UUID;
BEGIN
  -- Find the Launch Date program
  SELECT id INTO launch_program_id FROM programs WHERE title = 'Launch Date' LIMIT 1;
  
  -- Only create fields if they don't exist
  IF launch_program_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM program_fields WHERE program_id = launch_program_id
  ) THEN
    -- Insert the 10 fields for Launch Date program
    INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, order_index, options)
    VALUES
      (launch_program_id, 'site_id', 'Site ID', 'dropdown', TRUE, 0, 
        '{"options": ["KE001", "KE002", "KE003"]}'), -- You'll need to add all 1,489 site IDs
      (launch_program_id, 'site_name', 'Site Name', 'text', TRUE, 1, NULL),
      (launch_program_id, 'launch_date', 'Launch Date', 'date', TRUE, 2, NULL),
      (launch_program_id, 'region', 'Region', 'dropdown', TRUE, 3,
        '{"options": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Other"]}'),
      (launch_program_id, 'site_type', 'Site Type', 'dropdown', TRUE, 4,
        '{"options": ["Macro Site", "Micro Site", "Indoor", "Outdoor"]}'),
      (launch_program_id, 'technology', 'Technology', 'multi_select', TRUE, 5,
        '{"options": ["2G", "3G", "4G", "5G"]}'),
      (launch_program_id, 'coordinates', 'GPS Location', 'location', TRUE, 6, NULL),
      (launch_program_id, 'site_photo', 'Site Photo', 'photo', TRUE, 7, NULL),
      (launch_program_id, 'operational_status', 'Operational Status', 'dropdown', TRUE, 8,
        '{"options": ["Fully Operational", "Partially Operational", "Testing Phase", "Not Operational"]}'),
      (launch_program_id, 'notes', 'Additional Notes', 'long_text', FALSE, 9, NULL);
  END IF;
END $$;


-- ============================================================================
-- DONE! 🎉
-- ============================================================================
-- Tables created:
--   ✅ programs
--   ✅ program_fields  
--   ✅ program_submissions
--   ✅ job_title column added to app_users
--
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Then refresh your app and the errors should be gone!
-- ============================================================================
