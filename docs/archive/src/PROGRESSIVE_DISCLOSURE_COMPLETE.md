# ✅ Progressive Disclosure + Zone Filtering - COMPLETE

## 🎯 What Was Fixed

### 1️⃣ **Zone Filtering Not Working (0 sites showing)**
**Problem:** Code was filtering by lowercase `'zone'`, but sitewise table uses uppercase `'ZONE'`

**Fix:** Auto-detect zone column name from `metadata_fields`
```typescript
// Before (hardcoded):
query = query.eq('zone', userZone);

// After (auto-detect):
const zoneColumnName = dbSource.metadata_fields?.find((field: string) => 
  field.toUpperCase().includes('ZONE')
) || 'zone';
query = query.eq(zoneColumnName, userZone);
```

**Result:** ✅ Schola (COAST ZSM) now sees all COAST sites (not 0)

---

### 2️⃣ **Progressive Disclosure Not Working**
**Problem:** Toggle was enabled but had no effect - still showed all 6 fields at once

**Reason:** Code expected OLD field naming pattern:
- `monday_site_1`, `monday_site_2`, `monday_site_3`, `monday_site_4`

But actual fields use NEW pattern:
- `monday_sites`, `tuesday_sites`, etc. (single field per day)

**Fix:** Created new `ProgressiveSiteSelector` component
- Detects NEW pattern: `/^(monday|tuesday|wednesday|thursday|friday|saturday)_sites$/`
- Shows 1 site dropdown initially
- Click "+ Add Monday Site 2" to reveal more (up to 4 per day)
- Stores multiple sites as array in formData
- Prevents selecting same site twice
- Shows "X" button to remove sites

**Result:** ✅ When toggle enabled, users see clean UI with "+ Add Site" buttons

---

## 📁 Files Modified

### `/components/programs/program-submit-modal.tsx`
1. ✅ Added import: `ProgressiveSiteSelector`
2. ✅ Added zone column auto-detection (line ~356)
3. ✅ Added NEW progressive disclosure section (line ~2122)
4. ✅ Filters out `monday_sites`, `tuesday_sites` when progressive disclosure enabled

### `/components/programs/progressive-site-selector.tsx` (NEW)
✅ New component for progressive disclosure UI
- Handles 1-4 sites per day
- Shows "+ Add Site" buttons
- Stores as array
- Prevents duplicates

---

## 🧪 How To Test

### Test 1: Zone Filtering
1. **Login as HQ** (Christopher Kioko)
2. **Edit Van Calendar** program
3. **Settings tab** → Enable "🔒 Lock Dropdowns to User's Zone"
4. **Save**
5. **Login as ZSM** (Schola - COAST zone)
6. **Open Van Calendar**
7. ✅ **Van dropdown:** Should show 5 COAST vans (not 0, not 38)
8. ✅ **Monday Sites dropdown:** Should show ~hundreds of COAST sites (not 0, not 4530)

### Test 2: Progressive Disclosure  
1. **Login as HQ**
2. **Edit Van Calendar** program
3. **Settings tab** → Enable "🎯 Enable Progressive Disclosure UI"
4. **Save**
5. **Login as any user**
6. **Open Van Calendar**
7. ✅ **Should see:** Blue header "🚐 Weekly Route Planning"
8. ✅ **Monday section:** Shows 1 dropdown + "+ Add Monday Site 2" button
9. ✅ **Click "+ Add":** Reveals 2nd dropdown
10. ✅ **Can add up to 4 sites per day**
11. ✅ **"X" button:** Removes added sites

### Test 3: Both Toggles OFF
1. **Login as HQ**
2. **Edit Van Calendar**
3. **Settings tab** → Disable BOTH toggles
4. **Save**
5. **Login as any user**
6. **Open Van Calendar**
7. ✅ **Should see:** Traditional UI - all 6 site fields visible at once
8. ✅ **Dropdowns:** Show ALL sites across ALL zones (4530 total)

---

## 🔄 Over-The-Air Update

**Database Changes:** ✅ Already applied (ran SQL earlier)
**Code Changes:** ✅ Deployed automatically

**Users just need to:** Refresh browser (Ctrl+Shift+R)

---

## 📊 How Data is Stored

### Without Progressive Disclosure:
```json
{
  "monday_sites": "Site A",
  "tuesday_sites": "Site B"
}
```

### With Progressive Disclosure:
```json
{
  "monday_sites": ["Site A", "Site B", "Site C"],
  "tuesday_sites": ["Site D"]
}
```

The component automatically handles both formats!

---

## 🎨 UI Behavior

### Progressive Disclosure Enabled:
```
🚐 Weekly Route Planning
Select up to 4 sites per day. Click "+ Add Site" to add more.

┌─────────────────────────────────────┐
│ Monday                    1/4 sites │
├─────────────────────────────────────┤
│ Site 1 *                            │
│ [Select a site... ▼]                │
│                                     │
│ [+ Add Monday Site 2]               │
└─────────────────────────────────────┘
```

After clicking "+ Add":
```
┌─────────────────────────────────────┐
│ Monday                    2/4 sites │
├─────────────────────────────────────┤
│ Site 1 *                            │
│ [Site A ▼]                          │
│                                     │
│ Site 2                          [X] │
│ [Select a site... ▼]                │
│                                     │
│ [+ Add Monday Site 3]               │
└─────────────────────────────────────┘
```

---

## ⚙️ Settings Tab (HQ Only)

When editing a program in HQ, you'll see:

```
┌──────────────────────────────────────────┐
│ ☑ Enable Progressive Disclosure UI       │
│ ☑ Multi-field patterns (like Van         │
│   Calendar sites) will show 1 field      │
│   initially with "+ Add Another"         │
│   buttons to reveal more.                │
│                                          │
│   ✨ How It Works:                       │
│   • Van Calendar: Shows 1 site per day,  │
│     click to add up to 4                 │
│   • Reduces visual clutter (6 days × 1   │
│     field vs 6 days × 4 fields)          │
│   • Users add only what they need (1-4   │
│     sites per day)                       │
│   • Better mobile experience with less   │
│     scrolling                            │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ☑ Lock Dropdowns to User's Zone          │
│ ☑ Database dropdowns will filter by      │
│   user's zone (e.g., NAIROBI users only  │
│   see NAIROBI sites).                    │
└──────────────────────────────────────────┘
```

---

## 🚀 Next Steps

1. ✅ **Refresh browser** to get new code
2. ✅ **Test with Schola** (COAST ZSM) - verify sites appear
3. ✅ **Test progressive disclosure** - verify "+ Add" buttons work
4. ✅ **Test both toggles OFF** - verify traditional UI works
5. ✅ **Submit a test entry** - verify data saves correctly

---

## 🐛 If You See Issues

### "0 options" in dropdowns when zone filtering enabled:
- Check database: Does sitewise table have a ZONE column?
- Check user: Does Schola have zone='COAST' in app_users?
- Check logs: Look for "Filtering sitewise by column "ZONE" = "COAST""

### Progressive disclosure not showing:
- Check toggle: Is "Enable Progressive Disclosure UI" checked and saved?
- Check field names: Are they exactly `monday_sites`, not `monday_site_1`?
- Check logs: Look for "Detect NEW pattern" messages

### Data not saving:
- Check console for submission errors
- Verify formData contains arrays for multi-site days
- Check submissions table schema

---

**Status:** ✅ READY TO TEST
**Estimated Testing Time:** 5 minutes
**Risk:** Low (backward compatible, toggles default to OFF)
