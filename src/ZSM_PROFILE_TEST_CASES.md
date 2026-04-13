# ZSM Profile - Comprehensive Test Cases

**App:** TAI - Airtel Kenya Sales Intelligence Network  
**Feature:** Enhanced Profile System  
**Role Under Test:** Zonal Sales Manager (ZSM)  
**Date:** January 9, 2026  
**Total Test Cases:** 50

---

## Test Environment Setup

**Prerequisites:**
- [ ] ZSM user account created with valid data
- [ ] At least 5 SEs assigned to ZSM's zone
- [ ] Supabase storage buckets created (profile-banners, profile-pictures)
- [ ] Sample posts created in social_posts table
- [ ] Sample submissions with points in submissions table
- [ ] Test on both desktop and mobile devices

**Test Data:**
- ZSM Test User: `zsm_test@airtel.co.ke`
- ZSM Name: `John Kamau`
- ZSM Zone: `Nairobi Central`
- ZSM Points: `1,250`
- ZSM Posts: `15`
- Test SE Users: At least 5 SEs in same zone

---

## Category 1: Own Profile - View (10 Tests)

### TC-ZP-001: Open Own Profile from Profile Tab
**Priority:** P0 - Critical  
**Preconditions:** Logged in as ZSM

**Steps:**
1. Navigate to ZSM Dashboard
2. Click on "Profile" tab in bottom navigation
3. Observe profile modal opens

**Expected Results:**
- ✅ UserProfileModal opens instantly
- ✅ Shows ZSM's full name prominently
- ✅ Shows blue "Zone Sales Manager" role badge
- ✅ Shows profile picture or initial avatar
- ✅ Shows banner (default gradient or custom)
- ✅ Modal is centered and responsive

**Pass Criteria:** All expected results met

---

### TC-ZP-002: View Profile Header Information
**Priority:** P0 - Critical  
**Preconditions:** Profile modal is open (own profile)

**Steps:**
1. Open own profile
2. Inspect header section

**Expected Results:**
- ✅ Full name displayed correctly
- ✅ Role badge shows "👔 Zone Sales Manager" with blue background
- ✅ Location shows "Zone • Region" format (e.g., "Nairobi Central • Central")
- ✅ Join date shows "Joined MMM YYYY" (e.g., "Joined Jan 2025")
- ✅ Profile picture is circular (96x96px or similar)
- ✅ Banner covers full width with proper aspect ratio

**Pass Criteria:** All profile header fields display correctly

---

### TC-ZP-003: View 5 Stats Cards
**Priority:** P0 - Critical  
**Preconditions:** Profile modal is open (own profile)

**Steps:**
1. Open own profile
2. Scroll to stats cards section (below bio)
3. Count and verify all 5 cards

**Expected Results:**
- ✅ Exactly 5 stat cards displayed in grid (5 columns on desktop, 2-3 on mobile)
- ✅ Card 1: 🏆 Rank - Shows "#X" format
- ✅ Card 2: ⭐ Points - Shows numeric value
- ✅ Card 3: 📝 Posts - Shows post count
- ✅ Card 4: 👥 Followers - Shows "0" (feature not implemented)
- ✅ Card 5: 🔗 Following - Shows "0" (feature not implemented)
- ✅ All cards have icons, values, and labels

**Pass Criteria:** All 5 cards display with correct data

---

### TC-ZP-004: Verify Rank Calculation
**Priority:** P1 - High  
**Preconditions:** Multiple users exist with varying points

**Steps:**
1. Note ZSM's total_points from database
2. Count users with higher total_points
3. Open ZSM profile
4. Check Rank card

**Expected Results:**
- ✅ Rank = (users_with_higher_points) + 1
- ✅ If ZSM has most points, Rank = #1
- ✅ Rank updates when points change
- ✅ Shows "#" prefix before rank number

**Pass Criteria:** Rank calculation is accurate

---

