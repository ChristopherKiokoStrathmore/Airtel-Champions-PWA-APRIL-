-- ============================================================================
-- VAN DATABASE SETUP
-- ============================================================================
-- This script sets up the van_db table with proper RLS policies
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CREATE TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS van_db (
  number_plate TEXT PRIMARY KEY,
  capacity TEXT,
  vendor TEXT,
  zone TEXT,
  zsm_county TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. INSERT SAMPLE DATA
-- ============================================================================
INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
VALUES ('KDT 261V', '9 SEATER', 'TOP TOUCH', 'EASTERN', 'MAKUENI')
ON CONFLICT (number_plate) DO NOTHING;

-- Add more vans as needed:
-- INSERT INTO van_db (number_plate, capacity, vendor, zone, zsm_county)
-- VALUES 
--   ('KCA 123A', '7 SEATER', 'BEST TRANSPORT', 'NAIROBI', 'NAIROBI'),
--   ('KDB 456B', '14 SEATER', 'SWIFT LOGISTICS', 'COAST', 'MOMBASA');

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: All authenticated users can READ vans
DROP POLICY IF EXISTS "Authenticated users can read vans" ON van_db;
CREATE POLICY "Authenticated users can read vans"
ON van_db
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Only admins (HQ staff) can INSERT new vans
DROP POLICY IF EXISTS "Admins can insert vans" ON van_db;
CREATE POLICY "Admins can insert vans"
ON van_db
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'director', 'zsm', 'asm')
  )
);

-- Policy 3: Only admins can UPDATE van details
DROP POLICY IF EXISTS "Admins can update vans" ON van_db;
CREATE POLICY "Admins can update vans"
ON van_db
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'director', 'zsm', 'asm')
  )
);

-- Policy 4: Only admins can DELETE vans
DROP POLICY IF EXISTS "Admins can delete vans" ON van_db;
CREATE POLICY "Admins can delete vans"
ON van_db
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'director', 'zsm', 'asm')
  )
);

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_van_db_zone ON van_db(zone);
CREATE INDEX IF NOT EXISTS idx_van_db_vendor ON van_db(vendor);
CREATE INDEX IF NOT EXISTS idx_van_db_zsm_county ON van_db(zsm_county);

-- Full-text search index for number plate (supports ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_van_db_number_plate_search 
ON van_db USING gin(to_tsvector('english', number_plate));

-- ============================================================================
-- 6. ADD TRIGGER FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_van_db_updated_at ON van_db;
CREATE TRIGGER update_van_db_updated_at
BEFORE UPDATE ON van_db
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. VERIFY SETUP
-- ============================================================================
SELECT 
  'van_db table' AS check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'van_db')
    THEN '✅ CREATED'
    ELSE '❌ NOT FOUND'
  END AS status;

SELECT 
  'RLS enabled' AS check_item,
  CASE 
    WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'van_db')
    THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END AS status;

SELECT 
  'Sample data' AS check_item,
  CASE 
    WHEN (SELECT COUNT(*) FROM van_db) > 0
    THEN '✅ ' || (SELECT COUNT(*) FROM van_db) || ' vans found'
    ELSE '⚠️ No vans in database'
  END AS status;

-- ============================================================================
-- 8. QUICK REFERENCE QUERIES
-- ============================================================================

-- View all vans
-- SELECT * FROM van_db ORDER BY number_plate;

-- Search by number plate
-- SELECT * FROM van_db WHERE number_plate ILIKE '%KDT%';

-- Filter by zone
-- SELECT * FROM van_db WHERE zone = 'EASTERN';

-- Count vans by zone
-- SELECT zone, COUNT(*) as van_count 
-- FROM van_db 
-- GROUP BY zone 
-- ORDER BY van_count DESC;

-- ============================================================================
-- COMPLETE! 🎉
-- ============================================================================
-- The van_db table is now ready to use with the Airtel Champions app.
-- The API endpoint will automatically pull data from this table.
