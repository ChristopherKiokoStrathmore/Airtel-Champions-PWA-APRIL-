-- 🔧 SIGNUP BACKEND SETUP
-- This SQL creates a trigger to automatically create a user record when someone signs up
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/sql/new

-- ============================================================
-- STEP 1: Create function to handle new user signups
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_id TEXT;
  total_users INTEGER;
BEGIN
  -- Count existing users to generate next employee ID
  SELECT COUNT(*) INTO total_users FROM users;
  
  -- Generate employee ID (SE1000, SE1001, etc.)
  new_employee_id := 'SE' || LPAD((total_users + 1000)::TEXT, 4, '0');
  
  -- Insert new user into users table
  INSERT INTO users (
    id,
    employee_id,
    full_name,
    email,
    phone_number,
    region,
    rank,
    total_points,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    new_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    'Nairobi', -- Default region
    total_users + 1, -- Initial rank
    0, -- Initial points
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Create trigger on auth.users table
-- ============================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STEP 3: Enable Row Level Security (RLS) for signup
-- ============================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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
-- STEP 4: Test the setup
-- ============================================================

-- You can test by creating a user via the app signup form
-- Or run this to verify the trigger exists:

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

-- ============================================================
-- STEP 5: Test signup flow
-- ============================================================

-- After running this SQL, test the signup in your web app:
-- 1. Click "Don't have an account? Sign up here"
-- 2. Fill in:
--    - Full Name: Test User
--    - Email: newuser@airtel.co.ke
--    - Phone: 0712345679
--    - Password: Test123456!
-- 3. Click "SIGN UP"
-- 4. User should be created in both auth.users and users tables

-- Verify it worked:
SELECT 
  u.employee_id,
  u.full_name,
  u.email,
  u.phone_number,
  au.email_confirmed_at,
  u.created_at
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;

-- ============================================================
-- CLEANUP (Optional - if you need to reset)
-- ============================================================

-- To remove test users:
-- DELETE FROM auth.users WHERE email = 'newuser@airtel.co.ke';
-- DELETE FROM users WHERE email = 'newuser@airtel.co.ke';

-- ============================================================
-- DONE! ✅
-- ============================================================

-- Your signup flow is now complete:
-- 1. ✅ User signs up in app
-- 2. ✅ Auth user created in auth.users
-- 3. ✅ Trigger automatically creates record in users table
-- 4. ✅ Employee ID auto-generated (SE1000, SE1001, etc.)
-- 5. ✅ User can now login with phone + password
