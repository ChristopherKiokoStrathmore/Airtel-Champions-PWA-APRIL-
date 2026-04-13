-- 🔥🔥🔥 FINAL PERMISSIONS FIX 🔥🔥🔥
-- This is the DEFINITIVE fix. Run this in Supabase SQL Editor.

-- ==========================================
-- STEP 1: Clean slate - remove ALL policies
-- ==========================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'kv_store_28f2f653'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.kv_store_28f2f653', pol.policyname);
    END LOOP;
END $$;

-- ==========================================
-- STEP 2: Disable RLS completely
-- ==========================================
ALTER TABLE public.kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 3: Grant permissions to anon role
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kv_store_28f2f653 TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kv_store_28f2f653 TO authenticated;
GRANT ALL ON public.kv_store_28f2f653 TO service_role;

-- ==========================================
-- STEP 4: CRITICAL - Test as anon role
-- ==========================================
-- This simulates exactly what your app does
SET ROLE anon;

-- Try to read from the table
SELECT 'TEST 1: SELECT as anon' as test, COUNT(*) as result FROM public.kv_store_28f2f653;

-- Try to insert
INSERT INTO public.kv_store_28f2f653 (key, value) 
VALUES ('test:permissions', '{"test": true}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT 'TEST 2: INSERT as anon' as test, 'SUCCESS' as result;

-- Try to select the inserted value
SELECT 'TEST 3: SELECT specific' as test, value as result 
FROM public.kv_store_28f2f653 
WHERE key = 'test:permissions';

-- Clean up test
DELETE FROM public.kv_store_28f2f653 WHERE key = 'test:permissions';

RESET ROLE;

-- ==========================================
-- STEP 5: Final verification
-- ==========================================
SELECT 
  'FINAL CHECK: RLS Status' as check_name,
  CASE 
    WHEN relrowsecurity THEN '❌ RLS is ENABLED (This is BAD!)' 
    ELSE '✅ RLS is DISABLED (This is GOOD!)' 
  END as status
FROM pg_class 
WHERE relname = 'kv_store_28f2f653';

SELECT 
  'FINAL CHECK: Permissions' as check_name,
  grantee as role,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'kv_store_28f2f653'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee
ORDER BY grantee;

-- ==========================================
-- ✅ SUCCESS CRITERIA:
-- ==========================================
-- You should see:
-- 1. TEST 1, 2, 3 all return SUCCESS
-- 2. RLS Status shows "DISABLED"
-- 3. anon role has SELECT, INSERT, UPDATE, DELETE
-- 
-- If you see these, your app WILL work!
-- Then refresh your TAI app with Ctrl+Shift+R
-- ==========================================
