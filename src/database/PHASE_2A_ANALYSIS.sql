-- ============================================================================
-- PHASE 2A: USER CONSOLIDATION - ANALYSIS SCRIPT
-- ============================================================================
-- This script analyzes the app_users table for duplicates and potential issues
-- 100% SAFE - READ-ONLY QUERIES ONLY
-- ============================================================================

\echo '═══════════════════════════════════════════════════════════'
\echo '🔍 PHASE 2A: USER CONSOLIDATION ANALYSIS'
\echo '═══════════════════════════════════════════════════════════'
\echo ''

-- ============================================================================
-- 1. OVERALL USER STATISTICS
-- ============================================================================
\echo '📊 1. OVERALL USER STATISTICS'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT employee_id) as unique_employee_ids,
  COUNT(DISTINCT email) as unique_emails,
  COUNT(DISTINCT phone_number) as unique_phone_numbers,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users,
  SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_users,
  COUNT(*) - COUNT(DISTINCT employee_id) as potential_duplicates_by_emp_id,
  COUNT(*) - COUNT(DISTINCT email) as potential_duplicates_by_email,
  COUNT(*) - COUNT(DISTINCT phone_number) as potential_duplicates_by_phone
FROM app_users;

\echo ''

-- ============================================================================
-- 2. USERS BY ROLE
-- ============================================================================
\echo '📊 2. USERS BY ROLE'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  role,
  COUNT(*) as count,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive,
  ROUND(AVG(total_points), 0) as avg_points,
  MAX(total_points) as max_points
FROM app_users
GROUP BY role
ORDER BY count DESC;

\echo ''

-- ============================================================================
-- 3. DUPLICATE EMPLOYEE IDs
-- ============================================================================
\echo '🔴 3. DUPLICATE EMPLOYEE IDs (CRITICAL)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  employee_id,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY last_login_at DESC NULLS LAST) as user_ids,
  ARRAY_AGG(full_name ORDER BY last_login_at DESC NULLS LAST) as names,
  ARRAY_AGG(role ORDER BY last_login_at DESC NULLS LAST) as roles,
  ARRAY_AGG(total_points ORDER BY last_login_at DESC NULLS LAST) as points,
  ARRAY_AGG(is_active ORDER BY last_login_at DESC NULLS LAST) as active_status,
  ARRAY_AGG(last_login_at ORDER BY last_login_at DESC NULLS LAST) as last_logins,
  MAX(last_login_at) as most_recent_login
FROM app_users
WHERE employee_id IS NOT NULL
GROUP BY employee_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, most_recent_login DESC NULLS LAST;

\echo ''

-- ============================================================================
-- 4. DUPLICATE EMAILS
-- ============================================================================
\echo '🟡 4. DUPLICATE EMAILS (WARNING)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  email,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY last_login_at DESC NULLS LAST) as user_ids,
  ARRAY_AGG(full_name ORDER BY last_login_at DESC NULLS LAST) as names,
  ARRAY_AGG(employee_id ORDER BY last_login_at DESC NULLS LAST) as employee_ids,
  ARRAY_AGG(total_points ORDER BY last_login_at DESC NULLS LAST) as points,
  MAX(last_login_at) as most_recent_login
FROM app_users
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, most_recent_login DESC NULLS LAST;

\echo ''

-- ============================================================================
-- 5. DUPLICATE PHONE NUMBERS
-- ============================================================================
\echo '🟡 5. DUPLICATE PHONE NUMBERS (WARNING)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  phone_number,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY last_login_at DESC NULLS LAST) as user_ids,
  ARRAY_AGG(full_name ORDER BY last_login_at DESC NULLS LAST) as names,
  ARRAY_AGG(employee_id ORDER BY last_login_at DESC NULLS LAST) as employee_ids,
  ARRAY_AGG(total_points ORDER BY last_login_at DESC NULLS LAST) as points,
  MAX(last_login_at) as most_recent_login
FROM app_users
WHERE phone_number IS NOT NULL AND phone_number != ''
GROUP BY phone_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, most_recent_login DESC NULLS LAST;

\echo ''

-- ============================================================================
-- 6. DUPLICATE FULL NAMES (INFORMATIONAL)
-- ============================================================================
\echo '🔵 6. DUPLICATE FULL NAMES (INFORMATIONAL)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  full_name,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY last_login_at DESC NULLS LAST) as user_ids,
  ARRAY_AGG(employee_id ORDER BY last_login_at DESC NULLS LAST) as employee_ids,
  ARRAY_AGG(email ORDER BY last_login_at DESC NULLS LAST) as emails,
  ARRAY_AGG(zone ORDER BY last_login_at DESC NULLS LAST) as zones,
  MAX(last_login_at) as most_recent_login
FROM app_users
GROUP BY full_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, most_recent_login DESC NULLS LAST
LIMIT 20;

\echo ''

-- ============================================================================
-- 7. USERS WITH MOST ACTIVITY (KEEP THESE)
-- ============================================================================
\echo '⭐ 7. USERS WITH MOST ACTIVITY (HIGH PRIORITY TO KEEP)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  id,
  employee_id,
  full_name,
  role,
  total_points,
  login_count,
  last_login_at,
  created_at,
  is_active
