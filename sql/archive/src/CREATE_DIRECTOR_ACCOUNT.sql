-- =====================================================
-- CREATE DIRECTOR ACCOUNT FOR TAI APP
-- =====================================================

-- Step 1: Create Director in public.users table
INSERT INTO public.users (
  id,
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone,
  zsm,
  zbm,
  rank,
  total_points,
  pin_hash
) VALUES (
  gen_random_uuid(),
  'DIR001',
  'ASHISH AZAD',
  'ashish.azad@airtel.co.ke',
  '0700000001',
  'director',
  'National',
  'HQ',
  NULL,
  NULL,
  1,
  0,
  encode('1234', 'base64')
)
ON CONFLICT (email) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  role = EXCLUDED.role;

-- Verify Director was created
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
