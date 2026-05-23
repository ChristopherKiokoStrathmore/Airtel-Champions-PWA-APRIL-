# Van Calendar: Progressive Site Selection UI ✅

## Summary

I've successfully implemented a **progressive disclosure UI** for Van Calendar's 4-sites-per-day feature!

---

## What You Get

### 📱 Clean, Progressive Interface

**Initial State:**
```
🚐 Van Weekly Calendar

Select Van: [KBW 123A] ▼
Week Starting: [2026-02-17]

───────────────────────────────────
🚐 Weekly Route Planning
Select up to 4 sites per day
───────────────────────────────────

📅 Monday [1 site]
  Site 1: [Select a site...] ▼
  [+ Add Another Site]

📅 Tuesday [1 site]
  Site 1: [Select a site...] ▼
  [+ Add Another Site]

... (same for Wed-Sat)
```

**After Adding Sites:**
```
📅 Monday [3 sites]
  Site 1: NAIROBI WEST
  Site 2: SOUTH B MARKET
  Site 3: [Select a site...] ▼
  [+ Add Another Site] [Remove]
```

---

## Features

✅ **Progressive Disclosure** - Start with 1 site, reveal more as needed  
✅ **Visual Counter** - Badge shows how many sites are visible  
✅ **Add Button** - Green "+ Add Another Site" button (max 4)  
✅ **Remove Button** - Gray "Remove" button (min 1)  
✅ **Clean Layout** - Day header with gradient styling  
✅ **Site Count** - Shows available sites below each dropdown  
✅ **Loading States** - Spinner while loading site data  

---

## Files Changed

### New Files:
1. **`/components/programs/van-calendar-site-selector.tsx`**
   - New reusable component for progressive site selection
   - Handles add/remove logic
   - Displays 1-4 sites per day

### Modified Files:
1. **`/components/programs/program-submit-modal.tsx`**
   - Added import for VanCalendarSiteSelector
   - Filters out site fields from main loop
   - Renders Van Calendar section separately with progressive UI
   - Groups fields by day (Monday-Saturday)

2. **`/VAN_CALENDAR_4_SITES_INSTRUCTIONS.md`**
   - Updated to reflect new progressive UI

### SQL Files (Already Created):
1. **`/VAN_CALENDAR_4_SITES_PER_DAY.sql`** - Database migration
2. **`/ADD_GPS_TOGGLE_COLUMN.sql`** - GPS toggle feature

---

## How It Works

### Database Structure (Unchanged)
- Still 4 fields per day in database: `monday_site_1`, `monday_site_2`, etc.
- All fields remain optional

### Frontend Logic (New)
1. **VanCalendarSiteSelector Component**:
   - Tracks `visibleCount` state (1-4)
   - Shows only the first N sites based on `visibleCount`
   - Add button increments counter (max 4)
   - Remove button decrements counter and clears field (min 1)

2. **ProgramSubmitModal Integration**:
   - Detects site fields with regex: `/^(monday|tuesday|wednesday|thursday|friday|saturday)_site_\d+$/`
   - Skips them in main field loop
   - Groups by day and passes to VanCalendarSiteSelector
   - All database dropdown loading logic works automatically

---

## User Flow

1. **ZSM opens Van Calendar form**
2. **Sees Monday with 1 site dropdown**
3. **Selects "NAIROBI WEST"**
4. **Clicks "+ Add Another Site"**
5. **Site 2 dropdown appears**
6. **Selects "SOUTH B MARKET"**
7. **Continues until done (max 4 sites)**
8. **Can click "Remove" to hide last site**
9. **Moves to Tuesday and repeats**
10. **Submits form when all days are planned**

---

## Benefits vs. Showing All 4 at Once

| Showing All 4 Fields | Progressive Disclosure |
|---------------------|----------------------|
| ❌ Cluttered (24 dropdowns) | ✅ Clean (6 days, 1 field each) |
| ❌ Overwhelming UI | ✅ Simple, focused |
| ❌ Unnecessary scrolling | ✅ Minimal scrolling |
| ❌ Harder to understand | ✅ Self-explanatory |
| ✅ See all slots upfront | ⚠️ Need to click to reveal |

---

## Next Steps

1. **Run the SQL migrations** (if not already done):
   ```sql
   -- Run these in Supabase SQL Editor
   -- 1. GPS toggle
   -- 2. Van Calendar 4 sites per day
   ```

2. **Refresh your browser**

3. **Test Van Calendar**:
   - Open program
   - See Monday with 1 site
   - Click "+ Add Another Site"
   - Verify Site 2 appears
   - Test Remove button
   - Submit form

4. **Verify submission**:
   - Check that all selected sites are saved correctly
   - View submission in analytics

---

## Technical Notes

- ✅ **Over-the-air update** - No APK rebuild needed
- ✅ **Component reusable** - Can be used for other multi-slot features
- ✅ **State management** - Each day tracks its own visible count independently
- ✅ **Data integrity** - Removing a site clears its value from formData
- ✅ **Responsive** - Works on mobile and web

---

## Troubleshooting

**Q: Sites not loading?**  
A: Check console for database dropdown errors. Verify sitewise table has data.

**Q: Can't add more than 2 sites?**  
A: Check that all 4 site fields exist in database for that day.

**Q: Remove button not working?**  
A: Verify field IDs match between database and form state.

**Q: Form won't submit?**  
A: Only van_selection and week_start_date are required. All sites are optional.

---

## Code Structure

```
program-submit-modal.tsx
├── State: visibleSites (removed - now in VanCalendarSiteSelector)
├── Field Loop
│   ├── Skip site fields (return null)
│   └── Render other fields normally
└── Van Calendar Section
    ├── Filter site fields by regex
    ├── Group by day
    └── Render VanCalendarSiteSelector for each day
        ├── Track visibleCount (1-4)
        ├── Show visible sites
        ├── Add/Remove buttons
        └── Update formData on change
```

Perfect implementation! 🎉