### TC-ZP-005: Verify Points Display
**Priority:** P1 - High  
**Preconditions:** ZSM has earned points through submissions

**Steps:**
1. Check total_points in app_users table
2. Open ZSM profile
3. Compare Points card value

**Expected Results:**
- ✅ Points match database total_points value exactly
- ✅ Numbers formatted properly (commas for thousands)
- ✅ Updates in real-time when points change

**Pass Criteria:** Points display matches database

---

### TC-ZP-006: Verify Posts Count
**Priority:** P1 - High  
**Preconditions:** ZSM has created posts in social_posts

**Steps:**
1. Count ZSM's posts in social_posts table (WHERE author_id = zsm_id)
2. Open ZSM profile
3. Check Posts card

**Expected Results:**
- ✅ Post count matches database count
- ✅ Updates when new post is created
- ✅ Shows "0" if no posts exist

**Pass Criteria:** Post count is accurate

---

### TC-ZP-007: View Bio/Tagline
**Priority:** P1 - High  
**Preconditions:** ZSM has a bio saved in database

**Steps:**
1. Set bio in database: `UPDATE app_users SET bio = 'Leading Nairobi Central to excellence!' WHERE id = zsm_id`
2. Open ZSM profile
3. Look for bio text below stats cards

**Expected Results:**
- ✅ Bio displays in italic font with quotes
- ✅ Bio text matches database value
- ✅ Bio is readable and properly formatted
- ✅ Long bios wrap properly (max 150 chars)

**Pass Criteria:** Bio displays correctly

---

### TC-ZP-008: View Empty Bio State
**Priority:** P2 - Medium  
**Preconditions:** ZSM has no bio (NULL or empty string)

**Steps:**
1. Clear bio: `UPDATE app_users SET bio = NULL WHERE id = zsm_id`
2. Open ZSM profile

**Expected Results:**
- ✅ Shows placeholder text: "No bio yet. Click the edit icon to add one."
- ✅ Placeholder is in gray/muted color
- ✅ Edit icon is visible next to name

**Pass Criteria:** Empty state displays with helpful message

---

### TC-ZP-009: View Edit Controls (Own Profile Only)
**Priority:** P0 - Critical  
**Preconditions:** Viewing own profile

**Steps:**
1. Open own profile
2. Look for edit controls

**Expected Results:**
- ✅ Bio edit icon (pencil) appears next to name
- ✅ Banner upload button (camera icon) appears on banner
- ✅ Profile picture upload button appears on avatar
- ✅ All edit buttons are visually distinct
- ✅ Hover states work properly

**Pass Criteria:** All 3 edit controls are visible and interactive

---

### TC-ZP-010: Verify No Edit Controls on Other Profiles
**Priority:** P0 - Critical  
**Preconditions:** Viewing another user's profile (not own)

**Steps:**
1. Open any SE's profile from Team tab
2. Look for edit controls

**Expected Results:**
- ❌ NO bio edit icon visible
- ❌ NO banner upload button visible
- ❌ NO profile picture upload button visible
- ✅ Profile is read-only

**Pass Criteria:** No edit controls appear on other users' profiles

---

## Category 2: Own Profile - Edit (10 Tests)

### TC-ZP-011: Edit Bio - Open Editor
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open

**Steps:**
1. Click the pencil/edit icon next to name
2. Observe bio editor modal

**Expected Results:**
- ✅ Bio editor modal opens instantly
- ✅ Modal has title "Edit Bio"
- ✅ Textarea shows current bio (or empty if none)
- ✅ Character counter shows "X/150 characters"
- ✅ Save and Cancel buttons visible

**Pass Criteria:** Bio editor opens correctly

---

### TC-ZP-012: Edit Bio - Type and Save
**Priority:** P0 - Critical  
**Preconditions:** Bio editor is open

**Steps:**
1. Open bio editor
2. Type: "Driving sales excellence in Nairobi Central!"
3. Click Save button
4. Wait for save operation

