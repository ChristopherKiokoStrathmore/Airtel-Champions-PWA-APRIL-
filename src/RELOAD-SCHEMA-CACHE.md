# 🔄 Reload PostgREST Schema Cache

## The Real Problem

Your permissions are correct ✅, but **PostgREST's schema cache** is stale. PostgREST (the REST API layer) caches database schema information, and it hasn't picked up the `van_db` table yet.

---

## ✅ Solution: Reload the Schema Cache

### Option 1: Restart PostgREST (Easiest - 30 seconds)

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **Airtel Champions** project
3. Go to **Settings** (bottom left)
4. Click **API** tab
5. Find the **"PostgREST Status"** section
6. Click **"Restart PostgREST"** button
7. Wait 10-20 seconds for it to restart
8. ✅ Done! Schema cache is now fresh

### Option 2: Use SQL to Reload (Alternative)

Run this in **SQL Editor**:

```sql
-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### Option 3: Wait (Automatic)

PostgREST automatically reloads its schema cache every 10 minutes. If you don't want to manually restart, just **wait 10 minutes** and try again.

---

## 🧪 Test After Reload

1. Go to your app
2. Programs Dashboard → Create Program
3. Add "Database Dropdown" field
4. Select table: **van_db**
5. ✅ Should now load columns successfully!

---

## 🔍 Why This Happened

**Timeline:**
1. You created the `van_db` table in Supabase ✅
2. PostgREST cached the schema (didn't include van_db) ❌
3. You granted permissions via SQL ✅
4. PostgREST still has old cache (no van_db) ❌
5. Backend tries to query → PostgREST says "table not in cache" ❌

**After restart:**
1. PostgREST reloads schema from database ✅
2. Finds `van_db` with correct permissions ✅
3. Backend can now query the table ✅

---

## 📋 Quick Summary

**Problem:** PostgREST schema cache is stale  
**Solution:** Restart PostgREST (Settings → API → Restart)  
**Time:** 30 seconds  
**Result:** `van_db` will be recognized ✅

---

## 🎯 After This Fix

You should see:
```
✅ [Database Dropdown] ✅ Found columns: 5
✅ Columns: id, number_plate, capacity, vendor, zone, etc.
```

Instead of:
```
❌ Table 'van_db' does not exist in the schema cache
```

---

## 🆘 If It STILL Doesn't Work

Then we need to switch the backend to use **raw SQL queries** instead of PostgREST. This bypasses the cache entirely. Let me know and I'll implement this.

