-- Configure CORS for Supabase Project
-- NOTE: This SQL is for REFERENCE ONLY - Supabase doesn't have a 'cors' table
-- Use the Supabase Dashboard instead to configure CORS

-- === CORRECT WAY TO CONFIGURE CORS ===
-- 1. Go to Supabase Dashboard → Project Settings → API
-- 2. In "CORS allowed origins", add these origins:
--    http://localhost:3000
--    https://localhost:3000  
--    http://127.0.0.1:3000
--    https://127.0.0.1:3000
--    http://localhost:3001
--    https://localhost:3001
--    http://127.0.0.1:3001
--    https://127.0.0.1:3001

-- Alternative: Use REST API to update CORS settings
-- This requires your service_role key and project URL
  
-- For Edge Functions, CORS is handled in the function code itself
-- The enhanced headers we added should be sufficient:

-- Enhanced CORS headers already implemented:
-- 'Access-Control-Allow-Origin': '*'
-- 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with'
-- 'Access-Control-Allow-Methods': 'POST, OPTIONS'
-- 'Access-Control-Max-Age': '86400'
-- 'Vary': 'Origin'

-- === CHECK CORS SETTINGS IN SUPABASE ===

-- 1. Check if CORS table exists (for REST API)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'cors';

-- 2. If CORS table exists, view current settings
SELECT * FROM cors;

-- 3. Alternative: Check PostgREST configuration
SELECT current_setting 
FROM pg_settings 
WHERE name = 'server.cors_allowed_origins';

-- === MANUAL DASHBOARD CHECK ===
-- Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api
-- Look for "CORS allowed origins" section
-- Should include: http://localhost:3001, https://localhost:3001

-- === IF YOU NEED TO USE API ===
-- POST to https://xspogpfohjmkykfjadhk.supabase.co/rest/v1/cors
-- Headers: apikey: YOUR_ANON_KEY, Authorization: Bearer YOUR_SERVICE_ROLE_KEY
-- Body: {
--   "origin": "http://localhost:3001",
--   "method": "GET,POST,PUT,DELETE,OPTIONS",
--   "headers": "authorization, x-client-info, apikey, content-type",
--   "max_age": 3600
-- }
