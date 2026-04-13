# ZSM Profile - Visual Comparison: Current vs Required

## 📱 Profile Tab View

### ❌ CURRENT IMPLEMENTATION
```
┌─────────────────────────────────────┐
│  👤 My Profile            📢 🚪     │
├─────────────────────────────────────┤
│                                     │
│         ┌────────┐                  │
│         │   M    │  (Avatar only)   │
│         └────────┘                  │
│      Mary Manager                   │
│   Zone Sales Manager                │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │   150    │  │    12    │        │ (Only 2 stats)
│  │  Points  │  │   Subs   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  [ProgramsList Component]           │
│                                     │
│  📋 Information                     │
│  Zone: Nairobi West                 │
│  Team Size: 15 SEs                  │
│  Reports To: John ZBM               │
│                                     │
│  [ReportingStructure Component]     │
│                                     │
│  [🚪 Sign Out Button]               │
└─────────────────────────────────────┘
```

### ✅ REQUIRED IMPLEMENTATION (UAT Requirements)
```
┌─────────────────────────────────────┐
│  ← My Profile            📢 ⚙️ 🚪   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ [Banner Image 1200x300]     │   │ ⭐ NEW: Banner
│  │                         📷   │   │ ⭐ NEW: Upload button
│  └─────────────────────────────┘   │
│       ┌────────┐                    │
│       │   M    │  (Large avatar)    │ ⭐ Larger size
│       └────────┘                    │
│    Mary Manager  ✏️                 │ ⭐ NEW: Edit bio button
│  👔 Zone Sales Manager (Blue Badge) │ ⭐ NEW: Role badge
│                                     │
│  📍 Nairobi West • Kenya            │ ⭐ NEW: Location
│  📅 Joined Jan 2025                 │ ⭐ NEW: Join date
│                                     │
│  "Leading my team to excellence..." │ ⭐ NEW: Bio/tagline
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ #3 │ │150 │ │ 45 │ │ 28 │ │ 12 ││ ⭐ NEW: 5 stat cards
│  │Rank│ │Pts │ │Post│ │Flwr│ │Flwg││
│  └────┘ └────┘ └────┘ └────┘ └────┘│
│                                     │
│  🏆 Top Achievements                │ ⭐ NEW: Achievements
│  ┌─────────────────────────────┐   │
│  │ 🎯 Century Club             │   │
│  │ 🌟 Team Leader              │   │
│  │ 🔥 30 Day Streak            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌───────┬─────────┬───────┐       │ ⭐ NEW: 3 Tabs
│  │ Posts │Activity │ Stats │       │
│  ├───────┴─────────┴───────┤       │
│  │                         │       │
│  │  [Tab Content Here]     │       │
│  │                         │       │
│  └─────────────────────────┘       │
└─────────────────────────────────────┘
```

---

## 📊 Tab Content: Posts Tab

### ✅ REQUIRED (Instagram-style Grid)
```
┌─────────────────────────────────────┐
│  Posts (45)                         │
├─────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐              │ 3-column grid
│  │img │ │img │ │img │              │
│  │ 1  │ │ 2  │ │ 3  │              │
│  └────┘ └────┘ └────┘              │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │img │ │img │ │img │              │
│  │ 4  │ │ 5  │ │ 6  │              │
│  └────┘ └────┘ └────┘              │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │img │ │img │ │img │              │
│  │ 7  │ │ 8  │ │ 9  │              │
│  └────┘ └────┘ └────┘              │
│                                     │
│  [Load More...]                     │
└─────────────────────────────────────┘
```

---

## 📝 Tab Content: Activity Tab

### ✅ REQUIRED (Timeline View)
```
┌─────────────────────────────────────┐
│  Activity                           │
├─────────────────────────────────────┤
│  📝 Posted a new insight            │
│     "Great visit to ABC Site..."    │
│     2 hours ago                     │
│  ─────────────────────────          │
│  💬 Commented on John's post        │
│     "Excellent work!"               │
│     5 hours ago                     │
│  ─────────────────────────          │
│  ❤️ Liked 3 posts                   │
│     Yesterday at 3:45 PM            │
│  ─────────────────────────          │
│  🏆 Earned "Team Leader" badge      │
│     Jan 8, 2025                     │
│  ─────────────────────────          │
│  ⭐ Reached Rank #3                 │
│     Jan 7, 2025                     │
└─────────────────────────────────────┘
```

---

## 📈 Tab Content: Stats Tab

