# 📐 TAI ARCHITECTURE DIAGRAM

## Current State (BROKEN - Why You're in a Loop)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  Director Dashboard → Creates Program                          │
│  SE Dashboard → Views Programs & Submits                       │
│                                                                 │
│  Components:                                                   │
│  ├─ programs-widget-home.tsx                                  │
│  ├─ programs-dashboard.tsx                                    │
│  ├─ program-creator.tsx                                       │
│  └─ program-submit-modal.tsx                                  │
│                                                                 │
│  Code:                                                         │
│  supabase.from('programs').select()  ← DIRECT CALL            │
│  supabase.from('submissions').insert() ← DIRECT CALL          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Uses 'anon' role
                   │ Limited permissions
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                          │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────┐            │
│  │  SYSTEM A: TABLES   │  │  SYSTEM B: KV STORE  │            │
│  │  (Frontend needs)   │  │  (Backend uses)      │            │
│  ├─────────────────────┤  ├──────────────────────┤            │
│  │ programs            │  │ kv_store_28f2f653    │            │
│  │ program_fields      │  │                      │            │
│  │ submissions         │  │ Keys:                │            │
│  │                     │  │ programs:id          │            │
│  │ Status:             │  │ program_fields:id    │            │
│  │ ❌ RLS ENABLED      │  │ submissions:id       │            │
│  │ ❌ No permissions   │  │                      │            │
│  │ OR doesn't exist    │  │ Status:              │            │
│  │                     │  │ ✅ After ONE-CLICK   │            │
│  └─────────────────────┘  └──────────────────────┘            │
│         ↑                           ↑                           │
│         │                           │                           │
│         │ ❌ BLOCKED                │ ✅ WORKS                 │
│         │                           │                           │
└─────────┼───────────────────────────┼───────────────────────────┘
          │                           │
          │                           │
    Frontend tries                Backend uses
    to access but                 service_role
    has no permission             (full access)
          │                           │
          │                           │
          └─── THE GAP ───────────────┘
              (Why you're in a loop)


┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Edge Functions)                     │
│                                                                 │
│  /supabase/functions/server/programs-kv.tsx                    │
│                                                                 │
│  Routes:                                                       │
│  ├─ GET  /programs           ← NOT USED BY FRONTEND           │
│  ├─ GET  /programs/:id       ← NOT USED BY FRONTEND           │
│  ├─ POST /programs           ← NOT USED BY FRONTEND           │
│  └─ POST /programs/:id/submit ← NOT USED BY FRONTEND          │
│                                                                 │
│  Uses: kv_store_28f2f653 (SYSTEM B)                           │
│  Role: service_role (FULL PERMISSIONS)                        │
│                                                                 │
│  Status: ✅ READY BUT DISCONNECTED FROM FRONTEND               │
└─────────────────────────────────────────────────────────────────┘
```

---

## After COMPLETE-PROGRAMS-FIX.sql (WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  Director Dashboard → Creates Program                          │
│  SE Dashboard → Views Programs & Submits                       │
│                                                                 │
│  Components:                                                   │
│  ├─ programs-widget-home.tsx                                  │
│  ├─ programs-dashboard.tsx                                    │
│  ├─ program-creator.tsx                                       │
│  └─ program-submit-modal.tsx                                  │
│                                                                 │
│  Code:                                                         │
│  supabase.from('programs').select()  ← DIRECT CALL            │
│  supabase.from('submissions').insert() ← DIRECT CALL          │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Uses 'anon' role
                   │ NOW HAS FULL PERMISSIONS ✅
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                          │
│                                                                 │
│  ┌─────────────────────┐  ┌──────────────────────┐            │
│  │  SYSTEM A: TABLES   │  │  SYSTEM B: KV STORE  │            │
│  │  (Frontend uses)    │  │  (Backend ready)     │            │
│  ├─────────────────────┤  ├──────────────────────┤            │
│  │ programs            │  │ kv_store_28f2f653    │            │
│  │ program_fields      │  │                      │            │
│  │ submissions         │  │ Keys:                │            │
│  │                     │  │ programs:id          │            │
│  │ Status:             │  │ program_fields:id    │            │
│  │ ✅ RLS DISABLED     │  │ submissions:id       │            │
│  │ ✅ FULL PERMISSIONS │  │                      │            │
│  │ ✅ Tables exist     │  │ Status:              │            │
│  │ ✅ Sample data      │  │ ✅ RLS DISABLED      │            │
│  └─────────────────────┘  └──────────────────────┘            │
│         ↑                           ↑                           │
│         │                           │                           │
│         │ ✅ WORKS                  │ ✅ WORKS                 │
│         │                           │                           │
└─────────┼───────────────────────────┼───────────────────────────┘
          │                           │
          │                           │
    Frontend can                  Backend can
    access tables                 access KV store
    with anon role                with service_role
          │                           │
          │                           │
          └─── GAP BRIDGED ───────────┘
              (Loop broken!)
```

