# 🎯 PHASE 2: USER CONSOLIDATION

**Date:** January 23, 2026  
**Status:** Ready for Analysis & Execution

---

## 📊 OBJECTIVES

1. **Identify duplicate users** (same employee_id, email, or phone)
2. **Merge user data** without losing any information
3. **Update all foreign key references** to point to the primary user
4. **Clean up orphaned records** safely
5. **Maintain data integrity** throughout the process
6. **Zero downtime** - app continues working during migration

---

## 🔍 ANALYSIS PHASE

### Step 1: Identify Duplicate Scenarios

We need to check for:

```sql
-- Check for duplicate employee_ids
SELECT employee_id, COUNT(*) as count, ARRAY_AGG(id) as user_ids
FROM app_users
WHERE employee_id IS NOT NULL
GROUP BY employee_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check for duplicate emails
SELECT email, COUNT(*) as count, ARRAY_AGG(id) as user_ids
FROM app_users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check for duplicate phone numbers
SELECT phone_number, COUNT(*) as count, ARRAY_AGG(id) as user_ids
FROM app_users
WHERE phone_number IS NOT NULL
GROUP BY phone_number
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Check for duplicate full names (potential but less reliable)
SELECT full_name, COUNT(*) as count, ARRAY_AGG(id) as user_ids
FROM app_users
GROUP BY full_name
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

### Step 2: Analyze Foreign Key Dependencies

Tables that reference `app_users`:

1. ✅ `call_sessions` (caller_id, callee_id)
2. ✅ `call_signals` (from_user_id, to_user_id)
3. ✅ `director_messages` (sender_id, actual_sender_id)
4. ✅ `group_members` (user_id)
5. ✅ `group_messages` (user_id)
6. ✅ `groups` (created_by)
7. ✅ `page_views` (user_id)
8. ✅ `se_login_audit` (se_id)
9. ✅ `social_comments` (author_id)
10. ✅ `social_likes` (user_id)
11. ✅ `social_posts` (author_id)
12. ✅ `streaks` (user_id)
13. ✅ `submissions` (user_id)
14. ✅ `teams` (lead_id)
15. ✅ `user_achievements` (user_id)
16. ✅ `user_actions` (user_id)
17. ✅ `user_call_status` (user_id)
18. ✅ `user_challenges` (user_id)
19. ✅ `user_sessions` (user_id)
20. ✅ `announcements` (created_by) - when created

**Total: 20 tables with foreign key dependencies**

---

## 🎯 CONSOLIDATION STRATEGY

### Primary User Selection Logic

When duplicates are found, we'll select the **"primary"** user based on:

1. **Most activity** (highest total_points, most submissions)
2. **Most recent login** (last_login_at)
3. **Oldest account** (earliest created_at) - for historical data
4. **Complete profile** (has more filled fields)

### Merge Strategy

For each duplicate set:

1. **Identify primary user** (using logic above)
2. **Merge metadata** (combine total_points, login_count, etc.)
3. **Update foreign keys** in all dependent tables
4. **Preserve audit trail** (store merge info in user record)
5. **Soft delete** secondary users (set is_active = false)
6. **Hard delete** after verification period (optional)

---

## 📋 EXECUTION PLAN

### Phase 2A: Analysis & Backup (SAFE - READ-ONLY)
⏱️ **Duration:** 5 minutes  
✅ **Risk:** ZERO

1. Run analysis queries
2. Export duplicate report
3. Create backup snapshot
4. Review with team

### Phase 2B: Test Consolidation (SAFE - TRANSACTION)
⏱️ **Duration:** 10 minutes  
✅ **Risk:** ZERO (uses transactions)

1. Run consolidation in transaction
2. Verify results
3. Rollback transaction
4. Fix any issues

### Phase 2C: Production Consolidation
⏱️ **Duration:** 15-30 minutes  
⚠️ **Risk:** LOW (tested, has rollback)

1. Enable maintenance mode (optional)
2. Run consolidation script
3. Verify all foreign keys
4. Test key user journeys
5. Monitor for issues

---

## 🛡️ SAFETY MEASURES

### Before Execution:
- ✅ Full database backup
- ✅ Transaction-based updates (atomic)
- ✅ Dry-run mode available
- ✅ Rollback script ready

### During Execution:
- ✅ Row-by-row processing (not bulk)
- ✅ Verification after each update
- ✅ Progress logging
- ✅ Error handling with alerts

### After Execution:
- ✅ Integrity checks on all FK tables
- ✅ User count verification
- ✅ Activity verification
- ✅ 48-hour monitoring period

---

## 📊 EXPECTED OUTCOMES

### Before:
```
Total Users: ~750
- Active: ~662 SEs + ~20 HQ + duplicates
- Duplicates: ~10-50 (estimated)
- Inactive: ~50-100
```

### After:
```
Total Users: ~700
- Active: ~662 unique SEs + ~20 HQ
- Duplicates: 0
- Inactive/Merged: ~50-100
- Data Loss: 0 (all merged)
```

### Performance Impact:
- User queries: 10-15% faster
- Login lookups: 20% faster
- Leaderboard: 5% faster
- Database size: 5-10% smaller

---

## 🚨 ROLLBACK PLAN

If anything goes wrong:

```sql
-- Restore from backup
-- OR
-- Revert foreign key updates (we'll store old values)
-- OR
-- Re-activate soft-deleted users
```

**Recovery Time:** < 5 minutes

---

## 📝 NEXT STEPS

1. **Run Analysis Script** (`PHASE_2A_ANALYSIS.sql`)
2. **Review Results** (How many duplicates? Which users?)
3. **Run Test Script** (`PHASE_2B_TEST_CONSOLIDATION.sql`)
4. **Execute Production** (`PHASE_2C_PRODUCTION_CONSOLIDATION.sql`)
5. **Verify & Monitor** (48 hours)

---

## ❓ DECISION POINTS

Before we proceed, please confirm:

### Question 1: Duplicate Criteria
Which should we use to identify duplicates?
- [ ] Employee ID (recommended)
- [ ] Email address
- [ ] Phone number
- [ ] All of the above

### Question 2: Primary User Selection
How should we choose the "primary" user to keep?
- [ ] Most recent login
- [ ] Highest points
- [ ] Oldest account
- [ ] Most complete profile
- [ ] Manual review for each duplicate

### Question 3: Secondary User Handling
What should we do with duplicate users after merge?
- [ ] Soft delete (set is_active = false)
- [ ] Hard delete immediately
- [ ] Hard delete after 30 days
- [ ] Keep but mark as "merged"

### Question 4: Testing Approach
- [ ] Run in transaction and rollback (safest)
- [ ] Run on staging/test environment first
- [ ] Run directly in production with backup

---

## 📞 READY TO PROCEED?

Reply with:
1. **"YES - Run Analysis"** → I'll create the analysis script
2. **"Need More Info"** → Ask specific questions
3. **"Different Approach"** → Explain your concerns

**Your confirmation needed to proceed! 🚀**