**Expected Results:**
- ✅ Save button shows loading state ("Saving...")
- ✅ Success toast appears: "Bio updated successfully"
- ✅ Bio editor modal closes
- ✅ New bio appears in profile immediately
- ✅ Database updated: `SELECT bio FROM app_users WHERE id = zsm_id`

**Pass Criteria:** Bio saves and displays correctly

---

### TC-ZP-013: Edit Bio - Character Limit Enforcement
**Priority:** P1 - High  
**Preconditions:** Bio editor is open

**Steps:**
1. Open bio editor
2. Type exactly 150 characters
3. Try to type the 151st character

**Expected Results:**
- ✅ Cannot type beyond 150 characters
- ✅ Counter shows "150/150 characters"
- ✅ Warning color when < 20 chars remaining (orange)
- ✅ No error, just prevents input

**Pass Criteria:** 150 character limit is enforced

---

### TC-ZP-014: Edit Bio - Character Counter
**Priority:** P2 - Medium  
**Preconditions:** Bio editor is open

**Steps:**
1. Open bio editor (empty bio)
2. Type "Test" (4 chars)
3. Observe counter
4. Delete 2 chars
5. Observe counter update

**Expected Results:**
- ✅ Counter starts at "0/150"
- ✅ Updates to "4/150" after typing
- ✅ Updates to "2/150" after deleting
- ✅ Counter is real-time (no lag)
- ✅ Shows remaining chars when < 20

**Pass Criteria:** Counter updates accurately in real-time

---

### TC-ZP-015: Edit Bio - Cancel Action
**Priority:** P1 - High  
**Preconditions:** Bio editor is open

**Steps:**
1. Open bio editor
2. Type some text
3. Click Cancel button

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Changes are NOT saved
- ✅ Bio remains unchanged in profile
- ✅ Database not updated
- ✅ No error or warning

**Pass Criteria:** Cancel discards changes properly

---

### TC-ZP-016: Upload Banner Image - Success
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open, test image ready (< 2MB)

**Steps:**
1. Click camera icon on banner
2. Select test image (banner-test.jpg, 1920x500px, 1.5MB)
3. Wait for upload

**Expected Results:**
- ✅ File picker opens
- ✅ Upload progress indicator appears
- ✅ Success toast: "Banner updated successfully"
- ✅ New banner displays immediately
- ✅ Banner_url updated in database
- ✅ Image stored in Supabase Storage bucket: `make-28f2f653-profile-banners`

**Pass Criteria:** Banner uploads and displays correctly

---

### TC-ZP-017: Upload Banner - File Size Validation
**Priority:** P1 - High  
**Preconditions:** Own profile is open

**Steps:**
1. Click camera icon on banner
2. Select large image (> 2MB, e.g., 5MB banner.jpg)
3. Observe behavior

**Expected Results:**
- ✅ Error toast appears: "Image must be less than 2MB"
- ✅ Upload does NOT proceed
- ✅ Banner remains unchanged
- ✅ Database not updated

**Pass Criteria:** File size validation works

---

### TC-ZP-018: Upload Profile Picture - Success
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open, test image ready

**Steps:**
1. Click camera icon on profile picture (bottom-right of avatar)
2. Select test image (avatar.jpg, 500x500px, 500KB)
3. Wait for upload

**Expected Results:**
- ✅ File picker opens
- ✅ Upload spinner appears on button
- ✅ Success toast: "Profile picture updated successfully"
- ✅ New avatar displays immediately
- ✅ Avatar_url updated in database
- ✅ Image stored in bucket: `make-28f2f653-profile-pictures`

**Pass Criteria:** Avatar uploads and displays correctly

---

### TC-ZP-019: Upload Profile Picture - File Type Validation
**Priority:** P1 - High  
**Preconditions:** Own profile is open

**Steps:**
1. Click camera icon on avatar
2. Select non-image file (e.g., document.pdf)
3. Observe behavior

