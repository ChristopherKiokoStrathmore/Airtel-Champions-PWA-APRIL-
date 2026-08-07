-- =============================================================================
-- FIX: Storage RLS + location_tracking RLS
-- Run in Supabase Dashboard → SQL Editor → New Query
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. installer_photos storage bucket — allow anon to upload & read
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old policies if they exist (safe re-run)
DROP POLICY IF EXISTS "installer_photos_upload"  ON storage.objects;
DROP POLICY IF EXISTS "installer_photos_select"  ON storage.objects;
DROP POLICY IF EXISTS "installer_photos_update"  ON storage.objects;

-- Allow anyone to upload into the installer_photos bucket
CREATE POLICY "installer_photos_upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'installer_photos');

-- Allow anyone to read from the installer_photos bucket
CREATE POLICY "installer_photos_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'installer_photos');

-- Allow re-uploads (upsert) if needed
CREATE POLICY "installer_photos_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'installer_photos');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. location_tracking — allow anon to insert (live GPS stream) and select
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loc_anon_insert ON public.location_tracking;
DROP POLICY IF EXISTS loc_anon_select ON public.location_tracking;

CREATE POLICY loc_anon_insert ON public.location_tracking
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY loc_anon_select ON public.location_tracking
  FOR SELECT TO anon, authenticated
  USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Verify storage policies
-- ─────────────────────────────────────────────────────────────────────────────
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND policyname LIKE 'installer_photos%';

-- Verify location_tracking policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'location_tracking';
