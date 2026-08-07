# 🔧 FIX: Site 2 Not Showing Selected Value

## ✅ Problem Identified
When selecting Site 2 (or any site after the first one), the dropdown would show "Select a site..." placeholder instead of the selected value, even though the data was correctly saved in formData.

## 🔍 Root Cause
Two issues:

### Issue 1: Visible Count Not Syncing with Array Length
When a user clicked "+ Add Monday Site 2", the `visibleCount` state would increment to 2, showing 2 dropdowns. But if the code then programmatically added a second site to the array (e.g., from form data restore), the `visibleCount` wouldn't automatically expand to match.

### Issue 2: React Not Re-rendering Select Element
The `<select>` element didn't have a `key` prop that changed when the value changed. React's reconciliation algorithm was sometimes reusing the same DOM element, causing the displayed value to be stale even though the `value` prop was correct.

## ✅ Solution Applied

### Fix 1: Auto-Sync Visible Count with Array Length
Added a `useEffect` hook that automatically expands `visibleCount` when the sites array grows:

```typescript
React.useEffect(() => {
  const currentLength = sites.length;
  if (currentLength > visibleCount) {
    console.log(`[ProgressiveSiteSelector] ${day} - Auto-expanding visibleCount from ${visibleCount} to ${currentLength}`);
    setVisibleCount(currentLength);
  }
}, [sites.length, visibleCount, day]);
```

### Fix 2: Add Unique Key to Force Re-render
Added a `key` prop to the `<select>` element that changes when the selected value changes:

```typescript
<select
  key={`select-${index}-${sites[index] || 'empty'}`}
  value={sites[index] || ''}
  ...
>
```

### Fix 3: Added Debug Logging
Added console logs to help diagnose the state:

```typescript
console.log(`[ProgressiveSiteSelector] ${day} render:`, {
  fieldId: field.id,
  currentValue,
  sites,
  visibleCount,
  formDataKeys: Object.keys(formData)
});
```

## 🎯 Expected Behavior After Fix

### Before (Your Screenshot):
```
Monday                    1/4 sites
  Site 1
    [BAMBA ▼]             ← ✅ Shows selected value
    SITE ID: KFI0020
    ZONE: COAST
  
  Site 2
    [Select a site... ▼]  ← ❌ Doesn't show "BASE_TITANIUM"
```

### After (Fixed):
```
Monday                    2/4 sites
  Site 1
    [BAMBA ▼]             ← ✅ Shows selected value
    SITE ID: KFI0020
    ZONE: COAST
  
  Site 2
    [BASE_TITANIUM ▼]     ← ✅ Now shows selected value!
    SITE ID: MSA0123
    ZONE: COAST
    
  [+ Add Monday Site 3]   ← Button to add more sites
```

## 📋 Testing Steps

1. Hard refresh browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. Open Van Weekly Calendar form
3. Select a Van and Week Starting date
4. For Monday:
   - Select Site 1: "BAMBA" → Should show in dropdown ✅
   - Click "+ Add Monday Site 2"
   - Select Site 2: "BASE_TITANIUM" → Should NOW show in dropdown ✅
   - Metadata (SITE ID, ZONE) should appear below Site 2 ✅
5. Try changing Site 2 to a different site → Dropdown should update ✅
6. Click "+ Add Monday Site 3" → Should work ✅
7. Remove Site 2 with red X button → Should work ✅

## 🔍 Debug Output

After the fix, you should see new console logs like:

```
[ProgressiveSiteSelector] Monday render: {
  fieldId: '39502aff-7e5c-4249-818f-427fa35f3765',
  currentValue: ['BAMBA', 'BASE_TITANIUM'],
  sites: ['BAMBA', 'BASE_TITANIUM'],
  visibleCount: 2,
  formDataKeys: [...]
}

[ProgressiveSiteSelector] Monday - Auto-expanding visibleCount from 1 to 2
```

## 📄 Files Modified
- `/components/programs/progressive-site-selector.tsx`
  - Line 45-53: Added debug logging for render state
  - Line 45-51: Added `useEffect` to auto-sync visibleCount
  - Line 139: Added `key` prop to `<select>` element

---

**Fixed by**: Claude (Figma Make AI)  
**Date**: February 18, 2026  
**Issue**: Site 2+ dropdowns not showing selected values  
**Status**: ✅ DEPLOYED - Hard refresh required
