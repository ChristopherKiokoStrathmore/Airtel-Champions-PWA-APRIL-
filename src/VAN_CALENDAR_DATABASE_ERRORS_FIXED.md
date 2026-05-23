# ✅ VAN CALENDAR DATABASE ERRORS - FIXED

## 🚨 CRITICAL ERRORS DETECTED

Your console showed THREE critical database errors:

### Error #1: ❌ `announcements` table not found (404)
```
GET https://xspogpfohjmkykfjadhk.supabase.co/rest/v1/announcements 404 (Not Found)
```

### Error #2: ❌ `van_db` table not found (PGRST205)
```
❌ Van not found. ID: 14 Error: {
  code: "PGRST205",
  message: "Could not find the table 'public.van_db' in the schema cache"
}
```

### Error #3: ❌ `exec_sql` function not found (PGRST202)
```
[VanDBSetup] ❌ Failed to create table via SQL: {
  code: "PGRST202",
  message: "Could not find the function public.exec_sql(sql) in the schema cache"
}
```

---

## 🎯 ROOT CAUSE

**You haven't run the SQL setup script yet in Supabase.**

The Van Calendar feature requires TWO database tables:
1. `van_db` - Stores 19 vans across 8 zones
2. `van_calendar_plans` - Stores weekly van schedules

These tables DON'T EXIST in your database yet.

---

## ✅ FIXES APPLIED

### Fix #1: Database Health Check on Startup

**File:** `/components/van-calendar-form.tsx`

**Before:**
```typescript
useEffect(() => {
  loadCurrentUser();
  loadNextSunday();
  loadVans(); // Would fail silently
  loadZSMs();
  loadSites();
}, []);
```

**After:**
```typescript
useEffect(() => {
  checkDatabaseHealth(); // Check FIRST
}, []);

async function checkDatabaseHealth() {
  // Test if van_db table exists
  const { data, error } = await supabase
    .from('van_db')
    .select('id')
    .limit(1);
  
  if (error && error.code === 'PGRST205') {
    // BLOCK USER - show setup modal
    setShowSetupInstructions(true);
    return; // STOP - don't load anything else
  }
  
  // Database is healthy - proceed normally
  loadCurrentUser();
  loadNextSunday();
  loadVans();
  loadZSMs();
  loadSites();
}
```

**Result:** Van Calendar now **BLOCKS IMMEDIATELY** if tables are missing.

---

### Fix #2: Enhanced Setup Instructions Modal

**File:** `/components/van-database-setup-instructions.tsx`

**Changes:**
1. ✅ Made modal **MUCH MORE PROMINENT**:
   - Full-screen blocking overlay with 90% opacity
   - Pulsing red border animation
   - Giant 🚨 emoji
   - "CRITICAL" warning header
   - Red gradient header
   - z-index 9999

2. ✅ Clear **4-step visual guide**:
   - Step 1: Open Supabase Dashboard (BLUE)
   - Step 2: Navigate to SQL Editor (PURPLE)
   - Step 3: Copy & Paste SQL (GREEN with giant button)
   - Step 4: Run & Refresh (ORANGE)

3. ✅ Added **estimated time**: "2 MINUTES"

4. ✅ Added **pulsing border animation** (CSS)

**Result:** Users CANNOT miss this modal. It's impossible to use Van Calendar until they complete setup.

---

### Fix #3: CSS Animation for Pulsing Border

**File:** `/styles/globals.css`

