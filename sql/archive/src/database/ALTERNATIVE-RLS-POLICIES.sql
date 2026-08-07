-- ============================================
-- ALTERNATIVE: Keep RLS ON but add permissive policies
-- ============================================
-- Use this if you want RLS enabled for security
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure RLS is enabled
ALTER TABLE kv_store_28f2f653 ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES (clean slate)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'kv_store_28f2f653') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON kv_store_28f2f653';
    END LOOP;
END $$;

-- 3. CREATE PERMISSIVE POLICIES (allow everything for prototyping)

-- Allow anon to SELECT
CREATE POLICY "anon_select_all" ON kv_store_28f2f653
    FOR SELECT
    TO anon
    USING (true);

-- Allow anon to INSERT
CREATE POLICY "anon_insert_all" ON kv_store_28f2f653
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow anon to UPDATE
CREATE POLICY "anon_update_all" ON kv_store_28f2f653
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow anon to DELETE
CREATE POLICY "anon_delete_all" ON kv_store_28f2f653
    FOR DELETE
    TO anon
    USING (true);

-- Allow authenticated to SELECT
CREATE POLICY "authenticated_select_all" ON kv_store_28f2f653
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated to INSERT
CREATE POLICY "authenticated_insert_all" ON kv_store_28f2f653
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated to UPDATE
CREATE POLICY "authenticated_update_all" ON kv_store_28f2f653
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated to DELETE
CREATE POLICY "authenticated_delete_all" ON kv_store_28f2f653
    FOR DELETE
    TO authenticated
    USING (true);

-- 4. VERIFICATION: Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'kv_store_28f2f653'
ORDER BY policyname;

-- 5. VERIFICATION: Test as anon
SET ROLE anon;
SELECT 'anon SELECT test' as test, COUNT(*) FROM kv_store_28f2f653;
INSERT INTO kv_store_28f2f653 (key, value) VALUES ('test:policy_check', 'Policies work!') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
SELECT 'anon INSERT test' as test, value FROM kv_store_28f2f653 WHERE key = 'test:policy_check';
RESET ROLE;

-- Expected output: Should see policies listed and tests pass
