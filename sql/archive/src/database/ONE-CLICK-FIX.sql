-- ============================================
-- 🚀 ONE-CLICK FIX: TAI Database Setup
-- ============================================
-- Copy all of this and paste into Supabase SQL Editor
-- Then click RUN
-- ============================================

-- ============================================
-- STEP 1: Create kv_store table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kv_store_28f2f653_key ON kv_store_28f2f653(key);

-- ============================================
-- STEP 2: Drop all existing RLS policies
-- ============================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'kv_store_28f2f653') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON kv_store_28f2f653';
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Disable RLS completely
-- ============================================
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Grant ALL permissions to all roles
-- ============================================
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;
GRANT ALL ON kv_store_28f2f653 TO postgres;

-- ============================================
-- STEP 5: Create programs table (for compatibility)
-- ============================================
-- Note: The app primarily uses KV store, but this prevents errors
CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    form_schema JSONB,
    target_roles TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on programs table
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON programs TO anon;
GRANT ALL ON programs TO authenticated;
GRANT ALL ON programs TO service_role;
GRANT ALL ON programs TO postgres;

-- ============================================
-- STEP 6: Create users table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    zone TEXT,
    region TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;
GRANT ALL ON users TO postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_zone ON users(zone);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);

-- ============================================
-- STEP 7: Create submissions table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    form_data JSONB NOT NULL,
    location TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON submissions TO anon;
GRANT ALL ON submissions TO authenticated;
GRANT ALL ON submissions TO service_role;
GRANT ALL ON submissions TO postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_program ON submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);

-- ============================================
-- STEP 8: Create storage bucket for images
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-28f2f653-uploads', 'make-28f2f653-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Drop all storage policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Create permissive storage policies
CREATE POLICY "allow_all_uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'make-28f2f653-uploads');

CREATE POLICY "allow_all_downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-28f2f653-uploads');

CREATE POLICY "allow_all_deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'make-28f2f653-uploads');

-- ============================================
-- STEP 9: Insert sample data (if empty)
-- ============================================

-- Insert test user if no users exist
INSERT INTO users (id, full_name, email, role, zone, region, total_points)
SELECT 'test-se-001', 'Test Sales Executive', 'test@airtel.com', 'sales_executive', 'Nairobi', 'Central', 0
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- ============================================
-- STEP 10: Verification
-- ============================================
SELECT 
    '✅ VERIFICATION RESULTS' as status,
    '' as blank;

SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN '❌ RLS ENABLED (BAD)' ELSE '✅ RLS DISABLED (GOOD)' END as rls_status
FROM pg_tables 
WHERE tablename IN ('kv_store_28f2f653', 'programs', 'users', 'submissions')
ORDER BY tablename;

-- Test access as anon role
SET ROLE anon;
SELECT '✅ TEST: anon can access kv_store' as test, COUNT(*) as row_count FROM kv_store_28f2f653;
SELECT '✅ TEST: anon can access programs' as test, COUNT(*) as row_count FROM programs;
SELECT '✅ TEST: anon can access users' as test, COUNT(*) as row_count FROM users;
SELECT '✅ TEST: anon can access submissions' as test, COUNT(*) as row_count FROM submissions;
RESET ROLE;

-- ============================================
-- SUCCESS! If you see all ✅ above, you're ready!
-- Refresh your TAI app now.
-- ============================================
