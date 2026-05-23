# 🧪 TAI Sales Intelligence Network - Comprehensive UAT Test Plan

**Test Date:** January 10, 2026  
**Version:** Post-Reset Points Feature  
**Environment:** Production (Mobile Testing)  
**Tester:** Field Testing on Phone

---

## 📱 Test Environment Setup

### **Prerequisites:**
- ✅ Phone with internet connection (works on 2G/3G)
- ✅ Clear browser cache before testing
- ✅ Test on actual mobile device (not desktop)
- ✅ Note loading times on slow connection

### **Test Data Reset:**
Before starting tests, Developer should:
1. ✅ Ensure database has sample data
2. ✅ Verify all 6 roles have test accounts
3. ✅ Check that programs exist
4. ✅ Verify social posts exist for Explore feed

---

## 👥 TEST USER CREDENTIALS

### **🟢 Profile 1: Sales Executive (SE)**
```
Role: sales_executive
Employee ID: SE001
Full Name: Test SE Alpha
Zone: Nairobi
Phone: +254712345001
Password: TestSE123!

Purpose: Field worker - submits intelligence, earns points
Key Features: Submit posts, view leaderboard, participate in programs
```

### **🔵 Profile 2: Zonal Sales Manager (ZSM)**
```
Role: zonal_sales_manager
Employee ID: ZSM001
Full Name: Test ZSM Beta
Zone: Nairobi
Phone: +254712345002
Password: TestZSM123!

Purpose: Team leader - manages SEs in zone
Key Features: View team performance, approve posts (if enabled), analytics
```

### **🟣 Profile 3: Zonal Business Manager (ZBM)**
```
Role: zonal_business_manager
Employee ID: ZBM001
Full Name: Test ZBM Gamma
Zone: Nairobi
Phone: +254712345003
Password: TestZBM123!

Purpose: Zone leader - oversees multiple ZSMs
Key Features: Zone-wide analytics, strategic view, cannot create programs
```

### **🟡 Profile 4: HQ Command Center**
```
Role: hq_command_center
Employee ID: HQ001
Full Name: Test HQ Delta
Zone: HQ
Phone: +254712345004
Password: TestHQ123!

Purpose: Central operations - nationwide view
Key Features: National analytics, create programs, view all zones
```

### **🔴 Profile 5: Director**
```
Role: director
Employee ID: DIR001
Full Name: Test Director Epsilon
Zone: HQ
Phone: +254712345005
Password: TestDIR123!

Purpose: Executive leadership - strategic decisions
Key Features: Full analytics, create programs, executive dashboard
```

### **🟠 Profile 6: Developer (Christopher)**
```
Role: developer
Employee ID: DEV001
Full Name: Christopher Dev
Zone: System
Phone: +254712345000
Password: DevMaster123!

Purpose: System admin - full access
Key Features: User management, reset points, system controls
```

---

## 🧪 UAT TEST SCENARIOS

---

## 1️⃣ SALES EXECUTIVE (SE) TESTS

### **Test 1.1: Login & Profile Setup**
**Steps:**
1. Open app in browser
2. Login with SE001 credentials
3. Verify profile loads correctly
4. Check profile shows: name, employee_id, zone, role badge

**Expected Results:**
- ✅ Login successful
- ✅ SE Dashboard loads
- ✅ Profile photo/avatar displays
- ✅ Points count visible
- ✅ Navigation shows 4 tabs: Home, Programs, Explore, Leaderboard

**Pass/Fail:** ⬜

---

### **Test 1.2: View Home Dashboard**
**Steps:**
1. Navigate to Home tab
2. Scroll through dashboard
3. Check all widgets load

**Expected Results:**
- ✅ Welcome message shows user name
- ✅ Points summary card displays
- ✅ Quick stats show (submissions, rank, streak)
- ✅ Programs widget displays active programs
- ✅ Leaderboard widget shows top 5 performers
- ✅ Recent announcements display (if any)
- ✅ All cards render properly on mobile

**Pass/Fail:** ⬜

---

### **Test 1.3: Submit Intelligence Post (Explore Feed)**
**Steps:**
1. Go to Explore tab
2. Click "+" or "Create Post" button
3. Fill in:
   - Title: "Test Market Intelligence"
   - Description: "Testing submission flow"
   - Category: Select any
   - Location: "Nairobi CBD"
   - Upload photo (optional)
