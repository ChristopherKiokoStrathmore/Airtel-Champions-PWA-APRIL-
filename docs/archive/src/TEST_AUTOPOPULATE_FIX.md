# 🧪 Quick Test Guide - Auto-Populate Fix

## Test This Right Now (30 seconds)

### Step 1: Open Van Calendar Form
1. Refresh browser: `Ctrl+Shift+R`
2. Open Van Calendar submission form
3. Open browser console: `F12` → Console tab

### Step 2: Select a Site
1. Scroll to "Weekly Route Planning" section
2. Click Monday → Site 1 dropdown
3. Select any site (e.g., "MOMBASA_CORONET_HOUSE")

### Step 3: Check for Success

**✅ FIXED - You Should See:**

**In Console:**
```
[ProgressiveSiteSelector] 📍 Monday - Site 1 changed: {
  selected: "MOMBASA_CORONET_HOUSE",
  allSites: ["MOMBASA_CORONET_HOUSE"],
  totalCount: 1
}

[FieldChange] Setting field abc123 to: ["MOMBASA_CORONET_HOUSE"] (array)

[FieldChange] Auto-populating from: "MOMBASA_CORONET_HOUSE" (first of 1 sites)

[AutoPopulate] ✅ Metadata stored for field: abc123
```

**In UI:**
```
Monday                              1/4 sites
┌─────────────────────────────────────────────┐
│ Site 1 *                                    │
│ [MOMBASA_CORONET_HOUSE ▼]                   │
│ ┌─────────────────────────────────────────┐ │
│ │ SITE ID: 12345                 ← ✅ SHOWS│ │
│ │ ZONE: COAST                    ← ✅ SHOWS│ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**❌ STILL BROKEN - You Would See:**
```
[AutoPopulate] ⚠️ Selected value not found in loaded data: [
  "MOMBASA_CORONET_HOUSE"
]
```
👆 If you see this, **hard refresh** again or check that files saved.

---

## Advanced Test: Multiple Sites

### Step 1: Add Second Site
1. Click "+ Add Monday Site 2"
2. Select different site (e.g., "MOMBASA_CAFE_AROMA")

### Step 2: Check Console

**✅ Should See:**
```
[ProgressiveSiteSelector] 📍 Monday - Site 2 changed: {
  selected: "MOMBASA_CAFE_AROMA",
  allSites: ["MOMBASA_CORONET_HOUSE", "MOMBASA_CAFE_AROMA"],
  totalCount: 2
}

[FieldChange] Auto-populating from: "MOMBASA_CORONET_HOUSE" (first of 2 sites)
```
👆 Notice: Auto-populate uses **FIRST** site, not second!

### Step 3: Check UI

**Metadata should still show info for FIRST site:**
```
│ SITE ID: 12345           ← From FIRST site (HOUSE)
│ ZONE: COAST              ← From FIRST site (HOUSE)
```

**NOT from second site (AROMA)**

---

## Edge Case Test: Change First Site

### Step 1: Change Site 1
1. Go back to Site 1 dropdown
2. Change from "HOUSE" to "AROMA"

### Step 2: Check Metadata Updates

**✅ Should See:**
- Metadata updates to show AROMA's info
- Console shows: `Auto-populating from: "MOMBASA_CAFE_AROMA"`

---

## Pass/Fail Criteria

| Test | Expected Result | Pass/Fail |
|------|----------------|-----------|
| Select 1 site | Metadata displays | ⬜ |
| Console shows `(array)` | Yes | ⬜ |
| Console shows `(first of N sites)` | Yes | ⬜ |
| No "not found" errors | No errors | ⬜ |
| Add 2nd site | Metadata stays on first | ⬜ |
| Change 1st site | Metadata updates | ⬜ |

**If ALL checkboxes pass:** ✅ **WORKING!**  
**If ANY fail:** ❌ Check `/FIX_AUTOPOPULATE_ARRAY_ERROR.md`

---

## Screenshot Comparison

### BEFORE (Error):
```
Console:
[AutoPopulate] ⚠️ Selected value not found in loaded data: [
  "MOMBASA_CORONET_HOUSE"
]

UI:
│ Site 1 *                                    │
│ [MOMBASA_CORONET_HOUSE ▼]                   │
│                                             │ ← No metadata!
```

### AFTER (Fixed):
```
Console:
[FieldChange] Auto-populating from: "MOMBASA_CORONET_HOUSE" (first of 1 sites)
[AutoPopulate] ✅ Metadata stored

UI:
│ Site 1 *                                    │
│ [MOMBASA_CORONET_HOUSE ▼]                   │
│ ┌─────────────────────────────────────────┐ │
│ │ SITE ID: 12345                          │ │ ← Shows!
│ │ ZONE: COAST                             │ │ ← Shows!
│ └─────────────────────────────────────────┘ │
```

---

## Troubleshooting

### Problem: Still seeing "not found" error

**Solution 1:** Hard refresh
```
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

**Solution 2:** Clear cache
```
F12 → Network tab → ☑ Disable cache
Then refresh
```

**Solution 3:** Check file saved
```
Open /components/programs/program-submit-modal.tsx
Look for line 494: "If value is an array"
If not there, file didn't save properly
```

### Problem: Metadata shows for wrong site

**Expected behavior:** When you have multiple sites, metadata shows for **FIRST** site only

**If it shows last site:** Code reverted, re-apply fix

### Problem: Metadata doesn't show at all

**Check:**
1. Does the field have `metadata_fields` configured?
2. Go to HQ → Edit Program → Edit Field → Database Source
3. Verify "Metadata Fields" has: SITE ID, ZONE

---

**Time to Test:** 30 seconds  
**Confidence:** 100% (fix is simple and targeted)
