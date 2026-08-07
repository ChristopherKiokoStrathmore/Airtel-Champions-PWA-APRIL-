# 📁 PROGRAM FOLDERS - VISUAL GUIDE

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AIRTEL CHAMPIONS                       │
│                   Programs System                        │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │ Folders │     │Programs │     │Analytics│
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
              ┌─────────▼──────────┐
              │   Database Views   │
              │  - program_analytics│
              │  - daily_trends    │
              │  - top_performers  │
              └────────────────────┘
```

---

## Folder Structure

```
📊 PROGRAMS TAB
│
├─ 📁 SALES PROGRAMS (💰 Green) [3 programs]
│  ├─ 💰 Shop Visit (12 submissions)
│  ├─ 💰 Data Upsell (8 submissions)
│  └─ 💰 Airtime Sales (15 submissions)
│
├─ 📁 CUSTOMER EXPERIENCE (😊 Blue) [2 programs]
│  ├─ 😊 Feedback Collection (5 submissions)
│  └─ 😊 Support Call (3 submissions)
│
├─ 📁 NETWORK QUALITY (📡 Purple) [2 programs]
│  ├─ 📡 Speed Test (22 submissions)
│  └─ 📡 Coverage Check (18 submissions)
│
└─ 📂 OTHER PROGRAMS (Unfoldered)
   └─ 📊 General Survey (7 submissions)
```

---

## User Interface Flow

### Submit Mode (Sales Executives)
```
┌─────────────────────────────────────┐
│ 📊 Programs        [Submit][Folders]│
│ ℹ️ Submit Mode: Click to submit     │
├─────────────────────────────────────┤
│ 📁 Sales Programs              3 ▼  │ ← Click to expand
├─────────────────────────────────────┤
│   │ 💰 Shop Visit                  │ ← Click to submit
│   │    12 submissions made      →  │
│   │                                │
│   │ 💰 Data Upsell                 │
│   │    8 submissions made       →  │
│   │                                │
│   │ 💰 Airtime Sales               │
│   │    15 submissions made      →  │
└─────────────────────────────────────┘
```

### Analytics Mode (HQ/Directors)
```
┌─────────────────────────────────────┐
│ 📊 Programs     [Analytics][Folders]│
│ ℹ️ Analytics Mode: Click to view    │
├─────────────────────────────────────┤
│ 📁 Sales Programs              3 ▼  │
├─────────────────────────────────────┤
│   │ 💰 Shop Visit    [ANALYTICS] → │ ← Click for analytics
│   │    12 submissions made         │
│   │                                │
│   │ 💰 Data Upsell   [ANALYTICS] → │
│   │    8 submissions made          │
└─────────────────────────────────────┘
```

---

## Analytics Dashboard Layout

```
┌───────────────────────────────────────────────────────┐
│ 💰 SHOP VISIT PROGRAM                            ✕   │
│ Visit retail shops and verify stock                   │
│ 🏆 50 points per submission                           │
├───────────────────────────────────────────────────────┤
│  [Overview] [Daily Trends] [Top Performers]           │
├───────────────────────────────────────────────────────┤
│                                                        │
│  KEY METRICS                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │ 📊 156 │  │ 👥 78  │  │ 🏆7800 │  │ 📈 50  │     │
│  │ Total  │  │ Users  │  │ Points │  │ Avg    │     │
│  └────────┘  └────────┘  └────────┘  └────────┘     │
│                                                        │
│  SUBMISSION STATUS                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ ⏱️ Pending │  │ ✅ Approved│  │ ❌ Rejected│     │
│  │     23     │  │    120     │  │     13     │     │
│  └────────────┘  └────────────┘  └────────────┘     │
│                                                        │
│  ACTIVITY TIMELINE                                    │
│  First Submission:  Jan 15, 2026                      │
│  Last Submission:   Jan 27, 2026                      │
│  Last 7 days:       45 submissions                    │
│  Last 30 days:      156 submissions                   │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## Daily Trends Tab

