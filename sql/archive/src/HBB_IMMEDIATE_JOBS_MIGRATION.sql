-- HBB Immediate Installation: add missing columns to jobs table
-- Run this once in your Supabase SQL editor

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS on_way_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS after_photo_url  TEXT,
  ADD COLUMN IF NOT EXISTS customer_lat     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS customer_lng     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS building         TEXT,
  ADD COLUMN IF NOT EXISTS street_address   TEXT,
  ADD COLUMN IF NOT EXISTS landmark         TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date   TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time   TEXT,
  ADD COLUMN IF NOT EXISTS package          TEXT;

-- Add 'scheduled' to the status check constraint (if it exists)
DO $$
BEGIN
  -- Drop old constraint if it excludes 'scheduled'
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_status_check' AND conrelid = 'jobs'::regclass
  ) THEN
    ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
      CHECK (status IN ('assigned','on_way','arrived','completed','failed','rescheduled','unreachable','cancelled','scheduled'));
  END IF;
END $$;

-- Allow anon role to INSERT/UPDATE jobs (needed for immediate booking)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Insert: customers creating immediate jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'jobs_anon_insert') THEN
    CREATE POLICY jobs_anon_insert ON jobs FOR INSERT TO anon WITH CHECK (true);
  END IF;

  -- Update: installers updating their own jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'jobs_anon_update') THEN
    CREATE POLICY jobs_anon_update ON jobs FOR UPDATE TO anon USING (true);
  END IF;

  -- Select: anyone can read jobs (tracking screen)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'jobs_anon_select') THEN
    CREATE POLICY jobs_anon_select ON jobs FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- Ensure location_tracking is open to anon writes (installer GPS stream)
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'location_tracking' AND policyname = 'loc_anon_insert') THEN
    CREATE POLICY loc_anon_insert ON location_tracking FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'location_tracking' AND policyname = 'loc_anon_select') THEN
    CREATE POLICY loc_anon_select ON location_tracking FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- Create installer_photos storage bucket (skip if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('installer_photos', 'installer_photos', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow anon to upload to installer_photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies
    WHERE bucket_id = 'installer_photos' AND name = 'installer_photos_upload'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'installer_photos_upload', 'installer_photos', 'INSERT',
      '{"role":"anon","check":{}}'
    );
  END IF;
END $$;
