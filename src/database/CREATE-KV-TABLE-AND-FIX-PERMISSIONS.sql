-- 🚨 RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR 🚨
-- This creates the kv_store table (if it doesn't exist) and fixes permissions

-- ============================================
-- STEP 1: Create the table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================
-- STEP 2: Grant full permissions to all roles
-- ============================================
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO postgres;

-- ============================================
-- STEP 3: Disable Row Level Security
-- ============================================
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Create index for faster lookups
-- ============================================
CREATE INDEX IF NOT EXISTS kv_store_key_idx ON kv_store_28f2f653(key);
CREATE INDEX IF NOT EXISTS kv_store_key_prefix_idx ON kv_store_28f2f653(key text_pattern_ops);

-- ============================================
-- STEP 5: Verify everything worked
-- ============================================
SELECT 
  tablename, 
  tableowner,
  CASE WHEN rowsecurity THEN '❌ RLS Still Enabled' ELSE '✅ RLS Disabled' END as security_status
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- Show table info
SELECT 
  '✅ Table created!' as status,
  COUNT(*) as existing_records
FROM kv_store_28f2f653;

-- Final message
SELECT '🎉 SUCCESS! Close this tab and refresh your TAI app now (Ctrl+Shift+R)' as final_message;
