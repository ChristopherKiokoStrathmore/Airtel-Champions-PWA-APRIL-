# 🔍 VAN CALENDAR - VERIFICATION CHECKLIST

## ✅ What I Fixed:

### 1. **Missing Import Errors** ✅ FIXED
- ❌ Error: `ReferenceError: projectId is not defined`
- ✅ Fix: Added `import { projectId, publicAnonKey } from '../utils/supabase/info'`
- 📁 Files: 
  - `van-calendar-form.tsx`
  - `van-calendar-grid.tsx`
  - `van-calendar-zsm-checklist.tsx`
  - `van-calendar-compliance.tsx`

### 2. **Van Calendar Location** ✅ FIXED
- ❌ Before: Not visible in Programs list
- ✅ Now: Blue card at top of Programs list, above "MINI ROAD SHOW -CHECK OUT"
- 📁 File: `programs-list.tsx`

---

## 🧪 TEST STEPS:

### Step 1: Enable Van Calendar
```sql
-- Run in Supabase SQL Editor:
INSERT INTO kv_store_28f2f653 (key, value)
VALUES ('feature_van_calendar_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true';
```

### Step 2: Refresh App
- Close and reopen the app
- Or refresh browser if using web version

### Step 3: Open Programs Screen
- Click the 2nd icon from left in bottom nav (Programs)
- Should see programs list

### Step 4: Look for Van Calendar Card
- **Top of list**: Blue gradient card
- **Text**: "🚐 Van Weekly Calendar"
- **Description**: "Submit weekly van routes and schedules"
- **Position**: Above "MINI ROAD SHOW -CHECK OUT"

### Step 5: Click Van Calendar
- Should open full-screen Van Calendar form
- No errors in console!

### Step 6: Check Console (Optional)
Open browser dev tools and look for:
```
✅ [Programs List] ✅ Van Calendar enabled: true
✅ Loading next Sunday...
✅ Checking conflicts...
```

Should NOT see:
```
❌ Error loading next Sunday: ReferenceError: projectId is not defined
❌ Error checking conflicts: ReferenceError: projectId is not defined
```

---

## ✅ EXPECTED BEHAVIOR:

### For ZSMs (like SHARON):
1. See blue Van Calendar card at top of Programs
2. Click it
3. See Van Calendar form with:
   - Van selector dropdown
   - Monday-Sunday schedule fields
   - Site selection dropdowns
   - Submit button
4. Can fill out and submit weekly routes
5. **NO ERRORS!**

### For HQ/Directors:
1. See blue Van Calendar card at top of Programs
2. Click it
3. See Van Calendar Grid with:
   - Calendar view of all submissions
   - Tabs: Calendar / Compliance
   - Week navigation
4. Can view all ZSM submissions
5. **NO ERRORS!**

---

## 🐛 IF YOU STILL SEE ERRORS:

### Check 1: Verify Imports
Open browser dev tools Console and type:
```javascript
console.log(window.location.origin)
```
Should show your Supabase project URL

### Check 2: Check /utils/supabase/info.tsx
File should exist and export:
```typescript
export const projectId = 'your-project-id';
export const publicAnonKey = 'your-anon-key';
```

### Check 3: Hard Refresh
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- This clears cached JavaScript files

### Check 4: Check Database
```sql
-- Verify feature is enabled:
SELECT * FROM kv_store_28f2f653 WHERE key = 'feature_van_calendar_enabled';
-- Should return: value = 'true'
```

---

## 📊 SUCCESS INDICATORS:

### Console Logs (Good):
```
✅ [Programs List] User from localStorage: {role: 'zonal_sales_manager', ...}
✅ [Programs List] ✅ Van Calendar enabled: true
✅ [Van Calendar] Loading next Sunday...
✅ [Van Calendar] Next Sunday: 2026-02-22
✅ [Van Calendar] Loading vans...
✅ [Van Calendar] Vans loaded: 19
```

### Console Errors (Bad - shouldn't see these):
```
❌ ReferenceError: projectId is not defined
❌ Error loading next Sunday
❌ Error checking conflicts
❌ Failed to fetch
```

---

## 🎉 ALL FIXED!

If you see the blue Van Calendar card and can click it without errors, everything is working! 🚐✨
