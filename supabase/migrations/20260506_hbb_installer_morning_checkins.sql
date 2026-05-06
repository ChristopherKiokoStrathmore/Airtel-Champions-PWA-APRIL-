-- Migration: installer morning check-in table and atomic RPC
-- One check-in per installer per calendar day enforced at DB level.

-- ─── TABLE ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hbb_installer_morning_checkins (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  installer_msisdn text        NOT NULL,
  installer_name   text,
  team_lead_msisdn text        REFERENCES public.hbb_installer_team_lead(team_lead_msisdn) ON DELETE SET NULL,
  check_in_date    date        NOT NULL DEFAULT current_date,
  checked_in_at    timestamptz NOT NULL DEFAULT now(),
  latitude         double precision NOT NULL,
  longitude        double precision NOT NULL,
  accuracy_meters  double precision,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_morning_checkins_pkey   PRIMARY KEY (id),
  CONSTRAINT hbb_installer_checkin_once_per_day    UNIQUE (installer_msisdn, check_in_date)
);

CREATE INDEX IF NOT EXISTS hbb_installer_checkin_msisdn_idx
  ON public.hbb_installer_morning_checkins (installer_msisdn);

CREATE INDEX IF NOT EXISTS hbb_installer_checkin_date_idx
  ON public.hbb_installer_morning_checkins (check_in_date DESC);

-- ─── RPC ─────────────────────────────────────────────────────────────────────
-- Raises CHECKIN_INPUT_INVALID for empty MSISDN or null coords.
-- Raises CHECKIN_ALREADY_SUBMITTED_TODAY when the installer already has a row
-- for today's date (the unique constraint slot was taken).
CREATE OR REPLACE FUNCTION public.hbb_installer_check_in(
  p_installer_msisdn   text,
  p_installer_name     text,
  p_team_lead_msisdn   text,
  p_latitude           double precision,
  p_longitude          double precision,
  p_accuracy_meters    double precision DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msisdn text;
  v_row    public.hbb_installer_morning_checkins;
BEGIN
  IF btrim(COALESCE(p_installer_msisdn, '')) = '' THEN
    RAISE EXCEPTION 'CHECKIN_INPUT_INVALID';
  END IF;
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RAISE EXCEPTION 'CHECKIN_INPUT_INVALID';
  END IF;

  v_msisdn := public.normalize_phone(p_installer_msisdn);

  INSERT INTO public.hbb_installer_morning_checkins (
    installer_msisdn, installer_name, team_lead_msisdn,
    latitude, longitude, accuracy_meters
  )
  VALUES (
    v_msisdn,
    btrim(COALESCE(p_installer_name, '')),
    NULLIF(btrim(COALESCE(p_team_lead_msisdn, '')), ''),
    p_latitude, p_longitude, p_accuracy_meters
  )
  ON CONFLICT (installer_msisdn, check_in_date) DO NOTHING
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHECKIN_ALREADY_SUBMITTED_TODAY';
  END IF;

  RETURN json_build_object(
    'id',            v_row.id,
    'check_in_date', v_row.check_in_date,
    'checked_in_at', v_row.checked_in_at,
    'latitude',      v_row.latitude,
    'longitude',     v_row.longitude
  );
END;
$$;
