-- ============================================================================
-- PHASE 1: DATABASE CLEANUP - Remove Unused Backup Tables
-- ============================================================================
-- Risk Level: LOW (backup tables are not used by the application)
-- Estimated Time: 5-10 minutes
-- Downtime Required: NONE
-- Rollback Difficulty: EASY (just restore from backup export)
-- ============================================================================

-- ============================================================================
-- STEP 1: EXPORT BACKUPS (Run these first, save the output files)
-- ============================================================================

-- Export app_users_backup
COPY (SELECT * FROM app_users_backup) TO '/tmp/app_users_backup_export.csv' CSV HEADER;

-- Export backup_app_users
COPY (SELECT * FROM backup_app_users) TO '/tmp/backup_app_users_export.csv' CSV HEADER;

-- Export excel_data_backup
COPY (SELECT * FROM excel_data_backup) TO '/tmp/excel_data_backup_export.csv' CSV HEADER;

-- Export users_backup
COPY (SELECT * FROM users_backup) TO '/tmp/users_backup_export.csv' CSV HEADER;

-- Export users_backup_before_se_migration
COPY (SELECT * FROM users_backup_before_se_migration) TO '/tmp/users_backup_before_se_migration_export.csv' CSV HEADER;

-- Export kv_store_e446c708 (old KV store)
COPY (SELECT * FROM kv_store_e446c708) TO '/tmp/kv_store_e446c708_export.csv' CSV HEADER;

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

-- Expected result: 0 rows (no foreign keys reference these tables)

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
-- STEP 4: DROP BACKUP TABLES (POINT OF NO RETURN - ensure backups are saved!)
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
-- STEP 5: VERIFY CLEANUP SUCCESS
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

-- Expected result: 0 rows

-- Check database size reduction
SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- ============================================================================
-- STEP 6: VACUUM TO RECLAIM SPACE
-- ============================================================================

-- Reclaim disk space from dropped tables
VACUUM FULL;

-- Analyze tables to update statistics
ANALYZE;

-- ============================================================================
-- ✅ PHASE 1 COMPLETE
-- ============================================================================

-- What we accomplished:
-- ✅ Removed 6 unused backup tables
-- ✅ Reclaimed disk space
-- ✅ Cleaned up database schema
-- ✅ No impact on application functionality

-- ============================================================================
-- 🔄 ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- Only run this if you need to restore the backup tables

-- Restore app_users_backup
CREATE TABLE IF NOT EXISTS public.app_users_backup (
    id uuid,
    employee_id character varying,
    full_name text,
    email text,
    phone_number character varying,
    role character varying,
    region text,
    zone text,
    zsm text,
    zbm text,
    rank integer,
    total_points integer,
    pin_hash text,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    last_login_at timestamp without time zone,
    login_count integer,
    is_locked boolean,
    failed_attempts integer
);

COPY app_users_backup FROM '/tmp/app_users_backup_export.csv' CSV HEADER;

-- Repeat for other tables as needed...
*/

-- ============================================================================
-- 📊 POST-MIGRATION VERIFICATION CHECKLIST
-- ============================================================================

/*
Run these queries to verify everything still works:

1. Check main user table:
   SELECT COUNT(*) FROM app_users;

2. Check submissions still load:
   SELECT COUNT(*) FROM submissions;

3. Check social posts still load:
   SELECT COUNT(*) FROM social_posts;

4. Check KV store still works:
   SELECT COUNT(*) FROM kv_store_28f2f653;

5. Test app features:
   - Login
   - Leaderboard
   - Submit program
   - Social feed
   - HQ Dashboard
*/
