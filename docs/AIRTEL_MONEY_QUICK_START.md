# Airtel Money - Quick Start Testing Guide

## Prerequisites

- Supabase project set up with airtel-money-schema.sql applied
- Storage buckets created (or setup-storage.sql applied)
- App running locally: `npm run dev`

---

## Test Scenario: Complete User Journey

### Phase 1: Admin Setup (5 min)

**Goal:** Set up HQ admins and test admin dashboard

1. **Access Supabase Dashboard** → AIRTELMONEY_HQ table
2. **Insert test admin:**
   ```sql
   INSERT INTO "AIRTELMONEY_HQ" (Name, number, PIN, role)
   VALUES ('Test Admin', 712000001, 5678, 'airtel_money_admin');
   ```
3. **Open app** → Click "Airtel Money" cube
4. **Click "Sign In as HQ Admin"**  
5. **Login:** Phone: `0712000001` | PIN: `5678`
6. **Expected:** Redirect to HQ dashboard with Overview tab showing 0 agents, 0 videos, etc.

---

### Phase 2: Video Management (10 min)

**Goal:** Upload a test video and set targeting

1. **In HQ Dashboard** → Click "Videos" tab
2. **Click "Upload Video"**
3. **Fill form:**
   - Title: "Cash In Process Training"
   - Description: "Step-by-step guide to cash in"
   - Category: "Cash In/Out"
   - Status: "Published"
4. **Select video file:** Any MP4 (5-30 sec for testing)
5. **Click "Upload Video"**
6. **Expected:** Video appears in videos table within 10 seconds
7. **Analytics test:**
   - Click "Analytics" button on video row
   - Should show: 0 views, 0 agents, 0% completion (no agents yet)

---

### Phase 3: Agent Self-Registration (5 min)

**Goal:** Register a test agent

1. **Log out** → Click "Sign In" → "Agent Registration"
2. **Register with:**
   - Full Name: "Alice Test"
   - Phone: `0789999999`
   - Super Agent No: `SA-TEST-001`
   - Agent Code: `AGT-TEST-001`
   - SE: *Select from dropdown*
   - ZSM: *Should auto-populate based on SE*
   - Zone: *Should auto-populate based on ZSM*
   - PIN: `1234`
3. **Click "Create Account"**
4. **Expected:** Immediately logged in to agent dashboard

---

### Phase 4: Agent Views Videos & Watch Tracking (5 min)

**Goal:** Test video visibility and position tracking

1. **In agent dashboard** → Click "Training Video" section
2. **Expected:** See the video from Phase 2
3. **Click video thumbnail to play**
4. **Expected:** Video player opens with playback controls
5. **Watch video for ~30 seconds**
6. **Pause, close, or finish**

---

### Phase 5: Admin Views Analytics (2 min)

**Goal:** Verify tracking data was saved

