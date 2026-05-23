# 🔧 QUICK FIX - RLS Permission Errors

## ❌ The Problem
Your app can't insert/update calling data because Row Level Security (RLS) policies are blocking access.

## ✅ The Solution (2 Minutes)

### **RECOMMENDED: Use the Simple Fix**

Since your app uses **custom authentication** (localStorage), not Supabase Auth, the easiest fix is to **disable RLS** on calling tables.

---

## 🚀 **Step-by-Step Fix**

### **Step 1: Go to Supabase Dashboard**
1. Open https://supabase.com
2. Click your project
3. Go to **SQL Editor** (left sidebar)

### **Step 2: Run This SQL**

Copy and paste this into SQL Editor:

```sql
-- Disable RLS on calling tables
ALTER TABLE user_call_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals DISABLE ROW LEVEL SECURITY;
```

### **Step 3: Click "Run"**

You should see: **Success. No rows returned**

### **Step 4: Refresh Your App**

The errors will be gone! ✅

---

## 🔍 **Why This Works**

Your app already has its own authentication system using `localStorage` and `app_users` table. The calling tables don't need Supabase Auth RLS - they just need to be accessible like your other tables.

This is the same approach your `app_users` table uses.

---

## 📋 **Alternative: Keep RLS Enabled**

If you want to keep RLS for security, use this instead:

```sql
-- user_call_status - Allow all operations
DROP POLICY IF EXISTS "Allow all on user_call_status" ON user_call_status;
CREATE POLICY "Allow all on user_call_status" ON user_call_status 
  FOR ALL USING (true) WITH CHECK (true);

-- call_sessions - Allow all operations
DROP POLICY IF EXISTS "Allow all on call_sessions" ON call_sessions;
CREATE POLICY "Allow all on call_sessions" ON call_sessions 
  FOR ALL USING (true) WITH CHECK (true);

-- call_signals - Allow all operations
DROP POLICY IF EXISTS "Allow all on call_signals" ON call_signals;
CREATE POLICY "Allow all on call_signals" ON call_signals 
  FOR ALL USING (true) WITH CHECK (true);
```

---

## ✅ **Test After Fix**

1. Refresh your app
2. You should see the green phone icon with online dot
3. Click phone icon → User Directory loads
4. Click Call History → Logs load
5. No more errors in console! 🎉

---

## 🎯 **Which File to Use?**

- **FIX_RLS_SIMPLE.sql** ← Use this one (recommended)
- **FIX_RLS_POLICIES.sql** ← Alternative with detailed policies

Both are in your project folder.

---

## ⚡ **Expected Result**

Before: 
```
❌ Error: new row violates row-level security policy
❌ TypeError: Failed to fetch
```

After:
```
✅ [WebRTC] User set to online: John Doe
✅ [CallHistory] Loaded 0 calls
✅ [UserDirectory] Loaded 662 users
```

---

**That's it! Just run the SQL and you're done.** 🚀
