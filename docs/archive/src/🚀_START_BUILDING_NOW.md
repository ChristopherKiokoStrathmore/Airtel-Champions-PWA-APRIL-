# 🚀 START BUILDING THE FLUTTER APP NOW!

**Quick Start Guide - Get Running in 30 Minutes**

---

## ✅ WHAT YOU NEED

- ✅ Flutter SDK installed ([flutter.dev](https://flutter.dev))
- ✅ Android Studio OR Xcode
- ✅ VS Code (recommended) with Flutter extension
- ✅ Supabase account (you already have this!)

---

## 📋 STEP-BY-STEP (Copy-Paste Commands)

### **1. CREATE PROJECT (2 minutes)**

```bash
# Create Flutter project
flutter create sales_intelligence_airtel
cd sales_intelligence_airtel

# Verify Flutter is working
flutter doctor

# Expected output: All checkmarks or acceptable warnings
```

---

### **2. ADD DEPENDENCIES (3 minutes)**

Replace `pubspec.yaml` with this:

```yaml
name: sales_intelligence_airtel
description: Airtel Kenya Sales Intelligence Network
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Supabase & Backend
  supabase_flutter: ^2.0.0
  
  # State Management
  flutter_riverpod: ^2.4.9
  
  # Navigation
  go_router: ^12.1.1
  
  # Camera & Media
  camera: ^0.10.5+5
  image_picker: ^1.0.5
  image: ^4.1.3
  path_provider: ^2.1.1
  
  # Location
  geolocator: ^10.1.0
  permission_handler: ^11.0.1
  
  # Storage & Caching
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.2
  cached_network_image: ^3.3.0
  
  # Network
  dio: ^5.4.0
  connectivity_plus: ^5.0.2
  
  # UI
  flutter_animate: ^4.3.0
  shimmer: ^3.0.0
  
  # Utils
  intl: ^0.18.1
  uuid: ^4.2.1
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
```

Then run:
```bash
flutter pub get
```

---

### **3. CREATE FOLDER STRUCTURE (1 minute)**

```bash
mkdir -p lib/app
mkdir -p lib/core/constants
mkdir -p lib/core/services
mkdir -p lib/features/auth/screens
mkdir -p lib/features/auth/providers
mkdir -p lib/features/home/screens
mkdir -p lib/features/capture/screens
mkdir -p lib/features/leaderboard/screens
mkdir -p lib/features/profile/screens
mkdir -p lib/features/submissions/screens
mkdir -p lib/widgets
mkdir -p assets/images
```

---

### **4. GET YOUR SUPABASE KEYS (2 minutes)**

1. Go to: https://supabase.com/dashboard/project/xspogpfohjmkykfjadhk/settings/api
2. Copy:
   - **Project URL**: `https://xspogpfohjmkykfjadhk.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### **5. CREATE CORE FILES (10 minutes)**

I'll give you the 5 essential files to copy-paste:

#### **File 1: lib/core/constants/colors.dart**
```dart
import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFFE20000);
  static const Color gold = Color(0xFFFFD700);
  static const Color success = Color(0xFF00C851);
  static const Color warning = Color(0xFFFF8800);
  static const Color error = Color(0xFFE20000);
}
```

#### **File 2: lib/core/services/supabase_service.dart**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static const String supabaseUrl = 'YOUR_PROJECT_URL_HERE';
  static const String supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
  
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}
```
**⚠️ IMPORTANT**: Replace `YOUR_PROJECT_URL_HERE` and `YOUR_ANON_KEY_HERE` with your actual Supabase credentials!

#### **File 3: lib/app/theme.dart**
```dart
import 'package:flutter/material.dart';
import '../core/constants/colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.gold,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
```

#### **File 4: lib/main.dart**
```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/services/supabase_service.dart';
import 'app/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  
  await Hive.initFlutter();
  await SupabaseService.initialize();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Airtel Sales Intelligence',
      theme: AppTheme.lightTheme,
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: const Color(0xFFE20000),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.signal_cellular_alt,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 32),
              
              const Text(
                'Sales Intelligence',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              const Text(
                'Welcome to Airtel Kenya\'s\nSales Intelligence Network',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 48),
              
              SizedBox(
                width: double.infinity,
                height: 120,
                child: ElevatedButton(
                  onPressed: () {},
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.camera_alt, size: 48, color: Colors.white),
                      SizedBox(height: 8),
                      Text(
                        '📸 CAPTURE INTEL',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

### **6. RUN THE APP! (2 minutes)**

```bash
# Check connected devices
flutter devices

# Run on your device
flutter run

# OR run on specific device
flutter run -d chrome  # For web testing
flutter run -d emulator-5554  # For Android
flutter run -d iPhone  # For iOS simulator
```

---

## ✅ YOU SHOULD SEE

A working app with:
- ✅ Airtel red theme
- ✅ Logo on top
- ✅ "Sales Intelligence" title
- ✅ Big "CAPTURE INTEL" button

**This is your WORKING BASE!** 🎉

---

## 🔧 TROUBLESHOOTING

### **"Supabase initialization failed"**
- Check you replaced `YOUR_PROJECT_URL_HERE` and `YOUR_ANON_KEY_HERE` in `supabase_service.dart`

### **"Permission denied" on Android**
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
```

### **Can't find devices**
```bash
# For Android
flutter emulators --launch Pixel_5_API_33

# For iOS
open -a Simulator
```

---

## 📱 NEXT STEPS (After You Have It Running)

**Phase 1** (Today - Get it running):
1. ✅ Run the basic app above
2. ✅ See the home screen
3. ✅ Verify Supabase connection

**Phase 2** (Tomorrow - Add auth):
1. Copy login screen from `/📱_FLUTTER_APP_BUILD_GUIDE.md`
2. Test login with employee ID
3. Navigate to home after login

**Phase 3** (This week - Add features):
1. Add camera screen
2. Add leaderboard
3. Add profile
4. Connect to real Supabase data

---

## 📚 DOCUMENTATION AVAILABLE

You have everything you need in:

1. **`/📱_FLUTTER_APP_BUILD_GUIDE.md`** - Complete app structure
2. **`/📱_FLUTTER_REMAINING_SCREENS.md`** - All screens (camera, leaderboard, profile)
3. **`/🚀_START_BUILDING_NOW.md`** - This file (quick start)

---

## 🎯 YOUR 30-MINUTE CHECKLIST

- [ ] Create Flutter project
- [ ] Add dependencies (pubspec.yaml)
- [ ] Create folder structure
- [ ] Get Supabase keys
- [ ] Create 4 core files (colors, service, theme, main)
- [ ] Replace Supabase credentials
- [ ] Run `flutter pub get`
- [ ] Run `flutter run`
- [ ] See app working! 🎉

---

## 🚀 READY? START NOW!

```bash
# Run these 4 commands RIGHT NOW:
flutter create sales_intelligence_airtel
cd sales_intelligence_airtel
code .  # Opens VS Code
flutter pub get
```

Then copy-paste the files above and run!

---

🎉 **You'll have a working Flutter app in 30 minutes!**

After it's running, come back and I'll help you add:
- Authentication
- Camera with GPS
- Real Supabase data
- All other features

**GO BUILD IT! 🚀🇰🇪**
