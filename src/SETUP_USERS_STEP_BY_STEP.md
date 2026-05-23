# 🚀 TAI USER SETUP - COMPLETE GUIDE

## 📋 **EASIEST METHOD: Copy & Paste SQL**

Follow these steps to create 5 test users (one per role) in 10 minutes.

---

## ✅ **STEP 1: Open Supabase SQL Editor**

1. Go to your Supabase Dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**
4. You're ready to paste SQL!

---

## 📝 **STEP 2: Run User Creation SQL**

Copy and paste this ENTIRE script into the SQL Editor, then click **"Run"**:

```sql
-- =====================================================
-- TAI - CREATE 5 ESSENTIAL TEST USERS
-- =====================================================
-- Creates auth users + profiles for all 5 role types
-- =====================================================

-- Field Agent: John Kamau
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
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
    recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'john.kamau@airtel.co.ke',
    crypt('JohnTAI@2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"0712345001","full_name":"John Kamau"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'john.kamau@airtel.co.ke'
  )
  RETURNING id INTO v_user_id;

  -- Create profile
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id, email, phone_number, full_name, employee_id, role, 
      zone, region, zsm, zbm, total_points, rank, level, 
      current_streak, longest_streak, last_submission_date
    ) VALUES (
      v_user_id,
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
      '2024-12-29'
    );
    RAISE NOTICE '✅ Created: John Kamau (Field Agent)';
  ELSE
    RAISE NOTICE '⏭️  Skipped: John Kamau already exists';
  END IF;
END $$;

-- Zone Commander: Alice Mwangi
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'alice.mwangi@airtel.co.ke',
    crypt('AliceTAI@2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"0711111001","full_name":"Alice Mwangi"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'alice.mwangi@airtel.co.ke'
  )
  RETURNING id INTO v_user_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id, email, phone_number, full_name, employee_id, role, zone, region
    ) VALUES (
      v_user_id,
      'alice.mwangi@airtel.co.ke',
      '0711111001',
      'Alice Mwangi',
      'ZSM01',
      'zone_commander',
      'Zone 1',
      'Nairobi'
    );
    RAISE NOTICE '✅ Created: Alice Mwangi (Zone Commander)';
  ELSE
    RAISE NOTICE '⏭️  Skipped: Alice Mwangi already exists';
  END IF;
END $$;

-- Zone Business Lead: David Ochieng
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'david.ochieng@airtel.co.ke',
    crypt('DavidTAI@2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"0722222001","full_name":"David Ochieng"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'david.ochieng@airtel.co.ke'
  )
  RETURNING id INTO v_user_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id, email, phone_number, full_name, employee_id, role, zone, region
    ) VALUES (
      v_user_id,
      'david.ochieng@airtel.co.ke',
      '0722222001',
      'David Ochieng',
      'ZBM01',
      'zone_business_lead',
      'Zone 1',
      'Nairobi'
    );
    RAISE NOTICE '✅ Created: David Ochieng (Zone Business Lead)';
  ELSE
    RAISE NOTICE '⏭️  Skipped: David Ochieng already exists';
  END IF;
END $$;

-- HQ Team: Isaac Kiptoo
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'isaac.kiptoo@airtel.co.ke',
    crypt('IsaacTAI@2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"0733333001","full_name":"Isaac Kiptoo"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'isaac.kiptoo@airtel.co.ke'
  )
  RETURNING id INTO v_user_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id, email, phone_number, full_name, employee_id, role, region
    ) VALUES (
      v_user_id,
      'isaac.kiptoo@airtel.co.ke',
      '0733333001',
      'Isaac Kiptoo',
      'HQ01',
      'hq_team',
      'National'
    );
    RAISE NOTICE '✅ Created: Isaac Kiptoo (HQ Team)';
  ELSE
    RAISE NOTICE '⏭️  Skipped: Isaac Kiptoo already exists';
  END IF;
END $$;

-- Director: Ashish Azad
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ashish.azad@airtel.co.ke',
    crypt('AshishTAI@2024!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"0744444001","full_name":"Ashish Azad"}'::jsonb,
    NOW(), NOW(), '', '', '', ''
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'ashish.azad@airtel.co.ke'
  )
  RETURNING id INTO v_user_id;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (
      id, email, phone_number, full_name, employee_id, role, region
    ) VALUES (
      v_user_id,
      'ashish.azad@airtel.co.ke',
      '0744444001',
      'Ashish Azad',
      'DIR01',
      'director',
      'National'
    );
    RAISE NOTICE '✅ Created: Ashish Azad (Director)';
  ELSE
    RAISE NOTICE '⏭️  Skipped: Ashish Azad already exists';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show created users
SELECT 
  full_name,
  phone_number,
  email,
  role,
  zone,
  CASE role
    WHEN 'field_agent' THEN '🦅 Field Agent'
    WHEN 'zone_commander' THEN '🎖️ Zone Commander'
    WHEN 'zone_business_lead' THEN '💼 Zone Business Lead'
    WHEN 'hq_team' THEN '🏢 HQ Team'
    WHEN 'director' THEN '👔 Director'
  END as role_display
FROM public.users
ORDER BY 
  CASE role
    WHEN 'field_agent' THEN 1
    WHEN 'zone_commander' THEN 2
    WHEN 'zone_business_lead' THEN 3
    WHEN 'hq_team' THEN 4
    WHEN 'director' THEN 5
  END;

-- Count by role
SELECT 
  role,
  COUNT(*) as count
FROM public.users
GROUP BY role;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SUCCESS! 5 users created and ready to login!';
  RAISE NOTICE '';
  RAISE NOTICE '📱 LOGIN CREDENTIALS:';
  RAISE NOTICE '';
  RAISE NOTICE '🦅 Field Agent:';
  RAISE NOTICE '   Phone: 0712345001';
  RAISE NOTICE '   Password: JohnTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '🎖️ Zone Commander:';
  RAISE NOTICE '   Phone: 0711111001';
  RAISE NOTICE '   Password: AliceTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '💼 Zone Business Lead:';
  RAISE NOTICE '   Phone: 0722222001';
  RAISE NOTICE '   Password: DavidTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 HQ Team:';
  RAISE NOTICE '   Phone: 0733333001';
  RAISE NOTICE '   Password: IsaacTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '👔 Director:';
  RAISE NOTICE '   Phone: 0744444001';
  RAISE NOTICE '   Password: AshishTAI@2024!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ You can now login to TAI with these credentials!';
END $$;
```

