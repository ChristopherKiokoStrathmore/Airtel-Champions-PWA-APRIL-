-- =====================================================
-- FIX MISSING EMAILS - ASSIGN EMAILS TO ALL USERS
-- =====================================================

-- STEP 1: Check which users are missing emails
SELECT 
  employee_id,
  full_name,
  phone_number,
  email,
  role,
  CASE 
    WHEN email IS NULL OR email = '' THEN '❌ NO EMAIL'
    ELSE '✅ Has email'
  END as email_status
FROM public.users
WHERE email IS NULL OR email = ''
ORDER BY role, employee_id
LIMIT 50;

-- STEP 2: Generate and assign emails to users without them
-- This creates emails in format: firstname.lastname@airtel.co.ke

UPDATE public.users
SET email = LOWER(
  REPLACE(full_name, ' ', '.') || '@airtel.co.ke'
)
WHERE email IS NULL OR email = '';

-- STEP 3: For users with special characters or duplicate names,
-- add employee_id to make unique
UPDATE public.users u1
SET email = LOWER(
  REPLACE(u1.full_name, ' ', '.') || '.' || u1.employee_id || '@airtel.co.ke'
)
WHERE u1.email IN (
  SELECT email
  FROM public.users
  GROUP BY email
  HAVING COUNT(*) > 1
);

-- STEP 4: Verify all users now have emails
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  COUNT(*) - COUNT(email) as users_without_email
FROM public.users;

-- STEP 5: Show sample of generated emails
SELECT 
  employee_id,
  full_name,
  email,
  role
FROM public.users
ORDER BY employee_id
LIMIT 20;

-- =====================================================
-- SPECIFIC FIX FOR DIRECTOR (ASHISH)
-- =====================================================

-- Check Ashish's email
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role
FROM public.users
WHERE full_name ILIKE '%ASHISH%';

-- If Ashish has no email, assign one:
UPDATE public.users
SET email = 'ashish.azad@airtel.co.ke'
WHERE full_name ILIKE '%ASHISH%AZAD%'
  AND (email IS NULL OR email = '');

-- Verify
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  CASE 
    WHEN email IS NOT NULL AND email != '' THEN '✅ Email set'
    ELSE '❌ Still missing'
  END as status
FROM public.users
WHERE full_name ILIKE '%ASHISH%';

-- =====================================================
-- NOTES
-- =====================================================
-- After running this:
-- 1. All users will have email addresses
-- 2. Emails will be in format: firstname.lastname@airtel.co.ke
-- 3. Duplicates will have employee_id added
-- 4. The login flow will now work properly

-- Example generated emails:
-- JUDY MUTHONI → judy.muthoni@airtel.co.ke
-- ASHISH AZAD → ashish.azad@airtel.co.ke
-- DENNIS WAWERU → dennis.waweru@airtel.co.ke
