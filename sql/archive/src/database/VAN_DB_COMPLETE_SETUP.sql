-- ============================================================================
-- VAN DATABASE COMPLETE SETUP WITH ID COLUMN
-- ============================================================================
-- This script creates the van_db table from scratch with all necessary columns
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. DROP EXISTING TABLE (if any)
-- ============================================================================
DROP TABLE IF EXISTS van_db CASCADE;

-- ============================================================================
-- 2. CREATE TABLE WITH ID COLUMN
-- ============================================================================
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

-- ============================================================================
-- 3. INSERT ALL 19 VANS DATA
-- ============================================================================
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

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: All authenticated users can READ vans
DROP POLICY IF EXISTS "Authenticated users can read vans" ON van_db;
CREATE POLICY "Authenticated users can read vans"
ON van_db
FOR SELECT
TO authenticated, anon
USING (true);

-- Policy 2: Service role can do everything
DROP POLICY IF EXISTS "Service role full access" ON van_db;
CREATE POLICY "Service role full access"
ON van_db
FOR ALL
USING (true)
WITH CHECK (true);

-- Policy 3: Allow anonymous read access (for frontend)
DROP POLICY IF EXISTS "Allow anon read access" ON van_db;
CREATE POLICY "Allow anon read access"
ON van_db
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_van_db_zone ON van_db(zone);
CREATE INDEX IF NOT EXISTS idx_van_db_vendor ON van_db(vendor);
CREATE INDEX IF NOT EXISTS idx_van_db_zsm_county ON van_db(zsm_county);
CREATE INDEX IF NOT EXISTS idx_van_db_number_plate ON van_db(number_plate);

-- ============================================================================
-- 7. ADD TRIGGER FOR UPDATED_AT
-- ============================================================================
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
-- 8. VERIFY SETUP
-- ============================================================================
SELECT 
  '✅ van_db table created' AS status,
  COUNT(*) AS total_vans,
  MIN(id) AS min_id,
  MAX(id) AS max_id
FROM van_db;

-- Show all vans by zone
SELECT 
  zone,
  COUNT(*) AS van_count,
  STRING_AGG(number_plate, ', ' ORDER BY number_plate) AS vans
FROM van_db
GROUP BY zone
ORDER BY zone;

-- ============================================================================
-- 9. VERIFY COLUMNS
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'van_db'
ORDER BY ordinal_position;

-- ============================================================================
-- COMPLETE! 🎉
-- ============================================================================
-- The van_db table is now ready with:
-- ✅ 19 vans across 8 zones
-- ✅ Auto-incrementing ID column (1-19)
-- ✅ Unique number_plate constraint
-- ✅ RLS policies for security
-- ✅ Indexes for performance
-- ============================================================================
