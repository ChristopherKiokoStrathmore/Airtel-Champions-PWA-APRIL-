-- =====================================================
-- CREATE TEST USERS FOR TAI
-- =====================================================
-- This creates 5 essential test users (one per role)
-- for immediate testing of the TAI application.
--
-- IMPORTANT: Run this AFTER creating auth users!
-- See instructions below for creating auth users first.
-- =====================================================

-- =====================================================
-- STEP 1: CREATE AUTH USERS (Do this in Dashboard FIRST!)
-- =====================================================
-- You MUST create these 5 users in Supabase Dashboard first:
--
-- Go to: Authentication → Users → Add User
--
-- User 1 (Field Agent):
-- Email: john.kamau@airtel.co.ke
-- Password: JohnTAI@2024!
-- User Metadata: {"phone": "0712345001", "full_name": "John Kamau"}
-- Auto Confirm: ✓
--
-- User 2 (Zone Commander):
-- Email: alice.mwangi@airtel.co.ke
-- Password: AliceTAI@2024!
-- User Metadata: {"phone": "0711111001", "full_name": "Alice Mwangi"}
-- Auto Confirm: ✓
--
-- User 3 (Zone Business Lead):
-- Email: david.ochieng@airtel.co.ke
-- Password: DavidTAI@2024!
-- User Metadata: {"phone": "0722222001", "full_name": "David Ochieng"}
-- Auto Confirm: ✓
--
-- User 4 (HQ Team):
-- Email: isaac.kiptoo@airtel.co.ke
-- Password: IsaacTAI@2024!
-- User Metadata: {"phone": "0733333001", "full_name": "Isaac Kiptoo"}
-- Auto Confirm: ✓
--
-- User 5 (Director):
-- Email: ashish.azad@airtel.co.ke
-- Password: AshishTAI@2024!
-- User Metadata: {"phone": "0744444001", "full_name": "Ashish Azad"}
-- Auto Confirm: ✓
--
-- THEN: Copy each user's UUID and replace below!
-- =====================================================

-- =====================================================
-- STEP 2: GET REAL UUIDs FROM SUPABASE AUTH
-- =====================================================
-- After creating the 5 users above, run this query to get their UUIDs:

SELECT 
  id,
  email,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
)
ORDER BY email;

-- Copy the UUIDs and replace the placeholders below!
-- =====================================================

-- =====================================================
-- STEP 3: REPLACE THESE UUIDs WITH REAL ONES!
-- =====================================================
-- TODO: Replace these placeholder UUIDs with real UUIDs from Step 2

-- John Kamau (Field Agent)
-- REPLACE: 'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS'
-- WITH: Real UUID from auth.users table

-- Alice Mwangi (Zone Commander)
-- REPLACE: 'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS'
-- WITH: Real UUID from auth.users table

-- David Ochieng (Zone Business Lead)
-- REPLACE: 'REPLACE-WITH-DAVID-UUID-FROM-AUTH-USERS'
-- WITH: Real UUID from auth.users table

-- Isaac Kiptoo (HQ Team)
-- REPLACE: 'REPLACE-WITH-ISAAC-UUID-FROM-AUTH-USERS'
-- WITH: Real UUID from auth.users table

-- Ashish Azad (Director)
-- REPLACE: 'REPLACE-WITH-ASHISH-UUID-FROM-AUTH-USERS'
-- WITH: Real UUID from auth.users table

-- =====================================================
-- STEP 4: INSERT USER PROFILES
-- =====================================================

-- Clean existing test data
DELETE FROM users WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
);

-- Insert 5 test users
INSERT INTO users (
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
) VALUES

-- 1. John Kamau - Field Agent (Top Performer)
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'john.kamau@airtel.co.ke',
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
  CURRENT_DATE,
  NOW(),
  NOW()
),

-- 2. Alice Mwangi - Zone Commander
(
  'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'alice.mwangi@airtel.co.ke',
  '0711111001',
  'Alice Mwangi',
  'ZSM01',
  'zone_commander',
  'Zone 1',
  'Nairobi',
  NULL,
  NULL,
  0,
  999,
  1,
  0,
  0,
  NULL,
  NOW(),
  NOW()
),

