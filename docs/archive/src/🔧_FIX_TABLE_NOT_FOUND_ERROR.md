# 🔧 FIX "Table Not Found" Error

## The Error You're Seeing

```
Could not find the table 'public.programs' in the schema cache
Hint: Perhaps you meant the table 'public.profiles'
```

**This means:** The `programs` table doesn't actually exist in your Supabase database!

---

## Why This Happened

The previous SQL (`COMPLETE-PROGRAMS-FIX.sql`) might have:
1. Not run completely
2. Created tables in wrong schema
3. Hit an error midway
4. Not refreshed Supabase's schema cache

---

## The Fix (2 Minutes)

### Step 1: Check What Exists

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   ```

2. **Copy and paste this file:**
   ```
   /database/CHECK-WHAT-EXISTS.sql
   ```

3. **Click RUN**

4. **Look at the output:**
   - If you see **"❌ DOES NOT EXIST"** for programs → Proceed to Step 2
   - If you see **"✅ EXISTS"** → Skip to Step 3

---

### Step 2: Create the Tables

1. **Still in Supabase SQL Editor**

2. **Copy and paste this file:**
   ```
   /database/FORCE-CREATE-TABLES-NOW.sql
   ```

3. **Click RUN**

4. **Wait for completion** (10-15 seconds)

5. **Check output - you should see:**
   ```
   ✅ PROGRAMS       | 1 | ✅ RLS OFF
   ✅ PROGRAM_FIELDS | 4 | ✅ RLS OFF
   ✅ SUBMISSIONS    | 0 | ✅ RLS OFF
   🎉 TABLES CREATED SUCCESSFULLY!
   ```

6. **If you see this** → Success! ✅

---

### Step 3: Refresh Schema Cache

**IMPORTANT:** Supabase needs to reload its schema cache.

**Option A: Use SQL (Recommended)**
```sql
NOTIFY pgrst, 'reload schema';
```

**Option B: Use Dashboard**
1. Go to Supabase Dashboard
2. Click "Database" → "Tables"
3. You should now see:
   - ✅ programs
   - ✅ program_fields
   - ✅ submissions

**Option C: Wait 1 minute**
- Supabase auto-refreshes every ~60 seconds

---

### Step 4: Test Your App

1. **Refresh your TAI app** (Ctrl+R / Cmd+R)

2. **Hard refresh if needed** (Ctrl+Shift+R / Cmd+Shift+R)

3. **Navigate to Programs tab**

4. **You should see:**
   - ✅ "Competitor Intelligence" program (sample)
   - ✅ Any other programs you created

5. **Click on a program**

6. **Modal should open with:**
   - ✅ Program title and description
   - ✅ Form fields (Competitor Name, Activity Type, etc.)
   - ✅ Photo upload section
   - ✅ Submit button

7. **Fill and submit**
   - ✅ Should save successfully
   - ✅ No "table not found" error

---

## Verification Checklist

After running `FORCE-CREATE-TABLES-NOW.sql`:

### In Supabase Dashboard:

- [ ] Go to Database → Tables
- [ ] See `programs` table (1 row)
- [ ] See `program_fields` table (4 rows)
- [ ] See `submissions` table (0 rows)
- [ ] Click on `programs` → See "Competitor Intelligence"
- [ ] Click on `program_fields` → See 4 fields linked to that program

### In Your App:

- [ ] Refresh app
- [ ] Navigate to Programs
- [ ] See "Competitor Intelligence" program
- [ ] Click on it
- [ ] Form loads with 4 fields
- [ ] Can fill and submit
- [ ] No errors in console

**If ALL checkboxes pass:** ✅ **FIXED!**

---

## What the Fix Does

### FORCE-CREATE-TABLES-NOW.sql:

1. **Drops existing tables** (if any) → Clean slate
2. **Creates programs table** → Stores program metadata
3. **Creates program_fields table** → Stores form field definitions
4. **Creates submissions table** → Stores user responses
5. **Disables RLS** → No permission issues
6. **Grants permissions** → anon/authenticated/service_role can all access
7. **Creates indexes** → Fast queries
8. **Inserts sample data** → 1 program with 4 fields for testing
9. **Refreshes schema cache** → Supabase recognizes the tables
10. **Verifies success** → Shows confirmation output

---

## Common Issues

### Issue 1: "Permission denied to create table"

**Cause:** You're not logged in as owner/admin

**Fix:** 
- Make sure you're in the Supabase SQL Editor (not a different SQL client)
- You should be automatically authenticated as project owner

---

### Issue 2: SQL runs but tables still not visible

**Cause:** Schema cache not refreshed

**Fix:**
```sql
-- Run this in SQL Editor
NOTIFY pgrst, 'reload schema';

