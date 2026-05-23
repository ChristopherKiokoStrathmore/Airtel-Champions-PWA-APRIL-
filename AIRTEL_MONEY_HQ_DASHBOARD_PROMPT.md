# Detailed Product Prompt: Airtel Money HQ Analytics Dashboard

## 1. PRODUCT VISION (Steve Jobs Inspired Philosophy)

**"Insanely Simple Intelligence for Airtel Money Success"**

The Airtel Money HQ Dashboard should embody three core principles:
- **Simplicity**: Users should grasp critical metrics in 3 seconds without scrolling
- **Elegance**: Every pixel serves a purpose; remove anything that doesn't reduce friction
- **Focus**: Display only what matters; hide complexity behind progressive disclosure

Think of it like the MacBook Air launch—beautiful because it's ruthlessly simple. No clutter, no jargon, no unnecessary buttons.

---

## 2. TECHNICAL ARCHITECTURE

### 2.1 Data Sources (Supabase Tables)

```
Primary Tables:
├── airtelmoney_agents        (agent profiles, activity)
├── airtelmoney_hq            (admin team members, roles)
├── am_videos                 (training content library)
├── am_video_sessions         (watch analytics - KEY TABLE)
├── am_complaints             (support tickets)
├── am_complaint_responses    (ticket resolutions)
└── am_complaint_ratings      (agent performance feedback)

Analytics Aggregations to Calculate:
├── Total agents (active vs inactive)
├── Video completion rates (by agent, by video)
├── Average watch time per video
├── Top performers (by engagement, by complaints resolved)
├── Compliance status (videos watched vs assigned)
└── Support ticket metrics (open, resolved, avg resolution time)
```

---

## 3. UI/UX ARCHITECTURE

### 3.1 Main Navigation Structure

```
┌─────────────────────────────────────────────────┐
│  AIRTEL MONEY HQ  [3D Toggle] [Theme] [User▼]  │
├─────────────────────────────────────────────────┤
│ 📊 Dashboard │ 👥 Agents │ 🎥 Videos │ 🎫 Support │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Main Content Area - Tab-Specific]             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 3.2 The 3D Toggle Feature (Innovation)

**Purpose**: Allows switching between 2D analytics view and interactive 3D visualization mode

**States**:
- **2D Mode** (Default): Traditional table-based analytics, fast loading
- **3D Mode**: Immersive 3D visualization (WebGL powered)
  - 3D agent capability visualization (height = engagement, color = region)
  - 3D video completion pipeline (funnel visualization)
  - 3D complaint resolution timeline
  - Interactive globe showing agent geographical distribution

**Interaction**: Single toggle in top-right corner, smooth transition, remembers user preference

---

## 4. TAB STRUCTURE & DATA REQUIREMENTS

### TAB 1: DASHBOARD (Overview/Executive Summary)

**Purpose**: "The North Star" - One glance tells the HQ team if everything is on track

**Sections**:

#### A. Key Metrics Card Grid (4 Cards - SVG Icons)
```
[Total Agents]          [Active This Week]
X agents                Y % engagement
↑ +Z% from last week   [Trend sparkline]

[Video Compliance]      [Support Health]
X% watched required     Y tickets open
training               Z avg resolution hrs
```

**Data Sources**:
- Count from `airtelmoney_agents` 
- Last login from `airtelmoney_agents.last_login_at`
- Video sessions: COUNT from `am_video_sessions` grouped by agent_id
- Complaints: COUNT from `am_complaints` WHERE status='open'

#### B. Top Performance Section (Animated List)
```
🏆 Top Performers (This Month)
1. Agent Name - 95% compliance - 12h watch time
2. Agent Name - 87% compliance - 8h watch time
3. Agent Name - 76% compliance - 6h watch time
```

**Data Sources**: 
- Query `am_video_sessions` grouped by agent_id
- Calculate: (videos_completed / videos_assigned) * 100
- Sort by total_watch_secs DESC

#### C. Engagement Timeline (Smooth Line Chart)
```
Agent Activity Over 30 Days
[Line chart showing daily active agents]
X-axis: Days, Y-axis: Active Agent Count
```

**Data Sources**:
- GROUP BY date FROM `airtelmoney_agents.last_login_at`
- COUNT agents per day

#### D. Video Completion Funnel (Minimalist Visualization)
```
Videos Assigned → Videos Started → Videos Completed
    1,500              1,200              850
    100%              80%                57%
