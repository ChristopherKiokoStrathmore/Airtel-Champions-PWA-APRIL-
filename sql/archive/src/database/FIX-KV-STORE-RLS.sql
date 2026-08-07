-- ============================================================================
-- FIX: Permission Denied for kv_store_28f2f653
-- ============================================================================
-- This SQL fixes the "permission denied for table kv_store_28f2f653" error
-- by disabling Row Level Security (RLS) and granting proper permissions.
--
-- ERROR: permission denied for table kv_store_28f2f653 (code: 42501)
-- CAUSE: RLS is enabled on the table, blocking service role access
-- FIX: Disable RLS and grant full permissions
-- ============================================================================

-- Step 1: Disable Row Level Security on kv_store table
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant full permissions to all roles
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;

-- Step 3: Verify permissions (optional - check output)
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new
-- 2. Copy this entire SQL file
-- 3. Paste into the SQL Editor
-- 4. Click "Run" (or press Cmd/Ctrl + Enter)
-- 5. Verify you see "Success. No rows returned" or "RLS Enabled = f"
-- 6. Refresh your TAI app - the error should be gone!
-- ============================================================================
