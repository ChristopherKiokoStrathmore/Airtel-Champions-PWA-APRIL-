-- ================================================================
-- 013_shujaa.sql
-- Shujaa system — creates `shujaas` and `shujaa_customers`, plus RPCs
-- ================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------
-- TABLE: shujaas
-- Stores Shujaa accounts (login via 4-digit PIN hashed with bcrypt)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shujaas (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  msisdn        TEXT        NOT NULL UNIQUE,
  zone          TEXT        NOT NULL DEFAULT '',
  se_cluster    TEXT        NOT NULL DEFAULT '',
  password_hash TEXT        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shujaas_msisdn ON shujaas(msisdn);

-- ----------------------------------------------------------------
-- TABLE: shujaa_customers
-- Customers added by a Shujaa after OTP verification
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shujaa_customers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  shujaa_id    UUID        NOT NULL REFERENCES shujaas(id) ON DELETE CASCADE,
  msisdn       TEXT        NOT NULL,
  customer_name TEXT       DEFAULT '',
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (msisdn)
);

CREATE INDEX IF NOT EXISTS idx_shujaa_customers_shujaa ON shujaa_customers(shujaa_id);
CREATE INDEX IF NOT EXISTS idx_shujaa_customers_msisdn ON shujaa_customers(msisdn);

-- ----------------------------------------------------------------
-- RPC: shujaa_signup
-- Create a Shujaa account (bcrypt password). Returns JSON row (no hash).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION shujaa_signup(
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
  v_msisdn TEXT := regexp_replace(trim(coalesce(p_msisdn, '')), '[^0-9]', '', 'g');
  v_hash TEXT;
  v_row  shujaas;
BEGIN
  IF EXISTS (SELECT 1 FROM shujaas WHERE regexp_replace(msisdn, '[^0-9]', '', 'g') = v_msisdn) THEN
    RAISE EXCEPTION 'MSISDN_EXISTS';
  END IF;

  v_hash := crypt(p_password, gen_salt('bf', 10));

  INSERT INTO shujaas (full_name, msisdn, zone, se_cluster, password_hash)
  VALUES (p_full_name, v_msisdn, p_zone, p_se_cluster, v_hash)
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'id',        v_row.id,
    'full_name', v_row.full_name,
    'msisdn',    v_row.msisdn,
    'zone',      v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active', v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;

-- ----------------------------------------------------------------
-- RPC: shujaa_login
-- Verify MSISDN + bcrypt password. Returns JSON row on success.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION shujaa_login(
  p_msisdn   TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_msisdn TEXT := regexp_replace(trim(coalesce(p_msisdn, '')), '[^0-9]', '', 'g');
  v_row shujaas;
BEGIN
  SELECT * INTO v_row
  FROM shujaas
  WHERE regexp_replace(msisdn, '[^0-9]', '', 'g') = v_msisdn
    AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF crypt(p_password, v_row.password_hash) <> v_row.password_hash THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'msisdn', v_row.msisdn,
    'zone', v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active', v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;

-- Note: OTP verification and customer insertion is handled by the app client
-- using the otp_codes table and direct inserts into shujaa_customers.  If
-- a server-side RPC is desired later (to enforce atomic verify+insert), add
-- a function shujaa_add_customer that takes p_shujaa_id, p_msisdn, p_code.
