-- ============================================================
-- Airtel Money Module — Database Schema
-- Run this in the Supabase SQL editor (project dashboard)
--
-- NOTE: AIRTELMONEY_HQ already exists in the DB with:
--   id bigint GENERATED ALWAYS AS IDENTITY
--   Name text, number numeric, PIN numeric
-- We only ADD columns to it — we do NOT recreate it.
-- ============================================================

-- ─── 1. Extend existing AIRTELMONEY_HQ ────────────────────────────────────────
--  Add role and last_login_at columns if they don't already exist.
ALTER TABLE "AIRTELMONEY_HQ"
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'airtel_money_admin';

ALTER TABLE "AIRTELMONEY_HQ"
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- ─── 2. AIRTELMONEY_AGENTS ────────────────────────────────────────────────────
--  Self-registered Airtel Money agents.
--  Uses bigint id (consistent with AIRTELMONEY_HQ and other legacy tables).
CREATE TABLE IF NOT EXISTS "AIRTELMONEY_AGENTS" (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name           text NOT NULL,
  phone               text NOT NULL,
  super_agent_number  text NOT NULL,
  agent_code          text NOT NULL,
  se                  text NOT NULL,
  zsm                 text NOT NULL,
  zone                text NOT NULL,
  pin                 text NOT NULL,
  role                text NOT NULL DEFAULT 'airtel_money_agent',
  status              text NOT NULL DEFAULT 'active',
  created_at          timestamptz NOT NULL DEFAULT now(),
  last_login_at       timestamptz
);

ALTER TABLE "AIRTELMONEY_AGENTS"
  ADD CONSTRAINT airtelmoney_agents_phone_unique UNIQUE (phone);

-- ─── 3. am_videos ─────────────────────────────────────────────────────────────
--  Video library managed by HQ admins.
--  created_by → bigint to match AIRTELMONEY_HQ.id type.
CREATE TABLE IF NOT EXISTS am_videos (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  description     text,
  video_url       text NOT NULL,
  thumbnail_url   text,
  duration_seconds integer,
  category        text NOT NULL DEFAULT 'General',
  is_targeted     boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'published',
  created_by      bigint REFERENCES "AIRTELMONEY_HQ"(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. am_video_targets ──────────────────────────────────────────────────────
--  Targeting rules when a video is not for all agents.
--  target_type: 'zone' | 'agent' | 'se' | 'zsm'
CREATE TABLE IF NOT EXISTS am_video_targets (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id     uuid NOT NULL REFERENCES am_videos(id) ON DELETE CASCADE,
  target_type  text NOT NULL,
  target_value text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. am_video_sessions ─────────────────────────────────────────────────────
--  One row per agent watch session.
--  agent_id → bigint to match AIRTELMONEY_AGENTS.id type.
CREATE TABLE IF NOT EXISTS am_video_sessions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id              bigint NOT NULL REFERENCES "AIRTELMONEY_AGENTS"(id) ON DELETE CASCADE,
  video_id              uuid NOT NULL REFERENCES am_videos(id) ON DELETE CASCADE,
  session_start         timestamptz NOT NULL DEFAULT now(),
  session_end           timestamptz,
  duration_watched_secs integer NOT NULL DEFAULT 0,
  max_position_secs     integer NOT NULL DEFAULT 0,
  completed             boolean NOT NULL DEFAULT false,
  position_samples      jsonb NOT NULL DEFAULT '[]',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS am_video_sessions_agent_idx ON am_video_sessions(agent_id);
CREATE INDEX IF NOT EXISTS am_video_sessions_video_idx ON am_video_sessions(video_id);

-- ─── 6. am_complaints ─────────────────────────────────────────────────────────
--  Tickets raised by agents.
--  agent_id → bigint to match AIRTELMONEY_AGENTS.id type.
CREATE TABLE IF NOT EXISTS am_complaints (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id      bigint NOT NULL REFERENCES "AIRTELMONEY_AGENTS"(id) ON DELETE CASCADE,
  category      text NOT NULL,
  description   text NOT NULL,
  photo_url     text,
  status        text NOT NULL DEFAULT 'open',
  picked_up_at  timestamptz,
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS am_complaints_agent_idx  ON am_complaints(agent_id);
CREATE INDEX IF NOT EXISTS am_complaints_status_idx ON am_complaints(status);

-- ─── 7. am_complaint_responses ────────────────────────────────────────────────
--  Admin responses to tickets.
--  responder_id → bigint to match AIRTELMONEY_HQ.id type.
CREATE TABLE IF NOT EXISTS am_complaint_responses (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id  uuid NOT NULL REFERENCES am_complaints(id) ON DELETE CASCADE,
  responder_id  bigint NOT NULL REFERENCES "AIRTELMONEY_HQ"(id),
  message       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 8. am_complaint_ratings ──────────────────────────────────────────────────
--  One rating per complaint, submitted by the agent after resolution.
--  agent_id → bigint to match AIRTELMONEY_AGENTS.id type.
CREATE TABLE IF NOT EXISTS am_complaint_ratings (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id  uuid NOT NULL REFERENCES am_complaints(id) ON DELETE CASCADE UNIQUE,
  agent_id      bigint NOT NULL REFERENCES "AIRTELMONEY_AGENTS"(id),
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Storage buckets ──────────────────────────────────────────────────────────
--  Create these in the Supabase dashboard: Storage → New Bucket
--  Bucket name: am-videos          (enable Public bucket)
--  Bucket name: am-complaint-photos (enable Public bucket)
--
--  Or uncomment and run these SQL statements:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('am-videos', 'am-videos', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('am-complaint-photos', 'am-complaint-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE "AIRTELMONEY_AGENTS"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_videos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_video_targets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_video_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaints            ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaint_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_complaint_ratings     ENABLE ROW LEVEL SECURITY;

-- Allow anon key full access (app uses custom phone/PIN auth, not Supabase Auth)
CREATE POLICY "anon_all" ON "AIRTELMONEY_AGENTS"   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_videos              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_video_targets       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_video_sessions      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_complaints          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_complaint_responses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON am_complaint_ratings   FOR ALL TO anon USING (true) WITH CHECK (true);
