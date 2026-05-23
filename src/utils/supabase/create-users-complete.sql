-- =====================================================
-- TAI - CREATE TEST USERS WITH AUTH
-- =====================================================
-- This script creates both auth users AND profile records
-- Run this in Supabase SQL Editor to create 24 test users
-- =====================================================

-- IMPORTANT: This uses Supabase's auth.users table
-- You need Service Role Key privileges to run this

-- =====================================================
-- HELPER FUNCTION: Create user with auth + profile
-- =====================================================

CREATE OR REPLACE FUNCTION create_tai_user(
  p_email TEXT,
  p_password TEXT,
  p_phone TEXT,
  p_full_name TEXT,
  p_employee_id TEXT,
  p_role TEXT,
  p_zone TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_zsm TEXT DEFAULT NULL,
  p_zbm TEXT DEFAULT NULL,
  p_total_points INTEGER DEFAULT 0,
  p_rank INTEGER DEFAULT 999,
  p_level INTEGER DEFAULT 1,
  p_current_streak INTEGER DEFAULT 0,
  p_longest_streak INTEGER DEFAULT 0,
  p_last_submission_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate UUID
  v_user_id := gen_random_uuid();
  
  -- Encrypt password (Supabase uses bcrypt)
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users (for authentication)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('phone', p_phone, 'full_name', p_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  );
  
  -- Insert into public.users (for profile)
  INSERT INTO public.users (
    id,
    email,
    phone_number,
    full_name,
    employee_id,
    role,
    zone,
    region,
    zsm,
    zbm,
    total_points,
    rank,
    level,
    current_streak,
    longest_streak,
    last_submission_date,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_phone,
    p_full_name,
    p_employee_id,
    p_role,
    p_zone,
    p_region,
    p_zsm,
    p_zbm,
    p_total_points,
    p_rank,
    p_level,
    p_current_streak,
    p_longest_streak,
    p_last_submission_date,
    NOW(),
    NOW()
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE FIELD AGENTS (Top 10)
-- =====================================================

-- #1 - John Kamau (Top Performer)
SELECT create_tai_user(
  'john.kamau@airtel.co.ke',
  'JohnTAI@2024!',
  '0712345001',
  'John Kamau',
  'EMP001',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  850,
  1,
  17,
  45,
  60,
  '2024-12-29'
) AS john_kamau_id;

-- #2 - Mary Njeri
SELECT create_tai_user(
  'mary.njeri@airtel.co.ke',
  'MaryTAI@2024!',
  '0712345002',
  'Mary Njeri',
  'EMP002',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  820,
  2,
  16,
  42,
  55,
  '2024-12-29'
) AS mary_njeri_id;

-- #3 - James Mwangi
SELECT create_tai_user(
  'james.mwangi@airtel.co.ke',
  'JamesTAI@2024!',
  '0712345003',
  'James Mwangi',
  'EMP003',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  790,
  3,
  16,
  40,
  52,
  '2024-12-29'
) AS james_mwangi_id;

-- #4 - Grace Wanjiku
SELECT create_tai_user(
  'grace.wanjiku@airtel.co.ke',
  'GraceTAI@2024!',
  '0712345004',
  'Grace Wanjiku',
  'EMP004',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  760,
  4,
  15,
  38,
  50,
  '2024-12-29'
) AS grace_wanjiku_id;

-- #5 - Peter Otieno
SELECT create_tai_user(
  'peter.otieno@airtel.co.ke',
  'PeterTAI@2024!',
  '0712345005',
  'Peter Otieno',
  'EMP005',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  730,
  5,
  15,
  35,
  48,
  '2024-12-29'
) AS peter_otieno_id;

-- #6 - Lucy Akinyi
SELECT create_tai_user(
  'lucy.akinyi@airtel.co.ke',
  'LucyTAI@2024!',
  '0712345006',
  'Lucy Akinyi',
  'EMP006',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  700,
  6,
  14,
  33,
  45,
  '2024-12-29'
) AS lucy_akinyi_id;

-- #7 - Paul Mutua
SELECT create_tai_user(
  'paul.mutua@airtel.co.ke',
  'PaulTAI@2024!',
  '0712345007',
  'Paul Mutua',
  'EMP007',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  670,
  7,
  14,
  30,
  42,
  '2024-12-29'
) AS paul_mutua_id;

-- #8 - Ann Wambui
SELECT create_tai_user(
  'ann.wambui@airtel.co.ke',
  'AnnTAI@2024!',
  '0712345008',
  'Ann Wambui',
  'EMP008',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  640,
  8,
  13,
  28,
  40,
  '2024-12-29'
) AS ann_wambui_id;

-- #9 - Steve Kibet
SELECT create_tai_user(
  'steve.kibet@airtel.co.ke',
  'SteveTAI@2024!',
  '0712345009',
  'Steve Kibet',
  'EMP009',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  610,
  9,
  13,
  25,
  38,
  '2024-12-29'
) AS steve_kibet_id;

-- #10 - Jane Wanjiru
SELECT create_tai_user(
  'jane.wanjiru@airtel.co.ke',
  'JaneTAI@2024!',
  '0712345010',
  'Jane Wanjiru',
  'EMP010',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  580,
  10,
  12,
  22,
  35,
  '2024-12-29'
) AS jane_wanjiru_id;

-- Mid-tier agents (11-15)
SELECT create_tai_user(
  'david.kimani@airtel.co.ke',
  'DavidKTAI@2024!',
  '0712345011',
  'David Kimani',
  'EMP011',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  550,
  11,
  12,
  20,
  32,
  '2024-12-29'
) AS david_kimani_id;

SELECT create_tai_user(
  'susan.nyambura@airtel.co.ke',
  'SusanTAI@2024!',
  '0712345012',
  'Susan Nyambura',
  'EMP012',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  520,
  12,
  11,
  18,
  30,
  '2024-12-28'
) AS susan_nyambura_id;

SELECT create_tai_user(
  'michael.ouma@airtel.co.ke',
  'MichaelTAI@2024!',
  '0712345013',
  'Michael Ouma',
  'EMP013',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  490,
  13,
  11,
  15,
  28,
  '2024-12-28'
) AS michael_ouma_id;

SELECT create_tai_user(
  'rose.adhiambo@airtel.co.ke',
  'RoseTAI@2024!',
  '0712345014',
  'Rose Adhiambo',
  'EMP014',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  460,
  14,
  10,
  12,
  25,
  '2024-12-27'
) AS rose_adhiambo_id;

SELECT create_tai_user(
  'daniel.kipchoge@airtel.co.ke',
  'DanielTAI@2024!',
  '0712345015',
  'Daniel Kipchoge',
  'EMP015',
  'field_agent',
  'Zone 1',
  'Nairobi',
  'Alice Mwangi',
  'David Ochieng',
  430,
  15,
  10,
  10,
  22,
  '2024-12-27'
) AS daniel_kipchoge_id;

-- Agents from other zones
SELECT create_tai_user(
  'hassan.mohamed@airtel.co.ke',
  'HassanTAI@2024!',
  '0723456001',
  'Hassan Mohamed',
  'EMP201',
  'field_agent',
  'Zone 2',
  'Mombasa',
  'Bob Wekesa',
  'Emma Kariuki',
  720,
  16,
  15,
  32,
  45,
  '2024-12-29'
) AS hassan_mohamed_id;

SELECT create_tai_user(
  'fatuma.ali@airtel.co.ke',
  'FatumaTAI@2024!',
  '0723456002',
  'Fatuma Ali',
  'EMP202',
  'field_agent',
  'Zone 2',
  'Mombasa',
  'Bob Wekesa',
  'Emma Kariuki',
  620,
  20,
  13,
  25,
  38,
  '2024-12-29'
) AS fatuma_ali_id;

-- =====================================================
-- CREATE ZONE COMMANDERS (ZSMs) - 5 total
-- =====================================================

-- Zone 1 - Alice Mwangi
SELECT create_tai_user(
  'alice.mwangi@airtel.co.ke',
  'AliceTAI@2024!',
  '0711111001',
  'Alice Mwangi',
  'ZSM01',
  'zone_commander',
  'Zone 1',
  'Nairobi'
) AS alice_mwangi_id;

-- Zone 2 - Bob Wekesa
SELECT create_tai_user(
  'bob.wekesa@airtel.co.ke',
  'BobTAI@2024!',
  '0711111002',
  'Bob Wekesa',
  'ZSM02',
  'zone_commander',
  'Zone 2',
  'Mombasa'
) AS bob_wekesa_id;

-- Zone 3 - Carol Juma
SELECT create_tai_user(
  'carol.juma@airtel.co.ke',
  'CarolTAI@2024!',
  '0711111003',
  'Carol Juma',
  'ZSM03',
  'zone_commander',
  'Zone 3',
  'Kisumu'
) AS carol_juma_id;

-- Zone 4 - Diana Chebet
SELECT create_tai_user(
  'diana.chebet@airtel.co.ke',
  'DianaTAI@2024!',
  '0711111004',
  'Diana Chebet',
  'ZSM04',
  'zone_commander',
  'Zone 4',
  'Eldoret'
) AS diana_chebet_id;

-- Zone 5 - Edward Njenga
SELECT create_tai_user(
  'edward.njenga@airtel.co.ke',
  'EdwardTAI@2024!',
  '0711111005',
  'Edward Njenga',
  'ZSM05',
  'zone_commander',
  'Zone 5',
  'Nakuru'
) AS edward_njenga_id;

-- =====================================================
-- CREATE ZONE BUSINESS LEADS (ZBMs) - 5 total
-- =====================================================

-- Zone 1 - David Ochieng
SELECT create_tai_user(
  'david.ochieng@airtel.co.ke',
  'DavidTAI@2024!',
  '0722222001',
  'David Ochieng',
  'ZBM01',
  'zone_business_lead',
  'Zone 1',
  'Nairobi'
) AS david_ochieng_id;

-- Zone 2 - Emma Kariuki
SELECT create_tai_user(
  'emma.kariuki@airtel.co.ke',
  'EmmaTAI@2024!',
  '0722222002',
  'Emma Kariuki',
  'ZBM02',
  'zone_business_lead',
  'Zone 2',
  'Mombasa'
) AS emma_kariuki_id;

-- Zone 3 - Frank Ndungu
SELECT create_tai_user(
  'frank.ndungu@airtel.co.ke',
  'FrankTAI@2024!',
  '0722222003',
  'Frank Ndungu',
  'ZBM03',
  'zone_business_lead',
  'Zone 3',
  'Kisumu'
) AS frank_ndungu_id;

-- Zone 4 - Grace Mutai
SELECT create_tai_user(
  'grace.mutai@airtel.co.ke',
  'GraceMTAI@2024!',
  '0722222004',
  'Grace Mutai',
  'ZBM04',
  'zone_business_lead',
  'Zone 4',
  'Eldoret'
) AS grace_mutai_id;

-- Zone 5 - Hannah Wairimu
SELECT create_tai_user(
  'hannah.wairimu@airtel.co.ke',
  'HannahTAI@2024!',
  '0722222005',
  'Hannah Wairimu',
  'ZBM05',
  'zone_business_lead',
  'Zone 5',
  'Nakuru'
) AS hannah_wairimu_id;

-- =====================================================
-- CREATE HQ TEAM - 3 members
-- =====================================================

-- HQ Member 1 - Isaac Kiptoo
SELECT create_tai_user(
  'isaac.kiptoo@airtel.co.ke',
  'IsaacTAI@2024!',
  '0733333001',
  'Isaac Kiptoo',
  'HQ01',
  'hq_team',
  NULL,
  'National'
) AS isaac_kiptoo_id;

-- HQ Member 2 - Joy Wambugu
SELECT create_tai_user(
  'joy.wambugu@airtel.co.ke',
  'JoyTAI@2024!',
  '0733333002',
  'Joy Wambugu',
  'HQ02',
  'hq_team',
  NULL,
  'National'
) AS joy_wambugu_id;

-- HQ Member 3 - Kevin Njoroge
SELECT create_tai_user(
  'kevin.njoroge@airtel.co.ke',
  'KevinTAI@2024!',
  '0733333003',
  'Kevin Njoroge',
  'HQ03',
  'hq_team',
  NULL,
  'National'
) AS kevin_njoroge_id;

-- =====================================================
-- CREATE DIRECTOR - 1 person
-- =====================================================

-- Director - Ashish Azad
SELECT create_tai_user(
  'ashish.azad@airtel.co.ke',
  'AshishTAI@2024!',
  '0744444001',
  'Ashish Azad',
  'DIR01',
  'director',
  NULL,
  'National'
) AS ashish_azad_id;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check users created
SELECT 
  role,
  COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY CASE role
  WHEN 'field_agent' THEN 1
  WHEN 'zone_commander' THEN 2
  WHEN 'zone_business_lead' THEN 3
  WHEN 'hq_team' THEN 4
  WHEN 'director' THEN 5
END;

-- View top 10 leaderboard
SELECT 
  full_name,
  employee_id,
  zone,
  total_points,
  rank,
  level,
  current_streak
FROM public.users
WHERE role = 'field_agent'
ORDER BY rank
LIMIT 10;

-- Check auth users created
SELECT 
  COUNT(*) as auth_users_count
FROM auth.users;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ SUCCESS! Created 24 test users:';
  RAISE NOTICE '   - 17 Field Agents';
  RAISE NOTICE '   - 5 Zone Commanders';
  RAISE NOTICE '   - 5 Zone Business Leads';
  RAISE NOTICE '   - 3 HQ Team Members';
  RAISE NOTICE '   - 1 Director';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 LOGIN CREDENTIALS:';
  RAISE NOTICE '   Field Agent:  0712345001 / JohnTAI@2024!';
  RAISE NOTICE '   ZSM:          0711111001 / AliceTAI@2024!';
  RAISE NOTICE '   ZBM:          0722222001 / DavidTAI@2024!';
  RAISE NOTICE '   HQ Team:      0733333001 / IsaacTAI@2024!';
  RAISE NOTICE '   Director:     0744444001 / AshishTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next: Run seed-data.sql to add submissions/badges';
END $$;

-- =====================================================
-- COMPLETE!
-- =====================================================
