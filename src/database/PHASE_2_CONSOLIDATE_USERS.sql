-- ============================================================================
-- PHASE 2: CONSOLIDATE USER TABLES (users → app_users)
-- ============================================================================
-- Risk Level: MEDIUM (modifies foreign key relationships)
-- Estimated Time: 15-30 minutes
-- Downtime Required: 5-10 minutes (recommended)
-- Rollback Difficulty: MEDIUM (requires restoring FK constraints)
-- ============================================================================

-- ⚠️ CRITICAL: Run this in a staging/test environment first!
-- ⚠️ CRITICAL: Schedule during low-traffic period (after 8 PM EAT)
-- ⚠️ CRITICAL: Announce maintenance window to users

-- ============================================================================
-- STEP 1: ANALYZE CURRENT STATE
-- ============================================================================

-- Check if 'users' table has any data that's not in 'app_users'
SELECT 
    'users table' AS source,
    COUNT(*) AS record_count
FROM users
UNION ALL
SELECT 
    'app_users table' AS source,
    COUNT(*) AS record_count
FROM app_users;

-- Find users in 'users' table not in 'app_users'
SELECT u.* 
FROM users u
LEFT JOIN app_users au ON u.id = au.id
WHERE au.id IS NULL;

-- If this returns rows, you need to migrate that data to app_users first!

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
-- 1. streaks
-- 2. user_achievements  
-- 3. user_challenges
-- 4. teams

-- ============================================================================
-- STEP 3: BACKUP CURRENT STATE
-- ============================================================================

-- Create backup of users table (just in case)
CREATE TABLE users_migration_backup AS SELECT * FROM users;

-- Create backup of affected tables
CREATE TABLE streaks_backup AS SELECT * FROM streaks;
CREATE TABLE user_achievements_backup AS SELECT * FROM user_achievements;
CREATE TABLE user_challenges_backup AS SELECT * FROM user_challenges;
CREATE TABLE teams_backup AS SELECT * FROM teams;

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
-- STEP 5: VERIFY DATA INTEGRITY BEFORE MIGRATION
-- ============================================================================

-- Check for orphaned records in streaks
SELECT s.* 
FROM streaks s
LEFT JOIN app_users au ON s.user_id = au.id
WHERE au.id IS NULL;
-- If this returns rows, those records will become orphaned after migration!

-- Check for orphaned records in user_achievements
SELECT ua.* 
FROM user_achievements ua
LEFT JOIN app_users au ON ua.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned records in user_challenges
SELECT uc.* 
FROM user_challenges uc
LEFT JOIN app_users au ON uc.user_id = au.id
WHERE au.id IS NULL;

-- Check for orphaned records in teams
SELECT t.* 
FROM teams t
LEFT JOIN app_users au ON t.lead_id = au.id
WHERE au.id IS NULL;

-- ⚠️ DECISION POINT:
-- If orphaned records exist, you must either:
-- A) Delete them: DELETE FROM streaks WHERE user_id NOT IN (SELECT id FROM app_users);
-- B) Migrate missing users from 'users' to 'app_users' first

-- ============================================================================
-- STEP 6: ADD NEW FOREIGN KEY CONSTRAINTS TO app_users
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
-- STEP 7: VERIFY NEW CONSTRAINTS WORK
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

-- Expected: 4 rows showing all constraints now point to app_users

-- ============================================================================
-- STEP 8: DROP THE OLD 'users' TABLE
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

-- Expected: 0 rows (no constraints reference 'users' anymore)

-- Drop the users table
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- STEP 9: CLEANUP BACKUP TABLES (after 30 days of stable operation)
-- ============================================================================

/*
-- Only run this after you're 100% confident the migration was successful
-- and you've monitored the app for 30 days with no issues

DROP TABLE IF EXISTS users_migration_backup CASCADE;
DROP TABLE IF EXISTS streaks_backup CASCADE;
DROP TABLE IF EXISTS user_achievements_backup CASCADE;
DROP TABLE IF EXISTS user_challenges_backup CASCADE;
DROP TABLE IF EXISTS teams_backup CASCADE;
*/

-- ============================================================================
-- ✅ PHASE 2 COMPLETE
-- ============================================================================

-- What we accomplished:
-- ✅ Consolidated user data into single 'app_users' table
-- ✅ Updated all foreign key relationships
-- ✅ Removed duplicate 'users' table
-- ✅ Improved data consistency

-- ============================================================================
-- 🔄 ROLLBACK SCRIPT (if something goes wrong)
-- ============================================================================

/*
-- EMERGENCY ROLLBACK - Only use if Phase 2 causes issues

BEGIN;

-- Restore users table
CREATE TABLE IF NOT EXISTS public.users AS 
SELECT * FROM users_migration_backup;

-- Drop new FK constraints
ALTER TABLE public.streaks DROP CONSTRAINT IF EXISTS streaks_user_id_fkey;
ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_user_id_fkey;
ALTER TABLE public.user_challenges DROP CONSTRAINT IF EXISTS user_challenges_user_id_fkey;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_lead_id_fkey;

-- Restore old FK constraints to 'users'
ALTER TABLE public.streaks 
ADD CONSTRAINT streaks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.user_challenges 
ADD CONSTRAINT user_challenges_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE public.teams 
ADD CONSTRAINT teams_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.users(id);

-- Restore backup data if needed
TRUNCATE streaks;
INSERT INTO streaks SELECT * FROM streaks_backup;

TRUNCATE user_achievements;
INSERT INTO user_achievements SELECT * FROM user_achievements_backup;

TRUNCATE user_challenges;
INSERT INTO user_challenges SELECT * FROM user_challenges_backup;

TRUNCATE teams;
INSERT INTO teams SELECT * FROM teams_backup;

COMMIT;

-- Verify rollback
SELECT 'Rollback complete' AS status;
*/

-- ============================================================================
-- 📊 POST-MIGRATION VERIFICATION CHECKLIST
-- ============================================================================

/*
After Phase 2, test these features thoroughly:

1. User Login:
   - Test login as Sales Executive
   - Test login as Director
   - Verify session creation

2. Leaderboard:
   - Check rankings load correctly
   - Verify points display
   - Test filtering by zone/region

3. Streaks:
   - View user streak data
   - Submit new activity
   - Verify streak updates

4. Achievements:
   - View user achievements
   - Check achievement unlocks
   - Verify points calculation

5. Challenges:
   - View active challenges
   - Check user progress
   - Test challenge completion

6. Teams:
   - View team members
   - Check team lead assignment
   - Verify team hierarchies

7. Database Integrity:
   SELECT COUNT(*) FROM app_users;
   SELECT COUNT(*) FROM streaks;
   SELECT COUNT(*) FROM user_achievements;
   SELECT COUNT(*) FROM user_challenges;
   SELECT COUNT(*) FROM teams;

8. Check for orphaned records (should be 0):
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
-- ✅ Database size reduced
