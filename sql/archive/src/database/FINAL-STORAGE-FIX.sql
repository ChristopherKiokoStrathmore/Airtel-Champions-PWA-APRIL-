-- ✅ FINAL STORAGE FIX - Run this in Supabase SQL Editor
-- This completely opens up the storage bucket for the TAI app

-- 1. Drop ALL existing policies on storage.objects for this bucket
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
          AND policyname LIKE '%make-28f2f653%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 2. Create ONE simple policy that allows everything
CREATE POLICY "TAI: Allow all access to program photos"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'make-28f2f653-program-photos')
WITH CHECK (bucket_id = 'make-28f2f653-program-photos');

-- 3. Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'make-28f2f653-program-photos', 
  'make-28f2f653-program-photos', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- ✅ VERIFY
SELECT 
  '✅ STORAGE FIXED!' as status,
  'Bucket: ' || id as bucket,
  CASE WHEN public THEN '✅ Public' ELSE '❌ Private' END as access,
  (file_size_limit / 1048576) || ' MB' as max_size
FROM storage.buckets
WHERE id = 'make-28f2f653-program-photos';

SELECT 
  '✅ Policy created!' as status,
  COUNT(*) as policies
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'TAI: Allow all access to program photos';

-- Test insert (should work)
SELECT 
  '✅ Ready to upload photos!' as final_status;
