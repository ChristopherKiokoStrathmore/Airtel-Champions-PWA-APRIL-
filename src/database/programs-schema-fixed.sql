-- ============================================
-- TAI App - COMPLETE DATABASE FIX
-- ============================================
-- Run this in Supabase SQL Editor
-- This will create all tables needed for programs
-- ============================================

-- STEP 1: Clean up any existing tables to start fresh
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS program_submissions CASCADE;
DROP TABLE IF EXISTS program_fields CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

-- STEP 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROGRAMS TABLE
-- ============================================
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#EF4444',
  points_value INTEGER DEFAULT 50,
  target_roles TEXT[] DEFAULT ARRAY['sales_executive']::TEXT[],
  category TEXT DEFAULT 'Network Experience',
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_target_roles ON programs USING GIN(target_roles);
CREATE INDEX idx_programs_created_at ON programs(created_at DESC);

-- ============================================
-- PROGRAM FIELDS TABLE
-- ============================================
CREATE TABLE program_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  options JSONB,
  validation JSONB,
  conditional_logic JSONB,
  order_index INTEGER DEFAULT 0,
  section_id TEXT,
  section_title TEXT,
  section_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX idx_program_fields_order ON program_fields(program_id, order_index);

-- ============================================
-- SUBMISSIONS TABLE (matching your SQL)
-- ============================================
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  gps_location JSONB,
  photos TEXT[],
  points_awarded INTEGER DEFAULT 0,
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_submissions_program_id ON submissions(program_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- ============================================
-- ENSURE app_users TABLE EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  job_title TEXT,
  email TEXT,
  region TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS zone TEXT;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Programs" ON programs;
DROP POLICY IF EXISTS "Public Read Fields" ON program_fields;
DROP POLICY IF EXISTS "Public Read Users" ON app_users;
DROP POLICY IF EXISTS "Public Insert Submissions" ON submissions;
DROP POLICY IF EXISTS "Public Read Submissions" ON submissions;
DROP POLICY IF EXISTS "Public Update Submissions" ON submissions;

-- Create OPEN policies (TAI uses custom auth, not Supabase auth)
CREATE POLICY "Public Read Programs" ON programs FOR SELECT USING (true);
CREATE POLICY "Public Insert Programs" ON programs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Programs" ON programs FOR UPDATE USING (true);
CREATE POLICY "Public Delete Programs" ON programs FOR DELETE USING (true);

CREATE POLICY "Public Read Fields" ON program_fields FOR SELECT USING (true);
CREATE POLICY "Public Insert Fields" ON program_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Fields" ON program_fields FOR UPDATE USING (true);
CREATE POLICY "Public Delete Fields" ON program_fields FOR DELETE USING (true);

CREATE POLICY "Public Read Users" ON app_users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON app_users FOR UPDATE USING (true);

CREATE POLICY "Public Read Submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Public Insert Submissions" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Submissions" ON submissions FOR UPDATE USING (true);
CREATE POLICY "Public Delete Submissions" ON submissions FOR DELETE USING (true);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON programs TO anon, authenticated, service_role;
GRANT ALL ON program_fields TO anon, authenticated, service_role;
GRANT ALL ON submissions TO anon, authenticated, service_role;
GRANT ALL ON app_users TO anon, authenticated, service_role;

-- ============================================
-- SAMPLE DATA: Competitor Intel Program
-- ============================================
INSERT INTO programs (title, description, icon, color, points_value, target_roles, category, status)
VALUES (
  'Competitor Intel',
  'Report competitor activity in your zone',
  '🎯',
  '#EF4444',
  100,
  ARRAY['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'],
  'Network Experience',
  'active'
)
ON CONFLICT DO NOTHING;

-- Add fields for Competitor Intel
DO $$
DECLARE
  pid UUID;
BEGIN
  SELECT id INTO pid FROM programs WHERE title = 'Competitor Intel' LIMIT 1;
  
  IF pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM program_fields WHERE program_id = pid) THEN
    INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, order_index, options)
    VALUES
      (pid, 'location', 'Location', 'location', true, 0, NULL),
      (pid, 'competitor', 'Competitor Network', 'dropdown', true, 1, '{"options": ["Safaricom", "Telkom", "Faiba"]}'),
      (pid, 'signal_strength', 'Signal Strength', 'rating', true, 2, NULL),
      (pid, 'photo', 'Photo Evidence', 'photo', true, 3, NULL);
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ SUCCESS! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables created:';
  RAISE NOTICE '  ✅ programs';
  RAISE NOTICE '  ✅ program_fields';
  RAISE NOTICE '  ✅ submissions';
  RAISE NOTICE '  ✅ app_users (updated)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Sample program created: Competitor Intel';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Now refresh your TAI app and it will work!';
  RAISE NOTICE '';
END $$;
