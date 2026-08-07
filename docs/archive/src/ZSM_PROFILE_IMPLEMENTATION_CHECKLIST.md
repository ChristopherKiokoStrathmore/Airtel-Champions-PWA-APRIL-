# ZSM Profile Implementation Checklist

## 🎯 Quick Start Guide
This checklist breaks down the ZSM profile implementation into actionable tasks, organized by priority and dependencies.

---

## ✅ Phase 1: Foundation (CRITICAL - Do First)

### Task 1.1: Create UserProfileModal Component
**File:** `/components/user-profile-modal.tsx` (NEW)  
**Dependencies:** None  
**Time Estimate:** 4-6 hours  

**Checklist:**
- [ ] Create new file `/components/user-profile-modal.tsx`
- [ ] Add modal shell with close button
- [ ] Add profile header section
- [ ] Add 5 stats cards layout
- [ ] Add 3-tab navigation (Posts, Activity, Stats)
- [ ] Add responsive design (mobile full-screen)
- [ ] Add loading states
- [ ] Add error handling

**Acceptance Criteria:**
- Modal opens/closes smoothly
- Shows user's name and avatar
- 5 stats cards display (even with 0 values)
- 3 tabs switch correctly
- Mobile responsive (full-screen on <768px)

---

### Task 1.2: Implement Role Badge System
**File:** `/components/role-badge.tsx` (NEW)  
**Dependencies:** None  
**Time Estimate:** 1 hour  

