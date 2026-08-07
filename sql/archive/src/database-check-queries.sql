-- ========================================
-- TAI APP - DATABASE SCHEMA CHECK QUERIES
-- ========================================
-- Run these queries in Supabase SQL Editor to check your database structure
-- Copy and paste each query one at a time

-- ========================================
-- 1. CHECK app_users TABLE STRUCTURE
-- ========================================
-- This shows all columns in the app_users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'app_users'
ORDER BY ordinal_position;

-- Check if specific profile columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'bio'
    ) THEN '✅ bio column EXISTS' ELSE '❌ bio column MISSING' END as bio_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'avatar_url'
    ) THEN '✅ avatar_url column EXISTS' ELSE '❌ avatar_url column MISSING' END as avatar_url_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'banner_url'
    ) THEN '✅ banner_url column EXISTS' ELSE '❌ banner_url column MISSING' END as banner_url_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'app_users' AND column_name = 'created_at'
    ) THEN '✅ created_at column EXISTS' ELSE '❌ created_at column MISSING' END as created_at_status;

-- Sample data from app_users (first row)
SELECT * FROM app_users LIMIT 1;

-- ========================================
-- 2. CHECK submissions TABLE STRUCTURE
-- ========================================
-- This shows all columns in the submissions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position;

-- Check which user ID field exists in submissions
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'agent_id'
    ) THEN '✅ agent_id EXISTS' ELSE '❌ agent_id MISSING' END as agent_id_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'user_id'
    ) THEN '✅ user_id EXISTS' ELSE '❌ user_id MISSING' END as user_id_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'author_id'
    ) THEN '✅ author_id EXISTS' ELSE '❌ author_id MISSING' END as author_id_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' AND column_name = 'employee_id'
    ) THEN '✅ employee_id EXISTS' ELSE '❌ employee_id MISSING' END as employee_id_status;

-- Sample data from submissions (first row)
SELECT * FROM submissions LIMIT 1;

-- ========================================
-- 3. CHECK social_posts TABLE STRUCTURE
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'social_posts'
ORDER BY ordinal_position;

-- Sample data from social_posts (first row)
SELECT * FROM social_posts LIMIT 1;

-- ========================================
-- 4. CHECK social_comments TABLE STRUCTURE
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'social_comments'
ORDER BY ordinal_position;

-- ========================================
-- 5. CHECK social_likes TABLE STRUCTURE
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'social_likes'
ORDER BY ordinal_position;

-- ========================================
-- 6. CHECK ALL TABLES IN DATABASE
-- ========================================
-- This shows all tables in your public schema
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'app_users' THEN '👤 User Accounts'
        WHEN table_name = 'submissions' THEN '📋 Intelligence Submissions'
        WHEN table_name = 'social_posts' THEN '📱 Social Feed Posts'
        WHEN table_name = 'social_comments' THEN '💬 Post Comments'
        WHEN table_name = 'social_likes' THEN '❤️ Post Likes'
        WHEN table_name = 'programs' THEN '📊 Programs/Campaigns'
        ELSE '📁 Other'
    END as description
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- 7. COUNT RECORDS IN EACH TABLE
-- ========================================
-- Check how many records exist in each table
SELECT 
    'app_users' as table_name, 
    COUNT(*) as record_count 
FROM app_users
UNION ALL
SELECT 
    'submissions' as table_name, 
    COUNT(*) as record_count 
FROM submissions
UNION ALL
SELECT 
    'social_posts' as table_name, 
    COUNT(*) as record_count 
FROM social_posts
UNION ALL
SELECT 
    'social_comments' as table_name, 
    COUNT(*) as record_count 
FROM social_comments
UNION ALL
SELECT 
    'social_likes' as table_name, 
    COUNT(*) as record_count 
FROM social_likes;

-- ========================================
-- 8. ADD MISSING PROFILE COLUMNS (IF NEEDED)
-- ========================================
-- Only run these if the columns are missing!
-- Check the results from Query #1 first

-- Add bio column (only if missing)
-- ALTER TABLE app_users ADD COLUMN bio TEXT;

-- Add avatar_url column (only if missing)
-- ALTER TABLE app_users ADD COLUMN avatar_url TEXT;

-- Add banner_url column (only if missing)
-- ALTER TABLE app_users ADD COLUMN banner_url TEXT;

-- Add created_at column (only if missing)
-- ALTER TABLE app_users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

-- ========================================
-- 9. CHECK STORAGE BUCKETS
-- ========================================
-- Note: This query might not work in all Supabase versions
-- Check the Storage section in Supabase Dashboard instead
-- Look for these buckets:
--   ✅ make-28f2f653-profile-pictures
--   ✅ make-28f2f653-profile-banners

SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE name LIKE 'make-28f2f653%';

-- ========================================
-- 10. COMPREHENSIVE SCHEMA EXPORT
-- ========================================
-- Export complete schema for all tables
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name 
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- ========================================
-- DONE! 
-- ========================================
-- Copy the results and share them with the developer
-- Or use the in-app "🔍 DB Check" button for automated checking
