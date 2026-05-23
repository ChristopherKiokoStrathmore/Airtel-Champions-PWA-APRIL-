-- ============================================================================
-- VAN DATABASE - INSERT 19 VANS ONLY
-- ============================================================================
-- Since van_db table already exists, this script just inserts the vans
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Insert all 19 vans (ON CONFLICT DO NOTHING prevents duplicates)
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

-- Enable RLS if not already enabled
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon read access" ON van_db;
DROP POLICY IF EXISTS "Service role full access" ON van_db;

-- Create RLS policies
CREATE POLICY "Allow anon read access"
ON van_db FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role full access"
ON van_db FOR ALL
USING (true)
WITH CHECK (true);

-- Enable RLS for van_calendar_plans if not already enabled
ALTER TABLE van_calendar_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon read access" ON van_calendar_plans;
DROP POLICY IF EXISTS "Allow anon insert" ON van_calendar_plans;
DROP POLICY IF EXISTS "Allow anon update" ON van_calendar_plans;
DROP POLICY IF EXISTS "Service role full access" ON van_calendar_plans;

-- Create RLS policies for van_calendar_plans
CREATE POLICY "Allow anon read access"
ON van_calendar_plans FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow anon insert"
ON van_calendar_plans FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anon update"
ON van_calendar_plans FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access"
ON van_calendar_plans FOR ALL
USING (true)
WITH CHECK (true);

-- Verify the data was inserted
SELECT 
  '✅ van_db table' AS table_name,
  COUNT(*) AS total_vans
FROM van_db;

-- Show vans by zone
SELECT 
  zone,
  COUNT(*) AS van_count,
  STRING_AGG(number_plate, ', ' ORDER BY number_plate) AS vans
FROM van_db
GROUP BY zone
ORDER BY zone;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================
-- Expected output:
-- ✅ van_db table | total_vans: 19
-- 
-- Then by zone:
-- CENTRAL: 3 vans
-- COAST: 3 vans
-- EASTERN: 2 vans
-- NAIROBI EAST: 3 vans
-- NORTH EASTERN: 1 van
-- NYANZA: 2 vans
-- SOUTH RIFT: 2 vans
-- WESTERN: 3 vans
-- ============================================================================
