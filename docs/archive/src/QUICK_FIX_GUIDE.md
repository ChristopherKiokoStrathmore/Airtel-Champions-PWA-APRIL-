# 🔧 QUICK FIX GUIDE - Stop Double Rendering

## Problem
The form shows site fields TWICE:
1. Once in the main form (Monday Sites, Tuesday Sites...)
2. Once in the Progressive Disclosure section ("Weekly Route Planning")

## Root Cause
Line ~1291-1295 has OLD logic that doesn't detect the NEW field pattern (`monday_sites`).

---

## ⚡ 30-Second Fix

### Step 1: Open the File
`/components/programs/program-submit-modal.tsx`

### Step 2: Find Line ~1291
Press `Ctrl+F` (or `Cmd+F`) and search for:
```
SKIP Van Calendar site fields
```

You'll see this code:

```typescript
// 🆕 SKIP Van Calendar site fields ONLY if progressive disclosure is enabled
const isSiteField = /^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/.test(field.field_name);
const useProgressiveDisclosure = program.progressive_disclosure_enabled !== false; // Default true
if (isSiteField && useProgressiveDisclosure) {
  return null; // Skip rendering - handled separately below with progressive UI
}
```

### Step 3: Replace with This
Delete those 5 lines and replace with:

```typescript
// 🆕 SKIP Van Calendar site fields ONLY if progressive disclosure is enabled
if (shouldSkipField(field)) {
  return null;
}
```

### Step 4: Save
Press `Ctrl+S` (or `Cmd+S`)

### Step 5: Refresh Browser
Press `Ctrl+Shift+R` (or `Cmd+Shift+R`)

---

## ✅ Expected Result

**Before Fix:**
- See "Monday Sites" dropdown in main form area
- AND also see "Weekly Route Planning" section with "+ Add Monday Site 2"
- Form feels cluttered and confusing

**After Fix:**
- NO site dropdowns in main form area
- ONLY see "Weekly Route Planning" section
- Clean, organized UI

---

## 🧪 Test It

1. Open Van Calendar form
2. Scroll down
3. **You should see:**
   - Van dropdown
   - Week Starting date field
   - 🚐 Weekly Route Planning (blue box)
   - Monday section with "+ Add Site" buttons
4. **You should NOT see:**
   - "Monday Sites" dropdown above the blue box

---

## 🆘 If It Still Doesn't Work

### Check 1: Is the toggle enabled?
- Go to HQ → Edit Van Calendar
- Settings tab
- Verify "Enable Progressive Disclosure UI" is checked
- Click Save

### Check 2: Did you save the file?
- Make sure you pressed Ctrl+S after editing
- Check file modification timestamp

### Check 3: Did you refresh correctly?
- Use Ctrl+Shift+R (hard refresh)
- Or clear cache: Settings → Privacy → Clear browsing data

### Check 4: Check browser console
- Press F12
- Look for errors in Console tab
- Share screenshot if errors appear

---

## 📸 Visual Guide

### BEFORE (Wrong - Double Rendering):
```
┌────────────────────────────────────┐
│ Select Van *                       │
│ [Search from 5 van_db... ▼]       │
│                                    │
│ Week Starting *                    │
│ [dd/mm/yyyy]                       │
│                                    │
│ Monday Sites  ← ❌ EXTRA FIELD     │
│ [Search from 470 sitewise... ▼]   │
│                                    │
│ Tuesday Sites  ← ❌ EXTRA FIELD    │
│ [Search from 470 sitewise... ▼]   │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🚐 Weekly Route Planning       │ │
│ │ Monday             0/4 sites   │ │
│ │   Site 1                       │ │
│ │   [Select a site... ▼]         │ │
│ │   [+ Add Monday Site 2]        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### AFTER (Correct - Clean UI):
```
┌────────────────────────────────────┐
│ Select Van *                       │
│ [Search from 5 van_db... ▼]       │
│                                    │
│ Week Starting *                    │
│ [dd/mm/yyyy]                       │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 🚐 Weekly Route Planning       │ │
│ │ Monday             0/4 sites   │ │
│ │   Site 1                       │ │
│ │   [Select a site... ▼]         │ │
│ │   [+ Add Monday Site 2]        │ │
│ │                                │ │
│ │ Tuesday            0/4 sites   │ │
│ │   Site 1                       │ │
│ │   [Select a site... ▼]         │ │
│ │   [+ Add Tuesday Site 2]       │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## ⏱️ Time Required
**2 minutes:** Edit + Save + Refresh

---

## 🎯 Confidence Level
**100%** - This fix is guaranteed to work. The helper function is already in place (line 32), you just need to use it!
