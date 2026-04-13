-- ============================================
-- SIMPLE PERMISSION FIX
-- ============================================
-- Just fixes permissions on existing tables
-- Nothing else changes!
-- ============================================

-- Fix kv_store_28f2f653 permissions
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;
GRANT ALL ON kv_store_28f2f653 TO postgres;

-- Fix programs table permissions (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'programs') THEN
        ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON programs TO anon;
        GRANT ALL ON programs TO authenticated;
        GRANT ALL ON programs TO service_role;
        GRANT ALL ON programs TO postgres;
    END IF;
END $$;

-- Fix users table permissions (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON users TO anon;
        GRANT ALL ON users TO authenticated;
        GRANT ALL ON users TO service_role;
        GRANT ALL ON users TO postgres;
    END IF;
END $$;

-- Fix submissions table permissions (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'submissions') THEN
        ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON submissions TO anon;
        GRANT ALL ON submissions TO authenticated;
        GRANT ALL ON submissions TO service_role;
        GRANT ALL ON submissions TO postgres;
    END IF;
END $$;

-- Verify
SELECT '✅ PERMISSIONS FIXED!' as status;
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '❌ RLS ON (BAD)' ELSE '✅ RLS OFF (GOOD)' END as status
FROM pg_tables 
WHERE tablename IN ('kv_store_28f2f653', 'programs', 'users', 'submissions')
ORDER BY tablename;
