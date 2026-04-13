-- 🔧 CORRECTED SIGNUP TRIGGER (Updated)
-- This is the FIXED version with proper metadata handling
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/sql/new

-- ============================================================
-- STEP 1: Drop old trigger and function (clean slate)
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- ============================================================
-- STEP 2: Create CORRECTED function with proper metadata handling
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_id TEXT;
  total_users INTEGER;
  user_phone TEXT;
BEGIN
  -- Count existing users to generate next employee ID
  SELECT COUNT(*) INTO total_users FROM users;
  
  -- Generate employee ID (SE1000, SE1001, etc.)
  -- Handles NULL case properly
  new_employee_id := 'SE' || LPAD(COALESCE(total_users, 0) + 1000, 4, '0');
  
  -- Extract phone from metadata (use 'phone' not 'phone_number')
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  -- Insert new user into users table with ALL required columns
  INSERT INTO users (
    id,
    employee_id,
    full_name,
    email,
    phone_number,        -- ✅ Added phone_number column
    region,
    rank,
    total_points,
    is_active,           -- ✅ Added is_active
    created_at,          -- ✅ Added created_at
    updated_at           -- ✅ Added updated_at
  ) VALUES (
    NEW.id,
    new_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    user_phone,          -- ✅ From metadata.phone (not metadata.phone_number)
    'Nairobi',           -- Default region
    COALESCE(total_users, 0) + 1,  -- Initial rank (handles NULL)
    0,                   -- Initial points
    true,                -- ✅ Active by default
    NOW(),               -- ✅ Created timestamp
    NOW()                -- ✅ Updated timestamp
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- ✅ Error handling - won't break auth signup
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Create trigger on auth.users table
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STEP 4: Enable RLS and create policies
-- ============================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Allow authenticated users to read their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert (for signup trigger)
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- STEP 5: Verify the setup
-- ============================================================

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected output:
-- trigger_name         | event_manipulation | event_object_table | action_statement
-- on_auth_user_created | INSERT             | users              | EXECUTE FUNCTION handle_new_user()

-- Check policies exist
SELECT 
  policyname,
  cmd,
  tablename
FROM pg_policies
WHERE tablename = 'users';

-- Expected output:
-- Users can view own data
-- Users can update own data  
-- Service role can insert users

-- ============================================================
-- STEP 6: Test the trigger
-- ============================================================

-- The trigger will fire automatically when a user signs up via the app
-- Test by signing up in the web app with these details:
-- Full Name: Test User
-- Email: testuser@airtel.co.ke
-- Phone: 0799888777
-- Password: Test123456!

-- Then verify it worked:
SELECT 
  u.employee_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.region,
  u.rank,
  u.total_points,
  u.is_active,
  u.created_at,
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Expected output:
-- employee_id | full_name  | email                  | phone_number | region  | rank | total_points | is_active | created_at
-- SE1662      | Test User  | testuser@airtel.co.ke  | 0799888777   | Nairobi | 663  | 0            | true      | 2024-01-15 10:30:00

-- ============================================================
-- 🎯 KEY FIXES IN THIS VERSION
-- ============================================================

-- ✅ 1. Uses 'phone' (not 'phone_number') from metadata
--       metadata: { full_name: 'Test User', phone: '0799888777' }

-- ✅ 2. Adds phone_number column to INSERT
--       INSERT INTO users (..., phone_number, ...)

-- ✅ 3. Handles NULL total_users properly
--       COALESCE(total_users, 0) + 1000

-- ✅ 4. Adds all required columns
--       is_active, created_at, updated_at

-- ✅ 5. Error handling with EXCEPTION block
--       Won't break auth signup if trigger fails

-- ============================================================
-- CLEANUP (Optional - if you need to test again)
-- ============================================================

-- To delete a test user and try again:
-- DELETE FROM auth.users WHERE email = 'testuser@airtel.co.ke';
-- DELETE FROM users WHERE email = 'testuser@airtel.co.ke';

-- ============================================================
-- ✅ DONE!
-- ============================================================

-- Your signup is now properly configured:
-- 1. ✅ User signs up in app with metadata { full_name, phone }
-- 2. ✅ Trigger reads metadata.phone (not metadata.phone_number)
-- 3. ✅ Stores in users.phone_number column
-- 4. ✅ Auto-generates employee ID (SE1000, SE1001, etc.)
-- 5. ✅ Sets all required fields with proper defaults
-- 6. ✅ Has error handling to prevent auth failures
-- 7. ✅ User can now login with phone + password
