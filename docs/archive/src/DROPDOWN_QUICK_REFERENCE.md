# 📱 DROPDOWN QUICK REFERENCE CARD

## 🎯 5 Key Features

### 1️⃣ HIGHEST Z-INDEX
```tsx
z-[10000]  // Appears above everything
```
✅ Works even with Android keyboard open

### 2️⃣ STICKY BLUE HEADER
```tsx
bg-blue-600 + sticky top-0
```
✅ Always visible while scrolling
✅ Pulsing green ● indicator
✅ Large DONE button (44px × 80px)

### 3️⃣ BIG TOUCH TARGETS
```tsx
py-4  // 16px padding = 56px total height
```
✅ Fat-finger friendly
✅ Active state feedback (blue flash)

### 4️⃣ BACKDROP OVERLAY
```tsx
bg-black/30 backdrop-blur-[1px]
```
✅ Dims background
✅ Tap anywhere to close

### 5️⃣ KEYBOARD-AWARE HEIGHT
```tsx
max-h-[320px]  // Fits above Android keyboard
```
✅ Scrollable when long
✅ Smooth touch scrolling

---

## 🔢 Critical Numbers

| Metric | Value | Why |
|--------|-------|-----|
| **Z-Index** | 10000 | Highest layer |
| **Max Height** | 320px | Keyboard aware |
| **Touch Target** | 56px | Android standard |
| **DONE Button** | 44×80px | Thumb friendly |
| **Header Height** | 48px | Sticky control |
| **Border Width** | 2px | High contrast |
| **Shadow** | 2xl | Visual depth |

---

## 🎨 Color Guide

| Element | Color | Hex |
|---------|-------|-----|
| Header | Blue-600 | #2563eb |
| Border | Blue-500 | #3b82f6 |
| Active Dot | Green-400 | #4ade80 |
| Backdrop | Black 30% | rgba(0,0,0,0.3) |
| Active Press | Blue-100 | #dbeafe |

---

## 📐 Layout Math

```
Total Height: 320px
├─ Header: 48px (sticky)
└─ Scrollable: 272px

Touch Target: 56px
├─ Padding Top: 16px (py-4)
├─ Content: 24px
└─ Padding Bottom: 16px (py-4)

DONE Button: 44px × 80px
├─ Min Height: 44px (Apple standard)
└─ Min Width: 80px (thumb friendly)
```

---

## 🚀 Performance Tips

```tsx
// ✅ DO
WebkitOverflowScrolling: 'touch'  // Hardware accelerated
overscrollBehavior: 'contain'     // No scroll chaining
touchAction: 'pan-y'              // Vertical only

// ❌ DON'T
position: absolute  // Use fixed for backdrop
max-h-60          // Too tall for keyboard
py-2              // Too small for thumbs
```

---

## 🧪 Testing Checklist

```
Mobile Testing:
☐ Dropdown appears above keyboard
☐ DONE button reachable with thumb
☐ Options easy to tap (no mis-taps)
☐ Backdrop closes on tap
☐ Smooth scrolling
☐ Blue flash on press

Desktop Testing:
☐ Search filters work
☐ Click to close
☐ Hover states visible
☐ No mobile backdrop on desktop
```

---

## 🐛 Common Issues

### Issue: Dropdown hidden behind keyboard
**Fix:** Already applied! `max-h-[320px]`

### Issue: Hard to tap options
**Fix:** Already applied! `py-4` = 56px tall

### Issue: Can't close dropdown
**Fix:** Already applied! Backdrop + DONE button + auto-close

### Issue: Gray flash when tapping (Android)
**Fix:** Already applied! `WebkitTapHighlightColor: transparent`

---

## 📱 Android Keyboard Scenario

```
┌──────────────────┐
│ Header (10%)     │
├──────────────────┤
│ [Input ▼]        │
│ ┌──────────────┐ │
│ │ ● SHOP  DONE │ │  ← 320px
│ │ Shop A       │ │     fits
│ │ Shop B       │ │     here
│ └──────────────┘ │
├──────────────────┤
│ ⌨️ Keyboard (50%) │
└──────────────────┘
```

---

## 🎯 User Flow

1. **TAP INPUT** → Dropdown opens + backdrop
2. **TYPE SEARCH** → Results filter live
3. **TAP OPTION** → Blue flash → Auto-close
4. **OR TAP DONE** → Manual close
5. **OR TAP BACKDROP** → Cancel close

---

## 🔧 File Location

```
/components/programs/program-submit-modal.tsx

Lines: ~859-965 (Dropdown section)
```

---

## 📚 Related Docs

- `/MOBILE_FIRST_DROPDOWN_UPGRADE.md` - Full details
- `/DROPDOWN_VISUAL_SPECS.md` - Visual breakdown
- `/GPS_CAPACITOR_UPGRADE.md` - Related mobile fix

---

## ✅ Status

**READY FOR ANDROID TESTING**

Build command:
```bash
npm run build
npx cap sync android
npx cap open android
```

---

**Last Updated:** January 27, 2026