4. Click Submit

**Expected Results:**
- ✅ Form opens smoothly
- ✅ All fields render properly
- ✅ Photo upload works (if tested)
- ✅ Submit button works
- ✅ Success message appears
- ✅ Post appears in feed immediately
- ✅ Points awarded notification shows

**Pass/Fail:** ⬜

---

### **Test 1.4: View Explore Feed**
**Steps:**
1. Stay on Explore tab
2. Scroll through posts
3. Try different filters (All, My Zone, Following)
4. Click on a post to view details

**Expected Results:**
- ✅ Posts display in Instagram-style cards
- ✅ Each post shows: photo, title, user, timestamp, points
- ✅ Like button works
- ✅ Comment button opens comments
- ✅ Share button shows options
- ✅ Filters work correctly
- ✅ Infinite scroll works
- ✅ Images load properly on slow connection

**Pass/Fail:** ⬜

---

### **Test 1.5: Interact with Posts**
**Steps:**
1. Find any post
2. Click Like button
3. Click Comment button
4. Write comment: "Great intelligence!"
5. Submit comment

**Expected Results:**
- ✅ Like count increases
- ✅ Like button changes color
- ✅ Comment modal opens
- ✅ Comment submits successfully
- ✅ Comment appears in list
- ✅ Comment count updates

**Pass/Fail:** ⬜

---

### **Test 1.6: View Leaderboard**
**Steps:**
1. Navigate to Leaderboard tab
2. View rankings
3. Try different timeframes (Daily, Weekly, Monthly, All-Time)
4. Try different categories (All, My Zone)
5. Find your own rank

**Expected Results:**
- ✅ Leaderboard displays with ranks
- ✅ Top 3 have special badges/styling
- ✅ Timeframe filters work
- ✅ Category filters work
- ✅ Your rank highlighted
- ✅ Shows: rank, name, points, submissions
- ✅ Hall of Fame section visible (if applicable)

**Pass/Fail:** ⬜

---

### **Test 1.7: View & Participate in Programs**
**Steps:**
1. Navigate to Programs tab
2. View active programs list
3. Click on a program
4. Read program details
5. Try to submit to program (if form available)

**Expected Results:**
- ✅ Programs list displays
- ✅ Each program shows: title, description, dates, points
- ✅ Active programs highlighted
- ✅ Program details open properly
- ✅ Dynamic form renders (12 field types)
- ✅ Can submit program entry
- ✅ Submission confirmation shows

**Pass/Fail:** ⬜

---

### **Test 1.8: View Profile & Edit**
**Steps:**
1. Click profile photo/dropdown
2. View profile modal
3. Click Edit Profile
4. Update phone number
5. Update profile photo (optional)
6. Save changes

**Expected Results:**
- ✅ Profile modal opens
- ✅ Shows all user details
- ✅ Edit mode works
- ✅ Changes save successfully
- ✅ Success message appears
- ✅ Updated info reflects immediately

**Pass/Fail:** ⬜

---

### **Test 1.9: View Announcements**
**Steps:**
1. Go to Home tab
2. Check for announcement cards
3. Click on an announcement
4. Read announcement details

**Expected Results:**
- ✅ Urgent announcements show at top
- ✅ Unread badge displays
- ✅ Click opens full announcement
- ✅ After reading, marks as read
- ✅ Badge count decreases

**Pass/Fail:** ⬜

---

### **Test 1.10: Offline Capability**
**Steps:**
1. Turn on Airplane mode
2. Navigate between tabs
3. Try to view cached content
4. Turn off Airplane mode
5. Verify sync happens

**Expected Results:**
- ⚠️ Graceful error messages when offline
- ✅ Previously loaded content still visible
- ✅ App doesn't crash
- ✅ When back online, content refreshes
- ✅ "Offline" indicator shows (if implemented)

**Pass/Fail:** ⬜

---

### **Test 1.11: Navigation & Responsiveness**
**Steps:**
1. Test all 4 bottom navigation tabs
2. Swipe between screens
3. Use back button on phone
4. Rotate phone (if applicable)

**Expected Results:**
- ✅ All tabs work smoothly
- ✅ Active tab highlighted
- ✅ Icons visible and clear
- ✅ No lag or delay
- ✅ Back button works correctly
- ✅ Layout responsive on all orientations

