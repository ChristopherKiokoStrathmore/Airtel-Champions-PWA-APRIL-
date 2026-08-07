# VAN CALENDAR: 4 SITES PER DAY WITH PROGRESSIVE UI

## What Changed

**BEFORE:**
- Each day had 1 multi-select field (e.g., "Monday Sites")
- You could select multiple sites but **no order/sequence**

**AFTER:**
- Each day starts with 1 dropdown, with "+ Add Another Site" button
- **Progressive Disclosure**: Click to reveal sites 2, 3, and 4 as needed
- **Order matters** - Site 1 is visited first, then Site 2, etc.
- **Clean UI** - Only shows dropdowns you need

---

## User Experience

When creating a Van Calendar plan:

1. **Initial View**: Each day shows just 1 site dropdown
2. **Adding Sites**: Click "+ Add Another Site" to reveal Site 2
3. **Up to 4 Sites**: Keep clicking to add Site 3 and Site 4
4. **Removing Sites**: Click "Remove" to hide the last site
5. **Optional Days**: Skip any day you don't need

**Example Monday:**
```
📅 Monday [1 site]
  Site 1: [Select a site...] ▼
  [+ Add Another Site]

After clicking "Add":
📅 Monday [2 sites]
  Site 1: NAIROBI WEST
  Site 2: [Select a site...] ▼
  [+ Add Another Site] [Remove]
```

---

## How to Apply This Change

### Step 1: Run the GPS Toggle Migration (if not already done)
1. Open Supabase SQL Editor
2. Copy and paste contents of `/ADD_GPS_TOGGLE_COLUMN.sql`
3. Click "Run"
4. ✅ Verify: Check that `gps_auto_detect_enabled` column exists

### Step 2: Update Van Calendar Fields
1. Open Supabase SQL Editor
2. Copy and paste contents of `/VAN_CALENDAR_4_SITES_PER_DAY.sql`
3. Click "Run"
4. ✅ Verify: Run this query to confirm:
```sql
SELECT COUNT(*) as total_fields 
FROM program_fields 
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9';
```
**Expected result:** 26 fields total
- 2 base fields (van_selection, week_start_date)
- 24 site fields (4 sites × 6 days)

### Step 3: Test in the App
1. Refresh your browser
2. Click on "🚐 Van Weekly Calendar" program
3. ✅ You should now see:
   - Select Van (dropdown)
   - Week Starting (date picker)
   - **Weekly Route Planning** section header
   - **📅 Monday** with just 1 site dropdown initially
   - **"+ Add Another Site"** button
   - Click it to reveal Site 2, 3, and 4 progressively
   - **"Remove"** button appears when you have 2+ sites
   - Same pattern repeats for Tuesday through Saturday

---

## Benefits

✅ **Route Order** - Site 1 → Site 2 → Site 3 → Site 4 shows visit sequence  
✅ **Flexible** - Can fill 1, 2, 3, or 4 sites per day  
✅ **Clear Capacity** - Max 4 sites per van per day  
✅ **Driver-Friendly** - Easy to see the route order  
✅ **Optional** - Not all days need to be filled  

---

## Example Usage

**Monday Planning:**
- Monday - Site 1: "NAIROBI WEST"
- Monday - Site 2: "SOUTH B MARKET"
- Monday - Site 3: "LANGATA"
- Monday - Site 4: (leave empty)

**Tuesday Planning:**
- Tuesday - Site 1: "KILIMANI"
- Tuesday - Site 2: "WESTLANDS"
- Tuesday - Site 3: "PARKLANDS"
- Tuesday - Site 4: "MUTHAIGA"

---

## Troubleshooting

**Problem:** Still seeing "Monday Sites" multi-select  
**Solution:** Clear browser cache and refresh (Ctrl+Shift+R)

**Problem:** Dropdowns show "No sitewise available"  
**Solution:** Check console logs - this is the debugging we're working on

**Problem:** Can't submit form  
**Solution:** Only van_selection and week_start_date are required. All site fields are optional.

---

## Database Field Structure

```
Van Calendar Fields (26 total):
├── van_selection (dropdown, required)
├── week_start_date (date, required)
├── monday_site_1 (dropdown, optional)
├── monday_site_2 (dropdown, optional)
├── monday_site_3 (dropdown, optional)
├── monday_site_4 (dropdown, optional)
├── tuesday_site_1 (dropdown, optional)
├── tuesday_site_2 (dropdown, optional)
├── tuesday_site_3 (dropdown, optional)
├── tuesday_site_4 (dropdown, optional)
├── wednesday_site_1 (dropdown, optional)
├── wednesday_site_2 (dropdown, optional)
├── wednesday_site_3 (dropdown, optional)
├── wednesday_site_4 (dropdown, optional)
├── thursday_site_1 (dropdown, optional)
├── thursday_site_2 (dropdown, optional)
├── thursday_site_3 (dropdown, optional)
├── thursday_site_4 (dropdown, optional)
├── friday_site_1 (dropdown, optional)
├── friday_site_2 (dropdown, optional)
├── friday_site_3 (dropdown, optional)
├── friday_site_4 (dropdown, optional)
├── saturday_site_1 (dropdown, optional)
├── saturday_site_2 (dropdown, optional)
├── saturday_site_3 (dropdown, optional)
└── saturday_site_4 (dropdown, optional)
```

---

## GPS Auto-Detect Feature

As a bonus, you can now toggle GPS auto-detect on/off for any program:

1. Go to Programs Dashboard
2. Edit any program
3. Go to "Settings" tab
4. Toggle "📍 Enable GPS Auto-Detect Button"
5. When disabled, submission forms won't show the location button

**Van Calendar has GPS disabled by default** since it's planning, not field work.