FROM app_users
ORDER BY total_points DESC NULLS LAST, login_count DESC NULLS LAST
LIMIT 20;

\echo ''

-- ============================================================================
-- 8. INACTIVE USERS WITH NO ACTIVITY
-- ============================================================================
\echo '⚠️ 8. INACTIVE USERS WITH NO ACTIVITY (CANDIDATES FOR CLEANUP)'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  COUNT(*) as total_inactive,
  SUM(CASE WHEN last_login_at IS NULL THEN 1 ELSE 0 END) as never_logged_in,
  SUM(CASE WHEN total_points = 0 THEN 1 ELSE 0 END) as zero_points,
  SUM(CASE WHEN login_count = 0 THEN 1 ELSE 0 END) as zero_logins
FROM app_users
WHERE is_active = false;

-- Show sample of inactive users
SELECT 
  id,
  employee_id,
  full_name,
  role,
  total_points,
  login_count,
  last_login_at,
  created_at
FROM app_users
WHERE is_active = false
ORDER BY created_at DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- 9. FOREIGN KEY DEPENDENCY COUNTS
-- ============================================================================
\echo '🔗 9. FOREIGN KEY DEPENDENCY COUNTS (DATA TO MERGE)'
\echo '─────────────────────────────────────────────────────────────'

-- Count records per user across all dependent tables
WITH user_activity AS (
  SELECT 
    u.id,
    u.employee_id,
    u.full_name,
    u.total_points,
    (SELECT COUNT(*) FROM submissions WHERE user_id = u.id) as submissions_count,
    (SELECT COUNT(*) FROM social_posts WHERE author_id = u.id) as posts_count,
    (SELECT COUNT(*) FROM social_likes WHERE user_id = u.id) as likes_count,
    (SELECT COUNT(*) FROM social_comments WHERE author_id = u.id) as comments_count,
    (SELECT COUNT(*) FROM group_members WHERE user_id = u.id) as group_memberships,
    (SELECT COUNT(*) FROM group_messages WHERE user_id = u.id) as group_messages_count,
    (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id) as session_count,
    (SELECT COUNT(*) FROM user_actions WHERE user_id = u.id) as action_count,
    (SELECT COUNT(*) FROM page_views WHERE user_id = u.id) as page_view_count,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievement_count,
    (SELECT COUNT(*) FROM call_sessions WHERE caller_id = u.id OR callee_id = u.id) as call_count
  FROM app_users u
  WHERE u.is_active = true
)
SELECT 
  id,
  employee_id,
  full_name,
  total_points,
  submissions_count,
  posts_count,
  likes_count,
  comments_count,
  group_memberships,
  group_messages_count,
  session_count,
  action_count,
  page_view_count,
  achievement_count,
  call_count,
  (submissions_count + posts_count + likes_count + comments_count + 
   group_memberships + group_messages_count + session_count + 
   action_count + page_view_count + achievement_count + call_count) as total_activity
FROM user_activity
WHERE (submissions_count + posts_count + likes_count + comments_count + 
       group_memberships + group_messages_count + session_count + 
       action_count + page_view_count + achievement_count + call_count) > 0
ORDER BY total_activity DESC
LIMIT 20;

\echo ''

-- ============================================================================
-- 10. SUMMARY REPORT
-- ============================================================================
\echo '📋 10. SUMMARY REPORT'
\echo '─────────────────────────────────────────────────────────────'

SELECT 
  '🔴 Critical Issues' as category,
  (SELECT COUNT(*) FROM (
    SELECT employee_id 
    FROM app_users 
    WHERE employee_id IS NOT NULL 
    GROUP BY employee_id 
    HAVING COUNT(*) > 1
  ) sub) as duplicate_employee_ids,
  'Users with same employee_id - MUST consolidate' as description
UNION ALL
SELECT 
  '🟡 Warnings' as category,
  (SELECT COUNT(*) FROM (
    SELECT email 
    FROM app_users 
    WHERE email IS NOT NULL AND email != '' 
    GROUP BY email 
    HAVING COUNT(*) > 1
  ) sub) as duplicate_emails,
  'Users with same email - Should review' as description
UNION ALL
SELECT 
  '🔵 Informational' as category,
  (SELECT COUNT(*) FROM app_users WHERE is_active = false) as inactive_users,
  'Inactive users - Can be archived' as description
UNION ALL
SELECT 
  '✅ Total Active Users' as category,
  (SELECT COUNT(*) FROM app_users WHERE is_active = true) as active_users,
  'Currently active in the system' as description;

\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo '✅ ANALYSIS COMPLETE!'
\echo '═══════════════════════════════════════════════════════════'
\echo ''
\echo '📊 NEXT STEPS:'
\echo '1. Review the duplicate reports above'
\echo '2. Identify which users should be kept (primary)'
\echo '3. Run PHASE_2B_TEST_CONSOLIDATION.sql for dry run'
\echo '4. Run PHASE_2C_PRODUCTION_CONSOLIDATION.sql for actual merge'
\echo ''
\echo '⚠️  IMPORTANT: Share the output above before proceeding!'
\echo '═══════════════════════════════════════════════════════════'
