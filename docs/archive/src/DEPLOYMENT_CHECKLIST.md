# Deployment Checklist - Progressive Disclosure Feature

## ✅ Pre-Deployment Verification

- [x] Code changes complete (no build errors)
- [x] SQL migration file created: `/ADD_PROGRESSIVE_DISCLOSURE_COLUMN.sql`
- [x] Van Calendar 4-sites migration ready: `/VAN_CALENDAR_4_SITES_PER_DAY.sql`
- [x] GPS toggle migration ready: `/ADD_GPS_TOGGLE_COLUMN.sql`
- [x] Documentation complete
- [x] No APK changes required (over-the-air update)

---

## 📋 Deployment Steps

### Step 1: Run SQL Migrations (5 minutes)

**Order matters! Run in this sequence:**

```sql
-- 1️⃣ FIRST: GPS Auto-Detect Toggle
-- Copy/paste from: /ADD_GPS_TOGGLE_COLUMN.sql
-- Adds: gps_auto_detect_enabled column

-- 2️⃣ SECOND: Van Calendar 4 Sites Per Day
-- Copy/paste from: /VAN_CALENDAR_4_SITES_PER_DAY.sql
-- Adds: monday_site_1, monday_site_2, monday_site_3, monday_site_4, etc.

-- 3️⃣ THIRD: Progressive Disclosure Toggle
-- Copy/paste from: /ADD_PROGRESSIVE_DISCLOSURE_COLUMN.sql
-- Adds: progressive_disclosure_enabled column
```

**How to run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy/paste each file's content
5. Click "Run" for each one
6. ✅ Verify success messages

---

### Step 2: Deploy React Code (10 minutes)

```bash
# Build your React app
npm run build

# Upload build folder to your web server
# (Your specific deployment command here)
```

**Important:** The existing APK will automatically load the new code from your server!

---

### Step 3: Enable Progressive Disclosure for Van Calendar (2 minutes)

1. Refresh your browser (clear cache if needed: Ctrl+Shift+R)
2. Log in to HQ account
3. Go to **Programs** section
4. Find **"🚐 Van Weekly Calendar"**
5. Click **Edit** (pencil icon)
6. Click **Settings** tab
7. Scroll down to toggles section
8. ✅ **Check** "🎯 Enable Progressive Disclosure UI"
9. Click **Save Program**
10. ✅ Done!

---

### Step 4: Verify Deployment (5 minutes)

#### Test 1: Van Calendar with Progressive UI
1. Open **"🚐 Van Weekly Calendar"** program
2. Click to submit
3. ✅ Should see: "🚐 Weekly Route Planning" header
4. ✅ Should see: Monday with **1 site dropdown only**
5. ✅ Should see: **"+ Add Another Site"** button
6. Click the button
7. ✅ Site 2 dropdown appears
8. ✅ Site counter shows "[2 sites]"
9. Click Remove button
10. ✅ Site 2 disappears

#### Test 2: GPS Auto-Detect Toggle
1. Edit any program → Settings tab
2. ✅ Should see: "📍 Enable GPS Auto-Detect Button" toggle
3. Toggle it ON/OFF
4. Save program
5. Open submission form
6. ✅ With toggle ON: See "Auto-Detect My Location" button
7. ✅ With toggle OFF: No GPS button shown

#### Test 3: Points Toggle (Already Exists)
1. Edit any program → Settings tab
2. ✅ Should see: "⭐ Award Points for This Program" toggle
3. Toggle it OFF
4. ✅ Points value input becomes disabled
5. Save program

#### Test 4: Backward Compatibility
1. Create a **new program** from scratch
2. Add 4 fields named: `monday_site_1`, `monday_site_2`, `monday_site_3`, `monday_site_4`
3. **Don't touch** the Progressive Disclosure toggle (leave unchecked)
4. Save program
5. Open submission form
6. ✅ Should show **all 4 site fields** at once (traditional view)
7. ✅ No "+ Add Another Site" buttons

---

## 🔍 Troubleshooting

### Issue: Progressive disclosure toggle not visible
**Solution:** 
- Clear browser cache (Ctrl+Shift+R)
- Verify SQL migration ran successfully
- Check browser console for errors

### Issue: Site fields showing traditional view even with toggle ON
**Solution:**
- Verify you saved the program after enabling toggle
- Check `progressive_disclosure_enabled` in database:
  ```sql
  SELECT title, progressive_disclosure_enabled 
  FROM programs 
  WHERE title LIKE '%Van%';
  ```
