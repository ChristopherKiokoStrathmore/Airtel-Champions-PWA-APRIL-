# TAI Sales Intelligence Network - UAT Test Plan
## Comprehensive Testing Guide for All User Profiles

**App Version:** v2.0 (Analytics-First Intelligence System)  
**Last Updated:** January 14, 2026  
**Total Tests:** 180 (30 per profile × 6 profiles)

---

## Test Environment Setup

### Prerequisites
- [ ] Test devices with 2G/3G network simulation capability
- [ ] Test accounts for each role with valid credentials
- [ ] Access to Supabase admin panel for data verification
- [ ] Screen recording tool for bug documentation
- [ ] GPS spoofing tool for location testing (if needed)

### Test Data Requirements
- [ ] At least 5 active programs in database
- [ ] At least 10 test submissions per SE
- [ ] At least 3 groups with different configurations
- [ ] Sample users across all zones for Kenya

---

# 1️⃣ SALES EXECUTIVE (SE) - UAT Tests

## Authentication & Profile (Tests 1-5)

### Test SE-001: Login Functionality
**Steps:**
1. Open app on fresh install
2. Enter valid SE credentials (employee ID + password)
3. Tap "Login"

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to SE Dashboard
- ✅ Bottom navigation shows: Home, Explore, Groups, Profile
- ✅ User name and zone displayed in header

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-002: Profile View
**Steps:**
1. Navigate to Profile tab
2. Review all displayed information

**Expected Result:**
- ✅ Full name displayed correctly
- ✅ Employee ID shown
- ✅ Zone displayed
- ✅ Role shown as "Sales Executive"
- ✅ Total points visible
- ✅ Profile image (if uploaded) or default avatar

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-003: Logout Functionality
**Steps:**
1. Go to Profile tab
2. Tap "Logout" button
3. Confirm logout

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ After confirmation, redirected to login screen
- ✅ Previous session cleared
- ✅ Cannot navigate back to dashboard

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-004: Invalid Login Attempt
**Steps:**
1. Enter incorrect employee ID or password
2. Tap "Login"

**Expected Result:**
- ✅ Error message displayed: "Invalid credentials"
- ✅ No navigation occurs
- ✅ User remains on login screen
- ✅ Can retry login

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-005: Session Persistence
**Steps:**
1. Login successfully
2. Close app completely
3. Reopen app after 1 minute

**Expected Result:**
- ✅ User still logged in
- ✅ Dashboard loads without requiring re-login
- ✅ User data loads correctly

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Dashboard & Navigation (Tests 6-10)

### Test SE-006: Dashboard Overview
**Steps:**
1. Login and view Home dashboard
2. Verify all widgets load

**Expected Result:**
- ✅ Points balance card displays correctly
- ✅ Active programs card shows current programs
- ✅ Recent submissions visible
- ✅ Quick stats displayed (submissions this week/month)
- ✅ Hall of Fame teaser visible

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-007: Bottom Navigation
**Steps:**
1. Tap each navigation icon in sequence
2. Verify navigation works

**Expected Result:**
- ✅ Home icon → Dashboard screen
- ✅ Explore icon → Explore Feed screen
- ✅ Groups icon → Groups list screen
- ✅ Profile icon → Profile screen
- ✅ Active tab highlighted in blue
- ✅ No "Programs" tab visible (removed)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-008: Pull-to-Refresh on Dashboard
**Steps:**
1. On Dashboard, pull down from top
2. Release to trigger refresh

**Expected Result:**
- ✅ Refresh animation appears
- ✅ Dashboard data reloads
- ✅ Updated timestamp shown (if available)
- ✅ New submissions/programs appear

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-009: Points Balance Display
**Steps:**
1. View points card on Dashboard
2. Check points calculation

**Expected Result:**
- ✅ Total lifetime points shown
- ✅ Points earned this week/month displayed
- ✅ Points match submission records
- ✅ Tap on card shows points history (if implemented)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-010: Quick Actions Access
**Steps:**
1. Look for quick action buttons on Dashboard
2. Tap "New Submission" or similar CTA

**Expected Result:**
- ✅ Opens program selection screen
- ✅ Shows available programs
- ✅ Easy access to submit intelligence

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Program Submission (Tests 11-18)

### Test SE-011: View Available Programs
**Steps:**
1. Navigate to submission flow
2. View list of active programs

**Expected Result:**
- ✅ All active programs displayed
- ✅ Each program shows: name, icon, points, description
- ✅ Programs sorted by relevance or date
- ✅ Can tap to view program details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-012: Program Details View
**Steps:**
1. Tap on a specific program
2. View full program details

**Expected Result:**
- ✅ Program name and description shown
- ✅ Points value clearly displayed
- ✅ All required fields listed
- ✅ Optional fields indicated
- ✅ "Start Submission" button visible

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-013: GPS Location Auto-Detection
**Steps:**
1. Start a new submission
2. Observe GPS location capture

**Expected Result:**
- ✅ GPS automatically attempts to get location
- ✅ Loading indicator shows "Getting GPS location..."
- ✅ After 3-5 seconds, location captured
- ✅ Latitude/Longitude displayed
- ✅ Accuracy shown (e.g., "±15m")
- ✅ Location pin locked (not draggable)
- ✅ "Re-scan GPS" button visible

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-014: GPS Re-scan Functionality
**Steps:**
1. After initial GPS capture
2. Tap "Re-scan GPS" button

**Expected Result:**
- ✅ Previous location cleared
- ✅ GPS scanning restarts
- ✅ New location captured
- ✅ Coordinates update
- ✅ Can re-scan multiple times

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-015: Photo Upload (Single)
**Steps:**
1. In submission form, tap "Add Photo"
2. Select "Take Photo" or "Choose from Gallery"
3. Select/capture one photo

**Expected Result:**
- ✅ Camera/gallery opens
- ✅ Photo appears as thumbnail
- ✅ Photo can be removed with X button
- ✅ Photo quality acceptable (not over-compressed)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-016: Photo Upload (Multiple)
**Steps:**
1. Add multiple photos (up to limit)
2. Review photo gallery

**Expected Result:**
- ✅ Can add up to 5 photos (or program limit)
- ✅ All photos display as thumbnails
- ✅ Can remove individual photos
- ✅ Can rearrange photos (if implemented)
- ✅ Warning if exceeding limit

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-017: Form Field Validation
**Steps:**
1. Fill out submission form
2. Try submitting with missing required fields

**Expected Result:**
- ✅ Required fields marked with asterisk (*)
- ✅ Error message for empty required fields
- ✅ Form highlights missing fields in red
- ✅ Cannot submit until all required fields filled
- ✅ Optional fields can remain empty

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-018: Successful Submission
**Steps:**
1. Fill all required fields correctly
2. Add GPS location and photo
3. Tap "Submit"

**Expected Result:**
- ✅ Loading indicator shows
- ✅ Success message: "Submission successful!"
- ✅ Points automatically awarded
- ✅ Redirect to Dashboard or submission list
- ✅ New submission appears in "Recent Submissions"
- ✅ Points balance updated

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Explore Feed (Tests 19-23)

### Test SE-019: View Explore Feed
**Steps:**
1. Navigate to Explore tab
2. Scroll through feed

**Expected Result:**
- ✅ Instagram-style post cards displayed
- ✅ Each card shows: photo, user name, zone, mission type, points
- ✅ Timestamp shown (e.g., "2h ago")
- ✅ Cards load smoothly with scroll
- ✅ Infinite scroll or pagination works

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-020: Post Card Details
**Steps:**
1. Tap on a post card
2. View full post details

