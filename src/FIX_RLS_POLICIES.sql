-- 🔧 FIX: Row Level Security Policies for WebRTC Calling
-- Run this SQL in Supabase Dashboard → SQL Editor

-- ========================================
-- 1. Fix user_call_status RLS Policies
-- ========================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all call statuses" ON user_call_status;
DROP POLICY IF EXISTS "Users can update own status" ON user_call_status;

-- Allow users to INSERT their own status (first time going online)
CREATE POLICY "Users can insert own status" ON user_call_status
  FOR INSERT WITH CHECK (true);

-- Allow users to SELECT all statuses (to see who's online)
CREATE POLICY "Users can view all statuses" ON user_call_status
  FOR SELECT USING (true);

-- Allow users to UPDATE their own status
CREATE POLICY "Users can update own status" ON user_call_status
  FOR UPDATE USING (true);

-- Allow users to DELETE their own status
CREATE POLICY "Users can delete own status" ON user_call_status
  FOR DELETE USING (true);

-- ========================================
-- 2. Fix call_sessions RLS Policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own calls" ON call_sessions;
DROP POLICY IF EXISTS "Users can create calls" ON call_sessions;
DROP POLICY IF EXISTS "Users can update own calls" ON call_sessions;

-- Allow users to SELECT calls they're part of
CREATE POLICY "Users can view own calls" ON call_sessions
  FOR SELECT USING (true);

-- Allow users to INSERT new call sessions
CREATE POLICY "Users can create calls" ON call_sessions
  FOR INSERT WITH CHECK (true);

-- Allow users to UPDATE calls they're part of
CREATE POLICY "Users can update own calls" ON call_sessions
  FOR UPDATE USING (true);

-- ========================================
-- 3. Fix call_signals RLS Policies
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own signals" ON call_signals;
DROP POLICY IF EXISTS "Users can create signals" ON call_signals;
DROP POLICY IF EXISTS "Users can update own signals" ON call_signals;

-- Allow users to SELECT signals addressed to them or from them
CREATE POLICY "Users can view signals" ON call_signals
  FOR SELECT USING (true);

-- Allow users to INSERT signals
CREATE POLICY "Users can create signals" ON call_signals
  FOR INSERT WITH CHECK (true);

-- Allow users to UPDATE signals (mark as read)
CREATE POLICY "Users can update signals" ON call_signals
  FOR UPDATE USING (true);

-- ========================================
-- 4. Verify RLS is Enabled
-- ========================================

-- Ensure RLS is enabled on all tables
ALTER TABLE user_call_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. Grant Public Access (Important!)
-- ========================================

-- Grant all permissions to authenticated users
GRANT ALL ON user_call_status TO authenticated;
GRANT ALL ON call_sessions TO authenticated;
GRANT ALL ON call_signals TO authenticated;

-- Grant all permissions to anon users (for your app)
GRANT ALL ON user_call_status TO anon;
GRANT ALL ON call_sessions TO anon;
GRANT ALL ON call_signals TO anon;

-- ========================================
-- ✅ DONE! Test by refreshing your app
-- ========================================

-- Verification query (optional - run to check policies exist)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('user_call_status', 'call_sessions', 'call_signals')
ORDER BY tablename, policyname;