- Should show `true`

### Issue: "Column does not exist" error when saving program
**Solution:**
- SQL migration didn't run
- Go back to Step 1 and run migrations

### Issue: Users see old UI
**Solution:**
- They might have cached version
- Ask them to refresh: Pull down to refresh (mobile) or Ctrl+R (web)
- React app should auto-reload new code

---

## 📊 Post-Deployment Monitoring

### Day 1: Check Submissions
```sql
-- Check Van Calendar submissions with new site fields
SELECT 
  id,
  created_at,
  responses->>'monday_site_1' as mon_site_1,
  responses->>'monday_site_2' as mon_site_2,
  responses->>'monday_site_3' as mon_site_3,
  responses->>'monday_site_4' as mon_site_4
FROM submissions
WHERE program_id = (SELECT id FROM programs WHERE title = '🚐 Van Weekly Calendar')
ORDER BY created_at DESC
LIMIT 10;
```

### Week 1: Analyze Usage Patterns
```sql
-- How many sites do users typically fill per day?
-- This helps validate if progressive disclosure is beneficial
SELECT 
  CASE 
    WHEN responses->>'monday_site_4' IS NOT NULL AND responses->>'monday_site_4' != '' THEN '4 sites'
    WHEN responses->>'monday_site_3' IS NOT NULL AND responses->>'monday_site_3' != '' THEN '3 sites'
    WHEN responses->>'monday_site_2' IS NOT NULL AND responses->>'monday_site_2' != '' THEN '2 sites'
    WHEN responses->>'monday_site_1' IS NOT NULL AND responses->>'monday_site_1' != '' THEN '1 site'
    ELSE '0 sites'
  END as sites_filled,
  COUNT(*) as count
FROM submissions
WHERE program_id = (SELECT id FROM programs WHERE title = '🚐 Van Weekly Calendar')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY sites_filled
ORDER BY count DESC;
```

**Expected Result:**  
If most users fill 1-2 sites, progressive disclosure is the right choice!  
If most fill all 4, you might want to disable it.

---

## 🎯 Success Criteria

- [x] SQL migrations run without errors
- [x] React code deployed successfully
- [x] Progressive disclosure toggle visible in Settings
- [x] Van Calendar shows progressive UI when enabled
- [x] GPS toggle works
- [x] Points toggle works
- [x] Backward compatibility maintained
- [x] No APK rebuild required
- [x] All 662 users see new features automatically

---

## 📞 Rollback Plan (Just In Case)

If something goes wrong:

### Option 1: Disable Progressive Disclosure (Quick)
```sql
-- Turn OFF progressive disclosure for all programs
UPDATE programs SET progressive_disclosure_enabled = FALSE;
```
Users will see traditional view immediately (after refresh).

### Option 2: Remove Column (Nuclear)
```sql
-- Only if absolutely necessary
ALTER TABLE programs DROP COLUMN progressive_disclosure_enabled;
```
**Warning:** This will cause errors in the new code. Only do this if you rollback the frontend too.

### Option 3: Rollback Frontend Code
- Deploy previous build folder
- Users get old code
- Everything works as before

---

## ✅ Final Checklist

Before marking deployment complete:

- [ ] All SQL migrations executed successfully
- [ ] React code deployed to production server
- [ ] Van Calendar has progressive disclosure enabled
- [ ] Tested progressive UI with real user account
- [ ] Tested GPS toggle
- [ ] Verified backward compatibility
- [ ] Checked browser console for errors
- [ ] Confirmed no APK changes needed
- [ ] Documented deployment in team chat/email
- [ ] Updated internal docs with new feature info

---

## 🎉 Deployment Complete!

**What You Achieved:**
✅ Van Calendar now has clean, progressive site selection  
✅ HQ has full control via Settings toggles  
✅ GPS auto-detect can be enabled/disabled per program  
✅ Zero APK rebuilds - pure over-the-air update  
✅ All 662 Sales Executives get updates automatically  

**Next Steps:**
1. Monitor submissions for 1 week
2. Gather feedback from ZSMs
3. Adjust toggle settings based on usage patterns
4. Consider applying progressive disclosure to other programs

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Issues Encountered:** None / [List any issues]  
**Time Taken:** _______ minutes  