**Expected Result:**
- ✅ Full-size photo displayed
- ✅ All submission details shown
- ✅ Location/GPS data visible (if permitted)
- ✅ Notes/description readable
- ✅ Mission type and points clear
- ✅ Can close and return to feed

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-021: Feed Filtering
**Steps:**
1. Look for filter options (by zone, mission type, date)
2. Apply a filter

**Expected Result:**
- ✅ Filter dropdown/buttons available
- ✅ Feed updates based on filter
- ✅ Only relevant posts shown
- ✅ Can clear filter to show all
- ✅ Filter persists during session

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-022: Feed Refresh
**Steps:**
1. Pull down to refresh feed
2. Wait for new posts

**Expected Result:**
- ✅ Refresh animation plays
- ✅ New submissions load at top
- ✅ Feed updates in real-time (or near real-time)
- ✅ No duplicate posts

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-023: Empty Feed State
**Steps:**
1. View feed when no submissions exist (use fresh test account)

**Expected Result:**
- ✅ Friendly empty state message
- ✅ "No intelligence yet" or similar message
- ✅ CTA to "Submit your first intelligence"
- ✅ No error messages

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Groups & Messaging (Tests 24-28)

### Test SE-024: View Groups List
**Steps:**
1. Navigate to Groups tab
2. View all groups user is member of

**Expected Result:**
- ✅ All groups displayed (Personal + Official)
- ✅ Each group shows: icon, name, member count, latest message preview
- ✅ Unread count badge if unread messages
- ✅ Timestamp of latest message

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-025: Open Group Chat
**Steps:**
1. Tap on a group
2. View group chat screen

**Expected Result:**
- ✅ Group name in header
- ✅ All messages displayed in chronological order
- ✅ Own messages aligned right (blue bubble)
- ✅ Others' messages aligned left (gray bubble)
- ✅ Sender name and timestamp visible
- ✅ Message input field at bottom

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-026: Send Text Message
**Steps:**
1. In group chat, type a message
2. Tap send button

**Expected Result:**
- ✅ Message appears immediately in chat
- ✅ Message syncs to database
- ✅ Other members can see message (verify with test account)
- ✅ Timestamp accurate
- ✅ Input field clears after send

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-027: Send Photo in Group
**Steps:**
1. Tap photo attachment icon
2. Select/capture photo
3. Send photo message

**Expected Result:**
- ✅ Photo uploads successfully
- ✅ Photo displays in chat as image bubble
- ✅ Can tap photo to view full-size
- ✅ Photo quality maintained

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-028: View Group Info
**Steps:**
1. In group chat, tap group name or menu
2. View "Group Info" screen

**Expected Result:**
- ✅ Group name, icon, description shown
- ✅ Full member list displayed
- ✅ Member roles indicated (Admin/Member)
- ✅ Member count accurate
- ✅ "Leave Group" button visible (if not admin)

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Hall of Fame (Tests 29-30)

### Test SE-029: View Hall of Fame Leaderboard
**Steps:**
1. Navigate to Hall of Fame (from Dashboard or Profile)
2. View leaderboard

**Expected Result:**
- ✅ Top performers listed by points
- ✅ Shows: rank, name, zone, total points
- ✅ Own rank highlighted
- ✅ Can scroll to see all rankings
- ✅ Filter by week/month/all-time available

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test SE-030: Points Accuracy in Leaderboard
**Steps:**
1. Check own points in leaderboard
2. Compare to points in Profile/Dashboard

**Expected Result:**
- ✅ Points match across all screens
- ✅ Rank accurate based on points
- ✅ Updates in real-time after new submission

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# 2️⃣ ZONAL SALES MANAGER (ZSM) - UAT Tests

## Authentication & Profile (Tests 1-5)

### Test ZSM-001: Login as ZSM
**Steps:**
1. Open app
2. Enter ZSM credentials
3. Login

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to ZSM Dashboard
- ✅ Bottom navigation shows: Home, Explore, Groups, Profile
- ✅ Zone management features visible
- ✅ Role shown as "Zonal Sales Manager"

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-002: Profile with Zone Assignment
**Steps:**
1. Navigate to Profile
2. Check zone assignment

**Expected Result:**
- ✅ Assigned zone(s) displayed
- ✅ Number of SEs under management shown
- ✅ Zone statistics visible (optional)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-003: Logout Functionality
**Steps:**
1. Logout from ZSM account
2. Verify session cleared

**Expected Result:**
- ✅ Logout successful
- ✅ Redirected to login screen
- ✅ Cannot access ZSM dashboard without re-login

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-004: Session Timeout
**Steps:**
1. Login and leave app idle for extended period (30+ min)
2. Try to navigate

**Expected Result:**
- ✅ Session remains active or gracefully prompts re-login
- ✅ No data loss on session expiry

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-005: Multiple Device Login
**Steps:**
1. Login on Device A
2. Login with same credentials on Device B

**Expected Result:**
- ✅ Both sessions work simultaneously OR
- ✅ Second login invalidates first (based on security policy)
- ✅ No data corruption

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Dashboard & Analytics (Tests 6-12)

### Test ZSM-006: ZSM Dashboard Overview
**Steps:**
1. View ZSM Dashboard
2. Check all widgets/cards

**Expected Result:**
- ✅ Zone performance summary card
- ✅ Total submissions from zone SEs
- ✅ Total points from zone
- ✅ Top performers in zone
- ✅ Recent activity feed
- ✅ Quick stats (submissions this week/month)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-007: Zone Performance Analytics
**Steps:**
1. Navigate to Analytics section (if separate)
2. View zone-level metrics

**Expected Result:**
- ✅ Charts showing submission trends
- ✅ Points distribution across SEs
- ✅ Mission type breakdown
- ✅ Time-based analytics (daily/weekly/monthly)
- ✅ Can filter by date range

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-008: View All SEs in Zone
**Steps:**
1. Navigate to "My Team" or "Zone SEs" section
2. View list of SEs

**Expected Result:**
- ✅ All SEs in zone listed
- ✅ Each SE shows: name, employee ID, total points
- ✅ Activity status (active/inactive)
- ✅ Can tap to view SE details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-009: View Individual SE Performance
**Steps:**
1. Tap on a specific SE
2. View their detailed performance

**Expected Result:**
- ✅ SE name and profile displayed
- ✅ Total points and rank
- ✅ Submission history
- ✅ Activity trends
- ✅ Can view their submissions

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-010: Submission Review (Read-Only)
**Steps:**
1. Navigate to "All Submissions" or similar
2. View submissions from zone SEs

**Expected Result:**
- ✅ All submissions from zone SEs visible
- ✅ Can filter by SE, mission type, date
- ✅ Can view submission details
- ✅ No approval/rejection actions (auto-approved system)
- ✅ Can see points awarded

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-011: Export/Download Reports
**Steps:**
1. Look for "Export" or "Download Report" option
2. Attempt to download zone performance report

**Expected Result:**
- ✅ Export option available (CSV, PDF, or Excel)
- ✅ Report generates successfully
- ✅ Contains accurate data (submissions, points, SEs)
- ✅ Downloaded file opens correctly

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-012: Dashboard Refresh
**Steps:**
1. Pull to refresh on dashboard
2. Verify data updates

**Expected Result:**
- ✅ Refresh animation appears
- ✅ Latest data loads
- ✅ New submissions appear
- ✅ Stats update correctly

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Explore Feed (Tests 13-16)

### Test ZSM-013: View Zone-Filtered Feed
**Steps:**
1. Navigate to Explore tab
2. View intelligence feed

