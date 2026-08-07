# ⚡ TAI - Immediate Action Items
## Post-UAT Session 1 Priority Tasks

---

## ✅ COMPLETED THIS SESSION (3 Critical Fixes)

1. ✅ **AUTH-003**: PIN validation security fix
2. ✅ **HQ Dashboard**: Routing to correct dashboard
3. ✅ **Points Award**: Auto-update user total_points on approval

---

## 🔥 TOP 5 URGENT FIXES (Do These Next)

### **1. Fix Welcome Message** ⏱️ 15 minutes
**File**: `/App.tsx`  
**Line**: 863  
**Change**:
```typescript
// OLD
const userName = userData?.full_name || user?.full_name || user?.user_metadata?.full_name || 'Sales Executive';

// NEW
const userName = user?.full_name || userData?.full_name || 'Sales Executive';
```
**Why**: Check fresh login data (`user`) before cached data (`userData`)

---

### **2. Fix ZSM Team Showing 0 SEs** ⏱️ 30-60 minutes
**Requires**: Database investigation first

**Step 1 - Diagnose** (Run in Supabase SQL Editor):
```sql
-- Check if ZSM field is populated
SELECT 
  role,
  COUNT(*) as total,
  COUNT(zsm) as with_zsm_assigned
FROM app_users 
WHERE role = 'sales_executive'
GROUP BY role;
```

**Step 2 - If zsm field is null, assign SEs to ZSMs**:
```sql
-- Option A: Assign by zone (if ZSM and SE share same zone)
UPDATE app_users SET zsm = (
  SELECT employee_id FROM app_users zsm_table
  WHERE zsm_table.role = 'zonal_sales_manager' 
  AND zsm_table.zone = app_users.zone 
  LIMIT 1
)
WHERE role = 'sales_executive' AND zsm IS NULL;

-- Option B: Manual assignment (use demo data structure)
UPDATE app_users SET zsm = '710000001' WHERE employee_id IN ('789274454', '712345678');
-- Repeat for each ZSM
```

**Step 3 - Verify**:
```sql
SELECT COUNT(*) as team_size 
FROM app_users 
WHERE role = 'sales_executive' AND zsm = '710000001';
```

---

### **3. Add Close Button to SE Quick View Modal** ⏱️ 10 minutes
**File**: `/components/role-dashboards.tsx`  
**Search for**: `setSelectedUserProfile` or SE profile modal  

**Add**:
```typescript
{/* Close Button - Add to modal header */}
<button 
  onClick={() => setSelectedUserProfile(null)}
  className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors z-10"
  aria-label="Close"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>
```

---

### **4. Fix Hall of Fame Visibility for SE** ⏱️ 20 minutes
**File**: `/App.tsx`  
**Search for**: Bottom navigation for SE role  

**Ensure Hall of Fame tab is included**:
```typescript
const bottomNavTabs = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'explore', label: 'Explore', icon: '🔍' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'halloffame', label: 'Hall of Fame', icon: '👑' }, // ADD THIS
  { id: 'profile', label: 'Profile', icon: '👤' }
];
```

---

### **5. Fix Leaderboard Search (Name-Based)** ⏱️ 30 minutes
**File**: `/App.tsx`  
**Search for**: Leaderboard filter logic  

**Add name search**:
```typescript
const [searchQuery, setSearchQuery] = useState('');

// In the render
<input
  type="text"
  placeholder="Search by name..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
/>

// In the filter logic
let filteredUsers = allUsers;

if (searchQuery.trim()) {
  filteredUsers = filteredUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}

if (selectedZone) {
  filteredUsers = filteredUsers.filter(u => u.zone === selectedZone);
}

if (selectedZSM) {
  filteredUsers = filteredUsers.filter(u => u.zsm === selectedZSM);
}
```

---

## 📋 MEDIUM PRIORITY (This Week)

### **6. Fix HQ Explore 500 Error**
**File**: `/supabase/functions/server/social.tsx`  
**Line**: ~217  
**Add empty state handling**:
```typescript
if (!allPostsKeys || allPostsKeys.length === 0) {
  return c.json({ 
    success: true, 
    posts: [], 
    total: 0,
    message: 'No posts yet. Be the first to share!'
  });
}
```

---

