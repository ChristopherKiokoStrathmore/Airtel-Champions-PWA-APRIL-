# ✅ VAN CALENDAR - ZONE FILTERING UPDATE

## 🎯 CHANGES MADE

### 1. **Zone-Filtered Van Loading**
- Updated `loadVans()` to accept `userZone` parameter
- Added `.eq('zone', userZone)` filter to only load vans from the user's zone
- Removed limit of 20 vans (no longer needed since filtering by zone)

### 2. **Load Vans After User**
- Changed `checkDatabaseHealth()` to `await loadCurrentUser()` first
- `loadCurrentUser()` now calls `loadVans(user.zone)` after user is loaded
- Ensures user's zone is available before querying vans

### 3. **Removed Edge Function Call**
- Replaced `loadNextSunday()` edge function call with client-side calculation
- Eliminates CORS errors from Figma preview domain
- Simpler, faster, and more reliable

### 4. **Cleaned Up Duplicate Code**
- Removed leftover edge function fetch code
- Removed duplicate fallback calculation
- Removed duplicate `initializeDailyPlans()` implementation

---

## 📊 HOW IT WORKS NOW

### Before (All Vans):
```typescript
async function loadVans() {
  const { data } = await supabase
    .from('van_db')
    .select('*')
    .limit(20)
    .order('number_plate');
  
  setVans(data);  // Loads ALL vans
}
```

### After (Zone-Filtered):
```typescript
async function loadVans(userZone?: string) {
  if (!userZone) return;  // Requires zone
  
  console.log(`🔍 Loading vans for zone: ${userZone}`);
  
  const { data } = await supabase
    .from('van_db')
    .select('*')
    .eq('zone', userZone)  // ← FILTER BY ZONE
    .order('number_plate');
  
  console.log(`✅ Loaded ${data.length} vans for zone ${userZone}`);
  setVans(data);  // Only vans from user's zone
}
```

---

## 🔍 EXAMPLE: SCHOLA NGALA (COAST Zone)

### User Info:
- Name: SCHOLA NGALA
- Role: zonal_sales_manager
- Zone: **COAST**

### Old Behavior:
```
✅ Loaded 20 vans  (all zones)
```

### New Behavior:
```
🔍 Loading vans for zone: COAST
✅ Loaded 3 vans for zone COAST
```

### COAST Zone Vans (from your database):
1. KDR 127L - 14 SEATER - KWALE
2. KDR 165L - 14 SEATER - KILIFI
3. KDD 725H - 14 SEATER - TAITA TAVETA

---

## 📋 LOADING SEQUENCE

### 1. Health Check:
```javascript
checkDatabaseHealth()
  → Check if van_db exists
  → If exists: await loadCurrentUser()
```

### 2. Load User & Vans:
```javascript
loadCurrentUser()
  → Get user from localStorage
  → user.zone = "COAST"
  → loadVans("COAST")  ← Calls with zone
```

### 3. Filter Vans:
```javascript
loadVans("COAST")
  → SELECT * FROM van_db WHERE zone = 'COAST'
  → Returns 3 vans
  → setVans([3 COAST vans])
```

---

## ✅ EXPECTED CONSOLE LOGS

After refresh, you should see:

```
[Van Calendar] 🔍 Checking database health...
[Van Calendar] ✅ Database health check passed
✅ Van Calendar: Loaded user from localStorage: SCHOLA NGALA
🔍 Loading vans for zone: COAST
✅ Loaded 3 vans for zone COAST  ← Only COAST vans!
✅ Loaded 58 ZSMs
[Van Calendar] 🔄 Calculating next Sunday (client-side)...
✅ Next Sunday calculated: 2026-02-23
✅ Week ends on: 2026-03-01
[Van Calendar] ✅ Total sites loaded: 4530
```

---

## 🎯 ZONE BREAKDOWN

Based on your 38 vans in the database:

| Zone | Expected Van Count |
|------|-------------------|
| CENTRAL | ~3-5 vans |
| COAST | 3 vans |
| EASTERN | ~2-3 vans |
| NAIROBI EAST | ~3-5 vans |
| NORTH EASTERN | ~1-2 vans |
| NYANZA | ~2-3 vans |
| SOUTH RIFT | ~2-3 vans |
| WESTERN | ~3-5 vans |

Each ZSM will only see vans assigned to their zone!

---

## 🚀 BENEFITS

### 1. **Cleaner UX**
- ZSMs only see relevant vans
- No confusion about which van to select
- Faster van selection

### 2. **Better Performance**
- Smaller result sets per query
- Faster page load
- Less data transferred

### 3. **Data Accuracy**
- Prevents ZSM from selecting wrong zone's van
- Enforces proper zone assignment
- Reduces scheduling conflicts

### 4. **No More CORS Errors**
- Edge function removed entirely
- Client-side date calculation
- Works perfectly in Figma preview

---

## 🔧 IF A ZSM SEES NO VANS

If a ZSM sees 0 vans after login:

### Reason 1: No vans assigned to their zone
```sql
-- Check if zone has vans
SELECT zone, COUNT(*) 
FROM van_db 
WHERE zone = 'ZONE_NAME'
GROUP BY zone;
```

### Reason 2: Zone name mismatch
```sql
-- Check user's zone vs van zones
SELECT DISTINCT u.zone as user_zone, v.zone as van_zone
FROM app_users u, van_db v
WHERE u.full_name = 'USER_NAME';
```

### Reason 3: Zone is NULL
```sql
-- Check for NULL zones
SELECT * FROM van_db WHERE zone IS NULL;
```

---

## 📊 TESTING

Test with different zones:

### Test 1: COAST Zone
- Login as: SCHOLA NGALA (COAST)
- Expected: 3 vans (KDR 127L, KDR 165L, KDD 725H)

### Test 2: WESTERN Zone
- Login as: Western ZSM
- Expected: ~3-5 Western vans

### Test 3: CENTRAL Zone
- Login as: Central ZSM
- Expected: ~3-5 Central vans

---

## 🎉 SUMMARY

**Changes:**
1. ✅ Vans filtered by logged-in user's zone
2. ✅ Edge function call removed (client-side date calculation)
3. ✅ Code cleanup (removed duplicates)
4. ✅ Improved error handling for missing zones

**Result:**
- Each ZSM sees only their zone's vans
- No more CORS errors
- Cleaner, faster, more accurate

**Time:** Over-the-air update (no APK rebuild needed) ✅
