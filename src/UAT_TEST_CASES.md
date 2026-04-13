# 🧪 TAI - ZSM Profile UAT Test Cases

**Total Test Cases:** 65  
**Categories:** 12  
**Access:** Click purple test tube button (🧪) in ZSM Explore tab

---

## 📋 Test Categories Overview

| Category | Tests | Priority |
|----------|-------|----------|
| Own Profile - View | 6 | Critical/High |
| Own Profile - Edit | 5 | High/Medium |
| Own Profile - Tabs | 6 | Critical/High |
| Viewing SE Profiles | 8 | Critical/High |
| Viewing Other ZSM Profiles | 3 | High/Medium |
| Viewing Higher Roles | 5 | Medium/Low |
| Profile from Team View | 2 | Critical/High |
| Profile from Leaderboard | 2 | High/Critical |
| Performance & Data | 4 | Critical/High |
| Mobile Responsiveness | 4 | High/Medium |
| Permissions & Security | 3 | Critical/High |
| Edge Cases | 5 | Medium/Low |

---

## CATEGORY 1: OWN PROFILE - VIEW (6 tests)

### 1.1 Profile Access
**Priority:** 🔴 Critical  
**Test:** ZSM can access their own profile from profile menu  
**Steps:** Click profile dropdown → "My Profile"  
**Expected:** Profile modal opens with ZSM's data

