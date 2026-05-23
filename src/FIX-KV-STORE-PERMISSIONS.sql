-- ✅ Fix KV Store Permissions
-- Run this in Supabase Dashboard → SQL Editor

-- Grant full access to kv_store_28f2f653
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;

-- Disable Row Level Security (not needed for KV store)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Verify permissions
SELECT 
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables
WHERE tablename = 'kv_store_28f2f653';

-- Done! ✅
