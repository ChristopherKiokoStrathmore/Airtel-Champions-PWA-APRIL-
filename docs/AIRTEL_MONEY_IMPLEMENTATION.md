# Airtel Money Module - Complete Implementation Guide

## Overview

This guide covers the complete Airtel Money module implementation, which includes:
- Agent self-registration & login
- HQ admin dashboard with video management
- Agent video training library with progress tracking
- Complaint/ticket system with ratings
- Comprehensive analytics & reporting

---

## Architecture

### Database Schema

**Core Tables:**
- `AIRTELMONEY_HQ` - HQ admin accounts (modified from existing table)
- `AIRTELMONEY_AGENTS` - Self-registered agents
- `am_videos` - Training video library
- `am_video_targets` - Targeting rules for videos (zone/agent/se/zsm)
- `am_video_sessions` - Watch tracking with granular position samples
- `am_complaints` - Support tickets
- `am_complaint_responses` - Admin responses to tickets
- `am_complaint_ratings` - Agent ratings of resolved tickets

**Storage Buckets:**
- `am-videos` - Training video files (public, 100MB max)
- `am-complaint-photos` - Complaint attachment photos (public, 10MB max)

---

## Setup Instructions

### 1. Database Schema Setup

Run the SQL migration to create all tables:

```bash
# In Supabase SQL Editor:
# Copy contents of: src/utils/supabase/airtel-money-schema.sql
# Paste and execute
```

**Key modifications to existing tables:**
- `AIRTELMONEY_HQ.role` - Added (default: 'airtel_money_admin')
- `AIRTELMONEY_HQ.last_login_at` - Added (for tracking)

### 2. Storage Buckets Setup

Run the storage configuration script:

```bash
# Option A: SQL Editor (recommended)
# Copy contents of: src/utils/supabase/setup-storage.sql
# Paste and execute in Supabase SQL Editor

# Option B: Manual via Dashboard
# Storage → New Bucket
#   1. Create bucket "am-videos" (public)
#   2. Create bucket "am-complaint-photos" (public)
```

### 3. Row-Level Security (RLS)

All tables have RLS enabled with anon policy allowing full access:
```sql
CREATE POLICY "anon_all" ON table_name FOR ALL TO anon USING (true) WITH CHECK (true);
```

This is required because the app uses custom phone/PIN authentication, not Supabase Auth.

---

## Feature Breakdown

### Feature 1: Admin Role & HQ Dashboard

**What it does:**
- HQ admins log in with phone/PIN (stored in AIRTELMONEY_HQ table)
- Access admin dashboard with full control over videos, agents, complaints

**UI Components:**
- `am-hq-dashboard.tsx` - Main dashboard with tabs:
  - Overview: KPI summary
  - Videos: Upload, manage, view analytics
  - Agents: See all agents with watch progress
  - Complaints: Review and respond to tickets

**API Functions:**
```typescript
amAdminLogin(phone, pin)      // Authenticate admin
getAllVideos()                // List all videos
getAllAgentsWithProgress()    // Agents + watch stats
getAllComplaints(statusFilter) // Complaints with responses
```

**Setup Notes:**
- Admins are pre-registered in AIRTELMONEY_HQ
- No self-registration for admins
- Each admin can manage all content

---

### Feature 2: Video System with Targeting

**What it does:**
- Admins upload training videos
- Videos can be targeted to specific zones/SE/ZSM/agents
- All agents see non-targeted videos
- Agents see targeted videos only if they match criteria

**UI Components:**
- `am-video-player.tsx` - Video player with automatic tracking
- HQ Dashboard → Videos tab - Upload, manage, view analytics

**Video Lifecycle:**
1. Admin uploads video file → stored in `am-videos` bucket
2. Video record created → `am_videos` table
3. Admin sets targeting rules (optional) → `am_video_targets` table
4. Agents fetch their visible videos → filtered by targets
5. Agent plays video → watch session starts
6. Position samples recorded every 5 seconds → `position_samples` JSONB
7. Session ends → `duration_watched_secs`, `max_position_secs` updated

**API Functions:**
```typescript
uploadVideoFile(file)                    // Upload to storage + create record
createVideo(fields)                      // Create video record
setVideoTargets(videoId, targets)        // Set targeting rules
getVideosForAgent(agentId)              // Get visible videos (respects targets)
deleteVideo(id, url)                     // Delete from storage + DB

// Video watching
startWatchSession(agentId, videoId)      // Start tracking
appendPositionSample(sessionId, sample)  // Record position every 5s
endWatchSession(sessionId, ...)          // Finalize session
getLatestSession(agentId, videoId)       // Get resume position
```