-- 3. David Ochieng - Zone Business Lead
(
  'REPLACE-WITH-DAVID-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'david.ochieng@airtel.co.ke',
  '0722222001',
  'David Ochieng',
  'ZBM01',
  'zone_business_lead',
  'Zone 1',
  'Nairobi',
  NULL,
  NULL,
  0,
  999,
  1,
  0,
  0,
  NULL,
  NOW(),
  NOW()
),

-- 4. Isaac Kiptoo - HQ Team
(
  'REPLACE-WITH-ISAAC-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'isaac.kiptoo@airtel.co.ke',
  '0733333001',
  'Isaac Kiptoo',
  'HQ01',
  'hq_team',
  NULL,
  'National',
  NULL,
  NULL,
  0,
  999,
  1,
  0,
  0,
  NULL,
  NOW(),
  NOW()
),

-- 5. Ashish Azad - Director
(
  'REPLACE-WITH-ASHISH-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'ashish.azad@airtel.co.ke',
  '0744444001',
  'Ashish Azad',
  'DIR01',
  'director',
  NULL,
  'National',
  NULL,
  NULL,
  0,
  999,
  1,
  0,
  0,
  NULL,
  NOW(),
  NOW()
);

-- =====================================================
-- STEP 5: CREATE SAMPLE SUBMISSIONS FOR JOHN
-- =====================================================
-- Give John some submissions to display in the app

INSERT INTO submissions (
  agent_id,
  agent_name,
  agent_employee_id,
  program_id,
  program_name,
  program_icon,
  photo_url,
  notes,
  latitude,
  longitude,
  location_name,
  captured_at,
  status,
  reviewed_by,
  reviewed_by_name,
  review_notes,
  reviewed_at,
  points_earned,
  created_at
) VALUES
-- Submission 1: Approved
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'John Kamau',
  'EMP001',
  1,
  'Network Experience',
  '📶',
  'https://placehold.co/600x400/3B82F6/FFFFFF?text=Network+Coverage+Westlands',
  'Poor network coverage in Westlands area. Multiple customer complaints reported. Signal drops frequently during peak hours.',
  -1.2641,
  36.8107,
  'Westlands, Nairobi',
  NOW() - INTERVAL '2 days',
  'approved',
  'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'Alice Mwangi',
  'Excellent intel! Well documented. Escalated to network team.',
  NOW() - INTERVAL '1 day',
  10,
  NOW() - INTERVAL '2 days'
),

-- Submission 2: Approved
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'John Kamau',
  'EMP001',
  2,
  'Competition Conversion',
  '🎯',
  'https://placehold.co/600x400/10B981/FFFFFF?text=Safaricom+Conversion',
  'Successfully converted Safaricom customer to Airtel. Customer cited better data rates and customer service. Contract signed for 24 months.',
  -1.2921,
  36.8219,
  'CBD, Nairobi',
  NOW() - INTERVAL '3 days',
  'approved',
  'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'Alice Mwangi',
  'Great work! This is exactly the kind of competitive intel we need.',
  NOW() - INTERVAL '2 days',
  10,
  NOW() - INTERVAL '3 days'
),

-- Submission 3: Pending
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'John Kamau',
  'EMP001',
  3,
  'New Site Launch',
  '🚀',
  'https://placehold.co/600x400/8B5CF6/FFFFFF?text=New+5G+Tower',
  'New Airtel 5G site launched at Junction Mall. Excellent coverage. Speed test shows 250 Mbps download.',
  -1.2630,
  36.8063,
  'Junction Mall, Nairobi',
  NOW() - INTERVAL '4 hours',
  'pending',
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NOW() - INTERVAL '4 hours'
),

-- Submission 4: Rejected
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'John Kamau',
  'EMP001',
  4,
  'AMB Visitation',
  '🏢',
  'https://placehold.co/600x400/F97316/FFFFFF?text=AMB+Gikomba',
  'AMB agent at Gikomba reports high foot traffic.',
  -1.2845,
  36.8342,
  'Gikomba, Nairobi',
  NOW() - INTERVAL '5 days',
  'rejected',
  'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'Alice Mwangi',
  'Please add more details: transaction volumes, stock levels, and customer feedback.',
  NOW() - INTERVAL '4 days',
  0,
  NOW() - INTERVAL '5 days'
),

