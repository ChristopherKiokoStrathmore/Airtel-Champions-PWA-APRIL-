-- ============================================
-- QUICK FIX: Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" to fix RLS policy errors
-- ============================================

-- Fix program_fields table
DROP POLICY IF EXISTS "Allow all operations on program_fields" ON program_fields;
CREATE POLICY "Allow all operations on program_fields"
  ON program_fields FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Fix programs table
DROP POLICY IF EXISTS "Allow all operations on programs" ON programs;
CREATE POLICY "Allow all operations on programs"
  ON programs FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Fix program_submissions table
DROP POLICY IF EXISTS "Allow all operations on program_submissions" ON program_submissions;
CREATE POLICY "Allow all operations on program_submissions"
  ON program_submissions FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Fix users table
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users"
  ON users FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Fix notifications table (if it exists)
DROP POLICY IF EXISTS "Allow all operations on notifications" ON notifications;
CREATE POLICY "Allow all operations on notifications"
  ON notifications FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================
-- DONE! Now refresh your app and try creating a program.
-- ============================================
