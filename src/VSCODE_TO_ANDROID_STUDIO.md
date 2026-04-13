# 💻 Visual Studio Code → Android Studio Workflow
## Complete Step-by-Step Guide with Screenshots References

---

## 🎯 OVERVIEW

**What we're doing:**
1. Development in VS Code (where you currently work)
2. Build React app
3. Convert to Android app using Capacitor
4. Open in Android Studio
5. Build APK
6. Test on emulator/real phone

**Time required:** 2-3 hours for first-time setup

---

## 📋 PREREQUISITES

### **1. Install Required Software**

#### **✅ Already Have (You're using these):**
- [x] Visual Studio Code
- [x] Node.js (v18+)
- [x] Git

#### **⬇️ Need to Download:**

**Android Studio (Required):**
- Download: https://developer.android.com/studio
- Size: ~1GB
- Install time: 15-20 minutes
- **Installation Steps:**
  1. Run installer
  2. Choose "Standard" installation
  3. Accept all licenses
  4. Wait for SDK downloads
  5. Click "Finish"

**Java JDK (Android Studio usually includes this):**
- If needed: https://www.oracle.com/java/technologies/downloads/
- Version: JDK 11 or newer

---

## 🚀 STEP-BY-STEP WORKFLOW

---

### **PHASE 1: Setup Capacitor in VS Code**

#### **Step 1: Open Your Project in VS Code**
```bash
# Navigate to your TAI project folder
cd /path/to/tai-project

# Open in VS Code
code .
```

#### **Step 2: Open Terminal in VS Code**
- Press: `Ctrl + `` (backtick) or `View → Terminal`
- You should see your project path

#### **Step 3: Install Capacitor**
Copy-paste into terminal:
```bash
npm install @capacitor/core @capacitor/cli
```
⏱️ Wait: ~30 seconds

#### **Step 4: Initialize Capacitor**
```bash
npx cap init
```

**You'll see prompts - answer like this:**
```
? App name: TAI Sales Intelligence
? App Package ID: com.airtel.tai
? Web asset directory: dist
```

✅ **Result:** Creates `capacitor.config.ts` file

#### **Step 5: Install Android Platform**
```bash
npm install @capacitor/android
npx cap add android
```
⏱️ Wait: ~1 minute

✅ **Result:** Creates `/android` folder in your project

#### **Step 6: Install Essential Plugins**
```bash
npm install @capacitor/camera @capacitor/geolocation @capacitor/network @capacitor/app @capacitor/splash-screen @capacitor/status-bar
```
⏱️ Wait: ~30 seconds

#### **Step 7: Configure Capacitor**

Open `capacitor.config.ts` in VS Code and replace with:
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.airtel.tai',
  appName: 'TAI Sales Intelligence',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#EF4444",
      showSpinner: true,
      spinnerColor: "#FFFFFF"
    }
  }
};

export default config;
```

**Save file:** `Ctrl + S`

---

### **PHASE 2: Update Code for Mobile (Optional but Recommended)**

#### **Step 8: Add Capacitor Lifecycle Hooks**

Open `/App.tsx` in VS Code.

At the top, add imports:
```typescript
import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
```

Inside your main `App` component, add:
```typescript
useEffect(() => {
  // Hide splash screen after app loads
  SplashScreen.hide();
  
  // Style the status bar
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#EF4444' }); // Airtel red
  
  // Handle Android back button
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      CapApp.exitApp();
    } else {
      window.history.back();
    }
  });

  // Cleanup
  return () => {
    CapApp.removeAllListeners();
  };
}, []);
```

**Save file:** `Ctrl + S`

---

### **PHASE 3: Build React App**

#### **Step 9: Build for Production**

In VS Code terminal:
```bash
npm run build
```
⏱️ Wait: ~1-2 minutes

✅ **Result:** Creates `/dist` folder with optimized files

**Common errors and fixes:**
- ❌ "Type errors found" → Fix TypeScript errors first
- ❌ "Module not found" → Run `npm install`
- ❌ "Out of memory" → Run `export NODE_OPTIONS=--max_old_space_size=4096` first

---

### **PHASE 4: Sync to Android**

#### **Step 10: Copy Files to Android**
```bash
npx cap sync android
```
⏱️ Wait: ~30 seconds

✅ **Result:** Copies your built app to Android project

**What this does:**
- Copies `/dist` → `/android/app/src/main/assets/public`
- Updates Android plugins
- Syncs Capacitor configuration

---

### **PHASE 5: Open in Android Studio**

#### **Step 11: Launch Android Studio**
```bash
npx cap open android
```

⏱️ Wait: ~30 seconds for Android Studio to open

**If Android Studio doesn't open automatically:**
1. Open Android Studio manually
2. `File → Open`
3. Navigate to your project's `/android` folder
4. Click "OK"

