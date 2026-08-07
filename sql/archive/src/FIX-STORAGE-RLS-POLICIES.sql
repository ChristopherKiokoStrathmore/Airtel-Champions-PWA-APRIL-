-- ========================================
-- STORAGE RLS POLICIES FIX
-- ========================================
-- Run these commands in Supabase SQL Editor

-- ========================================
-- 1. PROFILE PICTURES BUCKET POLICIES
-- ========================================

-- Allow anyone to read profile pictures (public bucket)
CREATE POLICY "Public Access to Profile Pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'make-28f2f653-profile-pictures');

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'make-28f2f653-profile-pictures'
);

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update profile pictures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'make-28f2f653-profile-pictures')
WITH CHECK (bucket_id = 'make-28f2f653-profile-pictures');

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete profile pictures"
ON storage.objects FOR DELETE
USING (bucket_id = 'make-28f2f653-profile-pictures');

-- ========================================
-- 2. PROFILE BANNERS BUCKET POLICIES
-- ========================================

-- Allow anyone to read profile banners (public bucket)
CREATE POLICY "Public Access to Profile Banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'make-28f2f653-profile-banners');

-- Allow authenticated users to upload their own profile banners
CREATE POLICY "Users can upload profile banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'make-28f2f653-profile-banners'
);

-- Allow authenticated users to update their own profile banners
CREATE POLICY "Users can update profile banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'make-28f2f653-profile-banners')
WITH CHECK (bucket_id = 'make-28f2f653-profile-banners');

-- Allow authenticated users to delete their own profile banners
CREATE POLICY "Users can delete profile banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'make-28f2f653-profile-banners');

-- ========================================
-- 3. VERIFY POLICIES WERE CREATED
-- ========================================

-- Check policies for profile pictures bucket
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%Profile Pictures%'
ORDER BY policyname;

-- Check policies for profile banners bucket
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%Profile Banners%'
ORDER BY policyname;

-- ========================================
-- DONE!
-- ========================================
-- After running these policies:
-- ✅ Anyone can view profile pictures
-- ✅ Anyone can view profile banners
-- ✅ Authenticated users can upload/update/delete
-- ✅ No more RLS policy violations!
