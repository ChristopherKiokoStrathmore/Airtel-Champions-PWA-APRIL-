# 🎯 TAI PROGRAMS FEATURE - STEVE JOBS BOARD

## **"One More Thing..." - Dynamic Field Intelligence Programs**

---

## **THE VISION** 🌟

> "The best intelligence isn't collected by forms. It's captured by making the process so intuitive, so rewarding, that Sales Executives WANT to share what they see in the field."

Transform TAI from a static points system into a **living, breathing intelligence network** where Directors can instantly deploy field missions, and SEs compete to provide the most valuable market insights.

---

## **THE PROBLEM WE'RE SOLVING** 🎯

### **Current Reality:**
- 📧 Directors send Google Forms via email/WhatsApp
- 📱 SEs switch between apps (TAI → Gmail → Camera → Forms)
- ⏰ Delayed submissions (SEs forget, forms get lost)
- 📊 Data scattered across Google Sheets
- 🤷 No gamification = low engagement
- ❌ No real-time visibility for managers

### **The TAI Way:**
- ✅ Programs live **inside TAI** - zero app switching
- ✅ Submit = Instant points + leaderboard update
- ✅ Real-time analytics for Directors
- ✅ Photo uploads with **auto-geotag & timestamp**
- ✅ Push notifications: "New mission: 50 points!"
- ✅ Competitive: See who submitted first, who's leading

---

## **CORE FEATURES** 🚀

### **1. PROGRAM CREATION (Director/HQ Only)**

**Visual Form Builder:**
```
┌──────────────────────────────────────┐
│  📋 CREATE NEW PROGRAM               │
│                                      │
│  Program Name: *                     │
│  ┌────────────────────────────────┐ │
│  │ AMBs to Keep List              │ │
│  └────────────────────────────────┘ │
│                                      │
│  Description:                        │
│  ┌────────────────────────────────┐ │
│  │ Daily shop visits - track      │ │
│  │ shops we want to retain        │ │
│  └────────────────────────────────┘ │
│                                      │
│  Points per Submission: *            │
│  ┌────────────────────────────────┐ │
│  │ 50                             │ │
│  └────────────────────────────────┘ │
│                                      │
│  Target Audience: *                  │
│  ☑ Sales Executives                 │
│  ☐ Zonal Sales Managers              │
│  ☐ Zonal Business Managers           │
│                                      │
│  Active Period:                      │
│  Start: [Jan 1, 2026] End: [Jan 31] │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  + ADD FORM FIELD              │ │
│  └────────────────────────────────┘ │
│                                      │
│  📝 FORM FIELDS:                     │
│                                      │
│  1. [≡] Shop Name (Text) *           │
│      └─ [Edit] [Delete]              │
│                                      │
│  2. [≡] Shop Masterline (Text) *     │
│      └─ [Edit] [Delete]              │
│                                      │
│  3. [≡] Site ID (Number) *           │
│      └─ [Edit] [Delete]              │
│                                      │
│  4. [≡] ZSM (Dropdown) *             │
│      Options: [Auto-load from DB]    │
│      └─ [Edit] [Delete]              │
│                                      │
│  5. [≡] Shop Photo (Image) *         │
│      Auto-capture: GPS + Timestamp   │
│      └─ [Edit] [Delete]              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  💾 SAVE PROGRAM               │ │
│  └────────────────────────────────┘ │
│                                      │
│  OR                                  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  📤 IMPORT FROM GOOGLE FORMS   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  📊 IMPORT FROM EXCEL          │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

### **2. FORM FIELD TYPES**

| Field Type | SE Sees | Data Stored | Use Case |
|------------|---------|-------------|----------|
| **Text** | Text input | String | Shop name, notes |
| **Number** | Number input | Integer | Site ID, product count |
| **Dropdown** | Select menu | String | ZSM, region, product type |
| **Multi-Select** | Checkboxes | Array | Products sold, services |
| **Date** | Date picker | Date | Visit date, next follow-up |
| **Time** | Time picker | Time | Visit time |
| **Photo** | Camera + Upload | Image URL + GPS + Timestamp | Shop photo, shelf photo |
| **Location** | Auto-GPS or Manual | Lat/Long | Shop location verification |
| **Yes/No** | Toggle switch | Boolean | Competitor present? |
| **Rating** | Star rating (1-5) | Integer | Shop cleanliness, service |
| **Long Text** | Textarea | String | Detailed observations |

---

### **3. IMPORT OPTIONS**

#### **Option A: Excel Import** 📊
```
1. Director uploads Excel file (.xlsx, .csv)
2. TAI reads column headers:
   - "Shop Name" → Text field
   - "Site ID" → Number field
   - "Photo" → Image field
