-- ============================================
-- TAI SALES INTELLIGENCE NETWORK
-- DATABASE TABLE CREATION
-- ============================================
-- Creates all necessary tables for the TAI app
-- ============================================

-- 1. PROGRAMS TABLE
-- Stores intelligence gathering programs/campaigns
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    status TEXT DEFAULT 'active',
    points INTEGER DEFAULT 10,
    form_fields JSONB DEFAULT '[]'::jsonb,
    target_roles TEXT[] DEFAULT ARRAY['sales_executive'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    category TEXT DEFAULT 'intelligence',
    priority INTEGER DEFAULT 0
);

-- Disable RLS and grant permissions
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON programs TO anon, authenticated, service_role, postgres;

-- 2. SUBMISSIONS TABLE
-- Stores all SE submissions (auto-approved for analytics)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id),
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_role TEXT DEFAULT 'sales_executive',
    zone TEXT,
    region TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    points_awarded INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    location JSONB,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Disable RLS and grant permissions
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON submissions TO anon, authenticated, service_role, postgres;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_program_id ON submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_zone ON submissions(zone);

-- 3. USERS TABLE
-- Stores user profile data
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL,
    zone TEXT,
    region TEXT,
    phone TEXT,
    employee_id TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true
);

-- Disable RLS and grant permissions
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON users TO anon, authenticated, service_role, postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_zone ON users(zone);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);

-- 4. POSTS TABLE
-- Social Intelligence Network posts (Hall of Fame, etc.)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT,
    user_zone TEXT,
    content TEXT NOT NULL,
    images TEXT[],
    submission_id UUID REFERENCES submissions(id),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    visibility TEXT DEFAULT 'public',
    featured BOOLEAN DEFAULT false
);

-- Disable RLS and grant permissions
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
GRANT ALL ON posts TO anon, authenticated, service_role, postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);

-- 5. LIKES TABLE
-- Track post likes
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Disable RLS and grant permissions
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON likes TO anon, authenticated, service_role, postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 6. COMMENTS TABLE
-- Track post comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS and grant permissions
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON comments TO anon, authenticated, service_role, postgres;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- ============================================
-- FIX EXISTING KV_STORE TABLE PERMISSIONS
-- ============================================
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role, postgres;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    '✅ TABLES CREATED!' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('programs', 'submissions', 'users', 'posts', 'likes', 'comments', 'kv_store_28f2f653');

SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('programs', 'submissions', 'users', 'posts', 'likes', 'comments', 'kv_store_28f2f653')
ORDER BY tablename;

SELECT '🚀 DATABASE READY - REFRESH YOUR APP!' as message;