```
┌───────────────────────────────────────────────────────┐
│ DAILY SUBMISSION TRENDS                               │
│                                      [Show All (30)] ▼│
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 1  Monday, Jan 27                    12       │   │
│  │    8 unique users              1,200 pts      │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 2  Sunday, Jan 26                    15       │   │
│  │    10 unique users             1,500 pts      │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 3  Saturday, Jan 25                  18       │   │
│  │    12 unique users             1,800 pts      │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## Top Performers Tab

```
┌───────────────────────────────────────────────────────┐
│ TOP PERFORMERS (Last 30 Days)                         │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 🥇  Jane Smith                         25     │   │
│  │     Last: Jan 27, 2026           1,250 pts    │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 🥈  John Doe                           23     │   │
│  │     Last: Jan 26, 2026           1,150 pts    │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │ 🥉  Mary Johnson                       20     │   │
│  │     Last: Jan 25, 2026           1,000 pts    │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
│  ┌───────────────────────────────────────────────┐   │
│  │  4  Peter Williams                     18     │   │
│  │     Last: Jan 24, 2026             900 pts    │   │
│  └───────────────────────────────────────────────┘   │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## Folder Management Interface

```
┌───────────────────────────────────────────────────────┐
│ 📁 MANAGE FOLDERS                                ✕   │
│ Organize your programs into folders                   │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │       + CREATE NEW FOLDER                    │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  EXISTING FOLDERS (4)                                 │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 💰 Sales Programs                  [✏️][🗑️] │    │
│  │ Programs focused on sales activities         │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 😊 Customer Experience             [✏️][🗑️] │    │
│  │ Programs for customer satisfaction           │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 📡 Network Quality                 [✏️][🗑️] │    │
│  │ Programs for network testing                 │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ 📚 Training & Development          [✏️][🗑️] │    │
│  │ Learning and skill development               │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │              [DONE]                          │    │
│  └──────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

---

## Create Folder Form

```
┌───────────────────────────────────────────────────────┐
│ CREATE NEW FOLDER                                     │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Folder Name *                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ Sales Programs                                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  Description                                          │
│  ┌────────────────────────────────────────────────┐  │
│  │ Programs focused on sales activities           │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  Icon                                                 │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐              │
│  │📁│💰│😊│📡│📚│🎯│⚡│🏆│📊│🚀│💼│🎓│              │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘              │
│       ^^^ Selected                                    │
│                                                        │
│  Color Theme                                          │
│  ┌────┬────┬────┬────┬────┬────┬────┐               │
│  │Blue│Green│Purple│Orange│Pink│Yellow│Red│           │
│  └────┴────┴────┴────┴────┴────┴────┘               │
│        ^^^^ Selected                                  │
│                                                        │
│  Preview                                              │
│  ┌────────────────────────────────────────────────┐  │
│  │ 💰 Sales Programs                              │  │
│  │ Programs focused on sales activities           │  │
│  └────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────┬────────────┐                       │
│  │💾 CREATE     │ CANCEL     │                       │
│  └──────────────┴────────────┘                       │
└───────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
┌─────────────────────┐
│ program_folders     │
│ ─────────────────── │
│ id (PK)             │
│ name                │
│ description         │
│ icon                │
│ color               │
│ order_index         │
└──────────┬──────────┘
           │
           │ 1:N (one folder, many programs)
           │
┌──────────▼──────────┐
│ programs            │
│ ─────────────────── │
│ id (PK)             │
│ title               │
│ folder_id (FK) ◄────┘
│ points_value        │
└──────────┬──────────┘
           │
           │ 1:N (one program, many submissions)
           │
┌──────────▼──────────┐
│ submissions         │
│ ─────────────────── │
│ id (PK)             │
│ program_id (FK) ◄───┘
│ user_id             │
│ points_awarded      │
│ submitted_at        │
└─────────────────────┘