**Expected Result:**
- ✅ Can see all submissions (or zone-specific filter available)
- ✅ Posts from own zone highlighted or filterable
- ✅ Same Instagram-style cards as SE view
- ✅ Can interact with posts (view details)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-014: Feed Filtering by SE
**Steps:**
1. Apply filter to show specific SE's posts
2. Verify filter works

**Expected Result:**
- ✅ Filter dropdown shows all zone SEs
- ✅ Feed updates to show only selected SE
- ✅ Can clear filter
- ✅ Multiple filters work (SE + mission type)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-015: View Cross-Zone Intelligence
**Steps:**
1. Look for option to view other zones' submissions
2. Apply cross-zone filter (if available)

**Expected Result:**
- ✅ Can view submissions from other zones OR
- ✅ Permission restricted to own zone only (based on policy)
- ✅ Clear indication of which zone's data is shown

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-016: Post Details with Metadata
**Steps:**
1. Tap on a post card
2. View full details

**Expected Result:**
- ✅ All submission details visible
- ✅ SE name and employee ID shown
- ✅ GPS location data visible
- ✅ Timestamp and mission type clear
- ✅ Points awarded displayed

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Groups & Communication (Tests 17-22)

### Test ZSM-017: View All Groups
**Steps:**
1. Navigate to Groups tab
2. View groups

**Expected Result:**
- ✅ Personal groups visible
- ✅ Official groups (e.g., "Zone A ZSM + SEs")
- ✅ Can see all groups ZSM is member of
- ✅ Group types distinguished (Personal/Official)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-018: Create New Group (Personal)
**Steps:**
1. Tap "Create Group" or "+" button
2. Fill group details (name, icon, description)
3. Select type as "Personal"
4. Add members from zone SEs
5. Create group

**Expected Result:**
- ✅ Group creation modal opens
- ✅ Can enter name and description
- ✅ Can select icon emoji
- ✅ Member selection shows all zone SEs
- ✅ Group created successfully
- ✅ ZSM is admin
- ✅ Group appears in Groups list

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-019: Quick Add Zone Group
**Steps:**
1. Tap "Quick Add" option
2. Select "Add All Zone SEs"
3. Confirm creation

**Expected Result:**
- ✅ Quick Add dialog appears
- ✅ Pre-populates with all zone SEs
- ✅ Group name auto-generated (e.g., "Zone A Team")
- ✅ Can edit name before creating
- ✅ Group created with all zone SEs as members
- ✅ ZSM is admin

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-020: Manage Group Members
**Steps:**
1. Open group info screen
2. Add a new member
3. Remove a member (if admin)

**Expected Result:**
- ✅ "Add Member" button visible (if admin)
- ✅ Can select from zone SEs
- ✅ New member added successfully
- ✅ Can remove members (tap X or Remove)
- ✅ Cannot remove self if only admin

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-021: Send Broadcast Message
**Steps:**
1. In official zone group, send a message
2. Verify all SEs receive it

**Expected Result:**
- ✅ Message sent successfully
- ✅ All members can see message
- ✅ Timestamp accurate
- ✅ Can send with photo attachments

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-022: Admin Controls
**Steps:**
1. As group admin, access admin options
2. Try to change group name/description

**Expected Result:**
- ✅ "Edit Group" option available
- ✅ Can update group name, description, icon
- ✅ Changes save and reflect immediately
- ✅ Non-admins cannot edit

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Hall of Fame & Rankings (Tests 23-25)

### Test ZSM-023: View Zone Leaderboard
**Steps:**
1. Navigate to Hall of Fame
2. Apply zone filter (if available)

**Expected Result:**
- ✅ Can filter leaderboard by own zone
- ✅ Shows only zone SEs ranked by points
- ✅ Top 3 highlighted with badges
- ✅ Can toggle between all-zones and own zone

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-024: Zone Ranking Comparison
**Steps:**
1. View leaderboard at zone level
2. Compare zone performance vs other zones

**Expected Result:**
- ✅ Zone-level rankings available
- ✅ Shows total zone points
- ✅ Zone rank displayed (1st, 2nd, etc.)
- ✅ Can see top zones nationwide

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-025: Time-Period Filtering
**Steps:**
1. In Hall of Fame, select "This Week", "This Month", "All Time"
2. Verify rankings update

**Expected Result:**
- ✅ Filter options visible
- ✅ Leaderboard updates based on selected period
- ✅ Rankings accurate for each period
- ✅ Can compare performance trends

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Programs & Submissions (Tests 26-30)

### Test ZSM-026: Submit Own Intelligence
**Steps:**
1. ZSM submits own intelligence (if allowed)
2. Follow standard submission flow

**Expected Result:**
- ✅ ZSM can submit intelligence OR
- ✅ Submission disabled for managers (based on business rules)
- ✅ Clear indication of permission level

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-027: View Submission Trends
**Steps:**
1. Navigate to Analytics
2. View submission trends over time

**Expected Result:**
- ✅ Line/bar chart showing daily/weekly submissions
- ✅ Can filter by mission type
- ✅ Trends accurate based on data
- ✅ Can compare week-over-week or month-over-month

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-028: Mission Type Distribution
**Steps:**
1. View analytics showing mission type breakdown
2. Check which mission types are most popular

**Expected Result:**
- ✅ Pie chart or bar chart showing distribution
- ✅ Shows: Network Experience, Competition Conversion, New Site, AMB
- ✅ Percentages or counts accurate
- ✅ Can drill down into specific mission type

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-029: Inactive SE Identification
**Steps:**
1. View SE list
2. Identify SEs with no recent submissions

**Expected Result:**
- ✅ Can filter/sort by activity
- ✅ Inactive SEs highlighted or flagged
- ✅ Shows last submission date
- ✅ Can export inactive SE list

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZSM-030: GPS Location Verification
**Steps:**
1. View submission details
2. Check GPS location data

**Expected Result:**
- ✅ GPS coordinates displayed
- ✅ Location address shown (if reverse geocoded)
- ✅ Accuracy radius visible
- ✅ Can view on map (if map integration exists)
- ✅ Timestamp of GPS capture shown

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# 3️⃣ ZONAL BUSINESS MANAGER (ZBM) - UAT Tests

## Authentication & Profile (Tests 1-4)

### Test ZBM-001: Login as ZBM
**Steps:**
1. Open app
2. Enter ZBM credentials
3. Login

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to ZBM Dashboard
- ✅ Role shown as "Zonal Business Manager"
- ✅ Zone assignment visible
- ✅ Bottom navigation appropriate for role

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-002: Profile Information
**Steps:**
1. Navigate to Profile
2. Review displayed information

**Expected Result:**
- ✅ Full name and employee ID
- ✅ Role: Zonal Business Manager
- ✅ Zone(s) assigned
- ✅ Number of ZSMs and SEs under oversight shown (if applicable)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-003: Logout Functionality
**Steps:**
1. Logout from account
2. Verify session cleared

**Expected Result:**
- ✅ Logout successful
- ✅ Cannot access dashboard without re-login

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-004: Session Persistence
**Steps:**
1. Login, then close app
2. Reopen after 5 minutes

**Expected Result:**
- ✅ Still logged in
- ✅ Dashboard loads correctly

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Dashboard & Multi-Zone Analytics (Tests 5-12)

### Test ZBM-005: Multi-Zone Dashboard Overview
**Steps:**
1. View ZBM Dashboard
2. Check if multiple zones displayed

**Expected Result:**
- ✅ All assigned zones shown
- ✅ Summary stats for each zone
- ✅ Total submissions across all zones
- ✅ Total points across zones
- ✅ Can toggle between zones or view combined

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-006: Zone Comparison View
**Steps:**
1. Navigate to Zone Comparison analytics
2. Compare performance across zones

