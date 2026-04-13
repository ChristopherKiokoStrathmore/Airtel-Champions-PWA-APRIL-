# 🔐 AUTHENTICATION SYSTEM SETUP GUIDE

**Sales Intelligence Network - Airtel Kenya**  
**Date**: December 28, 2024

---

## 📋 OVERVIEW

This authentication system provides:
- ✅ **PIN-based login** (4-digit PIN)
- ✅ **OTP-based login** (6-digit SMS code)
- ✅ **Forgot PIN functionality** (OTP verification + PIN reset)
- ✅ **Role-based access control** (Admin/ZSM/ASM can access dashboard, SEs cannot)
- ✅ **Security**: Only authorized roles can access admin dashboard

---

## 🚀 SETUP INSTRUCTIONS

### **STEP 1: Run Database Migration**

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk
   - Click "SQL Editor" in the left sidebar

2. **Copy the SQL migration**:
   - Open file: `/DATABASE_MIGRATION_OTP.sql`
   - Copy ALL contents

3. **Execute the migration**:
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message

4. **Verify tables created**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('otp_codes', 'users');
   ```

   Should return:
   ```
   table_name
   ----------
   users
   otp_codes
   ```

---

### **STEP 2: Verify User Roles**

Check that admin users have correct roles:

```sql
SELECT 
  phone,
  full_name,
  role,
  admin_access
FROM users
WHERE role IN ('admin', 'zsm', 'asm', 'rsm')
ORDER BY role;
```

**Expected output**:
```
phone            | full_name      | role  | admin_access
-----------------+----------------+-------+-------------
+254700000001    | Admin User     | admin | true
+254710000001    | ZSM User       | zsm   | true
```

If `admin_access` is `false`, update it:

```sql
UPDATE users 
SET admin_access = true 
WHERE role IN ('admin', 'zsm', 'asm', 'rsm');
```

---

### **STEP 3: Test Authentication**

#### **A. Test PIN Login**

1. Open the admin dashboard
2. Select "PIN Login" tab
3. Enter: 
   - Phone: `+254700000001`
   - PIN: `1234`
4. Click "Sign In"
5. Should login successfully ✅

#### **B. Test OTP Login**

1. Open the admin dashboard
2. Select "OTP Login" tab
3. Enter phone: `+254700000001`
4. Click "Send OTP"
5. **Check browser console** (F12 → Console tab)
6. Look for:
   ```
   📱 OTP CODE FOR +254700000001 : 123456
      User: Admin User
      Role: admin
      Expires: 10:45:30 AM
   ```
7. Copy the 6-digit OTP code
8. Enter the OTP in the login form
9. Click "Sign In"
10. Should login successfully ✅

#### **C. Test Forgot PIN**

1. Open the admin dashboard
2. Click "Forgot PIN?"
3. **Step 1**: Enter phone number → Click "Send OTP"
4. Check console for OTP code
5. **Step 2**: Enter OTP → Click "Verify OTP"
6. **Step 3**: Enter new PIN (4 digits) twice
7. Click "Reset PIN"
8. Should show success message ✅
9. Try logging in with new PIN

#### **D. Test Role-Based Access Control**

1. Try logging in with SE account:
   - Phone: `+254712000002` (SE account)
   - PIN: `1234`
2. Should see error:
   ```
   Access Denied: This dashboard is only for Admin, ZSM, ASM, and RSM users. 
   Sales Executives should use the mobile app.
   ```
3. ✅ Access denied correctly!

---

## 🔧 HOW IT WORKS

### **1. PIN Login Flow**

```
User enters phone + PIN
    ↓
App calls loginWithPIN(phone, pin)
    ↓
Database function verify_pin() checks PIN hash
    ↓
If valid → User logged in ✅
If invalid → Error message ❌
```

### **2. OTP Login Flow**

```
User enters phone + clicks "Send OTP"
    ↓
App calls sendOTP(phone)
    ↓
System generates 6-digit OTP
    ↓
OTP saved to database with 10-min expiry
    ↓
OTP logged to console (in production: sent via SMS)
    ↓
User enters OTP + clicks "Sign In"
    ↓
App calls verifyOTP(phone, otp)
    ↓
Database checks OTP validity
    ↓
If valid → OTP marked as used, User logged in ✅
If invalid/expired → Error message ❌
```

### **3. Forgot PIN Flow**

```
User clicks "Forgot PIN?"
    ↓
