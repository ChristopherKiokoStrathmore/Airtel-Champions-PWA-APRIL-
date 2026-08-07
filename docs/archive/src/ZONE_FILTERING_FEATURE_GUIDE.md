# Zone Filtering Feature - Complete Guide

## 🎯 What Is This?

A **zone-based filtering toggle** that locks database dropdowns (like site selection) to only show items within the user's zone. Perfect for Van Calendar and zone-specific programs!

---

## 📋 Quick Summary

**Before:** All users see ALL sites across ALL zones (NAIROBI, MOMBASA, COAST, WESTERN, etc.)  
**After:** Users only see sites in THEIR zone (e.g., NAIROBI users only see NAIROBI sites)

✅ **It's a toggle!** You can turn it ON or OFF for each program individually.

---

## 🔧 Setup (One-Time)

### Step 1: Add Database Column

Run this SQL in Supabase SQL Editor:

```sql
-- Add the toggle column to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS zone_filtering_enabled BOOLEAN DEFAULT FALSE;
```

📁 **Full migration file:** `/ADD_ZONE_FILTERING_COLUMN.sql`

### Step 2: Verify Zone Data Exists

**Check if users have zones:**
```sql
SELECT zone, COUNT(*) as user_count
FROM app_users
WHERE zone IS NOT NULL
GROUP BY zone
ORDER BY user_count DESC;
```

**Expected result:**
```
zone      | user_count
----------|------------
NAIROBI   | 250
COAST     | 150
WESTERN   | 100
MOMBASA   | 80
...
```

**Check if sitewise has zones:**
```sql
SELECT zone, COUNT(*) as site_count
FROM sitewise
WHERE zone IS NOT NULL
GROUP BY zone
ORDER BY site_count DESC;
```

**Expected result:**
```
zone      | site_count
----------|------------
NAIROBI   | 45
COAST     | 30
WESTERN   | 28
MOMBASA   | 25
...
```

⚠️ **Important:** If `app_users.zone` or `sitewise.zone` is missing, zone filtering won't work. You'll need to populate these fields first.

### Step 3: Deploy Code

- Build your React app: `npm run build`
- Upload to your web server
- ✅ No APK rebuild needed - over-the-air update!

### Step 4: Refresh Browser

- All 662 users will get the update when they open the app
- Existing programs work normally (zone filtering OFF by default)

---

## 🎛️ How To Use

### For HQ: Enabling Zone Filtering

1. **Go to Programs**
2. **Edit a program** (e.g., "🚐 Van Weekly Calendar")
3. **Click Settings tab**
4. **Scroll down** to see:

```
┌─────────────────────────────────────────────────┐
│ 🔒 Lock Dropdowns to User's Zone               │
│ ☑️ Database dropdowns will ONLY show items     │
│    from the user's zone                         │
│                                                 │
│ 🔒 How Zone Filtering Works:                   │
│  • Van Calendar: ZSMs only see sites in zone   │
│  • Prevents cross-zone selection errors        │
│  • Faster dropdown loading (fewer items)       │
│  • Example: NAIROBI users only see NAIROBI     │
└─────────────────────────────────────────────────┘
```

5. **Check the box** to enable
6. **Save program**
7. **Done!** Users will now see zone-filtered dropdowns

---

## 📱 User Experience

### When Zone Filtering is **ENABLED** ✅

**Example: ZSM in NAIROBI zone submits Van Calendar**

```
🚐 Van Weekly Calendar

Van Selection: [Select van...] ▼
  ↓ Dropdown shows:
  - KBW 123A (NAIROBI) ✅
  - KBW 456B (NAIROBI) ✅
  - KBW 789C (NAIROBI) ✅
  ❌ Does NOT show vans from MOMBASA, COAST, etc.

📅 Monday
  Site 1: [Select site...] ▼
    ↓ Dropdown shows:
    - NAIROBI WEST ✅
    - SOUTH B MARKET ✅
    - EASTLEIGH MALL ✅
    ❌ Does NOT show sites from other zones
```

**Benefits:**
- ✅ Users can't accidentally select wrong zone's sites
- ✅ Faster dropdown (45 sites instead of 300+)
- ✅ Less scrolling through irrelevant items
- ✅ Zone-specific planning enforced

---

### When Zone Filtering is **DISABLED** ❌

**Example: Same ZSM in NAIROBI zone**

```
🚐 Van Weekly Calendar

Van Selection: [Select van...] ▼
  ↓ Dropdown shows:
  - KBW 123A (NAIROBI) ✅
  - KBW 456B (NAIROBI) ✅
  - KCA 789D (MOMBASA) ✅
  - KCB 234E (COAST) ✅
  - KDA 567F (WESTERN) ✅
  ... (ALL vans across ALL zones)

📅 Monday
  Site 1: [Select site...] ▼
    ↓ Dropdown shows:
    - NAIROBI WEST (NAIROBI) ✅
    - MOMBASA CBD (MOMBASA) ✅
    - KISUMU MARKET (WESTERN) ✅
    - NAKURU TOWN (RIFT VALLEY) ✅
    ... (ALL sites across ALL zones)
```

