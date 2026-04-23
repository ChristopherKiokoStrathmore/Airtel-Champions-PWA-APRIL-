-- ═══════════════════════════════════════════════════════════════════════════
-- HBB GA (Gross Add) Reporting System - Database Migration
-- Created: April 22, 2026
-- Phases: 1 (Data Infrastructure)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 1: HBB_INSTALLER_TEAM_LEAD
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.HBB_INSTALLER_TEAM_LEAD (
  team_lead_msisdn text NOT NULL PRIMARY KEY,
  team_lead_name text NOT NULL,
  town text,
  zone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT hbb_installer_tl_msisdn_unique UNIQUE(team_lead_msisdn)
);

CREATE INDEX IF NOT EXISTS hbb_installer_tl_created_idx ON public.HBB_INSTALLER_TEAM_LEAD(created_at);
CREATE INDEX IF NOT EXISTS hbb_installer_tl_active_idx ON public.HBB_INSTALLER_TEAM_LEAD(is_active);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 2: hbb_ga_upload_batches
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hbb_ga_upload_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('dse_ga', 'installer_ga')),
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'live', 'rolled_back')),
  table_source text NOT NULL DEFAULT 'HBB_DSE_APRIL',
  total_records integer DEFAULT 0,
  warnings_count integer DEFAULT 0,
  validation_errors jsonb DEFAULT '[]'::jsonb,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  went_live_at timestamp with time zone,
  rolled_back_at timestamp with time zone,
  rolled_back_reason text
);

CREATE INDEX IF NOT EXISTS hbb_ga_batches_status_idx ON public.hbb_ga_upload_batches(status);
CREATE INDEX IF NOT EXISTS hbb_ga_batches_type_idx ON public.hbb_ga_upload_batches(report_type);
CREATE INDEX IF NOT EXISTS hbb_ga_batches_uploaded_idx ON public.hbb_ga_upload_batches(uploaded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 3: hbb_ga_upload_warnings
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hbb_ga_upload_warnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES public.hbb_ga_upload_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  phone_number text,
  name text,
  issue_type text NOT NULL CHECK (issue_type IN ('phone_format_invalid', 'person_not_found', 'duplicate_same_day', 'name_mismatch')),
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('error', 'warning')),
  message text NOT NULL,
  suggested_action text,
  resolved boolean NOT NULL DEFAULT false,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hbb_ga_warnings_batch_idx ON public.hbb_ga_upload_warnings(batch_id);
CREATE INDEX IF NOT EXISTS hbb_ga_warnings_severity_idx ON public.hbb_ga_upload_warnings(severity);
CREATE INDEX IF NOT EXISTS hbb_ga_warnings_resolved_idx ON public.hbb_ga_upload_warnings(resolved);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 4: HBB_DSE_GA_MONTHLY
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.HBB_DSE_GA_MONTHLY (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dse_msisdn text NOT NULL,
  dse_name text NOT NULL,
  team_lead_msisdn text,
  town text,
  ga_count integer NOT NULL DEFAULT 0,
  current_band_min integer DEFAULT 0,
  current_band_max integer DEFAULT 0,
  incentive_earned integer DEFAULT 0,
  report_batch_id uuid REFERENCES public.hbb_ga_upload_batches(id) ON DELETE SET NULL,
  month_year text NOT NULL,
  upload_date timestamp with time zone,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_dse_ga_unique UNIQUE(dse_msisdn, month_year)
);

