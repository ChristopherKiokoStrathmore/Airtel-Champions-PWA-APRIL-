# Quick Fix: Enable ZSMs to Submit Programs

## Problem
ZSMs can see programs but cannot fill out the form when they click on them.

## Solution
Follow these steps in order:

### Step 1: Run SQL Migration ✅
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire content of `/database/add-who-can-submit-column.sql`
3. Click **Run**
4. You should see: "Success. No rows returned"

This adds the `who_can_submit` column and configures CHECK IN/OUT programs for both SEs and ZSMs.

### Step 2: Verify in Database ✅
1. Go to **Supabase Dashboard** → **Table Editor** → **programs** table
2. Look for the `who_can_submit` column
3. For CHECK IN and CHECK OUT programs, it should contain:
   ```
   ['sales_executive', 'zonal_sales_manager']
   ```

### Step 3: Test Submission ✅
1. **Log in as a ZSM** (e.g., CAROLYN NYAWADE)
2. **From the Home Dashboard**:
   - Scroll to "Programs Activity" widget
   - Click on "CHECK IN" or "CHECK OUT" program
   - You'll see a **red "Submit Form" button** at the top
   - Click it to open the submission form
3. **From the Programs Tab**:
   - Go to Programs tab
   - You'll see a **red "Submit Form" button** on program cards
   - Click it to open the submission form

### What Changed?
- ✅ Added `who_can_submit` column to programs table
- ✅ CHECK IN/OUT programs now allow both SEs and ZSMs to submit
- ✅ ZSMs see a prominent red "Submit Form" button on program cards
- ✅ Backward compatible: Old programs without `who_can_submit` still work

## Verification Steps

### For ZSMs:
1. Log in as ZSM
2. Go to Programs tab
3. You should see CHECK IN and CHECK OUT with a **red "Submit Form" button**
4. Click "Submit Form" → Should open the submission form
5. Fill out and submit → Should work!

### For Program Creators (HQ/Directors):
When creating/editing programs, you'll now see two separate sections:
- **👥 Target Audience** = Who can SEE the program
- **✍️ Who Can Submit** = Who can FILL OUT the form

## Common Issues

### Issue: No "Submit Form" button visible
**Solution**: Run the SQL migration first. The button only shows if the user's role is in `who_can_submit` array.

### Issue: "Cannot Submit" modal appears
**Cause**: User's role is not in the `who_can_submit` array for that program.

**Solution**: 
1. Edit the program (HQ/Director only)
2. Check the "Who Can Submit" section
3. Ensure ZSMs (zonal_sales_manager) is checked
4. Save changes

### Issue: Program opens but shows only profile info
**Cause**: You're on the wrong screen. The screenshot shows the Programs Dashboard management view, not the submission form.

**Solution**: 
1. Look for the red "Submit Form" button at the top of the program card
2. Click it to open the actual submission form
3. If you don't see the button, run the SQL migration first

## Quick Test Script
```sql
-- Check if column exists and has correct data
SELECT title, target_roles, who_can_submit 
FROM programs 
WHERE title ILIKE '%CHECK%'
ORDER BY title;
```

Expected result:
```
CHECK IN  | [sales_executive, zonal_sales_manager, ...] | [sales_executive, zonal_sales_manager]
CHECK OUT | [sales_executive, zonal_sales_manager, ...] | [sales_executive, zonal_sales_manager]
```

## Next Steps After Fix
- ✅ ZSMs can now submit CHECK IN/OUT without any toggle
- ✅ Create new programs with custom submission permissions
- ✅ Both visibility and submission are now independently controlled
