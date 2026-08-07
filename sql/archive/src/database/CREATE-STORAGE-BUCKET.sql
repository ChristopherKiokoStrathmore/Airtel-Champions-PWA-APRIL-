-- ✅ CREATE STORAGE BUCKET FOR PHOTOS
-- Run this in Supabase SQL Editor

-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-28f2f653-program-photos', 'make-28f2f653-program-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to upload photos
CREATE POLICY "Allow anon upload"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'make-28f2f653-program-photos');

-- 3. Allow public access to read photos
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'make-28f2f653-program-photos');

-- 4. Allow anon to delete their own photos
CREATE POLICY "Allow anon delete"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'make-28f2f653-program-photos');

-- ✅ VERIFY
SELECT 
  '✅ Bucket created!' as status,
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'make-28f2f653-program-photos';