### 1.2 Role Badge Display
**Priority:** 🟠 High  
**Test:** Profile displays correct ZSM badge with blue color  
**Expected:** Shows "ZSM" badge in blue (#3B82F6)

### 1.3 Stats Cards
**Priority:** 🔴 Critical  
**Test:** Stats cards show: Rank, Points, Posts, Followers, Following  
**Expected:** All 5 stat cards display with correct values

### 1.4 Location Display
**Priority:** 🟠 High  
**Test:** Zone and Region location displays correctly  
**Expected:** Shows ZSM's assigned zone and region

### 1.5 Join Date Format
**Priority:** 🟡 Medium  
**Test:** Join date displays in correct format (e.g., "Jan 2025")  
**Expected:** Format: Month Year

### 1.6 Achievements
**Priority:** 🟠 High  
**Test:** Top 3 achievements display correctly with icons  
**Expected:** Check achievement titles, icons, descriptions

---

## CATEGORY 2: OWN PROFILE - EDIT (5 tests)

### 2.1 Bio Editing
**Priority:** 🟠 High  
**Test:** ZSM can edit bio/tagline (150 char limit)  
**Steps:** Click edit icon → add/update bio → save  
**Expected:** Bio updates successfully

### 2.2 Character Counter
**Priority:** 🟡 Medium  
**Test:** Bio character counter works correctly  
**Expected:** Shows X/150 characters as you type

### 2.3 Banner Upload
**Priority:** 🟠 High  
**Test:** ZSM can upload custom profile banner  
**Steps:** Click camera icon on banner → select image → uploads to Supabase Storage  
**Expected:** Banner uploads and displays immediately

### 2.4 Upload Loading State
**Priority:** ⚪ Low  
**Test:** Banner upload shows loading state during upload  
**Expected:** Button shows "Uploading..." text

### 2.5 Profile Picture Upload
**Priority:** 🟡 Medium  
**Test:** Profile picture can be uploaded (from profile settings)  
**Steps:** Go to profile settings → upload photo  
**Expected:** Photo updates successfully

---

## CATEGORY 3: OWN PROFILE - TABS (6 tests)

### 3.1 Posts Tab Display
**Priority:** 🔴 Critical  
**Test:** Posts tab shows ZSM's own posts in grid layout  
**Expected:** Shows 3-column grid of posts

### 3.2 Activity Tab
**Priority:** 🟠 High  
**Test:** Activity tab shows recent actions (posts, comments)  
**Expected:** Timeline with icons: 📝 posts, 💬 comments

### 3.3 Activity Sorting
**Priority:** 🟡 Medium  
**Test:** Activity timeline sorted by most recent first  
**Expected:** Newest activities at the top

### 3.4 Stats Chart
**Priority:** 🔴 Critical  
**Test:** Stats tab displays 30-day points trend chart  
**Expected:** Bar chart showing daily points earned

### 3.5 Chart Tooltips
**Priority:** ⚪ Low  
**Test:** Points chart shows tooltips on hover  
**Expected:** Hover over bars to see date + points

### 3.6 Performance Summary
**Priority:** 🟠 High  
**Test:** Stats tab shows performance summary cards  
**Expected:** Total engagement, avg likes per post, hall of fame posts

---

## CATEGORY 4: VIEWING SE PROFILES (8 tests)

### 4.1 Access SE Profiles
**Priority:** 🔴 Critical  
**Test:** ZSM can view SE profiles from Explore feed  
**Steps:** Click on SE name/avatar in any post  
**Expected:** SE profile modal opens

### 4.2 SE Role Badge
**Priority:** 🟠 High  
**Test:** SE profile shows correct role badge (SE in gray)  
**Expected:** Badge says "SE" with gray color

### 4.3 Follow Button Visibility
**Priority:** 🟠 High  
**Test:** Follow button appears on SE profiles (not on own profile)  
**Expected:** Button shows "+ Follow" or "Following"

### 4.4 Follow/Unfollow Functionality
**Priority:** 🔴 Critical  
**Test:** ZSM can follow/unfollow SEs  
**Steps:** Click follow → button changes to "Following", count increases  
**Expected:** Follow state persists, count updates

### 4.5 SE Posts Tab
**Priority:** 🔴 Critical  
**Test:** SE's posts tab shows their posts in grid  
**Expected:** See SE's posts, not ZSM's posts

### 4.6 SE Activity Tab
**Priority:** 🟠 High  
**Test:** SE's activity tab shows their actions  
**Expected:** See SE's activity timeline

### 4.7 SE Stats Tab
**Priority:** 🟠 High  
**Test:** SE's stats tab shows their performance data  
**Expected:** Points chart and performance cards for that SE

### 4.8 SE Bio Display
**Priority:** 🟡 Medium  
**Test:** SE bio displays if they have one  
**Expected:** Shows SE's bio, not editable for ZSM

---

## CATEGORY 5: VIEWING OTHER ZSM PROFILES (3 tests)

### 5.1 View Other ZSMs
**Priority:** 🟠 High  
**Test:** ZSM can view other ZSM profiles  
**Steps:** Click on another ZSM's name in feed  
**Expected:** Profile opens with correct data

### 5.2 ZSM Badge Display
**Priority:** 🟠 High  
**Test:** Other ZSM shows correct blue ZSM badge  
**Expected:** Peer ZSMs have blue badge

### 5.3 Follow ZSMs
**Priority:** 🟡 Medium  
**Test:** ZSM can follow other ZSMs  
**Expected:** Professional networking between peers works

---

## CATEGORY 6: VIEWING HIGHER ROLES (5 tests)

### 6.1 View ZBM Profiles
**Priority:** 🟠 High  
**Test:** ZSM can view ZBM profiles  
**Steps:** Click on ZBM name in feed  
**Expected:** ZBM profile opens

### 6.2 ZBM Badge Color
**Priority:** 🟡 Medium  
**Test:** ZBM shows correct green badge  
**Expected:** ZBM badge is green

### 6.3 View HQ Profiles
**Priority:** 🟡 Medium  
**Test:** ZSM can view HQ staff profiles  
**Steps:** Click on HQ staff name in feed  
**Expected:** HQ profile opens

### 6.4 View Director Profiles
**Priority:** 🟡 Medium  
**Test:** ZSM can view Director profiles  
**Steps:** Click on Director name in feed  
**Expected:** Director profile opens

### 6.5 Director Badge Color
**Priority:** ⚪ Low  
**Test:** Director shows purple badge  
**Expected:** Highest role has distinctive purple badge

---

## CATEGORY 7: PROFILE FROM TEAM VIEW (2 tests)

### 7.1 Team Tab Access
**Priority:** 🔴 Critical  
**Test:** ZSM can view SE profiles from Team tab  
**Steps:** Go to Home → Team section → click on SE  
**Expected:** Profile modal opens

### 7.2 Enhanced Profile Modal
**Priority:** 🟠 High  
**Test:** Clicking SE in team opens enhanced profile modal  
**Expected:** Opens new profile modal, not old one

---

## CATEGORY 8: PROFILE FROM LEADERBOARD (2 tests)

### 8.1 Leaderboard Access
**Priority:** 🟠 High  
**Test:** ZSM can view profiles from Leaderboard tab  
**Steps:** Go to Leaderboard → click on any user  
**Expected:** Profile opens

### 8.2 Data Consistency
**Priority:** 🔴 Critical  
**Test:** Profile opens with correct user data  
**Expected:** Verify name, rank, points match leaderboard

---

## CATEGORY 9: PERFORMANCE & DATA (4 tests)

### 9.1 Load Speed
**Priority:** 🟠 High  
**Test:** Profile modal loads within 2 seconds  
**Expected:** Shows loading spinner then data quickly

### 9.2 Real-time Updates
**Priority:** 🟠 High  
**Test:** Follower count updates immediately after follow  
**Expected:** No page refresh needed

### 9.3 Post Pagination
**Priority:** 🟡 Medium  
**Test:** Posts tab loads all posts (pagination if >50)  
**Expected:** Handles users with many posts

### 9.4 Data Accuracy
**Priority:** 🔴 Critical  
**Test:** Points chart accurately reflects database data  
**Expected:** Cross-check with submissions table

---

## CATEGORY 10: MOBILE RESPONSIVENESS (4 tests)

### 10.1 Full-Screen Modal
**Priority:** 🟠 High  
**Test:** Profile modal is full-screen on mobile  
**Expected:** Takes up entire viewport on small screens

### 10.2 Stats Card Stacking
**Priority:** 🟡 Medium  
**Test:** Stats cards stack properly on mobile  
**Expected:** 5 cards wrap nicely

### 10.3 Posts Grid Mobile
**Priority:** 🟡 Medium  
**Test:** Posts grid shows 3 columns even on mobile  
**Expected:** Instagram-style 3-column grid maintained

### 10.4 Banner Upload Mobile
**Priority:** 🟠 High  
**Test:** Banner upload button accessible on mobile  
**Expected:** Camera button is tappable

---

## CATEGORY 11: PERMISSIONS & SECURITY (3 tests)

### 11.1 Bio Edit Permissions
**Priority:** 🔴 Critical  
**Test:** ZSM cannot edit other users' bios  
**Expected:** Edit button only shows on own profile

### 11.2 Banner Edit Permissions
**Priority:** 🔴 Critical  
**Test:** ZSM cannot change other users' banners  
**Expected:** Camera icon only on own profile

### 11.3 Follow Data Persistence
**Priority:** 🟠 High  
**Test:** Follow data persists across sessions  
**Steps:** Logout and login → following status should remain  
**Expected:** Follow relationships maintained

---

## CATEGORY 12: EDGE CASES (5 tests)

### 12.1 No Posts User
**Priority:** 🟡 Medium  
**Test:** Profile displays correctly for user with no posts  
**Expected:** Shows "No posts yet" message

### 12.2 No Bio User
**Priority:** ⚪ Low  
**Test:** Profile displays correctly for user with no bio  
**Expected:** Shows placeholder text

### 12.3 No Achievements User
**Priority:** ⚪ Low  
**Test:** Profile displays correctly for user with no achievements  
**Expected:** Achievement section hidden or shows placeholder

### 12.4 Long Names
**Priority:** ⚪ Low  
**Test:** Profile handles users with very long names gracefully  
**Expected:** Name truncates or wraps properly

### 12.5 Zero Data Days
**Priority:** 🟡 Medium  
**Test:** Points chart handles zero data days correctly  
**Expected:** Days with 0 points show small bar

---

## 🎯 How to Use the UAT System

### Access UAT Interface:
1. **Log in as ZSM** (you're already logged in as CAROLYN NYAWADE)
2. Go to **Explore tab**
3. Look for purple **test tube button (🧪)** in bottom-left
4. Click to open UAT interface

### Running Tests:
1. **Read the test description**
2. **Follow the steps** in the notes
3. **Mark result:**
   - ✓ **Pass** - Feature works as expected
   - ✕ **Fail** - Feature broken or missing
   - ⚠ **Warning** - Works but has minor issues

### Filtering:
- **By Category:** Focus on specific functionality
- **By Status:** See only pending/failed tests
- **By Priority:** Start with Critical tests first

### Progress Tracking:
- **Progress bar** shows overall completion
- **Stats cards** show pass/fail/warning counts
- **Generate Report** button shows summary

---

## 📊 Testing Strategy

### Phase 1: Core Functionality (Critical Tests)
Start with these critical tests:
- ✅ Own profile access (1.1)
- ✅ Stats cards display (1.3)
- ✅ Posts tab (3.1)
- ✅ Stats chart (3.4)
- ✅ View SE profiles (4.1)
- ✅ Follow/unfollow (4.4)
- ✅ SE posts display (4.5)
- ✅ Team tab access (7.1)
- ✅ Leaderboard data (8.2)
- ✅ Data accuracy (9.4)
- ✅ Edit permissions (11.1, 11.2)

### Phase 2: High Priority Features
- Profile editing (bio, banner)
- Activity timelines
- Performance stats
- Mobile responsiveness

### Phase 3: Medium/Low Priority
- Edge cases
- Visual polish
- Nice-to-have features

---

## 🐛 Bug Reporting

If you find issues, note:
1. **Test ID** (e.g., zsm-own-view-1)
2. **What happened** vs **What should happen**
3. **Steps to reproduce**
4. **Browser/device** (if relevant)
5. **Screenshots** (if helpful)

---

## ✅ Success Criteria

**Production Ready When:**
- ✅ All 17 Critical tests pass
- ✅ At least 90% of High priority tests pass
- ✅ No blocking security issues
- ✅ Mobile experience is functional

**Current Status:**
- Total Tests: 65
- Pending: 65
- Pass: 0
- Fail: 0
- Warning: 0

---

## 🚀 Quick Start

**Right now, you can start testing!**

1. Click purple 🧪 button in Explore tab
2. Start with "Own Profile - View" category
3. Test each item
4. Mark as Pass/Fail/Warning
5. Move to next category

The UAT interface tracks your progress automatically!

---

**Good luck with testing! 🎉**

Found bugs? Mark them as "Fail" and add notes in the interface.