**Expected Result:**
- ✅ Side-by-side zone comparison
- ✅ Shows submissions, points, active SEs per zone
- ✅ Visual charts (bar/line graphs)
- ✅ Can identify top-performing and underperforming zones

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-007: View All ZSMs Under Management
**Steps:**
1. Navigate to "My ZSMs" or Team section
2. View list of ZSMs

**Expected Result:**
- ✅ All ZSMs in assigned zones listed
- ✅ Each ZSM shows: name, zone, number of SEs, performance stats
- ✅ Can tap to view ZSM details
- ✅ Can filter by zone

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-008: View All SEs Across Zones
**Steps:**
1. Navigate to "All SEs" view
2. Browse SE list

**Expected Result:**
- ✅ All SEs from all assigned zones visible
- ✅ Can filter by zone
- ✅ Shows SE name, zone, ZSM, points, activity
- ✅ Can search by name or employee ID

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-009: Performance Trends Over Time
**Steps:**
1. View analytics dashboard
2. Check time-based trends

**Expected Result:**
- ✅ Charts showing weekly/monthly trends
- ✅ Can compare current vs previous period
- ✅ Growth or decline indicators
- ✅ Can drill down by zone or mission type

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-010: Mission Type Analytics
**Steps:**
1. View mission type breakdown across zones
2. Analyze distribution

**Expected Result:**
- ✅ Shows which mission types most popular
- ✅ Breakdown by zone available
- ✅ Visual representation (pie/bar chart)
- ✅ Can identify gaps (underutilized mission types)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-011: Export Multi-Zone Report
**Steps:**
1. Look for "Export Report" option
2. Generate and download report

**Expected Result:**
- ✅ Export option available
- ✅ Report includes all zones
- ✅ Contains submissions, points, SEs, ZSMs
- ✅ Format: CSV, Excel, or PDF
- ✅ Report accurate and complete

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-012: Real-Time Dashboard Updates
**Steps:**
1. Keep dashboard open
2. Have test SE submit intelligence
3. Refresh dashboard

**Expected Result:**
- ✅ New submission appears after refresh
- ✅ Stats update accordingly
- ✅ Points totals increase
- ✅ Charts update with new data

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Explore Feed (Tests 13-16)

### Test ZBM-013: View All-Zones Feed
**Steps:**
1. Navigate to Explore tab
2. View intelligence feed

**Expected Result:**
- ✅ Posts from all assigned zones visible
- ✅ Can filter by specific zone
- ✅ Zone name/tag shown on each post
- ✅ Infinite scroll works

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-014: Feed Filtering Options
**Steps:**
1. Apply filters (zone, mission type, date)
2. Verify filter combinations work

**Expected Result:**
- ✅ Can filter by multiple criteria simultaneously
- ✅ Filter results accurate
- ✅ Can clear filters
- ✅ Filter state persists during session

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-015: Search Functionality
**Steps:**
1. Use search bar (if available)
2. Search by SE name, location, or keyword

**Expected Result:**
- ✅ Search returns relevant results
- ✅ Can search across all zones
- ✅ Results highlight matching terms
- ✅ Empty state if no results

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-016: Post Details and Insights
**Steps:**
1. Tap on a high-value post
2. View full details

**Expected Result:**
- ✅ All submission metadata visible
- ✅ Can see SE details (name, zone, ZSM)
- ✅ GPS location and photos clear
- ✅ Points awarded shown
- ✅ Can share or export post (if feature exists)

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Groups & Communication (Tests 17-22)

### Test ZBM-017: View All Groups
**Steps:**
1. Navigate to Groups tab
2. View groups

**Expected Result:**
- ✅ Personal groups visible
- ✅ Official groups (multi-zone groups)
- ✅ Can see member counts
- ✅ Groups organized by type or zone

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-018: Create Cross-Zone Group
**Steps:**
1. Create new group
2. Add members from multiple zones

**Expected Result:**
- ✅ Can select SEs and ZSMs from all assigned zones
- ✅ Group creation successful
- ✅ ZBM is admin
- ✅ All selected members added

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-019: Quick Add Multiple Zones
**Steps:**
1. Use "Quick Add" feature
2. Select "Add All Zones" option (if available)

**Expected Result:**
- ✅ Option to add all ZSMs OR all SEs from all zones
- ✅ Large group created successfully
- ✅ Member count accurate
- ✅ Performance acceptable even with many members

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-020: Send Zone-Wide Announcement
**Steps:**
1. In official group, compose important announcement
2. Send message

**Expected Result:**
- ✅ Message sent to all members
- ✅ Can pin message (if feature exists)
- ✅ Message delivery confirmed
- ✅ Members receive notification

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-021: Group Admin Controls
**Steps:**
1. Access group settings
2. Perform admin actions (edit group, remove members)

**Expected Result:**
- ✅ Can edit group name/description/icon
- ✅ Can add/remove members
- ✅ Can promote members to admin (if feature exists)
- ✅ Can delete group (with confirmation)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-022: View Group Message History
**Steps:**
1. Open a group with long message history
2. Scroll up to older messages

**Expected Result:**
- ✅ Can scroll to load older messages
- ✅ Pagination/infinite scroll works
- ✅ All messages load correctly
- ✅ Performance acceptable

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Hall of Fame & Rankings (Tests 23-26)

### Test ZBM-023: Multi-Zone Leaderboard
**Steps:**
1. Navigate to Hall of Fame
2. View leaderboard across all zones

**Expected Result:**
- ✅ Top SEs from all zones ranked
- ✅ Zone name shown for each SE
- ✅ Can filter by specific zone
- ✅ Can toggle between SE and Zone rankings

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-024: Zone Leaderboard View
**Steps:**
1. Switch to "Zone Rankings"
2. View zones ranked by total points

**Expected Result:**
- ✅ All assigned zones ranked
- ✅ Shows total submissions and points per zone
- ✅ Average points per SE shown
- ✅ Top 3 zones highlighted

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-025: Time-Period Comparison
**Steps:**
1. View leaderboard for "This Month"
2. Switch to "Last Month"
3. Compare results

**Expected Result:**
- ✅ Can toggle between time periods
- ✅ Rankings update correctly
- ✅ Can identify movers (rising/falling performers)
- ✅ Historical data accurate

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-026: Export Leaderboard Data
**Steps:**
1. On Hall of Fame screen, look for export option
2. Export leaderboard

**Expected Result:**
- ✅ Export option available
- ✅ Exported file contains rankings, names, zones, points
- ✅ Format: CSV or Excel
- ✅ Data accurate

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Advanced Analytics & Reporting (Tests 27-30)

### Test ZBM-027: Geographic Heat Map
**Steps:**
1. Navigate to analytics with map view (if available)
2. View submission density by location

**Expected Result:**
- ✅ Map displays with submission markers OR
- ✅ Heat map shows high-activity areas
- ✅ Can zoom and pan map
- ✅ Can filter by zone or mission type
- ✅ Clicking marker shows submission details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-028: Activity Patterns Analysis
**Steps:**
1. View analytics showing submission times
2. Identify peak activity hours/days

**Expected Result:**
- ✅ Chart shows submissions by hour of day
- ✅ Chart shows submissions by day of week
- ✅ Can identify patterns (e.g., most submissions on Mondays)
- ✅ Can filter by zone

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-029: Quality Metrics
**Steps:**
1. View submission quality indicators
2. Check GPS accuracy, photo quality flags

**Expected Result:**
- ✅ Can see average GPS accuracy per zone/SE
- ✅ Flagged submissions highlighted (if auto-flagging exists)
- ✅ Photo upload rate shown
- ✅ Can drill down into quality issues

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test ZBM-030: Custom Date Range Reporting
**Steps:**
1. Select "Custom Date Range"
2. Choose specific start and end dates
3. Generate report

