INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('installer_photos', 'installer_photos', true, 10485760)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "installer_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "installer_photos_upload_auth" ON storage.objects;
DROP POLICY IF EXISTS "installer_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "installer_photos_select_auth" ON storage.objects;

CREATE POLICY "installer_photos_upload" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'installer_photos');

CREATE POLICY "installer_photos_upload_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'installer_photos');

CREATE POLICY "installer_photos_select" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'installer_photos');

CREATE POLICY "installer_photos_select_auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'installer_photos');
