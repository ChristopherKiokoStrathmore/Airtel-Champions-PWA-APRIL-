# 🏗️ BUILD THE APP - EXACT COMMANDS

**Copy and paste these commands in order!**

---

## ✅ STEP 1: CREATE PROJECT (1 minute)

```bash
# Create Flutter project
flutter create sales_intelligence_airtel

# Navigate into project
cd sales_intelligence_airtel

# Open in VS Code (or your editor)
code .
```

---

## ✅ STEP 2: CREATE FOLDERS (30 seconds)

```bash
# Create all required folders
mkdir -p lib/core/constants
mkdir -p lib/core/services
mkdir -p lib/app
mkdir -p lib/features/auth/screens
mkdir -p lib/features/home/screens
mkdir -p assets/images
```

---

## ✅ STEP 3: COPY FILES

Now copy these 7 files from `/📱_READY_TO_BUILD_APP.md`:

1. **pubspec.yaml** (replace entire file)
2. **lib/core/constants/colors.dart** (new file)
3. **lib/core/services/supabase_service.dart** (new file - HAS YOUR CREDENTIALS!)
4. **lib/app/theme.dart** (new file)
5. **lib/features/home/screens/home_screen.dart** (new file)
6. **lib/features/auth/screens/login_screen.dart** (new file)
7. **lib/main.dart** (replace entire file)

---

## ✅ STEP 4: ADD ANDROID PERMISSIONS (1 minute)

Open `android/app/src/main/AndroidManifest.xml`

Add these lines BEFORE `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

---

## ✅ STEP 5: INSTALL DEPENDENCIES (1 minute)

```bash
flutter pub get
```

Wait for it to download all packages...

---

## ✅ STEP 6: RUN THE APP! (2 minutes)

```bash
# Check available devices
flutter devices

# Run on Android
flutter run

# OR run on Chrome (for quick testing)
flutter run -d chrome

# OR run on specific device
flutter run -d <device-id>
```

---

## 🎯 EXPECTED RESULT

You should see:

1. **Console output**:
```
🔄 Initializing Supabase...
✅ Supabase initialized successfully!
📍 Project URL: https://xspogpfohjmkykfjadhk.supabase.co
Launching lib/main.dart on Chrome in debug mode...
```

2. **App screen**:
- Airtel red logo
- "Sales Intelligence" title
- Employee ID field
- Password field
- "SIGN IN" button

---

## 🧪 TEST THE APP

### **Test 1: Login Screen**
1. You see the login screen
2. Type any employee ID (e.g., "SE1000")
3. Type any password
4. Tap "SIGN IN"

**If user exists in database**: You'll see home screen  
**If user doesn't exist**: You'll see error message

---

### **Test 2: Home Screen** (after login)
You should see:
- ✅ User name and employee ID at top
- ✅ Rank card (red gradient box)
- ✅ **BIG RED "CAPTURE INTEL" BUTTON**
- ✅ Three stat cards at bottom
- ✅ Bottom navigation bar

---

## 🚨 QUICK FIXES

### **"Command not found: flutter"**
Install Flutter: https://docs.flutter.dev/get-started/install

### **"No connected devices"**
```bash
# For Android
flutter emulators --launch Pixel_5_API_33

# For Chrome
flutter run -d chrome
```

### **"Package not found"**
```bash
flutter clean
flutter pub get
```

### **"Supabase error"**
Check your internet connection. Your credentials are already set!

---

## 📸 SCREENSHOT OF WHAT YOU'LL SEE

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───┐                             │
│  │ 📡│  Sales Intelligence          │
│  └───┘                             │
│                                     │
│  Sign in to start capturing intel  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏷️ Employee ID              │   │
│  │ SE1000                      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔒 Password                 │   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      🔴 SIGN IN             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST

- [ ] Created project with `flutter create`
- [ ] Created all folders
- [ ] Copied all 7 files
- [ ] Updated AndroidManifest.xml
- [ ] Ran `flutter pub get`
- [ ] Saw "✅ Supabase initialized successfully!"
- [ ] App is running
- [ ] Can see login screen

---

## 🎉 SUCCESS!

If you can see the login screen, **YOU DID IT!** 🚀

Your app is now:
- ✅ Running on your device/emulator
- ✅ Connected to Supabase
- ✅ Ready for users to login
- ✅ Ready to add more features

---

## 🚀 NEXT STEPS

After you have it running:
1. Test login with an existing SE account
2. Add camera functionality
3. Add leaderboard
4. Connect to real Supabase data
5. Add offline mode

**Everything is in the documentation!**

---

**BUILD IT NOW!** 📱

```bash
flutter create sales_intelligence_airtel && cd sales_intelligence_airtel && flutter pub get && flutter run
```
