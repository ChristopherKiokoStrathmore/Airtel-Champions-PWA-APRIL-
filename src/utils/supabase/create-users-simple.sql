-- =====================================================
-- TAI - SIMPLE USER CREATION (RECOMMENDED)
-- =====================================================
-- This script creates ONLY profile records in public.users
-- You must create auth users manually in Supabase Dashboard first
-- Then run this script to add profile data
-- =====================================================

-- STEP 1: Create auth users in Supabase Dashboard first!
-- Go to: Authentication → Users → Add User
-- For each user below, create auth account with email + password

-- =====================================================
-- STEP 2: Run this SQL to create profiles
-- =====================================================

-- Note: Replace the UUIDs below with actual UUIDs from auth.users
-- after you create them in Step 1

-- =====================================================
-- FIELD AGENTS (Top 17)
-- =====================================================

INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, zone, region, zsm, zbm, total_points, rank, level, current_streak, longest_streak, last_submission_date)
VALUES
-- Top 10 performers
('REPLACE-WITH-UUID-1', 'john.kamau@airtel.co.ke', '0712345001', 'John Kamau', 'EMP001', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 850, 1, 17, 45, 60, '2024-12-29'),
('REPLACE-WITH-UUID-2', 'mary.njeri@airtel.co.ke', '0712345002', 'Mary Njeri', 'EMP002', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 820, 2, 16, 42, 55, '2024-12-29'),
('REPLACE-WITH-UUID-3', 'james.mwangi@airtel.co.ke', '0712345003', 'James Mwangi', 'EMP003', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 790, 3, 16, 40, 52, '2024-12-29'),
('REPLACE-WITH-UUID-4', 'grace.wanjiku@airtel.co.ke', '0712345004', 'Grace Wanjiku', 'EMP004', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 760, 4, 15, 38, 50, '2024-12-29'),
('REPLACE-WITH-UUID-5', 'peter.otieno@airtel.co.ke', '0712345005', 'Peter Otieno', 'EMP005', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 730, 5, 15, 35, 48, '2024-12-29'),
('REPLACE-WITH-UUID-6', 'lucy.akinyi@airtel.co.ke', '0712345006', 'Lucy Akinyi', 'EMP006', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 700, 6, 14, 33, 45, '2024-12-29'),
('REPLACE-WITH-UUID-7', 'paul.mutua@airtel.co.ke', '0712345007', 'Paul Mutua', 'EMP007', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 670, 7, 14, 30, 42, '2024-12-29'),
('REPLACE-WITH-UUID-8', 'ann.wambui@airtel.co.ke', '0712345008', 'Ann Wambui', 'EMP008', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 640, 8, 13, 28, 40, '2024-12-29'),
('REPLACE-WITH-UUID-9', 'steve.kibet@airtel.co.ke', '0712345009', 'Steve Kibet', 'EMP009', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 610, 9, 13, 25, 38, '2024-12-29'),
('REPLACE-WITH-UUID-10', 'jane.wanjiru@airtel.co.ke', '0712345010', 'Jane Wanjiru', 'EMP010', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 580, 10, 12, 22, 35, '2024-12-29'),

-- Mid-tier agents (11-15)
('REPLACE-WITH-UUID-11', 'david.kimani@airtel.co.ke', '0712345011', 'David Kimani', 'EMP011', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 550, 11, 12, 20, 32, '2024-12-29'),
('REPLACE-WITH-UUID-12', 'susan.nyambura@airtel.co.ke', '0712345012', 'Susan Nyambura', 'EMP012', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 520, 12, 11, 18, 30, '2024-12-28'),
('REPLACE-WITH-UUID-13', 'michael.ouma@airtel.co.ke', '0712345013', 'Michael Ouma', 'EMP013', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 490, 13, 11, 15, 28, '2024-12-28'),
('REPLACE-WITH-UUID-14', 'rose.adhiambo@airtel.co.ke', '0712345014', 'Rose Adhiambo', 'EMP014', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 460, 14, 10, 12, 25, '2024-12-27'),
('REPLACE-WITH-UUID-15', 'daniel.kipchoge@airtel.co.ke', '0712345015', 'Daniel Kipchoge', 'EMP015', 'field_agent', 'Zone 1', 'Nairobi', 'Alice Mwangi', 'David Ochieng', 430, 15, 10, 10, 22, '2024-12-27'),

