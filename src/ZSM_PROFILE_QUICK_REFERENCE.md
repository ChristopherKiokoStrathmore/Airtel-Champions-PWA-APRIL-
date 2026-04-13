# ZSM Profile - Quick Reference Guide

## 🚨 TL;DR (Too Long; Didn't Read)

**Status:** 🔴 ZSM profile is **90% incomplete**  
**Problem:** Wrong component, missing features, 45/50 UAT tests failing  
**Fix:** Build new UserProfileModal + follow system + 3 tabs  
**Time:** 60-80 hours (2-3 weeks)  
**Start:** Build UserProfileModal component first

---

## 📋 The 5-Minute Summary

### What's Wrong?
1. **Wrong Modal** - Team tab shows calendar, not profile
2. **No Social Features** - No follow/unfollow, no posts grid
3. **No Editing** - Can't edit bio or upload banner
4. **No Tabs** - Missing Posts, Activity, Stats tabs
5. **No Integration** - Can't view profiles from Explore/Leaderboard

### What Needs Fixing?
1. **Create UserProfileModal** - New component for viewing profiles
2. **Add Follow System** - Database + API + UI
3. **Build 3 Tabs** - Posts grid, Activity timeline, Stats chart
4. **Add Editing** - Bio editor, banner upload
5. **Add Integration** - Links from Explore, Leaderboard, Team

### How Long?
- Phase 1 (Foundation): 12 hours
- Phase 2 (Core): 15 hours
- Phase 3 (Enhanced): 14 hours
- Phase 4 (Polish): 10 hours
- **Total: 60-80 hours**

---

## 🎯 4 Phases in 1 Sentence Each

1. **Phase 1:** Build basic profile modal so users can VIEW profiles
2. **Phase 2:** Add tabs and follow system so users can INTERACT with profiles
3. **Phase 3:** Add editing and achievements so users can CUSTOMIZE profiles
4. **Phase 4:** Polish, optimize, and test so it's PRODUCTION READY

---

## 📱 Current vs Required (Side-by-Side)

### Profile Tab
| Feature | Current | Required |
|---------|---------|----------|
| Avatar | ✅ Initial | ✅ Initial |
| Role Badge | ❌ None | ✅ Color-coded pill |
| Stats | ⚠️ 2 cards | ✅ 5 cards |
| Banner | ❌ None | ✅ Upload image |
| Bio | ❌ None | ✅ Edit 150 chars |
| Achievements | ❌ None | ✅ Top 3 display |
| Tabs | ❌ None | ✅ Posts/Activity/Stats |

### Profile Viewing
| Entry Point | Current | Required |
|-------------|---------|----------|
| Team Tab | ⚠️ Calendar modal | ✅ Profile modal |
| Explore Feed | ❌ Not clickable | ✅ Click → profile |
| Leaderboard | ❌ Not clickable | ✅ Click → profile |
| Own Profile | ⚠️ Basic cards | ✅ Enhanced layout |

### Social Features
| Feature | Current | Required |
|---------|---------|----------|
| Follow/Unfollow | ❌ None | ✅ Button + count |
| Posts Grid | ❌ None | ✅ 3-col Instagram |
| Activity Timeline | ❌ None | ✅ Chronological |
| Stats Chart | ❌ None | ✅ 30-day trend |

---

## 🔧 Top 5 Critical Tasks

### 1. Create UserProfileModal
**File:** `/components/user-profile-modal.tsx` (NEW)  
**Code:**
```tsx
export function UserProfileModal({ 
  userId, 
  currentUser, 
  isOwnProfile, 
  onClose 
}) {
  // Modal with banner, stats, tabs
  return <div>...</div>
}
```

### 2. Replace Wrong Modal
**File:** `/components/role-dashboards.tsx` (EDIT line 1349)  
**Change:**
```tsx
// BEFORE ❌
<SEQuickViewModal se={selectedSE} ... />

// AFTER ✅
<UserProfileModal userId={selectedSE?.id} ... />
```

### 3. Add Follow System
**Database:**
```sql
CREATE TABLE follows (
  follower_id UUID,
  following_id UUID,
  created_at TIMESTAMP
);
```

### 4. Build Posts Grid Tab
**File:** `/components/profile/posts-grid-tab.tsx` (NEW)  
**Layout:**
```
┌────┐ ┌────┐ ┌────┐
│img │ │img │ │img │  3 columns
└────┘ └────┘ └────┘
```

