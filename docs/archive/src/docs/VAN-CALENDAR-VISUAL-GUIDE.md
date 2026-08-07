# 🎯 VAN CALENDAR LOCATION - VISUAL GUIDE

## YOUR CURRENT SCREEN:
```
┌─────────────────────────────────────┐
│ Good evening, SHARON WANJOHI        │
│ 🔵 Zone Sales Manager               │
├─────────────────────────────────────┤
│ [Name] [Today] [Pending]            │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MINI ROAD SHOW -CHECK OUT       │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MINI ROAD SHOW -CHECK IN        │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AMB REVALIDATION                │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## AFTER VAN CALENDAR IS ENABLED:
```
┌─────────────────────────────────────┐
│ Good evening, SHARON WANJOHI        │
│ 🔵 Zone Sales Manager               │
├─────────────────────────────────────┤
│ [Name] [Today] [Pending]            │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │ ← NEW!
│ │  🚐 Van Weekly Calendar         │ │
│ │  Submit weekly van routes       │ │
│ │                              ▶  │ │
│ └─────────────────────────────────┘ │
│    ↑ BLUE GRADIENT BACKGROUND ↑    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MINI ROAD SHOW -CHECK OUT       │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ MINI ROAD SHOW -CHECK IN        │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AMB REVALIDATION                │ │
│ │ 📊 10 pts  👥 0 submissions     │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## THE VAN CALENDAR CARD DETAILS:

```
┌─────────────────────────────────────┐
│  🚐                                  │  ← Truck icon in white circle
│  Van Weekly Calendar            ▶   │  ← Bold title + arrow
│  Submit weekly van routes and       │  ← Description text
│  schedules                          │
└─────────────────────────────────────┘
   ↑ Blue gradient (blue-500 to blue-600)
   ↑ White text
   ↑ Slightly elevated shadow on hover
```

---

## EXACT POSITION:

**Van Calendar appears:**
- ✅ At the VERY TOP of the programs list
- ✅ RIGHT ABOVE "MINI ROAD SHOW -CHECK OUT"
- ✅ BEFORE any other program cards
- ✅ After the Name/Today/Pending filter tabs

---

## WHEN YOU CLICK IT:

```
┌─────────────────────────────────────┐
│ ← 🚐 Van Weekly Calendar - Submit   │  ← Blue header
│    Routes                           │
├─────────────────────────────────────┤
│                                     │
│  [Van Calendar Form Opens Here]     │
│                                     │
│  - Select Van                       │
│  - Fill Monday-Sunday schedules     │
│  - Submit button                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 STYLING DETAILS:

- **Background**: Gradient from blue-500 to blue-600
- **Border**: 2px solid blue-700
- **Text Color**: White
- **Border Radius**: Rounded-xl (12px)
- **Padding**: p-4 (16px)
- **Hover Effect**: 
  - Shadow grows (shadow-xl)
  - Slightly scales up (scale-[1.02])
- **Active Effect**: Scales down (scale-[0.98])

---

## 📱 MOBILE vs DESKTOP:

**Same on both!** The Van Calendar card:
- Takes full width
- Appears at the top
- Same blue styling
- Same truck icon
- Responsive text sizes

---

## 🔍 HOW TO FIND IT:

1. **Open Airtel Champions app**
2. **Click 2nd icon from left in bottom nav** (Programs)
3. **Scroll to the very top** of the programs list
4. **Look for the BLUE card** (stands out from white program cards)
5. **See "🚐 Van Weekly Calendar"**
6. **Click it!**

---

## ✅ ENABLE NOW:

```sql
-- Run this in Supabase SQL Editor:
INSERT INTO kv_store_28f2f653 (key, value)
VALUES ('feature_van_calendar_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true';
```

Then refresh your app and look at the Programs screen - you'll see it! 🎉
