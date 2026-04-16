# Airtel Money API Reference

## All API Functions

### Authentication

#### `amSignUp(fields)`
Register a new Airtel Money agent.

**Parameters:**
```typescript
{
  full_name: string;
  phone: string;                    // 10 digits, e.g. "0712345678"
  super_agent_number: string;       // e.g. "SA001234"
  agent_code: string;               // e.g. "AGT-001"
  se: string;                       // Sales Executive name
  zsm: string;                      // Zonal Sales Manager name
  zone: string;                     // e.g. "Nairobi"
  pin: string;                      // 4-6 digit password
}
```

**Returns:** `AMAgent` object

**Example:**
```typescript
const agent = await amSignUp({
  full_name: 'John Kamau',
  phone: '0712345678',
  super_agent_number: 'SA001234',
  agent_code: 'AGT-001',
  se: 'Mary Ochieng',
  zsm: 'Peter Kipchoge',
  zone: 'Nairobi',
  pin: '1234'
});
```

---

#### `amAgentLogin(phone, pin)`
Log in an Airtel Money agent.

**Parameters:**
- `phone: string` - 10 digits
- `pin: string` - 4-6 digit PIN

**Returns:** `AMAgent | null`

**Example:**
```typescript
const agent = await amAgentLogin('0712345678', '1234');
```

---

#### `amAdminLogin(phone, pin)`
Log in an Airtel Money HQ admin.

**Parameters:**
- `phone: string` - 10 digits
- `pin: string` - numeric PIN from AIRTELMONEY_HQ table

**Returns:** `{ id, full_name, phone, role } | null`

**Example:**
```typescript
const admin = await amAdminLogin('0712111111', '5678');
```

---

#### `fetchAppUsersByRole(role)`
Get dropdown options for SE/ZSM selection.

**Parameters:**
- `role: string` - 'sales_executive' or 'zonal_sales_manager'

**Returns:** `AppUserOption[]`

```typescript
interface AppUserOption {
  full_name: string;
  zone?: string;
  zsm?: string;
}
```

**Example:**
```typescript
const seList = await fetchAppUsersByRole('sales_executive');
// Returns: [
//   { full_name: 'Alice Smith', zone: 'Nairobi', zsm: 'Bob Jones' },
//   { full_name: 'Carol White', zone: 'Central', zsm: 'Dave Brown' }
// ]
```

---

### Videos

#### `getVideosForAgent(agentId)`
Get all published videos visible to an agent (respecting targeting rules).

**Parameters:**
- `agentId: string` - Agent's ID

**Returns:** `AMVideo[]`

**Example:**
```typescript
const videos = await getVideosForAgent('123');
```

---

#### `getAllVideos()`
Get all videos (admin only).

**Parameters:** None

**Returns:** `AMVideo[]`

---

#### `createVideo(fields)`
Create a new video record after upload.

**Parameters:**
```typescript
{
  title: string;
  description?: string;
  video_url: string;        // From uploadVideoFile()
  thumbnail_url?: string;   // Optional preview image
  duration_seconds?: number;
  category: string;         // e.g. "General", "Compliance"
  status: 'published' | 'draft';
  created_by: number;       // Admin's ID (bigint)
  is_targeted?: boolean;    // Default: false
}
```

**Returns:** `AMVideo`

---

#### `updateVideo(id, fields)`
Update a video record (title, description, status, etc).

**Parameters:**
- `id: string` - Video UUID
- `fields: Partial<AMVideo>` - Fields to update

**Returns:** `void`

**Example:**
```typescript
await updateVideo('uuid-123', { status: 'draft' });
```

---

#### `deleteVideo(id, videoUrl)`
Delete a video and its storage file.

**Parameters:**
- `id: string` - Video UUID
- `videoUrl: string` - Full URL from storage

**Returns:** `void`

---

#### `uploadVideoFile(file, onProgress?)`
Upload a video file to storage.

**Parameters:**
- `file: File` - Video file from input
- `onProgress?: (pct: number) => void` - Progress callback

**Returns:** `string` - Public URL of uploaded video

**Example:**
```typescript
const url = await uploadVideoFile(videoFile, (pct) => {
  console.log(`Uploaded ${pct}%`);
});
```

---