### 5. Add Profile Clicks
**Files:** `social-feed.tsx`, `leaderboard-enhanced-unified.tsx`  
**Add:**
```tsx
onClick={() => openProfile(user.id)}
```

---

## 📊 UAT Test Status (Quick View)

### By Priority
- 🔴 **Critical** (30 tests): Own profile view/edit, viewing other profiles
- 🟡 **High** (12 tests): Performance, tabs, integration points
- 🟢 **Medium** (5 tests): Achievements, mobile, edge cases
- ⚪ **Low** (3 tests): Visual polish, tooltips

### By Status
- ✅ **Pass** (5 tests): Basic navigation, some layout
- ❌ **Fail** (45 tests): Most features
- ⚠️ **Warning** (0 tests): None yet

### By Category (Top 3 Failures)
1. **Own Profile - Edit** (5/5 failing) - No editing at all
2. **Own Profile - Tabs** (6/6 failing) - Tabs don't exist
3. **Viewing SE Profiles** (8/8 failing) - Wrong modal used

---

## 🎨 Role Badge Colors

Quick reference for role badges:

| Role | Badge Text | Color | Hex Code |
|------|------------|-------|----------|
| SE | Sales Executive | Gray | #6B7280 |
| ZSM | Zone Sales Manager | Blue | #3B82F6 |
| ZBM | Zonal Business Manager | Green | #10B981 |
| HQ | HQ Command Center | Orange | #F97316 |
| Director | Director | Purple | #8B5CF6 |

---

## 📁 Files to Create

### New Components (8 files)
1. `/components/user-profile-modal.tsx` - Main profile modal
2. `/components/role-badge.tsx` - Badge component
3. `/components/profile/stats-cards.tsx` - 5 stat cards
4. `/components/profile/posts-grid-tab.tsx` - Posts grid
5. `/components/profile/activity-tab.tsx` - Activity timeline
6. `/components/profile/stats-tab.tsx` - Stats chart
7. `/components/profile/bio-editor.tsx` - Bio editing
8. `/components/profile/banner-upload.tsx` - Banner upload
9. `/components/profile/follow-button.tsx` - Follow/unfollow
10. `/components/profile/achievements-section.tsx` - Achievements

### Files to Edit (3 files)
1. `/components/role-dashboards.tsx` - Replace modal, redesign profile tab
2. `/components/social-feed.tsx` or `/components/explore-feed.tsx` - Add profile clicks
3. `/components/leaderboard-enhanced-unified.tsx` - Add profile clicks

### Database Changes (1 table)
1. Create `follows` table

### API Endpoints (5 new)
1. `POST /api/follow`
2. `DELETE /api/unfollow`
3. `GET /api/followers/:userId`
4. `GET /api/following/:userId`
5. `GET /api/follow-status/:userId`

---

## 💡 Common Questions & Answers

### Q: Where do I start?
**A:** Create `/components/user-profile-modal.tsx` first. It's the foundation.

### Q: Can I skip Phase 1 and go straight to Phase 2?
**A:** No. Phase 2 depends on Phase 1. Build incrementally.

### Q: What if I don't have achievements data?
**A:** Mock it for now or skip achievements (defer to Phase 3).

### Q: How do I test my changes?
**A:** Open the UAT modal (`setShowUATModal(true)`) and mark tests as Pass/Fail.

### Q: What's the most critical missing feature?
**A:** The UserProfileModal component. Without it, 30+ tests can't even be performed.

### Q: How do I know when I'm done?
**A:** When all 50 UAT tests pass. Track progress daily.

---

## 🚀 Quick Start Commands

### 1. Create the modal file
```bash
touch /components/user-profile-modal.tsx
```

### 2. Install dependencies
```bash
npm install recharts  # For Stats tab chart
```

### 3. Create Supabase storage buckets
```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('make-28f2f653-profile-banners', 'make-28f2f653-profile-banners', true),
  ('make-28f2f653-profile-pictures', 'make-28f2f653-profile-pictures', true);
```

### 4. Create follows table
```sql
-- Run in Supabase SQL editor
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

---

## 📅 Daily Progress Template

Copy this for daily standups:

```markdown
### ZSM Profile - Day [X] Update

**Completed:**
- [ ] Task: [Name]
- [ ] Task: [Name]

