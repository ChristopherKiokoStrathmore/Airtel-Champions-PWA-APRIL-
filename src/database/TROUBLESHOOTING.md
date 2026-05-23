# 🔧 Troubleshooting Guide - Post-Optimization

This guide covers common issues you might encounter after the database optimization.

---

## ⚡ Quick Diagnostics

If something seems wrong, run this diagnostic query in Supabase:

```sql
-- Quick Health Check
SELECT 
    'Total Indexes' AS metric,
    COUNT(*)::text AS value,
    CASE WHEN COUNT(*) >= 180 THEN '✅ Good' ELSE '⚠️ Check' END AS status
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total Users',
    COUNT(*)::text,
    '✅ Good'
FROM app_users

UNION ALL

SELECT 
    'Active Users',
    COUNT(*)::text,
    '✅ Good'
FROM app_users
WHERE is_active = true

UNION ALL

SELECT 
    'Total Submissions',
    COUNT(*)::text,
    '✅ Good'
FROM submissions

UNION ALL

SELECT 
    'Total Posts',
    COUNT(*)::text,
    '✅ Good'
FROM social_posts;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "App feels slower, not faster!"

**Symptoms:**
- App loading times haven't improved
- Queries still taking long time

**Possible Causes:**
1. Browser/app cache not cleared
2. Server hasn't restarted
3. Network issues (not database)

**Solutions:**
```sql
-- 1. Verify indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Should return 90+ indexes
```

```sql
-- 2. Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM app_users
ORDER BY total_points DESC
LIMIT 20;

-- Should show "Index Scan using idx_users_total_points"
```

**Action Steps:**
1. Clear browser cache
2. Restart your app
3. Test on fresh browser/device
4. Check network speed (not database issue)

---

### Issue 2: "Error: relation does not exist"

**Symptoms:**
- App throwing errors about missing tables
- Some queries failing

**Possible Causes:**
1. Table name typo in code
2. Wrong schema being queried
3. Migration script error

**Solutions:**
```sql
-- Check all tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Action Steps:**
1. Verify table name spelling in your code
2. Check you're using correct schema (public)
3. If table is truly missing, check backup

---

### Issue 3: "Queries returning wrong data"

**Symptoms:**
- Leaderboard showing wrong rankings
- Submissions missing
- User data incorrect

**Possible Causes:**
1. Data inconsistency (not from optimization)
2. Application logic issue
3. Caching issue

**Solutions:**
```sql
-- Verify data integrity
SELECT 
    id,
    full_name,
    total_points,
    rank
FROM app_users
ORDER BY total_points DESC
LIMIT 10;

-- Should match expected leaderboard
```

```sql
-- Check submission counts
SELECT 
    u.full_name,
    COUNT(s.id) AS submission_count
FROM app_users u
LEFT JOIN submissions s ON s.user_id = u.id
GROUP BY u.id, u.full_name
ORDER BY submission_count DESC
LIMIT 10;
```

**Action Steps:**
1. The optimization didn't modify data, only indexes
2. Check application logic
3. Verify query syntax in code

---

### Issue 4: "HQ Dashboard not loading"

**Symptoms:**
- HQ Command Center dashboard slow or broken
- Export functionality not working
- Analytics not showing

**Possible Causes:**
1. RLS policies blocking queries
2. Missing permissions
3. Complex queries not optimized

**Solutions:**
```sql
-- Test RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Action Steps:**
1. HQ dashboard uses service role key (bypasses RLS)
2. Check service role key is correct in code
3. Verify export queries are still valid

---

### Issue 5: "Out of memory" or timeout errors

**Symptoms:**
- Queries timing out
- Database throwing memory errors
- Slow performance on large datasets

**Possible Causes:**
1. Query fetching too much data at once
2. Missing LIMIT clause
3. Pagination not working

**Solutions:**
```sql
-- Check largest tables
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Action Steps:**
1. Always use LIMIT in queries
2. Implement pagination (20-50 records per page)
3. Use lazy loading for images
4. Don't fetch all submissions at once

---

### Issue 6: "Duplicate data appearing"

**Symptoms:**
- Users appearing multiple times
- Submissions duplicated
- Leaderboard has duplicates

**Possible Causes:**
1. Join query issue (not from optimization)
2. Missing DISTINCT clause
3. Application creating duplicates

**Solutions:**
```sql
-- Check for duplicate users
SELECT 
    employee_id,
    COUNT(*) AS count
FROM app_users
GROUP BY employee_id
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

```sql
-- Check for duplicate submissions
SELECT 
    id,
    user_id,
    program_id,
    created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 20;