-- Other zones
('REPLACE-WITH-UUID-16', 'hassan.mohamed@airtel.co.ke', '0723456001', 'Hassan Mohamed', 'EMP201', 'field_agent', 'Zone 2', 'Mombasa', 'Bob Wekesa', 'Emma Kariuki', 720, 16, 15, 32, 45, '2024-12-29'),
('REPLACE-WITH-UUID-17', 'fatuma.ali@airtel.co.ke', '0723456002', 'Fatuma Ali', 'EMP202', 'field_agent', 'Zone 2', 'Mombasa', 'Bob Wekesa', 'Emma Kariuki', 620, 20, 13, 25, 38, '2024-12-29');

-- =====================================================
-- ZONE COMMANDERS (ZSMs) - 5 total
-- =====================================================

INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, zone, region)
VALUES
('REPLACE-WITH-UUID-18', 'alice.mwangi@airtel.co.ke', '0711111001', 'Alice Mwangi', 'ZSM01', 'zone_commander', 'Zone 1', 'Nairobi'),
('REPLACE-WITH-UUID-19', 'bob.wekesa@airtel.co.ke', '0711111002', 'Bob Wekesa', 'ZSM02', 'zone_commander', 'Zone 2', 'Mombasa'),
('REPLACE-WITH-UUID-20', 'carol.juma@airtel.co.ke', '0711111003', 'Carol Juma', 'ZSM03', 'zone_commander', 'Zone 3', 'Kisumu'),
('REPLACE-WITH-UUID-21', 'diana.chebet@airtel.co.ke', '0711111004', 'Diana Chebet', 'ZSM04', 'zone_commander', 'Zone 4', 'Eldoret'),
('REPLACE-WITH-UUID-22', 'edward.njenga@airtel.co.ke', '0711111005', 'Edward Njenga', 'ZSM05', 'zone_commander', 'Zone 5', 'Nakuru');

-- =====================================================
-- ZONE BUSINESS LEADS (ZBMs) - 5 total
-- =====================================================

INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, zone, region)
VALUES
('REPLACE-WITH-UUID-23', 'david.ochieng@airtel.co.ke', '0722222001', 'David Ochieng', 'ZBM01', 'zone_business_lead', 'Zone 1', 'Nairobi'),
('REPLACE-WITH-UUID-24', 'emma.kariuki@airtel.co.ke', '0722222002', 'Emma Kariuki', 'ZBM02', 'zone_business_lead', 'Zone 2', 'Mombasa'),
('REPLACE-WITH-UUID-25', 'frank.ndungu@airtel.co.ke', '0722222003', 'Frank Ndungu', 'ZBM03', 'zone_business_lead', 'Zone 3', 'Kisumu'),
('REPLACE-WITH-UUID-26', 'grace.mutai@airtel.co.ke', '0722222004', 'Grace Mutai', 'ZBM04', 'zone_business_lead', 'Zone 4', 'Eldoret'),
('REPLACE-WITH-UUID-27', 'hannah.wairimu@airtel.co.ke', '0722222005', 'Hannah Wairimu', 'ZBM05', 'zone_business_lead', 'Zone 5', 'Nakuru');

-- =====================================================
-- HQ TEAM - 3 members
-- =====================================================

INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, region)
VALUES
('REPLACE-WITH-UUID-28', 'isaac.kiptoo@airtel.co.ke', '0733333001', 'Isaac Kiptoo', 'HQ01', 'hq_team', 'National'),
('REPLACE-WITH-UUID-29', 'joy.wambugu@airtel.co.ke', '0733333002', 'Joy Wambugu', 'HQ02', 'hq_team', 'National'),
('REPLACE-WITH-UUID-30', 'kevin.njoroge@airtel.co.ke', '0733333003', 'Kevin Njoroge', 'HQ03', 'hq_team', 'National');

-- =====================================================
-- DIRECTOR - 1 person
-- =====================================================

INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, region)
VALUES
('REPLACE-WITH-UUID-31', 'ashish.azad@airtel.co.ke', '0744444001', 'Ashish Azad', 'DIR01', 'director', 'National');

-- =====================================================
-- VERIFICATION
-- =====================================================

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

SELECT full_name, phone_number, email, role, zone
FROM public.users
ORDER BY role, rank;
