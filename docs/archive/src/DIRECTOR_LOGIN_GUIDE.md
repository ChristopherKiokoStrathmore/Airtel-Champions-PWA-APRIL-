# 🎯 DIRECTOR LOGIN CREDENTIALS

## **ASHISH AZAD - S&D Director**

### **📱 LOGIN CREDENTIALS**

```
Phone Number: 0700000001
Password: Director@2024
```

---

## **🔧 SETUP STEPS**

### **Step 1: Create User in Database**
Run this SQL in your Supabase SQL Editor:

```sql
-- Create Director user
INSERT INTO public.users (
  id,
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone,
  zsm,
  zbm,
  rank,
  total_points,
  pin_hash
) VALUES (
  gen_random_uuid(),
  'DIR001',
  'ASHISH AZAD',
  'ashish.azad@airtel.co.ke',
  '0700000001',
  'director',
  'National',
  'HQ',
  NULL,
  NULL,
  1,
  0,
  encode('1234', 'base64')
)
ON CONFLICT (email) DO NOTHING;
```

### **Step 2: Create Auth User**
Run this in Supabase SQL Editor to create the authentication account:

```sql
-- Create auth user for Director
-- Note: You'll need to do this through Supabase Dashboard or use the Admin API
```

**OR** Use Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Click **"Add User"**
3. Enter:
   - **Email**: `ashish.azad@airtel.co.ke`
   - **Password**: `Director@2024`
   - **Auto Confirm User**: ✅ YES

### **Step 3: Link Auth to Profile**
After creating the auth user, get the UUID and update:

```sql
-- Get the auth user ID
SELECT id, email FROM auth.users WHERE email = 'ashish.azad@airtel.co.ke';

-- Update public.users with the auth ID
UPDATE public.users 
SET id = '[PASTE_AUTH_UUID_HERE]'
WHERE email = 'ashish.azad@airtel.co.ke';
```

---

## **🎭 ALTERNATIVE: Use Existing ZBM as Director**

If you want to quickly test Director view without setup, temporarily promote a ZBM:

```sql
-- Temporarily promote DENNIS WAWERU to Director
UPDATE public.users 
SET role = 'director'
WHERE full_name = 'DENNIS WAWERU';

-- His existing credentials will work
-- Phone: [his existing phone]
-- Check phone with:
SELECT phone_number, email FROM public.users WHERE full_name = 'DENNIS WAWERU';
```

---

## **🔍 VERIFY DIRECTOR ACCOUNT**

```sql
-- Check Director exists
SELECT 
  employee_id,
  full_name,
  email,
  phone_number,
  role,
  region,
  zone
FROM public.users 
WHERE role = 'director';
```

---

## **📊 DIRECTOR VIEW FEATURES**

Once logged in as Director, you'll have access to:

✅ **National Overview Dashboard**
- View all 12 zones performance
- See all 702 SEs ranked
- Monitor 12 ZBMs and 54 ZSMs
- Real-time leaderboard
- National announcements

✅ **Full System Control**
- Create announcements for all staff
- View all submissions across Kenya
- Analytics and reporting
- Performance trends

✅ **Hierarchy View**
- Director → ZBMs → ZSMs → SEs
- Drill down by zone
- Compare regional performance

---

## **🚀 QUICK START**

1. **Run the SQL** to create Director user
2. **Create auth account** in Supabase Dashboard
3. **Link the accounts** with matching UUID
4. **Login to TAI app** with:
   - Phone: `0700000001`
   - Password: `Director@2024`

---

## **⚠️ IMPORTANT NOTES**

- The Director role currently shows the same view as SE in the app
- You'll need to implement the Director-specific dashboard in `DirectorDashboard` component
- The component exists at `/components/role-dashboards.tsx` but needs Director-specific features

**Current Status**: The app recognizes the Director role but doesn't have a unique Director view yet. We'll need to build that!

---

**Need help setting this up?** Let me know which method you prefer:
1. Create new Director account (most official)
2. Temporarily promote existing ZBM (fastest for testing)
