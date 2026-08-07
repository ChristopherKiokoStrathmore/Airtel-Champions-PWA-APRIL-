# 🚀 AIRTEL CHAMPIONS - WEB & MOBILE DEPLOYMENT

## 📱💻 **DUAL PLATFORM SUPPORT**

This app now supports **BOTH** mobile and web platforms from a single codebase!

- **Mobile App**: Android APK via Capacitor (for 662 Sales Executives in the field)
- **Web Dashboard**: Browser-based interface (for HQ Staff, Directors, and Developers)

---

## 🎯 **PLATFORM DETECTION & ADAPTIVE UI**

The app automatically detects the platform and renders optimized UI:

### **Mobile (Capacitor)**:
- Bottom navigation
- Touch-optimized components
- Native GPS & camera
- Offline-first architecture
- Full field functionality

### **Web (Browser)**:
- Sidebar navigation  
- Data tables & advanced analytics
- Mouse/keyboard optimized
- Session analytics dashboard
- Admin tools

---

## 🔧 **DEVELOPER TOGGLE (Christopher Only)**

**Only visible to DEV001 (Christopher Kioko)**:

- Toggle button in top-right corner
- Switch between Mobile and Desktop views for testing
- **Auto** button resets to platform detection
- Persists choice in localStorage

### How to Use:
1. Login as Christopher (DEV001)
2. See toggle in top-right corner
3. Click to switch between views
4. Click "Auto" to reset to automatic detection

---

## 🚀 **DEPLOYMENT INSTRUCTIONS**

### **Option 1: Deploy Web Version (Vercel - FREE)**

```bash
# Install Vercel CLI
npm install -g vercel

# Build for web
npm run build

# Deploy to Vercel
vercel deploy --prod

# Result: https://airtel-champions.vercel.app
```

### **Option 2: Deploy Web Version (Netlify - FREE)**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build for web
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Result: https://airtel-champions.netlify.app
```

### **Option 3: Build Mobile APK**

```bash
# Build for mobile
npm run build:mobile

# Open Android Studio
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📊 **USER ROLE ACCESS**

### **Mobile App Users**:
- ✅ Sales Executives (field work)
- ✅ Zone Commanders  
- ✅ Zone Business Leads
- ✅ All roles (when using mobile APK)

### **Web Browser Users**:
- ✅ HQ Staff (analytics & reporting)
- ✅ Directors (executive dashboards)
- ✅ Developers (system administration)

---

## 🛠️ **BUILD COMMANDS**

```json
{
  "dev": "vite",                          // Local development
  "build": "vite build",                   // Build for web
  "build:web": "vite build",               // Same as build
  "build:mobile": "vite build && cap sync", // Build for mobile
  "preview": "vite preview",               // Preview web build
  "deploy:web": "vercel deploy --prod",    // Deploy to Vercel
  "deploy:mobile": "cd android && ./gradlew assembleRelease" // Build APK
}
```

---

## 🌐 **WEB DEPLOYMENT URLs**

After deployment, your web app will be accessible at:

**Vercel**: `https://airtel-champions.vercel.app`
**Netlify**: `https://airtel-champions.netlify.app`
**Custom Domain**: Configure in hosting provider dashboard

---

## 📱 **MOBILE APK DISTRIBUTION**

After building APK:

1. Test on device: `adb install android/app/build/outputs/apk/release/app-release.apk`
2. Distribute via WhatsApp, email, or internal server
3. Users install APK directly (no Play Store needed)

---

## 🎨 **FEATURES BY PLATFORM**

| Feature | Mobile | Web |
|---------|--------|-----|
| Authentication | ✅ | ✅ |
| Points System | ✅ | ✅ |
| Programs & Submissions | ✅ | ✅ |
| Leaderboard | ✅ | ✅ |
| Groups & Messaging | ✅ | ✅ |
| WebRTC Calling | ✅ | ✅ |
| **Native GPS** | ✅ | ⚠️ Browser API |
| **Native Camera** | ✅ | ⚠️ File input |
| **Offline Mode** | ✅ Full | ⚠️ Limited |
| **Push Notifications** | ✅ | ⚠️ Limited |
| **Session Analytics** | View only | ✅ Full dashboard |
| **User Management** | Limited | ✅ Full admin |
| **Data Tables** | Basic | ✅ Advanced |

---

## 🔐 **ENVIRONMENT VARIABLES**

Ensure these are set in your hosting provider:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

### **Web Deployment**:
- [ ] Deploy to Vercel/Netlify
- [ ] Test on desktop browser
- [ ] Test on tablet
- [ ] Verify HQ Staff & Directors can login
- [ ] Test session analytics dashboard
- [ ] Verify all API endpoints work
- [ ] Check CORS configuration
- [ ] Set up custom domain (optional)

### **Mobile APK**:
- [ ] Build release APK
- [ ] Test on real device
- [ ] Verify GPS accuracy
- [ ] Test offline mode
- [ ] Check camera functionality
- [ ] Distribute to test group
- [ ] Collect feedback
- [ ] Deploy to all 662 SEs

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Toggle not showing**
- **Solution**: Only visible to DEV001 (Christopher)

### **Issue: Web version shows mobile UI**
- **Solution**: Click "Desktop" button in toggle or resize browser window > 768px

### **Issue: Mobile version shows desktop UI**
- **Solution**: Click "Mobile" button in toggle or check screen size

### **Issue: Build fails**
- **Solution**: Run `npm install` and ensure all dependencies are installed

---

## 📞 **SUPPORT**

For issues or questions:
- Developer: Christopher Kioko (DEV001)
- Platform: Airtel Champions

---

## 🎉 **SUCCESS METRICS**

Track these after deployment:

- **Mobile**: 662 active SE users
- **Web**: HQ Staff, Directors, and Developers using analytics
- **Session Analytics**: Real-time login tracking working
- **Dual Platform**: Both versions deployed and functioning

---

**Built with ❤️ using React + Vite + Capacitor + Supabase**
