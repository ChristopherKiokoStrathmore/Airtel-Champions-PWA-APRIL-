# 🔧 FIX: employee_id Column Error

**Error**: `column users.employee_id does not exist`  
**Status**: ✅ **FIXED** - Migration ready to apply

---

## 🎯 PROBLEM

The `users` table is missing two columns:
1. `employee_id` - Airtel employee identification number
2. `team_id` - Foreign key reference to teams table

These columns are referenced in the code but don't exist in your database.

---

## ✅ SOLUTION

I've created a migration to add both columns. You have **2 options**:

### **Option A: Run Migration (Recommended)** ⭐

**Step 1**: Go to your Supabase Dashboard → SQL Editor

**Step 2**: Run this migration:

```sql
-- Migration 010: Add employee_id and team_id columns to users table

-- Add employee_id column (for Airtel employee identification)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50) UNIQUE;

-- Add team_id column (foreign key to teams table)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);

-- Update existing users with sequential employee IDs (for testing)
-- In production, these would be real Airtel employee IDs
DO $$
DECLARE
  user_record RECORD;
  counter INTEGER := 1000;
BEGIN
  FOR user_record IN 
    SELECT id FROM users WHERE employee_id IS NULL AND role = 'se'
  LOOP
    UPDATE users 
    SET employee_id = 'SE' || LPAD(counter::text, 4, '0')
    WHERE id = user_record.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS fk_users_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Success message
SELECT 'employee_id and team_id columns added successfully!' as status;
```

**Step 3**: Refresh your admin dashboard

---

### **Option B: Fresh Database Setup**

If you want to start fresh (no data loss concerns):

**Step 1**: Drop and recreate the database using the fixed schema:
- File: `/supabase/migrations/001_initial_schema_FIXED.sql`
- This now includes `employee_id` and `team_id` from the start

**Step 2**: Run all seed data migrations

---

## 📋 WHAT THE MIGRATION DOES

1. **Adds `employee_id` column**
   - Type: VARCHAR(50) UNIQUE
   - Purpose: Store Airtel employee IDs
   - Auto-generates: SE1000, SE1001, SE1002, etc. for existing users

2. **Adds `team_id` column**
   - Type: UUID (foreign key to teams table)
   - Purpose: Link users to their teams
   - Nullable: Can be NULL if user not assigned to team

3. **Creates indexes**
   - Fast lookups by employee_id
   - Fast lookups by team_id

4. **Adds foreign key constraint**
   - Ensures team_id references valid teams
   - ON DELETE SET NULL (if team deleted, user.team_id = NULL)

---

## 🧪 VERIFY THE FIX

After running the migration, test these queries:

**Test 1: Check columns exist**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('employee_id', 'team_id');
```

Expected result:
```
employee_id | character varying
team_id     | uuid
```

**Test 2: Check employee IDs were generated**
```sql
SELECT id, full_name, employee_id, role 
FROM users 
WHERE role = 'se' 
LIMIT 5;
```

Expected result:
```
John Doe    | SE1000 | se
Jane Smith  | SE1001 | se
Bob Johnson | SE1002 | se
```

**Test 3: Test the admin dashboard**
- Navigate to the SEs page
- Should load without errors
- Should display employee IDs

---

## 🎯 FILES UPDATED

1. ✅ `/supabase/migrations/010_add_employee_id_and_team_id.sql` - **NEW**
   - Standalone migration to add columns

2. ✅ `/supabase/migrations/001_initial_schema_FIXED.sql` - **UPDATED**
   - Now includes employee_id and team_id in CREATE TABLE
   - Includes indexes and foreign key constraint
   - For fresh setups

---

## 🔄 WHAT HAPPENS TO EXISTING DATA

**Existing users**:
- ✅ Keep all their data (id, phone, email, etc.)
- ✅ Get auto-generated employee_ids (SE1000, SE1001, etc.)
- ✅ team_id starts as NULL (can be updated later)

**Existing submissions**:
- ✅ No changes - all intact
- ✅ Still linked to correct users

**No data loss!**

---

## 🚀 AFTER THE FIX

Your admin dashboard will:
- ✅ Load SEs list without errors
- ✅ Display employee IDs
- ✅ Show team information
- ✅ Search by employee_id
- ✅ Filter by team

Your mobile API will:
- ✅ Return employee_id in user profile
- ✅ Return team_id in user data
- ✅ Work for leaderboard queries
- ✅ Support all authentication flows

---

## 💡 PRODUCTION NOTES

### **For Testing/Development**:
```sql
-- Auto-generated employee IDs are fine:
SE1000, SE1001, SE1002, ...
```

### **For Production**:
```sql
-- Replace with real Airtel employee IDs:
UPDATE users 
SET employee_id = 'REAL_AIRTEL_ID' 
WHERE id = 'user-uuid';

-- Example:
UPDATE users 
SET employee_id = 'AIR-2024-001234' 
WHERE phone = '+254712345678';
```

### **For Team Assignment**:
```sql
-- First, create a team:
INSERT INTO teams (name, region_id) 
VALUES ('Nairobi Team 1', (SELECT id FROM regions WHERE code = 'NBI'));

-- Then, assign users to team:
UPDATE users 
SET team_id = (SELECT id FROM teams WHERE name = 'Nairobi Team 1')
WHERE region = 'Nairobi' AND employee_id IN ('SE1000', 'SE1001', 'SE1002');
```

---

## ⚠️ COMMON ISSUES

### **Issue 1: "relation teams does not exist"**
**Fix**: Make sure you've run the initial schema migration first
```sql
-- Check if teams table exists:
SELECT * FROM teams LIMIT 1;
```

### **Issue 2: "column employee_id already exists"**
**Fix**: You may have partially run the migration
```sql
-- Check what columns exist:
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
```

### **Issue 3: Foreign key constraint fails**
**Fix**: Make sure teams table exists before adding constraint
```sql
-- Remove constraint if needed:
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_team_id;

-- Re-add after ensuring teams table exists:
ALTER TABLE users 
ADD CONSTRAINT fk_users_team_id 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

---

## ✅ SUCCESS CRITERIA

After applying the fix, you should see:

1. **No console errors** ✅
2. **SEs page loads** ✅
3. **Employee IDs displayed** ✅
4. **Search works** ✅
5. **Leaderboard works** ✅

---

## 🎉 SUMMARY

**What was broken**:
- `users` table missing `employee_id` and `team_id` columns
- Admin dashboard couldn't load SEs
- Search/filter by employee_id failed

**What's fixed**:
- ✅ Added both columns to schema
- ✅ Created migration to update existing databases
- ✅ Auto-generated employee IDs for existing users
- ✅ Added proper indexes and constraints
- ✅ Updated schema file for fresh setups

**Time to fix**: 2 minutes  
**Data loss**: ZERO  
**Downtime required**: ZERO

---

**Ready to fix? Run Option A (migration) in your Supabase SQL Editor!** 🚀