**Pass/Fail:** ⬜

---

### **Test 1.12: Performance on 2G/3G**
**Steps:**
1. Throttle connection to 3G (browser dev tools or actual 3G)
2. Navigate between tabs
3. Load Explore feed
4. Submit a post
5. Load images

**Expected Results:**
- ✅ App still usable (not frozen)
- ✅ Loading indicators show
- ✅ Images lazy load
- ✅ Text content loads first
- ✅ No timeout errors
- ✅ Max wait time < 10 seconds per action

**Pass/Fail:** ⬜

---

## 2️⃣ ZONAL SALES MANAGER (ZSM) TESTS

### **Test 2.1: Login & Dashboard Access**
**Steps:**
1. Logout SE account
2. Login with ZSM001 credentials
3. Verify ZSM dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ ZSM Dashboard shows
- ✅ Role badge shows "ZSM"
- ✅ Team view available
- ✅ Navigation: Home, Programs, Explore, Leaderboard

**Pass/Fail:** ⬜

---

### **Test 2.2: View Team Performance**
**Steps:**
1. Go to Home tab
2. Check team analytics widgets
3. View list of team members (SEs in your zone)
4. Click on a team member

**Expected Results:**
- ✅ Team stats display (total SEs, active, points)
- ✅ Team leaderboard shows
- ✅ Can see individual SE profiles
- ✅ SE activity visible
- ✅ Zone filter works correctly

**Pass/Fail:** ⬜

---

### **Test 2.3: View Zone-Specific Explore Feed**
**Steps:**
1. Navigate to Explore tab
2. Check if posts are filtered to zone
3. Try "My Zone" filter
4. View posts from your SEs

**Expected Results:**
- ✅ Explore feed shows all posts (not just zone)
- ✅ "My Zone" filter shows only Nairobi posts
- ✅ Can see which posts are from team members
- ✅ Can interact with posts (like, comment)

**Pass/Fail:** ⬜

---

### **Test 2.4: View Zone Leaderboard**
**Steps:**
1. Go to Leaderboard tab
2. Filter by "My Zone"
3. View your team's rankings
4. Check different timeframes

**Expected Results:**
- ✅ Zone leaderboard displays
- ✅ Only shows SEs from Nairobi zone
- ✅ Timeframe filters work
- ✅ Can see detailed stats per SE

**Pass/Fail:** ⬜

---

### **Test 2.5: View Programs & Analytics**
**Steps:**
1. Navigate to Programs tab
2. View program participation
3. Check which SEs participated
4. View program analytics (if available)

**Expected Results:**
- ✅ Programs list displays
- ✅ Can see participation counts
- ✅ Team performance in programs visible
- ✅ Analytics show zone breakdown

**Pass/Fail:** ⬜

---

### **Test 2.6: ZSM-Specific Features**
**Steps:**
1. Check if ZSM has any approval workflows
2. Look for team management tools
3. Check for reporting features
4. Verify no "Create Program" button (ZSM cannot create)

**Expected Results:**
- ✅ No "Create Program" button visible
- ✅ Team analytics available
- ✅ Can view but not edit team members
- ✅ Read-only access to submissions

**Pass/Fail:** ⬜

---

## 3️⃣ ZONAL BUSINESS MANAGER (ZBM) TESTS

### **Test 3.1: Login & Dashboard Access**
**Steps:**
1. Logout ZSM account
2. Login with ZBM001 credentials
3. Verify ZBM dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ ZBM Dashboard shows
- ✅ Role badge shows "ZBM"
- ✅ Zone-wide view available
- ✅ Higher-level analytics visible

**Pass/Fail:** ⬜

---

### **Test 3.2: View Zone-Wide Analytics**
**Steps:**
1. Go to Home tab
2. Check analytics widgets
3. View zone performance metrics
4. Compare with ZSM view (should be broader)

**Expected Results:**
- ✅ Zone-wide stats display
- ✅ Multiple ZSMs visible in zone
- ✅ Aggregated team performance
- ✅ Strategic metrics visible
- ✅ More comprehensive than ZSM view

**Pass/Fail:** ⬜

---

### **Test 3.3: View Multi-Team Leaderboard**
**Steps:**
1. Navigate to Leaderboard tab
2. View zone rankings
3. Should see SEs from multiple ZSM teams
4. Check zone vs. national view

