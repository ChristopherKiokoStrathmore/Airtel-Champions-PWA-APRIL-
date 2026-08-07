-- ============================================================================
-- VAN CALENDAR SYSTEM - COMPLETE DATABASE SETUP
-- ============================================================================
-- This script creates ALL tables needed for the Van Calendar feature
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: VAN DATABASE TABLE (van_db)
-- ============================================================================

-- Drop existing table (if any)
DROP TABLE IF EXISTS van_db CASCADE;

-- Create van_db table
CREATE TABLE van_db (
  id SERIAL PRIMARY KEY,                          -- Auto-incrementing ID
  number_plate TEXT UNIQUE NOT NULL,              -- Unique number plate
  capacity TEXT,                                   -- Van capacity (e.g., "9 SEATER")
  vendor TEXT,                                     -- Vendor name (e.g., "TOP TOUCH")
  zone TEXT,                                       -- Zone (e.g., "EASTERN")
  zsm_county TEXT,                                 -- ZSM/County name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all 19 vans
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES 
  -- CENTRAL ZONE (3 vans)
  ('KDR 165K', '14 SEATER', 'TOP TOUCH', 'CENTRAL', 'MURANG''A'),
  ('KDR 124L', '14 SEATER', 'TOP TOUCH', 'CENTRAL', 'KIRINYAGA'),
  ('KDT 071V', '9 SEATER', 'TOP TOUCH', 'CENTRAL', 'NYANDARUA'),
  
  -- COAST ZONE (3 vans)
  ('KDR 127L', '14 SEATER', 'TOP TOUCH', 'COAST', 'KWALE'),
  ('KDR 165L', '14 SEATER', 'TOP TOUCH', 'COAST', 'KILIFI'),
  ('KDD 725H', '14 SEATER', 'TOP TOUCH', 'COAST', 'TAITA TAVETA'),
  
  -- EASTERN ZONE (2 vans)
  ('KDT 261V', '9 SEATER', 'TOP TOUCH', 'EASTERN', 'MAKUENI'),
  ('KDT 298V', '9 SEATER', 'TOP TOUCH', 'EASTERN', 'EMBU'),
  
  -- NAIROBI EAST ZONE (3 vans)
  ('KDT 299V', '9 SEATER', 'TOP TOUCH', 'NAIROBI EAST', 'RUIRU'),
  ('KDT 294V', '9 SEATER', 'TOP TOUCH', 'NAIROBI EAST', 'THIKA'),
  ('KDT 069V', '9 SEATER', 'TOP TOUCH', 'NAIROBI EAST', 'KIAMBU'),
  
  -- NORTH EASTERN ZONE (1 van)
  ('KDR 126L', '14 SEATER', 'TOP TOUCH', 'NORTH EASTERN', 'ISIOLO'),
  
  -- NYANZA ZONE (2 vans)
  ('KDT 262V', '9 SEATER', 'TOP TOUCH', 'NYANZA', 'MIGORI'),
  ('KDR 164L', '14 SEATER', 'TOP TOUCH', 'NYANZA', 'SIAYA'),
  
  -- SOUTH RIFT ZONE (2 vans)
  ('KDR 166K', '14 SEATER', 'TOP TOUCH', 'SOUTH RIFT', 'BOMET'),
  ('KDR 163K', '14 SEATER', 'TOP TOUCH', 'SOUTH RIFT', 'NAROK'),
  
  -- WESTERN ZONE (3 vans)
  ('KDR 161K', '14 SEATER', 'TOP TOUCH', 'WESTERN', 'BUNGOMA'),
  ('KDR 162K', '14 SEATER', 'TOP TOUCH', 'WESTERN', 'KAKAMEGA'),
  ('KDR 125L', '14 SEATER', 'TOP TOUCH', 'WESTERN', 'BUSIA')
ON CONFLICT (number_plate) DO NOTHING;

-- Enable RLS for van_db
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

-- RLS Policies for van_db
DROP POLICY IF EXISTS "Allow anon read access" ON van_db;
CREATE POLICY "Allow anon read access"
ON van_db FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Service role full access" ON van_db;
CREATE POLICY "Service role full access"
ON van_db FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for van_db
CREATE INDEX IF NOT EXISTS idx_van_db_zone ON van_db(zone);
CREATE INDEX IF NOT EXISTS idx_van_db_number_plate ON van_db(number_plate);

-- Trigger for updated_at on van_db
CREATE OR REPLACE FUNCTION update_van_db_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_van_db_updated_at ON van_db;
CREATE TRIGGER trigger_update_van_db_updated_at
BEFORE UPDATE ON van_db
FOR EACH ROW
EXECUTE FUNCTION update_van_db_updated_at();

-- ============================================================================
-- PART 2: VAN CALENDAR PLANS TABLE (van_calendar_plans)
-- ============================================================================

-- Drop existing table (if any)
DROP TABLE IF EXISTS van_calendar_plans CASCADE;

-- Create van_calendar_plans table
CREATE TABLE van_calendar_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Week information
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Van details
  van_id INTEGER NOT NULL REFERENCES van_db(id),
  van_numberplate TEXT NOT NULL,
  
  -- ZSM details
  zsm_id TEXT,                                    -- User ID from app_users
  zsm_name TEXT NOT NULL,
  zsm_phone TEXT,
  zsm_zone TEXT,
  
  -- Plan details
  rest_day INTEGER,                               -- 0=Sunday, 1=Monday, etc.
  daily_plans JSONB NOT NULL,                     -- Array of daily schedules
  
  -- Statistics
  total_sites_planned INTEGER DEFAULT 0,
  zones_covered TEXT[],
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  compliance_data JSONB,                          -- Calculated after week ends
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: One van can only have one plan per week
  UNIQUE(van_id, week_start_date)
);

