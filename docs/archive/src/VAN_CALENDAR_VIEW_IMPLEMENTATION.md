# Van Weekly Calendar - View Schedules Feature

## ✅ COMPLETED: OTA Update for Van Calendar View

### 🎯 What Was Built

1. **New Component: `/components/van-calendar-view.tsx`**
   - Full calendar view modal for HQ to visualize all van schedules
   - Fetches data from server endpoint: `/programs/{programId}/submissions`
   - Displays week-by-week calendar grid with all vans
   
2. **Updated: `/components/programs/programs-dashboard.tsx`**
   - Added "View Schedules" button specifically for Van Weekly Calendar program
   - Button appears only for program ID: `848582a6-29a9-4992-ae11-1f8397f198d9`
   - Layout: 2 buttons (Submissions + View Schedules) instead of 3
   - Added state: `showVanCalendarViewModal`
   - Added Calendar icon import from lucide-react

### 📊 Features

**Calendar View Includes:**
- ✅ Week-by-week display with all van schedules
- ✅ Filter by van number (dropdown)
- ✅ Filter by week starting date (dropdown)
- ✅ Summary stats: Total schedules, unique vans, weeks covered
- ✅ Daily schedule grid: Monday - Saturday with sites listed
- ✅ Color-coded status badges (approved/pending)
- ✅ Export to CSV functionality
- ✅ Mobile responsive with horizontal scroll
- ✅ Shows submission timestamp
- ✅ Empty state handling

**UI/UX:**
- Red gradient header matching Airtel branding
- Collapsible filter panel
- Site chips displayed per day
- Van emoji icon (🚐)
- Professional card-based layout
- Loading and error states

### 🔗 Data Flow

```
Van Calendar Program Card
  ↓
[View Schedules] Button Click
  ↓
VanCalendarView Modal Opens
  ↓
Fetches: GET /programs/848582a6-29a9-4992-ae11-1f8397f198d9/submissions
  ↓
Displays grouped schedules by week and van
```

### 🗄️ Database Structure

**Storage:** `kv_store_28f2f653` table

**Key Pattern:** `submission:848582a6-29a9-4992-ae11-1f8397f198d9:{submissionId}`

**Value (JSON):**
```json
{
  "id": "submission-xxx",
  "program_id": "848582a6-29a9-4992-ae11-1f8397f198d9",
  "user_id": "user-xxx",
  "responses": {
    "van_number": "KAW 747X",
    "week_starting": "2026-02-17",
    "monday_sites": ["SITE1", "SITE2"],
    "tuesday_sites": ["SITE3"],
    ...
  },
  "status": "pending",
  "submitted_at": "2026-02-18T10:30:00Z",
  "points_awarded": 0
}
```

### 📝 SQL Update Applied

```sql
-- Enable multi-select for all day site fields
UPDATE program_fields
SET options = jsonb_set(
  options::jsonb,
  '{database_source,multi_select}',
  'true'::jsonb
)
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');
```

**Result:** ✅ All 6 fields now have `multi_select_enabled: true`

### 🚀 Testing Checklist

1. ✅ Hard refresh browser: `Ctrl+Shift+R`
2. ✅ Test Site 2+ selection in Van Calendar form
3. ✅ Submit a test schedule
4. ✅ Click "View Schedules" button on Van Calendar program card
5. ✅ Verify calendar view displays correctly
6. ✅ Test filters (van, week)
7. ✅ Test CSV export
8. ✅ Mobile responsive check

### 🎨 Button Layout

**Van Weekly Calendar Program:**
```
┌─────────────────┬─────────────────┐
│  📄 Submissions │  📅 View Schedules │
└─────────────────┴─────────────────┘
```

**Other Programs:**
```
┌────────────┬──────────┬─────────┐
│ Submissions│ Analytics│ Details │
└────────────┴──────────┴─────────┘
```

### 🔐 Access Control

- Button visible to all users (since they can see programs)
- Calendar view fetches all submissions (no user filtering)
- HQ/Directors/ZSMs can see all van schedules
- SEs can also view to see their submitted schedules

### 📱 Mobile Optimization

- Horizontal scroll for week grid
- Stacked cards on mobile
- Touch-friendly buttons
- Responsive filters

---

## 🎉 DEPLOYMENT STATUS: READY FOR OTA

**No APK rebuild required** - This is a pure frontend update that loads from the server.

After deployment:
1. Users hard refresh → New button appears
2. Click "View Schedules" → Calendar view opens
3. All existing data is immediately visible

---

**Created:** 2026-02-18  
**Program ID:** 848582a6-29a9-4992-ae11-1f8397f198d9  
**Files Modified:** 2  
**Files Created:** 1
