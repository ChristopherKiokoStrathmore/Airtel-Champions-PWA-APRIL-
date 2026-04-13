-- ============================================
-- CREATE STORAGE BUCKET FOR PROGRAM PHOTOS
-- ============================================
-- Run this in Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-28f2f653-program-photos', 'make-28f2f653-program-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload program photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'make-28f2f653-program-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view photos (since bucket is public)
CREATE POLICY "Anyone can view program photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'make-28f2f653-program-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their own program photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'make-28f2f653-program-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own program photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'make-28f2f653-program-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'make-28f2f653-program-photos';