**Expected Results:**
- ✅ Error toast: "Please select an image file"
- ✅ Upload does NOT proceed
- ✅ Avatar remains unchanged

**Pass Criteria:** File type validation works

---

### TC-ZP-020: Edit Controls - Disabled During Upload
**Priority:** P2 - Medium  
**Preconditions:** Own profile is open

**Steps:**
1. Click camera icon on banner
2. Select image
3. While uploading, try to click bio edit icon

**Expected Results:**
- ✅ Upload button shows disabled state
- ✅ Other edit controls remain functional
- ✅ Or all edit controls disabled during upload (acceptable)

**Pass Criteria:** No conflicts during concurrent edits

---

## Category 3: Own Profile - Tabs (10 Tests)

### TC-ZP-021: Switch to Posts Tab
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open

**Steps:**
1. Ensure Posts tab is active (default)
2. Observe content

**Expected Results:**
- ✅ Posts tab is highlighted/active by default
- ✅ Blue underline or background on "Posts" tab
- ✅ Posts grid displays (3 columns on desktop)
- ✅ Tab content matches selected tab

**Pass Criteria:** Posts tab is active by default

---

### TC-ZP-022: Posts Tab - Display Posts Grid
**Priority:** P0 - Critical  
**Preconditions:** ZSM has created 10+ posts

**Steps:**
1. Click Posts tab
2. Observe grid layout

**Expected Results:**
- ✅ Posts displayed in 3-column grid (Instagram style)
- ✅ Each post is square (aspect-ratio: 1/1)
- ✅ Posts show images if available
- ✅ Posts without images show gradient background with text preview
- ✅ Hover overlay shows like/comment counts
- ✅ Posts ordered by newest first

**Pass Criteria:** Posts grid displays correctly

---

### TC-ZP-023: Posts Tab - Empty State
**Priority:** P1 - High  
**Preconditions:** ZSM has 0 posts

**Steps:**
1. Delete all posts: `DELETE FROM social_posts WHERE author_id = zsm_id`
2. Open profile
3. Click Posts tab

**Expected Results:**
- ✅ Shows empty state illustration (📝 emoji)
- ✅ Message: "No posts yet"
- ✅ Subtext: "Posts will appear here when shared"
- ✅ No error or loading state

**Pass Criteria:** Empty state is user-friendly

---

### TC-ZP-024: Switch to Activity Tab
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open

**Steps:**
1. Click "Activity" tab
2. Observe tab change

**Expected Results:**
- ✅ Activity tab becomes active (highlighted)
- ✅ Posts tab becomes inactive
- ✅ Activity timeline displays
- ✅ Smooth transition (no flash)

**Pass Criteria:** Tab switching works smoothly

---

### TC-ZP-025: Activity Tab - Display Timeline
**Priority:** P1 - High  
**Preconditions:** ZSM has posts, comments, and likes

**Steps:**
1. Create activity data:
   - Post 2 posts
   - Comment on 3 posts
   - Like 5 posts
2. Open profile
3. Click Activity tab

**Expected Results:**
- ✅ Activities shown in chronological order (newest first)
- ✅ Activity types visible:
  - 📝 "Posted a new insight"
  - 💬 "Commented on a post"
  - ❤️ "Liked X post(s)"
- ✅ Each activity shows icon, title, description, timestamp
- ✅ Timestamps are relative ("2 hours ago", "3 days ago")

**Pass Criteria:** Activity timeline is accurate and readable

---

### TC-ZP-026: Activity Tab - Empty State
**Priority:** P2 - Medium  
**Preconditions:** ZSM has no activity (new user)

**Steps:**
1. Create new ZSM user with no posts/comments/likes
2. Open profile
3. Click Activity tab

**Expected Results:**
- ✅ Shows empty state (📊 emoji)
- ✅ Message: "No activity yet"
- ✅ Subtext: "Activity will appear here"

