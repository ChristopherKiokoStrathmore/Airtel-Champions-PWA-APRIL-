# ZSM Profile - Issues & Missing Features Analysis

## Executive Summary
The ZSM (Zonal Sales Manager) dashboard has basic navigation and team management features, but is **missing critical profile functionality** required by the UAT test cases. The current implementation has **50+ failing test requirements** across 12 categories.

---

## 🔴 CRITICAL ISSUES

### 1. **Profile Display is Basic, Not Enhanced**
**Current State:** Simple profile card with minimal information  
**Required:** Instagram-style enhanced profile with social features

**Missing Features:**
- ❌ Profile banner image (with upload capability)
- ❌ Bio/tagline (150 character limit, editable)
- ❌ Character counter for bio editing
- ❌ Complete stats row: **Rank, Points, Posts, Followers, Following** (currently only shows Points & Submissions)
- ❌ Zone and Region location display in profile header
- ❌ Join date display (e.g., "Jan 2025")
- ❌ Top 3 achievements section with icons
- ❌ Profile tabs (Posts, Activity, Stats)

---

### 2. **Wrong Modal Component for User Profiles**
**Current State:** Uses `SEQuickViewModal` which shows calendar submissions  
**Required:** Enhanced profile modal with social features

**Location:** `/components/role-dashboards.tsx` lines 123-401

**Problem:**
```tsx
// Currently used in Team tab (line 1349)
<SEQuickViewModal
  isOpen={!!selectedSE}
  onClose={() => setSelectedSE(null)}
  se={selectedSE}
  programs={programs}
/>
```

This modal shows:
- ✅ Multi-program calendar view
- ✅ Submission history by day
- ❌ NOT a user profile (no bio, followers, posts, activity)

---

### 3. **No Profile Viewing from Explore Feed or Leaderboard**
**Impact:** 20+ UAT tests cannot be performed

**Missing Functionality:**
- Cannot click on user names/avatars in Explore feed to view profiles
- Cannot click on users in Leaderboard to view profiles
- No follow/unfollow buttons
- No role-specific badges (SE gray, ZSM blue, ZBM green, Director purple)

---

### 4. **No Social Features**
**Missing Components:**
- ❌ Follow/unfollow system
- ❌ Followers count & list
- ❌ Following count & list
- ❌ Posts grid (3-column Instagram style)
- ❌ Activity timeline (posts, comments, likes)
- ❌ Social interactions tracking

---

### 5. **Profile Tab Layout is Incomplete**
**Location:** `/components/role-dashboards.tsx` lines 1404-1527

**Current Profile Tab Has:**
- ✅ Profile picture (initial avatar)
- ✅ Name and role badge
- ✅ Total points and submissions count
- ✅ ProgramsList component
- ✅ ReportingStructure component
- ✅ Basic info (zone, team size, ZBM)

**Profile Tab Missing:**
- ❌ Banner image
- ❌ Bio/tagline editing
- ❌ Followers/following stats
- ❌ Posts tab
- ❌ Activity tab
- ❌ Stats tab with 30-day points chart
- ❌ Achievements section
- ❌ Join date

---

### 6. **Settings Tab is Incomplete**
**Location:** `/components/role-dashboards.tsx` lines 1530-1590 (truncated)

**Current Settings Tab Has:**
- ✅ Account information section
- ✅ Basic preferences toggles (notifications, email)

**Settings Tab Missing:**
- ❌ Profile picture upload
- ❌ Password change option
- ❌ Privacy settings
- ❌ Additional preferences

---

## 📊 UAT Test Coverage Analysis

### Category Breakdown (50 total tests):

| Category | Tests | Current Status | % Complete |
|----------|-------|----------------|------------|
| **1. Own Profile - View** | 6 | ❌ Failing | 20% |
| **2. Own Profile - Edit** | 5 | ❌ Failing | 0% |
| **3. Own Profile - Tabs** | 6 | ❌ Failing | 0% |
| **4. Viewing SE Profiles** | 8 | ❌ Failing | 0% |
| **5. Viewing Other ZSM Profiles** | 3 | ❌ Failing | 0% |
| **6. Viewing Higher Roles** | 5 | ❌ Failing | 0% |
| **7. Profile from Team View** | 2 | ⚠️ Partial | 50% |
| **8. Profile from Leaderboard** | 2 | ❌ Failing | 0% |
| **9. Performance & Data** | 4 | ⚠️ Unknown | N/A |
| **10. Mobile Responsiveness** | 4 | ⚠️ Partial | 50% |
| **11. Permissions & Security** | 3 | ❌ Failing | 0% |
| **12. Edge Cases** | 5 | ❌ Failing | 0% |

**Overall Completion:** ~10% (5 of 50 tests passing)

---

## 🎯 What's Working