-- Submission 5: Approved (today - for streak)
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'John Kamau',
  'EMP001',
  1,
  'Network Experience',
  '📶',
  'https://placehold.co/600x400/3B82F6/FFFFFF?text=5G+Speed+Test',
  'Excellent 5G performance in Karen area. Consistent 180+ Mbps speeds. Customer satisfaction high.',
  -1.3196,
  36.7076,
  'Karen, Nairobi',
  NOW() - INTERVAL '2 hours',
  'approved',
  'REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'Alice Mwangi',
  'Perfect! Keep up the great work.',
  NOW() - INTERVAL '1 hour',
  10,
  NOW() - INTERVAL '2 hours'
);

-- =====================================================
-- STEP 6: CREATE DAILY MISSIONS FOR JOHN
-- =====================================================

INSERT INTO daily_missions (
  user_id,
  mission_date,
  mission_1_progress, mission_1_completed, mission_1_claimed,
  mission_2_progress, mission_2_completed, mission_2_claimed,
  mission_3_progress, mission_3_completed, mission_3_claimed
) VALUES
(
  'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  CURRENT_DATE,
  2,  -- Network Scout: 2/3 submissions
  false,
  false,
  2,  -- Quality Agent: 2/2 approvals ✓
  true,
  false,  -- Not claimed yet
  1,  -- Early Bird: 1/1 ✓
  true,
  true  -- Already claimed
);

-- =====================================================
-- STEP 7: AWARD BADGES TO JOHN
-- =====================================================

INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES
('REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS', 1, NOW() - INTERVAL '60 days'),  -- First Step
('REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS', 2, NOW() - INTERVAL '50 days'),  -- Early Bird
('REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS', 3, NOW() - INTERVAL '40 days'),  -- Week Warrior
('REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS', 4, NOW() - INTERVAL '30 days'),  -- Quality Agent
('REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS', 7, NOW() - INTERVAL '20 days');  -- Century Club

-- ⚠️ REPLACE ALL 'REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS' ABOVE!

-- =====================================================
-- STEP 8: CREATE ANNOUNCEMENTS
-- =====================================================

INSERT INTO announcements (
  title,
  message,
  short_message,
  author_id,
  author_name,
  author_role,
  priority,
  target_audience,
  icon,
  color,
  is_active
) VALUES
(
  'Q1 Target Achievement',
  'Congratulations team! We''ve achieved 95% of our Q1 targets. Keep up the excellent work in capturing competitive intelligence. Focus on Network Experience submissions this week!',
  'Congratulations team! We''ve achieved 95% of our Q1 targets...',
  'REPLACE-WITH-ASHISH-UUID-FROM-AUTH-USERS',  -- ⚠️ REPLACE THIS!
  'Ashish Azad',
  'S & D Director',
  'high',
  'all',
  '🎯',
  'red',
  true
);

-- =====================================================
-- STEP 9: VERIFICATION QUERIES
-- =====================================================
-- Run these to verify everything worked:

-- Check users created
SELECT 
  full_name, 
  employee_id, 
  role, 
  zone, 
  total_points, 
  rank,
  phone_number
FROM users
WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
)
ORDER BY role;

-- Check John's submissions
SELECT 
  program_name,
  status,
  notes,
  points_earned,
  created_at
FROM submissions
WHERE agent_employee_id = 'EMP001'
ORDER BY created_at DESC;

-- Check John's badges
SELECT 
  b.name,
  b.rarity,
  ub.unlocked_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
WHERE ub.user_id = (SELECT id FROM users WHERE employee_id = 'EMP001')
ORDER BY ub.unlocked_at;

-- Check John's daily missions
SELECT 
  mission_date,
  mission_1_progress,
  mission_1_completed,
  mission_2_progress,
  mission_2_completed,
  mission_3_progress,
  mission_3_completed
FROM daily_missions
WHERE user_id = (SELECT id FROM users WHERE employee_id = 'EMP001');

-- =====================================================
-- SUCCESS! 🎉
-- =====================================================
-- If all queries return data, you're ready to test!
--
-- LOGIN CREDENTIALS:
-- 
-- Field Agent:
-- Phone: 0712345001
-- Password: JohnTAI@2024!
--
-- Zone Commander:
-- Phone: 0711111001
-- Password: AliceTAI@2024!
--
-- Zone Business Lead:
-- Phone: 0722222001
-- Password: DavidTAI@2024!
--
-- HQ Team:
-- Phone: 0733333001
-- Password: IsaacTAI@2024!
--
-- Director:
-- Phone: 0744444001
-- Password: AshishTAI@2024!
-- =====================================================
