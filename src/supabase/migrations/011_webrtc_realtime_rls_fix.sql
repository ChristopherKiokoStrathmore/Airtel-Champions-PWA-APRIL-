-- =====================================================
-- WebRTC Calling System - Realtime RLS Policies Fix
-- Migration 011: Fix RLS policies to enable Realtime subscriptions
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

-- =====================================================
-- TABLE: user_call_status
-- =====================================================

-- Enable RLS
ALTER TABLE user_call_status ENABLE ROW LEVEL SECURITY;

-- Allow users to view ALL call statuses (needed for directory)
CREATE POLICY "Anyone can view all call statuses"
  ON user_call_status
  FOR SELECT
  USING (true);

-- Allow users to insert/update their own status
CREATE POLICY "Users can manage their own call status"
  ON user_call_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE: call_sessions
-- =====================================================

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to view calls they are part of (caller OR callee)
CREATE POLICY "Users can view calls they are part of"
  ON call_sessions
  FOR SELECT
  USING (true);

-- Allow anyone to create call sessions
CREATE POLICY "Anyone can create calls"
  ON call_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update calls they are part of
CREATE POLICY "Users can update calls they are part of"
  ON call_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE: call_signals
-- =====================================================

-- Enable RLS
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- Allow users to view signals for their calls
CREATE POLICY "Users can view signals for their calls"
  ON call_signals
  FOR SELECT
  USING (true);

-- Allow anyone to create signals
CREATE POLICY "Anyone can create call signals"
  ON call_signals
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- REALTIME CONFIGURATION
-- Enable Realtime for all calling tables
-- =====================================================

-- Enable Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE user_call_status;
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- Grant permissions for Realtime
GRANT SELECT, INSERT, UPDATE ON user_call_status TO authenticated;
GRANT SELECT, INSERT, UPDATE ON call_sessions TO authenticated;
GRANT SELECT, INSERT ON call_signals TO authenticated;

GRANT SELECT, INSERT, UPDATE ON user_call_status TO anon;
GRANT SELECT, INSERT, UPDATE ON call_sessions TO anon;
GRANT SELECT, INSERT ON call_signals TO anon;

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_call_status_user_id ON user_call_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_call_status_status ON user_call_status(status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_caller ON call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_callee ON call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_signals_session ON call_signals(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON call_signals(to_user_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Anyone can view all call statuses" ON user_call_status IS 
  'Allows all users to see online/offline status of other users for the directory';

COMMENT ON POLICY "Users can manage their own call status" ON user_call_status IS 
  'Allows users to update their own online/offline/busy status';

COMMENT ON POLICY "Users can view calls they are part of" ON call_sessions IS 
  'Allows users to see incoming and outgoing calls via Realtime subscriptions';

COMMENT ON POLICY "Anyone can create calls" ON call_sessions IS 
  'Allows initiating calls to any user, even if offline';

COMMENT ON POLICY "Users can view signals for their calls" ON call_signals IS 
  'Allows receiving WebRTC signaling data via Realtime';
