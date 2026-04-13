# Van Calendar Fix - February 17, 2026

## Issues Fixed

### 1. ❌ 404 Error - "Van not found"

**ROOT CAUSE:** Wrong Supabase project ID in `/utils/supabase/info.tsx`

The file was pointing to:
- **Old (Wrong):** `mcbbtrrhqweypfnlzwht.supabase.co`
- **New (Correct):** `xspogpfohjmkykfjadhk.supabase.co`

This caused all server requests to fail with 404 because the function was deployed to the **correct** project, but the frontend was calling the **wrong** project.

**File Changed:** `/utils/supabase/info.tsx`

```tsx
// BEFORE
export const projectId = "mcbbtrrhqweypfnlzwht"

// AFTER  
export const projectId = "xspogpfohjmkykfjadhk"
```

---

### 2. ❌ Duplicate Site Selection Allowed

**ROOT CAUSE:** No validation to prevent the same site from being selected multiple times

The logs showed:
```
[Van Calendar Site] ✅ Site selected: {siteId: 'NUA0011', siteName: 'ABERDARE_MIKEU', zone: 'ABERDARE'}
[Van Calendar Site] ✅ Site selected: {siteId: 'NUA0011', siteName: 'ABERDARE_MIKEU', zone: 'ABERDARE'}
[Van Calendar Site] ✅ Site selected: {siteId: 'NUA0011', siteName: 'ABERDARE_MIKEU', zone: 'ABERDARE'}
```

Same site selected **3 times**!

**File Changed:** `/components/van-calendar-form.tsx`

**Added validation** before submission:
1. Collects all site IDs from working days
2. Detects duplicates
3. Shows clear error message listing duplicate sites
4. Prevents form submission

```tsx
// NEW VALIDATION CODE
const allSiteIds: string[] = [];
const duplicates: string[] = [];

workingDays.forEach(day => {
  day.sites.forEach(site => {
    if (allSiteIds.includes(site.site_id)) {
      if (!duplicates.includes(site.site_name)) {
        duplicates.push(site.site_name);
      }
    } else {
      allSiteIds.push(site.site_id);
    }
  });
});

if (duplicates.length > 0) {
  alert(`⚠️ Duplicate sites detected!\n\nThe following site(s) are selected multiple times:\n• ${duplicates.join('\n• ')}\n\nPlease ensure each site is only selected once across the entire week.`);
  return;
}
```

---

## Why These Errors Were Repeating

The **wrong Supabase project ID** meant:
1. Every submission attempt went to the wrong server
2. Got 404 errors
3. No code changes would fix it because the **server was working fine** - the client was just calling the wrong URL

The **duplicate site issue** was a missing business rule that should have been caught during initial development.

---

## Testing

### ✅ Test 1: Correct Server Connection
1. Open Van Calendar
2. Select a van
3. Submit - should now work (no 404)

### ✅ Test 2: Duplicate Prevention
1. Select a site on Sunday
2. Try to select the **same site** on Monday
3. Click Submit
4. Should see error: "⚠️ Duplicate sites detected!"

---

## Files Modified

1. `/utils/supabase/info.tsx` - Fixed Supabase project ID
2. `/components/van-calendar-form.tsx` - Added duplicate site validation