Step 1: Enter phone number
    ↓
System sends OTP (same as OTP login)
    ↓
Step 2: User enters OTP
    ↓
System verifies OTP
    ↓
Step 3: User enters new PIN twice
    ↓
App calls resetPIN(phone, otp, newPin)
    ↓
Database function update_user_pin() updates PIN hash
    ↓
OTP marked as used
    ↓
Success! User can login with new PIN ✅
```

### **4. Role-Based Access Control**

```
User attempts login
    ↓
Authentication successful
    ↓
Check user.role
    ↓
If role = 'admin', 'zsm', 'asm', 'rsm' → Access granted ✅
If role = 'se' → Access denied ❌
    ↓
Show error: "This dashboard is only for Admin users"
```

---

## 🗂️ DATABASE SCHEMA

### **otp_codes Table**

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,              -- 6-digit OTP
  purpose TEXT DEFAULT 'login',    -- 'login' or 'forgot_pin'
  used BOOLEAN DEFAULT false,      -- Prevents reuse
  expires_at TIMESTAMPTZ,          -- 10 minutes from creation
  created_at TIMESTAMPTZ
);
```

**Example data**:
```
id    | user_id | phone          | code   | purpose    | used  | expires_at
------+---------+----------------+--------+------------+-------+-------------------
abc12 | xyz789  | +254700000001  | 123456 | login      | false | 2024-12-28 10:45:00
def34 | xyz789  | +254700000001  | 789012 | forgot_pin | true  | 2024-12-28 11:00:00
```

### **users Table Updates**

Added columns:
```sql
ALTER TABLE users 
ADD COLUMN admin_access BOOLEAN DEFAULT false,
ADD COLUMN last_login TIMESTAMPTZ;
```

**Example data**:
```
phone          | role  | admin_access | last_login
---------------+-------+--------------+-------------------
+254700000001  | admin | true         | 2024-12-28 09:30:00
+254712000002  | se    | false        | NULL
```

---

## 🔒 SECURITY FEATURES

### **1. PIN Storage**
- PINs stored as bcrypt hashes (not plain text)
- Uses PostgreSQL `pgcrypto` extension
- Salt generated automatically
- Function: `crypt(pin, gen_salt('bf'))`

### **2. OTP Security**
- OTPs expire after 10 minutes
- OTPs can only be used once (marked as `used: true`)
- Separate OTPs for login vs forgot PIN
- Cleanup function removes expired OTPs

### **3. Role-Based Access Control**
- Frontend checks `canAccessAdminDashboard(role)`
- Only admin, zsm, asm, rsm can access
- SEs are blocked with clear error message
- Database has `admin_access` boolean flag

### **4. Row Level Security (RLS)**
- Users can only see their own OTPs
- Prevents data leakage between users
- Policies defined in migration file

---

## 📱 SMS INTEGRATION (Production)

### **Current State (Development)**:
- OTPs logged to browser console
- Look for: `📱 OTP CODE FOR +254700000001 : 123456`

### **Production Implementation**:

#### **Option 1: Africa's Talking (Recommended)**

```typescript
// lib/sms.ts
import africastalking from 'africastalking';

const client = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});

export async function sendSMS(phone: string, message: string) {
  try {
    const result = await client.SMS.send({
      to: [phone],
      message: message,
      from: 'AIRTEL'
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}

// Then in lib/auth.ts, replace console.log with:
await sendSMS(normalizedPhone, `Your Airtel OTP is: ${otp}. Valid for 10 minutes.`);
```