### ✅ Navigation Structure
- Bottom nav correctly shows 5 tabs: Home, Explore, Submissions, Leaderboard, Team
- Tab switching works properly
- All tabs render without errors

### ✅ Home Tab
- Time-based greeting working
- Team total points calculation correct
- Team health status display
- Leaderboard widget present
- Programs widget present
- Recent submissions feed working
- Announcements integration working

### ✅ Team Tab
- Loads team members correctly (using 3 fallback strategies)
- Search functionality works
- Filter by status (all, active, inactive) works
- Sort by points/rank/name works
- Team member cards display rank, points, status
- Click on SE opens modal (but wrong modal type)

### ✅ Leaderboard Tab
- Uses LeaderboardEnhancedUnified component
- Shows back button
- Displays current user position

### ✅ Explore Tab
- Social feed integration working
- Back button present

### ✅ Submissions Tab
- SubmissionsAnalytics component integrated
- Shows zone-level analytics

### ✅ Programs Tab
- ProgramsDashboard component integrated

---

## 🔨 Required Components (Missing)

### 1. **UserProfileModal Component** (NEW)
**Purpose:** Enhanced Instagram-style profile modal for viewing any user

**Features Needed:**
```tsx
<UserProfileModal
  userId={selectedUserId}
  currentUser={userData}
  isOwnProfile={userId === userData.id}
  onClose={() => setSelectedUserId(null)}
/>
```

**Must Include:**
- Profile banner (uploadable for own profile)
- Avatar (large, circular)
- Role badge with color coding
- 5 stat cards: Rank, Points, Posts, Followers, Following
- Zone & Region location
- Join date (formatted)
- Bio/tagline (editable for own profile with 150 char limit)
- Top 3 achievements
- 3 tabs:
  - **Posts Tab:** 3-column grid of user's posts
  - **Activity Tab:** Timeline of posts, comments, likes
  - **Stats Tab:** 30-day points chart + performance cards
- Follow/Unfollow button (hidden on own profile)
- Edit bio button (only on own profile)
- Upload banner button (only on own profile)

---

### 2. **Profile Banner Upload Component** (NEW)
**Integration:** Supabase Storage

**Features:**
- File picker for images
- Image preview before upload
- Upload progress indicator
- Success/error feedback
- Stored in: `make-28f2f653-profile-banners` bucket
- Generates signed URLs for display

---

### 3. **Bio Editor Component** (NEW)
**Features:**
- Textarea with 150 character limit
- Live character counter (e.g., "48/150")
- Save/Cancel buttons
- Visual feedback on save
- Validates max length
- Updates app_users table

---

### 4. **Achievements Display Component** (NEW)
**Features:**
- Shows top 3 achievements
- Each achievement has:
  - Icon/emoji
  - Title
  - Description
  - Date earned (optional)
- Links to full achievements page (future)

---

### 5. **Posts Grid Component** (NEW)
**Features:**
- 3-column responsive grid (Instagram style)
- Displays user's posts
- Click to view full post
- Shows post image/content preview
- Pagination for 50+ posts
- Empty state: "No posts yet"

---

### 6. **Activity Timeline Component** (NEW)
**Features:**
- Chronological list of user activities
- Icons for different actions:
  - 📝 Created a post
  - 💬 Commented on post
  - ❤️ Liked a post
  - 🏆 Earned achievement
  - ⭐ Reached new rank
- Timestamps (relative, e.g., "2 hours ago")
- Scrollable list with infinite scroll

---

### 7. **Stats Chart Component** (NEW)
**Features:**
- 30-day points trend (bar chart or line chart)
- Uses Recharts library
- Tooltips on hover showing date + points
- Performance summary cards:
  - Total engagement
  - Average likes per post
  - Hall of Fame posts count
- Responsive design

---

### 8. **Follow System Integration** (NEW)
**Database Schema Needed:**
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES app_users(id),
  following_id UUID REFERENCES app_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);
```

**API Endpoints Needed:**
- `POST /api/follow` - Follow a user
- `DELETE /api/unfollow` - Unfollow a user
- `GET /api/followers/:userId` - Get user's followers
- `GET /api/following/:userId` - Get users the user follows
- `GET /api/follow-status/:userId` - Check if current user follows target user

---

## 🔧 Integration Points to Fix

### 1. **Team Tab - Replace Modal**
**File:** `/components/role-dashboards.tsx` line 1349

**Current:**
```tsx
<SEQuickViewModal ... />
```

**Should Be:**
```tsx
<UserProfileModal
  userId={selectedSE?.id}
  currentUser={userData}
  isOwnProfile={false}
  onClose={() => setSelectedSE(null)}