3. Auto-creates program with fields
4. Director reviews and publishes
```

**Excel Format Example:**
```
Shop Name | Shop Masterline | Site ID | ZSM | Photo
----------|-----------------|---------|-----|-------
Required  | Required        | Required| Drop| Image
```

#### **Option B: Google Forms Integration** 📝
```
1. Director pastes Google Form link
2. TAI uses Google Forms API to:
   - Extract form title → Program name
   - Extract form description → Program description
   - Parse each question → Form field
   - Map field types (text, dropdown, file upload)
3. Import complete - ready to publish
```

**Mapping:**
```
Google Forms Type        → TAI Field Type
---------------------      ---------------
Short answer             → Text
Paragraph                → Long Text
Multiple choice          → Dropdown
Checkboxes               → Multi-Select
Dropdown                 → Dropdown
File upload              → Photo
Linear scale             → Rating
```

#### **Option C: Microsoft Forms** 📋
Same process as Google Forms using Microsoft Graph API.

---

### **4. SE EXPERIENCE (Home Page)**

**Before Programs:**
```
┌──────────────────────────────────────┐
│  🏠 HOME                              │
│                                      │
│  🏆 Your Rank: #24 (1,450 pts)       │
│  📸 Submit Intel: [+] Button         │
│  📰 Feed                             │
└──────────────────────────────────────┘
```

**After Programs:**
```
┌──────────────────────────────────────┐
│  🏠 HOME                              │
│                                      │
│  🏆 Your Rank: #24 (1,450 pts)       │
│                                      │
│  🎯 ACTIVE PROGRAMS (3)               │
│  ┌────────────────────────────────┐  │
│  │ 📋 AMBs to Keep List           │  │
│  │ 🏆 50 pts • Daily              │  │
│  │ ✅ Submitted today             │  │
│  │ 👥 124 SEs completed           │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📦 New Product Launch Survey   │  │
│  │ 🏆 100 pts • Due in 2 days     │  │
│  │ ⏳ NOT SUBMITTED               │  │
│  │ 👥 89 SEs completed            │  │
│  │ [START PROGRAM →]              │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🏪 Competitor Activity Report  │  │
│  │ 🏆 75 pts • Weekly             │  │
│  │ ⏳ NOT SUBMITTED               │  │
│  │ 👥 45 SEs completed            │  │
│  │ [START PROGRAM →]              │  │
│  └────────────────────────────────┘  │
│                                      │
│  📸 Quick Intel Submit: [+]          │
│  📰 Feed                             │
└──────────────────────────────────────┘
```

**When SE Clicks "START PROGRAM":**
```
┌──────────────────────────────────────┐
│  ← Back                              │
│                                      │
│  📋 AMBs to Keep List                │
│  Daily shop visits - track shops     │
│  we want to retain                   │
│                                      │
│  🏆 Earn 50 points for submission    │
│  ⏰ Submit before 6:00 PM today      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  Shop Name *                         │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│  Shop Masterline *                   │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│  Site ID *                           │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│  ZSM *                               │
│  ┌────────────────────────────────┐ │
│  │ [Select ZSM ▼]                 │ │
│  └────────────────────────────────┘ │
│                                      │
│  Shop Photo *                        │
│  ┌────────────────────────────────┐ │
│  │  📷 TAKE PHOTO                 │ │
│  └────────────────────────────────┘ │
│  Auto-captures GPS & timestamp       │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  ✅ SUBMIT (50 PTS)            │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**After Submission:**
```
┌──────────────────────────────────────┐
│           🎉 SUCCESS!                │
│                                      │
│      +50 POINTS EARNED               │
│                                      │
│  Your submission has been recorded   │
│  and your manager has been notified. │
│                                      │
│  🏆 New Total: 1,500 points          │
│  📈 Rank: #24 → #22 ⬆️              │
│                                      │
│  [VIEW LEADERBOARD]  [DONE]          │
└──────────────────────────────────────┘
```

