-- ============================================
-- TAI APP - PROGRAMS DATABASE SCHEMA
-- ============================================
-- SIMPLIFIED VERSION - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Step 2: Create program_fields table
CREATE TABLE IF NOT EXISTS program_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Step 3: Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  gps_location JSONB,
  photos TEXT[],
  points_awarded INTEGER DEFAULT 0,
  reviewed_by TEXT,
  review_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Disable RLS (for TAI custom auth)
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE program_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant full permissions
GRANT ALL ON programs TO anon, authenticated, service_role;
GRANT ALL ON program_fields TO anon, authenticated, service_role;
GRANT ALL ON submissions TO anon, authenticated, service_role;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_program_id ON submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);

-- Step 7: Insert sample program
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
ON CONFLICT DO NOTHING
RETURNING id, title;

-- Success message
SELECT 'SUCCESS! Tables created. Refresh your app now.' as message;
