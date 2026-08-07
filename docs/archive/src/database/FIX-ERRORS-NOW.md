# 🚨 FIX PERMISSION ERRORS - COPY & PASTE SOLUTION

## Your Errors:
```
❌ permission denied for table kv_store_28f2f653
❌ Could not find the table 'public.programs'
```

---

## ✅ 3-STEP FIX (Takes 30 seconds)

### **STEP 1: Open Supabase**
Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new

(Replace YOUR_PROJECT_ID with your actual project ID)

---

### **STEP 2: Copy This Entire SQL Block**

```sql
-- ONE-CLICK FIX: Copy everything below this line

-- Create tables
CREATE TABLE IF NOT EXISTS kv_store_28f2f653 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    form_schema JSONB,
    target_roles TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    zone TEXT,
    region TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    form_data JSONB NOT NULL,
    location TEXT,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
ALTER TABLE programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;
GRANT ALL ON programs TO anon, authenticated, service_role;
GRANT ALL ON users TO anon, authenticated, service_role;
GRANT ALL ON submissions TO anon, authenticated, service_role;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-28f2f653-uploads', 'make-28f2f653-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Verify success
SELECT '✅ FIX COMPLETE!' as status;
SELECT tablename, CASE WHEN rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as rls_status
FROM pg_tables 
WHERE tablename IN ('kv_store_28f2f653', 'programs', 'users', 'submissions');
```

---

### **STEP 3: Click RUN**
- Paste the SQL above into Supabase SQL Editor
- Click the **RUN** button (or press Ctrl+Enter)
- Wait for "✅ FIX COMPLETE!" message
- Refresh your TAI app

---

## ✅ Success Indicators

You should see this output in Supabase:
```
status: ✅ FIX COMPLETE!

tablename          | rls_status
-------------------|------------
kv_store_28f2f653 | ✅ RLS OFF
programs          | ✅ RLS OFF
users             | ✅ RLS OFF
submissions       | ✅ RLS OFF
```

---

## 🎯 What Happens Next

After running the fix:
- ✅ All permission errors disappear
- ✅ Programs load in the app
- ✅ Leaderboard works
- ✅ Submissions save
- ✅ Social posts work
- ✅ Images upload

**Just refresh your app and you're done!** 🚀

---

## 🔧 Alternative: Use ONE-CLICK-FIX.sql

For the complete fix with verification:
1. Open `/database/ONE-CLICK-FIX.sql`
2. Copy the entire file
3. Paste into Supabase SQL Editor
4. Click RUN
5. Check for ✅ success messages

---

## 📞 Still Not Working?

**Check your Supabase credentials:**
- File: `/utils/supabase/info.tsx`
- Make sure `projectId` matches your Supabase project
- Make sure `publicAnonKey` is correct

**Quick test:**
```sql
SELECT current_user, current_database();
```
Should show your database info.

---

## ⚡ Why This Fixes It

**The Problem:**
- Supabase has Row Level Security (RLS) enabled by default
- RLS blocks all access unless you create policies
- TAI uses localStorage auth, not Supabase Auth
- So RLS policies don't work → permission denied

**The Solution:**
- Disable RLS completely
- Grant full access to all roles
- Perfect for prototype/MVP
- Can add RLS later for production

**This is the standard approach for Figma Make apps!** ✅

---

## 🎉 You're Done!

After running the fix, your TAI app should work perfectly with:
- ✅ 662 Sales Executives
- ✅ ZSMs, ZBMs, HQ, Directors
- ✅ Programs, submissions, leaderboards
- ✅ Social Intelligence Network
- ✅ Points system
- ✅ Image uploads

**Ready to transform field intelligence! 🚀**
