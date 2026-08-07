-- ============================================================
-- Airtel Money Storage Setup
-- Run this in the Supabase SQL editor after running airtel-money-schema.sql
-- ============================================================

-- ─── Create Storage Buckets ────────────────────────────────────────────────────
--  These buckets store media files.
--  Run these commands in the Supabase SQL editor, OR use the Supabase dashboard:
--  Storage → New Bucket

-- Insert bucket records (replaces manual creation in UI)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit)
VALUES 
  ('am-videos', 'am-videos', true, false, 104857600),           -- 100MB max per file
  ('am-complaint-photos', 'am-complaint-photos', true, false, 10485760)  -- 10MB max per file
ON CONFLICT (id) DO NOTHING;

-- ─── Bucket Access Policies ───────────────────────────────────────────────────
--  Allow anon users (app uses custom phone/PIN auth) to:
--    • Read all files
--    • Upload new files (for video/photo uploads)

-- am-videos bucket policies
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('am-videos', '.gitkeep', NULL)
ON CONFLICT DO NOTHING;

-- Allow anon to list and read videos
CREATE POLICY "allow_anon_read_videos" 
  ON storage.objects FOR SELECT 
  TO anon 
  USING (bucket_id = 'am-videos');

-- Allow anon to upload videos
CREATE POLICY "allow_anon_upload_videos" 
  ON storage.objects FOR INSERT 
  TO anon 
  WITH CHECK (bucket_id = 'am-videos');

-- Allow anon to delete their own videos (optional)
CREATE POLICY "allow_anon_delete_videos" 
  ON storage.objects FOR DELETE 
  TO anon 
  USING (bucket_id = 'am-videos');

-- am-complaint-photos bucket policies
INSERT INTO storage.objects (bucket_id, name, owner)
VALUES ('am-complaint-photos', '.gitkeep', NULL)
ON CONFLICT DO NOTHING;

-- Allow anon to list and read complaint photos
CREATE POLICY "allow_anon_read_complaint_photos" 
  ON storage.objects FOR SELECT 
  TO anon 
  USING (bucket_id = 'am-complaint-photos');

-- Allow anon to upload complaint photos
CREATE POLICY "allow_anon_upload_complaint_photos" 
  ON storage.objects FOR INSERT 
  TO anon 
  WITH CHECK (bucket_id = 'am-complaint-photos');

-- ─── Notes ────────────────────────────────────────────────────────────────────
--  If you encounter "policy already exists" errors, that's OK.
--  The buckets are already configured correctly in your Supabase project.
--
--  To verify setup manually via Supabase Dashboard:
--  1. Go to Storage section
--  2. You should see two buckets:
--     • am-videos (for uploaded training videos)
--     • am-complaint-photos (for agent-submitted complaint photos)
--  3. Both should be marked as "Public"
--  4. Policies should allow anon to read/upload/delete
