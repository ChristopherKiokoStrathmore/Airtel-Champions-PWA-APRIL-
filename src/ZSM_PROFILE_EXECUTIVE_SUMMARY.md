# ZSM Profile - Executive Summary

**Date:** January 9, 2026  
**Status:** 🔴 CRITICAL - Profile features incomplete  
**UAT Completion:** 10% (5 of 50 tests passing)  
**Estimated Fix Time:** 60-80 hours

---

## 🎯 The Problem

The ZSM (Zonal Sales Manager) dashboard has **basic navigation but is missing critical profile functionality**. A comprehensive UAT (User Acceptance Testing) suite with **50 test cases** reveals that **45 tests are currently failing**.

### What's Working ✅
- ✅ Home tab with team stats
- ✅ Team tab with search/filter
- ✅ Leaderboard integration
- ✅ Explore (social feed)
- ✅ Programs dashboard
- ✅ Submissions analytics

### What's Broken ❌
- ❌ Profile viewing is basic (not enhanced)
- ❌ No bio/tagline editing
- ❌ No profile banner upload
- ❌ No follow/unfollow system
- ❌ No posts/activity/stats tabs
- ❌ No achievements display
- ❌ Wrong modal component used
- ❌ Cannot view profiles from Explore feed or Leaderboard

---

## 🔍 Root Cause Analysis

### Issue #1: Wrong Component Usage
**Current:** Team tab uses `SEQuickViewModal` to show user profiles  
**Problem:** This modal shows **calendar submissions**, not user profiles  
**Impact:** 20+ UAT tests fail because there's no actual profile view

### Issue #2: Missing Social Infrastructure
**Current:** No follow system, no posts grid, no activity timeline  
**Problem:** Profile is just basic info display, not a social profile  
**Impact:** Cannot test social features, 15+ UAT tests fail

### Issue #3: Incomplete Profile Tab
**Current:** Profile tab has basic cards but no editing or detailed views  
**Problem:** No bio editing, no banner upload, no tabs (Posts/Activity/Stats)  
**Impact:** ZSMs cannot customize profiles, 10+ UAT tests fail

---

## 📊 UAT Test Breakdown

| Category | Total Tests | Passing | Failing | Status |
|----------|-------------|---------|---------|--------|
| Own Profile - View | 6 | 1 | 5 | 🔴 Critical |
| Own Profile - Edit | 5 | 0 | 5 | 🔴 Critical |
| Own Profile - Tabs | 6 | 0 | 6 | 🔴 Critical |
| Viewing SE Profiles | 8 | 0 | 8 | 🔴 Critical |
| Viewing Other ZSMs | 3 | 0 | 3 | 🔴 Critical |
| Viewing Higher Roles | 5 | 0 | 5 | 🔴 Critical |
| Profile from Team | 2 | 1 | 1 | 🟡 Partial |
| Profile from Leaderboard | 2 | 0 | 2 | 🔴 Critical |
| Performance & Data | 4 | 0 | 4 | 🔴 Critical |
| Mobile Responsive | 4 | 2 | 2 | 🟡 Partial |
| Permissions & Security | 3 | 0 | 3 | 🔴 Critical |
| Edge Cases | 5 | 1 | 4 | 🟡 Partial |
| **TOTAL** | **50** | **5** | **45** | **🔴 10%** |

---

## 🏗️ What Needs to Be Built

### 1️⃣ UserProfileModal Component (NEW)
**Priority:** CRITICAL  
**Time:** 4-6 hours

Instagram-style enhanced profile modal with:
- Profile banner with upload capability
- Role badge (color-coded: SE gray, ZSM blue, etc.)
- 5 stat cards: Rank, Points, Posts, Followers, Following
- Location (Zone • Region)
- Join date
- Bio/tagline (editable, 150 char limit)
- Top 3 achievements
- 3 tabs: Posts (grid), Activity (timeline), Stats (chart)
- Follow/Unfollow button

---

### 2️⃣ Follow/Unfollow System (NEW)
**Priority:** CRITICAL  
**Time:** 6 hours

Complete social networking feature:
- Database: `follows` table
- API endpoints: follow, unfollow, get followers, get following
- Follow button component with state management
- Real-time follower count updates
- Persistence across sessions

---

