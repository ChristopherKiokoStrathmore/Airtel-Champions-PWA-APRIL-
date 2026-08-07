-- =====================================================
-- FIX MISSING PHONE NUMBERS FOR ZSMs AND ZBMs
-- Based on migration 004_production_data_real_structure.sql
-- =====================================================

-- Check current ZSMs and ZBMs without phone numbers
SELECT 
  full_name, 
  role, 
  zone, 
  phone_number,
  CASE 
    WHEN phone_number IS NULL OR phone_number = '' THEN '❌ MISSING' 
    ELSE '✅ HAS PHONE' 
  END as status
FROM app_users
WHERE role IN ('zonal_sales_manager', 'zonal_business_manager')
ORDER BY role, zone, full_name;

-- =====================================================
-- UPDATE ZSMs WITH PHONE NUMBERS
-- =====================================================

-- ABERDARE ZONE ZSMs
UPDATE app_users SET phone_number = '0710000001' WHERE full_name = 'GADIN MAGADA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000002' WHERE full_name = 'KEZIAH WANGARI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000003' WHERE full_name = 'SIMON NDUGIRE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000004' WHERE full_name = 'VERONICA NALIANYA' AND role = 'zonal_sales_manager';

-- COAST ZONE ZSMs
UPDATE app_users SET phone_number = '0710000005' WHERE full_name = 'DANIEL MUMO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000006' WHERE full_name = 'FARIS SALIM' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000007' WHERE full_name = 'GRACE MUMBI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000008' WHERE full_name = 'RUTH ALINDA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000009' WHERE full_name = 'SCHOLA NGALA' AND role = 'zonal_sales_manager';

-- EASTERN ZONE ZSMs
UPDATE app_users SET phone_number = '0710000010' WHERE full_name = 'FAITH CHEPKORIR' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000011' WHERE full_name = 'JOSEPH MULWA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000012' WHERE full_name = 'SHADRACK WABWIRE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000013' WHERE full_name = 'SABASTIAN NYAMU' AND role = 'zonal_sales_manager';

-- MT KENYA ZONE ZSMs
UPDATE app_users SET phone_number = '0710000014' WHERE full_name = 'KENNEDY KIMANI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000015' WHERE full_name = 'LAWRENCE MUTHUITHA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000016' WHERE full_name = 'MATHIAS MUEKE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000017' WHERE full_name = 'PATRICK MAKAU' AND role = 'zonal_sales_manager';

-- NAIROBI EAST ZONE ZSMs
UPDATE app_users SET phone_number = '0710000018' WHERE full_name = 'BETHUEL MWANGI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000019' WHERE full_name = 'RACHAEL WAITARA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000020' WHERE full_name = 'STELLA IGORO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000021' WHERE full_name = 'TIMOTHY KARIUKI' AND role = 'zonal_sales_manager';

-- NAIROBI METROPOLITAN ZONE ZSMs
UPDATE app_users SET phone_number = '0710000022' WHERE full_name = 'CAROLYN NYAWADE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000023' WHERE full_name = 'CATHERINE MAROKO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000024' WHERE full_name = 'CHARLES MUCHOKI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000025' WHERE full_name = 'TIMOTHY MUINDI' AND role = 'zonal_sales_manager';

-- NAIROBI WEST ZONE ZSMs
UPDATE app_users SET phone_number = '0710000026' WHERE full_name = 'CYNTHIA MWIKALI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000027' WHERE full_name = 'LILIAN NYAMBURA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000028' WHERE full_name = 'MARTIN NGIGE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000029' WHERE full_name = 'ROBERT KANYI' AND role = 'zonal_sales_manager';

-- NORTH RIFT ZONE ZSMs
UPDATE app_users SET phone_number = '0710000030' WHERE full_name = 'ALLAN KEMBOI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000031' WHERE full_name = 'CAROL CHEPKEMBOI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000032' WHERE full_name = 'JACKSON RUTO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000033' WHERE full_name = 'MERCY CHESANG' AND role = 'zonal_sales_manager';

-- NYANZA NORTH ZONE ZSMs
UPDATE app_users SET phone_number = '0710000034' WHERE full_name = 'BENJAMIN OUMA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000035' WHERE full_name = 'BRIAN ODERO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000036' WHERE full_name = 'CALVINCE OTIENO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000037' WHERE full_name = 'GLADYS AWUOR' AND role = 'zonal_sales_manager';

