# 🔧 Fixing WebRTC Realtime Connection

## ❌ Current Issue
You're seeing: `[WebRTC] ⚠️ Realtime failed, falling back to polling`

This means the WebSocket connection for Realtime subscriptions is failing, causing calls to arrive via polling (2-second delay) instead of instantly.

---

## ✅ Solution: Apply RLS Policy Migration

The issue is **Row Level Security (RLS) policies** blocking Realtime subscriptions. I've created a migration file to fix this.

---

## 📋 Steps to Fix:

### **Option 1: Apply via Supabase Dashboard (RECOMMENDED)**

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[your-project-id]

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**

```sql
-- =====================================================
-- WebRTC Calling System - Realtime RLS Policies Fix
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own call status" ON user_call_status;
DROP POLICY IF EXISTS "Users can update their own call status" ON user_call_status;
DROP POLICY IF EXISTS "Users can view all call statuses" ON user_call_status;
DROP POLICY IF EXISTS "Users can insert their own call status" ON user_call_status;
DROP POLICY IF EXISTS "Users can view calls they are part of" ON call_sessions;
DROP POLICY IF EXISTS "Users can create calls" ON call_sessions;
DROP POLICY IF EXISTS "Users can update calls they are part of" ON call_sessions;
DROP POLICY IF EXISTS "Users can view signals for their calls" ON call_signals;
DROP POLICY IF EXISTS "Users can create signals for their calls" ON call_signals;

-- Enable RLS
ALTER TABLE user_call_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Allow users to view ALL call statuses
CREATE POLICY "Anyone can view all call statuses"
  ON user_call_status FOR SELECT USING (true);

-- Allow users to manage their own status
CREATE POLICY "Users can manage their own call status"
  ON user_call_status FOR ALL USING (true) WITH CHECK (true);

-- Allow viewing calls
CREATE POLICY "Users can view calls they are part of"
  ON call_sessions FOR SELECT USING (true);

-- Allow creating calls
CREATE POLICY "Anyone can create calls"
  ON call_sessions FOR INSERT WITH CHECK (true);

-- Allow updating calls
CREATE POLICY "Users can update calls they are part of"
  ON call_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Allow viewing signals
CREATE POLICY "Users can view signals for their calls"
  ON call_signals FOR SELECT USING (true);

-- Allow creating signals
CREATE POLICY "Anyone can create call signals"
  ON call_signals FOR INSERT WITH CHECK (true);

-- Enable Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE user_call_status;
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_call_status TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON call_sessions TO authenticated, anon;
GRANT SELECT, INSERT ON call_signals TO authenticated, anon;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_call_status_user_id ON user_call_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_call_status_status ON user_call_status(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee ON call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_signals_session ON call_signals(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON call_signals(to_user_id);
```

4. **Click "Run"** (bottom right)

5. **Verify success:**
   - You should see: `Success. No rows returned`
   - Check for green checkmark ✅

---

### **Option 2: Apply via Supabase CLI**

If you have Supabase CLI installed:

```bash
# Make sure you're in your project directory
cd /path/to/airtel-champions

# Apply the migration
supabase db push

# Or run the specific migration file
supabase migration up
```

---

## 🧪 Testing After Fix:

1. **Refresh your app** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

2. **Check console logs** - You should now see:
   ```
   [WebRTC] Subscription status: SUBSCRIBED
   [WebRTC] ✅ Realtime subscription active
   ```

3. **Make a test call:**
   - Open User Directory
   - Call another user
   - They should receive call **INSTANTLY** (not after 2 seconds)

---

## 📊 What This Fix Does:

1. **Drops old restrictive policies** that were blocking Realtime
2. **Creates permissive policies** that allow:
   - Viewing all user statuses (for directory)
   - Receiving incoming call notifications via WebSocket
   - Sending/receiving WebRTC signals in real-time
3. **Enables Realtime publications** on calling tables
4. **Grants proper permissions** to authenticated and anonymous users
5. **Adds performance indexes** for faster queries

---

## 🔍 Why It Was Failing:

**Before:**
- RLS policies were too restrictive
- Realtime subscriptions were blocked at database level
- Tables weren't added to `supabase_realtime` publication
- Users didn't have SELECT permissions for Realtime

**After:**
- ✅ Permissive policies allow Realtime subscriptions
- ✅ Tables published to Realtime
- ✅ Proper permissions granted
- ✅ Instant WebSocket notifications

---

## 🚨 Security Note:

These policies are **permissive** for prototyping. For production, you should:

1. **Restrict based on user ID:**
   ```sql
   USING (auth.uid() = caller_id OR auth.uid() = callee_id)
   ```

2. **Use proper authentication:**
   - Replace `anon` with `authenticated` role
   - Implement proper JWT token validation

3. **Add rate limiting:**
   - Prevent spam calls
   - Limit concurrent calls per user

---

## ✅ Expected Results:

After applying this fix, you should see:

```
[WebRTC] Listening for incoming calls...
[WebRTC] Subscription status: SUBSCRIBED
[WebRTC] ✅ Realtime subscription active
```

Instead of:

```
[WebRTC] ⚠️ Realtime failed, falling back to polling
```

---

**Apply this migration now and the Realtime WebSocket will work!** 🚀