**Expected Result:**
- ✅ Date picker appears
- ✅ Can select any date range
- ✅ Report generates for selected period
- ✅ Data accurate for custom range
- ✅ Can export custom report

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# 4️⃣ HQ (Headquarters) - UAT Tests

## Authentication & Profile (Tests 1-4)

### Test HQ-001: Login as HQ User
**Steps:**
1. Open app
2. Enter HQ credentials
3. Login

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to HQ Dashboard
- ✅ Role shown as "HQ" or "Headquarters"
- ✅ Full nationwide access indicated

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-002: Profile Access Level
**Steps:**
1. Navigate to Profile
2. Check permissions and access level

**Expected Result:**
- ✅ Profile shows HQ role
- ✅ Access level: National/All Zones
- ✅ No zone restrictions
- ✅ Admin privileges visible (if applicable)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-003: Logout Functionality
**Steps:**
1. Logout from HQ account

**Expected Result:**
- ✅ Logout successful
- ✅ Session cleared

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-004: Session Security
**Steps:**
1. Login and check security features

**Expected Result:**
- ✅ Session timeout appropriate for HQ role
- ✅ Secure authentication
- ✅ No unauthorized access possible

**Pass/Fail:** ____  
**Notes:** ____________________

---

## National Dashboard (Tests 5-12)

### Test HQ-005: National Dashboard Overview
**Steps:**
1. View HQ Dashboard
2. Check nationwide metrics

**Expected Result:**
- ✅ Total submissions nationwide displayed
- ✅ Total points across all zones
- ✅ Total active SEs and managers
- ✅ National performance trends
- ✅ Top zones highlighted
- ✅ Recent activity feed

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-006: All Zones Overview
**Steps:**
1. Navigate to Zones view
2. See all Kenya zones listed

**Expected Result:**
- ✅ All zones displayed (e.g., Nairobi, Coast, Western, etc.)
- ✅ Each zone shows: name, ZBM, ZSMs, SEs, total points
- ✅ Can tap to drill down into zone details
- ✅ Zones sortable by performance

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-007: National Performance Trends
**Steps:**
1. View analytics dashboard
2. Check trends over time (weekly/monthly/quarterly)

**Expected Result:**
- ✅ Line charts showing submission trends
- ✅ Points accumulation over time
- ✅ Growth rate calculations
- ✅ Can compare periods (e.g., Q1 vs Q2)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-008: Mission Type Distribution Nationwide
**Steps:**
1. View mission type analytics
2. See breakdown across all zones

**Expected Result:**
- ✅ Pie/bar chart showing mission type distribution
- ✅ Network Experience, Competition Conversion, New Site, AMB percentages
- ✅ Can drill down by zone
- ✅ Identify underutilized mission types

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-009: View All Users (SEs, ZSMs, ZBMs)
**Steps:**
1. Navigate to "All Users" or Team Directory
2. Browse user list

**Expected Result:**
- ✅ All 662+ users listed
- ✅ Can filter by role (SE, ZSM, ZBM)
- ✅ Can filter by zone
- ✅ Search by name or employee ID
- ✅ Shows: name, role, zone, points, activity status

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-010: Individual User Lookup
**Steps:**
1. Search for specific SE or manager
2. View their profile and performance

**Expected Result:**
- ✅ Search finds user quickly
- ✅ Can view full user profile
- ✅ Submission history visible
- ✅ Points breakdown shown
- ✅ Activity timeline displayed

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-011: Zone Comparison Analytics
**Steps:**
1. View zone comparison dashboard
2. Compare all zones side-by-side

**Expected Result:**
- ✅ All zones listed with key metrics
- ✅ Can sort by submissions, points, active SEs
- ✅ Visual indicators for top/bottom performers
- ✅ Export comparison report option

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-012: Real-Time Activity Monitor
**Steps:**
1. View live activity feed or dashboard
2. Watch for new submissions

**Expected Result:**
- ✅ Recent submissions appear in real-time or near real-time
- ✅ Shows: SE name, zone, mission type, points, time
- ✅ Auto-refreshes or has manual refresh
- ✅ Can filter feed by zone or mission type

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Explore Feed (Tests 13-17)

### Test HQ-013: Nationwide Explore Feed
**Steps:**
1. Navigate to Explore tab
2. View all intelligence nationwide

**Expected Result:**
- ✅ Posts from all zones visible
- ✅ Zone tags/labels on each post
- ✅ Infinite scroll works with large dataset
- ✅ Performance acceptable

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-014: Advanced Feed Filtering
**Steps:**
1. Apply multiple filters (zone + mission type + date)
2. Verify results

**Expected Result:**
- ✅ Can combine multiple filters
- ✅ Results update correctly
- ✅ Can save filter presets (if feature exists)
- ✅ Clear filters option works

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-015: Search Across All Submissions
**Steps:**
1. Use search functionality
2. Search by keyword, location, or SE name

**Expected Result:**
- ✅ Search works across all 662+ SEs' submissions
- ✅ Results relevant and accurate
- ✅ Search performance acceptable
- ✅ Can refine search with filters

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-016: High-Value Intelligence Flagging
**Steps:**
1. Look for "Featured" or "High Value" submissions
2. Review flagged posts

**Expected Result:**
- ✅ Important submissions highlighted OR
- ✅ Can manually flag/star submissions
- ✅ Flagged posts easily accessible
- ✅ Can share flagged intelligence with team

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-017: Export Intelligence Report
**Steps:**
1. Select multiple submissions or date range
2. Export to report

**Expected Result:**
- ✅ Can select multiple posts
- ✅ Export generates PDF or CSV
- ✅ Report includes photos, GPS, notes
- ✅ Formatted professionally for stakeholders

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Groups & Communication (Tests 18-22)

### Test HQ-018: View All Groups Nationwide
**Steps:**
1. Navigate to Groups tab
2. View all groups (if HQ has visibility)

**Expected Result:**
- ✅ Can see all groups OR only groups HQ is member of
- ✅ Groups organized by type/zone
- ✅ Can search for specific group

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-019: Create National Group
**Steps:**
1. Create new group
2. Add members from multiple zones (ZBMs, ZSMs)

**Expected Result:**
- ✅ Can select users from all zones
- ✅ Large group creation successful
- ✅ HQ user is admin
- ✅ All members added correctly

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-020: Broadcast to All Zones
**Steps:**
1. Send message in national group
2. Verify delivery

**Expected Result:**
- ✅ Message sent to all members
- ✅ Can attach photos/files
- ✅ Delivery confirmed
- ✅ Members receive notifications

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-021: Group Management
**Steps:**
1. Edit group settings
2. Add/remove members

**Expected Result:**
- ✅ Can edit group details
- ✅ Can add members from any zone
- ✅ Can remove members
- ✅ Changes sync immediately

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-022: Group Analytics (if available)
**Steps:**
1. View group activity metrics
2. Check engagement levels

**Expected Result:**
- ✅ Can see message counts per group
- ✅ Active members shown
- ✅ Message frequency trends
- ✅ Can identify inactive groups

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Hall of Fame & National Rankings (Tests 23-27)

### Test HQ-023: National Leaderboard
**Steps:**
1. Navigate to Hall of Fame
2. View nationwide SE rankings

**Expected Result:**
- ✅ Top 100 (or all) SEs ranked by points
- ✅ Shows: rank, name, zone, points
- ✅ Can filter by zone
- ✅ Can toggle time periods

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-024: Zone Rankings
**Steps:**
1. Switch to "Zone Rankings" view
2. See zones ranked by performance

