# 🎯 PANEL REVIEW: CRITICAL ACTION ITEMS

**Priority**: MUST complete before Flutter mobile app development  
**Estimated Time**: 8-12 hours  
**Assigned To**: Backend Team

---

## 🔴 CRITICAL (Must Do - 6 hours)

### **1. Create Photo Upload API** (2 hours)
**Why**: Mobile app cannot submit photos without this

**Tasks**:
- [ ] Create Supabase Storage bucket `submissions-photos`
- [ ] Configure bucket RLS policies
- [ ] Create endpoint: `POST /v1/photos/upload`
- [ ] Add image validation (max 5MB, JPEG/PNG only)
- [ ] Generate signed URLs for uploaded photos
- [ ] Add thumbnail generation (400px)

**Code**:
```typescript
// /supabase/functions/server/photos.tsx
app.post("/make-server-28f2f653/v1/photos/upload", async (c) => {
  const { user } = await authenticateUser(c.req.header('Authorization'));
  
  const formData = await c.req.formData();
  const file = formData.get('photo');
  
  // Validate file
  if (!file || file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File must be < 5MB' }, 400);
  }
  
  // Upload to Supabase Storage
  const fileName = `${user.id}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('submissions-photos')
    .upload(fileName, file);
  
  if (error) {
    return c.json({ error: 'Upload failed' }, 500);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('submissions-photos')
    .getPublicUrl(fileName);
  
  return c.json({
    success: true,
    data: {
      url: publicUrl,
      fileName
    }
  });
});
```

---

### **2. Create Mobile Authentication API** (2 hours)
**Why**: Flutter app cannot login users without this

**Tasks**:
- [ ] Create endpoint: `POST /v1/auth/request-otp`
- [ ] Create endpoint: `POST /v1/auth/verify-otp`
- [ ] Create endpoint: `POST /v1/auth/login-pin`
- [ ] Create endpoint: `POST /v1/auth/refresh-token`
- [ ] Create endpoint: `POST /v1/auth/logout`
- [ ] Add rate limiting (5 requests per hour per phone)
- [ ] Integrate with Africa's Talking SMS API

**Code**:
```typescript
// POST /v1/auth/request-otp
app.post("/make-server-28f2f653/v1/auth/request-otp", async (c) => {
  const { phone } = await c.req.json();
  
  // Validate phone
  if (!phone.match(/^\+254[17]\d{8}$/)) {
    return c.json({ error: 'Invalid phone number' }, 400);
  }
  
  // Rate limit: 5 OTPs per hour
  const rateLimitKey = `otp:${phone}`;
  const allowed = await checkRateLimit(rateLimitKey, 5, 3600);
  if (!allowed) {
    return c.json({ error: 'Too many OTP requests. Try again later.' }, 429);
  }
  
  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Save to database
  await supabase.from('otp_codes').insert({
    phone,
    code,
    expires_at: expiresAt.toISOString()
  });
  
  // Send SMS via Africa's Talking
  await sendSMS(phone, `Your Airtel Sales Intel OTP: ${code}. Valid for 10 minutes.`);
  
  return c.json({
    success: true,
    message: 'OTP sent successfully',
    expiresAt: expiresAt.toISOString()
  });
});

// POST /v1/auth/verify-otp
app.post("/make-server-28f2f653/v1/auth/verify-otp", async (c) => {
  const { phone, code } = await c.req.json();
  
  // Verify OTP
  const { data: otp } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .single();
  
  if (!otp) {
    return c.json({ error: 'Invalid or expired OTP' }, 401);
  }
  
  // Mark OTP as used
  await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('id', otp.id);
  
  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // Create session
  const { data: session, error } = await supabase.auth.signInWithPassword({
    phone: phone,
    password: 'otp-verified' // Temporary - use proper auth
  });
  
  return c.json({
    success: true,
    data: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: user.id,
        name: user.full_name,
        phone: user.phone,
        role: user.role
      }
    }
  });
});
```

---

### **3. Create Submissions API for Mobile** (2 hours)
**Why**: Mobile app needs to create and fetch submissions

**Tasks**:
- [ ] Create endpoint: `POST /v1/submissions`
- [ ] Create endpoint: `GET /v1/submissions/my`
- [ ] Create endpoint: `GET /v1/users/me`
- [ ] Add pagination support
- [ ] Add field filtering (mobile sees less data)

**Code**:
```typescript
// POST /v1/submissions
app.post("/make-server-28f2f653/v1/submissions", async (c) => {
  const { user } = await authenticateUser(c.req.header('Authorization'));
  
  const body = await c.req.json();
  const {
    missionTypeId,
    photoUrl,
    location,
    locationName,
    notes
  } = body;
  
  // Validate input
  if (!missionTypeId || !location) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  // Validate location is in Kenya
  if (!isLocationInKenya(location.latitude, location.longitude)) {
    return c.json({ error: 'Location must be in Kenya' }, 400);
  }
  
  // Create submission
  const { data: submission, error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      mission_type_id: missionTypeId,
      photo_url: photoUrl,
      location: `POINT(${location.longitude} ${location.latitude})`,
      location_name: locationName,
      notes,
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    return c.json({ error: 'Failed to create submission' }, 500);
  }
  
  return c.json({
    success: true,
    data: submission,
    message: 'Submission created successfully'
  });
});