**Pass Criteria:** Empty state displays

---

### TC-ZP-027: Switch to Stats Tab
**Priority:** P0 - Critical  
**Preconditions:** Own profile is open

**Steps:**
1. Click "Stats" tab
2. Observe tab change

**Expected Results:**
- ✅ Stats tab becomes active
- ✅ Other tabs become inactive
- ✅ Stats content displays

**Pass Criteria:** Tab switching works

---

### TC-ZP-028: Stats Tab - 30-Day Points Chart
**Priority:** P0 - Critical  
**Preconditions:** ZSM has submissions in last 30 days

**Steps:**
1. Ensure ZSM has approved submissions with points in last 30 days
2. Open profile
3. Click Stats tab
4. Observe chart

**Expected Results:**
- ✅ Bar chart displays 30 days of data
- ✅ X-axis shows dates (e.g., "Jan 1", "Jan 2")
- ✅ Y-axis shows points
- ✅ Bars show points earned each day
- ✅ Hover tooltip shows date + points
- ✅ Days with no points show 0 or no bar

**Pass Criteria:** Chart renders correctly with accurate data

---

### TC-ZP-029: Stats Tab - Performance Summary Cards
**Priority:** P1 - High  
**Preconditions:** Stats tab is open

**Steps:**
1. Click Stats tab
2. Scroll to summary cards section

**Expected Results:**
- ✅ 4 summary cards displayed in 2x2 grid
- ✅ Card 1: Total Engagement (likes + comments)
- ✅ Card 2: Avg Likes/Post (calculated correctly)
- ✅ Card 3: Hall of Fame Posts (posts with hall_of_fame = true)
- ✅ Card 4: Active Days (days with points > 0 in last 30 days)
- ✅ All values are numeric and accurate

**Pass Criteria:** All 4 cards display with correct calculations

---

### TC-ZP-030: Stats Tab - Data Accuracy
**Priority:** P1 - High  
**Preconditions:** Known data in database

**Steps:**
1. Manually calculate expected values:
   - Total Engagement = SUM(likes on all posts) + COUNT(comments)
   - Avg Likes = Total Likes / Total Posts
   - Hall of Fame = COUNT(posts WHERE hall_of_fame = true)
   - Active Days = COUNT(DISTINCT days with points in last 30 days)
2. Open Stats tab
3. Compare displayed values

**Expected Results:**
- ✅ All values match manual calculations
- ✅ No rounding errors
- ✅ Averages rounded to whole numbers

**Pass Criteria:** All stats are mathematically correct

---

## Category 4: Viewing SE Profiles (5 Tests)

### TC-ZP-031: Open SE Profile from Team Tab
**Priority:** P0 - Critical  
**Preconditions:** Logged in as ZSM, Team tab has SE list

**Steps:**
1. Navigate to Team tab
2. Click on any SE card/row
3. Observe modal

**Expected Results:**
- ✅ UserProfileModal opens
- ✅ Shows SE's full name
- ✅ Shows gray "👤 Sales Executive" role badge
- ✅ Shows SE's zone and region
- ✅ Shows SE's stats (rank, points, posts)
- ✅ NO edit controls visible (not own profile)

**Pass Criteria:** SE profile opens correctly with read-only view

---

### TC-ZP-032: View SE Stats
**Priority:** P1 - High  
**Preconditions:** SE profile is open

**Steps:**
1. Open SE profile
2. Verify stats cards

**Expected Results:**
- ✅ Rank is calculated correctly for SE
- ✅ Points match SE's total_points
- ✅ Posts show SE's post count
- ✅ Followers/Following show 0

**Pass Criteria:** SE stats are accurate

---

### TC-ZP-033: View SE Posts Tab
**Priority:** P1 - High  
**Preconditions:** SE has created posts

**Steps:**
1. Open SE profile
2. Click Posts tab

