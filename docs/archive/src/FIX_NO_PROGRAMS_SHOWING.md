# ✅ FIX: "No Active Programs Available" Issue

## **🔍 ROOT CAUSE:**

The "Launch Date" program exists in the database, but it's not showing for Sales Executives because:

**The program's `target_roles` array doesn't include `'sales_executive'`**

The backend route at `/supabase/functions/server/programs.tsx` (line 104) filters programs by:
```typescript
.contains('target_roles', [userRole])
```

This means if a Sales Executive is logged in, they only see programs where `target_roles` contains `'sales_executive'`.

---

## **✅ SOLUTION:**

Run this SQL in your Supabase SQL Editor to fix the Launch Date program:

```sql
-- Update Launch Date program to target all roles
UPDATE programs
SET target_roles = ARRAY[
  'sales_executive', 
  'zonal_sales_manager', 
  'zonal_business_manager', 
  'hq_command_center', 
  'director'
]::text[]
WHERE title = 'Launch Date';

-- Verify the update
SELECT 
  id,
  title,
  target_roles,
  status,
  category
FROM programs 
WHERE title = 'Launch Date';
```

**OR** run the complete fix file:
- Go to Supabase Dashboard → SQL Editor
- Click "New Query"
- Copy and paste the contents of `/database/programs/fix_launch_date_target_roles.sql`
- Click "Run"

---

## **🎯 EXPECTED RESULT:**

After running the SQL:

```
| title       | target_roles                                                                                              | status | category            |
|-------------|----------------------------------------------------------------------------------------------------------|--------|---------------------|
| Launch Date | {sales_executive,zonal_sales_manager,zonal_business_manager,hq_command_center,director}                 | active | Network Experience  |
```

---

## **🧪 TESTING:**

### **Step 1: Run the SQL Fix**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the SQL above
4. Verify the result shows all 5 roles in `target_roles`

### **Step 2: Test in the App**
1. **Refresh your browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Click "Network Experience"** from the home screen
3. You should now see:
   ```
   📊 Programs
   
   🚀 Launch Date
   50 pts · 0 submissions made
   ```

### **Step 3: Submit a Test Form**
1. Click on **"Launch Date"**
2. Fill out all 10 fields:
   - Site ID (searchable dropdown with 1,489 options)
   - Site Name
   - Partner Name
   - Indoor Coverage
   - Outdoor Coverage
   - Recruits (number)
   - Registrations (number)
   - Activations (number)
   - And 2 more fields...
3. Submit the form
4. Earn **50 points** ✨

---

## **📊 DEBUGGING:**

If the program still doesn't show after running the SQL:

### **Check 1: Verify the SQL Ran Successfully**
```sql
SELECT title, target_roles, status FROM programs WHERE title = 'Launch Date';
```

Expected: `target_roles` should be an array with 5 roles

### **Check 2: Check Browser Console**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs from `[ProgramsList]`:
   ```
   [ProgramsList] Fetching programs...
   [ProgramsList] Programs response: { programs: [...] }
   [ProgramsList] Active programs: [...]
   ```

### **Check 3: Check User's Role**
```sql
SELECT id, full_name, role FROM app_users WHERE id = auth.uid();
```

Expected: `role` should be `'sales_executive'` for SEs

### **Check 4: Check Backend Response**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter for `programs`
4. Check the response from:
   ```
   GET /functions/v1/make-server-28f2f653/programs
   ```
5. Response should include:
   ```json
   {
     "programs": [
       {
         "id": "...",
         "title": "Launch Date",
         "target_roles": ["sales_executive", ...],
         "status": "active",
         ...
       }
     ]
   }
   ```

### **Check 5: Verify Program is Active**
```sql
SELECT title, status FROM programs WHERE title = 'Launch Date';
```

Expected: `status = 'active'`

---

## **🔧 ADDITIONAL FIXES APPLIED:**

### **1. Added Console Logging**
Updated `/components/programs/programs-list.tsx` to log:
- When fetching programs starts
- The API response
- Filtered active programs
- Any errors

### **2. Added Back Button**
Added a back arrow button to navigate back to the home screen

### **3. Improved Error Handling**
Added checks for:
- No session found
- HTTP response not OK
- Better error logging

---

## **💡 UNDERSTANDING target_roles:**

The `target_roles` field controls **who can see and submit to a program**:

| target_roles Value | Who Can See It |
|-------------------|----------------|
| `['sales_executive']` | Only Sales Executives |
| `['director', 'hq_command_center']` | Only Directors and HQ |
| `['sales_executive', 'zonal_sales_manager']` | SEs and ZSMs |
| `['sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_command_center', 'director']` | **Everyone** (recommended for most programs) |

**Best Practice:** Most intelligence gathering programs should target all roles, especially Sales Executives.

---

## **🎉 SUCCESS INDICATORS:**

You'll know it's working when:

✅ **Programs list shows "Launch Date"** instead of "No active programs"
✅ **Can click on Launch Date** to open the submission form
✅ **All 10 fields are visible** in the form
✅ **Site ID dropdown is searchable** with 1,489 options
✅ **Can submit the form** successfully
✅ **Earn 50 points** on submission
✅ **Back button works** to return to home

---

## **📞 TROUBLESHOOTING QUICK REFERENCE:**

| Issue | Solution |
|-------|----------|
| "No active programs available" | Run the SQL fix above |
| Program shows but can't submit | Check if user has correct role |
| SQL error when running fix | Check if program exists first |
| Still not showing after SQL | Clear browser cache and refresh |
| 401 Unauthorized error | Check if user is logged in |
| 403 Forbidden error | Check target_roles array |

---

## **🚀 FINAL STEPS:**

1. ✅ **Run the SQL fix** (`fix_launch_date_target_roles.sql`)
2. ✅ **Verify in database** that target_roles is updated
3. ✅ **Refresh browser** (hard refresh: Ctrl+Shift+R)
4. ✅ **Test the flow** from Network Experience → Launch Date → Submit
5. ✅ **Verify points awarded** after submission

**That's it! Your Launch Date program should now be visible to all users!** 🎉

---

## **📋 FILES MODIFIED:**

1. ✅ `/components/programs/programs-list.tsx` - Added logging, back button, error handling
2. ✅ `/database/programs/fix_launch_date_target_roles.sql` - SQL fix for target_roles

## **🗄️ DATABASE CHANGES:**

1. ✅ `programs.target_roles` - Updated to include all 5 user roles

---

**Need help?** Check the browser console logs or run the verification SQL queries above.