### ✅ REQUIRED (30-Day Points Chart)
```
┌─────────────────────────────────────┐
│  Performance Stats                  │
├─────────────────────────────────────┤
│  30-Day Points Trend                │
│  ┌─────────────────────────────┐   │
│  │         ▁▃▂▅▇▃▄▆▃▂▁         │   │ Bar chart
│  │      ▂▄▆▇▅▃▄▆▇▅▄▃▂▁         │   │
│  │   ▃▅▇▆▄▃▂▄▆▇▅▄▃▂▁▃▅         │   │
│  │ ▁▃▅▇▆▄▃▂▁▃▅▇▆▄▃▂▁▃▅▇▆       │   │
│  └─────────────────────────────┘   │
│    Dec 10        Today              │
│                                     │
│  Summary                            │
│  ┌──────────┐  ┌──────────┐        │
│  │   150    │  │   3.4    │        │
│  │  Total   │  │  Avg/    │        │
│  │Engagement│  │  Post    │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │    5     │  │   12     │        │
│  │   Hall   │  │  Active  │        │
│  │ of Fame  │  │  Days    │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

---

## 👤 Viewing Another User's Profile

### ❌ CURRENT: Uses Wrong Modal
```
┌─────────────────────────────────────┐
│  John Doe        Employee #12345 ✕  │ Wrong modal!
├─────────────────────────────────────┤
│  [Calendar Icon] Jan 2025           │
│  ┌───┬───┬───┬───┬───┬───┬───┐     │
│  │ S │ M │ T │ W │ T │ F │ S │     │ Shows calendar
│  ├───┼───┼───┼───┼───┼───┼───┤     │ submissions,
│  │   │ 1 │ 2 │●3 │ 4 │●5 │ 6 │     │ not profile!
│  │ 7 │●8 │ 9 │10 │●11│12 │13 │     │
│  └───┴───┴───┴───┴───┴───┴───┘     │
│                                     │
│  Program Stats:                     │
│  🌐 Network: 12 | 🔄 Conversion: 8  │
│  🚀 Launch: 5   | 👤 AMB: 3         │
└─────────────────────────────────────┘
```

### ✅ REQUIRED: Enhanced Profile Modal
```
┌─────────────────────────────────────┐
│  ← John Doe's Profile            ✕  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ [Banner Image]              │   │
│  └─────────────────────────────┘   │
│       ┌────────┐                    │
│       │   J    │                    │
│       └────────┘                    │
│      John Doe                       │
│  👤 Sales Executive (Gray Badge)    │ Role badge
│                                     │
│  ┌──────────────────────────┐      │
│  │  + Follow                │      │ ⭐ Follow button
│  └──────────────────────────┘      │
│                                     │
│  📍 Nairobi North • Kenya           │
│  📅 Joined Dec 2024                 │
│                                     │
│  "Dedicated to customer success!"   │ Bio
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ #7 │ │120 │ │ 32 │ │ 15 │ │ 8  ││ 5 stats
│  │Rank│ │Pts │ │Post│ │Flwr│ │Flwg││
│  └────┘ └────┘ └────┘ └────┘ └────┘│
│                                     │
│  ┌───────┬─────────┬───────┐       │
│  │ Posts │Activity │ Stats │       │ 3 tabs
│  ├───────┴─────────┴───────┤       │
│  │  [John's Posts Grid]    │       │ Shows John's
│  │                         │       │ data, not mine
│  └─────────────────────────┘       │
└─────────────────────────────────────┘
```

---

## 🎨 Role Badge Color Coding

### Required Badge System:
```
┌─────────────────────────────────────┐
│  SE   │ 👤 Sales Executive          │ Gray    #6B7280
│  ZSM  │ 👔 Zone Sales Manager       │ Blue    #3B82F6
│  ZBM  │ 🎯 Zonal Business Manager   │ Green   #10B981
│  HQ   │ 🏢 HQ Command Center        │ Orange  #F97316
│  DIR  │ 👑 Director                 │ Purple  #8B5CF6
└─────────────────────────────────────┘
```

### Current State: ❌ NO BADGES
The role is just text, not a colored badge pill.

---

## ✏️ Bio Editing Interface

### ✅ REQUIRED (When clicking edit on own profile)
```
┌─────────────────────────────────────┐
│  Edit Bio                        ✕  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ Leading my team to          │   │ Textarea
│  │ excellence through daily    │   │ 150 char
│  │ coaching and support...     │   │ limit
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                          78/150     │ ⭐ Counter
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  Cancel  │  │   Save   │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

### Current State: ❌ DOES NOT EXIST

---

## 📷 Banner Upload Interface

### ✅ REQUIRED (Camera icon on banner)
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │ [Current Banner or Gradient]│   │
│  │                             │   │
│  │              📷 ← Click here│   │ Upload button
│  └─────────────────────────────┘   │
│                                     │
│  When clicked:                      │
│  ┌─────────────────────────────┐   │
│  │ Choose Image                │   │
│  │ - Camera                    │   │ Options
│  │ - Gallery                   │   │
│  │ - Cancel                    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Current State: ❌ NO BANNER, NO UPLOAD

---

## 🔄 Follow/Unfollow Button States

### ✅ REQUIRED Button States:
```
When NOT following:
┌──────────────────────┐
│  + Follow            │  (Blue bg, white text)
└──────────────────────┘

When following:
┌──────────────────────┐
│  ✓ Following         │  (Gray bg, darker text)
└──────────────────────┘

On hover (when following):
┌──────────────────────┐
│  ✕ Unfollow          │  (Red bg, white text)
└──────────────────────┘
```

### Current State: ❌ NO FOLLOW SYSTEM

---

## 🏆 Achievements Display

### ✅ REQUIRED (Top 3 achievements)
```
┌─────────────────────────────────────┐
│  🏆 Top Achievements                │
├─────────────────────────────────────┤
│  ┌────────────────────────────┐    │
│  │ 🎯 Century Club            │    │
│  │ Earned 100+ total points   │    │
│  │ Unlocked Jan 5, 2025       │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ 🌟 Team Leader             │    │
│  │ Managed 15+ SEs            │    │
│  │ Unlocked Jan 1, 2025       │    │
│  └────────────────────────────┘    │
│  ┌────────────────────────────┐    │
│  │ 🔥 30 Day Streak           │    │
│  │ Posted for 30 days         │    │
│  │ Unlocked Dec 28, 2024      │    │
│  └────────────────────────────┘    │
│                                     │
│  [View All Achievements →]          │
└─────────────────────────────────────┘
```

### Current State: ❌ NO ACHIEVEMENTS DISPLAY

---

## 🔗 Integration Points

### Where Profile Should Open From:

#### 1. ✅ Team Tab (Currently uses wrong modal)
```
Team Member Card
┌────────────────────┐
│  🥇 J              │ Click anywhere → UserProfileModal
│  John Doe          │
│  Zone • Rank #1    │
│  🟢 Active         │
│         150 points →│
└────────────────────┘
```

#### 2. ❌ Explore Feed (NOT IMPLEMENTED)
```
Post Card
┌────────────────────┐
│  [J] John Doe →    │ Click name/avatar → UserProfileModal
│  2 hours ago       │
│  "Great visit..."  │
│  [Photo]           │
│  ❤️ 12  💬 3  🔖 2 │
└────────────────────┘
```

#### 3. ❌ Leaderboard (NOT IMPLEMENTED)
```
Leaderboard Row
┌────────────────────┐
│ #1  [J] John Doe → │ Click row → UserProfileModal
│     Zone: Nairobi  │
│     150 points     │
└────────────────────┘
```

---

## 📊 Stats Card Details

### ✅ REQUIRED: 5 Stats Cards
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  #3  │ │ 150  │ │  45  │ │  28  │ │  12  │
│ Rank │ │Points│ │Posts │ │Follwr│ │Follwg│
└──────┘ └──────┘ └──────┘ └──────┘ └──────┘
   ↓         ↓        ↓        ↓        ↓
 Rank    Total   Social   Social   Social
 from    Points  Posts    Network  Network
 System  from DB Created  Feature  Feature
```

### ❌ Current: Only 2 Stats
```
┌──────────┐  ┌──────────┐
│   150    │  │    12    │
│  Points  │  │   Subs   │
└──────────┘  └──────────┘
```

---

## 🎯 Summary of Missing Components

| Component | Status | Priority | Impact |
|-----------|--------|----------|--------|
| UserProfileModal | ❌ Missing | CRITICAL | 30+ UAT tests fail |
| Role Badges | ❌ Missing | HIGH | Visual hierarchy broken |
| 5 Stats Cards | ⚠️ Partial | CRITICAL | 3 stats missing |
| Banner Upload | ❌ Missing | HIGH | Profile customization blocked |
| Bio Editor | ❌ Missing | HIGH | Cannot add bio |
| Posts Grid Tab | ❌ Missing | CRITICAL | Social feature missing |
| Activity Tab | ❌ Missing | CRITICAL | User engagement tracking missing |
| Stats Tab | ❌ Missing | CRITICAL | Performance analytics missing |
| Follow System | ❌ Missing | CRITICAL | Social networking blocked |
| Achievements | ❌ Missing | MEDIUM | Gamification incomplete |
| Profile Click from Explore | ❌ Missing | HIGH | Cannot view profiles from feed |
| Profile Click from Leaderboard | ❌ Missing | HIGH | Cannot view profiles from rankings |

---

**Visual Guide Version:** 1.0  
**Last Updated:** January 9, 2026  
**Purpose:** Show what's missing vs what's required for ZSM profile