---

### **5. DIRECTOR ANALYTICS DASHBOARD**

```
┌──────────────────────────────────────────────────────────┐
│  📊 PROGRAM: AMBs to Keep List                           │
│  Status: ● Active • Ends in 15 days                      │
│                                                          │
│  📈 PERFORMANCE                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Total Submissions: 1,247                          │ │
│  │  Today: 124 submissions                            │ │
│  │  Participation Rate: 68% (412/605 SEs)             │ │
│  │  Avg. Time to Complete: 3m 42s                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🏆 TOP PERFORMERS                                       │
│  1. John Kamau - 15 submissions                          │
│  2. Jane Njeri - 14 submissions                          │
│  3. Peter Oloo - 13 submissions                          │
│                                                          │
│  📍 ZONE BREAKDOWN                                       │
│  Nairobi:    142 submissions (87% participation)         │
│  Mombasa:    98 submissions  (72% participation)         │
│  Kisumu:     76 submissions  (65% participation)         │
│                                                          │
│  📥 RECENT SUBMISSIONS (Real-time)                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🟢 John Kamau • 2 min ago                         │ │
│  │  Shop: Kilimani Supermart • Site: 12345            │ │
│  │  📷 [View Photo] 📍 [View Location]                │ │
│  │  ✅ Approved  ❌ Reject  💬 Comment                │ │
│  ├────────────────────────────────────────────────────┤ │
│  │  🟢 Jane Njeri • 5 min ago                         │ │
│  │  Shop: Westlands Store • Site: 67890              │ │
│  │  📷 [View Photo] 📍 [View Location]                │ │
│  │  ✅ Approved  ❌ Reject  💬 Comment                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [📊 EXPORT TO EXCEL]  [📧 EMAIL REPORT]  [⚙️ EDIT]    │
└──────────────────────────────────────────────────────────┘
```

---

## **IMPLEMENTATION PHASES** 🏗️

### **Phase 1: MVP (Week 1-2)** ⚡
**Goal:** Get basic programs working FAST

✅ **Features:**
- Program creation form (manual only, no imports yet)
- Support 5 field types: Text, Number, Dropdown, Photo, Location
- Display programs on SE home page
- Submit responses
- Director view: See all submissions in a table
- Basic points allocation on submit

✅ **Database:**
```sql
-- New table: programs
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points_value INTEGER DEFAULT 50,
  target_roles TEXT[] DEFAULT ARRAY['sales_executive'],
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'active', -- active, paused, ended
  created_by UUID REFERENCES app_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: program_fields
CREATE TABLE program_fields (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, dropdown, photo, location, etc.
  is_required BOOLEAN DEFAULT false,
  options JSONB, -- for dropdown: {"options": ["Option 1", "Option 2"]}
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New table: program_submissions
CREATE TABLE program_submissions (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id),
  responses JSONB NOT NULL, -- {"field_name": "value", "field_name_2": "value2"}
  photos JSONB, -- {"field_name": "url_to_photo"}
  location JSONB, -- {"lat": 1.234, "lng": 5.678, "timestamp": "2026-01-02T..."}
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  points_awarded INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

✅ **UI Components:**
- `/components/program-creator.tsx` - Director creates programs
- `/components/program-list.tsx` - SE sees active programs
- `/components/program-form.tsx` - SE fills out program
- `/components/program-submissions.tsx` - Director views submissions

---

### **Phase 2: Excel Import (Week 3)** 📊

✅ **Features:**
- Upload Excel file (.xlsx, .csv)
- Parse columns → auto-create fields
- Preview before publishing
- Handle data validation

✅ **Libraries:**
- `xlsx` - Read Excel files in browser
- Column header detection
- Auto-type inference (number vs text)

---

### **Phase 3: Google Forms Integration (Week 4)** 📝

✅ **Features:**
- Paste Google Form URL
- Parse form structure via Google Forms API
- Map field types to TAI fields
- Import in one click

⚠️ **Requirements:**
- Google Forms API access (OAuth)
- Form must be publicly accessible OR user grants permission

---

### **Phase 4: Advanced Features (Week 5+)** 🚀

✅ **Enhancements:**
- **Conditional Logic:** Show Field B only if Field A = "Yes"
- **Duplicate Detection:** Warn if same shop submitted today
- **Scheduled Programs:** Auto-activate on specific date
- **Recurring Programs:** Daily, Weekly, Monthly
- **Approval Workflow:** Director must approve before points awarded
- **Leaderboards per Program:** Top submitters
- **Push Notifications:** "New program available - 100 pts!"
- **Offline Support:** Save draft, submit when online
- **Bulk Actions:** Approve/reject multiple submissions
- **Data Analytics:** Charts, graphs, trends
- **Export Formats:** Excel, CSV, PDF
- **Email Reports:** Auto-email weekly summary to Director

---

## **TECHNICAL ARCHITECTURE** 🏛️

### **Frontend (React)**
```
/components/programs/
  ├── program-creator.tsx        (Director: Create new program)
  ├── program-field-builder.tsx  (Director: Add/edit fields)
  ├── program-list.tsx           (SE: View active programs)
  ├── program-card.tsx           (SE: Program preview card)
  ├── program-form.tsx           (SE: Fill out & submit)
  ├── program-submissions.tsx    (Director: View all submissions)
  ├── program-analytics.tsx      (Director: Charts & stats)
  └── program-import-excel.tsx   (Director: Excel upload)