---

## Proper Architecture (Track 2 - Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                                                                 │
│  Director Dashboard → Creates Program                          │
│  SE Dashboard → Views Programs & Submits                       │
│                                                                 │
│  Components:                                                   │
│  ├─ programs-widget-home.tsx                                  │
│  ├─ programs-dashboard.tsx                                    │
│  ├─ program-creator.tsx                                       │
│  └─ program-submit-modal.tsx                                  │
│                                                                 │
│  NEW CODE:                                                     │
│  import { programsAPI } from './programs-api'                 │
│  programsAPI.listPrograms(role, userId) ← API CALL            │
│  programsAPI.submitResponse(id, data)   ← API CALL            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Fetch API calls
                   │ Uses publicAnonKey (safe)
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Edge Functions)                     │
│                                                                 │
│  /supabase/functions/server/programs-kv.tsx                    │
│                                                                 │
│  Routes:                                                       │
│  ├─ GET  /programs           ✅ FRONTEND USES THIS            │
│  ├─ GET  /programs/:id       ✅ FRONTEND USES THIS            │
│  ├─ POST /programs           ✅ FRONTEND USES THIS            │
│  └─ POST /programs/:id/submit ✅ FRONTEND USES THIS           │
│                                                                 │
│  Business Logic:                                               │
│  ├─ Validation (required fields, data types)                  │
│  ├─ Authorization (role-based access)                         │
│  ├─ Rate limiting (prevent spam)                              │
│  ├─ Analytics calculation                                     │
│  └─ Hierarchical filtering (ZSM sees only their SEs)          │
│                                                                 │
│  Uses: service_role key (FULL PERMISSIONS)                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ Uses service_role
                   │ Backend decides what data to return
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┤
│  │  KV STORE (Single Source of Truth)                         │
│  ├─────────────────────────────────────────────────────────────┤
│  │  kv_store_28f2f653                                         │
│  │                                                             │
│  │  Keys:                                                      │
│  │  programs:competitor-intel      → Program metadata         │
│  │  program_fields:field-1         → Form field definition    │
│  │  submissions:prog-id:subm-id    → User response            │
│  │                                                             │
│  │  Benefits:                                                  │
│  │  ✅ Flexible schema (no migrations)                        │
│  │  ✅ Fast key-based lookups                                 │
│  │  ✅ Works great for offline-first                          │
│  │  ✅ Simpler than relational tables                         │
│  │                                                             │
│  │  Status:                                                    │
│  │  ✅ RLS DISABLED                                           │
│  │  ✅ Backend has full access                                │
│  │  ✅ Frontend NEVER touches this directly                   │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
│  Optional: Tables for reporting/analytics                      │
│  ┌─────────────────────────────────────────────────────────────┤
│  │  programs, program_fields, submissions                     │
│  │  (Synced from KV store for SQL queries)                    │
│  │  ✅ RLS ENABLED with proper policies                       │
│  │  ✅ Read-only for frontend                                 │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ Secure (frontend can't bypass business logic)
✅ Flexible (change backend without touching frontend)
✅ Fast (backend caches, rate limits, optimizes)
✅ Maintainable (one source of truth for logic)
✅ Scalable (handles 662 users easily)
```

---

## Data Flow: Director Creates Program

### Current State (After COMPLETE-PROGRAMS-FIX.sql)

```
1. Director clicks "Create Program"
       ↓
2. program-creator.tsx renders form
       ↓
3. Director fills in:
   - Title: "Site Visit Report"
   - Target: "Sales Executives"
   - Points: 50
   - Fields: [Site Name, Visit Date, Photo]
       ↓
4. Director clicks "Save"
       ↓
5. Frontend: supabase.from('programs').insert({...})
       ↓
6. Database: INSERT INTO programs (...)
       ↓
7. Success! Program created ✅
       ↓
8. Frontend: Refreshes program list
       ↓
9. SEs can now see "Site Visit Report"
```

### Proper Architecture (Track 2)

```
1. Director clicks "Create Program"
       ↓
2. program-creator.tsx renders form
       ↓
3. Director fills in:
   - Title: "Site Visit Report"
   - Target: "Sales Executives"
   - Points: 50
   - Fields: [Site Name, Visit Date, Photo]
       ↓
4. Director clicks "Save"
       ↓
5. Frontend: programsAPI.createProgram({...})
       ↓
6. API Call: POST /make-server-28f2f653/programs
       ↓
7. Backend: programs-kv.tsx receives request
       ↓
8. Backend: Validates data
   - Title not empty? ✅
   - Points > 0? ✅
   - Target roles valid? ✅
   - Fields properly formatted? ✅
       ↓
9. Backend: Checks authorization
   - User role = director? ✅
   - Has permission to create? ✅
       ↓
10. Backend: Generates unique ID
    - programId = "program-1736086400-a7b3c9d1e"
        ↓
11. Backend: Stores in KV
    - kv.set('programs:program-123...', {title, points, ...})
    - kv.set('program_fields:field-1', {label, type, ...})
    - kv.set('program_fields:field-2', {label, type, ...})
    - kv.set('program_fields:field-3', {label, type, ...})
        ↓
12. Backend: Returns success
    - { success: true, program: {...} }
        ↓
13. Frontend: Shows success message
    - "✅ Program created successfully!"
        ↓
14. Frontend: Refreshes program list
        ↓
15. SEs can now see "Site Visit Report"
```

**Extra Benefits:**
- Backend can send notification to all SEs
- Backend can log analytics event
- Backend can sync to reporting tables
- Backend can trigger webhooks
- All without frontend changes!

---

## Data Flow: SE Submits Response

### Current State (After COMPLETE-PROGRAMS-FIX.sql)

```
1. SE logs in, sees "Site Visit Report"
       ↓
2. SE clicks to view details
       ↓
3. Frontend: supabase.from('programs').select()
              .eq('id', programId)
       ↓
4. Shows program with 3 fields
       ↓
5. SE clicks "Submit Response"
       ↓
6. SE fills form:
   - Site Name: "Nairobi CBD"
   - Visit Date: "2026-01-05"
   - Photo: [uploads image]
       ↓
7. SE clicks "Submit"
       ↓
8. Frontend: supabase.from('submissions').insert({
     program_id: 'program-123',
     user_id: 'se-456',
     responses: {...},
     status: 'pending',
   })
       ↓
9. Database: INSERT INTO submissions (...)
       ↓
10. Success! Submission saved ✅
        ↓
11. SE sees: "✅ Submission successful! +50 points pending"
```

### Proper Architecture (Track 2)

```
1. SE logs in, sees "Site Visit Report"
       ↓
2. SE clicks to view details
       ↓
3. Frontend: programsAPI.getProgram(programId)
       ↓
4. API Call: GET /make-server-28f2f653/programs/program-123
       ↓
5. Backend: Checks if SE can access this program
   - Is 'sales_executive' in target_roles? ✅
       ↓
6. Backend: Fetches from KV
   - program = kv.get('programs:program-123')
   - fields = kv.getByPrefix('program_fields:program-123')
       ↓
7. Backend: Returns program with fields
       ↓
8. Frontend: Shows program with 3 fields
       ↓
9. SE clicks "Submit Response"
       ↓
10. SE fills form:
    - Site Name: "Nairobi CBD"
    - Visit Date: "2026-01-05"
    - Photo: [uploads image]
        ↓
11. SE clicks "Submit"
        ↓
12. Frontend: programsAPI.submitResponse(programId, {...})
        ↓
13. API Call: POST /make-server-28f2f653/programs/program-123/submit
        ↓
14. Backend: Validates submission
    - All required fields filled? ✅
    - Valid data types? ✅
    - Photo size < 10MB? ✅
    - GPS location captured? ✅
        ↓
15. Backend: Checks duplicate
    - Has SE submitted today? ❌ (no duplicate)
        ↓
16. Backend: Stores in KV
    - submissionId = "submission-1736086500-x9y8z7"
    - kv.set('submissions:program-123:submission-...', {
        user_id: 'se-456',
        responses: {...},
        gps_location: {...},
        status: 'pending',
        points_awarded: 0,
        submitted_at: '2026-01-05T10:30:00Z'
      })
        ↓
17. Backend: Updates analytics
    - Increments submission count
    - Updates daily stats
        ↓
18. Backend: Sends notification to ZSM
    - "New submission from SE Njeri"
        ↓
19. Backend: Returns success
    - { success: true, submission: {...}, points_pending: 50 }
        ↓
20. Frontend: Shows success message
    - "✅ Submission successful! +50 points pending"
        ↓
21. Frontend: Updates local state
    - Marks program as "submitted today"
    - Disables submit button
```

**Extra Benefits:**
- Backend validates EXIF data
- Backend stores GPS with timestamp
- Backend prevents duplicate submissions
- Backend triggers real-time leaderboard update
- Backend logs for audit trail

---

## Hierarchical Visibility Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TAI HIERARCHY (662 USERS)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      Director (1)                               │
│                           │                                      │
│                           ├─ See ALL submissions                │
│                           ├─ Create programs                    │
│                           └─ View all analytics                 │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              ↓                         ↓                         │
│         HQ Command Center          HQ Staff                     │
│              │                         │                         │
│              ├─ See ALL submissions    │                         │
│              ├─ Manage programs        │                         │
│              └─ Analytics dashboard    │                         │
│              │                         │                         │
│       ┌──────┴──────┐                 │                         │
│       ↓             ↓                  │                         │
│   ZBM (Zone 1)  ZBM (Zone 2)  ...     │                         │
│       │             │                  │                         │
│       ├─ See Zone 1 submissions only   │                         │
│       ├─ Manage ZSMs in Zone 1         │                         │
│       │                                │                         │
│   ┌───┴───┐                            │                         │
│   ↓       ↓                            │                         │
│ ZSM (A) ZSM (B)  ...                   │                         │
│   │       │                            │                         │
│   ├─ See own zone SEs only             │                         │
│   ├─ Review submissions                │                         │
│   │                                    │                         │
│ ┌─┴─┐   ┌─┴─┐                          │                         │
│ ↓   ↓   ↓   ↓                          │                         │
│ SE  SE  SE  SE  ... (662 SEs total)    │                         │
│ │   │   │   │                          │                         │
│ └─ Submit responses                    │                         │
│    Earn points                         │                         │
│    See own submissions only            │                         │
│                                        │                         │
└─────────────────────────────────────────────────────────────────┘

Backend Logic (pseudocode):

function getSubmissionsForUser(programId, user) {
  const allSubmissions = kv.getByPrefix(`submissions:${programId}:`);
  
  if (user.role === 'director' || user.role === 'hq_command_center') {
    return allSubmissions; // See everything
  }
  
  if (user.role === 'zonal_business_manager') {
    // Filter by zone
    return allSubmissions.filter(s => 
      s.user.zone === user.zone
    );
  }
  
  if (user.role === 'zonal_sales_manager') {
    // Filter by specific team
    return allSubmissions.filter(s => 
      s.user.team_id === user.team_id
    );
  }
  
  if (user.role === 'sales_executive') {
    // See only own submissions
    return allSubmissions.filter(s => 
      s.user_id === user.id
    );
  }
}
```

---

## Storage Architecture (Photos)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHOTO UPLOAD FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Current State:
  SE takes photo
      ↓
  Frontend: supabase.storage.from('photos').upload(...)
      ↓
  ❌ "permission denied for bucket"
      ↓
  BLOCKED

After Fix:
  SE takes photo
      ↓
  Frontend: supabase.storage.from('make-28f2f653-program-photos').upload(...)
      ↓
  Bucket: Public bucket with anon access
      ↓
  ✅ Photo uploaded
      ↓
  Returns: { path: 'user-123/photo-456.jpg' }

Proper Architecture:
  SE takes photo
      ↓
  Frontend: programsAPI.uploadPhoto(file, userId, programId)
      ↓
  API Call: POST /make-server-28f2f653/programs/upload-photo
            (multipart/form-data)
      ↓
  Backend: Receives photo
      ↓
  Backend: Validates
      ├─ Size < 10MB? ✅
      ├─ Type = image/*? ✅
      ├─ Has EXIF data? ✅
      └─ GPS coordinates present? ✅
      ↓
  Backend: Processes
      ├─ Resize to 1920x1080
      ├─ Strip sensitive EXIF
      ├─ Keep GPS + timestamp
      └─ Compress to WebP
      ↓
  Backend: Stores in bucket (uses service_role)
      ├─ Path: users/{userId}/programs/{programId}/{timestamp}.webp
      └─ Metadata: { gps, timestamp, program_id }
      ↓
  Backend: Returns signed URL
      ↓
  Frontend: Uses URL in submission
      ↓
  When viewing: Backend generates new signed URL (60 min expiry)
```

---

## Summary: Why COMPLETE-PROGRAMS-FIX.sql Works

**The Loop:**
```
Frontend tries → Database blocks → Run ONE-CLICK-FIX.sql → Still blocked → Loop
```

**Why ONE-CLICK-FIX.sql didn't work:**
```
Fixed: kv_store_28f2f653
Needed: programs, program_fields, submissions
Result: Frontend still blocked
```

**Why COMPLETE-PROGRAMS-FIX.sql works:**
```
Creates: programs, program_fields, submissions tables
Fixes: ALL tables including kv_store_28f2f653
Grants: FULL permissions to anon/authenticated/service_role
Disables: RLS on all tables
Result: Frontend can access → Loop broken ✅
```

**Next Level (Track 2):**
```
Migrate: Frontend to use backend API
Benefit: More secure, flexible, maintainable
Backend: Uses KV store (already built!)
Frontend: Calls API routes (simple change)
Result: Production-ready for 662 users 🚀
```

---

*Architecture review complete. Execute COMPLETE-PROGRAMS-FIX.sql to break the loop.*