#### **Step 12: Wait for Gradle Build**

When Android Studio opens, you'll see:
- Bottom right: "Gradle Build Running..."
- This is normal! ⏱️ Wait: 2-5 minutes (first time only)

**If you see errors:**
- Click "Sync Project with Gradle Files" (elephant icon in toolbar)
- `File → Invalidate Caches → Invalidate and Restart`

---

### **PHASE 6: Set Up Android Emulator**

#### **Step 13: Create Virtual Device (First Time Only)**

1. In Android Studio toolbar, click **Device Manager** icon
   - Or: `Tools → Device Manager`

2. Click **"Create Device"**

3. **Select Hardware:**
   - Choose: **Pixel 5** (good balance of size and performance)
   - Click **Next**

4. **Select System Image:**
   - Choose: **API Level 30** (Android 11) or higher
   - Click **Download** if not already downloaded
   - ⏱️ Wait: ~5 minutes for download
   - Click **Next**

5. **Verify Configuration:**
   - AVD Name: `Pixel_5_API_30`
   - Click **Finish**

✅ **Result:** Emulator is ready to use!

---

### **PHASE 7: Run on Emulator**

#### **Step 14: Start Emulator and Run App**

1. **Select Device:**
   - Top toolbar: Click device dropdown
   - Select your emulator: `Pixel_5_API_30`

2. **Click Run:**
   - Click green **▶ Play** button in toolbar
   - Or: `Run → Run 'app'`
   - Or: Press `Shift + F10`

3. **Wait for Emulator to Boot:**
   - ⏱️ First time: 2-3 minutes
   - ⏱️ Subsequent times: 30 seconds
   - You'll see Android boot animation

4. **Wait for App to Install:**
   - ⏱️ ~30 seconds
   - Progress shown in "Run" tab at bottom

5. **🎉 App Opens!**
   - You should see your TAI app running
   - If you see white screen, wait 10 more seconds

---

### **PHASE 8: Debug on Emulator**

#### **Step 15: Use Chrome DevTools for Debugging**

1. **Open Chrome browser** on your computer

2. **Navigate to:**
   ```
   chrome://inspect
   ```

3. **Find your app:**
   - Under "Remote Target"
   - Look for: "com.airtel.tai"
   - Click **"inspect"**

4. **Debug like a web app:**
   - Console tab: See console.log() outputs
   - Network tab: See API calls
   - Elements tab: Inspect DOM

**Pro tip:** Keep this open while testing - all errors show here!

---

### **PHASE 9: Test on Real Phone**

#### **Step 16: Enable USB Debugging on Phone**

**On your Android phone:**

1. **Enable Developer Options:**
   - Go to: `Settings → About Phone`
   - Find: "Build Number"
   - **Tap 7 times** rapidly
   - You'll see: "You are now a developer!"

2. **Enable USB Debugging:**
   - Go back to: `Settings → System → Developer Options`
   - Toggle ON: **"USB Debugging"**
   - If prompted, allow debugging

3. **Connect Phone to Computer:**
   - Use USB cable
   - On phone, tap **"Allow"** when prompted:
     - "Allow USB Debugging?"
     - Check "Always allow from this computer"
     - Tap **OK**

#### **Step 17: Run on Real Phone**

Back in Android Studio:

1. **Phone should appear in device list:**
   - Top toolbar: Device dropdown
   - You'll see your phone model (e.g., "Samsung Galaxy A20")

2. **Click Run (▶):**
   - Same as emulator!
   - App installs on your phone
   - ⏱️ Wait: ~30 seconds

3. **🎉 App Opens on Your Phone!**

---

### **PHASE 10: Build APK for Distribution**

#### **Step 18: Build Debug APK (For Testing)**

1. **In Android Studio:**
   - Menu: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - ⏱️ Wait: ~2 minutes

2. **Locate APK:**
   - You'll see notification: "APK(s) generated successfully"
   - Click **"locate"** link
   - File location: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Share APK:**
   - Copy `app-debug.apk` to USB drive
   - Email to yourself
   - Upload to Google Drive
   - Share with testers!

#### **Step 19: Build Release APK (For Production)**

**First, create a keystore (one-time only):**

1. **In Android Studio:**
   - Menu: `Build → Generate Signed Bundle / APK`
   - Select: **APK**
   - Click **Next**

2. **Create New Keystore:**
   - Click **"Create new..."**
   - Fill in:
     - **Key store path:** `C:\Users\YourName\tai-release-key.jks`
     - **Password:** [Choose a strong password - SAVE IT!]
     - **Key alias:** `tai`
     - **Key password:** [Same as above]
     - **Validity:** 25 years
     - **Certificate:**
       - First and Last Name: Your Name
       - Organization: Airtel Kenya
       - City: Nairobi
       - Country: KE
   - Click **OK**

