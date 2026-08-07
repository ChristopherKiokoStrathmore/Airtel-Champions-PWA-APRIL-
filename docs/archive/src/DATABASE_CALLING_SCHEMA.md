# 📞 WebRTC Calling - Database Schema

## Tables to Create in Supabase

### 1. `user_call_status` - Real-time user availability

```sql
CREATE TABLE user_call_status (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'in_call')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_call_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_user_call_status_status ON user_call_status(status);
CREATE INDEX idx_user_call_status_last_seen ON user_call_status(last_seen);

-- Enable RLS
ALTER TABLE user_call_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all statuses
CREATE POLICY "Users can view all call statuses" ON user_call_status
  FOR SELECT USING (true);

-- Policy: Users can only update their own status
CREATE POLICY "Users can update own status" ON user_call_status
  FOR ALL USING (auth.uid() = user_id);
```

### 2. `call_sessions` - Call history and active calls

```sql
CREATE TABLE call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'rejected', 'failed')),
  call_type TEXT NOT NULL DEFAULT 'audio' CHECK (call_type IN ('audio', 'video')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  ended_reason TEXT, -- 'completed', 'missed', 'rejected', 'network_error', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_call_sessions_caller ON call_sessions(caller_id, created_at DESC);
CREATE INDEX idx_call_sessions_callee ON call_sessions(callee_id, created_at DESC);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_created ON call_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see calls they're part of
CREATE POLICY "Users can view own calls" ON call_sessions
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Policy: Users can create calls
CREATE POLICY "Users can create calls" ON call_sessions
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

-- Policy: Users can update calls they're part of
CREATE POLICY "Users can update own calls" ON call_sessions
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);
```

### 3. `call_signals` - WebRTC signaling messages

```sql
CREATE TABLE call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice_candidate', 'hang_up')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Index for quick lookups
CREATE INDEX idx_call_signals_session ON call_signals(call_session_id);
CREATE INDEX idx_call_signals_to_user ON call_signals(to_user_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see signals addressed to them
CREATE POLICY "Users can view own signals" ON call_signals
  FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Policy: Users can create signals
CREATE POLICY "Users can create signals" ON call_signals
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Policy: Users can mark signals as read
CREATE POLICY "Users can update own signals" ON call_signals
  FOR UPDATE USING (auth.uid() = to_user_id);
```

### 4. Enable Realtime for all tables

```sql
-- Enable realtime for user_call_status (presence)
ALTER PUBLICATION supabase_realtime ADD TABLE user_call_status;

-- Enable realtime for call_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;

-- Enable realtime for call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
```

---

## 📋 Setup Instructions for Supabase Dashboard

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste each CREATE TABLE statement** above
3. **Run them one by one**
4. **Verify tables** in Table Editor
5. **Enable Realtime** in Database → Replication settings

---

## 🔄 Auto-update timestamp function

```sql
-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_call_status
CREATE TRIGGER update_user_call_status_updated_at
  BEFORE UPDATE ON user_call_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 📊 Initial Data Setup

Users will automatically get entries in `user_call_status` when they first login. The app will:
1. Check if user exists in `user_call_status`
2. If not, insert with status='online'
3. If exists, update to status='online'
4. On logout/close, update to status='offline'

---

## 🎯 Next Steps

After creating these tables:
1. ✅ Test table creation in Supabase
2. ✅ Enable Realtime subscriptions
3. ✅ Build WebRTC service layer
4. ✅ Create UI components
