-- ✅ SIMPLE DATABASE FIX
-- Run this EXACTLY as shown in Supabase SQL Editor

-- Step 1: Disable RLS
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant permissions
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- Step 3: Verify (should show 'f' for RLS disabled)
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'kv_store_28f2f653';

-- Step 4: Test query (should work without errors)
SELECT COUNT(*) as row_count FROM kv_store_28f2f653;
