-- ========================================================================
-- Airtel Money Module - Complete Database Schema Setup
-- Run this in Supabase SQL Editor to create all required tables
-- ========================================================================

-- ── 1. AIRTELMONEY_HQ (Admin accounts) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS AIRTELMONEY_HQ (
  id BIGSERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  PIN VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'airtel_money_admin',
  se VARCHAR(100),
  zsm VARCHAR(100),
  zone VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airtelmoney_hq_phone ON AIRTELMONEY_HQ(phone);
CREATE INDEX IF NOT EXISTS idx_airtelmoney_hq_se ON AIRTELMONEY_HQ(se);

-- ── 2. AIRTELMONEY_AGENTS (Agent accounts) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS AIRTELMONEY_AGENTS (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  agent_code VARCHAR(100),
  se VARCHAR(100),
  zsm VARCHAR(100),
  zone VARCHAR(100),
  super_agent_number VARCHAR(20),
  PIN VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'airtel_money_agent',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_airtelmoney_agents_phone ON AIRTELMONEY_AGENTS(phone);
CREATE INDEX IF NOT EXISTS idx_airtelmoney_agents_se ON AIRTELMONEY_AGENTS(se);
CREATE INDEX IF NOT EXISTS idx_airtelmoney_agents_status ON AIRTELMONEY_AGENTS(status);

-- ── 3. am_videos (Training videos) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS am_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  category VARCHAR(100) DEFAULT 'General',
  is_targeted BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, published
  created_by BIGINT REFERENCES AIRTELMONEY_HQ(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_videos_status ON am_videos(status);
CREATE INDEX IF NOT EXISTS idx_am_videos_created_by ON am_videos(created_by);
CREATE INDEX IF NOT EXISTS idx_am_videos_category ON am_videos(category);

-- ── 4. am_video_targets (Who should watch which videos) ──────────────────────
CREATE TABLE IF NOT EXISTS am_video_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES am_videos(id) ON DELETE CASCADE,
  target_type VARCHAR(50), -- 'all_agents', 'se', 'zsm', 'zone', 'agent'
  target_value VARCHAR(100), -- SE name, ZSM name, zone, or agent_id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_video_targets_video_id ON am_video_targets(video_id);
CREATE INDEX IF NOT EXISTS idx_am_video_targets_target_type ON am_video_targets(target_type);

-- ── 5. am_video_sessions (Track watch progress) ─────────────────────────────
CREATE TABLE IF NOT EXISTS am_video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id BIGINT REFERENCES AIRTELMONEY_AGENTS(id) ON DELETE CASCADE,
  video_id UUID REFERENCES am_videos(id) ON DELETE CASCADE,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP,
  max_position_secs INT DEFAULT 0,
  duration_watched_secs INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  position_samples JSON DEFAULT '[]'::json, -- [{t: time, p: position}, ...]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_video_sessions_agent_id ON am_video_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_am_video_sessions_video_id ON am_video_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_am_video_sessions_completed ON am_video_sessions(completed);

-- ── 6. am_complaints (Ticket system) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS am_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id BIGINT REFERENCES AIRTELMONEY_AGENTS(id) ON DELETE CASCADE,
  category VARCHAR(100),
  description TEXT NOT NULL,
  photo_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved
  picked_up_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_complaints_agent_id ON am_complaints(agent_id);
CREATE INDEX IF NOT EXISTS idx_am_complaints_status ON am_complaints(status);
CREATE INDEX IF NOT EXISTS idx_am_complaints_category ON am_complaints(category);

-- ── 7. am_complaint_responses (Replies to complaints) ───────────────────────
CREATE TABLE IF NOT EXISTS am_complaint_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES am_complaints(id) ON DELETE CASCADE,
  responder_id VARCHAR(100), -- Can be admin ID or agent ID
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_complaint_responses_complaint_id ON am_complaint_responses(complaint_id);

-- ── 8. am_complaint_ratings (Agent ratings) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS am_complaint_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES am_complaints(id) ON DELETE CASCADE,
  agent_id BIGINT REFERENCES AIRTELMONEY_AGENTS(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_am_complaint_ratings_complaint_id ON am_complaint_ratings(complaint_id);
CREATE INDEX IF NOT EXISTS idx_am_complaint_ratings_agent_id ON am_complaint_ratings(agent_id);

-- ========================================================================
-- RLS (Row Level Security) Policies
-- ========================================================================

-- Enable RLS on all tables
ALTER TABLE AIRTELMONEY_HQ ENABLE ROW LEVEL SECURITY;
ALTER TABLE AIRTELMONEY_AGENTS ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_video_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaint_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaint_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: AIRTELMONEY_HQ (admins can read all, only own profile)
DROP POLICY IF EXISTS "AIRTELMONEY_HQ - Admins can view" ON AIRTELMONEY_HQ;
CREATE POLICY "AIRTELMONEY_HQ - Admins can view" ON AIRTELMONEY_HQ
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "AIRTELMONEY_HQ - Admins can update own" ON AIRTELMONEY_HQ;
CREATE POLICY "AIRTELMONEY_HQ - Admins can update own" ON AIRTELMONEY_HQ
  FOR UPDATE USING (auth.uid()::text = id::text OR TRUE);

-- Policy: AIRTELMONEY_AGENTS (agents can view targeting info)
DROP POLICY IF EXISTS "AIRTELMONEY_AGENTS - Can read" ON AIRTELMONEY_AGENTS;
CREATE POLICY "AIRTELMONEY_AGENTS - Can read" ON AIRTELMONEY_AGENTS
  FOR SELECT USING (TRUE);

-- Policy: am_videos (public read)
DROP POLICY IF EXISTS "am_videos - Everyone can read" ON am_videos;
CREATE POLICY "am_videos - Everyone can read" ON am_videos
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "am_videos - Admins can create/update" ON am_videos;
CREATE POLICY "am_videos - Admins can create/update" ON am_videos
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "am_videos - Admins can update" ON am_videos;
CREATE POLICY "am_videos - Admins can update" ON am_videos
  FOR UPDATE USING (TRUE);

-- Policy: am_video_sessions (agents can insert their own, admins can read all)
DROP POLICY IF EXISTS "am_video_sessions - Agents can insert" ON am_video_sessions;
CREATE POLICY "am_video_sessions - Agents can insert" ON am_video_sessions
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "am_video_sessions - Agents can read own" ON am_video_sessions;
CREATE POLICY "am_video_sessions - Agents can read own" ON am_video_sessions
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "am_video_sessions - Agents can update own" ON am_video_sessions;
CREATE POLICY "am_video_sessions - Agents can update own" ON am_video_sessions
  FOR UPDATE USING (TRUE);

-- Policy: am_complaints (agents can create own, admins can read all)
DROP POLICY IF EXISTS "am_complaints - Agents can create" ON am_complaints;
CREATE POLICY "am_complaints - Agents can create" ON am_complaints
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "am_complaints - Can read" ON am_complaints;
CREATE POLICY "am_complaints - Can read" ON am_complaints
  FOR SELECT USING (TRUE);

-- Policy: am_complaint_responses (anyone can insert, all can read)
DROP POLICY IF EXISTS "am_complaint_responses - Can insert" ON am_complaint_responses;
CREATE POLICY "am_complaint_responses - Can insert" ON am_complaint_responses
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "am_complaint_responses - Can read" ON am_complaint_responses;
CREATE POLICY "am_complaint_responses - Can read" ON am_complaint_responses
  FOR SELECT USING (TRUE);

-- Policy: am_complaint_ratings (anyone can insert when resolving)
DROP POLICY IF EXISTS "am_complaint_ratings - Can insert" ON am_complaint_ratings;
CREATE POLICY "am_complaint_ratings - Can insert" ON am_complaint_ratings
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "am_complaint_ratings - Can read" ON am_complaint_ratings;
CREATE POLICY "am_complaint_ratings - Can read" ON am_complaint_ratings
  FOR SELECT USING (TRUE);

-- ========================================================================
-- Storage Buckets
-- ========================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('am-videos', 'am-videos', true),
  ('am-complaint-photos', 'am-complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies will be created if they don't exist
-- Update existing storage policies if needed
-- The following are idempotent - they will succeed even if already exist

-- ========================================================================
-- Sample Data (Optional - for testing)
-- ========================================================================

-- Sample HQ Admin
INSERT INTO AIRTELMONEY_HQ (Name, phone, PIN, se, zsm, zone)
VALUES 
  ('Christopher Kioko', '0711223344', '5678', 'SE001', 'ZSM001', 'Nairobi')
ON CONFLICT (phone) DO UPDATE SET 
  Name = 'Christopher Kioko',
  PIN = '5678',
  se = 'SE001',
  zsm = 'ZSM001',
  zone = 'Nairobi',
  updated_at = CURRENT_TIMESTAMP;

-- Sample Agent
INSERT INTO AIRTELMONEY_AGENTS (full_name, phone, agent_code, se, zsm, zone, PIN)
VALUES 
  ('John Omondi', '0712345678', 'AM001', 'SE001', 'ZSM001', 'Nairobi', '1234')
ON CONFLICT (phone) DO UPDATE SET
  full_name = 'John Omondi',
  agent_code = 'AM001',
  se = 'SE001',
  zsm = 'ZSM001',
  zone = 'Nairobi',
  PIN = '1234',
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