### **7. Fix ZBM Card Text Visibility**
**File**: `/components/role-dashboards.tsx`  
**Search for**: ZBM zone cards "Total SEs", "Active", "Total points"  
**Change**: `text-white` → `text-gray-800` or `text-black`

---

### **8. Remove Career Paths**
**Files**: 
- `/components/role-dashboards.tsx` (all profiles)
- `/App.tsx` (SE profile)

**Search for**: "Career Path" or "career_path"  
**Action**: Delete entire section

---

### **9. Remove Direct Line from Non-Directors**
**File**: `/App.tsx`  
**Line**: ~967  
**Wrap in condition**:
```typescript
{/* Director Line - ONLY for SEs */}
{userData?.role === 'sales_executive' && (
  <button onClick={() => setShowDirectorLine(true)} ...>
    {/* icon */}
  </button>
)}
```

---

## 🧪 RE-TEST AFTER FIXES

After completing fixes 1-5, re-run these UAT test cases:

| Test ID | Test Case | Expected Result |
|---------|-----------|-----------------|
| AUTH-003 | Login wrong PIN | ❌ Error shown |
| SE-001 | Home dashboard | ✅ Points display |
| SE-002 | Points accuracy | ✅ Match database |
| SE-011 | Hall of Fame | ✅ Visible |
| SE-009 | Leaderboard search | ✅ Search by name |
| ZSM-004 | Team members | ✅ Shows SEs |
| ZSM-005 | SE quick view | ✅ Has close button |
| ZBM-003 | Zone cards | ✅ Readable text |
| HQ-011 | Explore feed | ✅ Loads without error |

---

## 📊 PROGRESS TRACKER

- [x] **Session 1**: 3 critical fixes completed
- [ ] **Session 2**: 5 urgent fixes (welcome, ZSM team, modal, hall of fame, search)
- [ ] **Session 3**: 4 medium fixes (HQ explore, ZBM colors, remove career paths, remove director line)
- [ ] **Session 4**: Enhancement features (announcements comments, past announcements, etc.)
- [ ] **Session 5**: Final UAT pass-through & deployment prep

**Target**: 95%+ pass rate before deployment  
**Current**: 75.8% pass rate  
**After Session 2 fixes**: Expected 85%+ pass rate

---

## 💻 DEVELOPER WORKFLOW

```bash
# 1. Pull latest code
git pull origin main

# 2. Create a branch for fixes
git checkout -b uat-fixes-session-2

# 3. Make fixes 1-5 above

# 4. Test locally
npm run dev

# 5. Commit and push
git add .
git commit -m "UAT fixes: welcome msg, ZSM team, modal close, hall of fame, search"
git push origin uat-fixes-session-2

# 6. Deploy to staging
# (Your deployment process here)

# 7. Notify tester to re-test
```

---

## 📞 COMMUNICATION

**After completing fixes 1-5**, notify UAT tester:

> **Subject**: UAT Session 2 Fixes Ready for Testing
> 
> Hi Christopher,
> 
> I've completed 5 additional fixes based on your UAT feedback:
> 
> 1. ✅ Welcome message now shows correct name
> 2. ✅ ZSM can now see their team members
> 3. ✅ SE quick view modal has close button
> 4. ✅ Hall of Fame now visible for SEs
> 5. ✅ Leaderboard search now works by name
> 
> Please re-test these specific test cases:
> - AUTH-003, SE-001, SE-002, SE-009, SE-011
> - ZSM-004, ZSM-005
> 
> Also, the 3 critical fixes from Session 1 are ready:
> - PIN validation (AUTH-003)
> - HQ dashboard routing (HQ-001)
> - Points award on approval (SE-002, PROG-005)
> 
> Let me know the results!
> 
> Thanks,
> [Your Name]

---

## 🎯 SUCCESS CRITERIA

Before moving to deployment:
- [ ] All 5 urgent fixes tested and passing
- [ ] ZSM dashboard fully functional (can see team)
- [ ] SE dashboard fully functional (points, hall of fame, search)
- [ ] HQ dashboard fully functional (explore feed works)
- [ ] UAT pass rate > 90%
- [ ] No critical bugs
- [ ] No security issues

---

**Quick Wins**: Fixes #1, #3, #4, #5 are code-only (1 hour total)  
**Needs Investigation**: Fix #2 (ZSM team) may require DB work

**Start with the quick wins, then tackle the database issue!**
