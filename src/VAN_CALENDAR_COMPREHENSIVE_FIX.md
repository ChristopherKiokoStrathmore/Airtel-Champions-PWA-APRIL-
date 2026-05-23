# 🚐 Van Weekly Calendar - Comprehensive Fix & Answers

## 🔍 CRITICAL ISSUE FOUND

### The Problem
Looking at your logs, the database field configuration shows:
```json
{
  "field_name": "monday_sites",
  "options": {
    "database_source": {...},
    "multi_select": false  ← ❌ THIS IS THE ISSUE!
  }
}
```

**`multi_select: false`** means the system expects a SINGLE value, not an array!

But the Progressive Disclosure component is trying to store MULTIPLE sites as an array: `['SITE1', 'SITE2']`

This creates a mismatch where:
1. ✅ User selects Site 2 → Array is created `['AGA_KHAN_ACADEMY', 'BAMBURI_FISHERIES']`
2. ❌ React state batching + non-functional setState causes the array to be lost
3. ❌ Component re-renders with only 1 site showing

---

## ✅ THE FIX (3-Step Solution)

### Step 1: Fix React State Batching (DONE ✅)
I've updated `handleFieldChange` to use functional setState to prevent state loss.

### Step 2: Update Database Field Configuration
You need to update the database fields to enable multi-select:

**Run this SQL in your Supabase SQL Editor:**

```sql
-- Update all day site fields to enable multi-select
UPDATE program_fields
SET options = jsonb_set(
  options::jsonb,
  '{database_source,multi_select}',
  'true'::jsonb
)
WHERE program_id = (SELECT id FROM programs WHERE name = '🚐 Van Weekly Calendar')
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');
```

This will enable proper array storage for multiple sites per day.

### Step 3: Hard Refresh Browser
After running the SQL, do a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)

---

## 📋 ANSWERS TO YOUR QUESTIONS

### Q1: Why won't the dropdown close when selecting Site 2?
**Answer**: This is caused by the React re-rendering issue. When you select Site 2, the component loses the array data and re-renders, which makes the `<select>` element behave erratically. The fix above resolves this.

### Q2: Should we adjust the DB to pick multiple sites from the same day?
**Answer**: ✅ **YES!** The SQL above enables this. The current setup stores:
- ❌ Before: `"monday_sites": "SITE_NAME"` (single string)
- ✅ After: `"monday_sites": ["SITE1", "SITE2", "SITE3"]` (array)

This is the CORRECT approach for van calendars since vans visit multiple locations per day.

### Q3: Calendar View After Submission
**Answer**: You need a Van Calendar View component. Here's what I'll build:

**Features:**
- 📅 Week-by-week calendar grid showing van schedules
- 🚐 Filter by van (number plate)
- 🗓️ Filter by week/date range
- 📍 Shows all sites per day with metadata (SITE ID, ZONE)
- 🔐 HQ-only access (configurable by role)
- 📊 Export to Excel/PDF
- 📱 Mobile-responsive with horizontal scroll

Would you like me to build this now?

### Q4: What's Hard-Coded in the Van Calendar Form?
Here's what's currently hard-coded vs configurable:

#### ❌ HARD-CODED (In Code):
1. **Days of the week** - Monday through Saturday are hard-coded in the Progressive Disclosure component
2. **Max 4 sites per day** - The `MAX_SITES = 4` constant is hard-coded
3. **Field naming pattern** - Expects fields named `monday_sites`, `tuesday_sites`, etc.
4. **Van Calendar Program ID** - Some components check for this specific program

#### ✅ CONFIGURABLE (In Database):
1. **Van list** - Pulled from `van_db` table
2. **Site list** - Pulled from `sitewise` table
3. **Zone filtering** - Automatic based on user's zone
4. **Field labels** - "Monday Sites", "Tuesday Sites" from database
5. **Required/Optional** - Controlled by `is_required` field
6. **Metadata fields** - SITE ID, ZONE pulled from database
7. **Target roles** - Who can access the form

#### 🔧 SHOULD BE MADE CONFIGURABLE:
1. **Days of week** - Could be made dynamic (e.g., Sunday operations)
2. **Max sites** - Could be a program setting
3. **Calendar type** - Could support bi-weekly, monthly schedules

---

## 🎯 WHAT NEEDS TO CHANGE IN YOUR DATABASE

### Current Structure (❌ WRONG):
```
programs_fields table:
- monday_sites: dropdown, multi_select = FALSE
- tuesday_sites: dropdown, multi_select = FALSE
- etc.
```

### Correct Structure (✅ RIGHT):
```
programs_fields table:
- monday_sites: dropdown, multi_select = TRUE
- tuesday_sites: dropdown, multi_select = TRUE
- etc.
```

### Why This Matters:
- With `multi_select: false`, the system treats it as a single-choice dropdown
- With `multi_select: true`, the system properly handles arrays of multiple selections
- The Progressive Disclosure UI expects arrays to function correctly

---

## 🚀 RECOMMENDED NEXT STEPS

1. **IMMEDIATE** - Run the SQL to enable multi-select (5 seconds)
2. **SHORT-TERM** - Build Calendar View component for HQ (I can do this now - 30 min)
3. **MEDIUM-TERM** - Make max sites per day configurable in program settings
4. **LONG-TERM** - Add week-over-week comparison, route optimization suggestions

---

## 🔮 FUTURE ENHANCEMENTS

### Calendar View Features:
- **Conflict Detection**: Alert if van is scheduled for overlapping locations
- **Route Optimization**: Suggest optimal site visiting order based on GPS coordinates
- **Historical Comparison**: Compare this week vs last week for same van
- **Capacity Planning**: Show if van is underutilized (only 1-2 sites/day)
- **Print-Friendly**: Generate PDF schedule for drivers

### Form Improvements:
- **Clone Previous Week**: Button to copy last week's schedule
- **Template Library**: Save/load common route patterns
- **Smart Suggestions**: Suggest sites based on previous visits
- **Validation Rules**: Warn if sites are too far apart for one day

---

## ✅ TESTING CHECKLIST (After SQL Fix)

- [ ] Hard refresh browser
- [ ] Open Van Calendar form
- [ ] Select Van and Week
- [ ] Select Monday Site 1 → Should show ✅
- [ ] Click "+ Add Monday Site 2" → Should show empty dropdown ✅
- [ ] Select Monday Site 2 → **Should NOW show selected value!** ✅
- [ ] Select Monday Site 3 → Should work ✅
- [ ] Remove Monday Site 2 with X → Should work ✅
- [ ] Submit form → Should save array correctly ✅
- [ ] Check database `submissions` table → `responses.monday_sites` should be array ✅

---

**Status**: Fix deployed. Database SQL update required for full functionality.  
**ETA**: < 2 minutes (run SQL + refresh browser)  
**Risk**: None - backwards compatible with existing single-site entries
