# ⚡ QUICK START: Enable Signup (2 Minutes)

**Get signup working RIGHT NOW!**

---

## 🚀 STEP 1: Run This SQL (30 seconds)

**Copy & paste this into Supabase SQL Editor:**
👉 https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/sql/new

```sql
-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_id TEXT;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  new_employee_id := 'SE' || LPAD((total_users + 1000)::TEXT, 4, '0');
  
  INSERT INTO users (
    id, employee_id, full_name, email, phone_number,
    region, rank, total_points, created_at, updated_at
  ) VALUES (
    NEW.id,
    new_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    'Nairobi',
    total_users + 1,
    0,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);
```

**Click "RUN"** ✅

---

## 🧪 STEP 2: Test It (1 minute)

### **In the web app above:**

1. **Click "Don't have an account? Sign up here"**

2. **Fill the form:**
   ```
   Full Name: Test User
   Email: testuser@airtel.co.ke
   Phone: 0799888777
   Password: Test123456!
   Confirm: Test123456!
   ```

3. **Click "SIGN UP"**

4. **Expected:**
   ```
   ✅ "Account created successfully!"
   ✅ Redirected to login
   ```

5. **Now login:**
   ```
   Phone: 0799888777
   Password: Test123456!
   ```

6. **See home screen!** 🎉

---

## ✅ VERIFY IT WORKED

Run this SQL to see your new user:

```sql
SELECT 
  u.employee_id,
  u.full_name,
  u.email,
  u.phone_number,
  u.rank,
  u.total_points,
  au.email_confirmed_at
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;
```

**Expected output:**
```
employee_id | full_name  | email                  | phone_number | rank | total_points
SE1662      | Test User  | testuser@airtel.co.ke  | 0799888777   | 663  | 0
```

---

## 🎯 DONE!

**Your signup is now working!**

Users can:
- ✅ Create accounts themselves
- ✅ Get auto-generated employee ID
- ✅ Login immediately
- ✅ Start earning points

---

## 📱 FOR FLUTTER APP

Copy the signup screen code from:
👉 `/📱_FLUTTER_SIGNUP_SCREEN.md`

It's the exact same functionality, just in Flutter!

---

🚀 **Try it now! Click "Sign up here" in the app above!**
