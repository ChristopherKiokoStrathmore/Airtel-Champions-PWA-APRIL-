# 🚀 QUICK START: Create Test Users in 5 Minutes

## **CHOOSE YOUR METHOD:**

---

## ⚡ **METHOD 1: AUTOMATED (RECOMMENDED)** - 2 Minutes

**Uses the Edge Function to create everything automatically**

### **Step 1: Deploy the Edge Function**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy create-test-users
```

### **Step 2: Run the Function**

**Option A: Using curl**
```bash
curl -X POST \
  'https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-test-users' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

**Option B: Using Postman/Insomnia**
```
Method: POST
URL: https://YOUR_PROJECT_ID.supabase.co/functions/v1/create-test-users
Headers:
  - Authorization: Bearer YOUR_ANON_KEY
  - Content-Type: application/json
```

### **Step 3: Done! ✅**

You'll get a response like:
```json
{
  "success": true,
  "message": "5 test users created successfully!",
  "credentials": {
    "field_agent": { "phone": "0712345001", "password": "JohnTAI@2024!" },
    "zone_commander": { "phone": "0711111001", "password": "AliceTAI@2024!" },
    "zone_business_lead": { "phone": "0722222001", "password": "DavidTAI@2024!" },
    "hq_team": { "phone": "0733333001", "password": "IsaacTAI@2024!" },
    "director": { "phone": "0744444001", "password": "AshishTAI@2024!" }
  }
}
```

**Now login to TAI with any of these credentials!** 🎉

---

## 🔧 **METHOD 2: MANUAL** - 5 Minutes

**Step-by-step manual creation (no Edge Function needed)**

### **Step 1: Create Auth Users**

1. Open your Supabase Dashboard
2. Go to **Authentication** → **Users**
3. Click **"Add User"** button

For each user below, click Add User and fill in:

#### **User 1: John Kamau (Field Agent)**
```
Email: john.kamau@airtel.co.ke
Password: JohnTAI@2024!
Auto Confirm User: ✓ (checked)
User Metadata (paste this JSON):
{
  "phone": "0712345001",
  "full_name": "John Kamau"
}
```
Click **"Create User"** → **Copy the UUID shown**

#### **User 2: Alice Mwangi (Zone Commander)**
```
Email: alice.mwangi@airtel.co.ke
Password: AliceTAI@2024!
Auto Confirm User: ✓
User Metadata:
{
  "phone": "0711111001",
  "full_name": "Alice Mwangi"
}
```
Click **"Create User"** → **Copy the UUID**

#### **User 3: David Ochieng (Zone Business Lead)**
```
Email: david.ochieng@airtel.co.ke
Password: DavidTAI@2024!
Auto Confirm User: ✓
User Metadata:
{
  "phone": "0722222001",
  "full_name": "David Ochieng"
}
```
Click **"Create User"** → **Copy the UUID**

#### **User 4: Isaac Kiptoo (HQ Team)**
```
Email: isaac.kiptoo@airtel.co.ke
Password: IsaacTAI@2024!
Auto Confirm User: ✓
User Metadata:
{
  "phone": "0733333001",
  "full_name": "Isaac Kiptoo"
}
```
Click **"Create User"** → **Copy the UUID**

#### **User 5: Ashish Azad (Director)**
```
Email: ashish.azad@airtel.co.ke
Password: AshishTAI@2024!
Auto Confirm User: ✓
User Metadata:
{
  "phone": "0744444001",
  "full_name": "Ashish Azad"
}
```
Click **"Create User"** → **Copy the UUID**

---

### **Step 2: Get All UUIDs**

After creating all 5 users, run this query in **SQL Editor**:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
)
ORDER BY email;
```

**Copy all 5 UUIDs!** You'll need them in the next step.

---

### **Step 3: Update and Run SQL Script**

1. Open `/utils/supabase/create-test-users.sql`

2. **Find & Replace ALL instances:**
   - `REPLACE-WITH-JOHN-UUID-FROM-AUTH-USERS` → *John's real UUID*
   - `REPLACE-WITH-ALICE-UUID-FROM-AUTH-USERS` → *Alice's real UUID*
   - `REPLACE-WITH-DAVID-UUID-FROM-AUTH-USERS` → *David's real UUID*
   - `REPLACE-WITH-ISAAC-UUID-FROM-AUTH-USERS` → *Isaac's real UUID*
   - `REPLACE-WITH-ASHISH-UUID-FROM-AUTH-USERS` → *Ashish's real UUID*

3. Go to Supabase **SQL Editor**

4. Click **"New Query"**

5. **Paste the entire updated SQL script**

6. Click **"Run"** (bottom right)

7. Wait 5-10 seconds for completion

---

### **Step 4: Verify**

Run this verification query:

```sql
SELECT 
  full_name, 
  employee_id, 
  role, 
  phone_number,
  total_points,
  rank
FROM users
WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
)
ORDER BY rank;
```

**Expected Output:**
```
full_name       | employee_id | role                | phone_number | total_points | rank
----------------|-------------|---------------------|--------------|--------------|-----
John Kamau      | EMP001      | field_agent         | 0712345001   | 850          | 1
Alice Mwangi    | ZSM01       | zone_commander      | 0711111001   | 0            | 999
David Ochieng   | ZBM01       | zone_business_lead  | 0722222001   | 0            | 999
Isaac Kiptoo    | HQ01        | hq_team             | 0733333001   | 0            | 999
Ashish Azad     | DIR01       | director            | 0744444001   | 0            | 999
```

✅ **If you see this, you're done!**

---

## 🎯 **LOGIN CREDENTIALS**

After setup, use these to login:

### **🦅 Field Agent (John Kamau)**
```
Phone: 0712345001
Password: JohnTAI@2024!