```

### **Backend (Supabase)**
```
/supabase/functions/server/programs.tsx

Routes:
  POST   /make-server-28f2f653/programs              - Create program
  GET    /make-server-28f2f653/programs              - List all programs
  GET    /make-server-28f2f653/programs/:id          - Get program details
  PUT    /make-server-28f2f653/programs/:id          - Update program
  DELETE /make-server-28f2f653/programs/:id          - Delete program
  
  POST   /make-server-28f2f653/programs/:id/submit   - Submit response
  GET    /make-server-28f2f653/programs/:id/submissions - Get all submissions
  PUT    /make-server-28f2f653/submissions/:id/approve  - Approve submission
  PUT    /make-server-28f2f653/submissions/:id/reject   - Reject submission
  
  POST   /make-server-28f2f653/programs/import-excel    - Import from Excel
  POST   /make-server-28f2f653/programs/import-gforms   - Import from Google Forms
```

### **Storage (Supabase Storage)**
```
make-28f2f653-program-photos/
  ├── {program_id}/
      ├── {submission_id}/
          ├── shop_photo.jpg
          └── metadata.json (GPS + timestamp)
```

---

## **USER FLOW DIAGRAMS** 🗺️

### **Director Creates Program:**
```
Director → Programs Tab → Create New Program
  ↓
Enter: Title, Description, Points, Target Audience, Dates
  ↓
Add Fields: Text, Number, Dropdown, Photo, etc.
  ↓
Preview & Test
  ↓
Publish Program
  ↓
Push Notification sent to all SEs
  ↓
Program appears on SE Home Page
```

### **SE Submits Program:**
```
SE → Home → Sees "AMBs to Keep List" (50 pts)
  ↓
Click "START PROGRAM"
  ↓
Fill out fields: Shop Name, Masterline, Site ID, ZSM
  ↓
Take Photo (auto-capture GPS + timestamp)
  ↓
Click "SUBMIT (50 PTS)"
  ↓
Success: +50 points added to account
  ↓
Leaderboard updates in real-time
  ↓
Notification sent to ZSM/ZBM/Director
```

### **Director Views Submissions:**
```
Director → Programs Tab → AMBs to Keep List
  ↓
Dashboard shows: 124 submissions today, 68% participation
  ↓
Click "View Submissions"
  ↓
Table shows: SE Name, Shop, Site ID, Photo, GPS, Time
  ↓
Click on submission → Full details + Map view
  ↓
Approve ✅ (points already awarded) or Reject ❌ (deduct points)
  ↓