---

## ✅ **STEP 3: Verify Users Created**

You should see output like:

```
✅ Created: John Kamau (Field Agent)
✅ Created: Alice Mwangi (Zone Commander)
✅ Created: David Ochieng (Zone Business Lead)
✅ Created: Isaac Kiptoo (HQ Team)
✅ Created: Ashish Azad (Director)

🎉 SUCCESS! 5 users created and ready to login!
```

---

## 🔐 **STEP 4: TEST LOGIN**

### **Test 1: Field Agent**
```
Phone: 0712345001
Password: JohnTAI@2024!

Expected: Home screen with rank #1, 850 points
```

### **Test 2: Zone Commander**
```
Phone: 0711111001
Password: AliceTAI@2024!

Expected: ZSM Dashboard with review queue
```

### **Test 3: Zone Business Lead**
```
Phone: 0722222001
Password: DavidTAI@2024!

Expected: ZBM Dashboard with business metrics
```

### **Test 4: HQ Team**
```
Phone: 0733333001
Password: IsaacTAI@2024!

Expected: HQ Dashboard with national overview
```

### **Test 5: Director**
```
Phone: 0744444001
Password: AshishTAI@2024!

Expected: Director Dashboard with executive summary
```

---

## 🔧 **TROUBLESHOOTING**

### **Error: "relation auth.users does not exist"**

Your Supabase project might not allow direct auth.users access. Use this alternative:

1. Go to **Authentication → Users** in Supabase Dashboard
2. Click **"Add User"** manually for each:

```
User 1:
Email: john.kamau@airtel.co.ke
Password: JohnTAI@2024!
Auto Confirm: ✓

User 2:
Email: alice.mwangi@airtel.co.ke
Password: AliceTAI@2024!
Auto Confirm: ✓

... (repeat for all 5)
```

3. Then run this simpler SQL to add profiles:

```sql
-- Get the UUIDs from auth.users
SELECT id, email FROM auth.users;

-- Then insert profiles (replace UUIDs):
INSERT INTO public.users (id, email, phone_number, full_name, employee_id, role, zone, region, total_points, rank, level, current_streak, longest_streak, last_submission_date)
VALUES
('PASTE-JOHN-UUID-HERE', 'john.kamau@airtel.co.ke', '0712345001', 'John Kamau', 'EMP001', 'field_agent', 'Zone 1', 'Nairobi', 850, 1, 17, 45, 60, '2024-12-29');

-- Repeat for other 4 users...
```

---

### **Error: "duplicate key value violates unique constraint"**

Users already exist! Check existing users:

```sql
SELECT email, phone_number FROM public.users;
```

---

### **Login fails: "Phone number not found"**

Check phone_number exactly matches:

```sql
SELECT phone_number FROM public.users WHERE email = 'john.kamau@airtel.co.ke';
```

Should return: `0712345001` (no spaces, dashes, or +254)

---

## 📊 **SUMMARY TABLE**

| Name | Role | Phone | Password | Zone |
|------|------|-------|----------|------|
| John Kamau | Field Agent | 0712345001 | JohnTAI@2024! | Zone 1 |
| Alice Mwangi | Zone Commander | 0711111001 | AliceTAI@2024! | Zone 1 |
| David Ochieng | Zone Business Lead | 0722222001 | DavidTAI@2024! | Zone 1 |
| Isaac Kiptoo | HQ Team | 0733333001 | IsaacTAI@2024! | National |
| Ashish Azad | Director | 0744444001 | AshishTAI@2024! | National |

---

## 🚀 **NEXT STEPS**

After creating these 5 users:

1. ✅ **Login as each role** to test
2. ✅ **Run seed-data.sql** to add submissions/badges
3. ✅ **Test full workflows**:
   - Field Agent submits intelligence
   - Zone Commander reviews
   - Leaderboard updates
   - Gamification works

---

## 💡 **NEED MORE USERS?**

To create additional users (top 10 agents, all ZSMs, etc.), use:

- `/utils/supabase/create-users-complete.sql` (24 users total)
- Or repeat the pattern above for each new user

---

## ✅ **SUCCESS!**

You now have 5 working test accounts covering all role types. You can login and test the complete TAI experience! 🦅✨

**Ready to test TAI!** 🚀
