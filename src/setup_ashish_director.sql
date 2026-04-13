-- =====================================================
-- SETUP ASHISH AZAD AS DIRECTOR
-- =====================================================

-- STEP 1: Find Ashish in the database
SELECT 
  id,
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone
FROM public.users 
WHERE full_name ILIKE '%ASHISH%' OR employee_id LIKE '%DIR%' OR email ILIKE '%ashish%';

-- STEP 2: Update Ashish's role to Director (if not already)
UPDATE public.users 
SET 
  role = 'director',
  region = 'National',
  zone = 'HQ',
  pin_hash = encode('1234'::bytea, 'base64')  -- Set default PIN to 1234
WHERE full_name ILIKE '%ASHISH%AZAD%' OR full_name = 'ASHISH AZAD';

-- STEP 3: Verify the update
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone,
  CASE 
    WHEN pin_hash = encode('1234'::bytea, 'base64') THEN '✅ PIN is 1234'
    ELSE '❌ PIN is NOT 1234'
  END as pin_status
FROM public.users 
WHERE role = 'director';

-- STEP 4: Check if Ashish has an auth account
SELECT 
  u.full_name,
  u.email,
  u.phone_number,
  u.role,
  CASE 
    WHEN a.id IS NOT NULL THEN '✅ Has auth account'
    ELSE '❌ NO auth account - needs to be created'
  END as auth_status
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE u.role = 'director';

-- =====================================================
-- IF ASHISH DOESN'T HAVE AUTH ACCOUNT:
-- =====================================================
-- Option A: Create via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Authentication → Users → Add User
-- 2. Email: [use email from STEP 1]
-- 3. Password: Airtel@2024
-- 4. ✅ Auto Confirm User
-- 5. Copy the UUID
-- 6. Run this update:

-- UPDATE public.users 
-- SET id = '[PASTE_UUID_HERE]'
-- WHERE full_name ILIKE '%ASHISH%AZAD%';

-- =====================================================
-- FINAL TEST
-- =====================================================
-- Test the login function with Ashish's phone
-- (Replace 'PHONE_NUMBER' with actual phone from STEP 1)

-- SELECT se_login('PHONE_NUMBER', '1234');

-- Expected result:
-- {
--   "success": true,
--   "user": {
--     "full_name": "ASHISH AZAD",
--     "role": "director",
--     ...
--   }
-- }

-- =====================================================
-- ASHISH'S LOGIN CREDENTIALS
-- =====================================================
-- Once setup is complete, login with:
-- Phone: [From STEP 1 - any format works]
-- PIN: 1234

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Ashish should already exist in your database (from Excel import)
-- 2. You just need to:
--    a. Update his role to 'director' (STEP 2)
--    b. Ensure he has an auth account (STEP 4)
-- 3. Then he can login with any phone number format + PIN 1234