-- NYANZA SOUTH ZONE ZSMs
UPDATE app_users SET phone_number = '0710000038' WHERE full_name = 'BENARD OCHIENG' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000039' WHERE full_name = 'ELIZABETH ACHIENG' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000040' WHERE full_name = 'JARED ODHIAMBO' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000041' WHERE full_name = 'WINNIE ATIENO' AND role = 'zonal_sales_manager';

-- SOUTH RIFT ZONE ZSMs
UPDATE app_users SET phone_number = '0710000042' WHERE full_name = 'ALICE CHEPKEMOI' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000043' WHERE full_name = 'PHILIP KIPROP' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000044' WHERE full_name = 'SHARON KOECH' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000045' WHERE full_name = 'VINCENT LANGAT' AND role = 'zonal_sales_manager';

-- WESTERN ZONE ZSMs
UPDATE app_users SET phone_number = '0710000046' WHERE full_name = 'DOMINIC WAFULA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000047' WHERE full_name = 'FAITH NEKESA' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000048' WHERE full_name = 'MOSES MASINDE' AND role = 'zonal_sales_manager';
UPDATE app_users SET phone_number = '0710000049' WHERE full_name = 'VIOLET NAMWAYA' AND role = 'zonal_sales_manager';

-- =====================================================
-- UPDATE ZBMs WITH PHONE NUMBERS
-- =====================================================

-- ZBM for ABERDARE
UPDATE app_users SET phone_number = '0720000001' WHERE full_name LIKE '%ZBM%ABERDARE%' AND role = 'zonal_business_manager';
UPDATE app_users SET phone_number = '0720000001' WHERE zone = 'ABERDARE' AND role = 'zonal_business_manager';

-- ZBM for COAST
UPDATE app_users SET phone_number = '0720000002' WHERE zone = 'COAST' AND role = 'zonal_business_manager';

-- ZBM for EASTERN
UPDATE app_users SET phone_number = '0720000003' WHERE zone = 'EASTERN' AND role = 'zonal_business_manager';

-- ZBM for MT KENYA
UPDATE app_users SET phone_number = '0720000004' WHERE zone = 'MT KENYA' AND role = 'zonal_business_manager';

-- ZBM for NAIROBI EAST
UPDATE app_users SET phone_number = '0720000005' WHERE zone = 'NAIROBI EAST' AND role = 'zonal_business_manager';

-- ZBM for NAIROBI METROPOLITAN
UPDATE app_users SET phone_number = '0720000006' WHERE zone = 'NAIROBI METROPOLITAN' AND role = 'zonal_business_manager';

-- ZBM for NAIROBI WEST
UPDATE app_users SET phone_number = '0720000007' WHERE zone = 'NAIROBI WEST' AND role = 'zonal_business_manager';

-- ZBM for NORTH RIFT
UPDATE app_users SET phone_number = '0720000008' WHERE zone = 'NORTH RIFT' AND role = 'zonal_business_manager';

-- ZBM for NYANZA NORTH
UPDATE app_users SET phone_number = '0720000009' WHERE zone = 'NYANZA NORTH' AND role = 'zonal_business_manager';

-- ZBM for NYANZA SOUTH
UPDATE app_users SET phone_number = '0720000010' WHERE zone = 'NYANZA SOUTH' AND role = 'zonal_business_manager';

-- ZBM for SOUTH RIFT
UPDATE app_users SET phone_number = '0720000011' WHERE zone = 'SOUTH RIFT' AND role = 'zonal_business_manager';

-- ZBM for WESTERN
UPDATE app_users SET phone_number = '0720000012' WHERE zone = 'WESTERN' AND role = 'zonal_business_manager';

-- =====================================================
-- VERIFICATION: Check all ZSMs and ZBMs now have phone numbers
-- =====================================================

SELECT 
  full_name, 
  role, 
  zone, 
  phone_number,
  CASE 
    WHEN phone_number IS NULL OR phone_number = '' THEN '❌ STILL MISSING' 
    ELSE '✅ FIXED' 
  END as status
FROM app_users
WHERE role IN ('zonal_sales_manager', 'zonal_business_manager')
ORDER BY role, zone, full_name;

-- Count summary
SELECT 
  role,
  COUNT(*) as total_count,
  COUNT(phone_number) as with_phone,
  COUNT(*) - COUNT(phone_number) as missing_phone
FROM app_users
WHERE role IN ('zonal_sales_manager', 'zonal_business_manager')
GROUP BY role;

COMMIT;