-- Wait 10 seconds, then check:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'program%';
```

**Should show:**
- programs
- program_fields

---

### Issue 3: "relation already exists"

**Cause:** Tables partially created before

**Fix:** The SQL handles this with `DROP TABLE IF EXISTS` at the start

If it still fails:
```sql
-- Force drop
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.program_fields CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;

-- Then run FORCE-CREATE-TABLES-NOW.sql again
```

---

### Issue 4: App still shows error after creating tables

**Possible causes:**

1. **Browser cache**
   - Fix: Hard refresh (Ctrl+Shift+R)

2. **Schema cache not refreshed**
   - Fix: Run `NOTIFY pgrst, 'reload schema';`
   - Or wait 1 minute

3. **Wrong project**
   - Fix: Check you're using the correct Supabase project URL

4. **Code not updated**
   - Fix: Make sure `/utils/supabase-direct.ts` has the latest changes
   - Check it says `await supabase.from('programs')` not `kvStore.get()`

---

## Understanding the Tables

### programs table
```
Stores program metadata:
- id: UUID (unique identifier)
- title: "Competitor Intelligence"
- description: "Report competitor activity..."
- points_value: 100
- target_roles: ['sales_executive', ...]
- status: 'active'
```

### program_fields table
```
Stores form field definitions:
- id: UUID
- program_id: Links to programs table
- field_name: 'competitor_name'
- field_label: 'Competitor Name'
- field_type: 'text' | 'select' | 'textarea' | etc.
- is_required: true/false
- order_index: 0, 1, 2, ... (display order)
```

### submissions table
```
Stores user responses:
- id: UUID
- program_id: Which program
- user_id: Who submitted
- responses: { "competitor_name": "Safaricom", ... }
- status: 'pending' | 'approved' | 'rejected'
- points_awarded: 0 (until approved)
- submitted_at: timestamp
```

---

## Next Steps After Fix

### 1. Test the Sample Program

- Navigate to Programs
- Click "Competitor Intelligence"
- Fill in:
  - Competitor Name: "Safaricom"
  - Activity Type: "Promotion"
  - Description: "50% off data bundles"
  - Location: "Nairobi CBD"
- Submit
- Check `submissions` table → Should have 1 row

### 2. Create Your Own Program

- Click "Create Program" (as Director/HQ)
- Fill details
- Add custom fields
- Save
- Should appear in programs list

### 3. Verify End-to-End Flow

- Create as Director ✅
- View as SE ✅
- Submit as SE ✅
- Data saves ✅

---

## GPS Warning (Can Ignore)

You'll also see this in console:
```
[GPS] ⚠️ Location unavailable (user denied or not supported): 
Geolocation has been disabled in this document by permissions policy.
```

**This is normal!** It's just a browser security policy. GPS is optional for submissions.

**To enable GPS (optional):**
- App needs to be served over HTTPS
- Or run on localhost
- User needs to grant location permission

**For now:** Ignore this warning. Submissions work without GPS.

---

## Success Criteria

After running `FORCE-CREATE-TABLES-NOW.sql` and refreshing app:

✅ No "table not found" errors  
✅ Programs list loads  
✅ Can click on programs  
✅ Form fields appear  
✅ Can fill and submit  
✅ Submissions save to database  
✅ Can create new programs  

**When all these work:** 🎉 **Your app is fully functional!**

---

## Quick Reference

**To check what exists:**
```bash
File: /database/CHECK-WHAT-EXISTS.sql
```

**To create tables:**
```bash
File: /database/FORCE-CREATE-TABLES-NOW.sql
```

**To verify tables exist:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'program%';
```

**To refresh schema cache:**
```sql
NOTIFY pgrst, 'reload schema';
```

---

*Run CHECK-WHAT-EXISTS.sql first, then FORCE-CREATE-TABLES-NOW.sql, then test your app!*