```

**Data Sources**:
- Total videos: COUNT from `am_videos` WHERE status='published'
- Started: COUNT DISTINCT agent_id FROM `am_video_sessions`
- Completed: COUNT from `am_video_sessions` WHERE completed=TRUE

---

### TAB 2: AGENTS (Team Management & Performance)

**Purpose**: Deep dive into individual agent performance and compliance

**Sections**:

#### A. Advanced Search & Filter Bar
```
[🔍 Search by name/code] [Zone: All ▼] [SE: All ▼] [Status: Active ▼]
[Compliance: >80% ▼] [Video Watched: >50% ▼]
```

#### B. Agent Performance Table (Responsive, Sortable)
```
Columns (Horizontally Scrollable):
┌─────────┬───────────┬────────┬──────────┬──────────┬──────────┬─────────────┐
│ Name    │ Agent Code│ Region │ Assigned │ Watched  │ Completed│ Last Active │
├─────────┼───────────┼────────┼──────────┼──────────┼──────────┼─────────────┤
│ John O. │ AM001     │ Nairobi│ 15 vids  │ 12 (80%) │ 8 (53%)  │ 2h ago      │
│ Jane D. │ AM002     │ Mombasa│ 15 vids  │ 15 (100%)│ 15 (100%)│ 15min ago   │
└─────────┴───────────┴────────┴──────────┴──────────┴──────────┴─────────────┘

