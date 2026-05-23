-- ✅ FIX STORAGE POLICIES
-- Run this in Supabase SQL Editor

-- 1. First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete" ON storage.objects;

-- 2. Create new policies with correct names
CREATE POLICY "TAI: Allow anon upload photos"
ON storage.objects
FOR INSERT
TO anon, authenticated, public
WITH CHECK (bucket_id = 'make-28f2f653-program-photos');

CREATE POLICY "TAI: Allow public read photos"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'make-28f2f653-program-photos');

CREATE POLICY "TAI: Allow anon update photos"
ON storage.objects
FOR UPDATE
TO anon, authenticated, public
USING (bucket_id = 'make-28f2f653-program-photos')
WITH CHECK (bucket_id = 'make-28f2f653-program-photos');

CREATE POLICY "TAI: Allow anon delete photos"
ON storage.objects
FOR DELETE
TO anon, authenticated, public
USING (bucket_id = 'make-28f2f653-program-photos');

-- 3. Verify bucket exists and is public
UPDATE storage.buckets
SET public = true
WHERE id = 'make-28f2f653-program-photos';

-- ✅ VERIFY
SELECT 
  '✅ Storage policies created!' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'TAI:%';

SELECT 
  '✅ Bucket is public!' as status,
  id,
  name,
  public
FROM storage.buckets
WHERE id = 'make-28f2f653-program-photos';