**Checklist:**
- [ ] Create `/components/role-badge.tsx`
- [ ] Define color mappings:
  - SE: Gray (#6B7280)
  - ZSM: Blue (#3B82F6)
  - ZBM: Green (#10B981)
  - HQ: Orange (#F97316)
  - Director: Purple (#8B5CF6)
- [ ] Add badge component with text and background
- [ ] Make it reusable with props
- [ ] Add to UserProfileModal

**Acceptance Criteria:**
- Badge shows correct color for each role
- Text is readable (good contrast)
- Responsive (scales on mobile)

---

### Task 1.3: Add Stats Cards Component
**File:** `/components/profile/stats-cards.tsx` (NEW)  
**Dependencies:** None  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Create `/components/profile/stats-cards.tsx`
- [ ] Fetch rank from database (based on total_points order)
- [ ] Fetch total points from app_users table
- [ ] Count posts from social_posts table
- [ ] Count followers from follows table
- [ ] Count following from follows table
- [ ] Display all 5 stats in card format
- [ ] Add loading skeletons
- [ ] Handle 0 values gracefully

**Acceptance Criteria:**
- All 5 cards display correctly
- Numbers are accurate from database
- Cards wrap properly on mobile (2 columns)
- Loading state shows before data loads

---

### Task 1.4: Build Posts Grid Tab
**File:** `/components/profile/posts-grid-tab.tsx` (NEW)  
**Dependencies:** Task 1.1 (modal structure)  
**Time Estimate:** 3 hours  

**Checklist:**
- [ ] Create `/components/profile/posts-grid-tab.tsx`
- [ ] Fetch user's posts from social_posts table
- [ ] Display in 3-column grid (Instagram style)
- [ ] Add click to view full post
- [ ] Add pagination for 50+ posts
- [ ] Add "No posts yet" empty state
- [ ] Make responsive (3 cols on all screen sizes)

**Acceptance Criteria:**
- Shows user's posts in 3-column grid
- Clicking post opens full view
- Empty state displays if no posts
- Grid stays 3 columns on mobile

---

### Task 1.5: Replace SEQuickViewModal in Team Tab
**File:** `/components/role-dashboards.tsx` (EDIT)  
**Dependencies:** Task 1.1 (UserProfileModal exists)  
**Time Estimate:** 30 minutes  

**Checklist:**
- [ ] Import UserProfileModal in role-dashboards.tsx
- [ ] Replace `<SEQuickViewModal>` at line 1349
- [ ] Update props to pass userId instead of se object
- [ ] Pass isOwnProfile={false}
- [ ] Pass currentUser={userData}
- [ ] Test opening profile from Team tab

**Acceptance Criteria:**
- Clicking SE in Team tab opens UserProfileModal
- Shows SE's profile, not calendar
- Modal displays correct SE data

---

### Task 1.6: Add Profile Click from Explore Feed
**File:** `/components/social-feed.tsx` or `/components/explore-feed.tsx` (EDIT)  
**Dependencies:** Task 1.1 (UserProfileModal exists)  
**Time Estimate:** 1 hour  

**Checklist:**
- [ ] Find post author name/avatar elements
- [ ] Add onClick handler: `handleUserClick(post.author_id)`
- [ ] Import UserProfileModal
- [ ] Add state for selectedUserId
- [ ] Render UserProfileModal when selectedUserId is set
- [ ] Test clicking user in Explore feed

**Acceptance Criteria:**
- Clicking user name/avatar opens their profile
- Profile shows correct user data
- Back button closes modal

---

## 🟡 Phase 2: Core Features (HIGH PRIORITY)

### Task 2.1: Implement Bio Editing
**File:** `/components/profile/bio-editor.tsx` (NEW)  
**Dependencies:** Task 1.1  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Create `/components/profile/bio-editor.tsx`
- [ ] Add textarea with 150 char limit
- [ ] Add character counter (e.g., "48/150")
- [ ] Add Save/Cancel buttons
- [ ] Update app_users.bio field on save
- [ ] Show success/error toast
- [ ] Add to UserProfileModal (own profile only)

**Acceptance Criteria:**
- Textarea enforces 150 char limit
- Counter updates as you type
- Save updates database
- Edit button only shows on own profile

---

### Task 2.2: Add Banner Upload
**File:** `/components/profile/banner-upload.tsx` (NEW)  
**Dependencies:** Supabase Storage bucket setup  
**Time Estimate:** 3 hours  

**Checklist:**
- [ ] Create Supabase Storage bucket: `make-28f2f653-profile-banners`
- [ ] Create `/components/profile/banner-upload.tsx`
- [ ] Add file picker (image only, max 2MB)
- [ ] Add upload progress indicator
- [ ] Upload to Supabase Storage
- [ ] Generate signed URL
- [ ] Update app_users.banner_url field
- [ ] Display banner in UserProfileModal
- [ ] Add camera icon overlay (own profile only)

**Acceptance Criteria:**
- Can select image from device
- Upload shows progress
- Banner displays after upload
- Upload button only on own profile

---

### Task 2.3: Create Activity Timeline Tab
**File:** `/components/profile/activity-tab.tsx` (NEW)  
**Dependencies:** Task 1.1  
**Time Estimate:** 4 hours  

**Checklist:**
- [ ] Create `/components/profile/activity-tab.tsx`
- [ ] Fetch user's activities:
  - Posts created
  - Comments made
  - Likes given
  - Achievements earned
  - Rank changes
- [ ] Display in chronological order (newest first)
- [ ] Add icons for each activity type
- [ ] Add relative timestamps ("2 hours ago")
- [ ] Add scrollable list
- [ ] Add empty state

**Acceptance Criteria:**
- Shows all user activities
- Sorted by most recent
- Icons display correctly
- Timestamps are relative

---

### Task 2.4: Create Stats Tab with Chart
**File:** `/components/profile/stats-tab.tsx` (NEW)  
**Dependencies:** Task 1.1, Recharts library  
**Time Estimate:** 4 hours  

**Checklist:**
- [ ] Create `/components/profile/stats-tab.tsx`
- [ ] Fetch 30 days of points data
- [ ] Install recharts: `npm install recharts`
- [ ] Create bar chart or line chart
- [ ] Add tooltips (date + points on hover)
- [ ] Add 4 summary cards:
  - Total engagement
  - Avg likes per post
  - Hall of Fame posts
  - Active days
- [ ] Make responsive

**Acceptance Criteria:**
- Chart displays 30 days of data
- Tooltips show on hover
- Summary cards show correct values
- Chart is responsive

---

### Task 2.5: Add Profile Click from Leaderboard
**File:** `/components/leaderboard-enhanced-unified.tsx` (EDIT)  
**Dependencies:** Task 1.1  
**Time Estimate:** 1 hour  

**Checklist:**
- [ ] Find leaderboard row elements
- [ ] Add onClick handler: `handleUserClick(user.id)`
- [ ] Import UserProfileModal
- [ ] Add state for selectedUserId
- [ ] Render UserProfileModal when selectedUserId is set
- [ ] Test clicking user in Leaderboard

**Acceptance Criteria:**
- Clicking leaderboard row opens profile
- Profile shows correct user data
- Modal closes properly

---

### Task 2.6: Implement Follow/Unfollow System
**Files:** Multiple (see breakdown)  
**Dependencies:** Database schema change  
**Time Estimate:** 6 hours  

**Sub-Task 2.6.1: Database Schema**
- [ ] Create follows table:
  ```sql
  CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
  );
  CREATE INDEX idx_follows_follower ON follows(follower_id);
  CREATE INDEX idx_follows_following ON follows(following_id);
  ```

**Sub-Task 2.6.2: API Endpoints**
**File:** `/supabase/functions/server/social.tsx` (EDIT)
- [ ] Add POST `/api/follow` endpoint
- [ ] Add DELETE `/api/unfollow` endpoint
- [ ] Add GET `/api/followers/:userId` endpoint
- [ ] Add GET `/api/following/:userId` endpoint
- [ ] Add GET `/api/follow-status/:userId` endpoint

**Sub-Task 2.6.3: Follow Button Component**
**File:** `/components/profile/follow-button.tsx` (NEW)
- [ ] Create follow button component
- [ ] Fetch follow status on mount
- [ ] Handle follow action (call API)
- [ ] Handle unfollow action (call API)
- [ ] Update follower count in real-time
- [ ] Show loading state during API call
- [ ] Add to UserProfileModal (hide on own profile)

**Acceptance Criteria:**
- Can follow/unfollow users
- Follower count updates immediately
- Follow status persists across sessions
- Button hidden on own profile

---

## 🟢 Phase 3: Enhanced Features (MEDIUM PRIORITY)

### Task 3.1: Add Achievements Display
**File:** `/components/profile/achievements-section.tsx` (NEW)  
**Dependencies:** Achievements system (may need to build)  
**Time Estimate:** 4 hours  

**Checklist:**
- [ ] Design achievements data structure
- [ ] Create achievements table or use existing
- [ ] Create `/components/profile/achievements-section.tsx`
- [ ] Fetch user's top 3 achievements
- [ ] Display with icons, titles, descriptions
- [ ] Add "View All" link (future)
- [ ] Add to UserProfileModal

**Acceptance Criteria:**
- Shows top 3 achievements
- Each has icon, title, description
- Empty state if no achievements

---

### Task 3.2: Add Join Date Display
**File:** `/components/user-profile-modal.tsx` (EDIT)  
**Dependencies:** Task 1.1  
**Time Estimate:** 30 minutes  

**Checklist:**
- [ ] Fetch user.created_at from database
- [ ] Format as "Joined MMM YYYY" (e.g., "Joined Jan 2025")
- [ ] Display below location in profile header
- [ ] Add calendar icon

**Acceptance Criteria:**
- Join date displays correctly
- Format is consistent
- Shows for all users

---

### Task 3.3: Add Location Display
**File:** `/components/user-profile-modal.tsx` (EDIT)  
**Dependencies:** Task 1.1  
**Time Estimate:** 30 minutes  

**Checklist:**
- [ ] Fetch user.zone and user.region from database
- [ ] Display as "Zone • Region" format
- [ ] Add location pin icon
- [ ] Place in profile header

**Acceptance Criteria:**
- Location displays "Zone • Region"
- Shows for all users
- Looks good on mobile

---

### Task 3.4: Complete Settings Tab
**File:** `/components/role-dashboards.tsx` (EDIT)  
**Dependencies:** None  
**Time Estimate:** 3 hours  

**Checklist:**
- [ ] Add profile picture upload section
- [ ] Add password change modal
- [ ] Add privacy toggles
- [ ] Add notification preferences
- [ ] Add account management options
- [ ] Complete the truncated implementation

**Acceptance Criteria:**
- All settings sections present
- Profile picture upload works
- Settings persist to database

---

### Task 3.5: Add Profile Picture Upload
**File:** `/components/profile/profile-picture-upload.tsx` (NEW)  
**Dependencies:** Supabase Storage  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Create component for avatar upload
- [ ] Upload to `make-28f2f653-profile-pictures` bucket
- [ ] Update app_users.avatar_url
- [ ] Show preview before upload
- [ ] Crop to square (optional)
- [ ] Add to Settings tab

**Acceptance Criteria:**
- Can upload profile picture
- Picture displays in profile
- Works from Settings tab

---

## ⚪ Phase 4: Polish & Edge Cases (LOW PRIORITY)

### Task 4.1: Add Loading States
**Files:** All profile components  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Add skeleton loaders for stats cards
- [ ] Add spinner for posts grid
- [ ] Add loading state for activity tab
- [ ] Add shimmer effect for banner
- [ ] Ensure smooth transitions

**Acceptance Criteria:**
- Loading states look polished
- No jarring layout shifts
- Consistent loading UX

---

### Task 4.2: Handle Edge Cases
**Files:** Various  
**Time Estimate:** 3 hours  

**Checklist:**
- [ ] Handle user with no posts (empty state)
- [ ] Handle user with no bio (placeholder)
- [ ] Handle user with no achievements (hide section)
- [ ] Handle very long names (truncate)
- [ ] Handle zero data days in chart (show small bar)
- [ ] Handle deleted users (show "User not found")

**Acceptance Criteria:**
- All edge cases handled gracefully
- No errors in console
- Good UX for empty states

---

### Task 4.3: Optimize Performance
**Files:** Various  
**Time Estimate:** 3 hours  

**Checklist:**
- [ ] Add caching for user profiles
- [ ] Implement pagination for posts (50+ items)
- [ ] Lazy load images in posts grid
- [ ] Debounce follow button clicks
- [ ] Optimize database queries

**Acceptance Criteria:**
- Profile loads in <2 seconds
- Pagination works smoothly
- No performance issues on slow networks

---

### Task 4.4: Add Mobile Optimizations
**Files:** All profile components  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Test on mobile devices (iOS, Android)
- [ ] Ensure touch targets are 44px minimum
- [ ] Test banner upload on mobile
- [ ] Verify 3-column grid on small screens
- [ ] Check all text is readable (min 14px)
- [ ] Test horizontal scrolling for tabs

**Acceptance Criteria:**
- Works on all mobile devices
- Touch-friendly interface
- No horizontal scroll issues

---

### Task 4.5: Security & Permissions
**Files:** API endpoints, components  
**Time Estimate:** 2 hours  

**Checklist:**
- [ ] Verify edit buttons only show on own profile
- [ ] Verify upload buttons only on own profile
- [ ] Add server-side permission checks
- [ ] Test unauthorized access attempts
- [ ] Ensure follow data persists

**Acceptance Criteria:**
- Users cannot edit others' profiles
- Server validates all requests
- No security vulnerabilities

---

## 📊 Progress Tracking

### Overall Progress by Phase:
- [ ] Phase 1: Foundation (0/6 tasks complete)
- [ ] Phase 2: Core Features (0/6 tasks complete)
- [ ] Phase 3: Enhanced Features (0/5 tasks complete)
- [ ] Phase 4: Polish (0/5 tasks complete)

**Total:** 0/22 tasks complete (0%)

---

## 🎯 Milestones

### Milestone 1: Basic Profile Viewing ✅
**Target:** Complete Phase 1  
**Definition of Done:**
- UserProfileModal component exists
- Role badges display
- 5 stats cards show
- Posts tab renders
- Can view profiles from Team tab
- Can view profiles from Explore feed

---

### Milestone 2: Full Profile Features ✅
**Target:** Complete Phase 1 + Phase 2  
**Definition of Done:**
- All Milestone 1 features
- Bio editing works
- Banner upload works
- Activity tab shows timeline
- Stats tab shows chart
- Can view profiles from Leaderboard
- Follow/unfollow system functional

---

### Milestone 3: Production Ready ✅
**Target:** Complete all 4 phases  
**Definition of Done:**
- All Milestone 2 features
- Achievements display
- Join date shows
- Settings tab complete
- Profile picture upload works
- All edge cases handled
- Performance optimized
- Mobile responsive
- Security verified

---

### Milestone 4: UAT Passing ✅
**Target:** All 50 UAT tests pass  
**Definition of Done:**
- All 50 tests marked as "Pass"
- No failing tests
- No warning tests
- All categories 100% complete

---

## 🚀 Quick Start Instructions

### To begin implementation:

1. **Start with Task 1.1** (UserProfileModal)
   - This is the foundation everything else builds on
   - Create the file: `/components/user-profile-modal.tsx`
   - Follow the checklist items

2. **Then do Task 1.2** (Role Badge System)
   - Small, standalone component
   - Quick win to see visual progress

3. **Continue in order** through Phase 1
   - Each task builds on previous work
   - Don't skip ahead to Phase 2 until Phase 1 is done

4. **Test after each task**
   - Open the UAT modal to track progress
   - Mark tests as "Pass" or "Fail"
   - Fix issues before moving to next task

---

## 📝 Notes

- **Database Changes:** Task 2.6 requires new follows table - coordinate with backend team
- **Achievements System:** Task 3.1 may need achievements system built first
- **Supabase Storage:** Tasks 2.2 and 3.5 need storage buckets created
- **Testing:** Use the ZSMProfileUAT component to track test progress in real-time

---

## ✅ Daily Checklist Template

Use this to track daily progress:

```markdown
## Day [X] Progress - [Date]

### Completed Today:
- [ ] Task X.X: [Task Name]
- [ ] Task X.X: [Task Name]

### Blockers:
- [None/List any blockers]

### Tomorrow's Plan:
- [ ] Task X.X: [Task Name]
- [ ] Task X.X: [Task Name]

### UAT Tests Updated:
- [X] tests now passing (up from [Y])

### Notes:
- [Any important notes or decisions]
```

---

**Checklist Version:** 1.0  
**Last Updated:** January 9, 2026  
**Estimated Total Time:** 60-80 hours (spread across 2-3 weeks)