// GET /v1/submissions/my
app.get("/make-server-28f2f653/v1/submissions/my", async (c) => {
  const { user } = await authenticateUser(c.req.header('Authorization'));
  
  // Pagination
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const status = c.req.query('status'); // optional filter
  
  // Build query
  let query = supabase
    .from('submissions')
    .select('id, mission_type_id, status, photo_url, location_name, notes, points_awarded, created_at, reviewed_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error, count } = await query;
  
  if (error) {
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
  
  return c.json({
    success: true,
    data,
    meta: {
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    }
  });
});
```

---

## ⚠️ HIGH PRIORITY (Should Do - 4 hours)

### **4. Add API Versioning** (1 hour)
**Why**: Future-proof API for mobile app updates

**Tasks**:
- [ ] Rename all endpoints to include `/v1/`
- [ ] Update frontend to use versioned endpoints
- [ ] Document version in API.md

**Changes**:
```typescript
// OLD:
/make-server-28f2f653/submissions/approve

// NEW:
/make-server-28f2f653/v1/submissions/approve
```

---

### **5. Add Offline Support Tables** (1 hour)
**Why**: Mobile app is offline-first

**Tasks**:
- [ ] Create `submission_queue` table
- [ ] Create `sync_log` table
- [ ] Add `client_id` to submissions
- [ ] Create sync status endpoint

**Schema**:
```sql
CREATE TABLE submission_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  client_id VARCHAR(50) UNIQUE NOT NULL,
  submission_data JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at_device TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  action VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add to submissions:
ALTER TABLE submissions ADD COLUMN client_id VARCHAR(50) UNIQUE;
ALTER TABLE submissions ADD COLUMN created_at_device TIMESTAMPTZ;
```

---

### **6. Add Pagination to All Endpoints** (1 hour)
**Why**: Mobile app on slow network needs pagination

**Tasks**:
- [ ] Add pagination to leaderboard
- [ ] Add pagination to achievements
- [ ] Add pagination to announcements
- [ ] Standardize response format

**Example**:
```typescript
// Pagination helper
function parsePagination(c: Context) {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100); // Max 100
  const offset = parseInt(c.req.query('offset') || '0');
  return { limit, offset };
}

// Use in endpoints:
app.get("/make-server-28f2f653/v1/leaderboard", async (c) => {
  const { limit, offset } = parsePagination(c);
  
  // ... query with .range(offset, offset + limit - 1)
  
  return c.json({
    success: true,
    data,
    meta: {
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count
      }
    }
  });
});
```

---

### **7. Create Mobile-Specific Views** (1 hour)
**Why**: Hide sensitive admin data from mobile

**Tasks**:
- [ ] Create `submissions_mobile` view
- [ ] Create `users_mobile` view
- [ ] Create `leaderboard_mobile` view
- [ ] Update RLS policies

**Views**:
```sql
-- Mobile view: hide sensitive fields
CREATE VIEW submissions_mobile AS
SELECT 
  s.id,
  s.user_id,
  s.mission_type_id,
  mt.name as mission_type_name,
  mt.base_points,
  s.status,
  s.photo_url,
  s.location_name,
  s.notes,
  CASE 
    WHEN s.status = 'approved' THEN s.points_awarded
    ELSE NULL
  END as points_awarded,
  s.created_at,
  s.reviewed_at,
  -- HIDE: reviewed_by, review_notes, internal metadata
  s.client_id
