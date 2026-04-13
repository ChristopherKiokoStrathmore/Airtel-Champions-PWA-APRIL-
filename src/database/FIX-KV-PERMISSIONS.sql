-- Fix permissions on kv_store_28f2f653 table
-- Run this in Supabase SQL Editor if you see "permission denied" errors

-- Grant full permissions to all roles
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;

-- Disable Row Level Security (RLS) since TAI uses custom auth
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Verify permissions
SELECT tablename, tableowner 
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';
