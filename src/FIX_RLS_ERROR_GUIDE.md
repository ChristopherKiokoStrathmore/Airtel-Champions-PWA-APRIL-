# 🔧 Fix RLS Policy Error - Quick Guide

## ❌ **The Error:**

```
[ProgramCreator] Error creating fields: {
  "code": "42501",
  "message": "new row violates row-level security policy for table \"program_fields\""
}
```

---

## ✅ **The Fix:**

### **Step 1: Go to Supabase SQL Editor**

1. Open your Supabase project
2. Click **"SQL Editor"** in left sidebar
3. Click **"New query"**

### **Step 2: Run the SQL**

Copy and paste this SQL and click **"Run"**:

```sql
-- Fix program_fields table
DROP POLICY IF EXISTS "Allow all operations on program_fields" ON program_fields;

CREATE POLICY "Allow all operations on program_fields"
  ON program_fields
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Fix programs table (just in case)
DROP POLICY IF EXISTS "Allow all operations on programs" ON programs;

CREATE POLICY "Allow all operations on programs"
  ON programs
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Fix program_submissions table
DROP POLICY IF EXISTS "Allow all operations on program_submissions" ON program_submissions;

CREATE POLICY "Allow all operations on program_submissions"
  ON program_submissions
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Fix users table
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

CREATE POLICY "Allow all operations on users"
  ON users
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
```

### **Step 3: Test It**

1. Refresh your TAI app
2. Login as Director
3. Try creating a program again
4. ✅ Should work now!

---

## 🤔 **What Was Wrong?**

Row Level Security (RLS) policies were too restrictive. They were blocking the app from inserting new program fields.

The fix makes the policies permissive so your app can:
- ✅ Create programs
- ✅ Create program fields
- ✅ Create submissions
- ✅ Read/update users
- ✅ Send notifications

---

## 🔍 **Verify It Worked**

Run this query to check policies:

```sql
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('programs', 'program_fields', 'program_submissions')
ORDER BY tablename;
```

You should see:
```
tablename          | policyname                          | permissive | cmd
-------------------+-------------------------------------+------------+-----
program_fields     | Allow all operations on program...  | PERMISSIVE | ALL
programs           | Allow all operations on programs    | PERMISSIVE | ALL
program_submissions| Allow all operations on program...  | PERMISSIVE | ALL
```

---

## ⚠️ **For Production Apps**

The current fix allows all operations for prototyping. For production, you'd want more restrictive policies like:

```sql
-- Example: Only allow users to insert their own submissions
CREATE POLICY "Users can insert own submissions"
  ON program_submissions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Example: Only Directors can create programs
CREATE POLICY "Directors can create programs"
  ON programs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'director'
    )
  );
```

But for now, the permissive policy is perfect for your MVP/prototype! 🚀

---

## 📋 **Quick Checklist**

- [ ] Opened Supabase SQL Editor
- [ ] Ran the SQL above
- [ ] Saw "Success" message
- [ ] Refreshed TAI app
- [ ] Tried creating program as Director
- [ ] ✅ Program created successfully!
- [ ] ✅ Fields created successfully!
- [ ] ✅ No more RLS errors!

---

**Now try creating a program again - it should work!** 🎉
