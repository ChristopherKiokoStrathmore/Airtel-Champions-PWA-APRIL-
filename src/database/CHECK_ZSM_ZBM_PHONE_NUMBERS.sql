-- =====================================================
-- CHECK ACTUAL PHONE NUMBERS IN DATABASE
-- For ZSMs and ZBMs
-- =====================================================

-- Query 1: Check all ZSMs with their phone numbers
SELECT 
  full_name, 
  role, 
  zone,
  phone_number,
  email,
  employee_id,
  CASE 
    WHEN phone_number IS NULL THEN '❌ NULL' 
    WHEN phone_number = '' THEN '❌ EMPTY STRING'
    ELSE '✅ HAS NUMBER' 
  END as status
FROM app_users
WHERE role = 'zonal_sales_manager'
ORDER BY zone, full_name;

-- Query 2: Check all ZBMs with their phone numbers
SELECT 
  full_name, 
  role, 
  zone,
  phone_number,
  email,
  employee_id,
  CASE 
    WHEN phone_number IS NULL THEN '❌ NULL' 
    WHEN phone_number = '' THEN '❌ EMPTY STRING'
    ELSE '✅ HAS NUMBER' 
  END as status
FROM app_users
WHERE role = 'zonal_business_manager'
ORDER BY zone, full_name;

-- Query 3: Count summary
SELECT 
  role,
  COUNT(*) as total,
  COUNT(phone_number) FILTER (WHERE phone_number IS NOT NULL AND phone_number != '') as with_phone,
  COUNT(*) FILTER (WHERE phone_number IS NULL OR phone_number = '') as without_phone
FROM app_users
WHERE role IN ('zonal_sales_manager', 'zonal_business_manager')
GROUP BY role;

-- Query 4: Sample of HQ staff phone numbers (for comparison - these work)
SELECT 
  full_name, 
  role, 
  phone_number,
  CASE 
    WHEN phone_number IS NULL THEN '❌ NULL' 
    WHEN phone_number = '' THEN '❌ EMPTY STRING'
    ELSE '✅ HAS NUMBER' 
  END as status
FROM app_users
WHERE role = 'hq_staff'
ORDER BY full_name
LIMIT 10;

-- Query 5: Sample of Directors phone numbers (for comparison - these work)
SELECT 
  full_name, 
  role, 
  phone_number,
  CASE 
    WHEN phone_number IS NULL THEN '❌ NULL' 
    WHEN phone_number = '' THEN '❌ EMPTY STRING'
    ELSE '✅ HAS NUMBER' 
  END as status
FROM app_users
WHERE role = 'director'
ORDER BY full_name;
