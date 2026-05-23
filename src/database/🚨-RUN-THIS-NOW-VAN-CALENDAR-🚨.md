# 🚨 FIX VAN CALENDAR - RUN THIS NOW 🚨

## ❌ Current Error

```
Could not find the table 'public.van_db' in the schema cache
Van not found. ID: 15
```

**Root Cause:** The `van_db` and `van_calendar_plans` tables don't exist in your Supabase database.

---

## ✅ How to Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to **https://supabase.com/dashboard**
2. Select your project: **xspogpfohjmkykfjadhk**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy & Paste the SQL Script

1. Open this file: `/database/VAN_CALENDAR_COMPLETE_SETUP.sql`
2. **Copy the ENTIRE contents** (all ~210 lines)
3. **Paste** into the Supabase SQL Editor
4. Click **RUN** (bottom right corner)

### Step 3: Verify Success

You should see output like:

```
✅ van_db table created | total_vans: 19 | min_id: 1 | max_id: 19

zone          | van_count | vans
--------------|-----------|------------------
CENTRAL       | 3         | KDR 124L, KDR 165K, KDT 071V
COAST         | 3         | KDD 725H, KDR 127L, KDR 165L
...

✅ van_calendar_plans table created | total_plans: 0
```

---

## 🎯 What This Creates

### Table 1: `van_db`
- ✅ 19 vans across 8 zones
- ✅ Auto-incrementing IDs (1-19)
- ✅ Unique number plates
- ✅ Zone assignments

### Table 2: `van_calendar_plans`
- ✅ Stores weekly van schedules
- ✅ Links to vans via foreign key
- ✅ Tracks ZSM assignments
- ✅ Supports compliance tracking

---

## 🔒 Security Included

Both tables have:
- ✅ Row Level Security (RLS) enabled
- ✅ Anonymous read access
- ✅ Service role full access
- ✅ Performance indexes

---

## ⚡ After Running the SQL

1. **Refresh your app** - Van Calendar will now work
2. **Van dropdown** will show all 19 vans
3. **Site selection** will work (4,530 sites loaded)
4. **Form submission** will save to database

---

## 🐛 If You Get Errors

### Error: "relation already exists"
✅ **This is OK!** The script uses `DROP TABLE IF EXISTS` and `ON CONFLICT DO NOTHING`, so it's safe to run multiple times.

### Error: "permission denied"
❌ **You need to be the database owner.** Make sure you're logged into Supabase with the correct account.

### Error: "function gen_random_uuid() does not exist"
✅ **Run this first:**
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 📊 Quick Database Check

After running, verify the setup with:

```sql
-- Check van_db
SELECT COUNT(*) as total_vans FROM van_db;

-- Check van_calendar_plans  
SELECT COUNT(*) as total_plans FROM van_calendar_plans;

-- Show all vans
SELECT id, number_plate, zone FROM van_db ORDER BY id;
```

---

## ✅ Done!

Once you see the success messages, the Van Calendar feature is **fully operational**.

**File to run:** `/database/VAN_CALENDAR_COMPLETE_SETUP.sql`

🎉 **Copy it, paste it, run it - that's all!**
