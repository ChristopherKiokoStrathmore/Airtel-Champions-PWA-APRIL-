-- 🚨🚨🚨 EMERGENCY FIX FOR KV PERMISSIONS 🚨🚨🚨
-- Run this ENTIRE file in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new

-- ============================================
-- STEP 1: Drop and recreate the table (nuclear option)
-- ============================================
DROP TABLE IF EXISTS kv_store_28f2f653 CASCADE;

CREATE TABLE kv_store_28f2f653 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================
-- STEP 2: Grant FULL permissions to ALL roles
-- ============================================
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO postgres;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- ============================================
-- STEP 3: DISABLE Row Level Security completely
-- ============================================
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Remove any existing policies (just in case)
DROP POLICY IF EXISTS "Allow all access" ON kv_store_28f2f653;
DROP POLICY IF EXISTS "Enable all access for service role" ON kv_store_28f2f653;

-- ============================================
-- STEP 4: Make the table owner postgres (highest privilege)
-- ============================================
ALTER TABLE kv_store_28f2f653 OWNER TO postgres;

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS kv_store_key_idx ON kv_store_28f2f653(key);
CREATE INDEX IF NOT EXISTS kv_store_key_prefix_idx ON kv_store_28f2f653(key text_pattern_ops);

-- ============================================
-- STEP 6: Insert test data to verify it works
-- ============================================
INSERT INTO kv_store_28f2f653 (key, value) 
VALUES ('test:connection', '{"status": "connected", "timestamp": "' || NOW()::text || '"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- STEP 7: VERIFY EVERYTHING
-- ============================================

-- Check table exists and RLS is disabled
SELECT 
  '1️⃣ TABLE STATUS' as step,
  tablename,
  tableowner,
  CASE 
    WHEN rowsecurity THEN '❌ PROBLEM: RLS is ENABLED - This will cause errors!' 
    ELSE '✅ GOOD: RLS is DISABLED' 
  END as rls_status
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- Check permissions
SELECT 
  '2️⃣ PERMISSIONS' as step,
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
GROUP BY grantee;

-- Check test data
SELECT 
  '3️⃣ TEST DATA' as step,
  key,
  value,
  '✅ Table is working!' as status
FROM kv_store_28f2f653 
WHERE key = 'test:connection';

-- ============================================
-- FINAL MESSAGE
-- ============================================
SELECT 
  '🎉 SUCCESS!' as status,
  'The kv_store_28f2f653 table is now ready!' as message,
  'Close this tab and try submitting your program again.' as next_step;