**Targeting Rules:**
```
target_type: 'zone' | 'agent' | 'se' | 'zsm'
target_value: specific zone name, agent_id, SE name, or ZSM name
```

Example: Target video to "Nairobi" zone only:
```
video_id: "uuid-123"
target_type: "zone"
target_value: "Nairobi"
```

---

### Feature 3: Video Analytics & Tracking

**What it does:**
- Track which agents watched each video
- Capture granular position data (where they watched to)
- Show drop-off patterns
- Calculate completion percentages
- Per-agent progress tracking

**Data Captured Per Session:**
```
{
  agent_id: 123
  video_id: "uuid"
  session_start: "2026-04-15T10:30:00Z"
  session_end: "2026-04-15T10:45:00Z"
  duration_watched_secs: 600       // actual watch time
  max_position_secs: 720           // furthest point reached
  completed: true                  // if >= 90% watched
  position_samples: [
    { t: 10, p: 120 },             // at 10s into session, at 120s in video
    { t: 15, p: 130 },
    ...
  ]
}
```

**Admin Analytics View:**
- Total views
- Unique agents
- Completion rate
- Average watch time
- Drop-off points (where agents stop)
- Per-agent progress table

**API Functions:**
```typescript
getVideoAnalytics(videoId) // Get comprehensive analytics
```

Returns:
```typescript
{
  video_id: string
  total_views: number
  unique_agents: number
  avg_completion_pct: number
  completion_count: number
  total_watch_secs: number
  drop_off_points: Array<{ position_secs, drop_count }>
  agent_progress: Array<{
    agent_id, agent_name, max_position_secs,
    completed, session_count, last_watched
  }>
}
```

---

### Feature 4: Complaint Ticket System

**What it does:**
- Agents submit support tickets with category, description, optional photo
- HQ admins review, respond, update status
- Agents can rate resolved tickets
- Full conversation history preserved

**Complaint Status Workflow:**
```
Open → In Progress → Resolved
                  ↓
                Rating (agent feedback)
```

**UI Components:**
- `am-complaints.tsx` - Agent complaint interface:
  - List all their tickets
  - Create new ticket
  - View ticket details & responses
  - Rate resolved tickets
- HQ Dashboard → Complaints tab:
  - Browse all complaints
  - Filter by status
  - View agent info & photo
  - Reply in-line
  - Update status with timestamps

**Data Captured:**
```typescript
Complaint {
  id, agent_id, category, description, photo_url,
  status: 'open' | 'in_progress' | 'resolved',
  picked_up_at, resolved_at, created_at
  // joined data:
  responses: [...],                   // all admin replies
  rating: { rating, comment } | null  // if rated
}
```

**Categories:**
- Transaction Issue
- System/App Error
- Customer Complaint
- Float Management
- Commission Query
- Registration Issue
- Security Concern
- Other

**API Functions:**
```typescript
submitComplaint(fields)                    // Agent submits ticket
getAgentComplaints(agentId)               // Agent's tickets
getAllComplaints(statusFilter)             // Admin view
respondToComplaint(fields)                 // Admin responds + updates status
rateComplaint(fields)                      // Agent rates (1-5 stars + comment)
```

---

### Feature 5: Agent Self-Registration

**What it does:**
- Agents sign up with name, phone, codes, manager info
- Cascading dropdowns: SE selection auto-fills ZSM/Zone
- Smart lookups: managers pulled from `app_users` table
- Immediately can log in after signup

**Registration Form Fields:**
1. Full Name
2. Phone Number
3. Super Agent Number
4. Agent Code
5. SE (Sales Executive) - searchable dropdown
6. ZSM (Zonal Sales Manager) - auto-fills from SE, searchable
7. Zone - auto-fills from ZSM, searchable
8. PIN (4-6 digits)

**Cascade Logic:**
- Select SE → auto-populate ZSM and Zone from SE's profile
- Change ZSM → auto-populate Zone from ZSM's profile
- All fields remain editable

**API Functions:**
```typescript
amSignUp(fields)                  // Register new agent
amAgentLogin(phone, pin)          // Agent login
fetchAppUsersByRole(role)         // Get SE/ZSM dropdown options
```

