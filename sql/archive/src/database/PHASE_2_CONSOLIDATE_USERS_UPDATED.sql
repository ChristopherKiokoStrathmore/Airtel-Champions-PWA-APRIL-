-- ============================================================================
-- PHASE 2: CONSOLIDATE USER TABLES (users → app_users) - UPDATED VERSION
-- ============================================================================
-- Risk Level: MEDIUM (modifies foreign key relationships)
-- Estimated Time: 20-30 minutes
-- Downtime Required: 5-10 minutes (recommended during low-traffic period)
-- Rollback Difficulty: MEDIUM (requires restoring FK constraints)
-- ============================================================================

-- ⚠️ CRITICAL: Run this in a staging/test environment first!
-- ⚠️ CRITICAL: Schedule during low-traffic period (after 8 PM EAT)
-- ⚠️ CRITICAL: Announce maintenance window to users

-- ============================================================================
-- STEP 1: ANALYZE CURRENT STATE
-- ============================================================================

-- Check record counts in both user tables
SELECT 
    'users table' AS source,
    COUNT(*) AS record_count
FROM users
UNION ALL
SELECT 
    'app_users table' AS source,
    COUNT(*) AS record_count
FROM app_users;

-- Check if there are users in 'users' table not in 'app_users'
SELECT 
    u.id,
    u.full_name,
    u.phone,
    u.role,
    'EXISTS IN USERS ONLY' AS status
FROM users u
LEFT JOIN app_users au ON u.id = au.id
WHERE au.id IS NULL;

-- ⚠️ IMPORTANT: If this returns rows, you need to migrate that data first!
-- See Step 1B below for migration script

-- ============================================================================
-- STEP 1B: MIGRATE MISSING USERS (if Step 1 found any)
-- ============================================================================

/*
-- Only run this if Step 1 found users in 'users' table not in 'app_users'

INSERT INTO app_users (
    id, 
    employee_id, 
    full_name, 
    email, 
    phone_number, 
    role, 
    region, 
    zone,
    zsm,
    zbm,
    rank,
    total_points,
    pin_hash,
    is_active,
    created_at,
    updated_at,
    avatar_url
)
SELECT 
    u.id,
    u.employee_id,
    u.full_name,
    u.email,
    COALESCE(u.phone_number, u.phone),
    u.role,
    u.region,
    u.zone,
    u.zsm,
    u.zbm,
    u.rank,
    u.total_points,
    u.pin_hash,
    u.is_active,
    u.created_at,
    u.updated_at,
    u.avatar_url
FROM users u
LEFT JOIN app_users au ON u.id = au.id
WHERE au.id IS NULL;

-- Verify migration
SELECT COUNT(*) AS migrated_count FROM app_users WHERE id IN (
    SELECT u.id FROM users u LEFT JOIN app_users au ON u.id = au.id WHERE au.id IS NULL
);
*/

-- ============================================================================
-- STEP 2: CHECK FOREIGN KEY DEPENDENCIES
-- ============================================================================

-- Find all tables referencing 'users' table
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- Expected tables to fix:
-- 1. streaks → user_id
-- 2. user_achievements → user_id 
-- 3. user_challenges → user_id
-- 4. teams → lead_id

-- ============================================================================
-- STEP 3: VERIFY DATA INTEGRITY BEFORE MIGRATION
-- ============================================================================

-- Check for orphaned records in streaks
SELECT COUNT(*) AS orphaned_streaks
FROM streaks s
LEFT JOIN app_users au ON s.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned records in user_achievements
SELECT COUNT(*) AS orphaned_achievements
FROM user_achievements ua
LEFT JOIN app_users au ON ua.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned records in user_challenges
SELECT COUNT(*) AS orphaned_challenges
FROM user_challenges uc
LEFT JOIN app_users au ON uc.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned records in teams
SELECT COUNT(*) AS orphaned_teams
FROM teams t
LEFT JOIN app_users au ON t.lead_id = au.id
WHERE t.lead_id IS NOT NULL AND au.id IS NULL;

-- ⚠️ DECISION POINT:
-- If any of these return > 0, those records will become orphaned!
-- You must either:
-- A) Delete them: DELETE FROM streaks WHERE user_id NOT IN (SELECT id FROM app_users);
-- B) Complete Step 1B migration first

-- ============================================================================
-- STEP 4: DROP EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop FK from streaks
ALTER TABLE public.streaks 
DROP CONSTRAINT IF EXISTS streaks_user_id_fkey;

-- Drop FK from user_achievements
ALTER TABLE public.user_achievements 
DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;

-- Drop FK from user_challenges
ALTER TABLE public.user_challenges 
DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey;

-- Drop FK from teams (lead_id)
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_lead_id_fkey;

