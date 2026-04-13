# 🔧 TAI UAT - Test Data Setup Guide

**Preparing Your Test Environment for Comprehensive UAT**

---

## 📋 PREREQUISITES CHECKLIST

Before starting UAT, ensure:

- [ ] Database is running (Supabase)
- [ ] Backend server is deployed
- [ ] Frontend is accessible via URL
- [ ] All 6 test user accounts exist
- [ ] Sample data exists for testing
- [ ] Developer account has access to reset feature

---

## 👥 STEP 1: CREATE TEST USER ACCOUNTS

### SQL Script to Create Test Users

**Run this in Supabase SQL Editor:**

```sql
-- Create test users in app_users table
-- Note: Adjust table structure if needed based on your schema

INSERT INTO app_users (id, employee_id, full_name, role, zone, phone, total_points, weekly_points, monthly_points, total_submissions, status, created_at)
VALUES 
  -- Sales Executive
  (gen_random_uuid(), 'SE001', 'Test SE Alpha', 'sales_executive', 'Nairobi', '+254712345001', 150, 50, 150, 15, 'active', NOW()),
  
  -- Zonal Sales Manager
  (gen_random_uuid(), 'ZSM001', 'Test ZSM Beta', 'zonal_sales_manager', 'Nairobi', '+254712345002', 0, 0, 0, 0, 'active', NOW()),
  
  -- Zonal Business Manager
  (gen_random_uuid(), 'ZBM001', 'Test ZBM Gamma', 'zonal_business_manager', 'Nairobi', '+254712345003', 0, 0, 0, 0, 'active', NOW()),
  
  -- HQ Command Center
  (gen_random_uuid(), 'HQ001', 'Test HQ Delta', 'hq_command_center', 'HQ', '+254712345004', 0, 0, 0, 0, 'active', NOW()),
  
  -- Director
  (gen_random_uuid(), 'DIR001', 'Test Director Epsilon', 'director', 'HQ', '+254712345005', 0, 0, 0, 0, 'active', NOW()),
  
  -- Developer
  (gen_random_uuid(), 'DEV001', 'Christopher Dev', 'developer', 'System', '+254712345000', 0, 0, 0, 0, 'active', NOW())
ON CONFLICT (employee_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  zone = EXCLUDED.zone,
  phone = EXCLUDED.phone;
```

### Passwords Setup

**If using Supabase Auth, create accounts via Supabase Dashboard or API:**

For each user, run:
```javascript
// Example for SE001
const { data, error } = await supabase.auth.admin.createUser({
  email: 'se001@airteltest.com',
  password: 'TestSE123!',
  email_confirm: true,
  user_metadata: {
    employee_id: 'SE001',
    full_name: 'Test SE Alpha',
    role: 'sales_executive'
  }
});
```

**Repeat for all 6 test accounts with respective credentials.**

---

## 📊 STEP 2: CREATE SAMPLE DATA

### A. Sample Intelligence Posts (Explore Feed)

```sql
-- Sample posts for testing Explore feed
-- Adjust based on your social_posts table structure

INSERT INTO social_posts (id, user_id, employee_id, title, description, category, location, media_url, points_awarded, likes_count, comments_count, created_at)
SELECT 
  gen_random_uuid(),
  u.id,
  u.employee_id,
  'Sample Market Intelligence ' || n,
  'This is test intelligence data for UAT testing. Category: ' || 
    CASE (n % 4)
      WHEN 0 THEN 'Competitor Activity'
      WHEN 1 THEN 'Customer Feedback'
      WHEN 2 THEN 'Market Trends'
      ELSE 'Product Issues'
    END,
  CASE (n % 4)
    WHEN 0 THEN 'competitor'
    WHEN 1 THEN 'customer'
    WHEN 2 THEN 'market'
    ELSE 'product'
  END,
  CASE (n % 3)
    WHEN 0 THEN 'Nairobi CBD'
    WHEN 1 THEN 'Westlands'
    ELSE 'Eastlands'
  END,
  NULL, -- or add sample image URLs
  10,
  FLOOR(RANDOM() * 20),
  FLOOR(RANDOM() * 10),
  NOW() - (n || ' days')::INTERVAL
FROM 
  app_users u,
  generate_series(1, 20) AS n
WHERE 
  u.role = 'sales_executive'
LIMIT 20;
```

### B. Sample Programs

