-- ============================================================================
-- PHASE 3: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Risk Level: LOW-MEDIUM (improves data integrity)
-- Estimated Time: 10-15 minutes
-- Downtime Required: NONE (constraints are additive)
-- Rollback Difficulty: EASY (just drop the constraints)
-- ============================================================================

-- Foreign keys prevent orphaned data and enable CASCADE operations
-- This phase adds missing FK constraints across the database

-- ============================================================================
-- STEP 1: CHECK FOR ORPHANED DATA BEFORE ADDING CONSTRAINTS
-- ============================================================================

-- Check competitor_activity (submission_id should reference submissions.id)
SELECT COUNT(*) AS orphaned_competitor_activities
FROM competitor_activity ca
LEFT JOIN submissions s ON ca.submission_id = s.id
WHERE s.id IS NULL;

-- Check program_fields (program_id should reference programs.id)
SELECT COUNT(*) AS orphaned_program_fields
FROM program_fields pf
LEFT JOIN programs p ON pf.program_id = p.id
WHERE p.id IS NULL;

-- Check announcements (author_id should reference app_users.id)
SELECT COUNT(*) AS orphaned_announcements
FROM announcements a
LEFT JOIN app_users u ON a.author_id = u.id
WHERE u.id IS NULL;

-- Check programs (created_by should reference app_users.id)
SELECT COUNT(*) AS orphaned_programs
FROM programs p
LEFT JOIN app_users u ON p.created_by = u.id
WHERE u.id IS NULL AND p.created_by IS NOT NULL;

-- Check page_views (user_id should reference app_users.id)
SELECT COUNT(*) AS orphaned_page_views
FROM page_views pv
LEFT JOIN app_users u ON pv.user_id = u.id
WHERE u.id IS NULL;

-- Check user_actions (user_id should reference app_users.id)
SELECT COUNT(*) AS orphaned_user_actions
FROM user_actions ua
LEFT JOIN app_users u ON ua.user_id = u.id
WHERE u.id IS NULL;

-- ⚠️ DECISION POINT:
-- If any of these return > 0, you must clean up orphaned data first!
-- See STEP 2 for cleanup scripts

-- ============================================================================
-- STEP 2: CLEANUP ORPHANED DATA (if necessary)
-- ============================================================================

/*
-- Only run these if STEP 1 found orphaned records

-- Clean up competitor_activity
DELETE FROM competitor_activity 
WHERE submission_id NOT IN (SELECT id FROM submissions);

-- Clean up program_fields
DELETE FROM program_fields 
WHERE program_id NOT IN (SELECT id FROM programs);

-- Clean up announcements (or set to NULL)
DELETE FROM announcements 
WHERE author_id NOT IN (SELECT id FROM app_users);

-- Clean up programs (set created_by to NULL)
UPDATE programs 
SET created_by = NULL 
WHERE created_by NOT IN (SELECT id FROM app_users);

-- Clean up page_views
DELETE FROM page_views 
WHERE user_id NOT IN (SELECT id FROM app_users);

-- Clean up user_actions
DELETE FROM user_actions 
WHERE user_id NOT IN (SELECT id FROM app_users);
*/

-- ============================================================================
-- STEP 3: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add FK: competitor_activity -> submissions
ALTER TABLE public.competitor_activity
ADD CONSTRAINT competitor_activity_submission_id_fkey
FOREIGN KEY (submission_id) REFERENCES public.submissions(id)
ON DELETE CASCADE;

-- Add FK: program_fields -> programs (already exists, but verify)
-- This should already be in place, but we'll ensure it
ALTER TABLE public.program_fields
DROP CONSTRAINT IF EXISTS program_fields_program_id_fkey;

ALTER TABLE public.program_fields
ADD CONSTRAINT program_fields_program_id_fkey
FOREIGN KEY (program_id) REFERENCES public.programs(id)
ON DELETE CASCADE;

-- Add FK: announcements -> app_users
ALTER TABLE public.announcements
ADD CONSTRAINT announcements_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.app_users(id)
ON DELETE SET NULL;

-- Add FK: programs -> app_users (created_by)
ALTER TABLE public.programs
ADD CONSTRAINT programs_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.app_users(id)
ON DELETE SET NULL;

-- page_views and user_actions already have FK constraints, but verify they exist

-- ============================================================================
-- STEP 4: FIX notifications TABLE (user_id is text, should be uuid)
-- ============================================================================

-- This is a critical issue: notifications.user_id is stored as TEXT instead of UUID
-- We need to migrate this carefully

-- First, check current data type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'user_id';

-- Check if there are any invalid UUIDs in the notifications table
SELECT user_id, COUNT(*) 
FROM notifications
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
GROUP BY user_id;

-- If the above returns rows with invalid UUIDs, you need to clean them up:
/*
-- Option 1: Delete invalid notifications
DELETE FROM notifications
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Option 2: Set invalid user_ids to NULL
UPDATE notifications
SET user_id = NULL
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
*/

-- Now convert user_id from TEXT to UUID
ALTER TABLE public.notifications
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add FK constraint from notifications to app_users
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: ADD COMPOSITE INDEXES FOR FOREIGN KEY LOOKUPS
-- ============================================================================

-- These indexes speed up JOIN operations and FK constraint checks

-- Index on competitor_activity.submission_id
CREATE INDEX IF NOT EXISTS idx_competitor_activity_submission_id 
ON competitor_activity(submission_id);

-- Index on program_fields.program_id
CREATE INDEX IF NOT EXISTS idx_program_fields_program_id 
ON program_fields(program_id);

-- Index on announcements.author_id
CREATE INDEX IF NOT EXISTS idx_announcements_author_id 
ON announcements(author_id);