**Expected Results:**
- ✅ Shows SE's posts only (not ZSM's posts)
- ✅ Posts in 3-column grid
- ✅ Can click posts to view (future feature)

**Pass Criteria:** SE's posts display correctly

---

### TC-ZP-034: View SE Activity Tab
**Priority:** P2 - Medium  
**Preconditions:** SE has activity

**Steps:**
1. Open SE profile
2. Click Activity tab

**Expected Results:**
- ✅ Shows SE's activity timeline
- ✅ Activities are SE's actions only

**Pass Criteria:** SE's activity displays correctly

---

### TC-ZP-035: View SE Stats Tab
**Priority:** P2 - Medium  
**Preconditions:** SE has submissions

**Steps:**
1. Open SE profile
2. Click Stats tab

**Expected Results:**
- ✅ Chart shows SE's 30-day points (not ZSM's)
- ✅ Summary cards show SE's stats
- ✅ Data is isolated to SE

**Pass Criteria:** SE's stats are displayed, not mixed with ZSM's

---

## Category 5: Viewing Other ZSMs (5 Tests)

### TC-ZP-036: View Another ZSM Profile
**Priority:** P1 - High  
**Preconditions:** Multiple ZSMs exist in system

**Steps:**
1. Navigate to Leaderboard tab
2. Find another ZSM in the list
3. Click on their name/avatar (if implemented)
4. OR manually trigger profile modal with another ZSM's ID

**Expected Results:**
- ✅ Profile opens for other ZSM
- ✅ Shows blue "Zone Sales Manager" badge
- ✅ Shows other ZSM's stats (not own)
- ✅ NO edit controls visible
- ✅ Read-only view

**Pass Criteria:** Other ZSM profile is read-only

---

### TC-ZP-037: Verify Correct Data for Other ZSM
**Priority:** P1 - High  
**Preconditions:** Other ZSM profile is open

**Steps:**
1. Note other ZSM's ID from database
2. Open their profile
3. Verify all data

**Expected Results:**
- ✅ Name matches database
- ✅ Zone/region matches database
- ✅ Points match their total_points
- ✅ Posts count is their posts, not yours

**Pass Criteria:** All data belongs to the correct ZSM

---

### TC-ZP-038: View Other ZSM's Posts
**Priority:** P2 - Medium  
**Preconditions:** Other ZSM has posts

**Steps:**
1. Open other ZSM's profile
2. Click Posts tab

**Expected Results:**
- ✅ Shows only other ZSM's posts
- ✅ Does NOT show own posts
- ✅ Post count matches database

**Pass Criteria:** Posts are isolated correctly

---

### TC-ZP-039: View Other ZSM's Activity
**Priority:** P2 - Medium  
**Preconditions:** Other ZSM has activity

**Steps:**
1. Open other ZSM's profile
2. Click Activity tab

**Expected Results:**
- ✅ Shows other ZSM's activities
- ✅ Timeline is accurate for them

**Pass Criteria:** Activity is isolated

---

### TC-ZP-040: View Other ZSM's Stats Chart
**Priority:** P2 - Medium  
**Preconditions:** Other ZSM has submissions

**Steps:**
1. Open other ZSM's profile
2. Click Stats tab
3. Verify chart data

**Expected Results:**
- ✅ Chart shows other ZSM's 30-day points
- ✅ Summary cards show their performance
- ✅ No data leakage from own profile

**Pass Criteria:** Stats are isolated and accurate

---

## Category 6: Profile Access Points (5 Tests)

### TC-ZP-041: Access Profile from Team Tab
**Priority:** P0 - Critical  
**Preconditions:** Logged in as ZSM

**Steps:**
1. Click Team tab in bottom nav
2. Find SE in team list
3. Click on SE card

**Expected Results:**
- ✅ Profile modal opens instantly
- ✅ Shows correct SE profile
- ✅ No lag or error

**Pass Criteria:** Profile opens from Team tab

---

