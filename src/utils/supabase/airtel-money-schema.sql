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
  integrity_suspicious  boolean NOT NULL DEFAULT false,
  integrity_reason      text,
  position_samples      jsonb NOT NULL DEFAULT '[]',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS am_video_sessions_agent_idx ON am_video_sessions(agent_id);
CREATE INDEX IF NOT EXISTS am_video_sessions_video_idx ON am_video_sessions(video_id);
CREATE INDEX IF NOT EXISTS am_video_sessions_integrity_idx ON am_video_sessions(integrity_suspicious);

-- Enforce server-side integrity checks for training watch sessions.
CREATE OR REPLACE FUNCTION am_enforce_video_session_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_duration_secs integer;
  playback_rate_cap numeric := 2.0;
  min_watch_ratio numeric := 0.85;
  suspicious_reasons text[] := ARRAY[]::text[];
  required_watch_secs integer;
  required_position_secs integer;
  duration_delta integer;
  max_pos_delta integer;
  sample_len integer;
  prev_sample jsonb;
  last_sample jsonb;
  prev_p numeric;
  last_p numeric;
  prev_t numeric;
  last_t numeric;
  delta_p numeric;
  delta_t_secs numeric;
  max_allowed_jump numeric;
BEGIN
  -- Basic sanitization
  NEW.duration_watched_secs := GREATEST(COALESCE(NEW.duration_watched_secs, 0), 0);
  NEW.max_position_secs := GREATEST(COALESCE(NEW.max_position_secs, 0), 0);

  IF NEW.position_samples IS NULL OR jsonb_typeof(NEW.position_samples) <> 'array' THEN
    NEW.position_samples := '[]'::jsonb;
    suspicious_reasons := array_append(suspicious_reasons, 'invalid_position_samples');
  END IF;

  -- Reject impossible max-position jumps between updates.
  IF TG_OP = 'UPDATE' THEN
    duration_delta := GREATEST(COALESCE(NEW.duration_watched_secs, 0) - COALESCE(OLD.duration_watched_secs, 0), 0);
    max_pos_delta := COALESCE(NEW.max_position_secs, 0) - COALESCE(OLD.max_position_secs, 0);

    IF max_pos_delta > CEIL(duration_delta * playback_rate_cap) + 3 THEN
      RAISE EXCEPTION 'Rejected: impossible max_position_secs jump (%s) for duration delta (%s)', max_pos_delta, duration_delta;
    END IF;
  END IF;

  -- Reject impossible jumps between sequential position samples.
  sample_len := jsonb_array_length(NEW.position_samples);
  IF sample_len >= 2 THEN
    prev_sample := NEW.position_samples -> (sample_len - 2);
    last_sample := NEW.position_samples -> (sample_len - 1);

    prev_p := COALESCE((prev_sample ->> 'p')::numeric, 0);
    last_p := COALESCE((last_sample ->> 'p')::numeric, 0);
    prev_t := COALESCE((prev_sample ->> 't')::numeric, 0);
    last_t := COALESCE((last_sample ->> 't')::numeric, 0);

    delta_p := GREATEST(last_p - prev_p, 0);

    IF last_t > prev_t THEN
      -- Client sends epoch milliseconds; support sec-style payloads as fallback.
      IF (last_t - prev_t) > 100 THEN
        delta_t_secs := (last_t - prev_t) / 1000.0;
      ELSE
        delta_t_secs := (last_t - prev_t);
      END IF;
    ELSE
      delta_t_secs := 0;
    END IF;

    max_allowed_jump := (delta_t_secs * playback_rate_cap) + 2;
    IF delta_p > max_allowed_jump THEN
      RAISE EXCEPTION 'Rejected: impossible sequential sample jump (%s) over %.2f sec', delta_p, delta_t_secs;
    END IF;
  END IF;

  -- Check completion eligibility using server-side thresholds.
  SELECT COALESCE(duration_seconds, 0)
  INTO v_duration_secs
  FROM am_videos
  WHERE id = NEW.video_id;

  IF v_duration_secs > 0 THEN
    required_watch_secs := CEIL((min_watch_ratio * v_duration_secs) / playback_rate_cap);
    required_position_secs := CEIL(min_watch_ratio * v_duration_secs);

    IF NEW.completed THEN
      IF NEW.duration_watched_secs < required_watch_secs THEN
        suspicious_reasons := array_append(suspicious_reasons, 'watch_time_below_threshold');
      END IF;

      IF NEW.max_position_secs < required_position_secs THEN
        suspicious_reasons := array_append(suspicious_reasons, 'max_position_below_threshold');
      END IF;
    END IF;
  END IF;

  IF array_length(suspicious_reasons, 1) > 0 THEN
    NEW.integrity_suspicious := true;
    NEW.integrity_reason := array_to_string(suspicious_reasons, ',');
    NEW.completed := false;
  ELSE
    NEW.integrity_suspicious := false;
    NEW.integrity_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS am_video_session_integrity_trigger ON am_video_sessions;
CREATE TRIGGER am_video_session_integrity_trigger
BEFORE INSERT OR UPDATE ON am_video_sessions
FOR EACH ROW
EXECUTE FUNCTION am_enforce_video_session_integrity();

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