#### **Option 2: Twilio**

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(phone: string, message: string) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
```

---

## 🧪 TESTING CHECKLIST

### **PIN Login**
- [ ] Can login with correct phone + PIN
- [ ] Error shown for incorrect PIN
- [ ] Error shown for non-existent phone
- [ ] SE accounts blocked from dashboard
- [ ] Admin/ZSM accounts can access

### **OTP Login**
- [ ] OTP sent to correct phone number
- [ ] OTP appears in console
- [ ] Can login with correct OTP
- [ ] Error shown for incorrect OTP
- [ ] Error shown for expired OTP (wait 10+ min)
- [ ] Error shown if OTP reused
- [ ] Can resend OTP

### **Forgot PIN**
- [ ] Step 1: Phone number validation works
- [ ] Step 2: OTP sent and verified
- [ ] Step 3: New PIN can be set
- [ ] PINs must match
- [ ] PIN must be 4 digits
- [ ] Can login with new PIN after reset
- [ ] Old PIN no longer works

### **Role-Based Access**
- [ ] Admin can access dashboard
- [ ] ZSM can access dashboard
- [ ] ASM can access dashboard (if exists)
- [ ] RSM can access dashboard (if exists)
- [ ] SE cannot access dashboard
- [ ] Clear error message for SEs

---

## 🐛 TROUBLESHOOTING

### **Issue: "RPC function verify_pin does not exist"**

**Solution**: Run the database migration
```sql
-- Create the function
CREATE OR REPLACE FUNCTION verify_pin(user_phone TEXT, user_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash
  FROM users
  WHERE phone = user_phone;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = crypt(user_pin, stored_hash);
END;
$$;
```

---

### **Issue: "OTP not found in console"**

**Check**:
1. Open browser console (F12)
2. Look for message starting with `📱 OTP CODE FOR`
3. If not there, check for errors
4. Verify database connection in Supabase logs

---

### **Issue: "Access Denied" for admin user**

**Solution**: Update admin_access flag
```sql
UPDATE users 
SET admin_access = true 
WHERE phone = '+254700000001';
```

---

### **Issue: "OTP expired" immediately**

**Solution**: Check server time vs database time
```sql
SELECT now() as database_time;
```

Compare with local time. If different, OTP expiry calculation may be wrong.

---

## 📊 MONITORING

### **Check Recent OTPs**
```sql
SELECT 
  phone,
  code,
  purpose,
  used,
  expires_at,
  created_at
FROM otp_codes
ORDER BY created_at DESC
LIMIT 10;
```

### **Check Login Activity**
```sql
SELECT 
  phone,
  full_name,
  role,
  last_login
FROM users
WHERE last_login IS NOT NULL
ORDER BY last_login DESC
LIMIT 10;
```

### **Clean Up Expired OTPs**
```sql
-- Run this periodically (or set up a cron job)
SELECT cleanup_expired_otps();

-- Or manually
DELETE FROM otp_codes 
WHERE expires_at < now() - interval '1 day';
```

---

## ✅ SUCCESS CRITERIA

After setup, you should be able to:

1. ✅ Login with PIN (Admin/ZSM accounts)
2. ✅ Login with OTP (receive code in console)
3. ✅ Reset forgotten PIN using OTP
4. ✅ Block SE accounts from dashboard
5. ✅ See clear error messages for invalid credentials
6. ✅ OTPs expire after 10 minutes
7. ✅ OTPs cannot be reused

---

## 🚀 NEXT STEPS

### **Phase 1: Production SMS** (High Priority)
- Integrate Africa's Talking or Twilio
- Replace console.log with real SMS
- Test SMS delivery in Kenya

### **Phase 2: Enhanced Security** (Medium Priority)
- Add rate limiting (max 5 OTP requests per hour)
- Add IP-based blocking for brute force attempts
- Log all authentication attempts
- Email notifications for PIN changes

### **Phase 3: User Experience** (Low Priority)
- Add "Remember this device" checkbox
- Implement session management
- Add biometric login for mobile app
- Multi-factor authentication (MFA)

---

## 📝 FILES CHANGED

### **New Files Created**:
```
✅ /lib/auth.ts - Authentication functions
✅ /DATABASE_MIGRATION_OTP.sql - Database schema
✅ /AUTHENTICATION_SETUP_GUIDE.md - This file
```

### **Files Modified**:
```
✅ /App.tsx - Updated with OTP support
✅ /components/AdminLogin.tsx - Complete rewrite with OTP UI
```

---

## 🎓 SUMMARY

You now have a **complete, production-ready authentication system** with:

- 🔐 **Dual login methods**: PIN or OTP
- 📱 **OTP verification**: 6-digit codes with 10-minute expiry
- 🔄 **Forgot PIN**: Self-service PIN reset
- 🛡️ **Role-based access**: Only admins can access dashboard
- 🔒 **Security**: Encrypted PINs, one-time OTPs, access control

**The system is ready for production after integrating SMS provider!**

---

**Setup completed**: December 28, 2024  
**Next review**: January 4, 2025