CREATE INDEX IF NOT EXISTS hbb_dse_ga_msisdn_idx ON public.HBB_DSE_GA_MONTHLY(dse_msisdn);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_team_lead_idx ON public.HBB_DSE_GA_MONTHLY(team_lead_msisdn);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_month_idx ON public.HBB_DSE_GA_MONTHLY(month_year);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_count_idx ON public.HBB_DSE_GA_MONTHLY(ga_count DESC);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_batch_idx ON public.HBB_DSE_GA_MONTHLY(report_batch_id);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 5: HBB_INSTALLER_GA_MONTHLY
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.HBB_INSTALLER_GA_MONTHLY (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installer_msisdn text NOT NULL,
  installer_name text NOT NULL,
  team_lead_msisdn text REFERENCES public.HBB_INSTALLER_TEAM_LEAD(team_lead_msisdn) ON DELETE SET NULL,
  town text,
  ga_count integer NOT NULL DEFAULT 0,
  current_band_min integer DEFAULT 0,
  current_band_max integer DEFAULT 0,
  incentive_earned integer DEFAULT 0,
  report_batch_id uuid REFERENCES public.hbb_ga_upload_batches(id) ON DELETE SET NULL,
  month_year text NOT NULL,
  upload_date timestamp with time zone,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_ga_unique UNIQUE(installer_msisdn, month_year)
);

CREATE INDEX IF NOT EXISTS hbb_installer_ga_msisdn_idx ON public.HBB_INSTALLER_GA_MONTHLY(installer_msisdn);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_team_lead_idx ON public.HBB_INSTALLER_GA_MONTHLY(team_lead_msisdn);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_month_idx ON public.HBB_INSTALLER_GA_MONTHLY(month_year);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_count_idx ON public.HBB_INSTALLER_GA_MONTHLY(ga_count DESC);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_batch_idx ON public.HBB_INSTALLER_GA_MONTHLY(report_batch_id);