```sql
-- Create sample programs for testing

INSERT INTO programs (
  id, 
  title, 
  description, 
  start_date, 
  end_date, 
  points_reward, 
  status, 
  created_by,
  target_zones,
  created_at
)
VALUES
  (
    gen_random_uuid(),
    'Q1 Market Intelligence Drive',
    'Collect competitive intelligence across all zones. Focus on pricing, promotions, and customer sentiment.',
    NOW(),
    NOW() + INTERVAL '30 days',
    100,
    'active',
    (SELECT id FROM app_users WHERE role = 'director' LIMIT 1),
    ARRAY['Nairobi', 'Mombasa', 'Kisumu'],
    NOW()
  ),
  (
    gen_random_uuid(),
    'Customer Feedback Initiative',
    'Gather detailed customer feedback on Airtel services. Include NPS scores and service quality ratings.',
    NOW(),
    NOW() + INTERVAL '14 days',
    50,
    'active',
    (SELECT id FROM app_users WHERE role = 'hq_command_center' LIMIT 1),
    ARRAY['All'],
    NOW()
  ),
  (
    gen_random_uuid(),
    'Competitor Pricing Analysis',
    'Document competitor pricing across all products. Include screenshots and location data.',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    75,
    'active',
    (SELECT id FROM app_users WHERE role = 'director' LIMIT 1),
    ARRAY['Nairobi', 'Nakuru'],
    NOW()
  );
```

### C. Sample Comments

```sql
-- Add sample comments to posts

INSERT INTO post_comments (id, post_id, user_id, comment_text, created_at)
SELECT 
  gen_random_uuid(),
  p.id,
  u.id,
  ARRAY[
    'Great intelligence!',
    'Very useful information',
    'Thanks for sharing',
    'Excellent observation',
    'This helps a lot'
  ][FLOOR(RANDOM() * 5 + 1)],
  NOW() - (FLOOR(RANDOM() * 7) || ' days')::INTERVAL
FROM 
  social_posts p
  CROSS JOIN app_users u
WHERE 
  u.role IN ('sales_executive', 'zonal_sales_manager')
ORDER BY RANDOM()
LIMIT 30;
```

### D. Sample Announcements

```sql
-- Create sample announcements

INSERT INTO announcements (
  id,
  title,
  message,
  priority,
  target_roles,
  created_by,
  created_at,
  read_by
)
VALUES
  (
    gen_random_uuid(),
    '🚨 Urgent: New Competitor Launch',
    'Safaricom has launched a new data bundle. Please submit intelligence immediately on pricing and customer response.',
    'urgent',
    ARRAY['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'],
    (SELECT id FROM app_users WHERE role = 'director' LIMIT 1),
    NOW() - INTERVAL '2 hours',
    ARRAY[]::UUID[]
  ),
  (
    gen_random_uuid(),
    '📊 Weekly Performance Update',
    'Great work team! We have collected 250 intelligence submissions this week. Keep up the excellent work!',
    'normal',
    ARRAY['all'],
    (SELECT id FROM app_users WHERE role = 'hq_command_center' LIMIT 1),
    NOW() - INTERVAL '1 day',
    ARRAY[]::UUID[]
  ),
  (
    gen_random_uuid(),
    '🎯 New Program Launched',
    'Check out the new Q1 Market Intelligence Drive program. 100 points for quality submissions!',
    'high',
    ARRAY['sales_executive'],
    (SELECT id FROM app_users WHERE role = 'director' LIMIT 1),
    NOW() - INTERVAL '3 days',
    ARRAY[]::UUID[]
  );
```

---

## 🎯 STEP 3: VERIFY TEST DATA

### Check User Accounts
```sql
SELECT employee_id, full_name, role, zone, total_points, status
FROM app_users
WHERE employee_id IN ('SE001', 'ZSM001', 'ZBM001', 'HQ001', 'DIR001', 'DEV001')
ORDER BY 
  CASE role
    WHEN 'sales_executive' THEN 1
    WHEN 'zonal_sales_manager' THEN 2
    WHEN 'zonal_business_manager' THEN 3
    WHEN 'hq_command_center' THEN 4
    WHEN 'director' THEN 5
    WHEN 'developer' THEN 6
  END;
```

**Expected:** 6 rows returned

### Check Social Posts
```sql
SELECT COUNT(*) as total_posts,
       COUNT(DISTINCT user_id) as unique_posters,
       SUM(likes_count) as total_likes,
       SUM(comments_count) as total_comments
FROM social_posts;
```

**Expected:** At least 10-20 posts

### Check Programs
```sql
SELECT title, status, points_reward, 
       DATE(start_date) as start, 
       DATE(end_date) as end
FROM programs
WHERE status = 'active'
ORDER BY created_at DESC;
```

**Expected:** At least 2-3 active programs

