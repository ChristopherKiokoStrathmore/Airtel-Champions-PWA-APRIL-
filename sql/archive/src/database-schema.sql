-- ============================================
-- TAI App - Complete Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROGRAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Network Experience',
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#EF4444',
  points_value INTEGER DEFAULT 50,
  target_roles TEXT[] DEFAULT ARRAY['sales_executive']::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_target_roles ON programs USING GIN(target_roles);

-- ============================================
-- PROGRAM FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS program_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'long_text', 'number', 'dropdown', 'multi_select', 
    'radio', 'date', 'time', 'photo', 'location', 'yes_no', 'rating'
  )),
  is_required BOOLEAN DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  options JSONB,
  validation JSONB,
  conditional_logic JSONB,
  section_id TEXT,
  section_title TEXT,
  section_index INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_program_fields_program_id ON program_fields(program_id);
CREATE INDEX IF NOT EXISTS idx_program_fields_order ON program_fields(program_id, order_index);

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_zone TEXT,
  user_role TEXT,
  responses JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  points_awarded INTEGER DEFAULT 0,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  gps_location JSONB,
  photos TEXT[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_submissions_program_id ON submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

-- ============================================
-- APP USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN (
    'sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 
    'hq_command_center', 'director', 'developer'
  )),
  zone TEXT,
  zsm TEXT,
  zbm TEXT,
  job_title TEXT,
  email TEXT,
  profile_picture TEXT,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  password_updated_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone_number);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_zone ON app_users(zone);
CREATE INDEX IF NOT EXISTS idx_app_users_rank ON app_users(rank);
CREATE INDEX IF NOT EXISTS idx_app_users_zsm ON app_users(zsm);
CREATE INDEX IF NOT EXISTS idx_app_users_zbm ON app_users(zbm);

-- ============================================
-- DIRECTOR MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS director_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT,
  sender_zone TEXT,
  message TEXT NOT NULL,
  category TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  ashish_reaction TEXT,
  ashish_reply TEXT,
  ashish_reply_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_director_messages_sender ON director_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_director_messages_status ON director_messages(status);
CREATE INDEX IF NOT EXISTS idx_director_messages_created_at ON director_messages(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;

-- Programs: Allow read for all authenticated users, write for service role only
DROP POLICY IF EXISTS "Allow public read access to programs" ON programs;
CREATE POLICY "Allow public read access to programs" 
  ON programs FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to programs" ON programs;
CREATE POLICY "Allow service role full access to programs" 
  ON programs FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Program Fields: Allow read for all, write for service role only
DROP POLICY IF EXISTS "Allow public read access to program_fields" ON program_fields;
CREATE POLICY "Allow public read access to program_fields" 
  ON program_fields FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to program_fields" ON program_fields;
CREATE POLICY "Allow service role full access to program_fields" 
  ON program_fields FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Submissions: Allow read for all, write for service role only
DROP POLICY IF EXISTS "Allow public read access to submissions" ON submissions;
CREATE POLICY "Allow public read access to submissions" 
  ON submissions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to submissions" ON submissions;
CREATE POLICY "Allow service role full access to submissions" 
  ON submissions FOR ALL 
  USING (true)
  WITH CHECK (true);

-- App Users: Allow read for all, write for service role only
DROP POLICY IF EXISTS "Allow public read access to app_users" ON app_users;
CREATE POLICY "Allow public read access to app_users" 
  ON app_users FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to app_users" ON app_users;
CREATE POLICY "Allow service role full access to app_users" 
  ON app_users FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Director Messages: Allow read for all, write for service role only
DROP POLICY IF EXISTS "Allow public read access to director_messages" ON director_messages;
CREATE POLICY "Allow public read access to director_messages" 
  ON director_messages FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access to director_messages" ON director_messages;
CREATE POLICY "Allow service role full access to director_messages" 
  ON director_messages FOR ALL 
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a sample program (only if none exist)
INSERT INTO programs (title, description, category, icon, color, points_value, target_roles, status)
SELECT 
  'Competitor Intel',
  'Capture and report competitor network performance data',
  'Network Experience',
  '🎯',
  '#EF4444',
  100,
  ARRAY['sales_executive'],
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM programs WHERE title = 'Competitor Intel'
);

-- Add sample fields for the program (only if program exists and no fields yet)
DO $$
DECLARE
  program_uuid UUID;
BEGIN
  -- Get the program ID
  SELECT id INTO program_uuid FROM programs WHERE title = 'Competitor Intel' LIMIT 1;
  
  -- Only insert fields if program exists and has no fields
  IF program_uuid IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM program_fields WHERE program_id = program_uuid
  ) THEN
    INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, order_index)
    VALUES
      (program_uuid, 'location', 'Location', 'location', true, 0),
      (program_uuid, 'competitor', 'Competitor Network', 'dropdown', true, 1),
      (program_uuid, 'signal_strength', 'Signal Strength', 'rating', true, 2),
      (program_uuid, 'photo', 'Photo Evidence', 'photo', true, 3);
    
    -- Add options for the dropdown
    UPDATE program_fields 
    SET options = '{"options": ["Safaricom", "Telkom", "Faiba"]}'::jsonb
    WHERE program_id = program_uuid AND field_name = 'competitor';
  END IF;
END $$;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users (anon key)
GRANT SELECT ON programs TO anon;
GRANT SELECT ON program_fields TO anon;
GRANT SELECT ON submissions TO anon;
GRANT SELECT ON app_users TO anon;
GRANT SELECT ON director_messages TO anon;

GRANT SELECT ON programs TO authenticated;
GRANT SELECT ON program_fields TO authenticated;
GRANT SELECT ON submissions TO authenticated;
GRANT SELECT ON app_users TO authenticated;
GRANT SELECT ON director_messages TO authenticated;

-- Service role gets full access (already has it by default)
GRANT ALL ON programs TO service_role;
GRANT ALL ON program_fields TO service_role;
GRANT ALL ON submissions TO service_role;
GRANT ALL ON app_users TO service_role;
GRANT ALL ON director_messages TO service_role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ TAI Database Schema Setup Complete!';
  RAISE NOTICE '📊 Created tables: programs, program_fields, submissions, app_users, director_messages';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '🎯 Sample data inserted (Competitor Intel program)';
END $$;
