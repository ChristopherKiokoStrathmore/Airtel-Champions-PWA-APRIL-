-- Airtel Money video integrity hardening
-- Enforces server-side completion integrity and impossible-jump rejection.

ALTER TABLE public.am_video_sessions
  ADD COLUMN IF NOT EXISTS integrity_suspicious boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrity_reason text;

CREATE INDEX IF NOT EXISTS am_video_sessions_integrity_idx
  ON public.am_video_sessions(integrity_suspicious);

CREATE OR REPLACE FUNCTION public.am_enforce_video_session_integrity()
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
  NEW.duration_watched_secs := GREATEST(COALESCE(NEW.duration_watched_secs, 0), 0);
  NEW.max_position_secs := GREATEST(COALESCE(NEW.max_position_secs, 0), 0);

  IF NEW.position_samples IS NULL OR jsonb_typeof(NEW.position_samples) <> 'array' THEN
    NEW.position_samples := '[]'::jsonb;
    suspicious_reasons := array_append(suspicious_reasons, 'invalid_position_samples');
  END IF;

  IF TG_OP = 'UPDATE' THEN
    duration_delta := GREATEST(COALESCE(NEW.duration_watched_secs, 0) - COALESCE(OLD.duration_watched_secs, 0), 0);
    max_pos_delta := COALESCE(NEW.max_position_secs, 0) - COALESCE(OLD.max_position_secs, 0);

    IF max_pos_delta > CEIL(duration_delta * playback_rate_cap) + 3 THEN
      RAISE EXCEPTION 'Rejected: impossible max_position_secs jump (%s) for duration delta (%s)', max_pos_delta, duration_delta;
    END IF;
  END IF;

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

  SELECT COALESCE(duration_seconds, 0)
  INTO v_duration_secs
  FROM public.am_videos
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

DROP TRIGGER IF EXISTS am_video_session_integrity_trigger ON public.am_video_sessions;
CREATE TRIGGER am_video_session_integrity_trigger
BEFORE INSERT OR UPDATE ON public.am_video_sessions
FOR EACH ROW
EXECUTE FUNCTION public.am_enforce_video_session_integrity();