### 3️⃣ Profile Tabs (NEW)
**Priority:** CRITICAL  
**Time:** 11 hours total

Three separate tab components:

**a) Posts Tab** (3 hours)
- 3-column Instagram-style grid
- User's social posts
- Click to view full post
- Pagination for 50+ posts

**b) Activity Tab** (4 hours)
- Timeline of user actions
- Icons for posts, comments, likes, achievements
- Chronological order (newest first)
- Relative timestamps

**c) Stats Tab** (4 hours)
- 30-day points trend chart (Recharts)
- Tooltips on hover
- Performance summary cards:
  - Total engagement
  - Avg likes per post
  - Hall of Fame posts
  - Active days

---

### 4️⃣ Bio & Banner Editing (NEW)
**Priority:** HIGH  
**Time:** 5 hours

**Bio Editor:** (2 hours)
- Textarea with 150 character limit
- Live character counter
- Save/Cancel buttons
- Updates `app_users.bio` field

**Banner Upload:** (3 hours)
- File picker (images only, max 2MB)
- Upload to Supabase Storage bucket
- Generate signed URLs
- Updates `app_users.banner_url` field
- Camera icon overlay (own profile only)

---

### 5️⃣ Integration Points (NEW)
**Priority:** HIGH  
**Time:** 2.5 hours

**Replace modal in Team tab:** (30 min)
- Replace `SEQuickViewModal` with `UserProfileModal`

**Add profile clicks in Explore:** (1 hour)
- Click user avatar/name → open UserProfileModal

**Add profile clicks in Leaderboard:** (1 hour)
- Click leaderboard row → open UserProfileModal

---

### 6️⃣ Additional Components (NEW)
**Priority:** MEDIUM  
**Time:** 7 hours

- Role badge component (1 hour)
- Stats cards component (2 hours)
- Achievements section (4 hours)

---

## 📅 Implementation Roadmap

### Week 1: Foundation
**Goal:** Basic profile viewing working  
**Tasks:**
- [ ] Day 1-2: Build UserProfileModal shell
- [ ] Day 3: Add role badges
- [ ] Day 4: Add 5 stats cards
- [ ] Day 5: Build Posts tab

**Milestone:** Can view basic profiles from Team tab

---

### Week 2: Core Features
**Goal:** Full profile features  
**Tasks:**
- [ ] Day 1-2: Build Activity tab
- [ ] Day 3-4: Build Stats tab with chart
- [ ] Day 5: Add profile clicks from Explore/Leaderboard

**Milestone:** All tabs working, profiles accessible from all entry points

---

### Week 3: Social & Editing
**Goal:** Follow system and profile editing  
**Tasks:**
- [ ] Day 1-2: Build follow/unfollow system (DB + API)
- [ ] Day 3: Add bio editing
- [ ] Day 4: Add banner upload
- [ ] Day 5: Add achievements display

**Milestone:** ZSMs can follow users and customize their profiles

---

### Week 4: Polish & Testing
**Goal:** Pass all UAT tests  
**Tasks:**
- [ ] Day 1: Complete Settings tab
- [ ] Day 2: Handle edge cases
- [ ] Day 3: Mobile optimization
- [ ] Day 4: Performance optimization
- [ ] Day 5: Security review and final UAT

**Milestone:** All 50 UAT tests passing

---

## 💰 Resource Requirements

### Development Time
- **Phase 1 (Foundation):** 12 hours
- **Phase 2 (Core Features):** 15 hours
- **Phase 3 (Enhanced):** 14 hours
- **Phase 4 (Polish):** 10 hours
- **Testing & Fixes:** 10 hours
- **Total:** 60-80 hours (2-3 weeks for 1 developer)

### Infrastructure
- Supabase Storage buckets:
  - `make-28f2f653-profile-banners`
  - `make-28f2f653-profile-pictures`
- Database table:
  - `follows` table with indexes
- API endpoints:
  - 5 new endpoints for follow system

### External Dependencies
- Recharts library (for Stats tab chart)
- Image upload/processing (built-in browser APIs)

---

## ⚠️ Risks & Mitigation

### Risk 1: Scope Creep
**Risk:** Adding too many features delays basic functionality  
**Mitigation:** Follow 4-phase approach, don't skip Phase 1  
**Impact if ignored:** UAT tests continue to fail