**In Progress:**
- [ ] Task: [Name]

**Blockers:**
- [None / List blockers]

**UAT Progress:**
- [X]/50 tests passing (up from [Y] yesterday)

**Tomorrow:**
- [ ] Task: [Name]
```

---

## 🎯 Success Criteria Checklist

### Phase 1 Done When:
- [ ] UserProfileModal component exists
- [ ] Can open profiles from Team tab
- [ ] Role badges display
- [ ] 5 stats cards show
- [ ] Posts tab renders
- [ ] 15+ UAT tests pass

### Phase 2 Done When:
- [ ] All Phase 1 items
- [ ] Can open profiles from Explore
- [ ] Can open profiles from Leaderboard
- [ ] Follow/unfollow works
- [ ] Activity tab shows timeline
- [ ] Stats tab shows chart
- [ ] 30+ UAT tests pass

### Phase 3 Done When:
- [ ] All Phase 2 items
- [ ] Bio editing works
- [ ] Banner upload works
- [ ] Achievements display
- [ ] Join date shows
- [ ] 40+ UAT tests pass

### Phase 4 Done When:
- [ ] All Phase 3 items
- [ ] Settings tab complete
- [ ] Edge cases handled
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] **All 50 UAT tests pass** ✅

---

## 🔗 Quick Links

- **UAT Tests:** `/components/zsm-profile-uat.tsx` (50 test cases)
- **Current ZSM Dashboard:** `/components/role-dashboards.tsx` (lines 659-1600)
- **Detailed Analysis:** `/ZSM_PROFILE_ISSUES_ANALYSIS.md`
- **Visual Comparison:** `/ZSM_PROFILE_VISUAL_COMPARISON.md`
- **Full Checklist:** `/ZSM_PROFILE_IMPLEMENTATION_CHECKLIST.md`
- **Executive Summary:** `/ZSM_PROFILE_EXECUTIVE_SUMMARY.md`

---

## 🎨 Design Specs (Quick Reference)

### UserProfileModal Layout
```
┌─────────────────────────┐
│ ← User Name          ✕ │
├─────────────────────────┤
│ [Banner 1200x300]   📷 │
│      [Avatar 96px]      │
│    Name + Role Badge    │
│  📍 Location • 📅 Date  │
│      "Bio text..."      │
│ ┌───┐┌───┐┌───┐┌───┐┌─┐│
│ │Rnk││Pts││Pst││Flw││F││ 5 stats
│ └───┘└───┘└───┘└───┘└─┘│
│   🏆 Top Achievements   │
│ ┌─────────────────────┐ │
│ │ [3 achievement cards]│ │
│ └─────────────────────┘ │
│ [Posts|Activity|Stats]  │ 3 tabs
│ ┌─────────────────────┐ │
│ │  [Tab content]      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Responsive Breakpoints
- **Desktop:** 1024px+ (max-width 428px for mobile sim)
- **Tablet:** 768px - 1023px
- **Mobile:** < 768px (full-screen modal)

---

## ⚡ Performance Targets

- **Profile Load Time:** < 2 seconds
- **Follow Action:** < 500ms response
- **Chart Render:** < 1 second
- **Image Upload:** < 5 seconds (2MB max)

---

## 🔐 Security Checklist

- [ ] Edit buttons only on own profile
- [ ] Upload buttons only on own profile
- [ ] Server validates all requests
- [ ] Follow data persists to database
- [ ] Cannot edit other users' data
- [ ] Image uploads sanitized
- [ ] API endpoints check permissions

---

## 📞 Who to Ask

- **Frontend Issues:** Frontend Developer
- **Backend/API Issues:** Backend Developer
- **Database Schema:** Backend Lead
- **Design Questions:** Product Owner
- **UAT Testing:** QA Team (or self-test)

---

## 🎉 Celebration Milestones

- 🎈 **First Profile Opens:** When UserProfileModal renders
- 🎊 **First Follow:** When follow/unfollow works
- 🎯 **Half Done:** When 25 UAT tests pass
- 🏆 **Phase 1 Done:** When 15 tests pass
- 🌟 **Phase 2 Done:** When 30 tests pass
- 🚀 **Launch Ready:** When all 50 tests pass

---

**Quick Reference Version:** 1.0  
**Print this page and keep it visible while working!**  
**Update UAT count daily to track progress.**