Row Actions [→ View Profile] [→ Watch History] [→ Complaints]
```

**Data Sources**:
- Agent info: `airtelmoney_agents.full_name, agent_code, zone, se, zsm`
- Assigned videos: COUNT `am_videos` (or track in separate table)
- Watched: COUNT `am_video_sessions` WHERE agent_id = X
- Completed: COUNT `am_video_sessions` WHERE agent_id = X AND completed=TRUE
- Last active: MAX(`am_video_sessions.session_start`)

#### C. Agent Detail Modal (Slide-in Panel)
When clicking [View Profile], show:
```
┌──────────────────────────────────┐
│ Agent Profile: John Omondi       │
│ ─────────────────────────────────│
│ Phone: 0712345678                │
│ Code: AM001                      │
│ Region: Nairobi | SE: SE001      │
│                                  │
│ 📊 ENGAGEMENT METRICS             │
│ Videos Watched: 12/15 (80%)      │
│ [████████░░] 80%                │
│ Avg Watch Time: 45 min per video│
│ Compliance Score: 85/100         │
│ Last 7 Days Active: 6/7 days     │
│                                  │
│ 🎥 RECENT VIDEOS                 │
│ • Product Basics - 8 min - ✓     │
│ • Customer Service - 15 min - ✓  │
│ • Fraud Prevention - 12 min - ✓  │
│ • Mobile Money Flows - 7 min - ⏻ │
│   (In Progress: 3 min / 45 min)  │
│                                  │
│ 🎫 SUPPORT TICKETS               │
│ Open: 1 | Resolved: 3            │
│ Avg Resolution: 4 hours          │
│ Rating: ⭐⭐⭐⭐ 4.2/5             │
│                                  │
│ [Close] [Send Message]           │
└──────────────────────────────────┘
```

**Data Sources**:
- Agent: `airtelmoney_agents.*`
- Engagement: `am_video_sessions` aggregations
- Recent videos: `am_videos` JOIN `am_video_sessions`
- Tickets: `am_complaints` WHERE agent_id = X

---

### TAB 3: VIDEOS (Training Content Analytics)

**Purpose**: Understand which training content is effective, what needs improvement

**Sections**:

#### A. Video Library Overview (Grid or Table)
```
Video Card Design (for each published video):
┌─────────────────────────────────┐
│ [Thumbnail]                     │
│ Product Basics                  │
│ 8 minutes                       │
│ ─────────────────────────────────│
│ 1,200 views | 1,050 completed   │
│ [████████░░] 87.5% completion   │
│ ⭐ 4.3/5 (from agent feedback)  │
│ Last updated: 2 weeks ago       │
│                                 │
│ [Edit] [Duplicate] [Analytics]  │
└─────────────────────────────────┘
```

**Data Sources**:
- Videos: `am_videos.*` WHERE status='published'
- Views: COUNT DISTINCT agent_id FROM `am_video_sessions` WHERE video_id = X
- Completed: COUNT from `am_video_sessions` WHERE video_id = X AND completed=TRUE
- Completion %: (completed / started) * 100
- Ratings: AVG from `am_complaint_ratings` (if using for feedback)

#### B. Video Deep Dive (Table View)
```
Video Name | Duration | Assigned To | Views | Completed | Completion % | Avg Watch Time | Engagement Score
──────────────────────────────────────────────────────────────────────────────────────────────────────────
Product... │ 8 min    │ All         │ 1,200 │ 1,050    │ 87.5%        │ 7 min 45 sec   │ 92/100
Customer...│ 15 min   │ All         │ 900   │ 650      │ 72%          │ 10 min 30 sec  │ 78/100
Fraud...   │ 12 min   │ SE/ZSM Only │ 450   │ 425      │ 94%          │ 11 min 45 sec  │ 95/100
```

**Data Sources**:
- Videos: `am_videos.*`
- Stats from `am_video_sessions` grouped by video_id
- Targeting info from `am_video_targets` (who it's assigned to)

#### C. Video Performance Trends (Line Charts)
```
"Product Basics" Watch Pattern Over 30 Days
[Line chart: X = Day, Y = New Viewers]
Shows: When people watch, drop-off patterns, trending up/down
```

**Data Sources**:
- GROUP BY date FROM `am_video_sessions.session_start`
- COUNT new viewers per day per video

---

### TAB 4: SUPPORT & FEEDBACK (Complaints Management)

**Purpose**: Track agent support tickets, resolution quality, identify root issues

**Sections**:

#### A. Support Dashboard Cards
```
Open Tickets      Avg Resolution   Customer Rating   This Week Trend
38 tickets        4.2 hours        ⭐⭐⭐⭐ 4.1/5     ↑ +12% resolved
```

**Data Sources**:
- Open tickets: COUNT from `am_complaints` WHERE status='open'
- Resolution time: AVG(resolved_at - created_at) 
- Rating: AVG from `am_complaint_ratings.rating`

#### B. Tickets Table (with Status Workflow)
```
Ticket # │ Agent Name   │ Category      │ Status      │Created  │ Response Time │ Actions
────────────────────────────────────────────────────────────────────────────────────────────
T-1245   │ John O.      │ Feature Issue │ IN PROGRESS │ 30 min  │ 8 min         │ [View] [Respond]
T-1244   │ Jane D.      │ Training Q    │ RESOLVED    │ 2 hours │ 15 min        │ [View] [Reopen]
T-1243   │ Sam K.       │ Technical     │ ON HOLD     │ 4 hours │ —             │ [View] [Resume]
```

**Data Sources**:
- Tickets: `am_complaints.* JOIN airtelmoney_agents`
- Status: `am_complaints.status`
- Timing: created_at, picked_up_at, resolved_at fields
- Responses: `am_complaint_responses`

#### C. Ticket Detail View (Slide-in Panel)
```
┌────────────────────────────────────┐
│ Support Ticket #T-1245             │
│ ────────────────────────────────────│
│ Agent: John Omondi (AM001)         │
│ Category: Payment Processing Issue │
│ Priority: HIGH                     │
│ Status: IN PROGRESS                │
│ Created: 2h 15min ago              │
│ First Response: 8 min later        │
│                                    │
│ TICKET HISTORY                     │
│ [2h 15m ago] John O. reported:     │
│ "Money not posting to wallet..."   │
│                                    │
│ [2h 7m ago] HQ Support replied:    │
│ "Checking with payment processor"  │
│                                    │
│ [Response field] [Send] [Resolve]  │
│ [Close] [Flag for escalation]      │
└────────────────────────────────────┘
```

**Data Sources**:
- Tickets: `am_complaints.*`
- Conversation thread: `am_complaint_responses` ordered by created_at

---

## 5. DESIGN PRINCIPLES (Steve Jobs School of Design)

### Visual Language
- **Color Palette**: Airtel Red (#E60000) as accent, neutral grays (not white—use #F9FAFB), deep charcoal for text
- **Typography**: San Francisco Pro or equivalent, hierarchy through size/weight only
- **Spacing**: 8px grid system, generous whitespace
- **Icons**: Minimal line-based icons (Lucide React style), consistent 24px size
- **Animations**: Subtle transitions (200-300ms ease), no distracting effects

### Data Visualization
- **Charts**: Apple-style simplicity—single color lines, no gridlines, clean axes
- **Tables**: Alternate row colors with 1px borders, hover highlights, keyboard navigation
- **Cards**: Minimal shadows (0 2px 4px rgba), 2px borders in neutral gray
- **Loading States**: Skeleton screens (not spinners), smooth fade-in

### Navigation
- **Top Bar**: High contrast, sticky, show context
- **Tabs**: Text-only tabs with bottom-border indicator, no icons (reduce visual noise)
- **Modals/Panels**: Slide in from right, backdrop blur, swipe to close on mobile

### Interactions
- **Forms**: Clear labels, inline validation, single-column layout
- **Search**: Autocomplete suggestions, filters visible as chips, live results
- **Buttons**: Primary action in red, secondary in gray, disabled state clear
- **Sorting/Filtering**: Column headers clickable, active sort highlighted, filter badge shows count

---

## 6. RESPONSIVE BEHAVIOR

**Target**: Desktop-first (1366px min width)
- Sidebar navigation (sticky) on left
- Content area responsive
- Tables: Horizontal scroll on tablets, collapse to card view on mobile
- 3D toggle: Gracefully degrades to 2D on lower-spec devices

---

## 7. PERFORMANCE REQUIREMENTS

- **Initial Load**: < 2 seconds (dashboard tab)
- **Tab Switching**: < 500ms (cached data)
- **Search/Filter**: < 300ms (live as you type)
- **3D Mode**: 60fps animation, WebGL context detection
- **Data Refresh**: Auto-refresh metrics every 5 minutes (configurable)

---

## 8. ACCESSIBILITY

- **WCAG 2.1 AA** compliance
- Keyboard navigation (Tab, Arrow keys, Enter)
- Screen reader friendly (semantic HTML, ARIA labels)
- High contrast mode support
- Focus indicators prominent (not subtle)

---

## 9. FUTURE ROADMAP (Phase 2+)

- **AI Insights**: "Agent John is struggling with video X—recommend re-training"
- **Predictive Analytics**: "Ticket volume likely to spike Thursday—prepare team"
- **Custom Reports**: Drag-and-drop report builder
- **Mobile App**: iOS/Android companion app with push notifications
- **Automations**: Rule-based escalations, auto-assign tickets

---

## 10. SAMPLE UI MOCKUP STRUCTURE

```
TOP NAV (Fixed)
├─ Logo + "Airtel Money HQ"
├─ [3D Toggle] [Theme Toggle] [User Menu ▼]
└─ Search Bar

