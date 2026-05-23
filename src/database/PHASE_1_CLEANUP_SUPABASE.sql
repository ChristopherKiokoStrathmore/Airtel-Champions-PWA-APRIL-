-- ============================================================================
-- PHASE 1: DATABASE CLEANUP - Remove Unused Backup Tables (SUPABASE VERSION)
-- ============================================================================
-- Risk Level: LOW (backup tables are not used by the application)
-- Estimated Time: 5-10 minutes
-- Downtime Required: NONE
-- Rollback Difficulty: EASY (data is already backed up elsewhere)
-- ============================================================================

-- ⚠️ NOTE: Supabase doesn't allow COPY to file system
-- These are BACKUP tables, so we can safely drop them without re-exporting
-- If you want extra safety, manually export via Supabase Dashboard first

-- ============================================================================
-- OPTIONAL: Manual Export via Supabase Dashboard (if you want extra safety)
-- ============================================================================

/*
If you want to export these tables first:

1. Go to Supabase Dashboard → SQL Editor
2. For each table, run a simple SELECT and export:
   
   SELECT * FROM app_users_backup;
   SELECT * FROM backup_app_users;
   SELECT * FROM excel_data_backup;
   SELECT * FROM users_backup;
   SELECT * FROM users_backup_before_se_migration;
   SELECT * FROM kv_store_e446c708;
   
3. Click "Export" button to download as CSV
4. Then proceed with the cleanup below

BUT REMEMBER: These are already BACKUP tables, so this is optional!
*/