3. **Sign APK:**
   - Select your keystore
   - Enter passwords
   - Click **Next**
   - Select: **release**
   - Check: ✅ V1 and ✅ V2 signatures
   - Click **Finish**
   - ⏱️ Wait: ~3 minutes

4. **Locate Release APK:**
   - File location: `android/app/build/outputs/apk/release/app-release.apk`
   - This is your **production APK**!

**⚠️ CRITICAL: Backup your keystore!**
- Copy `tai-release-key.jks` to safe location
- Save passwords in password manager
- **If you lose this, you can NEVER update your app!**

---

## 🔄 REGULAR DEVELOPMENT WORKFLOW

After initial setup, here's your daily workflow:

### **In VS Code:**
```bash
# 1. Make code changes
# (edit files in VS Code)

# 2. Build
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Open Android Studio (if not already open)
npx cap open android
```

### **In Android Studio:**
```
5. Click Run ▶ button
6. Test on emulator or phone
7. If bugs → go back to VS Code → fix → repeat
```

### **Quick rebuild script (add to package.json):**
```json
"scripts": {
  "android": "npm run build && npx cap sync android"
}
```

Then just run:
```bash
npm run android
# Then click Run in Android Studio
```

---

## 🐛 TROUBLESHOOTING

### **Problem: "Gradle build failed"**
**Solution:**
```bash
# In terminal:
cd android
./gradlew clean
cd ..
npx cap sync android
```

### **Problem: "App is white screen"**
**Solution:**
1. Open Chrome: `chrome://inspect`
2. Inspect your app
3. Check Console for errors
4. Usually: build path issue
5. Fix: Check `capacitor.config.ts` → `webDir: 'dist'`

### **Problem: "Plugin not implemented"**
**Solution:**
```bash
npx cap sync android
# Then rebuild in Android Studio
```

### **Problem: Android Studio won't open**
**Solution:**
1. Open Android Studio manually
2. `File → Open`
3. Select your project's `/android` folder

### **Problem: "Cannot find Android SDK"**
**Solution:**
1. In Android Studio: `File → Project Structure`
2. SDK Location → Set to: `C:\Users\YourName\AppData\Local\Android\Sdk` (Windows)
3. Or: `/Users/YourName/Library/Android/sdk` (Mac)

### **Problem: Emulator is very slow**
**Solution:**
1. Close emulator
2. `Tools → AVD Manager`
3. Edit your device
4. `Show Advanced Settings`
5. Increase RAM: 2048 → 4096
6. Graphics: Change to "Hardware"

---

## 📊 FOLDER STRUCTURE AFTER SETUP

```
your-tai-project/
├── android/                    # ← Android Studio works here
│   ├── app/
│   │   ├── src/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               ├── debug/       # Debug APK here
│   │               └── release/     # Release APK here
│   └── build.gradle
├── dist/                       # ← Built React app
├── src/                        # ← VS Code works here
│   ├── App.tsx
│   ├── components/
│   └── ...
├── capacitor.config.ts         # ← Capacitor configuration
├── package.json
└── node_modules/
```

**Where to work:**
- 📝 **VS Code:** `/src` folder (React code)
- 📱 **Android Studio:** `/android` folder (only for building APK)

---

## ✅ FINAL CHECKLIST

Before distributing APK:

- [ ] UAT testing completed (all 200+ test cases)
- [ ] Tested on emulator
- [ ] Tested on real phone
- [ ] Tested on 2G/3G network
- [ ] Back button works properly
- [ ] App icon looks good
- [ ] Splash screen appears
- [ ] No errors in chrome://inspect console
- [ ] Offline mode works
- [ ] Release APK signed and built
- [ ] Keystore backed up securely
- [ ] Version number updated in package.json and build.gradle

---

## 🎓 HELPFUL KEYBOARD SHORTCUTS

### **VS Code:**
- `Ctrl + `` - Open terminal
- `Ctrl + P` - Quick file open
- `Ctrl + Shift + P` - Command palette
- `Ctrl + S` - Save file
- `Ctrl + B` - Toggle sidebar

### **Android Studio:**
- `Shift + F10` - Run app
- `Ctrl + F9` - Build project
- `Alt + F1` - Select target location
- `Ctrl + Alt + L` - Format code

---

## 🚀 YOU'RE ALL SET!

**Next steps:**
1. ✅ Follow Phase 1-10 above
2. ✅ Complete UAT testing
3. ✅ Build release APK
4. ✅ Distribute to 662 SEs

**Questions?** Review:
- `UAT_TEST_CASES.md` - All test cases
- `DEPLOYMENT_ADVISORY_BOARD.md` - Expert advice
- `QUICK_DEPLOYMENT_GUIDE.md` - Quick reference

**Good luck! 🎉**