```

**Action Steps:**
1. Optimization didn't create duplicates
2. Check application logic
3. Use DISTINCT in queries if needed
4. Verify data before optimization (check backup)

---

### Issue 7: "Index not being used"

**Symptoms:**
- Queries still slow despite indexes
- EXPLAIN shows sequential scan

**Possible Causes:**
1. Query not matching index
2. Statistics outdated
3. Index not optimal for query pattern

**Solutions:**
```sql
-- Update statistics (helps query planner)
ANALYZE app_users;
ANALYZE submissions;
ANALYZE social_posts;
ANALYZE programs;
```

```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM app_users
WHERE zone = 'Nairobi'
ORDER BY total_points DESC
LIMIT 20;

-- Should show "Index Scan using idx_users_zone_points"
```

**Action Steps:**
1. Run ANALYZE on slow tables
2. Check query matches index columns
3. Ensure WHERE clause uses indexed columns

---

### Issue 8: "Foreign key constraint violation"

**Symptoms:**
- Can't insert/update records
- Error: "violates foreign key constraint"

**Possible Causes:**
1. Referenced record doesn't exist
2. Wrong ID being used
3. Data inconsistency

**Solutions:**
```sql
-- Check foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Action Steps:**
1. Verify referenced ID exists
2. Check for orphaned records
3. Use proper JOIN queries to prevent issues

---

### Issue 9: "Database storage full"

**Symptoms:**
- Can't insert new records
- "disk full" error

**Possible Causes:**
1. Too many indexes (unlikely)
2. Large photo storage
3. Log files filling up

**Solutions:**
```sql
-- Check database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Action Steps:**
1. Indexes add ~10-15% to database size (acceptable)
2. Check Supabase storage limits
3. Clean up old photos if needed
4. Consider upgrading Supabase plan

---

## 🔄 Rollback Plan (Emergency Only)

If you need to undo the optimization (unlikely):

### Remove All Indexes (NOT RECOMMENDED)

```sql
-- ⚠️ ONLY USE IN EMERGENCY ⚠️
-- This will make your app slower again

DO $$ 
DECLARE
    index_name text;
BEGIN
    FOR index_name IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || index_name || ' CASCADE';
    END LOOP;
END $$;
```

**Then recreate basic indexes:**
```sql
-- Minimal indexes for basic functionality
CREATE INDEX IF NOT EXISTS idx_users_total_points ON app_users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON social_posts(created_at DESC);
```

---

## 📊 Performance Testing

Test your optimizations with these queries:

### Test 1: Leaderboard Speed
```sql
EXPLAIN ANALYZE
SELECT 
    id,
    full_name,
    total_points,
    rank,
    zone
FROM app_users
WHERE is_active = true
ORDER BY total_points DESC
LIMIT 20;

-- Should complete in <20ms
-- Should use idx_users_total_points
```

### Test 2: User Submissions Speed
```sql
EXPLAIN ANALYZE
SELECT 
    s.*,
    p.title AS program_title
FROM submissions s
JOIN programs p ON p.id = s.program_id
WHERE s.user_id = (SELECT id FROM app_users LIMIT 1)
ORDER BY s.created_at DESC
LIMIT 20;

-- Should complete in <15ms
-- Should use idx_submissions_user_created
```

### Test 3: Social Feed Speed
```sql
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
LIMIT 20;

-- Should complete in <20ms
-- Should use index on created_at
```

---

## 🆘 When to Get Help

Contact support if:
1. ✅ You've tried solutions above
2. ✅ Issue persists for >24 hours
3. ✅ Affecting multiple users
4. ✅ Data loss suspected
5. ✅ Critical functionality broken

---

## 📞 Support Resources

1. **Supabase Dashboard**
   - Check logs: Database > Logs
   - Monitor performance: Database > Performance
   - View errors: Database > Query Performance

2. **Figma Make**
   - Review optimization documentation
   - Check backup files in `/database/backups/`

3. **Database Backup**
   - Available in `/database/backups/`
   - Can restore if needed

---

## ✅ Prevention Tips

1. **Always test queries** before deploying
2. **Monitor performance** regularly
3. **Keep backups** updated
4. **Document changes** you make
5. **Test on staging** first if available

---

**Remember:** The optimization was low-risk and didn't modify data. Most issues are unrelated to the optimization and existed before.

---

*Last Updated: January 22, 2026*