FROM submissions s
JOIN mission_types mt ON mt.id = s.mission_type_id;

-- Enable RLS on view
ALTER VIEW submissions_mobile SET (security_invoker = true);

-- Policy: Users can see own submissions
CREATE POLICY "Users view own submissions"
  ON submissions_mobile FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

## 💡 RECOMMENDED (Nice to Have - 2 hours)

### **8. Add Request Logging Middleware** (1 hour)
**Why**: Debug mobile app issues

**Code**:
```typescript
// Add to edge function
import { v4 as uuidv4 } from 'uuid';

app.use('*', async (c, next) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  c.set('requestId', requestId);
  c.set('startTime', startTime);
  
  console.log(`[${requestId}] --> ${c.req.method} ${c.req.path}`);
  
  await next();
  
  const duration = Date.now() - startTime;
  const status = c.res.status;
  
  console.log(`[${requestId}] <-- ${status} (${duration}ms)`);
  
  // Optional: Log to database for analytics
  if (duration > 1000 || status >= 400) {
    // Log slow or error requests
    await supabase.from('api_logs').insert({
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
      user_id: c.get('userId')
    });
  }
});
```

---

### **9. Add Database Indexes for Mobile** (1 hour)
**Why**: Fast queries on mobile

**SQL**:
```sql
-- Composite indexes for mobile queries
CREATE INDEX idx_submissions_user_status_created 
ON submissions(user_id, status, created_at DESC);

CREATE INDEX idx_user_achievements_user_unlocked 
ON user_achievements(user_id, unlocked_at DESC);

-- Partial indexes for common filters
CREATE INDEX idx_submissions_my_pending 
ON submissions(user_id, created_at DESC) 
WHERE status = 'pending';

CREATE INDEX idx_challenges_active 
ON daily_challenges(start_date, end_date) 
WHERE is_active = true AND end_date > NOW();

-- Covering indexes
CREATE INDEX idx_leaderboard_covering 
ON submissions(user_id, points_awarded) 
INCLUDE (status, created_at) 
WHERE status = 'approved';
```

---

## 📊 COMPLETION CHECKLIST

### **Critical** (Must complete):
- [ ] Photo upload API (/v1/photos/upload)
- [ ] Auth API (5 endpoints)
- [ ] Submissions API for mobile (POST, GET)
- [ ] Users/me endpoint
- [ ] Pagination on leaderboard
- [ ] API versioning (/v1/)

### **High Priority** (Should complete):
- [ ] Offline support tables
- [ ] Mobile-specific views
- [ ] Field-level permissions
- [ ] Response format standardization

### **Recommended** (Nice to have):
- [ ] Request logging
- [ ] Performance indexes
- [ ] Error tracking
- [ ] Analytics logging

---

## 🎯 ESTIMATED TIMELINE

| Phase | Time | Tasks |
|-------|------|-------|
| **Critical Items** | 6 hours | Photo upload, Auth API, Submissions API |
| **High Priority** | 4 hours | Versioning, offline support, pagination |
| **Recommended** | 2 hours | Logging, indexes |
| **Testing** | 2 hours | Test all new endpoints |
| **TOTAL** | **14 hours** | **~2 days work** |

---

## 🚦 GO/NO-GO DECISION

### ✅ **READY for Mobile Development** IF:
- [ ] All Critical items complete
- [ ] At least 3 High Priority items complete
- [ ] All endpoints tested
- [ ] Documentation updated

### ❌ **NOT READY** IF:
- Any Critical items incomplete
- No photo upload endpoint
- No auth endpoints
- No submissions creation endpoint

---

## 📞 SIGN-OFF

| Role | Name | Decision | Date |
|------|------|----------|------|
| Data Architect | Dr. Sarah Chen | ⏳ Pending | - |
| Backend Specialist | James Omondi | ⏳ Pending | - |
| Mobile Expert | Maria Rodriguez | ⏳ Pending | - |
| Security Architect | David Kim | ⏳ Pending | - |
| Performance Engineer | Amara Okafor | ⏳ Pending | - |
| Quality Engineer | Robert Jensen | ⏳ Pending | - |

**Decision**: ⏳ PENDING - Complete action items first

---

**Last Updated**: December 28, 2024  
**Review Version**: 1.0  
**Next Review**: After action items completed