### TC-ZP-042: Access Profile from Explore Feed
**Priority:** P0 - Critical  
**Preconditions:** Explore tab has posts

**Steps:**
1. Click Explore tab
2. Find any post in feed
3. Click on author's name or avatar

**Expected Results:**
- ✅ Profile modal opens
- ✅ Shows author's profile (SE, ZSM, ZBM, etc.)
- ✅ isOwnProfile flag set correctly
- ✅ Edit controls appear only if own profile

**Pass Criteria:** Profile opens from Explore feed

---

### TC-ZP-043: Access Own Profile from Profile Tab
**Priority:** P0 - Critical  
**Preconditions:** Logged in as ZSM

**Steps:**
1. Click Profile tab in bottom nav
2. Observe modal

**Expected Results:**
- ✅ Own profile opens immediately
- ✅ Edit controls are visible
- ✅ isOwnProfile = true

**Pass Criteria:** Own profile opens from Profile tab

---

### TC-ZP-044: Close Profile Modal
**Priority:** P0 - Critical  
**Preconditions:** Any profile is open

**Steps:**
1. Open any profile
2. Click X button in top-right
3. Observe behavior

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Returns to previous screen (Team/Explore/Home)
- ✅ No error or crash
- ✅ Bottom nav remains functional

**Pass Criteria:** Modal closes properly

---

### TC-ZP-045: Navigate Between Tabs with Profile Open
**Priority:** P2 - Medium  
**Preconditions:** Profile modal is open

**Steps:**
1. Open profile modal from Team tab
2. Keep modal open
3. Click bottom nav to switch tabs
4. Observe behavior

**Expected Results:**
- ✅ Modal closes when switching tabs OR
- ✅ Modal stays open and overlays new tab (acceptable)
- ✅ No crash or error
- ✅ User can still navigate

**Pass Criteria:** Navigation works with modal open

---

## Category 7: Performance & Data (5 Tests)

### TC-ZP-046: Profile Load Time
**Priority:** P1 - High  
**Preconditions:** Normal network conditions

**Steps:**
1. Click to open profile
2. Measure time to full render

**Expected Results:**
- ✅ Modal opens < 500ms
- ✅ All data loads < 2 seconds
- ✅ Loading states show for async data (stats, posts)
- ✅ No blank/broken states

**Pass Criteria:** Profile loads quickly

---

### TC-ZP-047: Data Refresh on Changes
**Priority:** P1 - High  
**Preconditions:** Profile is open

**Steps:**
1. Open own profile
2. Edit bio and save
3. Observe profile without closing
4. Create new post in another tab
5. Close and reopen profile

**Expected Results:**
- ✅ Bio updates immediately after save
- ✅ Post count updates after creating post (on reopen)
- ✅ Points update if submissions approved

**Pass Criteria:** Data stays in sync

---

### TC-ZP-048: Concurrent Profile Views
**Priority:** P2 - Medium  
**Preconditions:** Multiple users logged in

**Steps:**
1. User A: Open User B's profile
2. User B: Edit their own bio
3. User A: Close and reopen User B's profile

**Expected Results:**
- ✅ User A sees updated bio
- ✅ No caching issues
- ✅ Data is current

**Pass Criteria:** Profiles show current data

---

### TC-ZP-049: Handle Missing Data Gracefully
**Priority:** P1 - High  
**Preconditions:** User with minimal data (new account)

**Steps:**
1. Create new ZSM user with:
   - No bio
   - No posts
   - 0 points
   - No banner/avatar
2. Open their profile

**Expected Results:**
- ✅ Profile opens without error
- ✅ Shows default avatar (initial)
- ✅ Shows default banner (gradient)
- ✅ Shows "No bio yet" message
- ✅ All stats show "0" correctly
- ✅ Empty states for tabs

**Pass Criteria:** No crashes with minimal data

---

### TC-ZP-050: Database Query Performance
**Priority:** P2 - Medium  
**Preconditions:** Database has 1000+ users, 10,000+ posts

