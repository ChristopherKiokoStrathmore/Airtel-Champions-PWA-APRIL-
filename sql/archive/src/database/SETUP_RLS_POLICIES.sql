-- ============================================================================
-- VAN CALENDAR - RLS POLICY SETUP ONLY
-- ============================================================================
-- Vans already exist in database, just need to setup access policies
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable RLS and create read policies for van_db
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

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

-- Enable RLS and create policies for van_calendar_plans
ALTER TABLE van_calendar_plans ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow anon update" ON van_calendar_plans;
CREATE POLICY "Allow anon update" 
ON van_calendar_plans FOR UPDATE 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON van_calendar_plans;
CREATE POLICY "Service role full access" 
ON van_calendar_plans FOR ALL 
USING (true) 
WITH CHECK (true);

-- Verify you can now read the vans (should return 19)
SELECT COUNT(*) AS total_vans FROM van_db;

-- ============================================================================
-- EXPECTED OUTPUT: total_vans: 19
-- ============================================================================
-- If you see 19, the RLS policies are working correctly!
-- Now refresh your app and the modal should disappear.
-- ============================================================================
