-- ============================================
-- ULTIMATE FIX: Disable RLS completely for KV Store
-- ============================================
-- This is the nuclear option for prototyping
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DROP ALL EXISTING POLICIES (clean slate)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'kv_store_28f2f653') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON kv_store_28f2f653';
    END LOOP;
END $$;

-- 2. DISABLE RLS COMPLETELY (for prototyping)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- 3. Ensure all roles have full permissions
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;

-- 4. VERIFICATION: Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled?"
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- 5. VERIFICATION: Try SELECT as anon role
SET ROLE anon;
SELECT 'anon role SELECT test' as test, COUNT(*) as row_count FROM kv_store_28f2f653;
RESET ROLE;

-- 6. VERIFICATION: Try INSERT as anon role
SET ROLE anon;
INSERT INTO kv_store_28f2f653 (key, value) VALUES ('test:rls_check', 'RLS is disabled!') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
SELECT 'anon role INSERT test' as test, value FROM kv_store_28f2f653 WHERE key = 'test:rls_check';
RESET ROLE;

-- Expected output:
-- RLS Enabled? = false
-- SELECT test should return row count
-- INSERT test should return "RLS is disabled!"