VIEWS (Auto-calculated):
┌─────────────────────┐
│ program_analytics   │
└─────────────────────┘
┌─────────────────────┐
│ program_daily_trends│
└─────────────────────┘
┌─────────────────────┐
│ program_top_performers
└─────────────────────┘
```

---

## Color Palette

```
FOLDER COLORS (7 options):

┌────────────┐  ┌────────────┐  ┌────────────┐
│    BLUE    │  │   GREEN    │  │   PURPLE   │
│  #3B82F6   │  │  #10B981   │  │  #A855F7   │
│ bg-blue-50 │  │bg-green-50 │  │bg-purple-50│
└────────────┘  └────────────┘  └────────────┘

┌────────────┐  ┌────────────┐  ┌────────────┐
│   ORANGE   │  │    PINK    │  │   YELLOW   │
│  #F97316   │  │  #EC4899   │  │  #EAB308   │
│bg-orange-50│  │ bg-pink-50 │  │bg-yellow-50│
└────────────┘  └────────────┘  └────────────┘

┌────────────┐
│    RED     │
│  #EF4444   │
│  bg-red-50 │
└────────────┘
```

---

## Icon Options

```
FOLDER ICONS (12 options):

📁  Default folder
💰  Sales/Money
😊  Customer/Happiness
📡  Network/Technical
📚  Training/Learning
🎯  Goals/Targets
⚡  Fast/Urgent
🏆  Rewards/Winners
📊  Analytics/Data
🚀  Growth/Launch
💼  Business/Professional
🎓  Education/Graduate
```

---

## User Journey Map

### Sales Executive Journey
```
1. Open App
   ↓
2. Navigate to Programs Tab
   ↓
3. See Programs organized in Folders
   ↓
4. Click Folder to expand
   ↓
5. Click Program to submit
   ↓
6. Fill form
   ↓
7. Submit & Earn Points
   ↓
8. See success modal
```

### HQ/Director Journey
```
1. Open App
   ↓
2. Navigate to Programs Tab
   ↓
3. Toggle to "Analytics Mode"
   ↓
4. Click Program
   ↓
5. View Analytics Dashboard
   ↓
6. Check Overview/Trends/Performers
   ↓
7. Identify top performers
   ↓
8. Take action (rewards, alerts, etc.)
```

### Admin Journey (Folder Management)
```
1. Open Programs Tab
   ↓
2. Click "Folders" button
   ↓
3. See all folders
   ↓
4. Click "+ Create New Folder"
   ↓
5. Fill form (name, icon, color)
   ↓
6. Preview design
   ↓
7. Create folder
   ↓
8. Assign programs to folder (SQL for now)
```

---

## Mobile Layout (Responsive)

```
MOBILE VIEW (320px - 768px)

┌─────────────────┐
│ 📊 Programs     │
│ [Submit] [📁]   │
├─────────────────┤
│ ℹ️ Submit Mode  │
├─────────────────┤
│ 📁 Sales    3 ▼ │
├─────────────────┤
│  │💰 Shop Visit│
│  │  12 subs  → │
│  │             │
│  │💰 Data      │
│  │  8 subs   → │
└─────────────────┘

TABLET VIEW (768px - 1024px)

┌───────────────────────────┐
│ 📊 Programs [Submit][📁]  │
├───────────────────────────┤
│ ℹ️ Submit Mode: Click...  │
├───────────────────────────┤
│ 📁 Sales Programs    3 ▼  │
├───────────────────────────┤
│  │ 💰 Shop Visit    →     │
│  │    12 submissions      │
└───────────────────────────┘
```

---

## Status: ✅ Complete & Ready to Use

**Created:** January 27, 2026  
**Version:** 1.0  
**Components:** 3 (List, Analytics, Management)  
**Database:** 1 table + 3 views  
**Documentation:** Complete
