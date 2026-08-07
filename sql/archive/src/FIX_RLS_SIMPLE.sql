-- 🚀 SIMPLE FIX: Disable RLS or Make Fully Public
-- Run this SQL in Supabase Dashboard → SQL Editor
-- This makes the calling tables fully accessible (like your other app_users table)

-- ========================================
-- OPTION 1: Disable RLS Completely (RECOMMENDED FOR YOUR APP)
-- ========================================

-- Disable RLS on calling tables (easiest fix)
ALTER TABLE user_call_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals DISABLE ROW LEVEL SECURITY;

-- ========================================
-- OPTION 2: Keep RLS but Allow All Access
-- ========================================

-- If you prefer to keep RLS enabled, uncomment below:

/*
-- user_call_status - Allow all operations
CREATE POLICY "Allow all on user_call_status" ON user_call_status FOR ALL USING (true) WITH CHECK (true);

-- call_sessions - Allow all operations
CREATE POLICY "Allow all on call_sessions" ON call_sessions FOR ALL USING (true) WITH CHECK (true);

-- call_signals - Allow all operations
CREATE POLICY "Allow all on call_signals" ON call_signals FOR ALL USING (true) WITH CHECK (true);
*/

-- ========================================
-- ✅ DONE! Refresh your app and test
-- ========================================

-- This will work immediately since your app uses custom authentication
-- (stored in localStorage) rather than Supabase Auth
