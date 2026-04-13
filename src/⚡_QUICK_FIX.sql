-- ⚡ QUICK FIX: Create Test User in 30 Seconds
-- Copy this entire code block and run it in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/sql/new

-- Step 1: Update an existing user in the users table
UPDATE users 
SET 
  email = 'testuser@airtel.co.ke',
  phone_number = '0700000001'
WHERE employee_id = 'SE1000';

-- Step 2: Create the auth user
SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'testuser@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);

-- Step 3: Verify it worked
SELECT 
  'Auth User' as type,
  email, 
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'testuser@airtel.co.ke'

UNION ALL

SELECT 
  'Users Table' as type,
  email,
  created_at,
  NULL as email_confirmed_at
FROM users
WHERE email = 'testuser@airtel.co.ke';

-- ✅ SUCCESS! Now login with:
-- Phone: 0700000001
-- Password: Test123456!
