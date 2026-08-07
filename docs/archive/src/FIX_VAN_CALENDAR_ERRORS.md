# Fix Van Calendar Errors

## 🔴 Errors You're Seeing

```
❌ Could not find the table 'public.van_db' in the schema cache
❌ Van not found. ID: 15  
❌ POST /van-calendar/create 404 (Not Found) - FIXED ✅
```

---

## ✅ Fixes Applied

### Fix #1: Wrong Supabase Project ID ✅ DONE

**File:** `/utils/supabase/info.tsx`

Changed from:
```tsx
export const projectId = "mcbbtrrhqweypfnlzwht" // ❌ WRONG
```

To:
```tsx
export const projectId = "xspogpfohjmkykfjadhk" // ✅ CORRECT
```

This fixed the 404 errors - the app was calling the wrong Supabase project.

---

### Fix #2: Duplicate Site Validation ✅ DONE

**File:** `/components/van-calendar-form.tsx`

Added validation to prevent selecting the same site multiple times:
- ✅ Checks all sites across the entire week
- ✅ Shows clear error message with site names
- ✅ Prevents form submission if duplicates found

---

### Fix #3: Missing Database Tables ⚠️ MANUAL STEP REQUIRED

**Problem:** The `van_db` and `van_calendar_plans` tables don't exist in your database.

**Solution:** Run the SQL setup script manually in Supabase.

---

## 🚀 What You Need to Do Now

### ⚡ Run This SQL Script (5 minutes)

1. **Open:** `/database/VAN_CALENDAR_COMPLETE_SETUP.sql`
2. **Copy:** All contents (entire file)
3. **Go to:** Supabase Dashboard → SQL Editor
4. **Paste & Run:** The SQL script
5. **Done!** Van Calendar will work

**Detailed Instructions:** See `/database/🚨-RUN-THIS-NOW-VAN-CALENDAR-🚨.md`

---

## 📋 What the SQL Creates

### Table 1: van_db
- 19 vans across 8 zones
- IDs 1-19 (van ID 15 is `KDR 166K`)
- Number plates, capacity, zones

### Table 2: van_calendar_plans
- Stores weekly van schedules
- Links to vans via foreign key
- Tracks ZSM assignments

---

## ✅ After Running SQL

The Van Calendar will:
1. ✅ Show van dropdown with 19 vans
2. ✅ Load 4,530 sites from sitewise table
3. ✅ Accept form submissions
4. ✅ Save weekly plans to database
5. ✅ Prevent duplicate site selections

---

## 🎯 Summary

| Issue | Status | Action |
|-------|--------|--------|
| Wrong project ID | ✅ Fixed | Auto-applied |
| Duplicate sites | ✅ Fixed | Auto-applied |
| Missing tables | ⚠️ Pending | **Run SQL script** |

**Next step:** Run `/database/VAN_CALENDAR_COMPLETE_SETUP.sql` in Supabase SQL Editor.