**Steps:**
1. Open profile
2. Monitor database queries
3. Check query execution time

**Expected Results:**
- ✅ Each tab loads in < 1 second
- ✅ No N+1 query problems
- ✅ Queries are optimized
- ✅ Indexes used properly

**Pass Criteria:** Performance is acceptable at scale

---

## Mobile Responsive Tests (Bonus)

### TC-ZP-M01: Profile Modal on Mobile
**Priority:** P1 - High  
**Device:** iPhone 13 / Android phone

**Steps:**
1. Open profile on mobile device
2. Observe layout

**Expected Results:**
- ✅ Modal is full-screen on mobile
- ✅ All content is readable
- ✅ Tabs are tappable (min 44px touch targets)
- ✅ Scroll works smoothly
- ✅ Banner shows properly

**Pass Criteria:** Mobile layout is usable

---

### TC-ZP-M02: Edit Actions on Mobile
**Priority:** P1 - High  
**Device:** Mobile

**Steps:**
1. Open own profile on mobile
2. Test all edit actions (bio, banner, avatar)

**Expected Results:**
- ✅ Bio editor opens full-screen
- ✅ File picker works (camera roll + camera)
- ✅ Images upload successfully
- ✅ Toasts appear and are readable

**Pass Criteria:** All edit functions work on mobile

---

## Test Summary Template

| Category | Total Tests | Passed | Failed | Blocked | Pass Rate |
|----------|-------------|--------|--------|---------|-----------|
| Own Profile - View | 10 | - | - | - | -% |
| Own Profile - Edit | 10 | - | - | - | -% |
| Own Profile - Tabs | 10 | - | - | - | -% |
| Viewing SE Profiles | 5 | - | - | - | -% |
| Viewing Other ZSMs | 5 | - | - | - | -% |
| Profile Access Points | 5 | - | - | - | -% |
| Performance & Data | 5 | - | - | - | -% |
| **TOTAL** | **50** | **-** | **-** | **-** | **-%** |

---

## Known Limitations (Expected Failures)

These are NOT bugs - features not implemented:

1. **Followers/Following counts always show 0** - Follow system not built
2. **Achievements section missing** - Achievements system doesn't exist
3. **Leaderboard profile click** - TC-ZP-036 may fail if leaderboard integration not added
4. **Post click from grid** - Posts tab grid doesn't open full post modal yet

---

## Defect Reporting Template

**Defect ID:** ZP-DEFECT-XXX  
**Test Case:** TC-ZP-XXX  
**Severity:** Critical / High / Medium / Low  
**Priority:** P0 / P1 / P2

**Description:**
[What went wrong]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- Role: ZSM
- User: zsm_test@airtel.co.ke

**Screenshots:**
[Attach screenshots]

**Database State:**
```sql
-- Relevant queries to check data
SELECT * FROM app_users WHERE id = 'xxx';
```

---

## Test Execution Notes

**Tester:** _______________  
**Date:** _______________  
**Build Version:** _______________  
**Environment:** Dev / Staging / Production

**Setup Checklist:**
- [ ] Database seeded with test data
- [ ] Storage buckets created
- [ ] Test images prepared (< 2MB, > 2MB)
- [ ] Multiple test users created (ZSM, SE, ZBM)
- [ ] Network throttling tools ready (for performance tests)

**Execution Order:**
1. Category 1: Own Profile - View (foundational)
2. Category 2: Own Profile - Edit (core features)
3. Category 3: Own Profile - Tabs (data display)
4. Category 4-5: Other user profiles (permissions)
5. Category 6: Access points (integration)
6. Category 7: Performance (non-functional)

**Notes:**
- Run regression after any bug fixes
- Test on both Chrome and Safari
- Test on at least one mobile device
- Document any edge cases discovered

---

**End of Test Cases**

Total: 50 core test cases + 2 mobile bonus = **52 total tests**