**Expected Result:**
- ✅ All zones ranked by total points
- ✅ Shows: zone name, ZBM, total points, total submissions
- ✅ Top 3 zones highlighted
- ✅ Can drill down into zone details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-025: ZSM/ZBM Rankings
**Steps:**
1. View manager leaderboard
2. See ZSMs and ZBMs ranked by team performance

**Expected Result:**
- ✅ Managers ranked by their team's total points OR by their zone's performance
- ✅ Shows: manager name, role, zone, team points
- ✅ Can filter by role (ZSM vs ZBM)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-026: Historical Leaderboard
**Steps:**
1. View leaderboard for previous months/quarters
2. Compare historical performance

**Expected Result:**
- ✅ Can select past time periods
- ✅ Historical rankings displayed
- ✅ Can compare month-over-month or quarter-over-quarter
- ✅ Data accurate for past periods

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-027: Export Leaderboard
**Steps:**
1. Export national leaderboard to file

**Expected Result:**
- ✅ Export option available
- ✅ File includes all rankings and metrics
- ✅ Format: CSV, Excel, or PDF
- ✅ Suitable for executive presentations

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Advanced Reporting & Admin (Tests 28-30)

### Test HQ-028: Custom Dashboard Builder
**Steps:**
1. Access dashboard customization (if available)
2. Add/remove widgets

**Expected Result:**
- ✅ Can customize dashboard layout
- ✅ Can add specific metrics/charts
- ✅ Changes save and persist
- ✅ Dashboard resets to default option available

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-029: Executive Summary Report
**Steps:**
1. Generate executive summary (weekly/monthly)
2. Review report content

**Expected Result:**
- ✅ Report includes key metrics (submissions, points, top performers)
- ✅ Visual charts and graphs
- ✅ Format suitable for leadership review
- ✅ Can schedule automated reports (if feature exists)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test HQ-030: Data Export for Analysis
**Steps:**
1. Export raw data (all submissions)
2. Download for external analysis (e.g., Excel, BI tools)

**Expected Result:**
- ✅ Can export all submission data
- ✅ Includes all fields: SE, zone, mission type, GPS, photos, points, timestamps
- ✅ Format: CSV or Excel
- ✅ File size manageable (or paginated for large datasets)
- ✅ Data complete and accurate

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# 5️⃣ DIRECTOR - UAT Tests

## Authentication & Profile (Tests 1-4)

### Test DIR-001: Login as Director
**Steps:**
1. Open app
2. Enter Director credentials
3. Login

**Expected Result:**
- ✅ Login successful
- ✅ Redirect to Director Dashboard
- ✅ Role shown as "Director"
- ✅ Full executive access indicated

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-002: Profile and Permissions
**Steps:**
1. Navigate to Profile
2. Review access level

**Expected Result:**
- ✅ Profile shows Director role
- ✅ Access level: National/Executive
- ✅ All permissions enabled
- ✅ Can view all zones and users

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-003: Logout Functionality
**Steps:**
1. Logout from Director account

**Expected Result:**
- ✅ Logout successful
- ✅ Session cleared securely

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-004: Multi-Device Access
**Steps:**
1. Login on desktop browser (admin dashboard)
2. Login on mobile device simultaneously

**Expected Result:**
- ✅ Both sessions work OR
- ✅ One session invalidates the other (based on security policy)
- ✅ No data inconsistencies

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Executive Dashboard (Tests 5-12)

### Test DIR-005: Executive Dashboard Overview
**Steps:**
1. View Director Dashboard
2. Check high-level metrics

**Expected Result:**
- ✅ Total submissions nationwide
- ✅ Total points awarded
- ✅ Total active SEs (out of 662)
- ✅ National growth trends (week/month/quarter)
- ✅ Top performing zones
- ✅ Top performing SEs
- ✅ Mission type distribution
- ✅ Key insights or alerts highlighted

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-006: Strategic KPIs
**Steps:**
1. View key performance indicators
2. Check against business goals

**Expected Result:**
- ✅ Submission rate (submissions per SE per week)
- ✅ Engagement rate (active SEs / total SEs)
- ✅ Quality metrics (GPS accuracy, photo upload rate)
- ✅ Intelligence categories breakdown
- ✅ Trends vs targets (if targets set)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-007: National Trends Analysis
**Steps:**
1. View long-term trend charts (3-6 months)
2. Analyze growth patterns

**Expected Result:**
- ✅ Charts show monthly/quarterly trends
- ✅ Submission volume over time
- ✅ Points distribution trends
- ✅ User engagement trends
- ✅ Can identify seasonal patterns

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-008: Zone Performance Scorecard
**Steps:**
1. View all zones ranked by performance
2. Check scorecards

**Expected Result:**
- ✅ Each zone has performance score
- ✅ Shows: submissions, points, active SEs, engagement rate
- ✅ Color-coded (green/yellow/red) for performance levels
- ✅ Can drill down into underperforming zones

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-009: Competitive Intelligence Summary
**Steps:**
1. View intelligence categorized by competitor
2. Check insights

**Expected Result:**
- ✅ Can filter submissions by competitor mentioned (Safaricom, etc.)
- ✅ Geographic distribution of competitive intel
- ✅ Trends in competitive activity
- ✅ Actionable insights highlighted

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-010: Manager Performance Review
**Steps:**
1. View all ZBMs and ZSMs
2. Check their team performance

**Expected Result:**
- ✅ Managers listed with team performance metrics
- ✅ Shows: manager name, zone, team size, team points, engagement
- ✅ Can identify high-performing vs low-performing managers
- ✅ Can drill down into manager details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-011: Real-Time Activity Monitor
**Steps:**
1. View live activity dashboard
2. Watch for new submissions

**Expected Result:**
- ✅ Live feed of recent submissions
- ✅ Updates in real-time or near real-time
- ✅ Shows: SE, zone, mission type, time
- ✅ Can filter by zone or type

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-012: Dashboard Customization
**Steps:**
1. Customize dashboard widgets
2. Arrange metrics by preference

**Expected Result:**
- ✅ Can add/remove widgets
- ✅ Can rearrange dashboard layout
- ✅ Custom view saves
- ✅ Can reset to default

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Explore Feed & Intelligence (Tests 13-17)

### Test DIR-013: Strategic Intelligence Feed
**Steps:**
1. Navigate to Explore tab
2. View high-value intelligence

**Expected Result:**
- ✅ Can filter for high-value submissions
- ✅ Featured or starred intelligence visible
- ✅ Can view all submissions nationwide
- ✅ Performance acceptable with large dataset

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-014: Intelligence Search
**Steps:**
1. Search for specific keywords or locations
2. Find relevant intelligence

**Expected Result:**
- ✅ Search works across all submissions
- ✅ Can search by competitor name, location, keyword
- ✅ Results accurate and comprehensive
- ✅ Can save search queries

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-015: Geographic Intelligence Mapping
**Steps:**
1. View submissions on map (if map view available)
2. Identify hotspots

**Expected Result:**
- ✅ Map shows submission locations
- ✅ Heat map or clustering for dense areas
- ✅ Can filter by mission type or zone
- ✅ Can click markers for details

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-016: Intelligence Categorization
**Steps:**
1. View submissions grouped by category
2. Check category accuracy

**Expected Result:**
- ✅ Submissions organized by mission type
- ✅ Can view by: Network, Conversion, New Site, AMB
- ✅ Category counts accurate
- ✅ Can drill down into category

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-017: Export Strategic Report
**Steps:**
1. Select key intelligence submissions
2. Export to executive report

