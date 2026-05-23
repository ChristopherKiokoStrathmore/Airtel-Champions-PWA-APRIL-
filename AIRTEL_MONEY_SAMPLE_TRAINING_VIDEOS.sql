-- ============================================================================
-- Airtel Money - Sample Training Videos
-- Insert this into your Supabase database to populate training videos
-- ============================================================================

-- First, get an admin ID (ensure at least one admin exists in AIRTELMONEY_HQ)
-- If no admin exists, create one first:
-- INSERT INTO AIRTELMONEY_HQ (Name, phone, PIN, se, zsm, zone, status)
-- VALUES ('Admin User', '0712345670', '5678', 'SE_001', 'ZSM_001', 'Zone_001', 'active');

-- Get your admin ID and substitute below, or pick an existing one
-- For now, we'll use admin_id = 1 (adjust if your admin has a different ID)

-- ============================================================================
-- DELETE EXISTING VIDEOS (CLEANUP)
-- ============================================================================
DELETE FROM public.am_videos WHERE status = 'published' OR status = 'draft';

-- ============================================================================
-- INSERT SINGLE TRAINING VIDEO
-- ============================================================================

INSERT INTO public.am_videos  
  (title, description, video_url, thumbnail_url, duration_seconds, category, is_targeted, status, created_by)
VALUES
  (
    'Airtel Money Platform Overview',
    'Complete introduction to the Airtel Money platform, key features, and agent responsibilities.',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    'https://images.unsplash.com/photo-1556740741-a18bbd33d318',
    596,
    'General',
    FALSE,
    'published',
    1
  );

-- Verify insertion
SELECT COUNT(*) as total_videos FROM public.am_videos WHERE status = 'published';
SELECT title, category, duration_seconds, status, video_url FROM public.am_videos;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This script:
-- 1. Deletes all existing videos (published and draft)
-- 2. Inserts ONE sample training video
-- 3. Uses a publicly available test video URL (Big Buck Bunny)
--
-- The test video URL is valid and should play immediately:
-- https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4
--
-- To replace with your own video:
-- UPDATE public.am_videos
-- SET video_url = 'https://your-storage-url/your-video.mp4'
-- WHERE title = 'Airtel Money Platform Overview';
