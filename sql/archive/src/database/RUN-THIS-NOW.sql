-- 🚨 RUN THIS IN SUPABASE SQL EDITOR NOW! 🚨
-- This fixes the "permission denied for table kv_store_28f2f653" error

-- Grant permissions to all roles
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- Disable Row Level Security (RLS) - TAI uses custom auth
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT 
  tablename, 
  tableowner,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- You should see: RLS Enabled = false

SELECT '✅ Permissions fixed! Refresh your TAI app now.' as status;
