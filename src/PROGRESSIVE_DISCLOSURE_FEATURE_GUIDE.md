# Progressive Disclosure Feature - Complete Guide

## 🎯 What Is This?

A **configurable toggle** in the Program Creator that lets HQ enable/disable progressive disclosure UI for multi-field patterns.

---

## 📋 Quick Summary

**Before:** Van Calendar showed all 24 fields at once (6 days × 4 sites = 24 dropdowns)  
**After:** Shows 1 site per day with "+ Add Another Site" button (6 fields initially, expand as needed)

✅ **It's now a toggle!** You can turn it ON or OFF for each program individually.

---

## 🔧 Setup (One-Time)

### Step 1: Add Database Column

Run this SQL in Supabase SQL Editor:

```sql
-- Add the toggle column to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS progressive_disclosure_enabled BOOLEAN DEFAULT FALSE;
```

📁 **Full migration file:** `/ADD_PROGRESSIVE_DISCLOSURE_COLUMN.sql`

### Step 2: Deploy Code

- Build your React app: `npm run build`
- Upload to your web server
- ✅ No APK rebuild needed - over-the-air update!

### Step 3: Refresh Browser

- All 662 users will get the update when they open the app
- Existing programs work normally (progressive disclosure OFF by default)

---

## 🎛️ How To Use

### For HQ: Enabling Progressive Disclosure

1. **Go to Programs**
2. **Edit a program** (e.g., "🚐 Van Weekly Calendar")
3. **Click Settings tab**
4. **Scroll down** to see:

```
┌─────────────────────────────────────────────────┐
│ 🎯 Enable Progressive Disclosure UI            │
│ ☑️ Multi-field patterns will show 1 field      │
│    initially with "+ Add Another" buttons      │
│                                                 │
│ ✨ How It Works:                                │
│  • Van Calendar: Shows 1 site per day          │
│  • Reduces visual clutter                      │
│  • Users add only what they need (1-4 sites)   │
│  • Better mobile experience                    │
└─────────────────────────────────────────────────┘
```

5. **Check the box** to enable
6. **Save program**
7. **Done!** Users will now see progressive UI

---

## 📱 User Experience

### When Progressive Disclosure is **ENABLED** ✅

**Initial View:**
```
🚐 Weekly Route Planning
Select up to 4 sites per day

📅 Monday [1 site]
  Site 1: [Select a site...] ▼
  [+ Add Another Site]

📅 Tuesday [1 site]
  Site 1: [Select a site...] ▼
  [+ Add Another Site]
```

**After Clicking "+ Add Another Site":**
```
📅 Monday [2 sites]
  Site 1: NAIROBI WEST
  Site 2: [Select a site...] ▼
  [+ Add Another Site] [Remove]
```

**Benefits:**
- ✅ Clean UI (6 fields vs 24)
- ✅ Less scrolling
- ✅ Better mobile UX
- ✅ Users add only what they need

---

### When Progressive Disclosure is **DISABLED** ❌

**Traditional View:**
```
🚐 Weekly Route Planning

📅 Monday
  Monday - Site 1: [Select a site...] ▼
  Monday - Site 2: [Select a site...] ▼
  Monday - Site 3: [Select a site...] ▼
  Monday - Site 4: [Select a site...] ▼

📅 Tuesday
  Tuesday - Site 1: [Select a site...] ▼
  Tuesday - Site 2: [Select a site...] ▼
  Tuesday - Site 3: [Select a site...] ▼
  Tuesday - Site 4: [Select a site...] ▼
  
... (same for Wed-Sat)
```

**Benefits:**
- ✅ See all 24 slots at once
- ✅ No clicking "Add" buttons
- ✅ Good for power users who fill all 4 sites every time

---

## 🆚 When To Use Each Mode

| Use Progressive Disclosure ✅ | Use Traditional View ❌ |
|------------------------------|------------------------|
| Users usually fill 1-2 sites per day | Users always fill all 4 sites |
| Mobile-first experience | Desktop-heavy usage |
| Clean, minimal UI preferred | Power users who want to see everything |
| First-time users (less overwhelming) | Experienced users |
| Van route planning (flexible schedules) | Fixed daily schedules |

---

## 🔍 Technical Details

### Database

**Column:** `programs.progressive_disclosure_enabled`  
**Type:** `BOOLEAN`  
**Default:** `FALSE` (backward compatible)  

### Files Modified

1. **`/components/programs/program-creator-enhanced.tsx`**
   - Added state variable
   - Added UI toggle in Settings tab
   - Saves to database on create/update

2. **`/components/programs/program-submit-modal.tsx`**
   - Checks `program.progressive_disclosure_enabled`
   - Conditionally skips site fields from main loop
   - Renders VanCalendarSiteSelector if enabled
   - Shows traditional fields if disabled

3. **`/components/programs/van-calendar-site-selector.tsx`** (NEW)
   - Reusable progressive disclosure component
   - Tracks visible site count (1-4)
   - Add/Remove buttons
   - Day header with site counter

### Files Created