1. **Back to Supabase** → Open `am_video_sessions` table
2. **Should see:** 1 new row with:
   - `agent_id`: Agent from Phase 3
   - `video_id`: Video from Phase 2
   - `max_position_secs`: ~30 (where they stopped)
   - `position_samples`: Array of {t, p} samples
   - `completed`: false (didn't watch 90%)

3. **Back to HQ Dashboard** → Videos tab → Analytics
4. **Should now show:**
   - 1 total view
   - 1 unique agent
   - 30% completion (max_position / duration)
   - Agent progress table shows Alice Test

---

### Phase 6: Complaint Submission & Response (10 min)

**Goal:** Test ticket system end-to-end

**As Agent Alice:**
1. **Agent Dashboard** → Click "Complaints" or "Support"
2. **Click "New Ticket"**
3. **Fill form:**
   - Category: "Transaction Issue"
   - Description: "Cannot process 10,000 KES deposit"
   - Photo: *Optional - upload screenshotif available*
4. **Submit**
5. **Expected:** Ticket created, shows in list with "Open" status

**As Admin:**
1. **HQ Dashboard** → "Complaints" tab
2. **Should see:**
   - 1 total complaint
   - Status: Open
   - Category: Transaction Issue
   - Agent: Alice Test
3. **Click to expand complaint**
4. **In reply box:** Type message
   - "We've escalated to our technical team. They will contact you within 24 hours."
5. **Status dropdown:** Select "In Progress"
6. **Click "Send"**
7. **Expected:**
   - Response appears under responses
   - Status changes to "In Progress"
   - `picked_up_at` timestamp set

**Back as Agent:**
1. **Refresh agents dashboard**
2. **Click complaint**
3. **Should see:**
   - Admin's response message
   - Status: "In Progress"
   - Timestamp of response
4. **After admin marks "Resolved":**
   - See rating form (1-5 stars)
   - Enter: 5 stars + "Very helpful, issue resolved!"

---

### Phase 7: Targeting Videos (5 min)

**Goal:** Test video visibility restrictions

**Setup:**
1. **Create 2nd agent:**
   - Phone: `0789999998`
   - Zone: "Central" (different from Alice)
   - Register & note agent ID

2. **Back to HQ** → Upload new video:
   - Title: "Nairobi Only Training"
   - Publish
   - **Immediately click to expand options**
   - Check "Is Targeted"
   - Set targets:
     - Zone = "Nairobi"
   - Save

3. **Agent Alice (Nairobi):** Should see "Nairobi Only Training" video
4. **Agent 2 (Central):** Should NOT see it

---

## Test Data Checklist

```
□ 1 admin created (AIRTELMONEY_HQ)
□ 1 video uploaded (am_videos)
□ 2 agents registered (AIRTELMONEY_AGENTS)
□ 1 watch session (am_video_sessions)
□ 1 complaint submitted (am_complaints)
□ 1 admin response (am_complaint_responses)
□ 1 rating submitted (am_complaint_ratings)
```

---

## Quick Sanity Checks

### Database
```sql
-- Count records in each table
SELECT 'AIRTELMONEY_HQ' as table_name, COUNT(*) FROM "AIRTELMONEY_HQ"
UNION ALL
SELECT 'AIRTELMONEY_AGENTS', COUNT(*) FROM "AIRTELMONEY_AGENTS"
UNION ALL
SELECT 'am_videos', COUNT(*) FROM am_videos
UNION ALL
SELECT 'am_video_sessions', COUNT(*) FROM am_video_sessions
UNION ALL
SELECT 'am_complaints', COUNT(*) FROM am_complaints
UNION ALL
SELECT 'am_complaint_responses', COUNT(*) FROM am_complaint_responses
UNION ALL
SELECT 'am_complaint_ratings', COUNT(*) FROM am_complaint_ratings;
```

### Storage Buckets
```
Supabase Dashboard → Storage → You should see:
- am-videos (with uploaded video)
- am-complaint-photos (empty or with photos)
```

### RLS Policies
```
Supabase Dashboard → Authentication → Policies
- All tables should have RLS enabled
- anon role should have "all" policies for full CRUD
```

---

## Common Issues & Fixes

### Issue: "An account with this phone number already exists"
**Fix:** Use a different phone number (e.g., add 1: 0789999998)

### Issue: Analytics show 0 agents but I watched a video
**Possible cause:**
- Video not marked as `is_targeted = false` and no targets set
- Agent's zone/SE/ZSM doesn't match targets

**Fix:** 
1. Check `am_videos.is_targeted` = false for non-targeted videos
2. Or verify `am_video_targets` rows exist and match agent profile

### Issue: Complaint doesn't show on HQ dashboard
**Possible cause:**
- Status filter applied (e.g., only showing "resolved")
- Agent ID mismatch

**Fix:**
1. Click "Status" dropdown to see all
2. Check `am_complaints.agent_id` matches agent record

### Issue: Video upload hangs
**Possible cause:**
- Storage bucket doesn't exist or is not public
- File too large (> 100MB)

**Fix:**
1. Verify buckets in Supabase Storage section
2. Test with smaller video (< 50MB)
3. Check browser DevTools Network tab for upload errors

### Issue: Can't log in as admin
**Possible cause:**
- Phone number format incorrect
- PIN is numeric but stored as text in DB
- Record doesn't exist in AIRTELMONEY_HQ

**Fix:**
1. Verify phone number is correct 10-digit format
2. Check PIN in database is numeric: `SELECT PIN, typeof(PIN) FROM "AIRTELMONEY_HQ" LIMIT 1;`
3. Verify record exists: `SELECT * FROM "AIRTELMONEY_HQ" WHERE number = 712000001;`

---

## Performance Testing

Once basic flow works, test with larger dataset:

```sql
-- Insert 100 test agents
INSERT INTO "AIRTELMONEY_AGENTS" (full_name, phone, super_agent_number, agent_code, se, zsm, zone, pin)
SELECT
  'Agent ' || generate_series(100, 199),
  '0' || (700000000 + generate_series(100, 199))::text,
  'SA-' || generate_series(100, 199),
  'AGT-' || generate_series(100, 199),
  'John Kamau',
  'Peter Smith',
  'Nairobi',
  '1234';

-- Create 50 watch sessions for each agent searching for video uuid first
-- (Complex - use app to test)
```

Then test HQ dashboard performance:
- Agents tab loads smoothly
- Analytics tab calculates within 2 seconds
- Video list remains responsive

---

## Success Criteria

All tests pass if:

- ✅ Admin can log in and see dashboard
- ✅ Admin can upload video and see it in list
- ✅ Admin can view video analytics
- ✅ Agent can register without errors
- ✅ Agent sees uploaded videos
- ✅ Agent can play video and see controls
- ✅ Watch session appears in database
- ✅ Analytics update with agent's data
- ✅ Agent can submit complaint with photo
- ✅ Admin sees complaint and can respond
- ✅ Admin can update complaint status
- ✅ Agent can rate resolved complaint
- ✅ Targeted videos only show to matching agents
- ✅ No errors in browser console or Supabase logs

---

## Next Steps After Testing

1. **Load test:** Use tools like k6 or Artillery to simulate 100+ concurrent agents
2. **UAT:** Have actual field agents test on various phone models
3. **Monitoring:** Set up error tracking (Sentry, LogRocket)
4. **Backup:** Configure Supabase backup schedule
5. **Analytics:** Set up analytics dashboard (Metabase, Looker Studio)
6. **Documentation:** Create user guides for agents and admins