TAB NAVIGATION
├─ Dashboard
├─ Agents  
├─ Videos
└─ Support

MAIN CONTENT (Responsive)
├─ Dashboard Tab
│  ├─ KPI Cards Grid (4 columns on desktop)
│  ├─ Top Performers Section
│  ├─ Activity Timeline Chart
│  └─ Video Funnel Visualization
│
├─ Agents Tab
│  ├─ Search + Filters
│  ├─ Sortable Table
│  └─ Agent Detail Slide-in Panel
│
├─ Videos Tab
│  ├─ Video Grid/List Toggle
│  ├─ Video Cards or Table
│  └─ Performance Trends Chart
│
└─ Support Tab
   ├─ Support KPI Cards
   ├─ Tickets Table with Status
   └─ Ticket Detail Slide-in Panel

FOOTER (Sticky)
└─ Last updated: 2 min ago | [Manual Refresh] | Help
```

---

## 11. KEY DATA CALCULATIONS (Backend Queries)

### Agent Compliance Score (Custom Metric)
```sql
SELECT 
  agent_id,
  (CAST(COUNT(DISTINCT CASE WHEN completed THEN video_id END) AS FLOAT) / 
   COUNT(DISTINCT video_id)) * 100 AS completion_rate
FROM am_video_sessions
GROUP BY agent_id
```

### Video Engagement Score (Custom Metric)
```sql
SELECT
  video_id,
  COUNT(DISTINCT agent_id) as viewers,
  COUNT(DISTINCT CASE WHEN completed THEN agent_id END) as completers,
  AVG(duration_watched_secs) as avg_watch_time,
  (CAST(COUNT(DISTINCT CASE WHEN completed THEN agent_id END) AS FLOAT) /
   COUNT(DISTINCT agent_id)) * 100 as completion_pct