**Benefits:**
- ✅ HQ Command Center can see all zones
- ✅ Useful for regional reports
- ✅ Directors can view cross-zone data

---

## 🆚 When To Use Each Mode

| Enable Zone Filtering ✅ | Disable Zone Filtering ❌ |
|--------------------------|---------------------------|
| Van Calendar (ZSM planning) | HQ Command Center reports |
| Zone-specific shop visits | Regional analysis programs |
| Territory-based programs | Director-level submissions |
| Prevent cross-zone errors | Cross-zone comparison tools |
| Sales Executives (single zone) | Users with multi-zone access |

---

## 🔍 Technical Details

### How It Works

**1. User Opens Submission Form:**
```typescript
// Fetch user's zone from database
const { data: userData } = await supabase
  .from('app_users')
  .select('zone')
  .eq('id', userId)
  .single();

// Example: userData.zone = "NAIROBI"
```

**2. Load Database Dropdown (e.g., sitewise):**

**Without Zone Filtering:**
```typescript
const { data } = await supabase
  .from('sitewise')
  .select('*')
  .order('site_name');

// Returns: 300+ sites across all zones
```

**With Zone Filtering:**
```typescript
const { data } = await supabase
  .from('sitewise')
  .select('*')
  .eq('zone', userZone) // Filter by user's zone
  .order('site_name');

// Returns: Only 45 sites in NAIROBI zone
```

### Database Schema

**programs table:**
```sql
CREATE TABLE programs (
  ...
  zone_filtering_enabled BOOLEAN DEFAULT FALSE
);
```

**app_users table (must have zone):**
```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY,
  full_name TEXT,
  zone TEXT,  -- e.g., 'NAIROBI', 'MOMBASA', 'COAST'
  ...
);
```

**sitewise table (must have zone):**
```sql
CREATE TABLE sitewise (
  id UUID PRIMARY KEY,
  site_name TEXT,
  zone TEXT,  -- e.g., 'NAIROBI', 'MOMBASA', 'COAST'
  ...
);
```

### Files Modified

1. **`/components/programs/program-creator-enhanced.tsx`**
   - Added state variable: `zoneFilteringEnabled`
   - Added UI toggle in Settings tab (green/teal gradient)
   - Saves to database on create/update

2. **`/components/programs/program-submit-modal.tsx`**
   - Fetches `program.zone_filtering_enabled`
   - Fetches current user's zone from `app_users`
   - Adds `.eq('zone', userZone)` to database queries when enabled

### Files Created

1. **`/ADD_ZONE_FILTERING_COLUMN.sql`** - Database migration
2. **`/ZONE_FILTERING_FEATURE_GUIDE.md`** - This guide

---

## 🧪 Testing

### Test Case 1: Zone Filtering ON (NAIROBI User)

1. **Setup:**
   - Login as a user with `zone = 'NAIROBI'`
   - Edit Van Calendar → Settings → Enable "Lock Dropdowns to User's Zone"
   - Save program

2. **Test:**
   - Open Van Calendar submission form
   - Click "Van Selection" dropdown
   - ✅ Should only see vans with `zone = 'NAIROBI'`
   - ❌ Should NOT see vans from MOMBASA, COAST, etc.

3. **Test Site Dropdowns:**
   - Click "Monday - Site 1" dropdown
   - ✅ Should only see sites with `zone = 'NAIROBI'`
   - Count items: Should be ~45 sites (not 300+)

4. **Submit Form:**
   - Fill out form with NAIROBI-only selections
   - Click Submit
   - ✅ Should save successfully

### Test Case 2: Zone Filtering OFF (Same User)

1. **Setup:**
   - Edit Van Calendar → Settings → Disable "Lock Dropdowns to User's Zone"
   - Save program

2. **Test:**
   - Open Van Calendar submission form
   - Click "Van Selection" dropdown
   - ✅ Should see ALL vans (NAIROBI, MOMBASA, COAST, etc.)
   - Count items: Should be all 19 vans

3. **Test Site Dropdowns:**
   - Click "Monday - Site 1" dropdown
   - ✅ Should see ALL sites across all zones
   - Count items: Should be 300+ sites

### Test Case 3: User with No Zone Assigned

1. **Setup:**
   - Create test user with `zone = NULL`
   - Enable zone filtering for Van Calendar

2. **Test:**
   - Login as test user
   - Open Van Calendar
   - ✅ Dropdowns should be empty (no items)
   - Console warning: "User has no zone assigned"