### Risk 2: Achievements System Dependency
**Risk:** Task 3.1 needs achievements system that may not exist  
**Mitigation:** Mock achievements or defer to Phase 4  
**Impact if ignored:** 5 UAT tests remain failing

### Risk 3: Mobile Testing Gaps
**Risk:** Desktop-focused development breaks mobile  
**Mitigation:** Test on mobile after each task  
**Impact if ignored:** 4 mobile UAT tests fail

### Risk 4: Follow System Complexity
**Risk:** Follow system is complex (DB schema, API, realtime updates)  
**Mitigation:** Allocate full 6 hours, test thoroughly  
**Impact if ignored:** 15+ social feature UAT tests fail

---

## 📈 Success Metrics

### Definition of Done (Phase 1)
- ✅ UserProfileModal component renders
- ✅ 5 stats cards display correctly
- ✅ Posts tab shows user posts in grid
- ✅ Can open profiles from Team tab
- ✅ Can open profiles from Explore feed
- ✅ Role badges display with correct colors

**UAT Impact:** 15-20 tests should pass

---

### Definition of Done (Phase 2)
- ✅ Activity tab shows timeline
- ✅ Stats tab shows 30-day chart
- ✅ Can open profiles from Leaderboard
- ✅ Follow/unfollow system works end-to-end
- ✅ Follower counts update in real-time

**UAT Impact:** 30-35 tests should pass

---

### Definition of Done (Phase 3)
- ✅ Bio editing works with char limit
- ✅ Banner upload works
- ✅ Achievements display (top 3)
- ✅ Join date shows
- ✅ Location (zone/region) displays

**UAT Impact:** 40-45 tests should pass

---

### Definition of Done (Phase 4)
- ✅ All edge cases handled
- ✅ Mobile responsive (tested on devices)
- ✅ Performance optimized (<2s load)
- ✅ Security verified (permissions enforced)
- ✅ Settings tab complete

**UAT Impact:** All 50 tests should pass ✅

---

## 🎯 Immediate Next Steps

### 1. Review & Approve Plan
**Who:** Product Owner + Tech Lead  
**When:** Today  
**Output:** Approval to proceed with implementation

### 2. Create UserProfileModal Component
**Who:** Frontend Developer  
**When:** Tomorrow  
**Output:** `/components/user-profile-modal.tsx` file created

### 3. Set Up Daily Standups
**Who:** Development Team  
**When:** Starting tomorrow  
**Output:** Track progress using checklist, identify blockers

### 4. Create Database Schema
**Who:** Backend Developer  
**When:** Week 1, Day 3  
**Output:** `follows` table created, indexes added

---

## 📚 Reference Documents

1. **ZSM_PROFILE_ISSUES_ANALYSIS.md** - Detailed technical analysis
2. **ZSM_PROFILE_VISUAL_COMPARISON.md** - Before/after visual mockups
3. **ZSM_PROFILE_IMPLEMENTATION_CHECKLIST.md** - Task-by-task checklist
4. **/components/zsm-profile-uat.tsx** - 50 UAT test cases

---

## 🔑 Key Takeaways

### ✅ What's Good
- Navigation structure is solid
- Team management features work well
- UAT test suite is comprehensive
- Clear requirements documented

### 🔴 What's Critical
- Profile viewing is not functional
- 45 out of 50 UAT tests failing
- Social features completely missing
- Wrong component used for profiles

### 🚀 What's Next
- Start with UserProfileModal foundation
- Build incrementally (Phase 1 → Phase 4)
- Test after each task
- Track UAT progress daily

---

## 💬 Questions for Stakeholders

1. **Achievements System:** Is there an existing achievements system we should integrate with, or should we build a basic version?

2. **Banner Size Limits:** What's the maximum file size for banner images? (Recommend 2MB max, 1200x300px)

3. **Real-time Updates:** Should follower counts update in real-time, or is periodic polling acceptable?

4. **Profile Picture:** Should profile picture upload be in Phase 1 or can it wait for Phase 3?

5. **Testing Resources:** Do we have QA resources available for UAT testing, or will developers self-test?

---

## ✅ Approval Sign-Off

**Product Owner:** ___________________ Date: ___________

**Tech Lead:** ___________________ Date: ___________

**Backend Lead:** ___________________ Date: ___________

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Next Review:** After Phase 1 completion