-- Index on programs.created_by
CREATE INDEX IF NOT EXISTS idx_programs_created_by 
ON programs(created_by);

-- Index on notifications.user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

-- ============================================================================
-- STEP 6: ADD ON DELETE CASCADE/SET NULL RULES WHERE NEEDED
-- ============================================================================

-- Review and update cascade rules for existing FKs

-- submissions -> app_users (should CASCADE when user deleted)
ALTER TABLE public.submissions 
DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;

ALTER TABLE public.submissions
ADD CONSTRAINT submissions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- submissions -> programs (should SET NULL when program deleted)
ALTER TABLE public.submissions 
DROP CONSTRAINT IF EXISTS submissions_program_id_fkey;

ALTER TABLE public.submissions
ADD CONSTRAINT submissions_program_id_fkey
FOREIGN KEY (program_id) REFERENCES public.programs(id)
ON DELETE SET NULL;

-- social_posts -> app_users (should CASCADE or SET NULL?)
-- Let's SET NULL so posts remain visible even if author account deleted
ALTER TABLE public.social_posts 
DROP CONSTRAINT IF EXISTS social_posts_author_id_fkey;

ALTER TABLE public.social_posts
ADD CONSTRAINT social_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.app_users(id)
ON DELETE SET NULL;

-- social_comments -> social_posts (CASCADE - no orphan comments)
ALTER TABLE public.social_comments 
DROP CONSTRAINT IF EXISTS social_comments_post_id_fkey;

ALTER TABLE public.social_comments
ADD CONSTRAINT social_comments_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.social_posts(id)
ON DELETE CASCADE;

-- social_comments -> app_users (SET NULL - keep comment, remove author)
ALTER TABLE public.social_comments 
DROP CONSTRAINT IF EXISTS social_comments_author_id_fkey;

ALTER TABLE public.social_comments
ADD CONSTRAINT social_comments_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.app_users(id)
ON DELETE SET NULL;

-- social_likes -> social_posts (CASCADE - no orphan likes)
ALTER TABLE public.social_likes 
DROP CONSTRAINT IF EXISTS social_likes_post_id_fkey;

ALTER TABLE public.social_likes
ADD CONSTRAINT social_likes_post_id_fkey
FOREIGN KEY (post_id) REFERENCES public.social_posts(id)
ON DELETE CASCADE;

-- social_likes -> app_users (CASCADE - remove like when user deleted)
ALTER TABLE public.social_likes 
DROP CONSTRAINT IF EXISTS social_likes_user_id_fkey;

ALTER TABLE public.social_likes
ADD CONSTRAINT social_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.app_users(id)
ON DELETE CASCADE;

-- ============================================================================
-- STEP 7: VERIFY ALL FOREIGN KEYS ARE IN PLACE
-- ============================================================================

-- List all foreign key constraints in the database
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule AS on_delete
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected output: List of all FK relationships with their cascade rules

-- ============================================================================
-- ✅ PHASE 3 COMPLETE
-- ============================================================================

-- What we accomplished:
-- ✅ Added missing foreign key constraints
-- ✅ Fixed notifications.user_id type (TEXT → UUID)
-- ✅ Added ON DELETE CASCADE/SET NULL rules
-- ✅ Created indexes for FK lookups
-- ✅ Enforced referential integrity

-- ============================================================================
-- 🔄 ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- Remove all FK constraints added in Phase 3

ALTER TABLE public.competitor_activity DROP CONSTRAINT IF EXISTS competitor_activity_submission_id_fkey;
ALTER TABLE public.program_fields DROP CONSTRAINT IF EXISTS program_fields_program_id_fkey;
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_created_by_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Revert notifications.user_id back to TEXT (if needed)
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE text;

-- Drop indexes
DROP INDEX IF EXISTS idx_competitor_activity_submission_id;
DROP INDEX IF EXISTS idx_program_fields_program_id;
DROP INDEX IF EXISTS idx_announcements_author_id;
DROP INDEX IF EXISTS idx_programs_created_by;
DROP INDEX IF EXISTS idx_notifications_user_id;
*/

-- ============================================================================
-- 📊 POST-MIGRATION VERIFICATION CHECKLIST
-- ============================================================================

/*
Test these features after Phase 3:

1. Submissions:
   - Create new submission
   - View submission details
   - Delete a submission (should cascade to competitor_activity)

2. Programs:
   - Create new program
   - Edit program fields
   - Delete a program (should update submissions.program_id to NULL)

3. Social Feed:
   - Create new post
   - Like a post
   - Comment on a post
   - Delete a post (should cascade delete likes and comments)

4. Notifications:
   - Create new notification
   - View user notifications
   - Delete user (should cascade delete their notifications)

5. Database Integrity:
   -- No orphaned competitor_activity records
   SELECT COUNT(*) FROM competitor_activity WHERE submission_id NOT IN (SELECT id FROM submissions);
   -- Should return 0
   
   -- No orphaned program_fields records
   SELECT COUNT(*) FROM program_fields WHERE program_id NOT IN (SELECT id FROM programs);
   -- Should return 0
   
   -- No orphaned social_likes
   SELECT COUNT(*) FROM social_likes WHERE post_id NOT IN (SELECT id FROM social_posts);
   -- Should return 0
*/

-- ============================================================================
-- 🎯 SUCCESS CRITERIA
-- ============================================================================

-- Phase 3 is successful if:
-- ✅ All FK constraints are in place
-- ✅ No orphaned records exist
-- ✅ CASCADE deletes work correctly
-- ✅ All app features work normally
-- ✅ notifications.user_id is UUID type
-- ✅ No constraint violation errors in logs