#### `setVideoTargets(videoId, targets)`
Set or replace video targeting rules.

**Parameters:**
- `videoId: string` - Video UUID
- `targets: Array<{ target_type: string; target_value: string }>`

**Target Types:**
- `'zone'` - e.g., "Nairobi"
- `'agent'` - Agent ID
- `'se'` - Sales Executive name
- `'zsm'` - Zonal Sales Manager name

**Example:**
```typescript
await setVideoTargets('uuid-123', [
  { target_type: 'zone', target_value: 'Nairobi' },
  { target_type: 'zone', target_value: 'Central' }
]);
```

---

### Video Watching / Sessions

#### `startWatchSession(agentId, videoId)`
Start tracking a watch session.

**Parameters:**
- `agentId: string` - Agent's ID
- `videoId: string` - Video UUID

**Returns:** `string` - Session ID

---

#### `appendPositionSample(sessionId, sample, maxPositionSecs, durationWatchedSecs)`
Record a position sample (called every 5 seconds).

**Parameters:**
- `sessionId: string`
- `sample: { t: number; p: number }` - {time_in_session, position_in_video}
- `maxPositionSecs: number`
- `durationWatchedSecs: number`

**Returns:** `void`

---

#### `endWatchSession(sessionId, maxPositionSecs, durationWatchedSecs, completed)`
Finalize a watch session.

**Parameters:**
- `sessionId: string`
- `maxPositionSecs: number` - Furthest point watched
- `durationWatchedSecs: number` - Total active watch time
- `completed: boolean` - If >= 90% watched

**Returns:** `void`

---

#### `getLatestSession(agentId, videoId)`
Get the previous session for a video (to resume from).

**Parameters:**
- `agentId: string`
- `videoId: string`

**Returns:** `AMVideoSession | null`

---

### Video Analytics

#### `getVideoAnalytics(videoId)`
Get comprehensive analytics for a video.

**Parameters:**
- `videoId: string` - Video UUID

**Returns:**
```typescript
{
  video_id: string;
  total_views: number;
  unique_agents: number;
  avg_completion_pct: number;
  completion_count: number;
  total_watch_secs: number;
  drop_off_points: Array<{
    position_secs: number;
    drop_count: number;
  }>;
  agent_progress: Array<{
    agent_id: number;
    agent_name: string;
    max_position_secs: number;
    completed: boolean;
    session_count: number;
    last_watched: string;
  }>;
}
```

---

#### `getAllAgentsWithProgress()`
Get all agents with their watch summary.

**Parameters:** None

**Returns:**
```typescript
Array<AMAgent & {
  videos_watched: number;
  videos_completed: number;
  total_watch_secs: number;
  last_active?: string;
}>
```

---

### Complaints

#### `submitComplaint(fields)`
Agent submits a support ticket.

**Parameters:**
```typescript
{
  agent_id: string;    // Agent's ID
  category: string;    // From CATEGORIES list
  description: string; // Ticket description
  photo_url?: string;  // From uploadComplaintPhoto()
}
```

**Returns:** `AMComplaint`

---

#### `getAgentComplaints(agentId)`
Get all complaints for an agent.

**Parameters:**
- `agentId: string`

**Returns:** `AMComplaint[]` (with responses & rating joined)

---

#### `getAllComplaints(statusFilter?)`
Get all complaints (admin only).

**Parameters:**
- `statusFilter?: string` - 'open', 'in_progress', 'resolved', or undefined for all

**Returns:** `AMComplaint[]` (with agent info, responses, rating)

---

#### `respondToComplaint(fields)`
Admin responds to a complaint and optionally changes status.

**Parameters:**
```typescript
{
  complaint_id: string;
  responder_id: number;           // Admin's ID
  message: string;
  new_status?: 'open' | 'in_progress' | 'resolved';
}
```

**Returns:** `void`

**Behavior:**
- Adds response to `am_complaint_responses`
- Updates `status` if provided
- Sets `picked_up_at` if status changes to 'in_progress'
- Sets `resolved_at` if status changes to 'resolved'

---

#### `rateComplaint(fields)`
Agent rates a resolved complaint.

**Parameters:**
```typescript
{
  complaint_id: string;
  agent_id: number;        // Agent's ID
  rating: number;          // 1-5
  comment?: string;
}
```

