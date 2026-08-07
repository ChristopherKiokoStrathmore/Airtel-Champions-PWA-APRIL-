# 🚀 HOST REACT APP ON SUPABASE STORAGE

## 📋 Overview

This guide explains **3 methods** to host your Airtel Champions React app on Supabase Storage for **free**, so you can use it with Capacitor's remote URL feature for instant OTA updates.

---

## 🎯 Why Host on Supabase?

✅ **Free hosting** - No extra costs
✅ **Same platform** - Backend + frontend in one place  
✅ **Fast CDN** - Global edge network
✅ **Simple setup** - Just upload files
✅ **OTA updates** - Update app without rebuilding APK

---

## 🔧 METHOD 1: Supabase Dashboard (Easiest)

### **Steps:**

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets
   ```

2. **Create a Public Bucket**
   - Click "Create a new bucket"
   - Name: `airtel-champions-app`
   - Public: ✅ **YES** (very important!)
   - File size limit: `50 MB`
   - Click "Create bucket"

3. **Build Your React App** (in Figma Make)
   ```bash
   npm run build
   ```
   This creates a `build/` folder with all your files.

4. **Upload Files**
   - Click on the `airtel-champions-app` bucket
   - Click "Upload files" button
   - **Drag and drop ALL files** from your `build/` folder
   - ⚠️ Important: Upload files, NOT the folder itself
   - Wait for upload to complete (may take 2-5 minutes)

5. **Get Your App URL**
   ```
   https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html
   ```

6. **Update Capacitor Config**
   ```json
   // capacitor.config.json
   {
     "appId": "com.airtel.champions",
     "appName": "Airtel Champions",
     "webDir": "build",
     "server": {
       "url": "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html",
       "cleartext": true,
       "androidScheme": "https"
     }
   }
   ```

7. **Build APK with Remote URL**
   ```bash
   npx cap sync android
   npx cap open android
   # Build APK in Android Studio
   ```

8. **Deploy Future Updates**
   ```bash
   # Just rebuild and re-upload to Supabase Storage
   npm run build
   # Upload files via dashboard again
   # All 662 users get updates instantly! ✅
   ```

---

## 🤖 METHOD 2: API Endpoint (Automated)

I've created a **deployment server endpoint** that automates this!

### **Setup:**

1. **The endpoint is already created** at:
   ```
   POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/deploy
   ```

2. **Create a deployment script** in your project root:

   ```javascript
   // deploy.js
   const fs = require('fs');
   const path = require('path');
   const fetch = require('node-fetch');

   const PROJECT_ID = 'YOUR_PROJECT_ID';
   const ANON_KEY = 'YOUR_ANON_KEY';
   const BUILD_DIR = './build';

   async function deploy() {
     console.log('🚀 Starting deployment...');

     // Get all files from build directory
     const files = getAllFiles(BUILD_DIR);
     console.log(`📁 Found ${files.length} files`);

     // Prepare files for upload (convert to base64)
     const fileData = files.map(filePath => {
       const relativePath = path.relative(BUILD_DIR, filePath);
       const content = fs.readFileSync(filePath, 'base64');
       return { path: relativePath, content };
     });

     // Send to deployment endpoint
     const response = await fetch(
       `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-28f2f653/deploy`,
       {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${ANON_KEY}`,
         },
         body: JSON.stringify({ files: fileData }),
       }
     );

     const result = await response.json();

     if (response.ok) {
       console.log(`✅ Deployed ${result.uploaded}/${result.total} files`);
       console.log(`🌐 App URL: ${result.url}`);
     } else {
       console.error('❌ Deployment failed:', result.error);
     }
   }

   function getAllFiles(dirPath, arrayOfFiles = []) {
     const files = fs.readdirSync(dirPath);

     files.forEach(file => {
       const filePath = path.join(dirPath, file);
       if (fs.statSync(filePath).isDirectory()) {
         arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
       } else {
         arrayOfFiles.push(filePath);
       }
     });

     return arrayOfFiles;
   }

   deploy();
   ```

3. **Deploy in one command:**
   ```bash
   npm run build && node deploy.js
   ```

---

## ⚡ METHOD 3: Continuous Deployment (Best for Production)

Use a deployment service that auto-deploys to Supabase:

### **Option A: GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Supabase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Supabase
        run: node deploy.js
        env:
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
          ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

Now every push to `main` auto-deploys!

---

## 🔍 Verify Deployment

### **Check if deployed:**

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-28f2f653/deploy/status
```

Response:
```json
{
  "deployed": true,
  "url": "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html",
  "fileCount": 42,
  "bucket": "airtel-champions-app"
}
```

### **Test in browser:**

Open your app URL in a browser to verify it loads correctly.

---

## 📱 Update Capacitor Config

After deployment, update your `capacitor.config.json`:

```json
{
  "appId": "com.airtel.champions",
  "appName": "Airtel Champions",
  "webDir": "build",
  "server": {
    "url": "https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/airtel-champions-app/index.html",
    "cleartext": true,
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true
  }
}
```

Then rebuild APK **once**:

```bash
npx cap sync android
npx cap open android
# Build in Android Studio
# Distribute to 662 users
```

---

## 🎉 Benefits

After this one-time setup:

✅ **No more APK rebuilds** - Just redeploy to Supabase  
✅ **Instant updates** - All users get changes immediately  
✅ **Easy rollbacks** - Delete and re-upload old version  
✅ **Free hosting** - No additional costs  
✅ **Fast deployment** - Upload takes 2-5 minutes  

---

## 🚨 Important Notes

### **CORS Configuration**

If you get CORS errors, add this to your bucket settings:

1. Go to Storage → Buckets → airtel-champions-app → Settings
2. Enable "Custom CORS policies"
3. Add:
   ```json
   [
     {
       "origin": "*",
       "method": ["GET"],
       "maxAge": 3600
     }
   ]
   ```

### **Cache Control**

Files are cached for 1 hour by default. To force refresh:

- Clear browser cache
- Or version your files (e.g., `app.v2.js`)
- Or append query param: `?v=2`

### **File Size Limits**

- Maximum file size: 50 MB per file
- Maximum bucket size: 100 GB (way more than needed)

---

## 🔄 Deployment Workflow

### **Development Phase (Now):**

```
1. Make changes in Figma Make
   ↓
2. Test in browser
   ↓
3. npm run build
   ↓
4. Upload to Supabase Storage (2 mins)
   ↓
5. All 662 users get updates instantly! ✨
```

### **Before App Store Launch:**

```
Option A: Keep remote URL (recommended)
- Fastest updates
- Easy bug fixes
- Requires internet

Option B: Switch to bundled
- Works offline
- Slower updates (need APK rebuild)
- Traditional app model
```

---

## ❓ Troubleshooting

### **Problem: Files not loading**

**Solution:** Check bucket is public:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'airtel-champions-app';
-- public column should be TRUE
```

### **Problem: MIME type errors**

**Solution:** Files uploaded via dashboard get correct MIME types automatically. If using API, ensure you set `contentType` correctly.

### **Problem: App shows white screen**

**Solution:**
1. Check browser console for errors
2. Verify all files uploaded (especially index.html)
3. Check paths in index.html match uploaded structure

---

## 📊 Comparison

| Method | Setup Time | Ease of Use | Automation |
|--------|------------|-------------|------------|
| **Dashboard** | 5 mins | ⭐⭐⭐⭐⭐ | Manual |
| **API Endpoint** | 15 mins | ⭐⭐⭐⭐ | Semi-auto |
| **GitHub Actions** | 30 mins | ⭐⭐⭐ | Fully auto |

---

## 🎯 Recommended Approach

**For your situation (662 users in development):**

1. **Week 1:** Use Method 1 (Dashboard) - Get familiar
2. **Week 2:** Set up Method 2 (API) - Faster deployments
3. **Production:** Method 3 (GitHub Actions) - Fully automated

---

## 🚀 Next Steps

1. [ ] Choose a method above
2. [ ] Deploy your current build
3. [ ] Test the URL in browser
4. [ ] Update capacitor.config.json
5. [ ] Build ONE final APK with remote URL
6. [ ] Distribute to 662 users
7. [ ] Future updates = just redeploy to Supabase! 🎉

---

## 💡 Pro Tips

- **Version your URLs:** Use `airtel-champions-app-v1`, `airtel-champions-app-v2` for staged rollouts
- **A/B Testing:** Create two buckets and test features with different users
- **Rollback:** Keep old versions in separate buckets for instant rollback
- **Monitoring:** Check Storage logs in Supabase dashboard

---

## ✅ Success Checklist

- [ ] Bucket created and set to PUBLIC
- [ ] All build files uploaded
- [ ] App loads in browser
- [ ] capacitor.config.json updated with remote URL
- [ ] New APK built with remote URL config
- [ ] APK distributed to users
- [ ] Tested OTA update by redeploying

---

Need help with any step? Let me know! 🚀
