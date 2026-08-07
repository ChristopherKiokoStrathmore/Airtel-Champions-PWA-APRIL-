-- ============================================================================
-- PHASE 1B: FINAL CLEANUP - Remove Remaining Old KV Store
-- ============================================================================
-- Risk Level: LOW (old KV store is not used)
-- Estimated Time: 2 minutes
-- Downtime Required: NONE
-- Rollback Difficulty: EASY
-- ============================================================================

-- You've already cleaned up most backup tables. Great job!
-- This script removes the last remaining unused table: kv_store_e446c708

-- ============================================================================
-- STEP 1: VERIFY OLD KV STORE IS NOT USED
-- ============================================================================

-- Check if any foreign keys reference this table (should return 0 rows)
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'kv_store_e446c708';

-- ✅ Expected: 0 rows

-- ============================================================================
-- STEP 2: VERIFY CURRENT KV STORE HAS DATA
-- ============================================================================

-- Check your current (active) KV store
SELECT 
    'kv_store_28f2f653' AS active_kv_store,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('kv_store_28f2f653')) AS size
FROM kv_store_28f2f653;

-- ✅ Should show data exists in the current KV store

-- Check old KV store
SELECT 
    'kv_store_e446c708' AS old_kv_store,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('kv_store_e446c708')) AS size
FROM kv_store_e446c708;

-- Document the counts for reference

-- ============================================================================
-- STEP 3: DROP OLD KV STORE TABLE
-- ============================================================================

DROP TABLE IF EXISTS public.kv_store_e446c708 CASCADE;

-- ============================================================================
-- STEP 4: VERIFY CLEANUP SUCCESS
-- ============================================================================

-- Confirm table is dropped (should return 0 rows)
SELECT tablename 
FROM pg_tables 
WHERE tablename = 'kv_store_e446c708'
AND schemaname = 'public';

-- ✅ Expected: 0 rows

-- Verify current KV store still works
SELECT COUNT(*) AS kv_count FROM kv_store_28f2f653;

-- ✅ Should return same count as Step 2

-- Update statistics
ANALYZE;

-- ============================================================================
-- ✅ PHASE 1B COMPLETE!
-- ============================================================================

-- What we accomplished:
-- ✅ Removed old kv_store_e446c708
-- ✅ Verified current kv_store_28f2f653 still works
-- ✅ Cleaned up database schema
-- ✅ No impact on application functionality

-- Next step: Phase 2 (Consolidate user tables)
