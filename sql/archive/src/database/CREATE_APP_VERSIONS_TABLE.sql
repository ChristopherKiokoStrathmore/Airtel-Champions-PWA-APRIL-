-- Run this in Supabase SQL Editor to fix the "Could not find table 'app_versions'" error

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    bundle_url TEXT NOT NULL,
    release_notes TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    platform VARCHAR(20) DEFAULT 'android',
    UNIQUE(version, platform)
);

-- 2. Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- 3. Create access policies
CREATE POLICY "Public Read Access" 
ON public.app_versions FOR SELECT 
USING (true);

CREATE POLICY "Admin Write Access" 
ON public.app_versions FOR ALL 
USING (auth.uid() IN (SELECT id FROM app_users WHERE role IN ('hq_staff', 'hq_command_center', 'director', 'developer')));

-- 4. Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-updates', 'app-updates', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'app-updates' );

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'app-updates' AND
    auth.uid() IN (SELECT id FROM app_users WHERE role IN ('hq_staff', 'hq_command_center', 'director', 'developer'))
);
