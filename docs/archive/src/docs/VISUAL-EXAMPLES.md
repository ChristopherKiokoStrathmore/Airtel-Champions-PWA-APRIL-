# Visual Examples - Inline Photo Fields & Metadata Display

## Example 1: Simple Product Submission Form

### Program Setup:
- Product Name (text)
- Product Photo (photo upload, required)
- Price (number)

### What Users See:

```
┌──────────────────────────────────────────┐
│  Submit: Product Registration            │
├──────────────────────────────────────────┤
│                                          │
│  Product Name *                          │
│  ┌────────────────────────────────────┐  │
│  │ Enter product name...              │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Product Photo *                         │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │
│  │      Take Photo                     │  │
│  │  Tap to capture with camera         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Price *                                 │
│  ┌────────────────────────────────────┐  │
│  │ Enter price...                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Cancel]  [Submit (10 pts)]            │
└──────────────────────────────────────────┘
```

### After Taking Photo:

```
┌──────────────────────────────────────────┐
│  Product Photo *                         │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │
│  │      Take Photo                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────┐                              │
│  │ [img]  │ ×  ← Remove button           │
│  └────────┘                              │
│  📸 1 photo added                        │
└──────────────────────────────────────────┘
```

---

## Example 2: Complex Form with Multiple Photo Fields

### Program Setup:
- Product Name (text)
- Product Photo (photo upload, required)
- Price Tag Photo (photo upload, required)
- Store Front Photo (photo upload, optional)
- Notes (textarea)

### What Users See:

```
┌──────────────────────────────────────────┐
│  Submit: Product Audit                   │
├──────────────────────────────────────────┤
│                                          │
│  Product Name *                          │
│  ┌────────────────────────────────────┐  │
│  │ Coca Cola 500ml                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Product Photo *                         │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │
│  │      Take Photo                     │  │
│  └────────────────────────────────────┘  │
│  ┌────┐ ┌────┐                           │
│  │img │×│img │× ← 2 photos               │
│  └────┘ └────┘                           │
│  📸 2 photos added                       │
│                                          │
│  Price Tag Photo *                       │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │
│  │      Take Photo                     │  │
│  └────────────────────────────────────┘  │
│  ┌────┐                                  │
│  │img │× ← 1 photo                      │
│  └────┘                                  │
│  📸 1 photo added                        │
│                                          │
│  Store Front Photo                       │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │
│  │      Take Photo                     │  │
│  └────────────────────────────────────┘  │
│  (no photos - optional field)            │
│                                          │
│  Notes                                   │
│  ┌────────────────────────────────────┐  │
│  │ Product well displayed             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [Cancel]  [Submit (20 pts)]            │
└──────────────────────────────────────────┘

Total photos to submit: 3 (2 + 1 + 0)
```

---

## Example 3: Form with NO Photo Fields

### Program Setup:
- Site Name (dropdown)
- Visit Date (date)
- Rating (rating)

### What Users See:

```
┌──────────────────────────────────────────┐
│  Submit: Site Visit Survey               │
├──────────────────────────────────────────┤
│                                          │
│  Site Name *                             │
│  ┌────────────────────────────────────┐  │
│  │ 🔍 Search from 1000 sites...       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Visit Date *                            │
│  ┌────────────────────────────────────┐  │
│  │ 2026-02-05                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Rating *                                │
│  ⭐ ⭐ ⭐ ⭐ ☆  4 / 5                      │
│                                          │
│  [Cancel]  [Submit (10 pts)]            │
└──────────────────────────────────────────┘

Notice: NO photo upload UI appears!
Clean, focused form for data collection only.
```

---

## Example 4: Database Dropdown with Metadata Display

### Program Setup:
- NUMBER PLATE (database dropdown from van_db table)
- SITE(S) WORKING TODAY (database dropdown from sitewise table)
- Check In Time (time)

### Before Selection:

```
┌──────────────────────────────────────────┐
│  Submit: CHECK IN                        │
├──────────────────────────────────────────┤
│                                          │
│  NUMBER PLATE *                          │
│  ┌────────────────────────────────────┐  │
│  │ 🔍 Search from 1 van_db...         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  SITE(S) WORKING TODAY *                 │
│  ┌────────────────────────────────────┐  │
│  │ 🔍 Search from 1000 sitewise...    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Check In Time *                         │
│  ┌────────────────────────────────────┐  │
│  │ 09:30                              │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### After Selecting NUMBER PLATE:

```
┌──────────────────────────────────────────┐
│  NUMBER PLATE *                          │
│  ┌────────────────────────────────────┐  │
│  │ KDT 261V                           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ℹ️ Details for: KDT 261V           │  │
│  ├────────────────────────────────────┤  │
│  │ CAPACITY:        9 SEATER          │  │
│  │ VENDOR:          TOP TOUCH         │  │
│  │ DRIVER_NAME:     John Mwangi       │  │
│  │ CREATED_AT:      2026-02-04        │  │
│  └────────────────────────────────────┘  │
│         ↑ BLUE INFO BOX                  │
└──────────────────────────────────────────┘
```

### After Selecting SITE:

```
┌──────────────────────────────────────────┐
│  SITE(S) WORKING TODAY *                 │
│  ┌────────────────────────────────────┐  │
│  │ CHEPTERWAI_GENOFF                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ℹ️ Details for: CHEPTERWAI_GENOFF  │  │
│  ├────────────────────────────────────┤  │
│  │ SITE ID:         NAN0062           │  │
│  │ TOWN CATEGORY:   ROC (Rural)       │  │
│  │ CLUSTER (691):   KABIYET           │  │
│  │ TSE:             KENNEDY KIPKEMBOI │  │
│  │ RSM:             [RSM Name]        │  │
│  │ ZSM:             [ZSM Name]        │  │
│  └────────────────────────────────────┘  │
│         ↑ BLUE INFO BOX                  │
└──────────────────────────────────────────┘
```

---

## Example 5: Validation Errors

### Required Photo Field Left Empty:

```
┌──────────────────────────────────────────┐
│  ❌ Please fill in all required fields   │
│     (marked with *)                      │
├──────────────────────────────────────────┤
│                                          │
│  Product Photo *                         │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │ ← RED BORDER
│  │      Take Photo                     │  │
│  │  Tap to capture with camera         │  │
│  └────────────────────────────────────┘  │
│  ↑ RED/PINK BACKGROUND - ERROR!          │
│                                          │
│  [Cancel]  [Submit (10 pts)]            │
└──────────────────────────────────────────┘
```

### After Adding Photo:

```
┌──────────────────────────────────────────┐
│  Product Photo *                         │
│  ┌────────────────────────────────────┐  │
│  │          📷                         │  │ ← BLUE BORDER
│  │      Take Photo                     │  │
│  └────────────────────────────────────┘  │
│  ┌────────┐                              │
│  │ [img]  │ ×                            │
│  └────────┘                              │
│  📸 1 photo added                        │
│  ↑ BLUE BACKGROUND - ALL GOOD!           │
│                                          │
│  [Cancel]  [Submit (10 pts)] ← ENABLED  │
└──────────────────────────────────────────┘
```

---

## Color Guide

### Photo Upload Fields:
- **Normal State**: Blue border (`border-blue-300`), blue background (`bg-blue-50`)
- **Error State**: Red border (`border-red-500`), pink background (`bg-red-50`)
- **Upload Button**: Blue text (`text-blue-700`), camera emoji 📷

### Metadata Display Boxes:
- **Background**: Light blue (`bg-blue-50`)
- **Border**: Blue (`border-blue-300`, 2px)
- **Header**: Dark blue text (`text-blue-900`) with info emoji ℹ️
- **Labels**: Gray text (`text-gray-600`)
- **Values**: Dark text (`text-gray-900`), bold

### Photo Previews:
- **Grid**: 3 columns
- **Image**: Gray border (`border-gray-200`), rounded corners
- **Remove Button**: Red background (`bg-red-500`), white ×
- **Counter**: Gray text with camera emoji 📸

---

## Mobile Responsiveness

### Desktop (Wide Screen):
```
Metadata Box:
┌──────────────────────────────────────┐
│ ℹ️ Details for: KDT 261V            │
├──────────────┬───────────────────────┤
│ CAPACITY:    │ VENDOR:               │
│ 9 SEATER     │ TOP TOUCH             │
├──────────────┼───────────────────────┤
│ DRIVER:      │ CREATED:              │
│ John Mwangi  │ 2026-02-04            │
└──────────────┴───────────────────────┘
        ↑ 2 COLUMN GRID
```

### Mobile (Narrow Screen):
```
Metadata Box:
┌────────────────────────┐
│ ℹ️ Details: KDT 261V  │
├────────────────────────┤
│ CAPACITY:              │
│ 9 SEATER               │
├────────────────────────┤
│ VENDOR:                │
│ TOP TOUCH              │
├────────────────────────┤
│ DRIVER:                │
│ John Mwangi            │
├────────────────────────┤
│ CREATED:               │
│ 2026-02-04             │
└────────────────────────┘
    ↑ STACKS VERTICALLY
```

---

## User Flow Diagrams

### Photo Upload Flow:
```
1. User sees field label
   ↓
2. Tap "Take Photo" button
   ↓
3. Camera opens (native)
   ↓
4. Take photo
   ↓
5. Photo appears in grid below button
   ↓
6. Can take more photos (repeat 2-5)
   ↓
7. Can remove any photo (tap ×)
   ↓
8. Submit form
   ↓
9. All photos from all fields combine
   ↓
10. Photos converted to base64
   ↓
11. Saved to database
```

### Metadata Display Flow:
```
1. User opens dropdown
   ↓
2. Searches for item
   ↓
3. Selects item (e.g., "KDT 261V")
   ↓
4. Dropdown closes, value shows
   ↓
5. Blue metadata box appears below
   ↓
6. Shows all related data from database
   ↓
7. User can verify selection
   ↓
8. If user changes selection:
   - Metadata box updates with new data
   ↓
9. If user clears field:
   - Metadata box disappears
```

---

## Accessibility Features

✅ **Photo Fields:**
- Large touch targets (generous padding)
- Clear visual feedback (blue/red states)
- Photo counter for screen readers
- Alt text on photo previews

✅ **Metadata Display:**
- High contrast text
- Clear label/value separation
- Readable font sizes
- Proper semantic HTML

✅ **Mobile Optimized:**
- 16px font size (prevents iOS zoom)
- Touch-friendly buttons
- Responsive grid layout
- Works on 2G/3G networks
