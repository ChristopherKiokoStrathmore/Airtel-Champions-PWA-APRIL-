# 🎨 Hashtag System Visual Examples

## Real-Time Hashtag Highlighting (While Typing)

### Before (Plain Text)
```
┌────────────────────────────────────────────┐
│ Caption (Optional)                         │
├────────────────────────────────────────────┤
│ Lazima nitaomoka siku moja!                │
│ #marketday                                 │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

### After (With Blue Highlighting)
```
┌────────────────────────────────────────────┐
│ Caption (Optional)                         │
├────────────────────────────────────────────┤
│ Lazima nitaomoka siku moja!                │
│ [BLUE]#marketday[/BLUE]                    │
│                                            │
│                                            │
└────────────────────────────────────────────┘
💡 Use #hashtags to categorize your post
```

**What Happens:**
- User types regular text in black
- When user types `#`, the text color changes to blue
- Hashtag stays blue as user continues typing
- Works for multiple hashtags in one caption

---

## Feed View with Clickable Hashtags

### Post Card Example
```
┌─────────────────────────────────────────────────────────┐
│  📷 [Photo of market visit]                             │
├─────────────────────────────────────────────────────────┤
│  👤 Moses Mia                                           │
│     Nairobi West • 2h ago                               │
│                                                         │
│  Great market visit today! Closed 3 deals!             │
│  [BLUE CLICKABLE]#marketday[/BLUE]                      │
│  [BLUE CLICKABLE]#saleswin[/BLUE]                       │
│  [BLUE CLICKABLE]#airtel[/BLUE]                         │
│                                                         │
│  ─────────────────────────────────────────────────      │
│  ❤️  15    💬  3                                        │
└─────────────────────────────────────────────────────────┘
     ↑
  [Cursor pointer on hover, underline on hover]
```

**Interaction:**
- Hashtags appear in **blue** (text-blue-600)
- Cursor changes to pointer when hovering
- Underline appears on hover
- Clicking filters feed to that hashtag

---

## Hashtag Filter Banner

### When Hashtag is Clicked
```
┌───────────────────────────────────────────────────────────┐
│ 🌟 Champions Feed                            [+ New]      │
├───────────────────────────────────────────────────────────┤
│ 🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷 │
│ #️⃣  #marketday (15 posts)      [Clear Filter]           │
│ 🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷 │
├───────────────────────────────────────────────────────────┤
│ 🌍 Public   |   👥 Groups   |   🏆 Top                   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  [Post 1 with #marketday]                                │
│  [Post 2 with #marketday]                                │
│  [Post 3 with #marketday]                                │
│  ...                                                      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Features:**
- Light blue background (bg-blue-50)
- Shows hashtag name and count: `#marketday (15 posts)`
- Clear Filter button to return to all posts
- Banner persists while filtering

---

## Grid View with Hashtag Filtering

### All Posts (No Filter)
```
┌────────────────────────────────────────────┐
│ 📷 Post 1  │ 📷 Post 2  │ 📷 Post 3       │
│ ❤️ 12      │ ❤️ 8       │ ❤️ 15           │
├────────────┼────────────┼────────────────┤
│ 📷 Post 4  │ 📷 Post 5  │ 📷 Post 6       │
│ ❤️ 20      │ ❤️ 5       │ ❤️ 9            │
├────────────┼────────────┼────────────────┤
│ 📷 Post 7  │ 📷 Post 8  │ 📷 Post 9       │
│ ❤️ 7       │ ❤️ 14      │ ❤️ 11           │
└────────────┴────────────┴────────────────┘
```

### After Clicking #marketday
```
┌───────────────────────────────────────────────┐
│ 🔷 #marketday (6 posts)  [Clear Filter]      │
├───────────────────────────────────────────────┤
│ 📷 Post 1  │ 📷 Post 3  │ 📷 Post 4         │
│ ❤️ 12      │ ❤️ 15      │ ❤️ 20             │
├────────────┼────────────┼──────────────────┤
│ 📷 Post 6  │ 📷 Post 7  │ 📷 Post 9         │
│ ❤️ 9       │ ❤️ 7       │ ❤️ 11             │
└────────────┴────────────┴──────────────────┘
```

**Result:**
- Only posts containing #marketday are shown
- Grid maintains responsive layout
- Filter banner remains visible

---

## Post Detail Modal (Instagram-Style)

### Modal with Hashtags
```
┌─────────────────────────────────────────────┐
│  ←                                      ✕   │
├─────────────────────────────────────────────┤
│                                             │
│  📷                                         │
│  [Large Photo]                              │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  ❤️  ️💬  📤                                │
├─────────────────────────────────────────────┤
│  Moses Mia  Great market visit today!       │
│             [BLUE]#marketday[/BLUE]         │
│             [BLUE]#saleswin[/BLUE]          │
│                                             │
│  2h ago                                     │
├─────────────────────────────────────────────┤
│  💬 Comments:                               │
│                                             │
│  👤 Sarah K.  Amazing work! Keep it up!     │
│     1h ago                                  │
│                                             │
│  👤 John M.  Which market was this?         │
│     45m ago                                 │
│                                             │
├─────────────────────────────────────────────┤
│  [Add a comment...]              [Post]     │
└─────────────────────────────────────────────┘
```

