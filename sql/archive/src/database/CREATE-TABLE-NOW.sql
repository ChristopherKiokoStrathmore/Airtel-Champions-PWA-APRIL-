-- ✅ CORRECT SQL: Creates the table, then disables RLS
-- Run this ENTIRE block in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new

-- ============================================
-- STEP 1: Create the KV Store table
-- ============================================
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- ============================================
-- STEP 2: Disable Row Level Security
-- ============================================
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Grant all permissions to all roles
-- ============================================
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO postgres;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- ============================================
-- STEP 4: Set table owner to postgres
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
VALUES ('test:setup', '{"status": "success", "message": "KV Store is ready!", "timestamp": "' || NOW()::text || '"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- STEP 7: VERIFY EVERYTHING WORKED
-- ============================================

-- Check table was created
SELECT 
  '1️⃣ TABLE CREATED' as step,
  tablename,
  tableowner,
  CASE 
    WHEN rowsecurity THEN '❌ ERROR: RLS is enabled (will cause permission errors)' 
    ELSE '✅ SUCCESS: RLS is disabled (correct!)' 
  END as rls_status
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- Check permissions were granted
SELECT 
  '2️⃣ PERMISSIONS GRANTED' as step,
  grantee as role,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
GROUP BY grantee
ORDER BY grantee;

-- Check test data was inserted
SELECT 
  '3️⃣ TEST DATA INSERTED' as step,
  key,
  value->>'status' as status,
  value->>'message' as message
FROM kv_store_28f2f653 
WHERE key = 'test:setup';

-- Final success message
SELECT 
  '🎉 SUCCESS!' as result,
  'The kv_store_28f2f653 table is ready to use!' as message,
  'Close this tab and refresh your TAI app (Ctrl+Shift+R)' as next_step;
