# 🎯 QUICK START: Host on Supabase in 5 Minutes

## ⚡ Super Fast Method (Dashboard)

### **Step 1: Build Your App** (2 minutes)

In Figma Make or your terminal:
```bash
npm run build
```

This creates a `build/` folder. ✅

---

### **Step 2: Create Storage Bucket** (1 minute)

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets`

2. Click **"Create a new bucket"**

3. Fill in:
   - **Name:** `airtel-champions-app`
   - **Public:** ✅ **YES** (toggle ON)
   - **File size limit:** `50 MB`

4. Click **"Create bucket"**

---

### **Step 3: Upload Files** (2 minutes)

1. Click on the **`airtel-champions-app`** bucket

2. Click **"Upload files"** button

3. **Drag ALL files** from your `build/` folder into the browser
   - ⚠️ Upload the **files inside** the build folder, not the folder itself
   - You should see: `index.html`, `static/` folder, etc.

4. Wait for upload (green checkmarks appear)

---

### **Step 4: Get Your URL** (30 seconds)

Your app is now live at:

```
https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html
```

**Test it:** Open this URL in your browser! 🎉

---

### **Step 5: Configure Capacitor** (1 minute)

Update your `capacitor.config.json`:

```json
{
  "appId": "com.airtel.champions",
  "appName": "Airtel Champions",
  "webDir": "build",
  "server": {
    "url": "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html"
  }
}
```

**Replace `YOUR_PROJECT_ID`** with your actual Supabase project ID!

---

### **Step 6: Build APK** (5 minutes)

```bash
npx cap sync android
npx cap open android
```

In Android Studio:
- Build → Generate Signed Bundle / APK
- Select: **APK**
- Build Variant: **release**

**Distribute this APK to your 662 users** → Done! ✅

---

## 🎉 What You Just Achieved

✅ Your app is hosted on Supabase (free!)  
✅ Users will load from the cloud  
✅ Future updates = just re-upload to Supabase  
✅ **No more APK rebuilds needed!**

---

## 🔄 How to Deploy Updates

**Every time you want to update the app:**

```bash
# 1. Make changes in Figma Make
# 2. Build
npm run build

# 3. Go to Supabase Storage Dashboard
# 4. Delete old files (or overwrite)
# 5. Upload new files from build/ folder

# 6. Users get updates on next app launch! ✨
```

**Time:** 2-3 minutes per deployment!

---

## 🚨 Troubleshooting

### **App shows white screen?**

1. Check if index.html uploaded correctly
2. Open browser DevTools (F12) → Console → Check for errors
3. Verify bucket is **PUBLIC** (not private)

### **Files won't load?**

Run this SQL in Supabase SQL Editor:

```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'airtel-champions-app';

-- Allow public access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'airtel-champions-app' );
```

### **CORS errors?**

1. Storage → Buckets → airtel-champions-app → Settings
2. Add CORS policy:
   ```json
   {
     "origin": "*",
     "method": ["GET"]
   }
   ```

---

## 📊 Before vs After

### **Before (Bundled APK):**
```
Fix bug → Build → Upload APK → 662 users install manually
Time: Hours/Days 😓
```

### **After (Remote URL):**
```
Fix bug → Build → Upload to Supabase → All users updated
Time: 3 minutes ⚡
```

---

## 🎯 Next Steps

1. [ ] **Today:** Deploy current app to Supabase Storage
2. [ ] **Today:** Build APK with remote URL
3. [ ] **This week:** Test with small group (10 users)
4. [ ] **Next week:** Roll out to all 662 users
5. [ ] **Ongoing:** Deploy updates instantly via Supabase

---

## 💡 Pro Tip

Create a bookmark in your browser:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets/airtel-champions-app
```

Now you can deploy updates in literally **2 clicks**:
1. Click bookmark
2. Upload new files
3. Done! ✅

---

## ✅ Success!

Once you see your app loading from the Supabase URL in your browser, **you're done**! 

The dropdown pagination fix and all future updates will now deploy instantly to all 662 users without rebuilding the APK. 🚀

---

**Need help?** Check the full guide: `/HOST-ON-SUPABASE-STORAGE.md`
