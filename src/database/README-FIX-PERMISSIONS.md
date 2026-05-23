# 🚨 DATABASE PERMISSION ERROR FIX

## Problem
You're seeing this error:
```
permission denied for table kv_store_28f2f653
```

## Root Cause
**Row Level Security (RLS)** is enabled on the table but there are no policies allowing access.

Even though table permissions (GRANT) are correct, RLS acts as an additional security layer that blocks ALL access unless specific policies exist.

---

## ✅ SOLUTION 1: Disable RLS (RECOMMENDED FOR PROTOTYPING)

**Run this in Supabase SQL Editor:**

```sql
-- Disable RLS completely
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Ensure permissions
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;
GRANT ALL ON kv_store_28f2f653 TO service_role;
```

**Verify it worked:**
```sql
-- Check RLS status (should be false)
SELECT tablename, rowsecurity as "RLS Enabled?" 
FROM pg_tables 
WHERE tablename = 'kv_store_28f2f653';

-- Test as anon role
SET ROLE anon;
SELECT COUNT(*) FROM kv_store_28f2f653;
RESET ROLE;
```

---

## ✅ SOLUTION 2: Keep RLS but Add Permissive Policies

**If you want RLS enabled for security, run this:**

```sql
-- Enable RLS
ALTER TABLE kv_store_28f2f653 ENABLE ROW LEVEL SECURITY;

-- Allow anon role full access
CREATE POLICY "anon_all_access" ON kv_store_28f2f653
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow authenticated role full access
CREATE POLICY "authenticated_all_access" ON kv_store_28f2f653
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

---

## 📋 Step-by-Step Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Run the Fix
Copy and paste **SOLUTION 1** (or SOLUTION 2) into the SQL editor and click **RUN**.

### Step 3: Verify
The verification queries at the end should show:
- `RLS Enabled? = false` (for Solution 1)
- Policies listed (for Solution 2)
- SELECT test returns rows without errors

### Step 4: Test the App
1. Refresh your TAI app
2. Try to open a program
3. Should work! ✅

---

## 🔍 What Each File Does

### `/database/ULTIMATE-FIX-RLS.sql`
- **Disables RLS completely** (best for prototyping)
- Includes verification tests
- **Use this if you want the simplest fix**

### `/database/ALTERNATIVE-RLS-POLICIES.sql`
- **Keeps RLS enabled** but adds permissive policies
- More secure approach
- Use this if you need RLS for production

### `/database/FINAL-PERMISSIONS-FIX.sql`
- The original permissions fix we tried
- Only grants table-level permissions
- **Not enough if RLS is enabled**

---

## 🎯 Quick Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `42501` | Permission denied | RLS is blocking access |
| `42P01` | Table doesn't exist | Wrong table name |
| `42703` | Column doesn't exist | Wrong column name |

---

## 💡 Why This Happened

PostgreSQL has **two levels of access control:**

1. **Table Permissions (GRANT)** ✅ We fixed this
   - Controls who can access the table at all
   - We ran `GRANT ALL ON table TO anon`

2. **Row Level Security (RLS)** ❌ This was still blocking us
   - Controls which specific rows can be accessed
   - Even with table permissions, RLS blocks everything by default
   - Need to either DISABLE it or create POLICIES

Think of it like this:
- **Table permissions** = Can you enter the building?
- **RLS policies** = Which rooms can you enter?

We had the key to the building but no permission to enter any rooms!

---

## 🚀 After Running the Fix

Your app will be able to:
- ✅ Load programs from the database
- ✅ Submit program responses
- ✅ Upload photos
- ✅ Create submissions
- ✅ Use all database features

---

## 📞 Still Having Issues?

If you still see permission errors after running the fix:

1. **Check which solution you ran**
   - Did you run ULTIMATE-FIX-RLS.sql?
   
2. **Verify RLS status**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'kv_store_28f2f653';
   ```
   Should show `rowsecurity = false`

3. **Check for policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'kv_store_28f2f653';
   ```
   Should be empty (if RLS disabled) or show permissive policies

4. **Test direct access**
   ```sql
   SET ROLE anon;
   SELECT * FROM kv_store_28f2f653 LIMIT 1;
   RESET ROLE;
   ```
   Should return data without errors

---

## 🎓 Learn More

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
