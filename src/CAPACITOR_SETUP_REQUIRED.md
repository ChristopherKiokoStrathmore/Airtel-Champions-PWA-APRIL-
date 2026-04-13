# 🔧 CAPACITOR GEOLOCATION PLUGIN INSTALLATION REQUIRED

## Issue
The app now uses Capacitor's native Geolocation plugin, but it needs to be installed in your local development environment.

## Installation Steps

### 1. Install the Capacitor Geolocation Plugin
```bash
npm install @capacitor/geolocation
```

### 2. Sync with Android
```bash
npx cap sync android
```

This will:
- Add the plugin to your Android project
- Configure necessary permissions in `AndroidManifest.xml`
- Link native code

### 3. Verify Installation
Check that these permissions are in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

(These should be automatically added by `npx cap sync`)

### 4. Rebuild Android App
```bash
npx cap open android
```

Then in Android Studio:
- `Build > Clean Project`
- `Build > Rebuild Project`
- Run on device

## Why This Plugin?

### Native Android Location Services
- ✅ Proper permission dialogs
- ✅ Works offline (2G/3G)
- ✅ High accuracy GPS
- ✅ Battery optimized
- ✅ Integrates with Android settings

### Files Using Geolocation
1. `/components/programs/program-submit-modal.tsx` - Auto GPS capture on submission
2. `/components/camera-capture.tsx` - GPS metadata on photos
3. `/components/programs/program-form.tsx` - Manual GPS capture button

## Alternative: Testing in Figma Preview

The Figma preview environment **cannot test native Capacitor plugins**. You will see errors like:
```
Location unavailable in preview - will work on deployed app
```

This is expected behavior. The app gracefully handles this and continues without GPS in the preview.

## Full Capacitor Plugins Used

Your app likely uses these Capacitor plugins:
```bash
# Core
npm install @capacitor/core
npm install @capacitor/cli --save-dev

# App lifecycle
npm install @capacitor/app

# Geolocation (NEW)
npm install @capacitor/geolocation

# Camera (if used)
npm install @capacitor/camera

# Device info (if used)
npm install @capacitor/device

# Network (if used)
npm install @capacitor/network
```

## Documentation
- Official Docs: https://capacitorjs.com/docs/apis/geolocation
- GitHub: https://github.com/ionic-team/capacitor-plugins/tree/main/geolocation

## Date Created
January 27, 2026
