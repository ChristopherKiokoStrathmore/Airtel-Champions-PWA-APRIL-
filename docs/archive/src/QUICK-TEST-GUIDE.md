# TAI App - Quick Test Guide
## 5-Minute Functionality Check

---

## ✅ **SALES EXECUTIVE (SE) TEST - 5 mins**

### Login
- Phone: `+254712345678` (or your test SE)
- PIN: `1234`

### Test Navigation (Click each icon):
1. **🏠 Home** → Should show dashboard with stats
2. **📊 Leaderboard** → Should show all SEs ranked
3. **🏆 Hall of Fame** → Should show top performers
4. **🔍 Explore** → Should show social feed
5. **👤 Profile** → Should show SE's profile

### Test Photo Upload:
1. Go to Home → Click Programs widget
2. Pick any program
3. Fill form fields
4. Take a photo
5. **Watch for:** "Compressing & Uploading..." spinner ✨
6. **Watch for:** "✅ Photo Uploaded Successfully" ✨
7. **Check:** Shows compressed file size
8. Submit form

### ✅ Pass if:
- All 5 tabs load
- Photo upload shows spinner
- Photo upload succeeds or shows retry button
- Can navigate back from any tab

---

## ✅ **ZONE SALES MANAGER (ZSM) TEST - 3 mins**

### Login
- Use ZSM test account

### Test Navigation:
1. **🏠 Home** → Shows team stats
2. **🔍 Explore** → Shows social feed
3. **📊 Submissions** → Shows analytics
4. **🏆 Leaderboard** → Should show full leaderboard ✨ **FIXED TODAY**
5. **👥 Team** → Shows SE list

### ✅ Pass if:
- All 5 tabs load
- **Leaderboard tab works** (was broken before)
- Can see team members
- Can view SE profiles

---

## ✅ **ZONAL BUSINESS MANAGER (ZBM) TEST - 3 mins**

### Login
- Use ZBM test account

### Test Navigation:
1. **🏠 Home** → Shows zones and ZSMs
2. **🔍 Explore** → Shows social feed
3. **📊 Submissions** → Shows analytics
4. **🏆 Leaderboard** → Should show full leaderboard ✨ **FIXED TODAY**
5. **👥 Team** → Shows ZSM list

### ✅ Pass if:
- All 5 tabs load
- **Leaderboard tab works** (was broken before)
- Can see zones
- Can click ZSM for details

---

## ✅ **HQ COMMAND CENTER TEST - 3 mins**

### Login
- Use HQ test account

### Test Navigation:
1. **🏠 Home** → Shows network stats
2. **🔍 Explore** → Shows social feed
3. **📊 Submissions** → Shows all submissions
4. **🏆 Leaderboard** → Should show full leaderboard ✨ **FIXED TODAY**
5. **👥 Users** → Shows users (might be same as leaderboard)

### ✅ Pass if:
- All tabs load
- **Leaderboard tab works** (was broken before)
- Can see all SEs
- Has "Create Announcement" button (📢)

---

## ✅ **DIRECTOR TEST - 2 mins**

### Login
- Use Director test account

### Test Navigation:
1. **🏠 Home** → Shows executive dashboard
2. **🔍 Explore** → Shows social feed
3. **📊 Submissions** → Shows analytics
4. **🏆 Leaderboard** → Should show full leaderboard ✨ **FIXED TODAY**

### ✅ Pass if:
- All 4 tabs load
- **Leaderboard tab works** (was broken before)
- Can see network metrics
- Has "Create Announcement" button (📢)

---

## 🎯 **CRITICAL TESTS (Must Pass)**

### 1. Photo Upload (SE role)
- [ ] Upload shows loading spinner
- [ ] Success message appears
- [ ] Compressed file size shown
- [ ] OR retry button if failed

### 2. Navigation (All roles)
- [ ] Every bottom nav button works
- [ ] No blank screens
- [ ] Can go back from every tab

### 3. Leaderboard (ZSM, ZBM, HQ, Director)
- [ ] **ZBM leaderboard works** ✨ NEW FIX
- [ ] **HQ leaderboard works** ✨ NEW FIX
- [ ] **Director leaderboard works** ✨ NEW FIX

---

## ❌ **FAIL CONDITIONS**

**Stop and report if:**
- ❌ Any tab shows blank screen
- ❌ Clicking nav button does nothing
- ❌ Photo upload has no spinner/feedback
- ❌ Can't navigate back
- ❌ App crashes

---

## 📱 **MOBILE DEVICE TEST**

**After desktop test, test on phone:**
1. Open app on mobile browser
2. Test SE photo upload from phone camera
3. Check if UI fits screen
4. Test on 3G/4G (not WiFi)
5. Verify upload works on slow network

**Expected:**
- Photo compression happens
- Upload takes 5-30 seconds on 3G
- Spinner shows progress
- Success or retry button appears

---

## ✅ **IF ALL TESTS PASS:**

**YOU'RE READY FOR MVP!** 🎉

Give app to 10-20 field users and start collecting feedback.

---

## ⚠️ **IF TESTS FAIL:**

**Report these details:**
1. Which role? (SE/ZSM/ZBM/HQ/Director)
2. Which tab? (Home/Explore/Submissions/Leaderboard/Team/Profile)
3. What happened? (Blank screen / Error message / Crash)
4. What did you expect?
5. Screenshot if possible

---

**Total Test Time:** 15-20 minutes for all roles
**Most Critical:** Photo upload + Leaderboard tabs
**Focus:** ZBM, HQ, Director leaderboards (just fixed today)

Good luck! 🚀
