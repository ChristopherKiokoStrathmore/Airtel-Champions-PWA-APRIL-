-- 1. Create a table to track app versions
CREATE TABLE IF NOT EXISTS app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(50) NOT NULL, -- e.g. "1.0.2"
    bundle_url TEXT NOT NULL, -- URL to the zip file in storage
    release_notes TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    platform VARCHAR(20) DEFAULT 'android', -- 'android' or 'ios'
    
    -- Ensure version is unique per platform
    UNIQUE(version, platform)
);

-- 2. Create a storage bucket for updates if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-updates', 'app-updates', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS on the table
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
-- Everyone can read versions
CREATE POLICY "Everyone can read app versions" 
ON app_versions FOR SELECT 
USING (true);

-- Only admins/HQ can insert/update (assuming a role-based system, otherwise open for now or restrict to authenticated)
CREATE POLICY "Admins can manage app versions" 
ON app_versions FOR ALL 
USING (
    auth.uid() IN (
        SELECT id FROM app_users WHERE role IN ('hq_command_center', 'director', 'developer')
    )
);

-- 5. Storage policies
-- Everyone can read updates
CREATE POLICY "Everyone can read update bundles"
ON storage.objects FOR SELECT
USING ( bucket_id = 'app-updates' );

-- Only admins can upload
CREATE POLICY "Admins can upload update bundles"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'app-updates' AND
    auth.uid() IN (
        SELECT id FROM app_users WHERE role IN ('hq_command_center', 'director', 'developer')
    )
);

-- Sample insert (commented out)
-- INSERT INTO app_versions (version, bundle_url, release_notes) 
-- VALUES ('1.0.1', 'https://PROJECT_ID.supabase.co/storage/v1/object/public/app-updates/v1.0.1.zip', 'Fixed bug in site selector');
