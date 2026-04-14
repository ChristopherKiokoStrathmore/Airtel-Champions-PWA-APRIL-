-- 20260414_promoter_tl_pin_4_digits.sql
-- Enforce 4-digit numeric PIN for Promoter Team Lead signup/login at DB level.
-- This is incremental and safe for existing deployments.

-- ----------------------------------------------------------------
-- RPC: tl_signup
-- Adds strict PIN format validation before hashing and insert.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION tl_signup(
  p_full_name  TEXT,
  p_msisdn     TEXT,
  p_zone       TEXT,
  p_se_cluster TEXT,
  p_password   TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
  v_row  promoter_team_leads;
BEGIN
  IF p_password IS NULL OR p_password !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'PIN_FORMAT_INVALID';
  END IF;

  IF EXISTS (SELECT 1 FROM promoter_team_leads WHERE msisdn = p_msisdn) THEN
    RAISE EXCEPTION 'MSISDN_EXISTS';
  END IF;

  v_hash := crypt(p_password, gen_salt('bf', 10));

  INSERT INTO promoter_team_leads (full_name, msisdn, zone, se_cluster, password_hash)
  VALUES (p_full_name, p_msisdn, p_zone, p_se_cluster, v_hash)
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'msisdn',     v_row.msisdn,
    'zone',       v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active',  v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;

-- ----------------------------------------------------------------
-- RPC: tl_login
-- Reject non-4-digit PIN values by returning NULL.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION tl_login(
  p_msisdn   TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row promoter_team_leads;
BEGIN
  IF p_password IS NULL OR p_password !~ '^[0-9]{4}$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_row
  FROM promoter_team_leads
  WHERE msisdn = p_msisdn
    AND is_active = TRUE;

  IF NOT FOUND OR crypt(p_password, v_row.password_hash) <> v_row.password_hash THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'msisdn',     v_row.msisdn,
    'zone',       v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active',  v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;
