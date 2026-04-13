-- ✅ VERIFY THE TABLE EXISTS AND CHECK PERMISSIONS
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if table exists in public schema
SELECT 
  '1️⃣ TABLE EXISTS?' as step,
  schemaname as schema,
  tablename,
  tableowner,
  CASE 
    WHEN rowsecurity THEN '❌ RLS ENABLED (BAD!)' 
    ELSE '✅ RLS DISABLED (GOOD!)' 
  END as rls_status
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- 2. Check permissions for service_role
SELECT 
  '2️⃣ PERMISSIONS' as step,
  grantee as role,
  privilege_type as permission
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
  AND grantee IN ('service_role', 'postgres', 'anon', 'authenticated')
ORDER BY grantee;

-- 3. Try to select from the table (as postgres)
SELECT 
  '3️⃣ READ TEST' as step,
  COUNT(*) as record_count,
  '✅ Table is readable!' as status
FROM kv_store_28f2f653;

-- 4. Try to insert into the table (as postgres)
INSERT INTO kv_store_28f2f653 (key, value) 
VALUES ('diagnostic:test', '{"timestamp": "' || NOW()::text || '", "test": "write_successful"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT 
  '4️⃣ WRITE TEST' as step,
  '✅ Table is writable!' as status;

-- 5. Check current database user
SELECT 
  '5️⃣ CURRENT USER' as step,
  current_user as database_user,
  current_database() as database_name;

-- 6. FINAL RESULT
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'kv_store_28f2f653' AND NOT rowsecurity)
    THEN '✅ SUCCESS! Table exists and RLS is disabled'
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'kv_store_28f2f653' AND rowsecurity)
    THEN '❌ PROBLEM! Table exists but RLS is ENABLED - run: ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;'
    ELSE '❌ PROBLEM! Table does not exist - run the CREATE TABLE SQL first'
  END as final_diagnosis;
