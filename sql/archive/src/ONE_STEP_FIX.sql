-- =====================================================
-- ONE-STEP FIX FOR LOGIN ERRORS
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- It will fix all "missing email" errors

-- STEP 1: Assign emails to ALL users who don't have one
-- =====================================================
UPDATE public.users
SET email = LOWER(
  REPLACE(TRIM(full_name), ' ', '.') || '@airtel.co.ke'
)
WHERE email IS NULL OR email = '' OR email NOT LIKE '%@%';

-- STEP 2: Fix duplicate emails by adding employee_id
-- =====================================================
UPDATE public.users u1
SET email = LOWER(
  REPLACE(TRIM(u1.full_name), ' ', '.') || '.' || u1.employee_id || '@airtel.co.ke'
)
WHERE u1.id IN (
  SELECT u2.id
  FROM public.users u2
  WHERE u2.email IN (
    SELECT email
    FROM public.users
    GROUP BY email
    HAVING COUNT(*) > 1
  )
);

-- STEP 3: Ensure Director has proper email
-- =====================================================
UPDATE public.users
SET 
  email = 'ashish.azad@airtel.co.ke',
  role = 'director',
  region = 'National',
  zone = 'HQ',
  pin_hash = encode('1234'::bytea, 'base64')
WHERE full_name ILIKE '%ASHISH%AZAD%' OR employee_id LIKE '%DIR%';

-- STEP 4: Verify the fix
-- =====================================================
DO $$
DECLARE
  total_users INTEGER;
  users_with_email INTEGER;
  users_without_email INTEGER;
  director_email TEXT;
BEGIN
  -- Count users
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO users_with_email FROM public.users WHERE email IS NOT NULL AND email != '';
  users_without_email := total_users - users_with_email;
  
  -- Get director email
  SELECT email INTO director_email FROM public.users WHERE role = 'director' LIMIT 1;
  
  -- Print results
  RAISE NOTICE '============================================';
  RAISE NOTICE 'EMAIL FIX VERIFICATION';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with email: %', users_with_email;
  RAISE NOTICE 'Users without email: %', users_without_email;
  RAISE NOTICE 'Director email: %', COALESCE(director_email, 'NOT FOUND');
  RAISE NOTICE '============================================';
  
  IF users_without_email > 0 THEN
    RAISE WARNING '⚠️  Some users still missing emails!';
  ELSE
    RAISE NOTICE '✅ SUCCESS! All users have emails';
  END IF;
END $$;

-- STEP 5: Show sample of generated emails
-- =====================================================
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  '✅' as status
FROM public.users
WHERE role IN ('director', 'zonal_business_manager')
ORDER BY role, employee_id
LIMIT 15;

-- =====================================================
-- NEXT STEPS (MANUAL)
-- =====================================================
-- Now you need to create auth accounts for users
-- 
-- FOR DIRECTOR (Do this first):
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
-- 3. Enter:
--    Email: ashish.azad@airtel.co.ke
--    Password: Airtel@2024
--    ✅ Auto Confirm User
-- 4. Copy the UUID
-- 5. Run this:
--    UPDATE public.users 
--    SET id = '[PASTE_UUID]'
--    WHERE email = 'ashish.azad@airtel.co.ke';
--
-- FOR ALL OTHER USERS:
-- We'll need to bulk create auth accounts (ask for help with this)
-- 
-- =====================================================

-- QUICK TEST: Try the login function
-- =====================================================
-- Get Director's phone
SELECT 
  'Test login with these credentials:' as message,
  phone_number as phone,
  '1234' as pin,
  email
FROM public.users
WHERE role = 'director'
LIMIT 1;

-- Test the se_login function (if it exists)
-- Uncomment and replace PHONE with actual phone number:
-- SELECT se_login('PHONE_NUMBER', '1234');
