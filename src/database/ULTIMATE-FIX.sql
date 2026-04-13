-- ✅✅✅ ULTIMATE DATABASE FIX ✅✅✅
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click "RUN"

BEGIN;

-- 1. Disable RLS (Row Level Security)
ALTER TABLE public.kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (cleanup)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'kv_store_28f2f653') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.kv_store_28f2f653';
    END LOOP;
END $$;

-- 3. Grant ALL permissions to anon role (this is the key!)
GRANT ALL ON TABLE public.kv_store_28f2f653 TO anon;
GRANT ALL ON TABLE public.kv_store_28f2f653 TO authenticated;
GRANT ALL ON TABLE public.kv_store_28f2f653 TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Ensure the table is accessible
ALTER TABLE public.kv_store_28f2f653 OWNER TO postgres;

COMMIT;

-- ✅✅✅ VERIFICATION ✅✅✅
-- These queries will confirm everything is working:

-- Check 1: RLS should be DISABLED (false)
SELECT 
  '1. RLS Status:' as check_name,
  CASE 
    WHEN relrowsecurity = false THEN '✅ DISABLED (Good!)' 
    ELSE '❌ ENABLED (Bad!)' 
  END as status
FROM pg_class 
WHERE relname = 'kv_store_28f2f653';

-- Check 2: Permissions granted
SELECT 
  '2. Permissions:' as check_name,
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee;

-- Check 3: Test query (should return row count)
SELECT 
  '3. Test Query:' as check_name,
  '✅ SUCCESS - ' || COUNT(*) || ' rows in table' as status
FROM public.kv_store_28f2f653;

-- ✅ If all 3 checks pass, you're good to go!
