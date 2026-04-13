# Van Database Setup Guide

## 🚨 Critical Issue Fixed

**Problem:** The `van_db` table does not exist in your Supabase database, causing "Van not found" errors.

**Error Message:**
```
Available vans (first 5): null
❌ Van not found. ID: 42 Error: {
  code: "PGRST205",
  message: "Could not find the table 'public.van_db' in the schema cache"
}
```

## ✅ Solution

The van_db table **must be created manually** in Supabase Dashboard because:
1. Supabase doesn't allow DDL (CREATE TABLE) operations from Edge Functions
2. The table requires specific structure with an auto-incrementing ID column
3. RLS policies need to be configured properly

---

## 📋 Step-by-Step Fix

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Open your Airtel Champions project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Setup Script
1. **Find the script** at: `/database/VAN_DB_COMPLETE_SETUP.sql`
2. **Copy the entire contents**
3. **Paste into Supabase SQL Editor**
4. **Click "Run"** (or press Ctrl/Cmd + Enter)

### Step 3: Verify Success
You should see output like:
```
✅ van_db table created | total_vans: 19 | min_id: 1 | max_id: 19
```

And a breakdown showing:
- CENTRAL: 3 vans
- COAST: 3 vans  
- EASTERN: 2 vans
- NAIROBI EAST: 3 vans
- NORTH EASTERN: 1 van
- NYANZA: 2 vans
- SOUTH RIFT: 2 vans
- WESTERN: 3 vans

### Step 4: Refresh Application
1. Go back to your Airtel Champions app
2. **Refresh the page** (F5 or Ctrl/Cmd + R)
3. Try opening Van Calendar again
4. You should now see 19 vans available in the dropdown

---

## 🔧 What the Script Creates

### Table Structure
```sql
CREATE TABLE van_db (
  id SERIAL PRIMARY KEY,              -- Auto-incrementing: 1, 2, 3... 19
  number_plate TEXT UNIQUE NOT NULL,  -- e.g., "KDR 165K"
  capacity TEXT,                       -- e.g., "14 SEATER"
  vendor TEXT,                         -- All "TOP TOUCH"
  zone TEXT,                           -- CENTRAL, COAST, EASTERN, etc.
  zsm_county TEXT,                     -- County assignment
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Sample Data (19 vans total)
| ID | Number Plate | Capacity    | Zone           | County      |
|----|--------------|-------------|----------------|-------------|
| 1  | KDR 165K     | 14 SEATER   | CENTRAL        | MURANG'A    |
| 2  | KDR 124L     | 14 SEATER   | CENTRAL        | KIRINYAGA   |
| 3  | KDT 071V     | 9 SEATER    | CENTRAL        | NYANDARUA   |
| 4  | KDR 127L     | 14 SEATER   | COAST          | KWALE       |
| ... (15 more) ...

### Security Policies (RLS)
- ✅ All authenticated users can **read** van data
- ✅ Service role has **full access** for backend operations
- ✅ Anonymous users can **read** (for frontend dropdowns)

### Performance Indexes
- ✅ `idx_van_db_zone` - Fast filtering by zone
- ✅ `idx_van_db_number_plate` - Fast lookups by plate number

---

## 🎯 How It Works After Setup

### Frontend (van-calendar-form.tsx)
1. **Loads vans** from `van_db` table on mount
2. **Displays dropdown** with all 19 vans
3. **Shows setup instructions** if table is missing (automatic detection)
4. **Validates van selection** before submission

### Backend (van-calendar.tsx)
1. **Receives** `van_id` (the database ID: 1-19)
2. **Looks up** van details: `SELECT * FROM van_db WHERE id = ?`
3. **Verifies** van exists before creating calendar entry
4. **Stores** van_numberplate with the calendar plan

### Error Handling
- ❌ **If table missing**: Shows setup instructions modal
- ❌ **If van not found**: Returns detailed error with available vans
- ❌ **If duplicate submission**: Checks for existing plans that week
- ✅ **If everything OK**: Creates calendar entry and returns success

---

## 🐛 Troubleshooting

### "Van not found. ID: 42"
**Cause:** Frontend is sending an invalid van ID (possibly from old data)

**Fix:**
1. Run the setup script
2. Refresh the page completely (hard refresh: Ctrl+F5)
3. Clear localStorage if needed: `localStorage.clear()`

### "Could not find the table 'public.van_db'"
**Cause:** Table doesn't exist yet

**Fix:** Run the setup script from `/database/VAN_DB_COMPLETE_SETUP.sql`

### "Vans dropdown is empty"
**Cause:** Either table is missing OR RLS policies are blocking access

**Fix:**
1. Check if table exists: Go to Supabase → Table Editor
2. Run the setup script (it includes RLS policies)
3. Verify the anonymous key can read: Test with a simple query

### "duplicate key value violates unique constraint"
**Cause:** Trying to insert vans that already exist

**Fix:** The script uses `ON CONFLICT DO NOTHING` so this shouldn't happen. If it does:
```sql
DELETE FROM van_db; -- Clear all vans
-- Then run the INSERT statements again
```

---

## 📊 Database Schema Reference

```sql
-- Complete table definition
CREATE TABLE van_db (
  id SERIAL PRIMARY KEY,
  number_plate TEXT UNIQUE NOT NULL,
  capacity TEXT,
  vendor TEXT,
  zone TEXT,
  zsm_county TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_van_db_zone ON van_db(zone);
CREATE INDEX idx_van_db_number_plate ON van_db(number_plate);

-- RLS policies
ALTER TABLE van_db ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access"
ON van_db FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role full access"
ON van_db FOR ALL
USING (true) WITH CHECK (true);
```

---

## ✨ Features After Setup

Once the table is created, users can:

1. ✅ **Select from 19 vans** across 8 zones
2. ✅ **Plan weekly routes** for each van
3. ✅ **Assign to ZSMs** with automatic zone matching
4. ✅ **Track van availability** (checks for double-booking)
5. ✅ **View calendar grid** showing all van schedules
6. ✅ **Generate compliance reports** for weekly planning

---

## 🎉 Success Indicators

After running the script, you should:
- ✅ See **19 vans** in the Van Calendar dropdown
- ✅ Be able to **select a van** without errors
- ✅ See **zone information** displayed with each van
- ✅ Successfully **submit van calendar** entries
- ✅ See **no "Van not found"** errors in the console

---

## 📝 Notes

- The `id` column is **required** - without it, van selection won't work
- All vans are from **"TOP TOUCH"** vendor (current contract)
- The script is **idempotent** - safe to run multiple times
- RLS is **enabled by default** for security
- The table structure matches what the **frontend and backend expect**

---

## 🔗 Related Files

- **SQL Script:** `/database/VAN_DB_COMPLETE_SETUP.sql`
- **Setup Instructions Component:** `/components/van-database-setup-instructions.tsx`
- **Van Calendar Form:** `/components/van-calendar-form.tsx`
- **Backend API:** `/supabase/functions/server/van-calendar.tsx`
- **Van DB Setup (attempted):** `/supabase/functions/server/van-db-setup.tsx`

---

**Last Updated:** February 17, 2026
**Issue:** Fixed missing van_db table causing PGRST205 errors
**Status:** ✅ Resolved with manual SQL setup script
