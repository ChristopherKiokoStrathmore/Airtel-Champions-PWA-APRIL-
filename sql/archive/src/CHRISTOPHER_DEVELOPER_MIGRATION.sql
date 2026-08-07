-- ============================================
-- CHRISTOPHER DEVELOPER ROLE UPDATE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- to set Christopher's role to 'developer'
-- ============================================

-- Option 1: Update by name (if Christopher exists)
UPDATE app_users 
SET role = 'developer'
WHERE LOWER(full_name) LIKE '%christopher%';

-- Option 2: Update by employee_id (if you know it)
-- UPDATE app_users 
-- SET role = 'developer'
-- WHERE employee_id = 'DIR001' OR employee_id = 'DEV001';

-- Option 3: Update by phone number (safest if you know his number)
-- UPDATE app_users 
-- SET role = 'developer'
-- WHERE phone_number = '123456789'; -- Replace with Christopher's actual phone

-- Verify the update
SELECT 
  id,
  full_name, 
  role, 
  employee_id,
  phone_number,
  zone
FROM app_users 
WHERE LOWER(full_name) LIKE '%christopher%' OR role = 'developer';

-- ============================================
-- ALTERNATIVE: Add Developer as valid role
-- ============================================
-- If your role column has constraints, you may need to:
-- ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;
-- ALTER TABLE app_users ADD CONSTRAINT app_users_role_check 
--   CHECK (role IN ('sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_staff', 'director', 'developer'));
