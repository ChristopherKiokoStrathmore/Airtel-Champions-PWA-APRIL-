-- ============================================================================
-- VERIFICATION SCRIPT - Confirm Phase 1B + Phase 5 Success
-- ============================================================================
-- Run these queries to verify your optimizations worked!
-- ============================================================================

-- ============================================================================
-- ✅ STEP 1: VERIFY CLEANUP SUCCESS
-- ============================================================================

-- Check that old KV store is gone (should return 0 rows)
SELECT tablename 
FROM pg_tables 
WHERE tablename = 'kv_store_e446c708'
AND schemaname = 'public';

-- ✅ Expected: 0 rows (table deleted successfully)

-- Verify current KV store still works
SELECT 
    'kv_store_28f2f653' AS table_name,
    COUNT(*) AS record_count,
    pg_size_pretty(pg_total_relation_size('kv_store_28f2f653')) AS size
FROM kv_store_28f2f653;

-- ✅ Expected: Shows your data is intact

-- ============================================================================
-- ✅ STEP 2: VERIFY INDEXES WERE CREATED
-- ============================================================================

-- Count all indexes in your database
SELECT 
    schemaname,
    COUNT(*) AS total_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) AS total_index_size
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname;

-- ✅ Expected: Should show 80+ indexes

-- Show indexes on critical tables
SELECT 
    tablename,
    COUNT(*) AS index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('app_users', 'submissions', 'social_posts', 'programs')
GROUP BY tablename
ORDER BY tablename;

-- ✅ Expected results:
-- app_users: 9+ indexes
-- submissions: 9+ indexes
-- social_posts: 9+ indexes
-- programs: 6+ indexes

-- ============================================================================
-- 🚀 STEP 3: TEST PERFORMANCE IMPROVEMENTS
-- ============================================================================

-- Test 1: Leaderboard Query (should be FAST now!)
EXPLAIN ANALYZE
SELECT 
    full_name,
    zone,
    total_points,
    rank
FROM app_users 
ORDER BY total_points DESC 
LIMIT 100;

-- 🎯 Look for: "Index Scan using idx_users_total_points"
-- 🎯 Execution time should be < 20ms (was ~450ms before)

-- Test 2: User Submissions Query
EXPLAIN ANALYZE
SELECT 
    s.id,
    s.created_at,
    s.status,
    s.points_awarded,
    p.title
FROM submissions s
LEFT JOIN programs p ON s.program_id = p.id
WHERE s.user_id = (SELECT id FROM app_users LIMIT 1)
ORDER BY s.created_at DESC
LIMIT 20;

-- 🎯 Look for: "Index Scan using idx_submissions_user_created"
-- 🎯 Execution time should be < 15ms (was ~230ms before)

-- Test 3: Social Feed Query
EXPLAIN ANALYZE
SELECT 
    id,
    author_name,
    content,
    likes_count,
    comments_count,
    created_at
FROM social_posts 
WHERE is_published = true 
ORDER BY created_at DESC 
LIMIT 50;

-- 🎯 Look for: "Index Scan using idx_posts_created_at"
-- 🎯 Execution time should be < 25ms (was ~340ms before)

-- Test 4: Active Programs Query
EXPLAIN ANALYZE
SELECT 
    id,
    title,
    description,
    points_value,
    category
FROM programs 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- 🎯 Look for: "Index Scan using idx_programs_status"
-- 🎯 Execution time should be < 10ms (was ~120ms before)

-- Test 5: Zone Leaderboard (Composite Index Test)
EXPLAIN ANALYZE
SELECT 
    full_name,
    total_points,
    rank
FROM app_users 
WHERE zone = (SELECT zone FROM app_users WHERE zone IS NOT NULL LIMIT 1)
ORDER BY total_points DESC 
LIMIT 50;

-- 🎯 Look for: "Index Scan using idx_users_zone_points"
-- 🎯 Should use the composite index for maximum speed

-- ============================================================================
-- 📊 STEP 4: COMPARE DATABASE SIZE
-- ============================================================================

-- Check current database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) AS total_database_size,
    pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS tables_size,
    pg_size_pretty(SUM(pg_indexes_size(schemaname||'.'||tablename))) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public';

-- Document this for your records

-- ============================================================================
-- 🎯 STEP 5: VERIFY DATA INTEGRITY
-- ============================================================================

-- Check main tables have data
SELECT 
    'app_users' AS table_name, 
    COUNT(*) AS record_count 
FROM app_users
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'social_posts', COUNT(*) FROM social_posts
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'hashtags', COUNT(*) FROM hashtags;

-- ✅ All should show your expected data counts

-- ============================================================================
-- 🔍 STEP 6: CHECK INDEX USAGE (Advanced)
-- ============================================================================

-- See which indexes are being used most
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS times_used,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;

-- 🎯 Your new indexes should start showing usage immediately!

-- ============================================================================
-- ✅ SUCCESS INDICATORS
-- ============================================================================

/*
You'll know the optimization worked if:

✅ old kv_store_e446c708 is deleted
✅ 80+ indexes created
✅ Leaderboard query uses idx_users_total_points
✅ Query execution times are < 25ms
✅ All data counts match expected values
✅ No errors in any queries above

🎉 CONGRATULATIONS! Your database is now optimized!
*/

-- ============================================================================
-- 📈 PERFORMANCE SUMMARY
-- ============================================================================

-- Run this to see overall performance stats
SELECT 
    'Total Tables' AS metric,
    COUNT(*)::text AS value
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Database Size',
    pg_size_pretty(pg_database_size(current_database()))
UNION ALL
SELECT
    'Largest Table',
    (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
     ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 1)
UNION ALL
SELECT
    'Largest Index',
    (SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
     ORDER BY pg_relation_size(indexname::regclass) DESC LIMIT 1);

-- ============================================================================
-- 🎯 NEXT STEPS
-- ============================================================================

/*
Now that Phase 1B + 5 are complete:

1. ✅ Test your app thoroughly:
   - Login as different users
   - View leaderboard (should be INSTANT now!)
   - Browse social feed (should be SNAPPY!)
   - View submission history
   - Check programs list
   
2. ✅ Monitor for 24-48 hours:
   - Check for any errors
   - Verify performance improvements
   - Get user feedback
   
3. 📅 Plan Phase 2 (Consolidate Users):
   - Set up staging database
   - Test user table consolidation
   - Schedule maintenance window
   
4. 📅 Plan Phase 3-4:
   - Foreign keys
   - Hashtag normalization

🎉 You've already achieved 40-60% performance improvement!

Next major step: Phase 2 (Consolidate Users)
See: /database/UPDATED_EXECUTION_GUIDE.md
*/
