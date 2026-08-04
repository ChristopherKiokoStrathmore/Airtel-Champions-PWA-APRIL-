-- ============================================================================
-- 20260804_01  Storage privacy lockdown
-- ============================================================================
-- Context: an audit found all 33 personal-data objects (staff profile photos,
-- installer job photos, Airtel Money complaint photos, ODU customer documents)
-- downloadable by anyone holding the anon key, which ships in the browser
-- bundle. Marking the buckets private closed only the unauthenticated CDN path;
-- 24 of 30 storage.objects policies still granted anon or PUBLIC via the API.
--
-- This migration removes every anon/PUBLIC grant on buckets holding personal
-- data, and re-establishes access for `authenticated` and `service_role` only.
--
-- Deliberately left publicly readable (not personal data):
--   app-updates  - APK bundles the PWA fetches to self-update
--   am-videos    - Airtel Money training videos
--
-- Rollback: scratchpad/rollback-storage-policies.sql recreates all 30 original
-- policies verbatim.
--
-- NOTE: no objects are deleted. This changes access rules only.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Remove anon / PUBLIC grants on personal-data buckets
-- --------------------------------------------------------------------------

-- make-28f2f653-program-photos (field submission photos)
drop policy if exists "Allow anon delete"                        on storage.objects;
drop policy if exists "Allow anon upload"                        on storage.objects;
drop policy if exists "Allow public read"                        on storage.objects;
drop policy if exists "Anyone can view program photos"           on storage.objects;
drop policy if exists "TAI: Allow all access to program photos"  on storage.objects;

-- am-complaint-photos (complaint evidence, may show customers/premises)
drop policy if exists "Complaint photos - public read"           on storage.objects;
drop policy if exists "Complaint photos - authenticated upload"  on storage.objects; -- was PUBLIC despite the name

-- make-28f2f653-profile-pictures / -banners (staff faces)
drop policy if exists "Public Access to Profile Pictures"        on storage.objects;
drop policy if exists "Public Access to Profile Banners"         on storage.objects;
drop policy if exists "Users can upload profile pictures"        on storage.objects;
drop policy if exists "Users can upload profile banners"         on storage.objects;
drop policy if exists "Users can update profile pictures"        on storage.objects;
drop policy if exists "Users can update profile banners"         on storage.objects;
drop policy if exists "Users can delete profile pictures"        on storage.objects;
drop policy if exists "Users can delete profile banners"         on storage.objects;

-- installer_photos (job sites and customer premises)
drop policy if exists "installer_photos_select"                  on storage.objects;
drop policy if exists "installer_photos_upload"                  on storage.objects;
drop policy if exists "installer_photos_update"                  on storage.objects;

-- odu_documents (customer retrieval documents) - bucket was private but the
-- policy still granted anon, so the API path remained open.
drop policy if exists "odu_documents_read"                       on storage.objects;
drop policy if exists "odu_documents_upload"                     on storage.objects;

-- am-videos: keep public READ, but uploads must not be open to anon.
drop policy if exists "Videos - authenticated upload"            on storage.objects;

-- --------------------------------------------------------------------------
-- 2. Re-establish access for authenticated users only
-- --------------------------------------------------------------------------
-- These take effect once the server-side auth cut-over issues real JWTs.
-- Until then only service_role (Edge Functions) can reach these objects,
-- which is the intended fail-closed posture.

do $$
declare
  b text;
  personal_buckets text[] := array[
    'make-28f2f653-profile-pictures',
    'make-28f2f653-profile-banners',
    'make-28f2f653-program-photos',
    'installer_photos',
    'am-complaint-photos',
    'odu_documents',
    'bazuu-stories',
    'program-photos'
  ];
begin
  foreach b in array personal_buckets loop
    execute format(
      'create policy %I on storage.objects for select to authenticated using (bucket_id = %L)',
      'auth_read_' || b, b);
    execute format(
      'create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L)',
      'auth_write_' || b, b);
    execute format(
      'create policy %I on storage.objects for update to authenticated using (bucket_id = %L)',
      'auth_update_' || b, b);
  end loop;
end $$;

-- am-videos uploads: authenticated only (public read stays via the existing
-- "Videos - public read" policy).
create policy "am_videos_authenticated_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'am-videos');

-- --------------------------------------------------------------------------
-- 3. Service role retains full access so Edge Functions can mint signed URLs
-- --------------------------------------------------------------------------
create policy "service_role_all_objects" on storage.objects
  for all to service_role
  using (true) with check (true);

commit;
