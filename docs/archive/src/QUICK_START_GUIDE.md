# 🚀 QUICK START GUIDE - TAI Profile & Program Management

## ⚡ 5-Minute Setup

Follow these steps to get TAI running with real profiles and programs:

---

## 📋 **STEP 1: Database Setup** (2 minutes)

### Go to Supabase Dashboard → SQL Editor

Copy and paste this entire SQL script:

```sql
-- 1. Create users table
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

-- 2. Create programs table
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

-- 3. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 4. Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 5. Programs policies
CREATE POLICY "Anyone can read programs" ON programs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "HQ can manage programs" ON programs
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('hq_team', 'director')
    )
  );
```

Click **RUN** ✅

---

### Go to Storage → Create Bucket

1. Click **New bucket**
2. Name: `profile-pictures`
3. Public bucket: **ON** ✅
4. Click **Save**

Then add policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow public read
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-pictures');
```

**Done!** Database is ready. ✅

---

## 👤 **STEP 2: Create Account #1 - John (Field Agent)** (1 minute)

1. Open TAI app → Click **"CREATE ACCOUNT"**

2. Fill in:
   - Email: `john.kamau@test.com`
   - Password: `Test123!`
   - Phone: `0712345678`
   - Full Name: `John Kamau`

3. Click **SIGN UP**

4. **Profile Setup:**
   - **Step 1:** Upload a photo, Enter Employee ID: `SE-001`
   - **Step 2:** Region: `Central Region`, Zone: `Nairobi West`
   - **Step 3:** ZSM: `James Mwangi`
   - Click **COMPLETE SETUP**

**Done!** John's account is ready. ✅

---

## 👤 **STEP 3: Create Account #2 - Sarah (Field Agent)** (1 minute)

Repeat the same process with:
- Email: `sarah.akinyi@test.com`
- Phone: `0723456789`
- Full Name: `Sarah Akinyi`
- Employee ID: `SE-002`
- Region: `Coast Region`, Zone: `Mombasa`, ZSM: `Hassan Mohamed`

**Done!** Sarah's account is ready. ✅

---

## 👤 **STEP 4: Create Account #3 - Grace (HQ Team)** (1 minute + manual step)

1. Create account same way:
   - Email: `grace.njeri@test.com`
   - Phone: `0734567890`
   - Full Name: `Grace Njeri`
   - Employee ID: `HQ-001`
   - Complete profile setup

2. **Manual step:** Go to Supabase → Table Editor → `users`
   - Find Grace's row
   - Change `role` from `field_agent` to `hq_team`
   - Save

3. Log out and log back in as Grace

**Done!** Grace has HQ access. ✅

---

## 📊 **STEP 5: Create Programs (as Grace)** (2 minutes)

1. Log in as Grace
2. Go to **HQ Dashboard**
3. Click **📊 Manage Programs**
4. Click **+ ADD NEW**
5. Create:
   - Name: `Network Experience`
   - Description: `Report network quality issues`
   - Icon: 📶
   - Color: Blue
   - Points: 10
   - Active: Yes
6. Click **Create Program**

Repeat for:
- `Competition Conversion` (🎯, Green, 15 points)
- `New Site Launch` (🚀, Purple, 20 points)
- `AMB Visitation` (🏢, Orange, 10 points)

**Done!** Programs created. ✅

---

## ✅ **STEP 6: Test Everything**

1. **Log out from Grace**
2. **Log in as John** (`0712345678` / `Test123!`)
3. **Verify:**
   - ✅ John's profile picture shows in top-right
   - ✅ Programs section shows all 4 programs
   - ✅ Leaderboard shows John, Sarah, Grace

4. **Log in as Sarah**
5. **Verify:**
   - ✅ Sarah's profile picture shows
   - ✅ Same programs appear
   - ✅ Photos work in leaderboard

**All working? Perfect!** 🎉

---

## 🎨 **BONUS: Test Program Editing**

1. Log in as Grace (HQ)
2. Go to Program Management
3. Edit "Network Experience":
   - Change points from 10 → 20
   - Change icon from 📶 → ⚡
4. Save

5. Log in as John
6. Verify the program shows new icon and points

**Real-time sync working!** ✅

---

## 🚨 **Troubleshooting**

| Problem | Solution |
|---------|----------|
| Can't sign up | Check if phone/email already exists in database |
| Profile picture not showing | Verify storage bucket is public |
| ZBM doesn't auto-fill | Check region selection is correct |
| Can't create programs | Verify Grace's role is `hq_team` in database |
| Programs don't show for Field Agents | Check RLS policy on programs table |

---

## 📱 **What You Have Now**

✅ **3 Real Accounts** with profile pictures  
✅ **Organization Hierarchy** with auto-filled ZBM  
✅ **Program Management** system for HQ  
✅ **Real-time Sync** across all accounts  
✅ **Professional UI** with Airtel branding  
✅ **Steve Jobs-approved** login page  

---

## 🚀 **Next Steps**

Now that profiles and programs are working, you're ready for:

1. **Camera Capture** - Photo submissions with EXIF validation
2. **Submissions Workflow** - ZSM review and approval
3. **Real-time Leaderboard** - Live updates as SEs submit
4. **Offline Mode** - Work on 2G/3G
5. **Daily Missions** - Gamification features

---

## 💡 **Pro Tips**

1. **Use real photos** for test accounts - makes it feel real
2. **Test on mobile** - TAI is mobile-first
3. **Create more programs** - test variety
4. **Add more Field Agents** - populate leaderboard
5. **Try different regions** - test organization hierarchy

---

## 📞 **Need Help?**

Check these documents:
- `/TEST_ACCOUNTS_SETUP_GUIDE.md` - Detailed setup instructions
- `/IMPLEMENTATION_SUMMARY.md` - Technical overview
- `/BOARD_REVIEW_LOGIN_PAGE.md` - Design rationale

---

**That's it! You're ready to test TAI!** 🦅✨

**Total time:** ~10 minutes  
**Difficulty:** Easy  
**Result:** Fully functional profile & program system  

Happy testing! 🎉
