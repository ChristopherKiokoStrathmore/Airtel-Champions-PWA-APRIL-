# 🔥 URGENT FIX: Database Columns Missing

## ❌ Error You're Seeing

```
Could not find the 'progressive_disclosure_enabled' column of 'programs' in the schema cache
```

---

## ✅ Quick Fix (2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `xspogpfohjmkykfjadhk`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy & Paste This SQL

```sql
-- Add missing columns to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS progressive_disclosure_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS zone_filtering_enabled BOOLEAN DEFAULT FALSE;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'programs' 
  AND column_name IN ('progressive_disclosure_enabled', 'zone_filtering_enabled');
```

### Step 3: Run the Query

1. Click **Run** button (or press Ctrl+Enter)
2. ✅ You should see: **Success. 2 rows returned**
3. ✅ The output shows both new columns

### Step 4: Refresh Your Browser

1. Go back to Figma Make
2. **Hard refresh:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. This clears the cache and loads fresh code

### Step 5: Test

1. Login to HQ account
2. Go to Programs
3. Edit "🚐 Van Weekly Calendar"
4. Click **Settings** tab
5. ✅ You should now see TWO new toggles:
   - 🎯 Enable Progressive Disclosure UI
   - 🔒 Lock Dropdowns to User's Zone

---

## 📋 Alternative: Use the SQL File

If you prefer, use the pre-made file:

1. Open `/ADD_ALL_MISSING_COLUMNS.sql` in this project
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Run it
5. Refresh browser

---

## 🔍 Why This Happened

The React code was deployed **before** the database columns were added. This is the correct order:

1. ✅ **FIRST:** Add database columns (SQL migration)
2. ✅ **THEN:** Deploy React code

You deployed the React code first, so the app is trying to save to columns that don't exist yet.

---

## ⚠️ Important

After running the SQL:

- ✅ **No APK rebuild needed** - This is a database-only change
- ✅ **All users get the fix** - Just refresh their browsers
- ✅ **Backward compatible** - Default values are FALSE (old behavior)

---

## 🚀 After Fix

Once columns are added, you can:

1. **Progressive Disclosure:** Show 1 site per day, add more as needed
2. **Zone Filtering:** NAIROBI users only see NAIROBI sites

Both toggles will be in the **Settings** tab of the program creator.

---

## 📞 Still Getting Errors?

### Error 1: "relation 'programs' does not exist"
**Fix:** Your `programs` table doesn't exist. You need to create it first.

### Error 2: "permission denied for table programs"
**Fix:** Use the Supabase dashboard, not a regular database client. Or grant yourself permissions:
```sql
GRANT ALL ON programs TO postgres;
```

### Error 3: Columns still not showing after SQL
**Fix:** Clear your browser cache completely:
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Or use Incognito/Private mode

---

## ✅ Verification Checklist

After running the SQL, verify:

- [ ] SQL query returned "Success"
- [ ] Verification query shows 2 rows (both columns)
- [ ] Refreshed browser with hard refresh (Ctrl+Shift+R)
- [ ] Can see Settings tab in program creator
- [ ] Can see "🎯 Enable Progressive Disclosure UI" toggle
- [ ] Can see "🔒 Lock Dropdowns to User's Zone" toggle
- [ ] Can save program without errors

If all checkboxes are ✅, you're good to go!

---

## 🎯 Next Steps After Fix

1. **Enable Progressive Disclosure** for Van Calendar (cleaner UI)
2. **Enable Zone Filtering** for Van Calendar (zone-specific sites)
3. Test with a ZSM account
4. Verify dropdowns show correct data

---

**Estimated Fix Time:** 2 minutes  
**Risk:** None (safe migration, uses IF NOT EXISTS)  
**Downtime:** Zero (add columns while app is running)