**Expected Results:**
- ✅ Zone leaderboard shows all teams
- ✅ Can see breakdown by ZSM
- ✅ National view available
- ✅ Analytics more detailed than ZSM

**Pass/Fail:** ⬜

---

### **Test 3.4: Programs View (Cannot Create)**
**Steps:**
1. Navigate to Programs tab
2. View all programs
3. Verify no "Create Program" button
4. Check program analytics

**Expected Results:**
- ❌ No "Create Program" button visible
- ✅ Can view all programs
- ✅ Can see participation rates
- ✅ Zone-specific analytics available

**Pass/Fail:** ⬜

---

### **Test 3.5: Explore Feed Access**
**Steps:**
1. Navigate to Explore tab
2. View posts from entire zone
3. Check filters work
4. Verify can interact with posts

**Expected Results:**
- ✅ Explore feed accessible
- ✅ Zone filter works
- ✅ Can see all posts
- ✅ Can like, comment, share

**Pass/Fail:** ⬜

---

## 4️⃣ HQ COMMAND CENTER TESTS

### **Test 4.1: Login & Dashboard Access**
**Steps:**
1. Logout ZBM account
2. Login with HQ001 credentials
3. Verify HQ dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ HQ Dashboard shows
- ✅ Role badge shows "HQ"
- ✅ National view available
- ✅ Advanced features visible

**Pass/Fail:** ⬜

---

### **Test 4.2: View National Analytics**
**Steps:**
1. Go to Home tab
2. Check national metrics
3. View all zones
4. Check regional breakdown

**Expected Results:**
- ✅ National stats display
- ✅ All zones visible
- ✅ Regional comparison available
- ✅ Real-time metrics updating
- ✅ More comprehensive than zone views

**Pass/Fail:** ⬜

---

### **Test 4.3: Create New Program**
**Steps:**
1. Navigate to Programs tab
2. Click "Create Program" button
3. Fill in program details:
   - Title: "Test HQ Program"
   - Description: "UAT Testing"
   - Start Date: Tomorrow
   - End Date: +7 days
   - Points: 50
   - Add dynamic form fields
4. Submit program

**Expected Results:**
- ✅ "Create Program" button visible
- ✅ Form opens properly
- ✅ All field types available (12 types)
- ✅ Can add/remove fields dynamically
- ✅ Program submits successfully
- ✅ Program appears in list
- ✅ SEs can see program immediately

**Pass/Fail:** ⬜

---

### **Test 4.4: View All Submissions**
**Steps:**
1. Navigate to Explore tab
2. View all posts nationwide
3. Filter by zone
4. Check submission quality

**Expected Results:**
- ✅ All posts from all zones visible
- ✅ Zone filters work correctly
- ✅ Can view any submission details
- ✅ National feed comprehensive

**Pass/Fail:** ⬜

---

### **Test 4.5: View National Leaderboard**
**Steps:**
1. Navigate to Leaderboard tab
2. View all 662 SEs (paginated)
3. Filter by zone
4. Check Hall of Fame

**Expected Results:**
- ✅ National leaderboard loads
- ✅ All zones represented
- ✅ Pagination works smoothly
- ✅ Hall of Fame displays top performers
- ✅ Filters work correctly

**Pass/Fail:** ⬜

---

### **Test 4.6: Create Announcement**
**Steps:**
1. Look for "Create Announcement" option
2. Create announcement:
   - Title: "Test Announcement"
   - Message: "UAT Testing"
   - Priority: Urgent
   - Target: All SEs
3. Submit announcement

**Expected Results:**
- ✅ Can create announcements
- ✅ Target roles selectable
- ✅ Priority levels available
- ✅ Announcement posts successfully
- ✅ SEs see it immediately

**Pass/Fail:** ⬜

---

## 5️⃣ DIRECTOR TESTS

### **Test 5.1: Login & Dashboard Access**
**Steps:**
1. Logout HQ account
2. Login with DIR001 credentials
3. Verify Director dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ Director Dashboard shows
- ✅ Role badge shows "Director"
- ✅ Executive view available
- ✅ Strategic metrics visible

**Pass/Fail:** ⬜

---

### **Test 5.2: View Executive Dashboard**
**Steps:**
1. Go to Home tab
2. Check executive KPIs
3. View strategic metrics
4. Check trend analysis

