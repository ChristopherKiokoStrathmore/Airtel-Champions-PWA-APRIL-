# ZSM Profile UAT Testing Guide

## 🎯 Overview
This User Acceptance Testing (UAT) suite validates all profile features for **Zonal Sales Managers (ZSMs)** in the TAI Sales Intelligence Network app.

## 🚀 How to Access UAT Testing

### For ZSMs:
1. Log in as a ZSM user
2. Navigate to the **Explore** tab (🔍 icon in bottom navigation)
3. Look for the **purple test tube button (🧪)** in the bottom-left corner
4. Click it to open the UAT testing interface

## 📋 Testing Categories (12 Categories, 65+ Tests)

### 1️⃣ **Own Profile - View** (6 tests)
Tests ZSM's ability to view their own profile correctly.

**Critical Tests:**
- ✅ Access profile from profile menu dropdown
- ✅ ZSM badge displays in blue (#3B82F6)
- ✅ All 5 stat cards show: Rank, Points, Posts, Followers, Following

**What to Check:**
- Profile picture or initials display correctly
- Zone and Region location is accurate
- Join date format: "Month Year" (e.g., "Jan 2025")
- Top 3 achievements display with proper icons

---

### 2️⃣ **Own Profile - Edit** (5 tests)
Tests ZSM's ability to edit their own profile.

**Critical Tests:**
- ✅ Bio/tagline editable (150 character limit)
- ✅ Banner upload works (Supabase Storage)

**What to Check:**
- Character counter shows X/150 as you type
- Edit icon appears next to bio
- Camera button appears on banner (top-right)
- "Uploading..." state shows during upload
- Profile picture can be uploaded from settings

**How to Test Bio:**
1. Click edit icon next to bio
2. Type or modify text (max 150 chars)
3. Click "Save"
4. Verify bio updates immediately

**How to Test Banner:**
1. Click camera icon on banner
2. Select an image file
3. Wait for upload
4. Verify banner displays new image

---

### 3️⃣ **Own Profile - Tabs** (6 tests)
Tests the 3-tab interface (Posts, Activity, Stats).

**Critical Tests:**
- ✅ Posts tab shows ZSM's posts in 3-column grid
- ✅ Activity tab displays recent actions with icons
- ✅ Stats tab shows 30-day points trend chart

**What to Check:**

**Posts Tab:**
- Grid layout: 3 columns
- Shows only YOUR posts
- Images display properly
- Text-only posts show in colored boxes

**Activity Tab:**
- Icons: 📝 for posts, 💬 for comments
- Sorted by most recent first
- "Time ago" format (e.g., "2h ago", "3d ago")

**Stats Tab:**
- Bar chart with 30 bars (30 days)
- Hover tooltips show date + points
- Performance cards:
  - Total Engagement
  - Avg Likes per Post
  - Hall of Fame Posts

---

### 4️⃣ **Viewing SE Profiles** (8 tests)
Tests ZSM's ability to view Sales Executive profiles.

**Critical Tests:**
- ✅ Click SE name/avatar in Explore feed
- ✅ SE badge shows as "SE" in gray
- ✅ Follow button appears (not on own profile)
- ✅ Follow/unfollow toggles correctly

**What to Check:**
- SE's profile opens in modal
- Follow button: "+ Follow" → "Following"
- Follower count increases after following
- SE's posts/activity/stats show their data (not yours)
- Bio is view-only (no edit button)

**How to Test:**
1. Go to Explore tab
2. Find any post by an SE
3. Click on SE's name or avatar
4. Verify all SE's data displays
5. Click "+ Follow"
6. Verify button changes to "Following"
7. Check follower count increased by 1

---

### 5️⃣ **Viewing Other ZSM Profiles** (3 tests)
Tests peer ZSM profile viewing.

**What to Check:**
- Other ZSMs show blue badge
- Follow button appears
- Can follow other ZSMs (peer networking)

---

### 6️⃣ **Viewing Higher Roles** (5 tests)
Tests viewing ZBM, HQ, Director profiles.

**Badge Colors:**
- 🔵 ZSM = Blue
- 🟢 ZBM = Green  
- 🟡 HQ = Yellow
- 🟣 Director = Purple

**What to Check:**
- Can click on ZBM/HQ/Director names
- Correct badge colors display
- Follow button works

---

### 7️⃣ **Profile from Team View** (2 tests)
Tests accessing profiles from Home tab Team section.

**How to Test:**
1. Go to Home tab
2. Scroll to "My Team" section
3. Click on any SE card
4. Verify enhanced profile modal opens (not old modal)

---

### 8️⃣ **Profile from Leaderboard** (2 tests)
Tests accessing profiles from Leaderboard.

**How to Test:**
1. Go to Leaderboard tab
2. Click on any user's name
3. Verify profile data matches leaderboard data
4. Check rank and points are consistent

---

### 9️⃣ **Performance & Data Accuracy** (4 tests)
Tests speed and data correctness.

**Performance Benchmarks:**
- Profile loads in < 2 seconds
- Follower count updates without refresh
- Points chart matches database

**How to Test:**
1. Click profile → start timer
2. Modal should appear within 2 seconds
3. Follow someone → count should update instantly
4. Cross-check points with submissions

---

### 🔟 **Mobile Responsiveness** (4 tests)
Tests mobile/tablet experience.

**What to Check:**
- Modal is full-screen on mobile
- Stats cards wrap nicely (5 cards)
- Posts grid maintains 3 columns
- Banner upload button is tappable

**How to Test:**
1. Resize browser to mobile width (375px)
2. OR use Chrome DevTools mobile emulator
3. Open profile modal
4. Verify all elements accessible

---

### 1️⃣1️⃣ **Permissions & Security** (3 tests)
Tests data protection.

**Critical Security Checks:**
- ❌ ZSM cannot edit other users' bios
- ❌ ZSM cannot change other users' banners
- ✅ Follow data persists after logout/login

**How to Test:**
1. View another user's profile
2. Verify NO edit icons appear
3. Verify NO camera icon on banner
4. Follow someone → logout → login → verify still following

---

### 1️⃣2️⃣ **Edge Cases** (5 tests)
Tests unusual scenarios.

**What to Check:**
- User with 0 posts → shows "No posts yet"
- User with no bio → shows placeholder
- User with no achievements → section hidden
- User with very long name → truncates properly
- Days with 0 points → chart shows small bar

---

## 🎯 Priority Levels

### 🔴 CRITICAL (Must Pass)
- Profile access from Explore feed
- Stats cards display correctly
- Follow/unfollow functionality
- Posts tab shows correct user's posts
- Security: Cannot edit other profiles

### 🟠 HIGH (Should Pass)
- Bio editing works
- Banner upload works
- Activity timeline displays
- Badge colors correct
- Performance under 2 seconds

### 🟡 MEDIUM (Nice to Have)
- Character counter
- Time ago formatting
- Hover tooltips
- Mobile responsiveness

### ⚪ LOW (Polish)
- Loading states
- Edge case handling
- Very long names

---

## ✅ How to Mark Tests

In the UAT interface:

**✅ PASS** - Feature works as expected
**❌ FAIL** - Feature broken or doesn't work
**⚠️ WARNING** - Feature works but has minor issues

---

## 📊 Success Criteria

**Test Suite Passes If:**
- All CRITICAL tests = PASS
- 90%+ of HIGH tests = PASS
- 75%+ of MEDIUM tests = PASS

**Ready for Production If:**
- 0 CRITICAL failures
- 0-2 HIGH failures (documented)
- Any MEDIUM/LOW failures acceptable

---

## 🐛 How to Report Bugs

If you find a bug during testing:

1. Mark test as **FAIL**
2. Note exact steps to reproduce
3. Take screenshot if possible
4. Document:
   - What you did
   - What happened (actual)
   - What should happen (expected)

Example:
```
TEST: ZSM can edit bio
STATUS: FAIL
STEPS: 
1. Clicked edit icon on own profile
2. Typed bio text (100 chars)
3. Clicked Save
ACTUAL: Bio didn't save, no error message
EXPECTED: Bio should save and display immediately
```

---

## 🎓 Testing Tips

### Best Practices:
1. **Test in order** - Start with Category 1, work through all 12
2. **Use real data** - Create actual posts, follow real users
3. **Test both own profile AND other profiles**
4. **Try mobile view** - Use Chrome DevTools
5. **Test edge cases** - Find users with 0 posts, no bio, etc.

### Common Issues to Watch For:
- Loading spinners that never finish
- Buttons that don't respond
- Data showing for wrong user
- Follow button not changing state
- Images not loading
- Charts not displaying

### Quick Test Checklist:
- [ ] Can access own profile
- [ ] Can edit own bio
- [ ] Can upload banner
- [ ] Can view SE profiles
- [ ] Can follow/unfollow users
- [ ] Posts tab shows correct data
- [ ] Activity timeline works
- [ ] Stats chart displays
- [ ] Cannot edit other profiles
- [ ] Performance is fast

---

## 📞 Support

If you need help during testing:
- Check this guide for testing instructions
- Review the UAT interface tooltips
- Test one category at a time
- Mark uncertain tests as WARNING

---

## 🎉 Completion

Once all tests are marked:
1. Review the progress bar (should be 90%+)
2. Check stats: Pass/Fail/Warning counts
3. Document any failures
4. Click "Close UAT" when done

**Thank you for testing! Your feedback helps make TAI better for all 662 Sales Executives! 🦅**
