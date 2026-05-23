# 📱 TAI UAT - Quick Reference Card

**For Mobile Testing - Print or Keep on Second Device**

---

## 🔑 LOGIN CREDENTIALS (Quick Copy)

### Sales Executive (SE)
- **ID:** SE001
- **Name:** Test SE Alpha  
- **Password:** TestSE123!
- **Zone:** Nairobi

### Zonal Sales Manager (ZSM)
- **ID:** ZSM001
- **Name:** Test ZSM Beta
- **Password:** TestZSM123!
- **Zone:** Nairobi

### Zonal Business Manager (ZBM)
- **ID:** ZBM001
- **Name:** Test ZBM Gamma
- **Password:** TestZBM123!
- **Zone:** Nairobi

### HQ Command Center
- **ID:** HQ001
- **Name:** Test HQ Delta
- **Password:** TestHQ123!
- **Zone:** HQ

### Director
- **ID:** DIR001
- **Name:** Test Director Epsilon
- **Password:** TestDIR123!
- **Zone:** HQ

### Developer (Christopher)
- **ID:** DEV001
- **Name:** Christopher Dev
- **Password:** DevMaster123!
- **Zone:** System

---

## ✅ QUICK TEST CHECKLIST

### Every Role Should Be Able To:
- [ ] Login successfully
- [ ] See correct dashboard for role
- [ ] Navigate all 4 tabs (Home, Programs, Explore, Leaderboard)
- [ ] View profile
- [ ] Logout

### Sales Executive (SE) Critical Tests:
- [ ] Submit new post in Explore
- [ ] Like and comment on posts
- [ ] View leaderboard and see own rank
- [ ] View and participate in programs
- [ ] See points increase after submission

### Manager Roles (ZSM/ZBM) Critical Tests:
- [ ] View team analytics
- [ ] See zone-filtered leaderboard
- [ ] Access Explore feed
- [ ] View team member profiles
- [ ] Cannot create programs (ZBM)

### HQ/Director Critical Tests:
- [ ] View national analytics
- [ ] Create new program
- [ ] View all zones
- [ ] See nationwide leaderboard
- [ ] Create announcements

### Developer Critical Tests:
- [ ] View all users by role
- [ ] Create/Edit/Delete user
- [ ] Use Role Checker tool
- [ ] System Health shows green
- [ ] **⚠️ Reset All Points (Type: RESET ALL POINTS)**

---

## 🐛 QUICK BUG REPORT

**Found a bug? Note:**
1. What role you're logged in as
2. What you were trying to do
3. What happened (vs. what should happen)
4. Screenshot if possible
5. Your phone model & connection type

---

## 🎯 PRIORITY TEST AREAS

### 🔴 CRITICAL (Must Work):
1. Login/Logout
2. Explore Feed (view & submit)
3. Leaderboard display
4. Programs list
5. Navigation

### 🟡 HIGH (Should Work):
6. Likes & Comments
7. Filters (zone, timeframe)
8. User profiles
9. Images loading
10. Developer Reset Points

### 🟢 MEDIUM (Nice to Have):
11. Announcements
12. Real-time updates
13. Pull to refresh
14. Offline handling

---

## 📊 PERFORMANCE TARGETS

- **Page Load:** < 5 seconds (3G)
- **Image Load:** < 10 seconds (3G)
- **Form Submit:** < 3 seconds
- **Navigation:** Instant feel
- **No Crashes:** Zero tolerance

---

## ⚠️ SPECIAL TEST: RESET POINTS

**Developer Only - CRITICAL TEST**

1. Login as DEV001
2. Scroll to "Danger Zone" (red section)
3. Click "Reset All Points to Zero"
4. **Step 1:** Read warnings → Click "I Understand, Continue"
5. **Step 2:** Type exactly: `RESET ALL POINTS`
6. Click "Reset All Points"
7. Wait for success message
8. **Verify:**
   - Toast says "Successfully reset points for X users!"
   - All users now have 0 points
   - Leaderboard reset
   - Submissions still exist

**Expected:** 2-step confirmation, no accidental resets, safe operation

---

## 📞 TESTING SUPPORT

**If you need fresh test data or have issues:**
- Reset points (Developer tool)
- Clear browser cache
- Check console for errors (F12 on desktop)

---

**Good Luck Testing! 🚀**

**Document Everything - Even Small Issues!**