**Expected Results:**
- ✅ High-level KPIs display
- ✅ Trends and graphs show
- ✅ Strategic insights available
- ✅ Regional comparison
- ✅ Performance benchmarks
- ✅ More executive-focused than HQ view

**Pass/Fail:** ⬜

---

### **Test 5.3: Create Strategic Program**
**Steps:**
1. Navigate to Programs tab
2. Click "Create Program"
3. Create strategic program:
   - Title: "Director Strategic Initiative"
   - Description: "Executive UAT Test"
   - High points value (200+)
   - Multiple zones targeted
4. Submit

**Expected Results:**
- ✅ Can create programs
- ✅ Strategic options available
- ✅ Can target multiple zones
- ✅ High points allowable
- ✅ Program cascades to all levels

**Pass/Fail:** ⬜

---

### **Test 5.4: View Comprehensive Analytics**
**Steps:**
1. Navigate between all tabs
2. Check access to all features
3. Verify no restrictions
4. Check report generation (if available)

**Expected Results:**
- ✅ Full access to all features
- ✅ Can view all zones
- ✅ Can see all submissions
- ✅ Analytics comprehensive
- ✅ Export options available (if implemented)

**Pass/Fail:** ⬜

---

### **Test 5.5: Explore Feed - Full Access**
**Steps:**
1. Navigate to Explore tab
2. View posts from all zones
3. Check quality of intelligence
4. Verify can interact with all posts

**Expected Results:**
- ✅ Complete feed access
- ✅ All zones visible
- ✅ Can filter by any criteria
- ✅ Full interaction capabilities

**Pass/Fail:** ⬜

---

## 6️⃣ DEVELOPER TESTS

### **Test 6.1: Login & Dashboard Access**
**Steps:**
1. Logout Director account
2. Login with DEV001 credentials (Christopher)
3. Verify Developer dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ Developer Dashboard shows
- ✅ Role badge shows "Developer"
- ✅ System admin features visible
- ✅ Full access granted

**Pass/Fail:** ⬜

---

### **Test 6.2: User Management**
**Steps:**
1. Go to Home tab
2. Find "Users by Role" section
3. Click on any role (e.g., "Sales Executives")
4. View user list modal
5. Click on a user
6. View user profile

**Expected Results:**
- ✅ User count displays for each role
- ✅ Modal opens with user list
- ✅ Users displayed with details
- ✅ Profile modal opens
- ✅ Can view all user details

**Pass/Fail:** ⬜

---

### **Test 6.3: Edit User**
**Steps:**
1. Navigate to Users tab (if exists) or use Quick Actions
2. Find a test user
3. Click Edit button
4. Modify user details:
   - Change name
   - Change role
   - Update points
5. Save changes

**Expected Results:**
- ✅ Edit modal opens
- ✅ All fields editable
- ✅ Role dropdown works
- ✅ Changes save successfully
- ✅ User details update immediately
- ✅ Success toast shows

**Pass/Fail:** ⬜

---

### **Test 6.4: Create New User**
**Steps:**
1. Click "Create User" button
2. Fill in new user details:
   - Full Name: "UAT Test User"
   - Employee ID: "UAT999"
   - Role: "sales_executive"
   - Zone: "Nairobi"
   - Phone: "+254799999999"
3. Submit

**Expected Results:**
- ✅ Create modal opens
- ✅ All fields available
- ✅ Validation works
- ✅ User creates successfully
- ✅ User appears in list
- ✅ Can login with new user

**Pass/Fail:** ⬜

---

### **Test 6.5: Delete User**
**Steps:**
1. Find the test user created in 6.4
2. Click Delete button
3. Confirm deletion
4. Verify user removed

**Expected Results:**
- ✅ Delete confirmation modal shows
- ✅ Warning messages clear
- ✅ User deletes successfully
- ✅ User removed from list
- ✅ Cannot login with deleted user

**Pass/Fail:** ⬜

---

### **Test 6.6: Role Checker Tool**
**Steps:**
1. Click "Role Checker" in Quick Actions
2. Enter a test employee ID
3. Check role and permissions
4. Try different user IDs

**Expected Results:**
- ✅ Role Checker modal opens
- ✅ Can search by employee ID
- ✅ Shows user role and details
- ✅ Shows permissions breakdown
- ✅ Shows access levels

