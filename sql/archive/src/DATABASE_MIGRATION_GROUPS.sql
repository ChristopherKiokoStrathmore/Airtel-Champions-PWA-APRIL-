-- =====================================================
-- TAI GROUPS SYSTEM - DATABASE MIGRATION
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create groups tables
-- =====================================================

-- 1. Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '👥',
  type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'official')),
  created_by UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 3. Group messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  message TEXT,
  photos TEXT[], -- Array of photo URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups table
-- Users can view groups they are members of
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Admins can update their groups
CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete their groups
CREATE POLICY "Admins can delete groups" ON groups
  FOR DELETE
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for group_members table
-- Users can view members of groups they belong to
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Admins can add members to their groups
CREATE POLICY "Admins can add members" ON group_members
  FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can remove members from their groups
CREATE POLICY "Admins can remove members" ON group_members
  FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can remove themselves from groups
CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for group_messages table
-- Users can view messages in groups they belong to
CREATE POLICY "Users can view group messages" ON group_messages
  FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Users can send messages to groups they belong to
CREATE POLICY "Users can send messages" ON group_messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON group_messages
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON group_messages
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- IMPORTANT: After running this SQL, come back to chat
-- and confirm "Database tables created successfully"
-- =====================================================
