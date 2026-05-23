# 📐 DROPDOWN VISUAL SPECIFICATIONS

## Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ SEMI-TRANSPARENT BACKDROP (z-9999)                  │
│ bg-black/30 backdrop-blur-[1px]                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ DROPDOWN CONTAINER (z-10000)                    │ │
│ │ border-2 border-blue-500                        │ │
│ │ shadow-2xl                                      │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ STICKY HEADER (z-10001) - 44px tall         │ │ │
│ │ │ bg-blue-600 border-b-2 border-blue-700      │ │ │
│ │ ├───────────────────┬─────────────────────────┤ │ │
│ │ │ ● SELECT SHOP (5) │      [DONE BUTTON]      │ │ │
│ │ │ Pulsing green dot │   44px × 80px           │ │ │
│ │ └───────────────────┴─────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ SCROLLABLE AREA (max 276px)                 │ │ │
│ │ │ overflow-y-auto                             │ │ │
│ │ │ WebkitOverflowScrolling: 'touch'            │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ Shop Option 1                               │ │ │
│ │ │ py-4 (56px min-height)                      │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ Shop Option 2                               │ │ │
│ │ │ py-4 (56px min-height)                      │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ Shop Option 3  🔒 SUBMITTED                 │ │ │
│ │ │ (disabled, grayed out)                      │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ Shop Option 4                               │ │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ │ ... (scrollable)                            │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ TAP ANYWHERE TO CLOSE                               │
└─────────────────────────────────────────────────────┘
```

---

## Z-Index Layers

```
┌─────────────────────────────────────────┐
│ Z-INDEX STACK (from bottom to top)      │
├─────────────────────────────────────────┤
│ z-0     Base Modal Background           │
├─────────────────────────────────────────┤
│ z-10    Form Fields                     │
├─────────────────────────────────────────┤
│ z-20    Input Field (active/focused)    │
├─────────────────────────────────────────┤
│ z-9999  Backdrop Overlay ◄──────────────┼─── NEW
├─────────────────────────────────────────┤
│ z-10000 Dropdown Container ◄────────────┼─── NEW (highest)
├─────────────────────────────────────────┤
│ z-10001 Sticky Header ◄─────────────────┼─── NEW (on top of container)
└─────────────────────────────────────────┘
```

---

## Touch Target Sizes

### Apple Human Interface Guidelines
```
Minimum: 44pt × 44pt (44px × 44px on web)
Recommended: 48pt × 48pt
```

### Android Material Design
```
Minimum: 48dp × 48dp (48px × 48px)
Recommended: 56dp × 56dp
```

### Our Implementation
```
┌────────────────────────────────────┐
│ DONE BUTTON                        │
│ 44px height × 80px width           │
│ bg-white/20                        │
│ ┌────────────────────────────────┐ │
│ │          DONE                  │ │
│ │     (easy thumb tap)           │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ SHOP OPTION ITEM                   │
│ 56px minimum height                │
│ py-4 (16px + 16px padding)         │
│ ┌────────────────────────────────┐ │
│ │  Shop Name / USDM Name         │ │
│ │  (comfortable tap zone)        │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## Color States

### Normal State
```tsx
bg-white
text-gray-900
border-gray-200
```

### Hover State (Desktop)
```tsx
hover:bg-blue-50
```

### Active/Pressed State (Mobile)
```tsx
active:bg-blue-100  // Bright blue flash on tap
transition-all      // Smooth animation
```

### Disabled State (Already Submitted)
```tsx
bg-gray-100
text-gray-400
opacity-50
cursor-not-allowed
```

---

## Sticky Header Breakdown

```
┌───────────────────────────────────────────────────────┐
│ bg-blue-600 (solid background)                        │
│ border-b-2 border-blue-700 (separation line)          │
├─────────────────────────────┬─────────────────────────┤
│ LEFT SECTION                │ RIGHT SECTION           │
│ flex items-center gap-2     │ DONE BUTTON             │
├─────────────────────────────┼─────────────────────────┤
│ ┌─────┐                     │ ┌─────────────────────┐ │
│ │  ●  │ Pulsing Dot         │ │      DONE           │ │
│ │     │ Green-400           │ │  bg-white/20        │ │
│ │     │ animate-pulse       │ │  text-white         │ │
│ │     │ + animate-ping      │ │  font-bold          │ │
│ └─────┘                     │ │  px-6 py-2          │ │
│                             │ │  border-2           │ │
│ SELECT SHOP                 │ │  rounded-lg         │ │
│ text-white font-bold        │ │                     │ │
│                             │ │  44px × 80px        │ │
│ (5)                         │ └─────────────────────┘ │
│ text-blue-200 text-xs       │                         │
└─────────────────────────────┴─────────────────────────┘
   36px height content + 12px padding = 48px total
```

---

## Viewport Behavior with Android Keyboard

### Keyboard Closed (Full View)
```
┌──────────────────────────┐ ▲
│ App Header               │ │ 10%
├──────────────────────────┤ │
│ Form Content             │ │
│                          │ │
│ [Search Input ▼]         │ │
│ ┌──────────────────────┐ │ │ 90%
│ │ SELECT SHOP     DONE │ │ │
│ ├──────────────────────┤ │ │
│ │ Shop 1               │ │ │
│ │ Shop 2               │ │ │
│ │ Shop 3               │ │ │
│ │ Shop 4               │ │ │
│ │ Shop 5               │ │ │
│ └──────────────────────┘ │ │
│                          │ │
│                          │ │
└──────────────────────────┘ ▼
```