**Expected Result:**
- ✅ Can select multiple submissions
- ✅ Export generates professional report (PDF)
- ✅ Includes photos, locations, insights
- ✅ Formatted for executive stakeholders

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Groups & Communication (Tests 18-20)

### Test DIR-018: View All Groups
**Steps:**
1. Navigate to Groups tab
2. View groups (if Director has access)

**Expected Result:**
- ✅ Can see relevant groups
- ✅ Likely member of executive/leadership groups
- ✅ Can create new groups

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-019: Create Executive Group
**Steps:**
1. Create group for Directors/HQ/ZBMs
2. Add members

**Expected Result:**
- ✅ Can select leadership members
- ✅ Group created successfully
- ✅ Director is admin
- ✅ Can send messages

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-020: Broadcast to Leadership
**Steps:**
1. Send message in executive group
2. Verify delivery

**Expected Result:**
- ✅ Message sent successfully
- ✅ All members receive notification
- ✅ Can attach documents/files

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Hall of Fame & Recognition (Tests 21-25)

### Test DIR-021: National Leaderboard Review
**Steps:**
1. Navigate to Hall of Fame
2. Review top performers

**Expected Result:**
- ✅ Top SEs nationwide displayed
- ✅ Shows rank, name, zone, points
- ✅ Can view different time periods
- ✅ Can export leaderboard

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-022: Zone Championship Standings
**Steps:**
1. View zone rankings
2. Check zone competition

**Expected Result:**
- ✅ Zones ranked by total points
- ✅ Shows zone name, ZBM, total points
- ✅ Top zones highlighted
- ✅ Can view trends over time

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-023: Recognition and Awards
**Steps:**
1. Review top performers for recognition
2. Access award details (if feature exists)

**Expected Result:**
- ✅ Top performers clearly identified
- ✅ Can export list for awards/recognition
- ✅ Performance milestones shown (e.g., "1000 points club")

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-024: Historical Performance Review
**Steps:**
1. View leaderboard for past quarters
2. Track performance over time

**Expected Result:**
- ✅ Can select past periods (Q1, Q2, etc.)
- ✅ Historical data accurate
- ✅ Can identify consistent top performers
- ✅ Can spot rising stars

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-025: Manager Leaderboard
**Steps:**
1. View ZSM and ZBM rankings
2. Check manager effectiveness

**Expected Result:**
- ✅ Managers ranked by team performance
- ✅ Shows manager, zone, team points, team size
- ✅ Can identify top-performing managers

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Advanced Analytics & Reporting (Tests 26-30)

### Test DIR-026: Executive Summary Reports
**Steps:**
1. Generate monthly executive summary
2. Review content and format

**Expected Result:**
- ✅ Comprehensive summary of key metrics
- ✅ Visual charts and graphs
- ✅ Highlights and insights
- ✅ Format suitable for board presentation
- ✅ Can download as PDF

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-027: Custom Analytics Builder
**Steps:**
1. Create custom report with specific metrics
2. Save and export

**Expected Result:**
- ✅ Can select specific metrics and dimensions
- ✅ Can choose date ranges
- ✅ Report generates correctly
- ✅ Can save report template
- ✅ Can schedule automated reports

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-028: Predictive Analytics (if available)
**Steps:**
1. View projected trends
2. Check forecasts

**Expected Result:**
- ✅ System shows projected submission rates
- ✅ Growth forecasts based on trends
- ✅ Can identify zones needing attention
- ✅ Actionable recommendations provided

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-029: Benchmark Comparisons
**Steps:**
1. Compare actual performance vs targets/benchmarks
2. Review variance analysis

**Expected Result:**
- ✅ Can set targets (if feature exists)
- ✅ Actual vs target comparisons shown
- ✅ Variance highlighted (above/below target)
- ✅ Can drill down into underperformers

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DIR-030: Data Export for BI Tools
**Steps:**
1. Export full dataset
2. Import into external BI tool (e.g., Power BI, Tableau)

**Expected Result:**
- ✅ Can export comprehensive data
- ✅ Includes all dimensions (SE, zone, time, mission type, GPS, etc.)
- ✅ Format: CSV or database export
- ✅ Data structure suitable for BI analysis
- ✅ No sensitive data exposed inappropriately

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# 6️⃣ DEVELOPER - UAT Tests

## Authentication & System Access (Tests 1-5)

### Test DEV-001: Admin Panel Login
**Steps:**
1. Access admin/developer dashboard URL
2. Login with developer credentials

**Expected Result:**
- ✅ Login successful
- ✅ Access to React admin dashboard
- ✅ Role shown as "Developer" or "Admin"
- ✅ Full system access available

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-002: Supabase Admin Access
**Steps:**
1. Login to Supabase dashboard
2. Verify database access

**Expected Result:**
- ✅ Can access Supabase project
- ✅ Can view all tables
- ✅ Can run SQL queries
- ✅ Can view API logs

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-003: Multi-Role Testing
**Steps:**
1. Create test accounts for all roles
2. Verify role-based access control

**Expected Result:**
- ✅ Can create SE, ZSM, ZBM, HQ, Director test accounts
- ✅ Each role has appropriate permissions
- ✅ No unauthorized cross-role access

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-004: API Authentication
**Steps:**
1. Test API endpoints with valid and invalid tokens
2. Verify authentication

**Expected Result:**
- ✅ Valid tokens allow API access
- ✅ Invalid tokens rejected with 401 error
- ✅ Token expiration works correctly
- ✅ No security vulnerabilities

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-005: Environment Configuration
**Steps:**
1. Check environment variables
2. Verify all secrets configured

**Expected Result:**
- ✅ SUPABASE_URL set correctly
- ✅ SUPABASE_ANON_KEY configured
- ✅ SUPABASE_SERVICE_ROLE_KEY secured
- ✅ No secrets exposed in client code

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Database & Backend (Tests 6-15)

### Test DEV-006: Database Schema Validation
**Steps:**
1. Review all database tables
2. Verify schema matches design

**Expected Result:**
- ✅ Tables: users, submissions, programs, groups, group_members, group_messages, mission_types
- ✅ All columns present and correct data types
- ✅ Foreign keys and relationships correct
- ✅ Indexes created for performance

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-007: Sample Data Verification
**Steps:**
1. Query each table
2. Verify seed data exists

**Expected Result:**
- ✅ At least 5 test SEs in users table
- ✅ Test programs in programs table
- ✅ Mission types seeded (Network, Conversion, New Site, AMB)
- ✅ Test submissions exist

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-008: API Endpoints Testing
**Steps:**
1. Test all 24+ backend API endpoints
2. Verify responses

**Expected Result:**
- ✅ GET /submissions - returns submissions list
- ✅ POST /submissions - creates new submission
- ✅ GET /programs - returns programs
- ✅ GET /leaderboard - returns rankings
- ✅ GET /analytics - returns metrics
- ✅ All endpoints return correct status codes
- ✅ Error handling works (400, 404, 500)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-009: Database Performance
**Steps:**
1. Query large datasets (all submissions)
2. Check query execution times

**Expected Result:**
- ✅ Queries complete in < 2 seconds
- ✅ Indexes used efficiently
- ✅ No N+1 query issues
- ✅ Pagination works for large results

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-010: Data Integrity Checks
**Steps:**
1. Verify referential integrity
2. Check constraints

**Expected Result:**
- ✅ Foreign keys enforce relationships
- ✅ Cannot delete referenced records
- ✅ Cascading deletes work where appropriate
- ✅ Unique constraints enforced

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-011: GPS Data Storage
**Steps:**
1. Check submissions table GPS columns
2. Verify GPS data format