Export to Excel for further analysis
```

---

## **COMPETITIVE ADVANTAGE** 💪

### **vs. Google Forms:**
| Feature | Google Forms | TAI Programs |
|---------|--------------|--------------|
| **Gamification** | ❌ None | ✅ Points + Leaderboard |
| **Real-time Analytics** | ❌ Manual export | ✅ Live dashboard |
| **Offline Support** | ❌ No | ✅ Yes (save draft) |
| **Auto GPS/Timestamp** | ❌ Manual | ✅ Automatic |
| **Push Notifications** | ❌ No | ✅ Yes |
| **App Integration** | ❌ External link | ✅ Native experience |
| **Manager Approval** | ❌ No | ✅ Optional workflow |

---

## **SUCCESS METRICS** 📊

### **Phase 1 Goals:**
- ✅ 80% of SEs submit at least 1 program in Week 1
- ✅ Average 3 submissions per SE per week
- ✅ Directors create 5+ programs in first month
- ✅ 90% of submissions include photos
- ✅ <5 min average completion time

### **Long-term Goals:**
- ✅ Replace ALL Google Forms with TAI Programs
- ✅ 10,000+ submissions per month
- ✅ Directors save 5+ hours/week on data collection
- ✅ 95% data accuracy (GPS verification)
- ✅ Real-time competitive intelligence

---

## **QUESTIONS FOR DISCUSSION** 🤔

### **1. Import Priority?**
- Should we start with Excel import (easier) or Google Forms (more useful)?
- **Recommendation:** Excel first (simpler, no API dependencies)

### **2. Approval Workflow?**
- Should all submissions auto-award points, or require Director approval?
- **Recommendation:** Auto-award by default, Director can reject later (better UX)

### **3. Photo Requirements?**
- Should photos be REQUIRED for all programs, or optional per program?
- **Recommendation:** Let Director decide per program

### **4. Frequency Limits?**
- Should we limit submissions? (e.g., max 1 per day per program)
- **Recommendation:** Yes - prevent spam, ensure quality

### **5. Point Validation?**
- Should Director set min/max point values?
- **Recommendation:** 10-500 pts range to prevent abuse

### **6. Field Validation?**
- Site ID must be numeric, Shop Name must be >3 characters, etc.?
- **Recommendation:** Yes - add validation rules per field type

### **7. Data Export?**
- Excel only, or also CSV, PDF, JSON?
- **Recommendation:** Excel + CSV (most common)

---

## **NEXT STEPS** ✅

### **Immediate Actions:**
1. ✅ **Approve Phase 1 Scope** - Basic program creation + submission
2. ✅ **Design Database Schema** - `programs`, `program_fields`, `program_submissions` tables
3. ✅ **Wireframe UI** - Program creator, SE view, submission dashboard
4. ✅ **Build MVP** - Get first program working end-to-end
5. ✅ **Test with 10 SEs** - Gather feedback, iterate
6. ✅ **Roll out to all 605 SEs**

### **After MVP:**
7. ✅ Add Excel import
8. ✅ Add Google Forms integration
9. ✅ Add advanced analytics
10. ✅ Add push notifications

---

## **ESTIMATED TIMELINE** ⏱️

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: MVP** | 2 weeks | Basic programs working |
| **Phase 2: Excel** | 1 week | Excel import functional |
| **Phase 3: Google Forms** | 1 week | Google Forms integration |
| **Phase 4: Polish** | 1 week | Analytics, notifications, UX |
| **Total** | **5 weeks** | **Full feature complete** |

---

## **THE TAI PROMISE** 💎

> "With TAI Programs, Directors can deploy field intelligence missions in 60 seconds, and get real-time insights from 605 Sales Executives within the hour. No emails. No spreadsheets. No delays. Just pure, gamified, competitive intelligence."

---

## **FINAL QUESTION FOR YOU** 🎯

**What do you want to build first?**

**Option A: Quick Win** (1 week)
- Manual program creation only
- 5 field types (text, number, dropdown, photo, location)
- SE can submit, Director can view
- Points auto-awarded
- **Get it working FAST**, iterate based on usage

**Option B: Full Vision** (5 weeks)
- Everything from the board above
- Excel + Google Forms import
- Advanced analytics
- Approval workflows
- **Complete feature**, launch once

**Option C: Hybrid** (2-3 weeks)
- Start with Option A (1 week)
- Launch to 10 beta SEs
- Gather feedback
- Add most-requested features (week 2-3)
- Roll out to all 605 SEs

---

**My Recommendation: Option C (Hybrid)**

Launch fast, learn fast, iterate fast. Classic Steve Jobs approach.

**What do you think?** 🚀
