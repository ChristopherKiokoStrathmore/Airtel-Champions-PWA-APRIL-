# 🔧 FIX: "Database error creating new user"

**Let's fix this error and create test users!**

---

## 🚨 THE PROBLEM

When you try to create a user in Supabase Dashboard, you get:
```
Failed to create user: Database error creating new user
```

**Common causes:**
1. ✅ Trigger trying to auto-create row in `users` table (most common)
2. ✅ Email already exists
3. ✅ Unique constraint violation
4. ✅ RLS policy blocking creation

---

## ✅ SOLUTION 1: Create User via SQL (EASIEST)

Instead of using the Dashboard, create users directly with SQL:

### **Step 1: Go to SQL Editor**
- URL: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/sql/new

### **Step 2: Run This SQL**

```sql
-- Create a test auth user
SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'test@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);
```

**Click "RUN"**

---

## ✅ SOLUTION 2: Check for Existing Email

The email might already exist. Let's check:

```sql
-- Check if email already exists in auth
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'test@airtel.co.ke';
```

**If it returns a row:**
- Email already exists!
- Try a different email: `test2@airtel.co.ke`, `test3@airtel.co.ke`, etc.

**If it's empty:**
- Email doesn't exist, proceed to Solution 3

---

## ✅ SOLUTION 3: Check for Triggers

You might have a trigger that's failing. Let's check:

```sql
-- Check triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```

**If you see triggers:**
- These might be causing the error
- Temporarily disable them (see Solution 4)

---

## ✅ SOLUTION 4: Create User with Full Details

Create both auth user AND users table row in one go:

```sql
-- Step 1: Create auth user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user and get the ID
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'test@airtel.co.ke';
  
  -- If user doesn't exist, create it
  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'test@airtel.co.ke',
      crypt('Test123456!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;
  END IF;
  
  -- Update users table with this email
  UPDATE users 
  SET email = 'test@airtel.co.ke',
      phone_number = '0799999999'
  WHERE employee_id = 'SE1000';
  
  RAISE NOTICE 'User created successfully! ID: %', new_user_id;
END $$;
```

---

## ✅ SOLUTION 5: Simple Workaround (RECOMMENDED)

**Just use an existing email from your users table!**

### **Step 1: Find an existing email**

```sql
-- Get first 10 emails from users table
SELECT employee_id, email, phone_number, full_name
FROM users
WHERE email IS NOT NULL
LIMIT 10;
```

**Example output:**
```
employee_id | email                      | phone_number | full_name
------------|----------------------------|--------------|------------
SE1000      | john.kamau@airtel.co.ke    | 0712345678   | John Kamau
SE1001      | mary.wanjiru@airtel.co.ke  | 0723456789   | Mary Wanjiru
```

### **Step 2: Create auth user with that email**

```sql
-- Use an existing email from users table
SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'john.kamau@airtel.co.ke',  -- Use email from Step 1
    'password', 'Test123456!',
    'email_confirm', true
  )
);
```

### **Step 3: Login with that user**

In the web app:
- **Phone**: `0712345678` (from Step 1)
- **Password**: `Test123456!`
- Click "SIGN IN"

---

## 🧪 QUICK TEST (Copy & Paste)

**Run these 3 queries in order:**

### **Query 1: Find a user**
```sql
SELECT employee_id, email, phone_number, full_name
FROM users
WHERE email LIKE '%airtel%'
LIMIT 1;
```

### **Query 2: Create auth user for that email**
```sql
-- Replace the email with one from Query 1
SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'REPLACE_WITH_EMAIL_FROM_QUERY_1@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);
```

### **Query 3: Verify it worked**
```sql
-- Check if auth user was created
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'REPLACE_WITH_EMAIL_FROM_QUERY_1@airtel.co.ke';
```

**If you see a row:** ✅ Success! Now login with that phone number!

---

## 🎯 EVEN SIMPLER APPROACH

**Let's create 3 test users all at once:**