**Expected Result:**
- ✅ GPS location stored as JSONB (or lat/lng decimals)
- ✅ Coordinates accurate (Kenya bounds: -5° to 5°N, 34° to 42°E)
- ✅ Accuracy radius stored
- ✅ Timestamp of GPS capture stored

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-012: Photo Storage (Supabase Storage)
**Steps:**
1. Upload test photo via API
2. Verify storage

**Expected Result:**
- ✅ Photo uploads to Supabase Storage bucket
- ✅ Signed URL generated
- ✅ Photo accessible via URL
- ✅ Storage quota not exceeded

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-013: Points Calculation Logic
**Steps:**
1. Submit intelligence
2. Verify points auto-awarded

**Expected Result:**
- ✅ Correct points awarded based on mission type
- ✅ Points stored in submissions table
- ✅ User's total points updated
- ✅ Leaderboard reflects new points

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-014: Group Messaging Real-Time Sync
**Steps:**
1. Send message from SE account
2. Check if message appears for other group members

**Expected Result:**
- ✅ Message inserted into group_messages table
- ✅ Message visible to all group members
- ✅ Timestamp accurate
- ✅ Real-time sync works (or polling interval acceptable)

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-015: Database Backup & Recovery
**Steps:**
1. Verify Supabase automated backups enabled
2. Test point-in-time recovery (if available)

**Expected Result:**
- ✅ Daily backups configured
- ✅ Can restore from backup
- ✅ Backup retention policy set
- ✅ No data loss on recovery

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Frontend (React Admin Dashboard) (Tests 16-22)

### Test DEV-016: Admin Dashboard Load
**Steps:**
1. Open React admin dashboard in browser
2. Check load time

**Expected Result:**
- ✅ Dashboard loads in < 3 seconds
- ✅ All components render correctly
- ✅ No console errors
- ✅ Responsive design works

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-017: Data Tables Rendering
**Steps:**
1. View tables (users, submissions, programs)
2. Check data display

**Expected Result:**
- ✅ Tables render with data
- ✅ Sorting works
- ✅ Filtering works
- ✅ Pagination works
- ✅ Performance acceptable with large datasets

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-018: Charts and Visualizations
**Steps:**
1. View analytics charts
2. Verify data accuracy

**Expected Result:**
- ✅ Charts render (line, bar, pie)
- ✅ Data matches database queries
- ✅ Interactive tooltips work
- ✅ No rendering glitches

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-019: Form Validation
**Steps:**
1. Test program creation form
2. Submit with invalid data

**Expected Result:**
- ✅ Required fields validated
- ✅ Error messages displayed
- ✅ Cannot submit invalid data
- ✅ Validation messages clear

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-020: CRUD Operations
**Steps:**
1. Create, Read, Update, Delete a program
2. Verify in database

**Expected Result:**
- ✅ Create: new program inserted
- ✅ Read: program details displayed
- ✅ Update: changes saved
- ✅ Delete: program removed (or soft-deleted)
- ✅ Database reflects changes

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-021: User Management
**Steps:**
1. Create new user via admin dashboard
2. Edit user details
3. Deactivate user

**Expected Result:**
- ✅ Can create SE, ZSM, ZBM users
- ✅ Required fields enforced (employee_id, name, zone, role)
- ✅ Can update user details
- ✅ Can deactivate/activate users
- ✅ Changes sync to database

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-022: Export Functionality
**Steps:**
1. Export data from admin dashboard
2. Verify export file

**Expected Result:**
- ✅ Can export users, submissions, analytics
- ✅ Format: CSV or Excel
- ✅ Data complete and accurate
- ✅ File downloads successfully

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Mobile App (Flutter) Testing (Tests 23-27)

### Test DEV-023: App Build & Deployment
**Steps:**
1. Build APK for Android
2. Install on test device

**Expected Result:**
- ✅ Flutter build completes without errors
- ✅ APK installs successfully
- ✅ App launches without crashes
- ✅ No missing dependencies

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-024: Offline-First Functionality
**Steps:**
1. Enable airplane mode on device
2. Use app features

**Expected Result:**
- ✅ App loads cached data
- ✅ Can view previously loaded submissions
- ✅ Can start new submission (queued)
- ✅ Data syncs when back online

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-025: 2G/3G Network Performance
**Steps:**
1. Simulate 2G network (Chrome DevTools or network sim tool)
2. Test app functionality

**Expected Result:**
- ✅ App usable on slow network
- ✅ Images compressed/optimized
- ✅ API calls timeout gracefully
- ✅ Loading indicators shown
- ✅ No app crashes

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-026: GPS Permissions & Accuracy
**Steps:**
1. Install app on fresh device
2. Trigger GPS location request

**Expected Result:**
- ✅ App requests location permission
- ✅ Permission dialog appears
- ✅ If granted, GPS location captured
- ✅ Accuracy within ±50m
- ✅ If denied, user-friendly error shown

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-027: Photo Upload & Compression
**Steps:**
1. Take photo with camera
2. Upload in submission

**Expected Result:**
- ✅ Camera permission requested
- ✅ Photo captured
- ✅ Photo compressed before upload (< 2MB)
- ✅ Upload completes on 3G network
- ✅ Photo quality acceptable

**Pass/Fail:** ____  
**Notes:** ____________________

---

## Security & Compliance (Tests 28-30)

### Test DEV-028: Authentication Security
**Steps:**
1. Test password requirements
2. Test token security

**Expected Result:**
- ✅ Passwords hashed (not stored plain text)
- ✅ JWT tokens expire appropriately
- ✅ Session timeout works
- ✅ No XSS or CSRF vulnerabilities

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-029: Role-Based Access Control
**Steps:**
1. Login as different roles
2. Attempt unauthorized actions

**Expected Result:**
- ✅ SE cannot access ZSM dashboard
- ✅ ZSM cannot access HQ data
- ✅ Proper 403 Forbidden errors for unauthorized access
- ✅ No privilege escalation possible

**Pass/Fail:** ____  
**Notes:** ____________________

---

### Test DEV-030: Data Privacy & GDPR Compliance
**Steps:**
1. Review data collection practices
2. Verify user consent

**Expected Result:**
- ✅ Only necessary data collected
- ✅ GPS/photos collected with user consent
- ✅ User data not shared inappropriately
- ✅ Can delete user data on request (if required)
- ✅ Privacy policy accessible in app

**Pass/Fail:** ____  
**Notes:** ____________________

---

---

# Testing Summary & Sign-Off

## Test Execution Summary

| Role      | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-----------|-------------|--------|--------|---------|-----------|
| SE        | 30          |        |        |         |           |
| ZSM       | 30          |        |        |         |           |
| ZBM       | 30          |        |        |         |           |
| HQ        | 30          |        |        |         |           |
| Director  | 30          |        |        |         |           |
| Developer | 30          |        |        |         |           |
| **TOTAL** | **180**     |        |        |         |           |

---

## Critical Issues Found

| Issue ID | Description | Severity | Role Affected | Status |
|----------|-------------|----------|---------------|--------|
|          |             |          |               |        |
|          |             |          |               |        |
|          |             |          |               |        |

---

## Testing Sign-Off

**UAT Lead:** ________________________  
**Date:** ________________________  
**Status:** ☐ APPROVED  ☐ APPROVED WITH CONDITIONS  ☐ REJECTED  

**Notes:**  
_______________________________________________________________________  
_______________________________________________________________________  
_______________________________________________________________________

---

## Next Steps

- [ ] Fix critical bugs identified during UAT
- [ ] Re-test failed scenarios
- [ ] Prepare for production deployment
- [ ] Conduct training sessions for all 662 SEs
- [ ] Set up monitoring and analytics
- [ ] Schedule go-live date

---

**End of UAT Test Plan**
