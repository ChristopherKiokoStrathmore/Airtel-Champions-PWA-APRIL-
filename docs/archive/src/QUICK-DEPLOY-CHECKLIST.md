# ⚡ Quick Deploy Checklist - Option B

## 🎯 30-Minute Deployment Plan

### ✅ **Step 1: Backend (5 min)**
```bash
□ Open Supabase Dashboard → SQL Editor
□ Copy /UPDATE-VAN-DB.sql
□ Run it (19 vans inserted)
□ Verify Edge Functions deployed
```

### ✅ **Step 2: Build (2 min)**
```bash
npm run build
□ Check build/ folder exists
```

### ✅ **Step 3: Upload to Supabase (5 min)**
```bash
□ Dashboard → Storage → Create bucket
  Name: airtel-champions-app
  Public: ✅ YES
□ Upload ALL files from build/
□ Wait for green checkmarks
```

### ✅ **Step 4: Test URL (1 min)**
```bash
□ Open in browser:
  https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html
□ App should load ✅
```

### ✅ **Step 5: Configure Capacitor (2 min)**
```json
// capacitor.config.json
{
  "server": {
    "url": "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html"
  }
}
```

### ✅ **Step 6: Sync (2 min)**
```bash
npx cap sync android
```

### ✅ **Step 7: Build APK (10 min)**
```bash
npx cap open android
□ Build → Generate Signed Bundle / APK
□ APK → Next → Release → Finish
□ Find: android/app/release/app-release.apk
```

### ✅ **Step 8: Test (3 min)**
```bash
adb install android/app/release/app-release.apk
□ Login works
□ Dropdowns show all items
□ Vans show 19 options
```

### ✅ **Step 9: Distribute**
```bash
□ Upload APK to Google Drive / Firebase
□ Send link to 662 users
□ Include installation instructions
```

---

## 🔄 Future Updates (2 min!)

```bash
npm run build
□ Upload files to Supabase Storage
□ Done! Users updated instantly ✅
```

---

## 🚨 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| White screen | Bucket not public |
| 404 error | Wrong URL in config |
| Only 1000 items | Edge Function not deployed |
| No vans | SQL not run |

---

## 📝 Important Info to Have Ready

```
My Supabase Project ID: _________________

My App URL:
https://____________.supabase.co/storage/v1/object/public/airtel-champions-app/index.html

APK Location:
android/app/release/app-release.apk

Distribution Link: _________________
```

---

## ✅ Success Criteria

After deployment:
- [ ] 19 vans in dropdown ✅
- [ ] >1000 sites in dropdown ✅
- [ ] App loads from cloud ✅
- [ ] Future updates = 2 min ✅

---

**Full Guide:** `/DEPLOY-NOW-OPTION-B.md`

**Ready? Start now!** 🚀
