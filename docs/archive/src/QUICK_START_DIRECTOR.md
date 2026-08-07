# 🎯 QUICK START: Login as Director (Ashish Azad)

## **3-STEP SETUP** ⏱️ (2 minutes)

### **STEP 1: Run Setup SQL** (30 seconds)

Copy/paste into Supabase SQL Editor:

```sql
-- Find and update Ashish to Director role
UPDATE public.users 
SET 
  role = 'director',
  region = 'National',
  zone = 'HQ',
  pin_hash = encode('1234'::bytea, 'base64')
WHERE full_name ILIKE '%ASHISH%AZAD%';

-- Get his phone number
SELECT 
  full_name,
  email,
  phone_number,
  role
FROM public.users 
WHERE role = 'director';
```

Copy the **phone_number** and **email** from the result.

---

### **STEP 2: Create Auth Account** (60 seconds)

1. Go to: **Supabase Dashboard** → **Authentication** → **Users** → **Add User**

2. Enter:
   ```
   Email: [paste email from STEP 1]
   Password: Airtel@2024
   ```

3. ✅ Check **"Auto Confirm User"**

4. Click **"Create User"**

5. Copy the **UUID** that appears in the users list

6. Run this SQL:
   ```sql
   UPDATE public.users 
   SET id = 'PASTE_UUID_HERE'
   WHERE full_name ILIKE '%ASHISH%AZAD%';
   ```

---

### **STEP 3: Login to TAI App** (10 seconds)

```
📱 Phone: [from STEP 1 - any format works]
🔐 PIN: 1234
```

Click **SIGN IN** → You're in! 🎉

---

## **⚡ EVEN FASTER: Use Existing ZBM**

Don't want to create new accounts? Just promote an existing ZBM to Director:

```sql
-- Promote DENNIS WAWERU to Director
UPDATE public.users 
SET role = 'director', region = 'National', zone = 'HQ'
WHERE full_name = 'DENNIS WAWERU';

-- Get his login credentials
SELECT phone_number, email, role FROM public.users WHERE full_name = 'DENNIS WAWERU';
```

Then login with his phone + PIN 1234. Done! ✅

---

## **📝 SUPPORTED PHONE FORMATS**

All these work (if Ashish's phone is 700000001):

```
0700000001
700000001
254700000001
+254700000001
254 700 000 001
07-00-00-00-01
+254-700-000-001
```

---

## **🔍 TROUBLESHOOTING**

### **"Phone number not found"**
- Run STEP 1 again - make sure Ashish exists in database
- Check the phone_number value matches what you're typing

### **"Account found but authentication failed"**
- Run STEP 2 again - create auth account
- Make sure you used password: `Airtel@2024`
- Make sure UUIDs match between auth.users and public.users

### **"Invalid PIN"**
- Make sure you're using PIN: `1234`
- Or run this to reset PIN:
  ```sql
  UPDATE public.users 
  SET pin_hash = encode('1234'::bytea, 'base64')
  WHERE full_name ILIKE '%ASHISH%';
  ```

---

## **✅ VERIFY SETUP IS COMPLETE**

Run this SQL to check everything is ready:

```sql
-- This should show ✅ for everything
SELECT 
  u.full_name,
  u.email,
  u.phone_number,
  u.role,
  CASE WHEN u.role = 'director' THEN '✅' ELSE '❌' END as "Is Director",
  CASE WHEN u.pin_hash = encode('1234'::bytea, 'base64') THEN '✅' ELSE '❌' END as "PIN is 1234",
  CASE WHEN a.id IS NOT NULL THEN '✅' ELSE '❌ Create auth account' END as "Has Auth"
FROM public.users u
LEFT JOIN auth.users a ON u.id = a.id
WHERE u.full_name ILIKE '%ASHISH%AZAD%';
```

All columns should show ✅ for successful setup!

---

## **🚀 YOU'RE READY!**

Once all checks pass, you can login to TAI as Director and access:

- 🎯 Director Dashboard
- 📊 National-level analytics  
- 👥 All 702 SEs performance
- 🗺️ All 12 zones overview
- 📢 System-wide announcements
- ⚙️ Admin controls

**Now go login and let's work on the Director view!** 🦅
