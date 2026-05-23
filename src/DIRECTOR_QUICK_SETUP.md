# 🎯 DIRECTOR CREDENTIALS - READY TO USE

## **OPTION 1: QUICKEST METHOD (RECOMMENDED)**

### Use an existing ZBM's credentials and temporarily promote them:

**1. Find a ZBM to promote:**
```sql
-- Check existing ZBMs
SELECT full_name, email, phone_number, role 
FROM public.users 
WHERE zbm IS NULL AND role = 'zone_business_lead'
LIMIT 1;
```

**2. Promote to Director (temporarily):**
```sql
-- Promote DENNIS WAWERU to Director for testing
UPDATE public.users 
SET role = 'director', region = 'National', zone = 'HQ'
WHERE full_name = 'DENNIS WAWERU';
```

**3. Get his credentials:**
```sql
-- Get login phone number
SELECT phone_number, email FROM public.users WHERE full_name = 'DENNIS WAWERU';
```

**4. Login with:**
- **Phone**: `[Use the phone number from query above]`
- **Password**: The password you set when you created his auth account (or reset it in Supabase Dashboard)

---

## **OPTION 2: CREATE NEW DIRECTOR**

### Step-by-Step Guide:

### **A. Create in Supabase Dashboard (Easiest)**

1. Go to your Supabase project: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk

2. Navigate to **Authentication** → **Users**

3. Click **"Add User"** button

4. Fill in:
   ```
   Email: director@airtel.co.ke
   Password: Director2024!
   ```
   
5. ✅ Check **"Auto Confirm User"** (IMPORTANT!)

6. Click **"Create User"**

7. Copy the **UUID** that was generated (you'll see it in the users list)

8. Go to **SQL Editor** and run:
   ```sql
   -- Insert Director profile (replace YOUR_AUTH_UUID with the UUID from step 7)
   INSERT INTO public.users (
     id,
     employee_id,
     full_name,
     email,
     phone_number,
     role,
     region,
     zone,
     rank,
     total_points,
     pin_hash
   ) VALUES (
     'YOUR_AUTH_UUID',  -- Replace with UUID from step 7
     'DIR001',
     'ASHISH AZAD',
     'director@airtel.co.ke',
     '0700000001',
     'director',
     'National',
     'HQ',
     1,
     0,
     encode('1234', 'base64')
   );
   ```

9. **Login Credentials:**
   ```
   Phone: 0700000001
   Password: Director2024!
   ```

---

## **OPTION 3: SQL-ONLY METHOD**

If you have Supabase service role access:

```sql
-- This creates both auth and profile in one go
-- Run in Supabase SQL Editor with service role key

-- 1. Create the auth user
SELECT extensions.create_auth_user(
  'director@airtel.co.ke',  -- email
  'Director2024!',           -- password
  true,                      -- email_confirmed
  '{"full_name": "ASHISH AZAD", "phone": "0700000001"}'::jsonb  -- user_metadata
);

-- 2. Get the created user ID
SELECT id FROM auth.users WHERE email = 'director@airtel.co.ke';

-- 3. Insert profile (use the ID from step 2)
INSERT INTO public.users (
  id,
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone,
  rank,
  total_points,
  pin_hash
) 
SELECT 
  id,
  'DIR001',
  'ASHISH AZAD',
  'director@airtel.co.ke',
  '0700000001',
  'director',
  'National',
  'HQ',
  1,
  0,
  encode('1234', 'base64')
FROM auth.users 
WHERE email = 'director@airtel.co.ke';
```

---

## **✅ VERIFY IT WORKS**

```sql
-- Check Director exists
SELECT 
  u.employee_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.role,
  a.email as auth_email,
  a.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE u.role = 'director';
```

---

## **🚀 READY TO LOGIN**

Once setup is complete, use these credentials in the TAI app:

```
📱 Phone Number: 0700000001
🔐 Password: Director2024!
```

The app will:
1. Search for phone number in database
2. Get the associated email
3. Authenticate with email + password
4. Load the Director dashboard

---

## **⚡ WHICH METHOD SHOULD YOU USE?**

| Method | Speed | Difficulty | Recommended? |
|--------|-------|------------|--------------|
| **Option 1: Promote ZBM** | ⚡ 30 seconds | ⭐ Easy | ✅ **YES - Start here!** |
| **Option 2: Dashboard** | ⚡ 2 minutes | ⭐⭐ Medium | ✅ Good for permanent account |
| **Option 3: SQL Only** | ⚡ 1 minute | ⭐⭐⭐ Hard | Only if you have service role |

---

## **🎯 MY RECOMMENDATION**

**Use Option 1** - It's the fastest way to test the Director view right now:

```sql
-- Just run this:
UPDATE public.users 
SET role = 'director', region = 'National', zone = 'HQ'
WHERE full_name = 'DENNIS WAWERU';

-- Then get his phone:
SELECT phone_number, email FROM public.users WHERE full_name = 'DENNIS WAWERU';

-- Login with that phone number and whatever password was set for him
```

Then you can immediately test the Director view!

Want me to help you set this up?