3. **Fix:**
   - Assign zone to user: `UPDATE app_users SET zone = 'NAIROBI' WHERE id = '...'`
   - Refresh browser
   - ✅ Dropdowns now show NAIROBI items

### Test Case 4: HQ Command Center User

1. **Recommendation:**
   - HQ users typically need to see ALL zones
   - Keep zone filtering **OFF** for HQ-only programs

2. **Alternative:**
   - Create separate "HQ Dashboard" program without zone filtering
   - Keep "Van Calendar" for ZSMs with zone filtering ON

---

## 🚀 Advanced: Multi-Table Zone Support

If you have multiple database tables with zones:

### sitewise Table
```sql
-- Already has zone column
SELECT * FROM sitewise WHERE zone = 'NAIROBI';
```

### van_db Table
```sql
-- Add zone column if missing
ALTER TABLE van_db ADD COLUMN zone TEXT;

-- Populate zones
UPDATE van_db SET zone = 'NAIROBI' WHERE van_reg_no LIKE 'KBW%';
UPDATE van_db SET zone = 'MOMBASA' WHERE van_reg_no LIKE 'KCA%';
UPDATE van_db SET zone = 'COAST' WHERE van_reg_no LIKE 'KCB%';
```

### amb_shops Table
```sql
-- Add zone column if missing
ALTER TABLE amb_shops ADD COLUMN zone TEXT;

-- Populate zones from site data
UPDATE amb_shops a
SET zone = s.zone
FROM sitewise s
WHERE a.site_name = s.site_name;
```

---

## ❓ FAQ

### Q: Will this break existing programs?
**A:** No! Default is OFF. Only programs you explicitly enable will use zone filtering.

### Q: What if my users don't have zones assigned?
**A:** They'll see empty dropdowns. Assign zones first:
```sql
UPDATE app_users SET zone = 'NAIROBI' WHERE full_name LIKE '%Nairobi%';
```

### Q: What if my sitewise table doesn't have a zone column?
**A:** Add it:
```sql
ALTER TABLE sitewise ADD COLUMN zone TEXT;
-- Then populate zones manually or via import
```

### Q: Can I use a different column name (e.g., 'region' instead of 'zone')?
**A:** Yes! Update the code in `program-submit-modal.tsx`:
```typescript
// Change this line:
query = query.eq('zone', userZone);

// To this:
query = query.eq('region', userZone);
```

### Q: Does this work for multi-select dropdowns?
**A:** Yes! Zone filtering applies to both `dropdown` and `multi_select` field types.

### Q: What if I want some dropdowns filtered and others not?
**A:** Currently, it's all-or-nothing per program. If you need field-level control, you'd need custom code. Submit a feature request!

### Q: Does this require APK rebuild?
**A:** NO! Pure frontend change. Over-the-air update only.

### Q: Can I enable it for 50 programs at once?
**A:** Yes! Use SQL:
```sql
UPDATE programs 
SET zone_filtering_enabled = TRUE 
WHERE title LIKE '%Van%' OR title LIKE '%Route%';
```

### Q: What happens if a user changes zones?
**A:** Next time they submit, dropdowns will show their new zone's items automatically.

---

## 🎯 Recommendation

### For Van Weekly Calendar:
- ✅ **Enable zone filtering** - Each ZSM plans only their zone's routes
- ✅ Prevents accidental cross-zone assignments
- ✅ Cleaner dropdowns with fewer items

### For HQ Command Center Dashboard:
- ❌ **Keep zone filtering OFF** - HQ needs to see all zones
- ✅ Allows cross-zone analysis

### For Shop Visit Programs:
- ✅ **Enable zone filtering** - Sales Executives stay in their territory
- ✅ Enforces zone boundaries

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Database Column | ✅ Ready to add |
| Frontend Code | ✅ Complete |
| UI Toggle | ✅ In Settings tab (green/teal) |
| Zone Fetching | ✅ From app_users table |
| Dropdown Filtering | ✅ .eq('zone', userZone) |
| Backward Compatible | ✅ Default OFF |
| APK Rebuild Required | ❌ No - OTA update |
| Documentation | ✅ This guide |

**Next Step:** Run the SQL migration and enable the toggle for Van Calendar!

---

## 🔗 Related Features

This feature works seamlessly with:
- ✅ **Progressive Disclosure** - Show 1 site initially, add more as needed
- ✅ **GPS Auto-Detect** - Verify user is in the correct zone
- ✅ **Points System** - Award zone-specific achievements
- ✅ **Multi-Select Dropdowns** - Select multiple sites within zone

**Perfect Stack for Van Calendar:**
1. 🔒 Zone Filtering ON → Only show NAIROBI sites
2. 🎯 Progressive Disclosure ON → Start with 1 site per day
3. 📍 GPS Auto-Detect ON → Verify location matches zone
4. ⭐ Points OFF → Planning form, not a points-earning activity