**Returns:** `void`

---

#### `uploadComplaintPhoto(file)`
Upload a complaint attachment photo.

**Parameters:**
- `file: File` - Image file from input

**Returns:** `string` - Public URL

---

## Type Definitions

### AMAgent
```typescript
{
  id: number;
  full_name: string;
  phone: string;
  super_agent_number: string;
  agent_code: string;
  se: string;
  zsm: string;
  zone: string;
  pin: string;
  role: 'airtel_money_agent';
  status: string;
  created_at: string;
  last_login_at?: string;
}
```

### AMVideo
```typescript
{
  id: string;               // UUID
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  category: string;
  is_targeted: boolean;
  status: 'published' | 'draft';
  created_by?: number;
  created_at: string;
  updated_at: string;
}
```

### AMVideoSession
```typescript
{
  id: string;
  agent_id: number;
  video_id: string;
  session_start: string;
  session_end?: string;
  duration_watched_secs: number;
  max_position_secs: number;
  completed: boolean;
  position_samples: Array<{ t: number; p: number }>;
  created_at: string;
}
```

### AMComplaint
```typescript
{
  id: string;
  agent_id: number;
  category: string;
  description: string;
  photo_url?: string;
  status: 'open' | 'in_progress' | 'resolved';
  picked_up_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  // Joined:
  agent?: Partial<AMAgent>;
  responses?: AMComplaintResponse[];
  rating?: AMComplaintRating;
}
```

### AMComplaintResponse
```typescript
{
  id: string;
  complaint_id: string;
  responder_id: number;      // AIRTELMONEY_HQ.id
  message: string;
  created_at: string;
  responder?: { full_name: string };
}
```

### AMComplaintRating
```typescript
{
  id: string;
  complaint_id: string;
  agent_id: number;
  rating: number;            // 1-5
  comment?: string;
  created_at: string;
}
```

---

## Error Handling

All functions throw errors with descriptive messages. Wrap in try-catch:

```typescript
try {
  const agent = await amSignUp({...});
} catch (err: any) {
  console.error(err.message);
  // "An account with this phone number already exists."
}
```

---

## Rate Limiting

No built-in rate limiting. For production:
- Add API middleware limiting to 100 req/min per IP
- Implement token bucket or sliding window algorithm
- Cache frequently accessed data (video lists, analytics)

---

## Pagination

Most list functions return all records. For large datasets:
- Implement `LIMIT/OFFSET` in API layer
- Cache results in Redis
- Consider denormalizing summary stats

---

## Example Integration

```typescript
import {
  amSignUp, amAgentLogin, getVideosForAgent,
  startWatchSession, endWatchSession,
  submitComplaint, getAgentComplaints,
  rateComplaint
} from './am-api';

// 1. Agent signs up
const agent = await amSignUp({
  full_name: 'John Kamau',
  phone: '0712345678',
  super_agent_number: 'SA001234',
  agent_code: 'AGT-001',
  se: 'Mary Ochieng',
  zsm: 'Peter Kipchoge',
  zone: 'Nairobi',
  pin: '1234'
});

// 2. Agent logs in
const loggedIn = await amAgentLogin('0712345678', '1234');

// 3. Agent sees videos
const videos = await getVideosForAgent(agent.id);

// 4. Agent watches a video
const sessionId = await startWatchSession(agent.id, videos[0].id);
// ... track position ...
await endWatchSession(sessionId, maxPos, watchedSecs, true);

// 5. Agent submits complaint
const complaint = await submitComplaint({
  agent_id: <br/>agent.id,
  category: 'Transaction Issue',
  description: 'Unable to process deposit',
  photo_url: 'https://...' // optional
});

// 6. Admin responds
import { respondToComplaint, amAdminLogin } from './am-api';
const admin = await amAdminLogin('0712111111', '5678');
await respondToComplaint({
  complaint_id: complaint.id,
  responder_id: admin.id,
  message: 'We have escalated this. Our team will contact you.',
  new_status: 'in_progress'
});

// 7. Agent rates response (after resolution)
await rateComplaint({
  complaint_id: complaint.id,
  agent_id: agent.id,
  rating: 4,
  comment: 'Issue was resolved quickly'
});
```
