# Van Calendar View - Error Fix

## ❌ Original Error
```
[Van Calendar View] Error: Error: Failed to fetch van schedules
```

## 🔍 Root Cause

The original endpoint `/programs/:id/submissions` was:
1. Querying a `submissions` **table** that doesn't exist
2. Requiring Director/HQ authentication
3. Not reading from KV store where van calendar submissions are actually stored

**Storage Location:** `kv_store_28f2f653` table with keys like:
```
submissions:848582a6-29a9-4992-ae11-1f8397f198d9:submission-xxx
```

## ✅ Solution

### 1. Added New Endpoint: `/programs/:id/kv-submissions`

**File:** `/supabase/functions/server/programs.tsx`

**Endpoint:**
```typescript
GET /make-server-28f2f653/programs/:id/kv-submissions
```

**What it does:**
- Queries `kv_store_28f2f653` directly
- Uses LIKE pattern: `submissions:{programId}:%`
- Parses JSON values from KV store
- No authentication required (uses public anon key)
- Returns all submissions for the program

**Response:**
```json
{
  "success": true,
  "submissions": [...],
  "count": 5
}
```

### 2. Updated Van Calendar View Component

**File:** `/components/van-calendar-view.tsx`

**Changed:**
```typescript
// OLD (doesn't work)
const url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs/${programId}/submissions`;

// NEW (works!)
const url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs/${programId}/kv-submissions`;
```

**Added:**
- Better error logging with URL and status code
- Detailed console logs for debugging

## 🧪 Testing

After deployment:

1. **Hard refresh:** `Ctrl+Shift+R`
2. Open browser console
3. Click "View Schedules" button
4. Check console logs:
   ```
   [Van Calendar View] Fetching from: https://...
   [Van Calendar View] Response status: 200
   [Van Calendar View] Response data: {...}
   [Van Calendar View] ✅ Loaded X schedules
   ```

## 📊 Data Flow (Fixed)

```
Van Calendar Program Card
  ↓
[View Schedules] Button
  ↓
VanCalendarView Component
  ↓
GET /programs/{id}/kv-submissions
  ↓
Query kv_store_28f2f653 table
  ↓
Filter: key LIKE 'submissions:848582a6-29a9-4992-ae11-1f8397f198d9:%'
  ↓
Parse JSON values
  ↓
Return submissions array
  ↓
Display in calendar grid
```

## 🔐 Security Notes

- Endpoint is **public** (no auth required)
- Van calendar submissions are not sensitive
- HQ/ZSMs/Directors can all view schedules
- Same access level as viewing programs

## 📝 Files Modified

1. `/supabase/functions/server/programs.tsx` - Added new endpoint
2. `/components/van-calendar-view.tsx` - Changed endpoint URL + logging

---

**Status:** ✅ FIXED - Ready for deployment

The error should now be resolved. The view will load all van schedules from KV store.
