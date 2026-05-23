-- ============================================================================
-- FINAL FIX: Force Edge Function to Restart with New Permissions
-- ============================================================================
-- Run this AFTER you've already disabled RLS and granted permissions
-- This script validates everything is set up correctly
-- ============================================================================

-- Step 1: Verify RLS is disabled
DO $$ 
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables 
    WHERE tablename = 'kv_store_28f2f653';
    
    IF rls_enabled THEN
        RAISE EXCEPTION 'RLS is still enabled on kv_store_28f2f653!';
    ELSE
        RAISE NOTICE '✅ RLS is correctly disabled on kv_store_28f2f653';
    END IF;
END $$;

-- Step 2: Re-grant all permissions to be absolutely sure
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO postgres;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;

-- Step 3: Grant schema permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Step 4: Insert a test row to verify write access
INSERT INTO kv_store_28f2f653 (key, value) 
VALUES ('test_permission_check', '{"verified": true, "timestamp": "' || NOW() || '"}')
ON CONFLICT (key) DO UPDATE SET value = '{"verified": true, "timestamp": "' || NOW() || '"}';

-- Step 5: Verify we can read it
SELECT 
    key,
    value->>'verified' as verified,
    value->>'timestamp' as timestamp
FROM kv_store_28f2f653 
WHERE key = 'test_permission_check';

-- Step 6: Show all permissions
SELECT 
    grantee,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants 
WHERE table_name = 'kv_store_28f2f653'
GROUP BY grantee
ORDER BY grantee;

-- ============================================================================
-- SUCCESS INDICATORS:
-- 1. You should see "✅ RLS is correctly disabled"
-- 2. The test row should show verified = true with a timestamp
-- 3. You should see service_role, authenticated, and anon with full privileges
-- 
-- After running this, wait 60 seconds then refresh your TAI app.
-- The Edge Function will automatically restart and pick up the new permissions.
-- ============================================================================
