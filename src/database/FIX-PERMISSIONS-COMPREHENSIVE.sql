-- ============================================================================
-- COMPREHENSIVE FIX: Permission Denied for kv_store_28f2f653
-- ============================================================================
-- Error code: 42501 - Permission denied
-- This is a PostgreSQL permission error, not just RLS
-- We need to grant explicit permissions to all roles
-- ============================================================================

-- Step 1: Disable Row Level Security (if not already disabled)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant ALL privileges to postgres superuser role
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO postgres;

-- Step 3: Grant ALL privileges to service_role (used by Edge Functions)
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- Step 4: Grant ALL privileges to authenticated users
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;

-- Step 5: Grant ALL privileges to anon (public) role
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;

-- Step 6: Ensure USAGE on the schema (required for access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 7: Grant ALL on schema to ensure full access
GRANT ALL ON SCHEMA public TO service_role;

-- Step 8: Verify the permissions (check output)
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'kv_store_28f2f653'
ORDER BY grantee, privilege_type;

-- Step 9: Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- ============================================================================
-- EXPECTED OUTPUT:
-- You should see multiple rows showing service_role, authenticated, and anon
-- with privileges like SELECT, INSERT, UPDATE, DELETE, etc.
-- RLS Enabled should show "false"
-- ============================================================================