/>
```

---

### 2. **Explore Feed - Add Profile Click**
**File:** `/components/social-feed.tsx` or `/components/explore-feed.tsx`

**Add:**
```tsx
onClick={() => handleUserClick(post.author_id)}
```
to user avatars and names

---

### 3. **Leaderboard - Add Profile Click**
**File:** `/components/leaderboard-enhanced-unified.tsx`

**Add:**
```tsx
onClick={() => handleUserClick(user.id)}
```
to leaderboard rows

---

### 4. **Profile Tab - Redesign Layout**
**File:** `/components/role-dashboards.tsx` lines 1404-1527

**Replace entire Profile Tab with:**
- Enhanced profile layout matching UserProfileModal design
- But for own profile (isOwnProfile={true})
- Include all editing capabilities
- Keep ReportingStructure component at bottom

---

### 5. **Settings Tab - Complete Implementation**
**File:** `/components/role-dashboards.tsx` starting line 1530

**Add:**
- Profile picture upload section
- Password change option
- Privacy toggles
- Account management options

---

## 📱 Mobile Responsiveness Requirements

### From UAT Tests:
1. Profile modal must be full-screen on mobile (<768px)
2. Stats cards should wrap properly (2 columns on mobile, 5 on desktop)
3. Posts grid must maintain 3 columns even on mobile
4. Banner upload button must be tappable (min 44px touch target)
5. All text must be readable (min 14px font size)
6. Tabs should scroll horizontally if needed

---

## 🔐 Security & Permissions Requirements

### From UAT Tests:
1. ZSM cannot edit other users' bios (edit button only on own profile)
2. ZSM cannot change other users' banners (camera icon only on own profile)
3. Follow data must persist across sessions (localStorage + database)
4. Profile views must be read-only for other users
5. API calls must validate user permissions server-side

---

## 📋 Implementation Priority

### 🔴 Phase 1: CRITICAL (Must Have for Basic Functionality)
1. Create UserProfileModal component with basic layout
2. Add role badges (SE gray, ZSM blue, ZBM green, Director purple)
3. Display 5 stat cards (Rank, Points, Posts, Followers, Following)
4. Implement Posts tab with 3-column grid
5. Replace SEQuickViewModal usage in Team tab
6. Add profile click handlers in Explore feed

### 🟡 Phase 2: HIGH PRIORITY (UAT Requirements)
7. Implement bio editing with 150 char limit
8. Add banner upload functionality (Supabase Storage)
9. Create Activity timeline tab
10. Create Stats tab with 30-day chart
11. Add profile click handlers in Leaderboard
12. Implement follow/unfollow system

### 🟢 Phase 3: MEDIUM PRIORITY (Enhanced Features)
13. Add achievements display (top 3)
14. Add join date display
15. Complete Settings tab
16. Add profile picture upload
17. Implement edge case handling

### ⚪ Phase 4: LOW PRIORITY (Polish)
18. Add loading states and animations
19. Optimize performance (caching, pagination)
20. Add mobile-specific optimizations
21. Implement advanced security checks

---

## 🎬 Next Steps

### Immediate Actions Required:
1. ✅ **Review this analysis document** with the team
2. 🔨 **Create UserProfileModal component** (Phase 1, Item 1)
3. 🔨 **Add role badge system** (Phase 1, Item 2)
4. 🔨 **Build stats cards component** (Phase 1, Item 3)
5. 🔨 **Implement Posts grid tab** (Phase 1, Item 4)

### Questions to Resolve:
1. Should we use existing social feed posts or create separate "profile posts" table?
2. Where should achievements data come from? (needs achievements system)
3. Should we create a new `/components/profiles/` directory for all profile components?
4. Do we need real-time updates for follower counts or is polling acceptable?
5. What's the banner image size limit? (recommend 1200x300px, max 2MB)

---

## 📚 Related Files to Review

1. `/components/role-dashboards.tsx` - Main ZSM dashboard
2. `/components/zsm-profile-uat.tsx` - UAT test cases (50 tests)
3. `/components/social-feed.tsx` or `/components/explore-feed.tsx` - Explore feed
4. `/components/leaderboard-enhanced-unified.tsx` - Leaderboard
5. `/components/programs/programs-list.tsx` - Programs display

---

## 🎯 Success Criteria

The ZSM profile will be considered **complete** when:
- ✅ All 50 UAT tests pass
- ✅ Users can view and edit their own profile
- ✅ Users can view other users' profiles (SE, ZSM, ZBM, HQ, Director)
- ✅ Follow/unfollow system works end-to-end
- ✅ Profile accessible from Team tab, Explore feed, Leaderboard
- ✅ All tabs work (Posts, Activity, Stats)
- ✅ Banner upload works
- ✅ Bio editing works with character limit
- ✅ Mobile responsive
- ✅ Secure (permissions enforced)

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** 🔴 CRITICAL - Profile features incomplete
