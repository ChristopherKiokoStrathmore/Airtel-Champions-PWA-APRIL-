-- ========================================
-- TAI APP - DATABASE FIX SCRIPT
-- ========================================
-- Run these commands ONE AT A TIME in Supabase SQL Editor

-- ========================================
-- 1. ADD MISSING COLUMNS TO app_users
-- ========================================

-- Add bio column
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add avatar_url column
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add banner_url column
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name IN ('bio', 'avatar_url', 'banner_url')
ORDER BY column_name;

-- ========================================
-- 2. CREATE MISSING SOCIAL TABLES
-- ========================================

-- Create social_comments table
CREATE TABLE IF NOT EXISTS social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_author_id ON social_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_created_at ON social_comments(created_at DESC);

-- Create social_likes table
CREATE TABLE IF NOT EXISTS social_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_user_id ON social_likes(user_id);

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('social_comments', 'social_likes')
ORDER BY table_name;

-- ========================================
-- 3. UPDATE EXISTING social_posts TABLE
-- ========================================

-- Add missing columns if they don't exist
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS hall_of_fame BOOLEAN DEFAULT FALSE;

-- Update likes_count from likes column (if it exists as an integer)
UPDATE social_posts 
SET likes_count = COALESCE(likes, 0) 
WHERE likes_count = 0;

-- ========================================
-- 4. CREATE STORAGE BUCKETS (via Supabase Dashboard)
-- ========================================
-- NOTE: Storage buckets MUST be created via Supabase Dashboard Storage tab
-- because SQL commands for storage are restricted.
--
-- MANUAL STEPS:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: make-28f2f653-profile-pictures
-- 4. Set to PUBLIC
-- 5. Click "Save"
-- 6. Repeat for: make-28f2f653-profile-banners
--
-- ALTERNATIVE: If you have access to run SQL functions:

-- Create profile pictures bucket (if you have permissions)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('make-28f2f653-profile-pictures', 'make-28f2f653-profile-pictures', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create profile banners bucket (if you have permissions)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('make-28f2f653-profile-banners', 'make-28f2f653-profile-banners', true)
-- ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 5. VERIFY ALL FIXES
-- ========================================

-- Check app_users columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name IN ('bio', 'avatar_url', 'banner_url', 'created_at')
ORDER BY column_name;

-- Check social tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'social_%'
ORDER BY table_name;

-- Check storage buckets (may not work depending on permissions)
SELECT name, public 
FROM storage.buckets 
WHERE name LIKE 'make-28f2f653%'
ORDER BY name;

-- ========================================
-- DONE!
-- ========================================
-- After running these commands:
-- 1. Refresh your app
-- 2. Click "🔍 DB Check" button again
-- 3. All items should show ✅
-- 4. If storage buckets still show ❌, create them manually via Dashboard
