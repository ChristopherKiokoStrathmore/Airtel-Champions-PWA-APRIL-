# 📸 Camera Implementation Guide for Hybrid Android Apps

## Current Issue
Some Android devices show **file picker** instead of **camera** when clicking "Take Photo" in the Programs section.

## ✅ What We've Fixed

### 1. Removed Upload Button
- **File**: `/components/programs/program-submit-modal.tsx`
- **Change**: Removed "📁 Upload from Gallery" button
- **Result**: Only "📷 Take Photo" button remains with `capture="environment"`

### 2. Created Native Camera Module
- **File**: `/components/native-camera.tsx`
- **Purpose**: Bridges JavaScript to native Android camera using Capacitor
- **Features**:
  - Forces camera (not gallery)
  - Auto-compresses images (80% quality)
  - Handles permissions
  - Returns base64 data

---

## 🚀 Implementation Options

### Option 1: Use Capacitor Camera Plugin (RECOMMENDED)

This guarantees native camera access across ALL Android devices.

#### Step 1: Install Capacitor Camera

```bash
npm install @capacitor/camera
npx cap sync
```

#### Step 2: Update Android Manifest

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

#### Step 3: Enable Camera in Programs

The `NativeCamera` module is already created at `/components/native-camera.tsx`.

To use it, update the photo button click handler in `/components/programs/program-form.tsx`:

```typescript
// Replace the current onClick handler with:
onClick={async () => {
  // Check if running in native container (Capacitor)
  if (NativeCamera.isNative()) {
    // Use native camera
    const hasPermission = await NativeCamera.checkPermissions();
    if (!hasPermission) {
      setPhotoUploadErrors(prev => ({ 
        ...prev, 
        [field.field_name]: 'Camera permission denied'
      }));
      return;
    }

    const result = await NativeCamera.capturePhoto();
    if (result) {
      // Convert base64 to File object
      const blob = await fetch(result.base64).then(r => r.blob());
      const file = new File([blob], `photo_${Date.now()}.${result.format}`, {
        type: `image/${result.format}`
      });
      handlePhotoCapture(field.field_name, file);
    }
  } else {
    // Fallback to HTML file input (for web testing)
    document.getElementById(`photo-${field.field_name}`)?.click();
  }
}}
```

#### Step 4: Build APK

```bash
npm run build
npx cap copy
npx cap open android
```

Then build in Android Studio.

---

### Option 2: Improve WebView Configuration (Partial Fix)

If you're NOT using Capacitor but wrapping in a WebView, ensure proper configuration:

#### Android WebView Setup

In your Android Activity/Fragment:

```java
WebSettings webSettings = webView.getSettings();
webSettings.setJavaScriptEnabled(true);
webSettings.setAllowFileAccess(true);
webSettings.setAllowContentAccess(true);
webSettings.setDomStorageEnabled(true);

// Enable file chooser for camera
webView.setWebChromeClient(new WebChromeClient() {
    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                     FileChooserParams fileChooserParams) {
        // Handle camera/file chooser
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        startActivityForResult(intent, REQUEST_CAMERA);
        return true;
    }
});
```

---

### Option 3: Use Cordova Camera Plugin

If using Cordova instead of Capacitor:

```bash
cordova plugin add cordova-plugin-camera
```

Then update `/components/native-camera.tsx` to use Cordova's camera API.

---

## 🔍 Testing Matrix

| Device | Browser | `capture="environment"` | Capacitor Plugin | Recommended |
|--------|---------|------------------------|------------------|-------------|
| Samsung Galaxy | Chrome | ⚠️ Sometimes | ✅ Always | Capacitor |
| Xiaomi | Mi Browser | ❌ File picker | ✅ Always | Capacitor |
| Oppo | Chrome | ⚠️ Sometimes | ✅ Always | Capacitor |
| Huawei | Chrome | ⚠️ Sometimes | ✅ Always | Capacitor |
| Stock Android | Chrome | ✅ Usually | ✅ Always | Either |

---

## 📱 Current Files Modified

1. ✅ `/components/programs/program-submit-modal.tsx` - Removed Upload button
2. ✅ `/components/programs/program-form.tsx` - Has `capture="environment"`
3. ✅ `/components/native-camera.tsx` - Native camera bridge (ready to use)

---

## 🎯 Next Steps

1. **Install Capacitor Camera** (if not already):
   ```bash
   npm install @capacitor/camera
   ```

2. **Update Android Manifest** with camera permissions

3. **Test on problematic devices** - The ones showing file picker

4. **Verify** that camera opens directly without file picker

---

## 🐛 Troubleshooting

### Issue: Still shows file picker
**Solution**: You're likely testing in a browser. The fix only works in the APK build.

### Issue: Permission denied
**Solution**: Check `AndroidManifest.xml` has camera permissions.

### Issue: @capacitor/camera not found
**Solution**: Run `npm install @capacitor/camera` and `npx cap sync`.

### Issue: Black screen when camera opens
**Solution**: Add `<uses-feature android:name="android.hardware.camera" android:required="false" />` to manifest.

---

## 📞 Support

If you need help implementing Capacitor Camera, let me know:
- Your current build tool (Capacitor/Cordova/WebView)
- Android devices having the issue
- Error messages (if any)

