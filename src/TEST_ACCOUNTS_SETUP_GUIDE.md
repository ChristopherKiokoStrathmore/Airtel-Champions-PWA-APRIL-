# 🎯 TAI TEST ACCOUNTS SETUP GUIDE

## Overview
This guide will help you set up 3 real test accounts with actual profile pictures to test the complete TAI system.

---

## 📋 Prerequisites

Before setting up accounts, ensure you have:

1. **Supabase Database Tables Created:**
   - `users` table
   - `programs` table  
   - `profile-pictures` storage bucket

2. **Required SQL for Tables:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  employee_id TEXT UNIQUE NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  region TEXT,
  zone TEXT,
  zsm TEXT,
  zbm TEXT,
  profile_picture TEXT,
  role TEXT DEFAULT 'field_agent',
  rank INTEGER DEFAULT 999,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow users to insert their own data
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy: All users can read programs
CREATE POLICY "Anyone can read programs" ON programs
  FOR SELECT TO authenticated USING (true);

-- Policy: Only HQ can manage programs
CREATE POLICY "HQ can manage programs" ON programs
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'hq_team' OR role = 'director'
    )
  );
```

3. **Storage Bucket Setup:**

```sql
-- Create profile-pictures bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true);

-- Allow authenticated users to upload their profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```

---

## 👥 Test Account #1: Field Agent (John Kamau)

### Account Details:
- **Full Name:** John Kamau
- **Email:** john.kamau@airtelkenya.com
- **Phone:** 0712345678
- **Employee ID:** SE-001
- **Password:** TestPassword123!
- **Role:** Field Agent
- **Region:** Central Region
- **Zone:** Nairobi West
- **ZSM:** James Mwangi
- **ZBM:** Mary Wanjiku (auto-assigned)

### Setup Steps:

1. **Go to Login Page** → Click "CREATE ACCOUNT"

2. **Sign Up Form:**
   - Enter email: `john.kamau@airtelkenya.com`
   - Enter password: `TestPassword123!`
   - Enter phone: `0712345678`
   - Enter full name: `John Kamau`
   - Click "SIGN UP"

3. **Profile Setup - Step 1 (Photo & Basic Info):**
   - Click "📸 Upload Photo"
   - Select a profile photo from your device
   - Confirm Full Name: `John Kamau`
   - Enter Employee ID: `SE-001`
   - Click "CONTINUE →"

4. **Profile Setup - Step 2 (Organization):**
   - Select Region: `Central Region`
   - Select Zone: `Nairobi West`
   - ZBM auto-populates: `Mary Wanjiku` ✅
   - Click "CONTINUE →"

5. **Profile Setup - Step 3 (Zone Commander):**
   - Select ZSM: `James Mwangi`
   - Review summary
   - Click "✅ COMPLETE SETUP"

6. **Done!** You should now see the Field Agent home screen with John's profile picture.

---

## 👥 Test Account #2: Field Agent (Sarah Akinyi)

### Account Details:
- **Full Name:** Sarah Akinyi
- **Email:** sarah.akinyi@airtelkenya.com
- **Phone:** 0723456789
- **Employee ID:** SE-002
- **Password:** TestPassword123!
- **Role:** Field Agent
- **Region:** Coast Region
- **Zone:** Mombasa
- **ZSM:** Hassan Mohamed
- **ZBM:** Ali Hassan (auto-assigned)

### Setup Steps:

Follow the same process as Account #1, but use Sarah's details.

**Profile Photo Tip:** Use a different photo to see variety in the leaderboard and profile pictures.

---

## 👥 Test Account #3: HQ Team Member (Grace Njeri)

### Account Details:
- **Full Name:** Grace Njeri
- **Email:** grace.njeri@airtelkenya.com
- **Phone:** 0734567890
- **Employee ID:** HQ-001
- **Password:** TestPassword123!
- **Role:** HQ Team (needs manual update in database)
- **Region:** Central Region
- **Zone:** Nairobi CBD
- **ZSM:** Michael Omondi
- **ZBM:** Mary Wanjiku (auto-assigned)

### Setup Steps:

1. **Complete signup and profile setup** (same as Account #1)

2. **Manually update role in Supabase:**
   - Go to Supabase Dashboard → Table Editor → `users`
   - Find Grace Njeri's record
   - Update `role` field from `field_agent` to `hq_team`
   - Save

3. **Log out and log back in** to see HQ dashboard

4. **Test Program Management:**
   - Go to HQ dashboard
   - Click "📊 Manage Programs"
   - Add a new program
   - Edit existing programs
   - Toggle active/inactive status

---

## 🧪 Testing Checklist

### ✅ Profile Pictures:
- [ ] John's profile picture shows on home screen
- [ ] Sarah's profile picture shows on home screen
- [ ] Grace's profile picture shows on home screen
- [ ] Pictures show in leaderboard
- [ ] Pictures show in profile dropdown menu
- [ ] Pictures are crisp and not pixelated

### ✅ Organization Hierarchy:
- [ ] ZBM auto-populates when region is selected
- [ ] Zone dropdown only shows zones for selected region
- [ ] ZSM dropdown only shows ZSMs for selected zone
- [ ] Profile summary shows all details correctly

### ✅ Program Management (HQ Account):
- [ ] Can view programs list
- [ ] Can add new program
- [ ] Can edit existing program
- [ ] Can delete program
- [ ] Can toggle program active/inactive
- [ ] Changes reflect immediately for all users
- [ ] Icon and color customization works

### ✅ Cross-Account Testing:
- [ ] John can see programs added by Grace
- [ ] Sarah can see programs added by Grace
- [ ] Program changes by HQ reflect on all Field Agent accounts
- [ ] Leaderboard shows all 3 users
- [ ] Profile pictures are unique for each user

---

## 🎨 Recommended Profile Photos

For testing purposes, use these types of photos:

1. **John Kamau:** Professional headshot, business casual
2. **Sarah Akinyi:** Smiling professional photo
3. **Grace Njeri:** Corporate-style photo with Airtel branding

**Photo Requirements:**
- Format: JPG, PNG, or GIF
- Size: Under 5MB
- Resolution: At least 400x400px
- Aspect Ratio: Square (1:1) works best

---

## 📊 Testing Program Management

Once Grace (HQ) is set up, test these scenarios:

### Scenario 1: Create New Program
1. Log in as Grace
2. Go to HQ Dashboard → "Manage Programs"
3. Click "+ ADD NEW"
4. Fill in:
   - Name: "Competitor Monitoring"
   - Description: "Track competitor activities and promotions"
   - Icon: 🔍
   - Color: Red
   - Points: 15
   - Active: Yes
5. Click "Create Program"
6. **Expected:** Program appears in list immediately

### Scenario 2: Edit Existing Program
1. Click "✏️ Edit" on a program
2. Change points from 10 to 20
3. Change icon from 📶 to ⚡
4. Click "Update Program"
5. **Expected:** Changes save and reflect immediately

### Scenario 3: Test on Field Agent Account
1. Log out from Grace's account
2. Log in as John Kamau
3. Go to Home → Programs section
4. **Expected:** See the new "Competitor Monitoring" program
5. **Expected:** See updated points and icons for edited programs

### Scenario 4: Deactivate Program
1. Log in as Grace (HQ)
2. Go to Program Management
3. Click active/inactive toggle on a program
4. Switch to John's account
5. **Expected:** Deactivated program doesn't show in programs list

---

## 🚨 Troubleshooting

### Issue: Profile picture not uploading
**Solution:** Check Supabase storage policies and ensure bucket is public

### Issue: ZBM not auto-populating
**Solution:** Check `organizationHierarchy` object in `/components/profile-setup.tsx`

### Issue: HQ can't manage programs
**Solution:** Verify user role is set to `hq_team` in database

### Issue: Programs not syncing across accounts
**Solution:** Check RLS policies on `programs` table

### Issue: Profile picture broken link
**Solution:** Verify storage bucket URL and public access

---

## 🎯 Next Steps After Setup

Once all 3 accounts are working:

1. **Add more Field Agents** to populate leaderboard
2. **Create more programs** to test variety
3. **Test submissions workflow** (coming in next phase)
4. **Test camera capture** with EXIF validation
5. **Test offline mode** functionality

---

## 📝 Account Credentials Summary

| Name | Email | Phone | Password | Role | Employee ID |
|------|-------|-------|----------|------|-------------|
| John Kamau | john.kamau@airtelkenya.com | 0712345678 | TestPassword123! | Field Agent | SE-001 |
| Sarah Akinyi | sarah.akinyi@airtelkenya.com | 0723456789 | TestPassword123! | Field Agent | SE-002 |
| Grace Njeri | grace.njeri@airtelkenya.com | 0734567890 | TestPassword123! | HQ Team | HQ-001 |

---

**🎉 You're all set! Start testing TAI with real profiles and photos.**
