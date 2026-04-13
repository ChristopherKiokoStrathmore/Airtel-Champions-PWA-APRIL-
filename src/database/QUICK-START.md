# 🚀 TAI Database Quick Start - FIX PERMISSION ERRORS

## ❌ Error You're Seeing

```
permission denied for table kv_store_28f2f653
Could not find the table 'public.programs' in the schema cache
```

## ✅ One-Click Fix

### **Step 1: Open Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Copy & Run the Fix**
1. Open `/database/ONE-CLICK-FIX.sql` in this project
2. Copy the **ENTIRE** file contents
3. Paste into Supabase SQL Editor
4. Click **RUN** (or press Ctrl+Enter)

### **Step 3: Verify Success**
You should see output like this:
```
✅ VERIFICATION RESULTS
table_name          | rls_status
--------------------|------------------------
kv_store_28f2f653  | ✅ RLS DISABLED (GOOD)
programs           | ✅ RLS DISABLED (GOOD)
users              | ✅ RLS DISABLED (GOOD)
submissions        | ✅ RLS DISABLED (GOOD)

✅ TEST: anon can access kv_store | row_count: 0
✅ TEST: anon can access programs  | row_count: 0
✅ TEST: anon can access users     | row_count: 1
✅ TEST: anon can access submissions | row_count: 0
```

### **Step 4: Refresh Your App**
- Close and reopen the TAI app
- All permission errors should be gone ✅

---

## 📋 What the Fix Does

### **1. Creates Missing Tables**
- `kv_store_28f2f653` - Main data storage (key-value pairs)
- `programs` - Program definitions (KV store is primary, this is fallback)
- `users` - User profiles and points
- `submissions` - Program submissions

### **2. Fixes Permissions**
- Disables Row Level Security (RLS) - not needed for prototype
- Grants ALL permissions to:
  - `anon` role (public access)
  - `authenticated` role (logged-in users)
  - `service_role` role (backend server)
  - `postgres` role (admin)

### **3. Creates Storage Bucket**
- `make-28f2f653-uploads` - For images and attachments
- Permissive policies (allow all uploads/downloads/deletes)

### **4. Adds Sample Data**
- Creates test user if database is empty
- Ensures app has data to work with

---

## 🔍 Troubleshooting

### **Problem: Still getting permission errors**
**Solution:**
1. Make sure you ran the **ENTIRE** ONE-CLICK-FIX.sql file
2. Check Supabase SQL Editor for error messages
3. Try running this simple test:
   ```sql
   SELECT * FROM kv_store_28f2f653 LIMIT 1;
   ```
   If it fails, RLS is still enabled. Run ONE-CLICK-FIX.sql again.

### **Problem: "table does not exist"**
**Solution:**
1. Check which table is missing with:
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename LIKE '%28f2f653%' OR tablename IN ('programs', 'users', 'submissions');
   ```
2. Run ONE-CLICK-FIX.sql again (it has CREATE IF NOT EXISTS, so it's safe)

### **Problem: "relation does not exist"**
**Solution:**
1. You might have run only part of the fix
2. Open SQL Editor
3. Run this to see what exists:
   ```sql
   \dt
   ```
4. Run ONE-CLICK-FIX.sql in full

### **Problem: Storage upload errors**
**Solution:**
1. Run this in SQL Editor:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'make-28f2f653-uploads';
   ```
2. If empty, run ONE-CLICK-FIX.sql again

---

## 🎯 Expected Results After Fix

### **App Behavior:**
- ✅ No permission errors in console
- ✅ Programs load successfully
- ✅ User data appears
- ✅ Leaderboard shows rankings
- ✅ Submissions save properly
- ✅ Image uploads work
- ✅ Social posts create/view/like/comment

### **Database State:**
- ✅ All 4 tables exist
- ✅ RLS disabled on all tables
- ✅ Storage bucket created
- ✅ Sample user exists (if database was empty)

---

## 📞 Still Stuck?

1. **Check Supabase Project URL and Keys:**
   - File: `/utils/supabase/info.tsx`
   - Make sure `projectId` and `publicAnonKey` match your Supabase project

2. **Verify Connection:**
   ```sql
   SELECT current_user, current_database();
   ```
   Should show your username and database name

3. **Check Table Ownership:**
   ```sql
   SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'kv_store_28f2f653';
   ```
   Should show `postgres` as owner

4. **Manual Permission Reset:**
   If nothing works, run this:
   ```sql
   ALTER TABLE kv_store_28f2f653 OWNER TO postgres;
   ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
   GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;
   ```

---

## ✅ Final Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied entire ONE-CLICK-FIX.sql file
- [ ] Pasted and ran in SQL Editor
- [ ] Saw ✅ success messages
- [ ] Refreshed TAI app
- [ ] No more permission errors
- [ ] App loads data successfully

**You're all set! The TAI app should now work perfectly.** 🚀

---

## 📚 Why This Approach?

**For a prototype/MVP:**
- RLS adds complexity without benefit (single org, trusted users)
- All users are Airtel staff (authenticated via login)
- Focus on speed and functionality
- Can add RLS later for production if needed

**The app uses localStorage for auth** (not Supabase Auth), so RLS role-based policies don't apply. This is why we disable RLS entirely.

**Production Considerations (Future):**
- Enable RLS after implementing Supabase Auth
- Add role-based policies (SE can only see own data, etc.)
- Restrict storage uploads by user
- Add audit logging

For now: **Speed > Security** ✅