### Check Announcements
```sql
SELECT title, priority, target_roles, 
       DATE(created_at) as created
FROM announcements
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** At least 2-3 announcements

---

## 🔄 STEP 4: RESET TEST ENVIRONMENT (Optional)

### Before Each Test Cycle

**Option A: Reset Points Only (Preserves Data)**
```
Login as Developer (DEV001)
→ Scroll to Danger Zone
→ Reset All Points
→ All users back to 0 points
```

**Option B: Full Reset (Clears Everything)**
```sql
-- ⚠️ CAUTION: This will delete ALL data!

-- Delete posts
DELETE FROM social_posts;

-- Delete comments
DELETE FROM post_comments;

-- Delete program submissions
DELETE FROM program_submissions;

-- Delete announcements
DELETE FROM announcements;

-- Reset user points
UPDATE app_users 
SET total_points = 0, 
    weekly_points = 0, 
    monthly_points = 0, 
    total_submissions = 0
WHERE employee_id IN ('SE001', 'ZSM001', 'ZBM001', 'HQ001', 'DIR001', 'DEV001');

-- Then re-run sample data scripts above
```

---

## 🧪 STEP 5: PRE-TEST VERIFICATION CHECKLIST

### Quick Smoke Test (5 minutes)

**Before handing to testers, verify:**

1. **Can login as each role:**
   - [ ] SE001 → Shows SE Dashboard
   - [ ] ZSM001 → Shows ZSM Dashboard
   - [ ] ZBM001 → Shows ZBM Dashboard
   - [ ] HQ001 → Shows HQ Dashboard
   - [ ] DIR001 → Shows Director Dashboard
   - [ ] DEV001 → Shows Developer Dashboard

2. **Basic functionality works:**
   - [ ] Navigation tabs switch correctly
   - [ ] Explore feed loads posts
   - [ ] Leaderboard displays data
   - [ ] Programs list shows programs
   - [ ] No console errors on load

3. **Data is visible:**
   - [ ] At least 10 posts in Explore feed
   - [ ] At least 2 programs in Programs tab
   - [ ] Leaderboard has rankings
   - [ ] SE001 has some points (150)

4. **Critical features accessible:**
   - [ ] SE can submit new post
   - [ ] HQ can create program
   - [ ] Director can create program
   - [ ] Developer can access user management
   - [ ] Danger Zone visible for Developer

5. **Mobile responsive:**
   - [ ] Open on phone browser
   - [ ] Bottom navigation visible
   - [ ] Content fits screen
   - [ ] No horizontal scroll

---

## 📞 TROUBLESHOOTING COMMON ISSUES

### Issue: Users can't login
**Solution:** 
- Check if Supabase Auth accounts created
- Verify email_confirm set to true
- Check localStorage for auth tokens

### Issue: No data showing
**Solution:**
- Run sample data SQL scripts
- Check Row Level Security (RLS) policies
- Verify backend endpoints returning data

### Issue: Developer Danger Zone not visible
**Solution:**
- Confirm user role is exactly 'developer'
- Check employee_id is 'DEV001'
- Verify full_name includes 'Christopher'

### Issue: Programs not showing for ZBM
**Solution:**
- This is expected - ZBM cannot create programs
- They can only view existing programs

### Issue: Images not loading
**Solution:**
- Check Supabase Storage bucket exists
- Verify bucket is public
- Check image URLs are valid

### Issue: Slow performance on 3G
**Solution:**
- This is expected for first load
- Enable caching
- Optimize image sizes
- Test lazy loading

---

## 🎉 YOU'RE READY FOR UAT!

**Final Checklist:**
- [ ] All 6 test accounts exist and can login
- [ ] Sample data populated (posts, programs, announcements)
- [ ] Database and backend running
- [ ] Frontend accessible on mobile
- [ ] Developer tools functional (including Reset Points)
- [ ] No blocking errors in console
- [ ] Test credentials documented

**Hand over to testers with:**
1. ✅ UAT_TEST_PLAN_COMPREHENSIVE.md
2. ✅ UAT_QUICK_REFERENCE.md
3. ✅ UAT_FEEDBACK_FORM.md
4. ✅ App URL
5. ✅ Test user credentials

**Good luck! 🚀**

---

## 📧 SUPPORT DURING UAT

**If testers encounter issues:**

1. **Check backend logs** - Look for errors
2. **Check browser console** - F12 on desktop
3. **Verify test data** - Run verification queries
4. **Reset environment** - Use Developer reset feature
5. **Document thoroughly** - Screenshot + steps to reproduce

**Developer standby ready to:**
- Fix critical bugs immediately
- Generate fresh test data
- Reset test environment
- Answer technical questions

---

**Test Data Setup Complete! ✅**
