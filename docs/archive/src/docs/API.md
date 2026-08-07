# 📡 API DOCUMENTATION
**Sales Intelligence Network - Airtel Kenya**  
**API Version**: 1.0.0  
**Base URL**: `https://your-project.supabase.co/functions/v1/make-server-28f2f653`

---

## 📋 TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Submissions](#submissions-api)
   - [Achievements](#achievements-api)
   - [Analytics](#analytics-api)
   - [Leaderboard](#leaderboard-api)
   - [Challenges](#challenges-api)
   - [Admin Utilities](#admin-utilities)
   - [Webhooks](#webhooks)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Examples](#examples)

---

## 🔐 AUTHENTICATION

All protected endpoints require a Bearer token in the Authorization header.

### **Getting a Token**:

**Method 1: PIN Login**
```http
POST /auth/login-pin
Content-Type: application/json

{
  "phone": "+254712345678",
  "pin": "1234"
}
```

**Method 2: OTP Login**
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+254712345678",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "+254712345678",
    "name": "John Kamau",
    "role": "admin"
  }
}
```

### **Using the Token**:

```http
GET /endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Token Expiry**:
- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Refresh using Supabase client's `refreshSession()`

---

## ⏱️ RATE LIMITING

All endpoints have rate limits to prevent abuse.

### **Limits**:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Submission Actions | 100 requests | 1 minute |
| Read Operations | 200 requests | 1 minute |
| Authentication | 10 requests | 5 minutes |
| Webhooks | 1000 requests | 1 hour |

### **Rate Limit Headers**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### **Rate Limit Exceeded Response**:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## ❌ ERROR HANDLING

### **Error Response Format**:

```json
{
  "error": "Error message",
  "details": "Additional context (optional)",
  "code": "ERROR_CODE"
}
```

### **HTTP Status Codes**:

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### **Common Error Codes**:

```typescript
{
  "INVALID_TOKEN": "Authentication token is invalid or expired",
  "INSUFFICIENT_PERMISSIONS": "User lacks required permissions",
  "VALIDATION_ERROR": "Input validation failed",
  "RESOURCE_NOT_FOUND": "Requested resource not found",
  "DUPLICATE_ENTRY": "Resource already exists",
  "RATE_LIMIT_EXCEEDED": "Too many requests"
}
```

---

## 📡 ENDPOINTS

### **Health Check**

Check API status.

```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-28T10:00:00Z",
  "service": "Sales Intelligence Network API"
}
```

---

## 📤 SUBMISSIONS API

### **Approve Submission**

Approve a pending submission and award points.

```http
POST /submissions/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "submissionId": "uuid",
  "pointsAwarded": 100,
  "reviewNotes": "Great photo quality"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| submissionId | string (UUID) | ✅ Yes | Submission ID |
| pointsAwarded | number | ✅ Yes | Points (0-1000) |
| reviewNotes | string | ⚠️ Optional | Review comments (max 500 chars) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "points_awarded": 100,
    "reviewed_by": "admin-uuid",
    "reviewed_at": "2024-12-28T10:00:00Z"
  },
  "message": "Submission approved successfully"
}
```

**Errors**:
- 400: Invalid submissionId or pointsAwarded
- 401: Missing authentication
- 403: Not admin
- 404: Submission not found
- 429: Rate limit exceeded

---

### **Reject Submission**

Reject a submission with reason.

```http
POST /submissions/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "submissionId": "uuid",
  "reviewNotes": "Photo does not show required elements"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| submissionId | string (UUID) | ✅ Yes | Submission ID |
| reviewNotes | string | ✅ Yes | Rejection reason (min 10 chars) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "rejected",
    "points_awarded": 0,
    "review_notes": "Photo does not show required elements",
    "reviewed_by": "admin-uuid",
    "reviewed_at": "2024-12-28T10:00:00Z"
  },
  "message": "Submission rejected"
}
```

---

### **Bulk Approve Submissions**

Approve multiple submissions at once (max 50).

```http
POST /submissions/bulk-approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "submissionIds": ["uuid1", "uuid2", "uuid3"],
  "pointsAwarded": 100,
  "reviewNotes": "Batch approval"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| submissionIds | string[] | ✅ Yes | Array of UUIDs (max 50) |
| pointsAwarded | number | ✅ Yes | Points for all (0-1000) |
| reviewNotes | string | ⚠️ Optional | Review comments |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    { "id": "uuid1", "status": "approved", ... },
    { "id": "uuid2", "status": "approved", ... },
    { "id": "uuid3", "status": "approved", ... }
  ],
  "count": 3,
  "message": "3 submissions approved"
}
```

---

## 🏆 ACHIEVEMENTS API

### **Award Achievement**

Manually award achievement to user.

```http
POST /achievements/award
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "achievementId": "uuid",
  "reason": "Exceptional performance"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string (UUID) | ✅ Yes | User ID |
| achievementId | string (UUID) | ✅ Yes | Achievement ID |
| reason | string | ⚠️ Optional | Award reason (max 200 chars) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "achievement_id": "uuid",
    "unlocked_at": "2024-12-28T10:00:00Z"
  },
  "message": "Achievement awarded successfully"
}
```

**Errors**:
- 400: Achievement already awarded to user
- 404: User or achievement not found

---

## 📊 ANALYTICS API

### **Generate Analytics Report**

Get comprehensive analytics report.

```http
GET /analytics/generate
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-12-28T10:00:00Z",
    "generatedBy": "admin-uuid",
    "summary": {
      "totalSubmissions": 1247,
      "approvedSubmissions": 1156,
      "pendingSubmissions": 45,
      "rejectedSubmissions": 46,
      "approvalRate": 93,
      "totalUsers": 662,
      "activeSEs": 423,
      "participationRate": 64,
      "totalPoints": 124500,
      "avgPointsPerSubmission": 108,
      "totalAchievements": 3421
    },
    "topPerformers": [
      {
        "id": "uuid",
        "name": "Sarah Mwangi",
        "points": 8540,
        "submissions": 52,
        "rank": 1
      },
      // ... top 10
    ]
  }
}
```

**Query Parameters**: None

**Performance**: ~500ms (queries entire database)

---

## 📈 LEADERBOARD API

### **Get Leaderboard**

Get real-time leaderboard with filtering.

```http
GET /leaderboard?timeframe=weekly&region=Nairobi
Authorization: Bearer {token}
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| timeframe | enum | ⚠️ Optional | `daily`, `weekly`, `monthly`, `alltime` (default: `weekly`) |
| region | string | ⚠️ Optional | Region name or `all` (default: `all`) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sarah Mwangi",
      "region": "Nairobi",
      "employeeId": "SE-2024-0892",
      "points": 8540,
      "submissions": 52,
      "rank": 1
    },
    {
      "id": "uuid",
      "name": "John Kamau",
      "region": "Nairobi",
      "employeeId": "SE-2024-1156",
      "points": 7230,
      "submissions": 48,
      "rank": 2
    }
    // ... more entries
  ],
  "cached": false
}
```

**Performance**: 
- Cold (no cache): ~400ms
- Warm (cached): ~5ms
- Cache TTL: 5 minutes

---

## 🎯 CHALLENGES API

### **Check Challenge Completion**

Check if user completed a challenge.

```http
POST /challenges/check
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid",
  "challengeId": "uuid"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string (UUID) | ✅ Yes | User ID |
| challengeId | string (UUID) | ✅ Yes | Challenge ID |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "challengeId": "uuid",
    "userId": "uuid",
    "progress": 8,
    "target": 10,
    "completed": false,
    "rewardPoints": 0
  }
}
```

**Response (Completed)**:
```json
{
  "success": true,
  "data": {
    "challengeId": "uuid",
    "userId": "uuid",
    "progress": 12,
    "target": 10,
    "completed": true,
    "rewardPoints": 500
  }
}
```

---

## 🔧 ADMIN UTILITIES

### **Recalculate User Points**

Recalculate total points for a user (audit/fix tool).

```http
POST /admin/recalculate-points
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid"
}
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string (UUID) | ✅ Yes | User ID |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "totalPoints": 8540,
    "totalSubmissions": 52
  }
}
```

**Permission**: Admin only

---

### **Refresh Materialized Views**

Trigger refresh of analytics views.

```http
POST /admin/refresh-views
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "View refresh initiated",
  "views": [
    "mv_leaderboard",
    "mv_daily_analytics",
    "mv_weekly_analytics",
    "mv_regional_performance"
  ]
}
```

**Note**: This endpoint initiates refresh but doesn't wait for completion. Views are refreshed asynchronously.

**Permission**: Admin only

---

## 🔗 WEBHOOKS

### **Incoming Webhooks**

Handle webhooks from external services.

```http
POST /webhooks
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...

{
  "event": "sms",
  "data": {
    "message_id": "123",
    "phone_number": "+254712345678",
    "status": "delivered",
    "timestamp": "2024-12-28T10:00:00Z"
  }
}
```

**Supported Events**:
| Event | Description |
|-------|-------------|
| `sms` | SMS delivery status |
| `photo_upload` | Photo upload completion |
| `payment` | Payment confirmation |
| `push_notification` | Push notification delivery |
| `external_api` | External API events |
| `database_trigger` | Database changes |

**SMS Event**:
```json
{
  "event": "sms",
  "data": {
    "message_id": "123",
    "phone_number": "+254712345678",
    "status": "delivered|failed|sent",
    "timestamp": "2024-12-28T10:00:00Z"
  }
}
```

**Photo Upload Event**:
```json
{
  "event": "photo_upload",
  "data": {
    "file_id": "abc123",
    "user_id": "uuid",
    "file_url": "https://...",
    "file_size": 1024000,
    "mime_type": "image/jpeg",
    "upload_status": "success|failed",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "exif": { ... }
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Security**:
- Webhooks require HMAC signature in `X-Webhook-Signature` header
- Signature format: `sha256={hex-encoded-hmac}`
- Secret key: Set in `WEBHOOK_SECRET` environment variable

---

## ⚡ REAL-TIME SUBSCRIPTIONS

Real-time updates using Supabase Realtime (WebSocket).

### **Connection**:

```typescript
import { supabase } from './lib/supabase';

const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'submissions'
  }, payload => {
    console.log('New submission:', payload.new);
  })
  .subscribe();
```

### **Available Subscriptions**:

#### **New Submissions**:
```typescript
supabase
  .channel('submissions-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'submissions'
  }, payload => {
    // Handle new submission
  })
  .subscribe();
```

#### **Submission Updates**:
```typescript
supabase
  .channel('submission-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'submissions'
  }, payload => {
    // Handle status change
    console.log('Old:', payload.old);
    console.log('New:', payload.new);
  })
  .subscribe();