-- Enable RLS for van_calendar_plans
ALTER TABLE van_calendar_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for van_calendar_plans
DROP POLICY IF EXISTS "Allow anon read access" ON van_calendar_plans;
CREATE POLICY "Allow anon read access"
ON van_calendar_plans FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon insert" ON van_calendar_plans;
CREATE POLICY "Allow anon insert"
ON van_calendar_plans FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON van_calendar_plans;
CREATE POLICY "Service role full access"
ON van_calendar_plans FOR ALL
USING (true)
WITH CHECK (true);

-- Indexes for van_calendar_plans
CREATE INDEX IF NOT EXISTS idx_van_calendar_plans_week_start ON van_calendar_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_van_calendar_plans_van_id ON van_calendar_plans(van_id);
CREATE INDEX IF NOT EXISTS idx_van_calendar_plans_zsm_id ON van_calendar_plans(zsm_id);
CREATE INDEX IF NOT EXISTS idx_van_calendar_plans_status ON van_calendar_plans(status);
CREATE INDEX IF NOT EXISTS idx_van_calendar_plans_van_week ON van_calendar_plans(van_id, week_start_date);

-- Trigger for updated_at on van_calendar_plans
CREATE OR REPLACE FUNCTION update_van_calendar_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_van_calendar_plans_updated_at ON van_calendar_plans;
CREATE TRIGGER trigger_update_van_calendar_plans_updated_at
BEFORE UPDATE ON van_calendar_plans
FOR EACH ROW
EXECUTE FUNCTION update_van_calendar_plans_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check van_db table
SELECT 
  '✅ van_db table created' AS status,
  COUNT(*) AS total_vans,
  MIN(id) AS min_id,
  MAX(id) AS max_id
FROM van_db;

-- Show vans by zone
SELECT 
  zone,
  COUNT(*) AS van_count,
  STRING_AGG(number_plate, ', ' ORDER BY number_plate) AS vans
FROM van_db
GROUP BY zone
ORDER BY zone;

-- Check van_calendar_plans table
SELECT 
  '✅ van_calendar_plans table created' AS status,
  COUNT(*) AS total_plans
FROM van_calendar_plans;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================
-- Tables created:
-- ✅ van_db (19 vans across 8 zones)
-- ✅ van_calendar_plans (ready for weekly schedules)
-- 
-- Both tables have:
-- ✅ RLS policies for security
-- ✅ Indexes for performance
-- ✅ Foreign key relationships
-- ✅ Auto-updating timestamps
-- ============================================================================