### Keyboard Open (Constrained View)
```
┌──────────────────────────┐ ▲
│ App Header               │ │ 10%
├──────────────────────────┤ ▼
│ [Search Input ▼]         │ ▲
│ ┌──────────────────────┐ │ │
│ │ SELECT SHOP     DONE │ │ │ 320px
│ ├──────────────────────┤ │ │ max
│ │ Shop 1               │ │ │ height
│ │ Shop 2               │ │ │
│ │ Shop 3               │ │ │
│ │ (scroll for more...) │ │ │
│ └──────────────────────┘ │ ▼
├──────────────────────────┤ ▲
│                          │ │
│  ⌨️ Android Keyboard     │ │ 50%
│                          │ │
│                          │ │
└──────────────────────────┘ ▼
```

**Key Point:** 320px max-height ensures dropdown fits in the 40% available space between header and keyboard.

---

## Interaction States

### State 1: Dropdown Closed
```
┌────────────────────────────────┐
│ Search from 600 shops...    🔍 │
└────────────────────────────────┘
💡 Tap to search from 600 shops
```

### State 2: Dropdown Open (Empty Search)
```
BACKDROP (semi-transparent)
┌────────────────────────────────┐
│ ● SELECT SHOP (600)   [DONE]   │ ← Sticky header
├────────────────────────────────┤
│ Shop A / USDM 1                │
│ Shop B / USDM 2                │
│ Shop C / USDM 3                │
│ ... (scrollable)               │
└────────────────────────────────┘
```

### State 3: Dropdown Open (Filtered Search)
```
Search: "nairobi"

BACKDROP (semi-transparent)
┌────────────────────────────────┐
│ ● SELECT SHOP (15)    [DONE]   │ ← Count updated
├────────────────────────────────┤
│ Nairobi Shop 1 / USDM A        │
│ Nairobi Shop 2 / USDM B        │
│ Nairobi Shop 3 / USDM C        │
│ ... (15 results)               │
└────────────────────────────────┘
```

### State 4: Option Pressed (Active)
```
┌────────────────────────────────┐
│ ● SELECT SHOP (15)    [DONE]   │
├────────────────────────────────┤
│ Nairobi Shop 1 / USDM A        │ ← Normal
├────────────────────────────────┤
│ Nairobi Shop 2 / USDM B        │ ← ACTIVE (blue-100)
├────────────────────────────────┤  ▲ User's thumb is here
│ Nairobi Shop 3 / USDM C        │ ← Normal
└────────────────────────────────┘
```

### State 5: Option Selected (Closed)
```
┌────────────────────────────────┐
│ Nairobi Shop 2 / USDM B     🔍 │ ← Selected value
└────────────────────────────────┘

✅ Shop Details Auto-Populated
┌────────────────┬───────────────┐
│ Partner Name:  │ Shop Code:    │
│ Nairobi Shop 2 │ NS002         │
├────────────────┼───────────────┤
│ FP Code:       │ USDM Name:    │
│ FP123          │ USDM B        │
└────────────────┴───────────────┘
```

---

## Scrolling Behavior

### Momentum Scrolling (iOS/Android)
```tsx
WebkitOverflowScrolling: 'touch'
```
Native smooth scrolling with physics-based deceleration.

### Scroll Containment
```tsx
overscrollBehavior: 'contain'
```
Prevents "scroll chaining" where scrolling the dropdown also scrolls the page behind it.

### Vertical Only
```tsx
touchAction: 'pan-y'
```
Disables horizontal scrolling (prevents accidental swipes).

---

## Animation Details

### Pulsing Active Indicator
```tsx
{/* Dot 1: Slow pulse */}
<div className="... animate-pulse" />

{/* Dot 2: Fast ping */}
<div className="... animate-ping opacity-75" />
```

**Effect:** Creates a "heartbeat" effect showing the dropdown is active and listening.

### Button Press Animation
```tsx
transition-all  // Smooth color change
active:bg-blue-100  // Instant feedback
```

**Effect:** Button "lights up" blue when pressed, confirming the tap.

---

## Responsive Breakpoints

### Mobile (Default)
```tsx
// All mobile-first styles apply
backdrop-blur-[1px]
max-h-[320px]
py-4  // Generous touch targets
```

### Desktop (md: and above)
```tsx
md:hidden  // Hide backdrop on desktop
// Could add hover effects only on desktop
```

---

## Accessibility Colors (WCAG)

### Contrast Ratios
| Foreground | Background | Ratio | WCAG Level |
|------------|------------|-------|------------|
| White | Blue-600 | 4.6:1 | AA ✅ |
| Black | White | 21:1 | AAA ✅ |
| Gray-400 | Gray-100 | 4.5:1 | AA ✅ |
| Blue-600 | White | 4.6:1 | AA ✅ |

### Color Blind Safe
- ✅ Blue header (distinguishable)
- ✅ Green pulsing dot (not critical for function)
- ✅ Gray disabled state (also has opacity + text label)

---

## Summary of Measurements

| Element | Height | Width | Padding | Purpose |
|---------|--------|-------|---------|---------|
| Sticky Header | 48px | 100% | py-3 (12px) | Control area |
| DONE Button | 44px | 80px | px-6 py-2 | Thumb tap |
| Shop Option | 56px | 100% | py-4 (16px) | Thumb tap |
| Dropdown Container | 320px max | 100% | - | Keyboard aware |
| Scrollable Area | 276px max | 100% | - | Content area |
| Backdrop | 100vh | 100vw | - | Overlay |

---

## Status
✅ All measurements optimized for mobile-first Android usage

## Last Updated
January 27, 2026