**Pass/Fail:** ⬜

---

### **Test 6.7: System Health Check**
**Steps:**
1. Go to Home tab
2. Find "System Health" section
3. Check all indicators
4. Verify all systems online

**Expected Results:**
- ✅ Database: Online (green)
- ✅ Authentication: Active (green)
- ✅ Real-time Sync: Connected (green)
- ✅ All indicators green
- ✅ No errors displayed

**Pass/Fail:** ⬜

---

### **Test 6.8: ⚠️ DANGER ZONE - Reset All Points (CRITICAL TEST)**
**Steps:**
1. Scroll to bottom of Home tab
2. Find "Danger Zone" section (red/orange gradient)
3. Read warnings carefully
4. Click "Reset All Points to Zero" button
5. **STEP 1 - Warning Screen:**
   - Read all warnings
   - Click "I Understand, Continue"
6. **STEP 2 - Type to Confirm:**
   - Type exactly: `RESET ALL POINTS`
   - Verify button is disabled until text matches
   - Click "Reset All Points"
7. Wait for operation
8. Check success message
9. Verify all users now have 0 points

**Expected Results:**
- ✅ Danger Zone visible with red warning styling
- ✅ Button clearly labeled and visible
- ✅ **Warning Modal Step 1:**
  - Lists all items that will be reset
  - Shows historical data preserved
  - "Continue" button works
- ✅ **Type-to-Confirm Step 2:**
  - Must type exact text
  - Button disabled until match
  - Can go back to Step 1
- ✅ **Processing:**
  - Loading spinner shows
  - "Resetting..." text displays
  - UI locked during operation
- ✅ **Success:**
  - Success toast shows: "Successfully reset points for X users!"
  - Modal closes
  - Dashboard refreshes
  - All point counters show 0
  - Leaderboard reset
- ✅ **Data Integrity:**
  - Submissions still exist in database
  - User profiles intact
  - Only point counters reset
- ✅ **Backend:**
  - Console logs show operation
  - Endpoint returns success
  - User count returned matches total users

**⚠️ CRITICAL CHECKS:**
- ❌ No accidental triggers (multiple confirmations)
- ❌ Cannot bypass type-to-confirm
- ❌ No double-submission (loading state)
- ❌ No partial resets (all or nothing)
- ✅ Can cancel at any step

**Pass/Fail:** ⬜

**Notes:** This is the MOST CRITICAL test. Document any issues thoroughly!

---

### **Test 6.9: View System Analytics**
**Steps:**
1. Check real-time stats at top
2. View click events
3. Check user activity logs
4. View system performance metrics

**Expected Results:**
- ✅ Total users count accurate
- ✅ Active users count updates
- ✅ On-leave users tracked
- ✅ Real-time updates every 10 seconds
- ✅ Click events logged
- ✅ Activity tracking works

**Pass/Fail:** ⬜

---

### **Test 6.10: Access All Features**
**Steps:**
1. Navigate through all tabs
2. Verify access to everything
3. Check Programs tab (can create)
4. Check Explore feed (full access)
5. Check Leaderboard (all data)

**Expected Results:**
- ✅ No restrictions on any feature
- ✅ Can create programs
- ✅ Can view all submissions
- ✅ Can see all analytics
- ✅ Full system access confirmed

**Pass/Fail:** ⬜

---

## 🔄 CROSS-CUTTING TESTS (ALL ROLES)

### **Test CC.1: Session Persistence**
**Steps:**
1. Login as any role
2. Close browser tab
3. Reopen app URL
4. Check if still logged in

**Expected Results:**
- ✅ Session persists (localStorage)
- ✅ User still logged in
- ✅ Returns to last page
- ✅ Data intact

**Pass/Fail:** ⬜

---

### **Test CC.2: Logout Functionality**
**Steps:**
1. Login as any role
2. Click profile dropdown
3. Click Logout
4. Verify redirected to login

**Expected Results:**
- ✅ Logout button works
- ✅ Session cleared
- ✅ Redirected to login
- ✅ Cannot access pages without login

**Pass/Fail:** ⬜

---

### **Test CC.3: Responsive Design**
**Steps:**
1. Test on different screen sizes:
   - Small phone (< 375px)
   - Medium phone (375-414px)
   - Large phone (> 414px)
