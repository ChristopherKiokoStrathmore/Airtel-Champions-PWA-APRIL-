# ⚡ ZSM UAT - QUICK TEST GUIDE

## 🎯 WHAT CHANGED? (2-Minute Summary)

### Phase 1 - Fixed Blocking Issues
1. ✅ **Name persists** on login (was disappearing)
2. ✅ **Hall of Fame tab** now appears (5 tabs total)
3. ✅ **Team members load** correctly (was showing 0)
4. ✅ **Settings added** to profile dropdown

### Phase 2 - New Features
5. ✅ **Total Points card** shows collective team score
6. ✅ **Recent Submissions** widget with 5/10/15/30 filter
7. ✅ **Explore Feed** works with better error messages
8. ✅ **Program Analytics** now calculate correctly (was 0)

---

## 🧪 5-MINUTE TEST SCRIPT

### Test 1: Login & Name (1 min)
```
1. Log in as ZSM
2. Check: Does name appear in header? ✅/❌
3. Log out
4. Log in again
5. Check: Does name still appear? ✅/❌
```
**Expected:** Name shows both times ✅

---

### Test 2: Navigation (30 sec)
```
1. Look at bottom navigation
2. Count icons: Should be 5
   🏠 Home
   🔍 Explore
   📊 Submissions
   🏆 Hall of Fame ← NEW!
   👥 Team
3. Tap each icon
```
**Expected:** All 5 tabs open ✅

---

### Test 3: Dashboard Features (2 min)
```
1. Go to Home tab
2. At top: See blue "Zone Total Points" card? ✅/❌
3. Scroll down: See "Recent Submissions"? ✅/❌
4. Try dropdown: Change to "Last 5", "Last 10", etc.
5. Does list update? ✅/❌
6. Scroll more: See "My Team (X SEs)"? ✅/❌
7. Is X a real number (not 0)? ✅/❌
```
**Expected:** All features visible and working ✅

---

### Test 4: Explore Feed (1 min)
```
1. Tap 🔍 Explore icon
2. Does page load? ✅/❌
3. See posts OR helpful message? ✅/❌
4. Try filters: Recent, Trending, My Zone
5. Do filters change view? ✅/❌
```
**Expected:** Page loads without errors ✅

---

### Test 5: Settings (30 sec)
```
1. Tap profile avatar (top-right)
2. See dropdown menu?
3. Options should include:
   - My Profile
   - Settings ← NEW!
   - Log Out
4. Tap Settings
5. See account info? ✅/❌
```
**Expected:** Settings screen opens ✅

---

## 🔍 WHAT TO CHECK IN CONSOLE

Press **F12** (Windows) or **Cmd+Option+I** (Mac) to open Developer Tools

### Good Signs (What You Want to See):
```
✅ User loaded from localStorage: [YOUR NAME] zonal_sales_manager
✅ [ZSM] Successfully loaded 15 team members
✅ [ZSM] Loaded 10 recent submissions
✅ [Explore Feed] Loaded 5 posts
```

### Issues to Report:
```
❌ [ZSM] Error loading team: [any error message]
❌ [Explore Feed] Error response: [any error message]
⚠️ [ZSM] No team members to load submissions for
```

---

## 📝 REPORTING RESULTS

### If Something Works:
✅ Just mark it as PASS in the UAT form

### If Something Fails:
1. **Open Console** (F12)
2. **Copy all error messages** (anything with ❌)
3. **Take screenshot** of the issue
4. **Note exact steps** to reproduce
5. **Share with developer**

---

## 🎯 PRIORITY FIXES TO VERIFY

### CRITICAL (Test These First):
- [ ] ZSM-1.1: Name persists on second login
- [ ] ZSM-2.1: Dashboard loads with team data
- [ ] ZSM-2.3: Total points card shows collective score
- [ ] ZSM-2.4: Active SE count is not 0
- [ ] ZSM-9.1: Bottom nav shows 5 tabs

### HIGH (Test If Time Allows):
- [ ] ZSM-2.6: Recent submissions appear
- [ ] ZSM-3.2: Explore feed loads
- [ ] ZSM-4.2: Hall of Fame tab works
- [ ] ZSM-6.9: Program analytics not 0
- [ ] ZSM-1.3: Settings accessible

---

## 🆘 QUICK TROUBLESHOOTING

### Name Missing After Login
→ Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Team Shows 0 SEs
→ Check console for team loading messages
→ Report to developer with console logs

### Recent Submissions Empty
→ Normal if no submissions exist
→ Check if team members loaded first

### Explore Feed Empty
→ Normal if no posts in database
→ Should show helpful message, not error

### Settings Not in Dropdown
→ Hard refresh browser
→ Clear cache if needed

---

## 📊 EXPECTED RESULTS SUMMARY

| Feature | Before | After |
|---------|--------|-------|
| Name on Login | ❌ Disappears | ✅ Persists |
| Bottom Tabs | 4 tabs | ✅ 5 tabs |
| Team Count | 0 SEs | ✅ Real number |
| Total Points | ❌ Missing | ✅ Blue card |
| Recent Submissions | ❌ Missing | ✅ With filter |
| Settings | ❌ No option | ✅ In dropdown |
| Explore Feed | ❌ Not working | ✅ Works/Empty state |
| Analytics | All 0 | ✅ Real numbers |

---

## 🚀 WHAT'S NEW FOR ZSM

### Home Screen
```
┌────────────────────────┐
│ Good morning, CAROLYN  │ ← Name persists now
│ 👔 Zone Sales Manager  │
└────────────────────────┘

┌────────────────────────┐
│ 🏆 Zone Total Points   │ ← NEW!
│      12,450            │
│ From 15 SEs            │
└────────────────────────┘

┌────────────────────────┐
│ 📝 Recent Submissions  │ ← NEW!
│ [Show: Last 10 ▼]      │
│ • John - Launch Prog   │
│ • Mary - Site Survey   │
└────────────────────────┘

┌────────────────────────┐
│ 👥 My Team (15 SEs)    │ ← Now shows real count
│ • John Kamau - 850 pts │
│ • Mary Njeri - 720 pts │
└────────────────────────┘
```

### Bottom Navigation
```
Before: 🏠 🔍 📊 👥     (4 tabs)
After:  🏠 🔍 📊 🏆 👥 (5 tabs) ← 🏆 Hall of Fame added!
```

---

## ⏱️ TIME ESTIMATE

- **Full UAT:** 30-45 minutes
- **Critical Tests Only:** 10 minutes
- **Quick Smoke Test:** 5 minutes

---

## ✅ SIGN-OFF CHECKLIST

After testing, verify:
- [ ] Logged in successfully twice (name persisted)
- [ ] Saw all 5 navigation tabs
- [ ] Total Points card displayed
- [ ] Team count is not 0
- [ ] Recent Submissions section exists
- [ ] Settings accessible from dropdown
- [ ] Explore feed loaded (posts or empty state)
- [ ] Program analytics show numbers (not all 0)

**If 6+ items checked: ✅ READY FOR PRODUCTION**

---

## 🎉 SUCCESS CRITERIA

**Minimum for Go-Live:**
- ✅ Login works reliably
- ✅ Navigation functional (all 5 tabs)
- ✅ Dashboard shows team data
- ✅ No critical errors in console

**All other issues can be addressed post-launch as enhancements.**

---

**Last Updated:** January 9, 2025  
**Changes:** Phase 1 & 2 complete (8 major fixes)  
**Status:** Ready for UAT ✅

