# 🚀 SUPABASE SETUP GUIDE - Sales Intelligence Network

## Complete Backend Integration Instructions

---

## 📋 PREREQUISITES

- [ ] Supabase account (free tier is fine for development)
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Basic SQL knowledge (helpful but not required)

---

## STEP 1: CREATE SUPABASE PROJECT (5 minutes)

### 1.1 Sign Up for Supabase
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in project details:
   ```
   Project Name:    sales-intelligence-network
   Database Password: [Generate a strong password - SAVE THIS!]
   Region:          Choose closest to Kenya (e.g., eu-west-1 or ap-southeast-1)
   Pricing Plan:    Free (for development)
   ```
4. Click "Create new project"
5. **Wait 2-3 minutes** for project to be provisioned

### 1.3 Get Your API Keys
Once project is ready:

1. Go to **Settings** (gear icon) → **API**
2. Copy these values (you'll need them):
   ```
   Project URL:        https://xxxxx.supabase.co
   Project API Key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (anon/public key)
   ```

---

## STEP 2: SET UP DATABASE SCHEMA (10 minutes)

### 2.1 Run Migration Script

**Option A: Using Supabase Dashboard (Easiest)**

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the ENTIRE contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for success message: "Success. No rows returned"

**Option B: Using Supabase CLI (Advanced)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 2.2 Verify Database Setup

After running the migration, verify these tables exist:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ users (0 rows)
   - ✅ mission_types (4 rows - pre-populated)
   - ✅ submissions (0 rows)
   - ✅ leaderboard (materialized view)
   - ✅ achievements (10 rows - pre-populated)
   - ✅ user_achievements (0 rows)
   - ✅ challenges (0 rows)
   - ✅ user_challenges (0 rows)
   - ✅ announcements (0 rows)
   - ✅ point_config (3 rows - pre-populated)
   - ✅ hotspots (0 rows)
   - ✅ competitor_activity (0 rows)
   - ✅ streaks (0 rows)

### 2.3 Check Pre-Populated Data

**Mission Types (4 rows):**
```sql
SELECT * FROM mission_types;
```
Should show:
- Network Experience (80 pts)
- Competition Conversion (200 pts)
- New Site Launch (150 pts)
- AMB Visitations (100 pts)

**Achievements (10 rows):**
```sql
SELECT name, bonus_points FROM achievements;
```
Should show badges like "Intelligence Rookie", "Legend", etc.

---

## STEP 3: CONFIGURE AUTHENTICATION (5 minutes)

### 3.1 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Configure settings:
   ```
   Enable email confirmations: OFF (for development)
   Secure email change:        ON
   ```

### 3.2 Create Admin Test Account

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Fill in:
   ```
   Email:    admin@airtel.local
   Password: Admin@123
   ```
4. Click "Create user"

### 3.3 Link Admin to Users Table

Run this SQL in **SQL Editor**:

```sql
-- Get the auth user ID
SELECT id FROM auth.users WHERE email = 'admin@airtel.local';

-- Insert into users table (replace 'auth-user-id' with actual ID from above)
INSERT INTO users (id, phone, email, full_name, role, region, pin_hash)
VALUES (
  'auth-user-id-from-above',
  '+254712000001',
  'admin@airtel.local',
  'System Administrator',
  'admin',
  'Nairobi',
  '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S'
);
```

---

## STEP 4: SET UP STORAGE (5 minutes)

### 4.1 Create Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Fill in:
   ```
   Name:        submission-photos
   Public:      OFF (keep private for security)
   File size limit: 5 MB
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```
4. Click "Create bucket"

### 4.2 Set Storage Policies

Run this SQL in **SQL Editor**:

```sql
-- Allow authenticated users to upload photos
CREATE POLICY "SEs can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'submission-photos' 
  AND auth.role() = 'authenticated'
);

-- Allow admins to read all photos
CREATE POLICY "Admins can read photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submission-photos'
  AND (SELECT role FROM users WHERE id::text = auth.uid()::text) = 'admin'
);

-- Allow SEs to read their own photos
CREATE POLICY "SEs can read own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'submission-photos'
  AND (storage.foldername(name))[1]::uuid = auth.uid()::uuid
);
```

---

## STEP 5: CONFIGURE ENVIRONMENT VARIABLES (2 minutes)

### 5.1 Create .env File

In your project root, create `.env`:

```bash
# Copy from .env.example
cp .env.example .env
```

### 5.2 Add Your Supabase Credentials

Edit `.env` and replace with your actual values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find these:**
- Go to Supabase dashboard → **Settings** → **API**
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "Project API Key (anon, public)" → `VITE_SUPABASE_ANON_KEY`

### 5.3 Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## STEP 6: TEST THE CONNECTION (5 minutes)

### 6.1 Create Test Script

Create `test-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check mission types
  const { data: missions, error: missionsError } = await supabase
    .from('mission_types')
    .select('*');

  if (missionsError) {
    console.error('❌ Mission types error:', missionsError);
  } else {
    console.log('✅ Mission types:', missions.length, 'found');
  }

  // Test 2: Check achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from('achievements')
    .select('*');

  if (achievementsError) {
    console.error('❌ Achievements error:', achievementsError);
  } else {
    console.log('✅ Achievements:', achievements.length, 'found');
  }

  // Test 3: Check auth
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@airtel.local',
    password: 'Admin@123',
  });

  if (authError) {
    console.error('❌ Auth error:', authError);
  } else {
    console.log('✅ Authentication successful:', user.email);
  }

  await supabase.auth.signOut();
  console.log('\n🎉 All tests passed!');
}

testConnection();
```

### 6.2 Run Test

```bash
node test-supabase.js
```

**Expected output:**
```
🔍 Testing Supabase connection...

✅ Mission types: 4 found
✅ Achievements: 10 found
✅ Authentication successful: admin@airtel.local

🎉 All tests passed!
```

---

## STEP 7: UPDATE ADMIN DASHBOARD (10 minutes)

### 7.1 Test DashboardOverview with Real Data

The `/lib/supabase.ts` file is already created with all API functions.

Let's update one component to use real data:

**Example: Update `DashboardOverview.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { getAnalytics, getSubmissions } from '../lib/supabase';

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Fetch analytics
    const { data: analyticsData } = await getAnalytics();
    if (analyticsData) setStats(analyticsData);

    // Fetch recent submissions
    const { data: submissionsData } = await getSubmissions({ limit: 5 });
    if (submissionsData) setSubmissions(submissionsData);

    setLoading(false);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  // Rest of component...
}
```

---

## STEP 8: ADD DEMO DATA (Optional - 5 minutes)

### 8.1 Create Demo SEs

Run this SQL to create 5 demo Sales Executives:

```sql
-- Create demo SEs
INSERT INTO users (phone, email, full_name, role, region, team, pin_hash) VALUES
  ('+254712000002', 'sarah.mwangi@airtel.co.ke', 'Sarah Mwangi', 'se', 'Nairobi', 'Team Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S'),
  ('+254712000003', 'john.kamau@airtel.co.ke', 'John Kamau', 'se', 'Nairobi', 'Team Alpha', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S'),
  ('+254712000004', 'eric.omondi@airtel.co.ke', 'Eric Omondi', 'se', 'Mombasa', 'Team Beta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S'),
  ('+254712000005', 'grace.njeri@airtel.co.ke', 'Grace Njeri', 'se', 'Kisumu', 'Team Gamma', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S'),
  ('+254712000006', 'david.kipchoge@airtel.co.ke', 'David Kipchoge', 'se', 'Nakuru', 'Team Delta', '$2a$10$rKp3YvW3HZBvX0H7VnKWB.YbW8zJ1hLG7y9.KqJD4kZQhNxGZ1V9S');
```

### 8.2 Create Demo Submissions

```sql
-- Get mission type IDs
SELECT id, name FROM mission_types;

-- Get SE IDs
SELECT id, full_name FROM users WHERE role = 'se';

-- Create demo submissions (replace IDs with actual ones from above)
INSERT INTO submissions (
  se_id, 
  mission_type_id, 
  photo_url, 
  location_lat, 
  location_lng, 
  location_address,
  notes,
  status,
  points_awarded
) VALUES
  (
    'se-id-1',
    'mission-type-id',
    'https://via.placeholder.com/400',
    -1.2921,
    36.8219,
    'Kenyatta Avenue, Nairobi',
    'Competitor offering 50% data bundle discount',
    'approved',
    200
  );
-- Add more demo submissions...
```

### 8.3 Refresh Leaderboard

```sql
REFRESH MATERIALIZED VIEW leaderboard;
```

---

## STEP 9: ENABLE REAL-TIME (Optional - 3 minutes)

### 9.1 Enable Replication

1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - ✅ submissions
   - ✅ leaderboard (if available)
   - ✅ announcements

### 9.2 Test Real-Time

Add this to any component:

```typescript
import { subscribeToSubmissions } from '../lib/supabase';

useEffect(() => {
  const subscription = subscribeToSubmissions((payload) => {
    console.log('New submission:', payload);
    // Refresh data
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## STEP 10: VERIFY EVERYTHING WORKS (5 minutes)

### Checklist:

- [ ] ✅ Database tables created (13 tables)
- [ ] ✅ Mission types populated (4 rows)
- [ ] ✅ Achievements populated (10 rows)
- [ ] ✅ Point config populated (3 rows)
- [ ] ✅ Admin user created
- [ ] ✅ Storage bucket created
- [ ] ✅ Environment variables set
- [ ] ✅ Supabase client installed
- [ ] ✅ Test script passes
- [ ] ✅ Authentication works

---

## 🎉 SUCCESS!

Your Supabase backend is now fully configured!

### Next Steps:

1. **Update Components**: Replace mock data in all components with Supabase calls
2. **Test Submission Flow**: Try creating, approving, rejecting submissions
3. **Test Leaderboard**: Verify rankings update correctly
4. **Test Real-Time**: Check if changes appear instantly
5. **Add Error Handling**: Implement loading states and error messages

---

## 📊 DATABASE SCHEMA OVERVIEW

```
users (662 SEs + admins)
  ├─ submissions (evidence with photos)
  │   ├─ mission_types (4 types)
  │   └─ Reviews → approved/rejected
  │
  ├─ leaderboard (materialized view)
  │   └─ Auto-refreshes on submission changes
  │
  ├─ user_achievements (unlocked badges)
  │   └─ achievements (15+ badges)
  │
  ├─ user_challenges (progress tracking)
  │   └─ challenges (daily/weekly)
  │
  └─ streaks (consecutive days)

announcements (system messages)
point_config (dynamic values)
hotspots (battle map data)
competitor_activity (intelligence)
```

---

## 🔒 SECURITY NOTES

### Row Level Security (RLS) Policies:

✅ **Users**: Can only read their own data (except admins)
✅ **Submissions**: SEs can only see their own, admins see all
✅ **Storage**: Photos are private, folder-based access control
✅ **Announcements**: Everyone can read, only admins can create

### Best Practices:

1. **Never expose service role key** in client code
2. **Use RLS policies** for all tables
3. **Validate data** on backend (triggers, functions)
4. **Limit file sizes** in storage (5 MB max)
5. **Use HTTPS only** (Supabase enforces this)

---

## 🐛 TROUBLESHOOTING

### "relation does not exist" error
- **Solution**: Re-run the migration script

### "permission denied" error
- **Solution**: Check RLS policies, ensure user is authenticated

### "invalid API key" error
- **Solution**: Verify `.env` file has correct keys

### Photos not uploading
- **Solution**: Check storage bucket policies, verify MIME types

### Leaderboard not updating
- **Solution**: Run `REFRESH MATERIALIZED VIEW leaderboard;`

---

## 📚 USEFUL RESOURCES

- **Supabase Docs**: https://supabase.com/docs
- **SQL Tutorial**: https://www.postgresqltutorial.com
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Storage Guide**: https://supabase.com/docs/guides/storage

---

## 🚀 YOU'RE READY!

Your backend is now live! Time to connect the admin dashboard and see real data flowing! 🎉
