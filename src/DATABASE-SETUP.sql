-- ============================================================================
-- TAI - Sales Intelligence Network
-- REQUIRED DATABASE SETUP
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- 6. Refresh your TAI application
-- ============================================================================

-- CREATE KV STORE TABLE (Required for all KV storage operations)
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- DISABLE ROW LEVEL SECURITY (TAI uses custom auth via localStorage)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- GRANT PERMISSIONS (Allow anon and authenticated users to access)
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;

-- CREATE INDEX for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_28f2f653(key);

-- ============================================================================
-- PROGRAMS SYSTEM TABLES (Optional - only if using Programs feature)
-- ============================================================================

-- Create programs table
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

-- Create program_fields table
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

-- Create submissions table
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

-- Disable RLS on programs tables (TAI uses custom auth)
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE program_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Grant permissions on programs tables
GRANT ALL ON programs TO anon, authenticated, service_role;
GRANT ALL ON program_fields TO anon, authenticated, service_role;
GRANT ALL ON submissions TO anon, authenticated, service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_category ON programs(category);
CREATE INDEX IF NOT EXISTS idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX IF NOT EXISTS idx_program_fields_order ON program_fields(order_index);
CREATE INDEX IF NOT EXISTS idx_submissions_program_id ON submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ============================================================================
-- SAMPLE DATA (Optional - creates a demo program)
-- ============================================================================

-- Insert sample program (you can delete this after testing)
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
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Check if kv_store table was created
-- SELECT COUNT(*) as kv_store_count FROM kv_store_28f2f653;

-- Check if programs table was created
-- SELECT COUNT(*) as programs_count FROM programs;

-- Check table permissions
-- SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('kv_store_28f2f653', 'programs', 'program_fields', 'submissions');

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If you see no errors above, your database is ready!
-- Refresh your TAI application and the errors should be gone.
-- ============================================================================
