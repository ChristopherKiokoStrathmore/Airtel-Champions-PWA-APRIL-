-- ================================================================
-- 012_promoter_team_lead.sql
-- Promoter Team Lead system — 4 new tables, 2 RPCs, locking trigger
-- RLS intentionally disabled on all tables (app uses anon key).
-- Run this entire file in Supabase SQL Editor at once.
-- ================================================================

-- Bcrypt password hashing requires pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------
-- TABLE 1: promoter_team_leads
-- One row per Team Lead account.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_team_leads (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  msisdn        TEXT        NOT NULL UNIQUE,   -- login identifier
  zone          TEXT        NOT NULL,
  se_cluster    TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,           -- bcrypt, never plaintext
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptl_msisdn ON promoter_team_leads(msisdn);

-- ----------------------------------------------------------------
-- TABLE 2: promoter_members
-- Promoters belonging to a Team Lead.
-- msisdn is UNIQUE globally — one promoter, one TL, enforced at DB level.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_members (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id   UUID        NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  promoter_name  TEXT        NOT NULL,
  msisdn         TEXT        NOT NULL UNIQUE,   -- global uniqueness across all TLs
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at     TIMESTAMPTZ                     -- NULL = still active
);

CREATE INDEX IF NOT EXISTS idx_pm_team_lead ON promoter_members(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_pm_msisdn    ON promoter_members(msisdn);

-- ----------------------------------------------------------------
-- TABLE 3: promoter_daily_reports
-- One report per Team Lead per calendar day.
-- is_locked = TRUE after submit — enforced by trigger below.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_daily_reports (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id  UUID        NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  report_date   DATE        NOT NULL,
  total_gas     INTEGER     NOT NULL DEFAULT 0,
  is_locked     BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at  TIMESTAMPTZ,
  UNIQUE (team_lead_id, report_date)   -- one report per TL per day
);

CREATE INDEX IF NOT EXISTS idx_pdr_team_lead   ON promoter_daily_reports(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_pdr_report_date ON promoter_daily_reports(report_date);

-- ----------------------------------------------------------------
-- TABLE 4: promoter_gas_entries
-- One row per promoter per daily report.
-- promoter_name is a snapshot — safe after promoter is dropped.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_gas_entries (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID        NOT NULL REFERENCES promoter_daily_reports(id) ON DELETE CASCADE,
  team_lead_id    UUID        NOT NULL REFERENCES promoter_team_leads(id),
  promoter_msisdn TEXT        NOT NULL,
  promoter_name   TEXT        NOT NULL,         -- snapshot at time of entry
  ga_count        INTEGER     NOT NULL DEFAULT 0 CHECK (ga_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, promoter_msisdn)            -- one entry per promoter per report
);

CREATE INDEX IF NOT EXISTS idx_pge_report_id ON promoter_gas_entries(report_id);

-- ----------------------------------------------------------------
-- TRIGGER: prevent writes to gas_entries once the report is locked
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_report_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_locked    BOOLEAN;
  v_report_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_report_id := OLD.report_id;
  ELSE
    v_report_id := NEW.report_id;
  END IF;

  SELECT is_locked INTO v_locked
  FROM promoter_daily_reports
  WHERE id = v_report_id;

  IF v_locked IS TRUE THEN
    RAISE EXCEPTION 'Cannot modify entries for a locked report';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_report_lock ON promoter_gas_entries;
CREATE TRIGGER trg_check_report_lock
  BEFORE INSERT OR UPDATE OR DELETE ON promoter_gas_entries
  FOR EACH ROW EXECUTE FUNCTION fn_check_report_lock();

-- ----------------------------------------------------------------
-- RPC 1: tl_signup
-- Creates a new Team Lead account. Returns the new row (no password_hash).
-- Raises MSISDN_EXISTS if the phone number is already registered.
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
-- RPC 2: tl_login
-- Verifies MSISDN + bcrypt password. Returns row on success, NULL on failure.
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
