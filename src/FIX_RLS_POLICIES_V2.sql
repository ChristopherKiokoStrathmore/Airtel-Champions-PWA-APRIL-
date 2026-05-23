-- =====================================================
-- FIX RLS POLICIES FOR ANON ACCESS (V2)
-- =====================================================
-- Run this SQL in Supabase SQL Editor
-- This allows the anon key to access the tables
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can update groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can delete groups" ON groups;

DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Admins can add members" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can view members" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can be added" ON group_members;
DROP POLICY IF EXISTS "Authenticated users can remove members" ON group_members;

DROP POLICY IF EXISTS "Users can view group messages" ON group_messages;
DROP POLICY IF EXISTS "Users can send messages" ON group_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON group_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated users can view messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated users can delete messages" ON group_messages;

-- =====================================================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- =====================================================
-- This allows full access without policies
-- You can re-enable and add proper policies later

ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- DONE! Groups should now work.
-- =====================================================
-- Note: This disables security checks for testing.
-- For production, you'll want to re-enable RLS and add
-- proper policies based on your auth setup.
-- =====================================================