**Note:**
- Hashtags are **blue** but **not clickable** in detail modal
- Prevents modal conflicts
- User can close modal and click hashtags in feed view

---

## Multiple Hashtags Example

### Post with Many Hashtags
```
┌─────────────────────────────────────────────────────────┐
│  📷 [Photo]                                             │
├─────────────────────────────────────────────────────────┤
│  Amazing day in the field! Achieved 150% of target!    │
│                                                         │
│  [BLUE]#saleswin[/BLUE]                                 │
│  [BLUE]#marketday[/BLUE]                                │
│  [BLUE]#airtel[/BLUE]                                   │
│  [BLUE]#target[/BLUE]                                   │
│  [BLUE]#champion[/BLUE]                                 │
│  [BLUE]#teamwork[/BLUE]                                 │
│                                                         │
│  ─────────────────────────────────────────────────      │
│  ❤️  25    💬  8                                        │
└─────────────────────────────────────────────────────────┘
```

**All hashtags:**
- Rendered in blue
- All clickable
- Each one filters to its respective posts
- No limit on number of hashtags

---

## Color Scheme

### Hashtag Colors
```
Default (in posts):     text-blue-600   (#2563eb)
Hover state:            text-blue-700   (#1d4ed8)
Filter banner BG:       bg-blue-50      (#eff6ff)
Filter banner text:     text-blue-900   (#1e3a8a)
Clear button:           bg-blue-600     (#2563eb)
```

### Visual States
```
Normal:     #marketday
            ──────────
            (No underline)

Hover:      #marketday
            ──────────
            (Underline appears, darker blue)

Clicked:    [Loading state, then filter banner appears]
```

---

## User Flow Diagram

```
┌─────────────────┐
│ Create Post     │
│ with hashtags   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Hashtags turn   │
│ BLUE in         │
│ real-time       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Post"    │
│ button          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend trigger │
│ extracts tags   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Post appears    │
│ in feed with    │
│ BLUE clickable  │
│ hashtags        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User clicks     │
│ #marketday      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feed filters    │
│ Blue banner     │
│ shows at top    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Only posts with │
│ #marketday show │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Clear    │
│ Filter"         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return to all   │
│ posts           │
└─────────────────┘
```

---

## Responsive Behavior

### Mobile View (Small Screen)
```
┌─────────────────────────┐
│ 🌟 Champions     [+ New]│
├─────────────────────────┤
│ 🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷   │
│ #️⃣ #marketday (15)     │
│    [Clear Filter]       │
│ 🔷🔷🔷🔷🔷🔷🔷🔷🔷🔷   │
├─────────────────────────┤
│ Post content here...    │
│ [BLUE]#marketday[/BLUE] │
│                         │
│ ❤️ 12  💬 3             │
└─────────────────────────┘
```

### Desktop View (Large Screen)
```
┌─────────────────────────────────────────────────┐
│ 🌟 Champions Feed                    [+ New]    │
├─────────────────────────────────────────────────┤
│ 🔷🔷🔷 #️⃣ #marketday (15 posts)  [Clear Filter] │
├─────────────────────────────────────────────────┤
│  Post content here with more space...           │
│  [BLUE]#marketday[/BLUE] [BLUE]#saleswin[/BLUE] │
│                                                 │
│  ❤️ 12        💬 3        📤 Share              │
└─────────────────────────────────────────────────┘
```

---

## Edge Cases Handled

### 1. No Hashtags
```
Post: "Great day at the market!"
Display: "Great day at the market!"
(No blue highlighting, everything normal)
```

### 2. Hashtag at Start
```
Post: "#marketday was amazing!"
Display: "[BLUE]#marketday[/BLUE] was amazing!"
```

### 3. Hashtag at End
```
Post: "Closed many deals today #saleswin"
Display: "Closed many deals today [BLUE]#saleswin[/BLUE]"
```

### 4. Multiple Hashtags Together
```
Post: "#marketday #saleswin #airtel all in one day!"
Display: "[BLUE]#marketday[/BLUE] [BLUE]#saleswin[/BLUE] [BLUE]#airtel[/BLUE] all in one day!"
```

### 5. Duplicate Hashtags
```
Post: "Great #saleswin today! Another #saleswin tomorrow!"
Display: Both instances shown in blue and clickable
Filter: Shows post once when filtering by #saleswin
```

### 6. Case Variations
```
Post: "Today was #MarketDay not just #marketday"
Display: Both shown in blue
Filter: Both match the same filter (#marketday)
Database: Stored as lowercase: "marketday"
```

---

## Animation & Transitions

### Hashtag Hover Animation
```
State 1 (Normal):
#marketday
color: blue-600
text-decoration: none

State 2 (Hover):
#marketday
──────────
color: blue-700
text-decoration: underline
transition: 150ms ease
```

### Filter Banner Slide In
```
[Filter activated]
    ↓
[Banner slides down from top]
    ↓
[Posts re-render with filter applied]
    ↓
[Smooth transition, no flash]
```

---

**Visual Guide Version:** 1.0  
**Last Updated:** January 22, 2026  
**For:** Airtel Champions Sales Intelligence Network