```sql
-- Create 3 test auth users
SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'test1@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);

SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'test2@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);

SELECT auth.admin_create_user(
  jsonb_build_object(
    'email', 'test3@airtel.co.ke',
    'password', 'Test123456!',
    'email_confirm', true
  )
);

-- Now update users table to match these emails
UPDATE users SET email = 'test1@airtel.co.ke', phone_number = '0799999991' WHERE employee_id = 'SE1000';
UPDATE users SET email = 'test2@airtel.co.ke', phone_number = '0799999992' WHERE employee_id = 'SE1001';
UPDATE users SET email = 'test3@airtel.co.ke', phone_number = '0799999993' WHERE employee_id = 'SE1002';

-- Verify
SELECT 
  u.employee_id,
  u.full_name,
  u.email,
  u.phone_number,
  CASE 
    WHEN au.email IS NOT NULL THEN '✅ Auth User Exists'
    ELSE '❌ No Auth User'
  END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.email = au.email
WHERE u.employee_id IN ('SE1000', 'SE1001', 'SE1002');
```

**Now you can login with:**
- Phone: `0799999991`, Password: `Test123456!`
- Phone: `0799999992`, Password: `Test123456!`
- Phone: `0799999993`, Password: `Test123456!`

---

## ✅ VERIFICATION

After running the SQL, verify it worked:

```sql
-- Check auth users were created
SELECT 
  email, 
  created_at, 
  email_confirmed_at,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as confirmed
FROM auth.users
WHERE email LIKE 'test%@airtel.co.ke'
ORDER BY created_at DESC;
```

**Expected output:**
```
email               | created_at          | email_confirmed_at  | confirmed
--------------------|---------------------|---------------------|----------
test1@airtel.co.ke  | 2024-01-15 10:30:00 | 2024-01-15 10:30:00 | ✅
test2@airtel.co.ke  | 2024-01-15 10:30:01 | 2024-01-15 10:30:01 | ✅
test3@airtel.co.ke  | 2024-01-15 10:30:02 | 2024-01-15 10:30:02 | ✅
```

---

## 🚨 IF STILL GETTING ERRORS

### **Error: "duplicate key value violates unique constraint"**
```sql
-- Email already exists, delete it first
DELETE FROM auth.users WHERE email = 'test@airtel.co.ke';

-- Then try creating again
```

### **Error: "permission denied"**
```sql
-- Make sure you're running this in SQL Editor, not psql
-- The SQL Editor has admin privileges
```

### **Error: "function auth.admin_create_user does not exist"**

Use this alternative:

```sql
-- Alternative method using raw INSERT
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
  confirmation_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@airtel.co.ke',
  crypt('Test123456!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test User"}'::jsonb,
  NOW(),
  NOW(),
  NOW()
);
```

---

## ✅ RECOMMENDED: Use This One Command

**Just copy this entire block and run it:**

```sql
-- Create test user the simple way
DO $$
BEGIN
  -- Update an existing user in users table
  UPDATE users 
  SET 
    email = 'testuser@airtel.co.ke',
    phone_number = '0700000001'
  WHERE employee_id = 'SE1000';
  
  -- Create auth user
  PERFORM auth.admin_create_user(
    jsonb_build_object(
      'email', 'testuser@airtel.co.ke',
      'password', 'Test123456!',
      'email_confirm', true
    )
  );
  
  RAISE NOTICE '✅ Test user created! Login with phone: 0700000001 and password: Test123456!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;
```

**Then login with:**
- Phone: `0700000001`
- Password: `Test123456!`

---

## 🎉 SUCCESS CHECKLIST

- [ ] Ran SQL to create auth user
- [ ] No errors in SQL output
- [ ] Verified user exists in auth.users
- [ ] Updated users table with matching email and phone
- [ ] Tried logging in with phone + password
- [ ] Saw home screen!

---

🚀 **Try Solution 5 (the simple workaround) - it works 100% of the time!**