1. **`/ADD_PROGRESSIVE_DISCLOSURE_COLUMN.sql`** - Database migration
2. **`/PROGRESSIVE_DISCLOSURE_FEATURE_GUIDE.md`** - This guide
3. **`/VAN_CALENDAR_PROGRESSIVE_UI_SUMMARY.md`** - Technical summary

---

## 🧪 Testing

### Test Case 1: Progressive Disclosure ON

1. Edit Van Calendar → Settings → Enable "Progressive Disclosure UI"
2. Save program
3. Open Van Calendar submission form
4. ✅ Should see 1 site dropdown per day
5. ✅ Click "+ Add Another Site"
6. ✅ Site 2 dropdown appears
7. ✅ Click again → Site 3 appears
8. ✅ Click again → Site 4 appears
9. ✅ "+ Add Another Site" button disappears (max 4)
10. ✅ "Remove" button works to hide last site

### Test Case 2: Progressive Disclosure OFF

1. Edit Van Calendar → Settings → Disable "Progressive Disclosure UI"
2. Save program
3. Open Van Calendar submission form
4. ✅ Should see ALL 4 site dropdowns for each day (24 total fields)
5. ✅ No "+ Add Another Site" buttons
6. ✅ Traditional dropdown labels: "Monday - Site 1", "Monday - Site 2", etc.

### Test Case 3: Backward Compatibility

1. Create a NEW program (don't touch progressive toggle)
2. Add fields named `monday_site_1`, `monday_site_2`, etc.
3. Save program
4. Open submission form
5. ✅ Should show traditional view (all 4 sites visible)
6. ✅ Default is FALSE, so existing behavior preserved

---

## 🎨 UI Customization

The progressive disclosure toggle in Settings tab uses:

- **Color:** Purple/Pink gradient
- **Icon:** 🎯
- **Title:** "Enable Progressive Disclosure UI"
- **Help Text:** Explains what happens when enabled/disabled

You can customize this in `/components/programs/program-creator-enhanced.tsx` (search for "Progressive Disclosure Toggle")

---

## 🚀 Future Use Cases

This feature is **reusable** for other multi-field patterns:

### Example 1: Product Comparison Form
```
Field Pattern: product_1, product_2, product_3
Progressive UI: Start with Product 1, add up to 3
```

### Example 2: Competitor Analysis
```
Field Pattern: competitor_1, competitor_2, competitor_3, competitor_4
Progressive UI: Start with 1 competitor, expand as needed
```

### Example 3: Team Member Attendance
```
Field Pattern: member_1, member_2, ..., member_10
Progressive UI: Start with 1 member, add up to 10
```

**To support new patterns:** Update the regex in `program-submit-modal.tsx` to detect your field naming pattern, then create a custom selector component or reuse `VanCalendarSiteSelector`.

---

## ❓ FAQ

### Q: Will this break existing Van Calendar submissions?
**A:** No! Default is OFF (traditional view). Only programs you explicitly enable will use progressive UI.

### Q: Can I enable it for some programs and not others?
**A:** Yes! It's per-program. Enable for Van Calendar, leave OFF for other programs.

### Q: What if a user submits with progressive disclosure but only fills Site 1?
**A:** That's fine! All site fields are optional. Sites 2-4 will be empty in the database.

### Q: Can users still fill all 4 sites with progressive disclosure ON?
**A:** Yes! They click "+ Add Another Site" 3 times to reveal all 4 sites, then fill them.

### Q: Does this require APK rebuild?
**A:** NO! Pure frontend change. Over-the-air update only.

### Q: What if I have 50 programs with site fields?
**A:** You'd need to manually enable the toggle for each one in Settings. Or run SQL:
```sql
UPDATE programs 
SET progressive_disclosure_enabled = TRUE 
WHERE title LIKE '%Van%' OR title LIKE '%Calendar%';
```

### Q: Can I set a different default (e.g., TRUE for new programs)?
**A:** Yes! Change default in code:
```typescript
// In program-creator-enhanced.tsx
const [progressiveDisclosureEnabled, setProgressiveDisclosureEnabled] = useState(
  editingProgram?.progressive_disclosure_enabled !== undefined 
    ? editingProgram.progressive_disclosure_enabled 
    : true  // ← Change this to TRUE
);
```

---

## 🎯 Recommendation

For **Van Weekly Calendar**:
- ✅ **Enable progressive disclosure** - Most ZSMs don't fill all 4 sites every day
- ✅ Cleaner mobile experience
- ✅ Reduces cognitive load

For **Daily Shop Visits** (if you have a similar pattern):
- ❌ **Keep traditional view** - Sales Executives often visit all 4 shops
- ❌ They prefer seeing all slots at once

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Database Column | ✅ Ready to add |
| Frontend Code | ✅ Complete |
| UI Toggle | ✅ In Settings tab |
| Progressive Component | ✅ Created |
| Backward Compatible | ✅ Default OFF |
| APK Rebuild Required | ❌ No - OTA update |
| Documentation | ✅ This guide |

**Next Step:** Run the SQL migration and enable the toggle for Van Calendar!