```

#### **Pending Submissions Only**:
```typescript
supabase
  .channel('pending-submissions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'submissions',
    filter: 'status=eq.pending'
  }, payload => {
    // Only pending submissions
  })
  .subscribe();
```

#### **Announcements**:
```typescript
supabase
  .channel('announcements')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'announcements'
  }, payload => {
    // Show notification
  })
  .subscribe();
```

#### **User-Specific Achievements**:
```typescript
supabase
  .channel(`achievements-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'user_achievements',
    filter: `user_id=eq.${userId}`
  }, payload => {
    // Celebration animation!
  })
  .subscribe();
```

### **Unsubscribe**:

```typescript
await supabase.removeChannel(channel);
```

---

## 💡 EXAMPLES

### **Example 1: Approve Submission**

```typescript
const token = 'your-jwt-token';
const submissionId = 'abc-123-def-456';

const response = await fetch(
  'https://your-project.supabase.co/functions/v1/make-server-28f2f653/submissions/approve',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      submissionId,
      pointsAwarded: 100,
      reviewNotes: 'Excellent submission!',
    }),
  }
);

const result = await response.json();
console.log(result);
// { success: true, data: { ... }, message: "Submission approved successfully" }
```

### **Example 2: Get Leaderboard**

```typescript
const token = 'your-jwt-token';

const response = await fetch(
  'https://your-project.supabase.co/functions/v1/make-server-28f2f653/leaderboard?timeframe=weekly&region=Nairobi',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const result = await response.json();
console.log(result.data);
// [{ rank: 1, name: "Sarah", points: 8540, ... }, ...]
```

### **Example 3: Real-time Subscription**

```typescript
import { subscribeToSubmissions } from './lib/realtime';

function DashboardComponent() {
  useEffect(() => {
    const channel = subscribeToSubmissions((submission) => {
      // Update UI
      setSubmissions(prev => [submission, ...prev]);
      
      // Show notification
      toast(`New submission from ${submission.user_name}`);
    });

    return () => {
      unsubscribe(channel);
    };
  }, []);

  return <div>Dashboard</div>;
}
```

### **Example 4: Error Handling**

```typescript
try {
  const response = await fetch(endpoint, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  
  // Show user-friendly message
  if (error.message.includes('Rate limit')) {
    toast.error('Too many requests. Please wait a moment.');
  } else if (error.message.includes('Unauthorized')) {
    // Redirect to login
    window.location.href = '/login';
  } else {
    toast.error('Something went wrong. Please try again.');
  }
}
```

---

## 📚 RELATED DOCUMENTATION

- [Setup Guide](./SETUP_GUIDE.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

## 📞 SUPPORT

**Questions?**
- Email: api-support@airtel.co.ke
- Slack: #api-support
- GitHub Issues: (your repo)

**Report Issues**:
- Security issues: security@airtel.co.ke
- Bug reports: GitHub Issues
- Feature requests: GitHub Discussions

---

**Last Updated**: December 28, 2024  
**API Version**: 1.0.0  
**Author**: Airtel Kenya Development Team
