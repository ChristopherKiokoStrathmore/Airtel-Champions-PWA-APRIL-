-- ✅ DISABLE RLS AND GRANT FULL ACCESS
-- Run this in Supabase SQL Editor

-- 1. Disable RLS completely (simpler for MVP)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "Allow anon read access" ON kv_store_28f2f653;
DROP POLICY IF EXISTS "Allow anon insert access" ON kv_store_28f2f653;
DROP POLICY IF EXISTS "Allow anon update access" ON kv_store_28f2f653;
DROP POLICY IF EXISTS "Allow anon delete access" ON kv_store_28f2f653;

-- 3. Grant full permissions to anon role
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO postgres;

-- 4. Grant sequence permissions (for auto-increment IDs if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ✅ VERIFY
SELECT 
  '✅ RLS DISABLED!' as status,
  CASE 
    WHEN relrowsecurity = false THEN '✅ RLS is OFF' 
    ELSE '❌ RLS is still ON' 
  END as rls_status
FROM pg_class 
WHERE relname = 'kv_store_28f2f653';

SELECT 
  '✅ PERMISSIONS GRANTED!' as status,
  grantee,
  string_agg(privilege_type, ', ') as permissions
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
GROUP BY grantee;

-- Test query (should work)
SELECT 
  '✅ Test query successful!' as test_status,
  COUNT(*) as total_rows
FROM kv_store_28f2f653;