You'll see:
✓ Rank #1, 850 points, Level 17
✓ 5 badges unlocked
✓ 3 submissions (2 approved, 1 pending)
✓ Daily missions (2 of 3 complete)
✓ 45-day streak
```

### **🎖️ Zone Commander (Alice Mwangi)**
```
Phone: 0711111001
Password: AliceTAI@2024!

You'll see:
✓ Zone 1 dashboard
✓ 1 pending submission to review
✓ Zone stats and analytics
✓ Review workflow
```

### **💼 Zone Business Lead (David Ochieng)**
```
Phone: 0722222001
Password: DavidTAI@2024!

You'll see:
✓ Zone 1 business metrics
✓ Conversion rates
✓ Revenue impact
✓ Strategic insights
```

### **🏢 HQ Team (Isaac Kiptoo)**
```
Phone: 0733333001
Password: IsaacTAI@2024!

You'll see:
✓ National overview
✓ All zones performance
✓ Program management
✓ National leaderboard
```

### **👔 Director (Ashish Azad)**
```
Phone: 0744444001
Password: AshishTAI@2024!

You'll see:
✓ Executive summary
✓ High-level KPIs
✓ Strategic intelligence
✓ Market insights
```

---

## 🧪 **TEST SCENARIOS**

### **Scenario 1: Field Agent Submission Flow**
1. Login as John (0712345001)
2. Tap "Network Experience" program
3. (Camera would open - not available in browser)
4. See existing submissions:
   - 2 approved (with ZSM feedback)
   - 1 pending (awaiting review)
5. Check Gamification tab:
   - Daily Missions: 2 of 3 complete
   - Badges: 5 of 12 unlocked
6. View Profile:
   - 850 points, Level 17
   - Rank #1

### **Scenario 2: ZSM Review Workflow**
1. Login as Alice (0711111001)
2. See Zone Commander Dashboard
3. View 1 pending submission from John
4. Open submission detail:
   - Photo, GPS, notes
   - EXIF metadata
5. Options:
   - ✅ Approve (+10 points)
   - ❌ Reject (with notes)
6. Add review feedback
7. Submit review
8. John gets notification in real-time

### **Scenario 3: Director Overview**
1. Login as Ashish (0744444001)
2. See Director Dashboard
3. View executive summary:
   - National performance
   - Q1 target achievement: 95%
   - Market intelligence score
4. See announcement he sent
5. View strategic insights

---

## ❓ **TROUBLESHOOTING**

### **Error: "Phone number not found"**
**Solution:** Make sure you created the users table profiles using the SQL script in Step 3.

### **Error: "Invalid password"**
**Solution:** Passwords are case-sensitive. Use exactly: `JohnTAI@2024!`

### **Error: "User already exists"**
**Solution:** Delete existing test users first:
```sql
DELETE FROM auth.users 
WHERE email IN (
  'john.kamau@airtel.co.ke',
  'alice.mwangi@airtel.co.ke',
  'david.ochieng@airtel.co.ke',
  'isaac.kiptoo@airtel.co.ke',
  'ashish.azad@airtel.co.ke'
);
```
Then start over from Step 1.

### **Nothing displays after login**
**Solution:** Check that the SQL script ran successfully:
```sql
SELECT COUNT(*) FROM users;  -- Should be 5
SELECT COUNT(*) FROM submissions;  -- Should be 3
SELECT COUNT(*) FROM user_badges;  -- Should be 5
```

---

## 📊 **WHAT GETS CREATED**

### **5 Auth Users:**
- Complete authentication with passwords
- Email auto-confirmed (no verification needed)
- User metadata with phone & name

### **5 User Profiles:**
- Full profile data in `users` table
- Role assignments
- Gamification stats (points, rank, level, streak)

### **3 Submissions (for John):**
- 2 Approved (with ZSM feedback & points)
- 1 Pending (awaiting Alice's review)
- Complete metadata (GPS, photos, notes)

### **5 Badges (for John):**
- First Step (Bronze)
- Early Bird (Silver)
- Week Warrior (Gold)
- Quality Agent (Gold)
- Century Club (Silver)

### **1 Daily Mission Record (for John):**
- Network Scout: 2/3
- Quality Agent: 2/2 ✓
- Early Bird: 1/1 ✓ (claimed)

### **1 Announcement (from Ashish):**
- Q1 Target Achievement
- High priority, all users
- Red badge, Director level

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:

- [ ] Can login as John (Field Agent)
- [ ] Can login as Alice (Zone Commander)
- [ ] Can login as David (ZBM)
- [ ] Can login as Isaac (HQ)
- [ ] Can login as Ashish (Director)
- [ ] John shows Rank #1
- [ ] John has 5 badges
- [ ] John has 3 submissions
- [ ] Daily missions display
- [ ] Announcement appears
- [ ] Leaderboard shows John at #1
- [ ] Alice can see pending submission

---

## 🎉 **SUCCESS!**

If all verifications pass, you're ready to test TAI!

**You now have:**
✅ 5 fully functional test users
✅ All 5 role types covered
✅ Realistic data (submissions, badges, missions)
✅ Complete authentication working
✅ Ready for full app testing

**Start testing the complete TAI experience!** 🦅✨

---

## 🔗 **RELATED FILES**

- `/TEST_CREDENTIALS.md` - Complete credential list
- `/utils/supabase/create-test-users.sql` - Manual SQL script
- `/supabase/functions/create-test-users/index.ts` - Automated Edge Function
- `/DATABASE_SEEDING_STRATEGY.md` - Full deployment strategy
- `/utils/supabase/seed-data.sql` - 3-month historical data

---

**Ready to launch! 🚀**