-- ─────────────────────────────────────────────────────────────────────────
-- TABLE 6: HBB_INCENTIVE_BANDS
-- Configurable incentive structure for HQ to manage
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.HBB_INCENTIVE_BANDS (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_type text NOT NULL CHECK (role_type IN ('dse', 'dse_tl', 'installer', 'installer_tl')),
  band_name text NOT NULL,
  ga_range_min integer NOT NULL,
  ga_range_max integer NOT NULL,
  split_percentage numeric DEFAULT 0,
  mid_value numeric DEFAULT 0,
  variable_value integer DEFAULT 0,
  total_bonus integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hbb_incentive_role_idx ON public.HBB_INCENTIVE_BANDS(role_type);
CREATE INDEX IF NOT EXISTS hbb_incentive_active_idx ON public.HBB_INCENTIVE_BANDS(is_active);
CREATE INDEX IF NOT EXISTS hbb_incentive_range_idx ON public.HBB_INCENTIVE_BANDS(ga_range_min, ga_range_max);

-- ─────────────────────────────────────────────────────────────────────────
-- INSERT DEFAULT INCENTIVE BANDS
-- ─────────────────────────────────────────────────────────────────────────

-- DSE Bands
INSERT INTO public.HBB_INCENTIVE_BANDS (role_type, band_name, ga_range_min, ga_range_max, split_percentage, mid_value, variable_value, total_bonus)
VALUES
  ('dse', 'DSE Band 1', 1, 10, 10, 5, 200, 200),
  ('dse', 'DSE Band 2', 10, 20, 20, 15, 300, 450),
  ('dse', 'DSE Band 3', 20, 30, 30, 25, NULL, NULL),
  ('dse', 'DSE Band 4', 30, 100, 30, 50, 500, 10000)
ON CONFLICT DO NOTHING;

-- DSE Team Lead Bands
INSERT INTO public.HBB_INCENTIVE_BANDS (role_type, band_name, ga_range_min, ga_range_max, split_percentage, mid_value, variable_value, total_bonus)
VALUES
  ('dse_tl', 'DSE TL Band 1', 1, 250, 10, 180, 0, NULL),
  ('dse_tl', 'DSE TL Band 2', 250, 350, 40, 280, 100, NULL),
  ('dse_tl', 'DSE TL Band 3', 350, 450, 25, 400, 150, NULL),
  ('dse_tl', 'DSE TL Band 4', 450, 1000, 25, 500, 175, 10000)
ON CONFLICT DO NOTHING;

-- Installer Bands
INSERT INTO public.HBB_INCENTIVE_BANDS (role_type, band_name, ga_range_min, ga_range_max, total_bonus)
VALUES
  ('installer', 'Installer Band 1', 1, 20, 200),
  ('installer', 'Installer Band 2', 20, 40, 250),
  ('installer', 'Installer Band 3', 40, 60, 350),
  ('installer', 'Installer Band 4', 60, 150, 450)
ON CONFLICT DO NOTHING;

-- Installer Team Lead Bands
INSERT INTO public.HBB_INCENTIVE_BANDS (role_type, band_name, ga_range_min, ga_range_max, total_bonus)
VALUES
  ('installer_tl', 'Installer TL Band 1', 1, 200, 0),
  ('installer_tl', 'Installer TL Band 2', 200, 400, 30),
  ('installer_tl', 'Installer TL Band 3', 400, 600, 60),
  ('installer_tl', 'Installer TL Band 4', 600, 1500, 100)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- UTILITY FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────

-- Phone normalization function
CREATE OR REPLACE FUNCTION public.normalize_phone(phone_input text)
RETURNS text AS $$
DECLARE
  normalized text;
BEGIN
  -- Remove all non-numeric characters
  normalized := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- If starts with 254, replace with 0
  IF normalized LIKE '254%' THEN
    normalized := '0' || substring(normalized FROM 4);
  END IF;
  
  -- If starts with + and has 254, replace with 0
  IF phone_input LIKE '+254%' THEN
    normalized := '0' || substring(normalized FROM 3);
  END IF;
  
  -- Ensure it starts with 0 and is 10 digits
  IF normalized NOT LIKE '0%' THEN
    normalized := '0' || normalized;
  END IF;
  
  -- Keep only the last 10 digits
  normalized := RIGHT(normalized, 10);
  
  RETURN normalized;
END; $$
LANGUAGE plpgsql IMMUTABLE;

-- Get incentive band for a person's GA count
CREATE OR REPLACE FUNCTION public.get_incentive_band(
  p_ga_count integer,
  p_role_type text
)
RETURNS TABLE(
  band_name text,
  ga_range_min integer,
  ga_range_max integer,
  total_bonus integer,
  split_percentage numeric,
  mid_value numeric,
  variable_value integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hib.band_name,
    hib.ga_range_min,
    hib.ga_range_max,
    hib.total_bonus,
    hib.split_percentage,
    hib.mid_value,
    hib.variable_value
  FROM public.HBB_INCENTIVE_BANDS hib
  WHERE hib.role_type = p_role_type
    AND hib.is_active = true
    AND p_ga_count >= hib.ga_range_min
    AND p_ga_count < hib.ga_range_max
  LIMIT 1;
END; $$
LANGUAGE plpgsql;

-- Get cumulative GAs for a Team Lead from all their team members
CREATE OR REPLACE FUNCTION public.get_team_lead_cumulative_gas(
  p_team_lead_msisdn text,
  p_role_type text,
  p_month_year text
)
RETURNS TABLE(
  total_gas integer,
  team_member_count integer,
  current_band_name text,
  incentive_earned integer
) AS $$
DECLARE
  v_total_gas integer;
  v_member_count integer;
  v_band_name text;
  v_bonus integer;
BEGIN
  IF p_role_type = 'dse_tl' THEN
    SELECT COALESCE(SUM(ga_count), 0), COUNT(*)
    INTO v_total_gas, v_member_count
    FROM public.HBB_DSE_GA_MONTHLY
    WHERE team_lead_msisdn = p_team_lead_msisdn
      AND month_year = p_month_year;
  ELSIF p_role_type = 'installer_tl' THEN
    SELECT COALESCE(SUM(ga_count), 0), COUNT(*)
    INTO v_total_gas, v_member_count
    FROM public.HBB_INSTALLER_GA_MONTHLY
    WHERE team_lead_msisdn = p_team_lead_msisdn
      AND month_year = p_month_year;
  END IF;
  
  -- Get band and bonus
  SELECT band_name, total_bonus
  INTO v_band_name, v_bonus
  FROM public.get_incentive_band(v_total_gas, p_role_type);
  
  RETURN QUERY
  SELECT v_total_gas, v_member_count, v_band_name, COALESCE(v_bonus, 0);
END; $$
LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- END OF MIGRATION
-- ─────────────────────────────────────────────────────────────────────────
