-- =====================================================
-- FIND ASHISH AZAD'S CREDENTIALS
-- =====================================================

-- Step 1: Check if Ashish exists in public.users
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
WHERE full_name ILIKE '%ASHISH%' OR full_name ILIKE '%AZAD%';

-- Step 2: If he exists, check if he has auth account
SELECT 
  a.id as auth_id,
  a.email,
  a.email_confirmed_at,
  a.created_at,
  u.full_name,
  u.phone_number,
  u.role
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
WHERE a.email ILIKE '%ashish%' OR u.full_name ILIKE '%ASHISH%';

-- Step 3: If role is not 'director', update it
UPDATE public.users 
SET role = 'director', region = 'National', zone = 'HQ'
WHERE full_name ILIKE '%ASHISH%AZAD%' OR full_name = 'ASHISH AZAD';

-- Step 4: Verify the update
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone
FROM public.users 
WHERE role = 'director';
