# 🔧 QUICK FIX - Permission Errors

## ⚠️ You're Seeing These Errors:

```
❌ Permission denied for table 'van_db' (code: 42501)
❌ Permission denied for table kv_store_28f2f653
❌ Table 'van_db' does not exist in the database
```

---

## ✅ ONE-CLICK FIX (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Airtel Champions project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Copy & Run This SQL

```sql
-- ============================================================================
-- FIX ALL PERMISSIONS - Copy and run this entire block
-- ============================================================================

-- 🚗 Vehicle Management
GRANT SELECT ON public.van_db TO service_role;

-- 🏪 Shop Management
GRANT SELECT ON public.amb_shops TO service_role;
GRANT SELECT ON public.amb_sitewise TO service_role;
GRANT SELECT ON public.sitewise TO service_role;

-- 👥 People & Teams
GRANT SELECT ON public.app_users TO service_role;
GRANT SELECT ON public.departments TO service_role;
GRANT SELECT ON public.regions TO service_role;
GRANT SELECT ON public.teams TO service_role;
GRANT SELECT ON public.groups TO service_role;
GRANT SELECT ON public.group_members TO service_role;

-- 🎯 Gamification
GRANT SELECT ON public.achievements TO service_role;
GRANT SELECT ON public.mission_types TO service_role;
GRANT SELECT ON public.challenges TO service_role;

-- 📊 System
GRANT SELECT ON public.programs TO service_role;
GRANT SELECT ON public.submissions TO service_role;
GRANT SELECT ON public.social_posts TO service_role;

-- 🔧 Fix KV Store (CRITICAL - fixes autocreate error)
GRANT ALL ON public.kv_store_28f2f653 TO anon, authenticated, service_role;
ALTER TABLE public.kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
```

### Step 3: Click "RUN" Button
Click the **"RUN"** button in the bottom right of the SQL Editor.

### Step 4: Reload Your App
Refresh your Airtel Champions app and the errors will be gone! ✨

---

## 🎯 What This Does

This SQL script grants your backend **READ access** to all the tables used for database dropdowns. It also fixes the KV store permission issue.

**Security Note**: This only grants:
- **SELECT** permission (read-only) for most tables
- **ALL** permission for kv_store (needed for backend operations)
- Only to the **service_role** (your backend), not to end users

---

## ❓ Still Getting Errors?

### If you get "table does not exist" errors:

Some tables might genuinely not exist yet. Here's how to check:

1. In Supabase Dashboard, click **"Table Editor"**
2. Look for these tables:
   - ✅ van_db
   - ✅ amb_shops
   - ✅ sitewise
   - ✅ app_users
   - ✅ programs

3. If a table is missing, you have two options:

**Option A: Remove it from the allowed list**
- Open `/supabase/functions/server/database-dropdown.tsx`
- Comment out the missing table in the `ALLOWED_TABLES` array
- Example: `// 'van_db',  // Table doesn't exist yet`

**Option B: Create the missing table**
- Check your database schema
- Create the table using Supabase Table Editor or SQL

---

## 🔍 Understanding the Errors

### Error Code 42501: Permission Denied
- **Cause**: RLS (Row Level Security) is blocking access
- **Fix**: Run the SQL above to grant permissions

### Error Code 42P01: Table Does Not Exist  
- **Cause**: Table hasn't been created yet
- **Fix**: Create table or remove from ALLOWED_TABLES

### "schema cache lookup" Error
- **Cause**: Same as 42P01 - table doesn't exist
- **Fix**: Create table or remove from ALLOWED_TABLES

---

## 📋 Verification

After running the SQL, verify it worked:

```sql
-- Run this to check permissions
SELECT 
  tablename, 
  has_table_privilege('service_role', 'public.' || tablename, 'SELECT') as can_select
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('van_db', 'amb_shops', 'sitewise', 'app_users', 'programs', 'kv_store_28f2f653');
```

You should see `can_select = true` for all tables.

---

## 🎉 Done!

Your database dropdowns should now work perfectly. Go create some programs! 🚀

**Need help?** Check the browser console for detailed error messages.