-- ============================================================================
-- STEP 5: ADD NEW FOREIGN KEY CONSTRAINTS TO app_users
-- ============================================================================

-- Add FK from streaks to app_users
ALTER TABLE public.streaks 
ADD CONSTRAINT streaks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) 
ON DELETE CASCADE;

-- Add FK from user_achievements to app_users
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) 
ON DELETE CASCADE;

-- Add FK from user_challenges to app_users
ALTER TABLE public.user_challenges 
ADD CONSTRAINT user_challenges_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.app_users(id) 
ON DELETE CASCADE;

-- Add FK from teams to app_users (lead_id)
ALTER TABLE public.teams 
ADD CONSTRAINT teams_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.app_users(id) 
ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: VERIFY NEW CONSTRAINTS WORK
-- ============================================================================

-- Test that constraints are in place
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('streaks', 'user_achievements', 'user_challenges', 'teams')
    AND ccu.table_name = 'app_users';

-- ✅ Expected: 4 rows showing all constraints now point to app_users

-- ============================================================================
-- STEP 7: DROP THE OLD 'users' TABLE
-- ============================================================================

-- ⚠️ POINT OF NO RETURN - Ensure all tests pass before running this!

-- Final check: confirm no FKs still reference 'users'
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users';

-- ✅ Expected: 0 rows (no constraints reference 'users' anymore)

-- Check if teams table has a self-referencing FK to users
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS fk_users_team_id;

-- Drop the users table
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- STEP 8: VERIFY SUCCESS
-- ============================================================================

-- Confirm users table is dropped
SELECT tablename 
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- ✅ Expected: 0 rows

-- Verify app_users still works
SELECT COUNT(*) AS user_count FROM app_users;

-- Verify dependent tables still work
SELECT 
    'streaks' AS table_name, 
    COUNT(*) AS record_count 
FROM streaks
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL
SELECT 'user_challenges', COUNT(*) FROM user_challenges
UNION ALL
SELECT 'teams', COUNT(*) FROM teams;

-- Update statistics
ANALYZE;

-- ============================================================================
-- ✅ PHASE 2 COMPLETE!
-- ============================================================================

-- What we accomplished:
-- ✅ Consolidated user data into single 'app_users' table
-- ✅ Updated all foreign key relationships
-- ✅ Removed duplicate 'users' table
-- ✅ Improved data consistency

-- ============================================================================
-- 🔄 ROLLBACK SCRIPT (EMERGENCY USE ONLY)
-- ============================================================================

/*
-- Only run this if Phase 2 causes critical issues

-- You cannot easily rollback because we dropped the 'users' table
-- Your only option is to restore from a database backup

-- If you have a backup:
-- 1. Stop all app connections
-- 2. Restore from backup: pg_restore your_backup.sql
-- 3. Verify data integrity
-- 4. Restart app

-- This is why testing in staging first is CRITICAL!
*/

-- ============================================================================
-- 📊 POST-MIGRATION VERIFICATION CHECKLIST
-- ============================================================================

/*
After Phase 2, test these features thoroughly:

1. User Login:
   - Test login as Sales Executive ✅
   - Test login as Director ✅
   - Verify session creation ✅

2. Leaderboard:
   SELECT * FROM app_users ORDER BY total_points DESC LIMIT 10;
   - Check rankings load correctly ✅
   - Verify points display ✅

3. Streaks:
   SELECT * FROM streaks LIMIT 10;
   - View user streak data ✅
   - Verify user_id references work ✅

4. Achievements:
   SELECT * FROM user_achievements LIMIT 10;
   - View user achievements ✅
   - Verify relationships work ✅

5. Challenges:
   SELECT * FROM user_challenges LIMIT 10;
   - View active challenges ✅
   - Check user progress ✅

6. Teams:
   SELECT * FROM teams WHERE lead_id IS NOT NULL LIMIT 10;
   - View team members ✅
   - Check team lead assignment ✅

7. Check for orphaned records (should all be 0):
   SELECT COUNT(*) FROM streaks WHERE user_id NOT IN (SELECT id FROM app_users);
   SELECT COUNT(*) FROM user_achievements WHERE user_id NOT IN (SELECT id FROM app_users);
   SELECT COUNT(*) FROM user_challenges WHERE user_id NOT IN (SELECT id FROM app_users);
   SELECT COUNT(*) FROM teams WHERE lead_id NOT IN (SELECT id FROM app_users);
*/

-- ============================================================================
-- 🎯 SUCCESS CRITERIA
-- ============================================================================

-- Phase 2 is successful if:
-- ✅ All FK constraints point to app_users
-- ✅ No orphaned records exist
-- ✅ App functionality works perfectly
-- ✅ No errors in server logs
-- ✅ Users table is dropped
-- ✅ Database is cleaner and more consistent