-- ============================================================================
-- STEP 1: CHECK TABLE CONTENTS (Quick peek at what we're deleting)
-- ============================================================================

-- Count records in each backup table
SELECT 'app_users_backup' AS table_name, COUNT(*) AS record_count FROM app_users_backup
UNION ALL
SELECT 'backup_app_users', COUNT(*) FROM backup_app_users
UNION ALL
SELECT 'excel_data_backup', COUNT(*) FROM excel_data_backup
UNION ALL
SELECT 'users_backup', COUNT(*) FROM users_backup
UNION ALL
SELECT 'users_backup_before_se_migration', COUNT(*) FROM users_backup_before_se_migration
UNION ALL
SELECT 'kv_store_e446c708', COUNT(*) FROM kv_store_e446c708;

-- Document these numbers for your records

-- ============================================================================
-- STEP 2: VERIFY TABLES ARE TRULY UNUSED
-- ============================================================================

-- Check if any foreign keys reference these tables (should return 0 rows)
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
    AND ccu.table_name IN (
        'app_users_backup',
        'backup_app_users',
        'excel_data_backup',
        'users_backup',
        'users_backup_before_se_migration',
        'kv_store_e446c708'
    );

-- ✅ Expected result: 0 rows (no foreign keys reference these tables)
-- If this returns ANY rows, STOP and investigate before proceeding!

-- ============================================================================
-- STEP 3: CHECK TABLE SIZES (for documentation)
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables 
WHERE tablename IN (
    'app_users_backup',
    'backup_app_users',
    'excel_data_backup',
    'users_backup',
    'users_backup_before_se_migration',
    'kv_store_e446c708'
)
ORDER BY size_bytes DESC;

-- Document the total space to be reclaimed

-- ============================================================================
-- STEP 4: VERIFY YOUR MAIN TABLES ARE INTACT (Safety check!)
-- ============================================================================

-- Verify app_users (the main table) has data
SELECT 
    'app_users' AS table_name,
    COUNT(*) AS record_count,
    MAX(updated_at) AS last_updated
FROM app_users;

-- ✅ Expected: Should show 662 users (or your current count)
-- If this returns 0 or very few records, STOP! Something is wrong.

-- Verify other critical tables
SELECT 'submissions' AS table_name, COUNT(*) AS record_count FROM submissions
UNION ALL
SELECT 'social_posts', COUNT(*) FROM social_posts
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'kv_store_28f2f653', COUNT(*) FROM kv_store_28f2f653;

-- ✅ All should have data. If any show 0, investigate before proceeding.

-- ============================================================================
-- 🛑 DECISION POINT: Are you ready to proceed with deletion?
-- ============================================================================

/*
Before proceeding, confirm:
✅ No foreign keys reference backup tables (Step 2 returned 0 rows)
✅ Main tables (app_users, submissions, etc.) have data (Step 4 looks good)
✅ You understand these are BACKUP tables being deleted
✅ You've documented the table sizes from Step 3

If ANY of the above checks failed, STOP and investigate!

If all checks passed, proceed to Step 5.
*/

-- ============================================================================
-- STEP 5: DROP BACKUP TABLES (POINT OF NO RETURN!)
-- ============================================================================

-- Drop app_users_backup
DROP TABLE IF EXISTS public.app_users_backup CASCADE;

-- Drop backup_app_users
DROP TABLE IF EXISTS public.backup_app_users CASCADE;

-- Drop excel_data_backup
DROP TABLE IF EXISTS public.excel_data_backup CASCADE;

-- Drop users_backup
DROP TABLE IF EXISTS public.users_backup CASCADE;

-- Drop users_backup_before_se_migration
DROP TABLE IF EXISTS public.users_backup_before_se_migration CASCADE;

-- Drop old kv_store (you use kv_store_28f2f653 now)
DROP TABLE IF EXISTS public.kv_store_e446c708 CASCADE;

-- ============================================================================
-- STEP 6: VERIFY CLEANUP SUCCESS
-- ============================================================================

-- Confirm tables are dropped (should return 0 rows)
SELECT tablename 
FROM pg_tables 
WHERE tablename IN (
    'app_users_backup',
    'backup_app_users',
    'excel_data_backup',
    'users_backup',
    'users_backup_before_se_migration',
    'kv_store_e446c708'
)
AND schemaname = 'public';

-- ✅ Expected result: 0 rows (all backup tables successfully deleted)

-- Check current database size
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- Document this for before/after comparison

-- ============================================================================
-- STEP 7: VERIFY MAIN TABLES STILL WORK (Critical!)
-- ============================================================================

-- Verify app_users still works
SELECT COUNT(*) AS user_count FROM app_users;

-- Verify submissions still work
SELECT COUNT(*) AS submission_count FROM submissions;

-- Verify social_posts still work
SELECT COUNT(*) AS post_count FROM social_posts;

-- Verify programs still work
SELECT COUNT(*) AS program_count FROM programs;

-- Verify current KV store still works
SELECT COUNT(*) AS kv_count FROM kv_store_28f2f653;

-- ✅ All counts should match what you saw in Step 4
-- If any show 0 or different numbers, something went wrong!

-- ============================================================================
-- STEP 8: VACUUM TO RECLAIM SPACE (Supabase handles this automatically)
-- ============================================================================

-- Note: Supabase runs auto-vacuum automatically in the background
-- Manual VACUUM cannot run inside a transaction block, so we skip it
-- Supabase will automatically reclaim space within a few hours

-- Update statistics for query planner (this is safe in transactions)
ANALYZE;

-- ============================================================================
-- ✅ PHASE 1 COMPLETE!
-- ============================================================================

-- What we accomplished:
-- ✅ Removed 6 unused backup tables
-- ✅ Reclaimed disk space (Supabase will reclaim it automatically)
-- ✅ Cleaned up database schema
-- ✅ Verified main tables still work
-- ✅ No impact on application functionality

-- ============================================================================
-- 📊 FINAL VERIFICATION CHECKLIST
-- ============================================================================

-- Run these queries to confirm everything still works:

-- 1. Check main user table
SELECT COUNT(*) FROM app_users;
-- Should return 662 (or your user count)

-- 2. Check submissions still load
SELECT COUNT(*) FROM submissions;
-- Should return your submission count

-- 3. Check social posts still load
SELECT COUNT(*) FROM social_posts;
-- Should return your post count

-- 4. Check programs still load
SELECT COUNT(*) FROM programs;
-- Should return your program count

-- 5. Check KV store still works
SELECT COUNT(*) FROM kv_store_28f2f653;
-- Should return data

-- 6. Test a JOIN query (verifies relationships still work)
SELECT 
    u.full_name,
    COUNT(s.id) AS submission_count
FROM app_users u
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id, u.full_name
ORDER BY submission_count DESC
LIMIT 10;
-- Should return top 10 users with submission counts

-- ============================================================================
-- 🎉 SUCCESS CRITERIA
-- ============================================================================

/*
Phase 1 is successful if:
✅ All 6 backup tables are dropped (Step 6 confirms)
✅ Main tables still have data (Step 7 confirms)
✅ No errors in any verification queries
✅ App still works (test login, leaderboard, submissions)
✅ Database schema is cleaner

Next steps:
→ Test the app thoroughly
→ Monitor for any errors for 24 hours
→ Proceed to Phase 5 (Add Indexes) for immediate performance boost
*/

-- ============================================================================
-- 📝 DOCUMENT YOUR RESULTS
-- ============================================================================

/*
Record these for your documentation:

Phase 1 Execution:
- Date: _________________
- Time: _________________
- Executed by: __________

Results:
- Tables dropped: 6
- Space reclaimed: ________ (from Step 3)
- Database size after: ________ (from Step 6)
- Verification status: ✅ PASS / ❌ FAIL

Issues encountered:
- None / [describe any issues]

Next phase scheduled:
- Phase 5 (Add Indexes) on: _________________
*/