FROM am_video_sessions
GROUP BY video_id
```

### Ticket Resolution Efficiency
```sql
SELECT
  status,
  COUNT(*) as ticket_count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours_to_resolve
FROM am_complaints
GROUP BY status
```

---

## 12. CRITICAL USER FLOWS

### Flow 1: Executive Morning Briefing
User opens dashboard → Glances at KPI cards (5 sec) → Checks "Top Performers" → Switches to "Support" tab to see open tickets → Reviews one ticket detail → Done (< 2 min total)

### Flow 2: Agent Performance Investigation
User searches for agent "John" in Agents tab → Clicks [View Profile] → Reviews watch history and videos → Identifies gaps → Clicks [Send Message] to coach agent → Done (< 5 min)

### Flow 3: Video Content Quality Assessment
User goes to Videos tab → Sorts by "Completion %" → Identifies "Customer Service" video with only 60% completion → Clicks [Analytics] → Sees that drop-off happens at 10-minute mark → Notes: "Need to trim video or add engagement elements" → Done (< 10 min)

---

## 13. SUCCESS METRICS (OKRs)

- **Adoption**: 90% of HQ team logs in weekly
- **Engagement**: Average session time > 15 minutes
- **Decision Velocity**: HQ can identify underperforming agents in < 5 minutes
- **Video Compliance**: Increase agent video-watching from 70% to 90% within 3 months
- **Support Quality**: Reduce average ticket resolution time from 5 hours to 3 hours

---

## 14. DESIGN INSPIRATION REFERENCES

- **Apple Dashboard**: Simplicity, card-based layout
- **GitHub Analytics**: Clean data presentation, interactive charts
- **Slack Admin Panel**: Dropdown filters, table sorting
- **Superhuman**: Keyboard-first design, speed as a feature
- **Linear**: Minimalist incident management UI

---

## SUMMARY

This prompt describes a **sophisticated yet simple** HQ analytics dashboard that:
- ✅ Provides actionable insights at a glance
- ✅ Eliminates unnecessary complexity
- ✅ Respects the user's time (fast loading, efficient workflows)
- ✅ Scales from overview (dashboard) to deep-dive (agent profiles)
- ✅ Leverages existing Supabase data structures efficiently
- ✅ Embodies Steve Jobs' philosophy: *"Simplicity is the ultimate sophistication"*

The dashboard is a **decision-making tool**, not a data dump—designed for HQ leaders to quickly understand performance and take action.