2. Rotate device
3. Check all layouts

**Expected Results:**
- ✅ All content visible on small screens
- ✅ No horizontal scrolling
- ✅ Touch targets large enough (min 44px)
- ✅ Text readable without zooming
- ✅ Images scale properly
- ✅ Navigation accessible

**Pass/Fail:** ⬜

---

### **Test CC.4: Error Handling**
**Steps:**
1. Disconnect internet
2. Try to perform actions
3. Reconnect internet
4. Check error messages

**Expected Results:**
- ✅ Graceful error messages
- ✅ No console errors that crash app
- ✅ Recovery when back online
- ✅ User-friendly messages (not technical)

**Pass/Fail:** ⬜

---

### **Test CC.5: Loading States**
**Steps:**
1. Navigate between tabs
2. Load heavy content (Explore feed)
3. Submit forms
4. Check loading indicators

**Expected Results:**
- ✅ Loading spinners show
- ✅ Skeleton screens display (if implemented)
- ✅ "Loading..." text visible
- ✅ No blank screens
- ✅ Smooth transitions

**Pass/Fail:** ⬜

---

### **Test CC.6: Data Refresh**
**Steps:**
1. Open app on two devices (or two browsers)
2. Submit post on Device 1
3. Pull to refresh on Device 2
4. Check if new post appears

**Expected Results:**
- ✅ Pull-to-refresh works
- ✅ New data loads
- ✅ Real-time updates (if implemented)
- ✅ No stale data

**Pass/Fail:** ⬜

---

## 🐛 BUG TRACKING

### **Bug Report Template:**
For each failed test, document:

```
Bug ID: UAT-001
Test Number: X.X
Role: [Role]
Severity: Critical / High / Medium / Low
Steps to Reproduce:
1.
2.
3.

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Screenshots:
[Attach if possible]

Device Info:
- Phone Model:
- Browser:
- OS Version:
- Connection: WiFi / 4G / 3G / 2G

Additional Notes:
```

---

## 📊 TEST SUMMARY REPORT

### **Overall Statistics:**
- Total Tests: 70+
- Passed: ___
- Failed: ___
- Blocked: ___
- Pass Rate: ___%

### **Critical Issues Found:**
1. 
2. 
3. 

### **High Priority Issues:**
1. 
2. 
3. 

### **Medium Priority Issues:**
1. 
2. 
3. 

### **Low Priority Issues / Nice-to-Haves:**
1. 
2. 
3. 

### **Performance Notes:**
- Average page load time: ___ seconds
- Explore feed load time: ___ seconds
- Image load time on 3G: ___ seconds
- Form submission time: ___ seconds

### **User Experience Notes:**
- Most intuitive feature: ___
- Most confusing feature: ___
- Best designed component: ___
- Needs improvement: ___

### **Recommendations:**
1. 
2. 
3. 

---

## ✅ ACCEPTANCE CRITERIA

### **Must Pass (Blocker Issues):**
- [ ] All roles can login successfully
- [ ] SEs can submit posts
- [ ] Explore feed loads and displays posts
- [ ] Leaderboard displays correctly
- [ ] Programs list displays
- [ ] Navigation works on all tabs
- [ ] No crashes or app-breaking errors
- [ ] Developer can reset points safely

### **Should Pass (High Priority):**
- [ ] Images load properly
- [ ] Forms submit successfully
- [ ] Filters work correctly
- [ ] User profiles display
- [ ] Announcements show
- [ ] Performance acceptable on 3G

### **Nice to Have:**
- [ ] Animations smooth
- [ ] Offline mode works
- [ ] Real-time updates
- [ ] Advanced analytics

---

## 📝 TESTER NOTES SECTION

**Date Started:** ___________  
**Date Completed:** ___________  
**Total Test Duration:** ___ hours

**General Observations:**
___________________________________________
___________________________________________
___________________________________________

**Standout Features:**
___________________________________________
___________________________________________
___________________________________________

**Major Concerns:**
___________________________________________
___________________________________________
___________________________________________

**Overall Assessment:**
[ ] Ready for Production
[ ] Ready with Minor Fixes
[ ] Needs Significant Work
[ ] Not Ready

**Tester Signature:** ___________

---

**END OF UAT TEST PLAN**

🚀 **Good luck with testing! Document everything thoroughly!**