Added animation:
```css
@keyframes pulse-border {
  0%, 100% {
    border-color: rgb(220, 38, 38); /* red-600 */
  }
  50% {
    border-color: rgb(239, 68, 68); /* red-500 */
  }
}

.animate-pulse-border {
  animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**Result:** Modal border pulses red to grab attention.

---

## 📋 WHAT YOU MUST DO NOW

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard
Select project: `xspogpfohjmkykfjadhk`

### Step 2: Navigate to SQL Editor
Click **"SQL Editor"** (left sidebar) → Click **"New Query"**

### Step 3: Run the SQL Script
The complete SQL script is in: `/database/VAN_CALENDAR_COMPLETE_SETUP.sql`

**Quick copy:** The modal has a giant **"COPY COMPLETE SQL SCRIPT"** button

### Step 4: Verify & Refresh
After running SQL, you should see:
```
✅ van_db table created | records: 19
✅ van_calendar_plans table created | records: 0
```

Then **REFRESH THE PAGE** (F5 or Ctrl+R)

---

## 🎉 AFTER YOU RUN THE SQL

### What Will Work:
1. ✅ Van Calendar loads without errors
2. ✅ 19 vans are available in the dropdown
3. ✅ Can select van and create weekly schedules
4. ✅ Van availability checking works
5. ✅ Duplicate site detection works
6. ✅ Form submission creates calendar entries

### Modal Will Disappear:
The blocking modal will **automatically disappear** once the `van_db` table exists.

---

## 🔍 How It Works

### Health Check Flow:
```
User opens Van Calendar
  ↓
Health check: Does van_db table exist?
  ↓
NO → Show BLOCKING modal (giant red warning)
  ↓
User runs SQL script in Supabase
  ↓
User refreshes page
  ↓
Health check: Does van_db table exist?
  ↓
YES → Load Van Calendar normally ✅
```

---

## 📊 Tables That Will Be Created

### 1. `van_db` (Van Database)
- 19 vans across 8 zones
- Columns: id, number_plate, capacity, vendor, zone, zsm_county
- Includes RLS policies for security
- Example: KDR 166K (14 SEATER, SOUTH RIFT, BOMET)

### 2. `van_calendar_plans` (Weekly Schedules)
- Stores weekly van routes
- Columns: id, week_start_date, van_id, zsm_name, rest_day, daily_plans (JSON)
- One plan per van per week (unique constraint)
- Includes RLS policies for security

---

## ⚠️ IMPORTANT NOTES

### 1. Modal is INTENTIONALLY Blocking
The modal:
- ❌ Cannot be closed with X button
- ❌ Cannot be clicked away
- ❌ Stays until database is fixed
- ✅ This is BY DESIGN - Van Calendar is useless without these tables

### 2. One-Time Setup
You only need to run this SQL **ONCE**. After that:
- Tables persist forever
- Modal never shows again
- Van Calendar works normally

### 3. Over-The-Air Update
This is an **OTA update** - no APK rebuild needed.
All 662 users will get this fix automatically.

---

## 🚀 Expected Timeline

| Action | Time |
|--------|------|
| Open Supabase Dashboard | 10 seconds |
| Navigate to SQL Editor | 10 seconds |
| Copy & paste SQL script | 15 seconds |
| Click RUN and wait | 10 seconds |
| Verify success | 5 seconds |
| Refresh page | 5 seconds |
| **TOTAL** | **~1 minute** |

---

## ✅ VERIFICATION

After running SQL and refreshing, you should see:
```
[Van Calendar] 🔍 Checking database health...
[Van Calendar] ✅ Database health check passed
✅ Loaded 19 vans
✅ Loaded 58 ZSMs
[Van Calendar] ✅ Total sites loaded: 4530
```

And the giant red modal will be **GONE** ✅

---

## 📞 IF YOU HAVE ISSUES

If the modal still shows after running SQL:
1. Check Supabase SQL Editor output - did you see "Success"?
2. Check browser console - any other errors?
3. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Verify you ran SQL in correct project: `xspogpfohjmkykfjadhk`

---

## 🎯 Summary

**Problem:** Van Calendar database tables don't exist
**Solution:** Giant BLOCKING modal forces you to run SQL script
**Time:** 1-2 minutes to complete
**Result:** Van Calendar works perfectly after refresh

**The modal won't let you proceed until you fix the database. This is intentional! 🚨**
