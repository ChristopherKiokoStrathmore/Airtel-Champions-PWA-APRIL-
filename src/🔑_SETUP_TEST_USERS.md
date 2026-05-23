# 🔑 SETUP TEST USERS - QUICK GUIDE

**Create test users so SEs can login with phone numbers!**

---

## ✅ STEP 1: CHECK YOUR USERS TABLE

Run this in Supabase SQL Editor:

```sql
-- See first 10 users with their phone numbers and emails
SELECT 
  employee_id,
  full_name,
  phone_number,
  email,
  region
FROM users 
ORDER BY employee_id 
LIMIT 10;
```

**Expected output:**
```
employee_id | full_name      | phone_number  | email                    | region
------------|----------------|---------------|--------------------------|--------
SE1000      | John Kamau     | 0712345678    | john.kamau@airtel.co.ke  | Nairobi
SE1001      | Mary Wanjiru   | 0723456789    | mary.wanjiru@airtel.co.ke| Nairobi
SE1002      | Peter Omondi   | 0734567890    | peter.omondi@airtel.co.ke| Mombasa
...
```

---

## ✅ STEP 2: CREATE AUTH USERS (For Testing)

### **Method 1: Via Supabase Dashboard (EASIEST)**

1. **Go to Authentication → Users**
   - URL: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/auth/users

2. **Click "Add User" → "Create new user"**

3. **Fill in details** (use data from Step 1):
   ```
   Email: john.kamau@airtel.co.ke
   Password: Test123456!
   Confirm Password: Test123456!
   
   ✅ Auto Confirm User (CHECK THIS BOX!)
   ```

4. **Click "Create user"**

5. **Repeat for 3-5 test users** so you have multiple accounts to test

---

### **Method 2: Via SQL (Bulk Create)**

⚠️ **Note**: This requires the service_role key and should be done server-side.

For now, use **Method 1** (Dashboard) to create 3-5 test users.

---

## ✅ STEP 3: TEST LOGIN

### **In the Web App (Running Now):**

1. **Enter Phone Number**: `0712345678`
2. **Enter Password**: `Test123456!`
3. **Click "SIGN IN"**

**Expected Result:**
- ✅ "Signing in..." loading spinner
- ✅ Redirects to home screen
- ✅ Shows user name and employee ID
- ✅ Shows rank card and capture button

---

### **In the Flutter App (After Building):**

Same process:
1. Phone: `0712345678`
2. Password: `Test123456!`
3. Tap "SIGN IN"

---

## 📋 SUGGESTED TEST USERS

Create **5 test users** with these details:

### **User 1: Nairobi SE**
```
Email: test.se1@airtel.co.ke
Password: Test123456!
Phone: 0712000001
Employee ID: SE1000
Region: Nairobi
```

### **User 2: Mombasa SE**
```
Email: test.se2@airtel.co.ke
Password: Test123456!
Phone: 0712000002
Employee ID: SE1001
Region: Mombasa
```

### **User 3: Kisumu SE**
```
Email: test.se3@airtel.co.ke
Password: Test123456!
Phone: 0712000003
Employee ID: SE1002
Region: Kisumu
```

### **User 4: Nakuru SE**
```
Email: test.se4@airtel.co.ke
Password: Test123456!
Phone: 0712000004
Employee ID: SE1003
Region: Nakuru
```

### **User 5: Eldoret SE**
```
Email: test.se5@airtel.co.ke
Password: Test123456!
Phone: 0712000005
Employee ID: SE1004
Region: Eldoret
```

---

## 🔄 UPDATE EXISTING USERS

If you want to add phone numbers to existing users in the `users` table:

```sql
-- Update phone numbers for existing users
UPDATE users SET phone_number = '0712000001' WHERE employee_id = 'SE1000';
UPDATE users SET phone_number = '0712000002' WHERE employee_id = 'SE1001';
UPDATE users SET phone_number = '0712000003' WHERE employee_id = 'SE1002';
UPDATE users SET phone_number = '0712000004' WHERE employee_id = 'SE1003';
UPDATE users SET phone_number = '0712000005' WHERE employee_id = 'SE1004';

-- Verify updates
SELECT employee_id, full_name, phone_number, email 
FROM users 
WHERE employee_id IN ('SE1000', 'SE1001', 'SE1002', 'SE1003', 'SE1004');
```

---

## ✅ VERIFICATION CHECKLIST

Before testing login, make sure:

- [ ] `users` table has `phone_number` column
- [ ] `users` table has `email` column
- [ ] At least one user has both phone_number and email filled
- [ ] Auth user created in Supabase Dashboard with that email
- [ ] Password is known (e.g., `Test123456!`)
- [ ] User was auto-confirmed (email_confirmed_at is set)

---

## 🧪 COMPLETE TEST FLOW

### **1. Create Test User in Users Table**
```sql
-- Insert test user (if not exists)
INSERT INTO users (
  employee_id,
  full_name,
  email,
  phone_number,
  region,
  rank,
  total_points
) VALUES (
  'SE9999',
  'Test User',
  'test@airtel.co.ke',
  '0799999999',
  'Nairobi',
  662,
  0
)
ON CONFLICT (employee_id) DO NOTHING;
```

### **2. Create Auth User in Dashboard**
- Email: `test@airtel.co.ke`
- Password: `Test123456!`
- Auto Confirm: ✅ YES

### **3. Test Login**
- Phone: `0799999999`
- Password: `Test123456!`

### **4. Expected Result**
```
🔍 Looking up phone number: 0799999999
✅ Found email: test@airtel.co.ke
✅ Login successful!
→ Home screen opens
```

---

## 🚨 TROUBLESHOOTING

### **Error: "Phone number not found"**
**Cause**: No user in `users` table with that phone number

**Fix**:
```sql
-- Check if phone number exists
SELECT * FROM users WHERE phone_number = '0712345678';

-- If empty, add phone number to existing user
UPDATE users 
SET phone_number = '0712345678' 
WHERE employee_id = 'SE1000';
```

---

### **Error: "Invalid password"**
**Cause**: Wrong password or auth user doesn't exist

**Fix**:
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user by email
3. If user doesn't exist, create it
4. If user exists, you can reset password

---

### **Error: "No rows found"**
**Cause**: Email not in `users` table

**Fix**:
```sql
-- Check what email is in users table
SELECT employee_id, email FROM users WHERE phone_number = '0712345678';

-- Create auth user with that exact email
```

---

## 🎯 QUICK START (3 MINUTES)

**Copy this checklist and follow it:**

1. ✅ Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/auth/users
2. ✅ Click "Add User"
3. ✅ Email: `test@airtel.co.ke`
4. ✅ Password: `Test123456!`
5. ✅ Auto Confirm: CHECK THE BOX
6. ✅ Click "Create user"
7. ✅ Run this SQL:
   ```sql
   UPDATE users 
   SET phone_number = '0799999999', email = 'test@airtel.co.ke' 
   WHERE employee_id = 'SE1000';
   ```
8. ✅ Test login with:
   - Phone: `0799999999`
   - Password: `Test123456!`

---

## ✅ READY TO TEST!

Once you've created at least one test user, go to the web app and try logging in!

**The login now works with:**
- 📱 Phone Number (easy to remember)
- 🔒 Password (secure)
- ✅ Simple UX (like Mpesa)

---

🎉 **Your SEs can now login easily!**