**Validation:**
- Phone must be unique
- PIN must be 4-6 digits

---

## File Structure

```
src/
├── components/airtel-money/
│   ├── am-api.ts                         # All API functions
│   ├── AMSignUpForm.tsx                  # Registration form
│   ├── am-complaints.tsx                 # Agent complaint interface
│   ├── am-video-player.tsx               # Video player with tracking
│   ├── am-agent-dashboard.tsx            # Agent home screen
│   ├── am-hq-dashboard.tsx               # Admin dashboard
│   ├── am-education.tsx                  # Education section
│   └── LoginPage.tsx                     # Login router
└── utils/supabase/
    ├── airtel-money-schema.sql           # DB tables
    └── setup-storage.sql                 # Storage buckets
```

---

## Authentication Flow

### Agent Login
```
Agent enters phone + PIN
→ Query AIRTELMONEY_AGENTS table
→ Match PIN
→ Update last_login_at
→ Return agent data & show dashboard
```

### Admin Login
```
Admin enters phone + PIN
→ Query AIRTELMONEY_HQ table
→ Convert phone to numeric (9-digit or 12-digit)
→ Match PIN
→ Update last_login_at
→ Return admin data & show dashboard
```

### Local Storage (Session Persistence)
App stores auth state in localStorage:
```
{
  userType: 'agent' | 'admin',
  id: number,
  full_name: string,
  phone: string,
  ...additional fields
}
```

---

## Upload Limits & Configuration

### Video Files
- **Bucket:** `am-videos`
- **Max size:** 100MB per file
- **Supported types:** MP4, WebM, OGG, etc.
- **Storage:** Public (accessible via URL)

### Complaint Photos
- **Bucket:** `am-complaint-photos`
- **Max size:** 10MB per file
- **Supported types:** JPEG, PNG, GIF
- **Storage:** Public (accessible via URL)

---

## Deployment Checklist

- [ ] Run `airtel-money-schema.sql` in Supabase
- [ ] Run `setup-storage.sql` in Supabase (or create buckets manually)
- [ ] Pre-populate `AIRTELMONEY_HQ` with admin accounts
- [ ] Verify storage bucket access policies
- [ ] Test agent registration flow
- [ ] Test admin login & video upload
- [ ] Test agent video playback & tracking
- [ ] Test complaint submission & HQ response
- [ ] Verify RLS policies (should allow anon access)
- [ ] Test analytics calculations
- [ ] Load test with 100+ agents watching videos

---

## Troubleshooting

### Issue: Video upload fails
**Solution:**
1. Check storage bucket exists and is public
2. Verify RLS policies allow anon uploads
3. Check file size < 100MB

### Issue: Agents don't see targeted videos
**Solution:**
1. Verify `am_video_targets` entries are correct
2. Ensure `is_targeted = true` on video record
3. Check agent's zone/SE/ZSM matches target values

### Issue: Watch position not updating
**Solution:**
1. Check `am_video_sessions` table has records
2. Verify `position_samples` JSONB is being appended
3. Check browser console for errors

### Issue: Admin can't log in
**Solution:**
1. Verify phone exists in `AIRTELMONEY_HQ`
2. Check PIN matches exactly (numeric)
3. Ensure `last_login_at` column exists

---

## Performance Optimization

### Indexing
Already created indexes for:
- `am_video_sessions(agent_id)`
- `am_video_sessions(video_id)`
- `am_complaints(agent_id)`
- `am_complaints(status)`

### Dashboards
Analytics queries aggregate on-demand. For large datasets:
- Consider caching in Redis
- Pre-compute daily analytics snapshots
- Paginate agent lists

---

## Future Enhancements

1. **AI-powered insights:** Auto-detect struggling agents based on video engagement
2. **Batch operations:** Bulk-assign videos to zones
3. **Reporting:** Export analytics as PDF/Excel
4. **Mobile app:** Native iOS/Android apps
5. **Notifications:** Real-time alerts for new complaints
6. **Performance metrics:** Revenue correlation with training completion
7. **Gamification:** Leaderboards, badges for completion

---

## Support & Questions

For issues or questions:
1. Check Supabase logs for SQL errors
2. Check browser DevTools console for client errors
3. Verify RLS policies in Supabase Settings
4. Test queries directly in Supabase SQL Editor
