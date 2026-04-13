# 🎯 START HERE - Quick Fix Guide

## Your Issues

1. ❌ "Table 'van_db' does not exist" error
2. ✅ Folders disappearing (ALREADY FIXED!)

---

## ⚡ Fix in 2 Minutes

### Step 1: Get Your Database Connection String

1. Open Supabase Dashboard
2. Settings → Database
3. Connection String → **URI** → **Transaction** mode
4. Copy the string (replace `[YOUR-PASSWORD]` with your real password)

Example:
```
postgresql://postgres.xxxxx:your-real-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 2: Add it as a Secret

1. Edge Functions → **server** → Settings
2. Secrets → **Add Secret**
3. Name: `SUPABASE_DB_URL`
4. Value: *paste your connection string*
5. **Save**

### Step 3: Restart Function

1. Edge Functions → server → 3 dots → **Restart function**
2. Wait 10 seconds

### Step 4: Test

1. Refresh your app
2. Programs → Create Program → Database Dropdown
3. Select "van_db"
4. ✅ **Should work!**

---

## 📖 Detailed Guides

- **Full Instructions:** `/ADD-DB-URL-SECRET.md`
- **Technical Details:** `/FINAL-FIX-APPLIED.md`
- **Quick Reference:** `/QUICK-ACTION-CARD.md`

---

## 🆘 Troubleshooting

**Still getting error?**
- Check console logs
- Should say: "Using direct Postgres connection"
- If not, secret isn't set correctly

**Connection string format:**
- Must start with `postgresql://`
- Port should be **6543** (Transaction mode)
- Make sure password is correct (no brackets!)

---

## ✅ What Was Fixed

### Backend Enhancement
- ✅ Added direct Postgres connection
- ✅ Bypasses PostgREST cache entirely
- ✅ Queries database directly for column information
- ✅ Falls back to PostgREST if needed

### Folder Persistence
- ✅ Dual-storage backup system
- ✅ Save verification
- ✅ Automatic recovery
- ✅ Already working!

---

**Time Required:** 2 minutes  
**Complexity:** Copy/paste a connection string  
**Result:** Everything works perfectly! ✨

**👉 Open `/ADD-DB-URL-SECRET.md` for step-by-step screenshots and detailed instructions.**

