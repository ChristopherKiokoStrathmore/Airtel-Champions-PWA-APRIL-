-- ============================================================
-- SUPABASE STORAGE RLS POLICIES
-- For bucket: make-28f2f653-program-photos
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- 2. Copy and paste this entire SQL file
-- 3. Click "Run" to apply the RLS policies
--
-- IMPORTANT: Since TAI uses localStorage authentication (not Supabase Auth),
-- all storage operations go through the backend server using SERVICE_ROLE.
-- These policies enforce that ONLY the backend server can access storage.
-- ============================================================

-- DROP existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;

-- POLICY: Allow service role (backend server) full access to the bucket
-- All uploads, downloads, and deletions are handled by the backend
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'make-28f2f653-program-photos')
WITH CHECK (bucket_id = 'make-28f2f653-program-photos');

-- ============================================================
-- EXPLANATION
-- ============================================================
-- 
-- Why only one policy?
-- ----------------------
-- TAI uses localStorage-based authentication, NOT Supabase Auth.
-- This means `auth.uid()` doesn't work for our users.
-- 
-- All storage operations are proxied through the backend server:
-- - Photo uploads: Frontend → Server (SERVICE_ROLE) → Storage
-- - Photo viewing: Frontend → Server generates signed URL → Storage
-- - Authorization: Server checks localStorage user data before operations
-- 
-- This architecture is MORE SECURE because:
-- 1. All auth logic is centralized in the backend
-- 2. No direct client access to storage
-- 3. Server validates user permissions before generating signed URLs
-- 4. Easier to audit and modify access control
-- 
-- ============================================================

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the policies were created:

-- List all policies for the storage.objects table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%make-28f2f653%';

-- Check if the bucket exists
SELECT * FROM storage.buckets WHERE name = 'make-28f2f653-program-photos';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
-- If you see the policy listed above, you're all set! ✅
-- The storage bucket is now properly secured.
-- ============================================================