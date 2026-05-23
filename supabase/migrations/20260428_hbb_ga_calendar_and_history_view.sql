-- Migration: Calendar table and daily GA history view
-- Created: 2026-04-28

-- Calendar dimension used to render zero-count days in GA history
CREATE TABLE IF NOT EXISTS public.hbb_ga_calendar (
  ga_date date PRIMARY KEY
);

-- Seed a broad calendar range so history renders even when no rows exist yet.
INSERT INTO public.hbb_ga_calendar (ga_date)
SELECT d::date
FROM generate_series('2024-01-01'::date, '2035-12-31'::date, interval '1 day') AS d
ON CONFLICT (ga_date) DO NOTHING;

-- Read-only daily history view for installer GA
-- One row per installer per date, including dates with zero GA.
CREATE OR REPLACE VIEW public.hbb_ga_daily_history_view AS
WITH installers AS (
  SELECT DISTINCT
    installer_msisdn,
    COALESCE(installer_name, '') AS installer_name,
    COALESCE(town, '') AS town
  FROM public.hbb_installer_ga_daily
),
calendar_dates AS (
  SELECT ga_date
  FROM public.hbb_ga_calendar
)
SELECT
  i.installer_msisdn,
  i.installer_name,
  i.town,
  c.ga_date,
  COALESCE(SUM(d.ga_count), 0) AS total_ga,
  MAX(d.report_batch_id) AS report_batch_id,
  to_char(c.ga_date, 'YYYY-MM') AS month_year
FROM installers i
CROSS JOIN calendar_dates c
LEFT JOIN public.hbb_installer_ga_daily d
  ON d.installer_msisdn = i.installer_msisdn
  AND d.ga_date = c.ga_date
GROUP BY
  i.installer_msisdn,
  i.installer_name,
  i.town,
  c.ga_date;

COMMENT ON VIEW public.hbb_ga_daily_history_view IS 'Calendar-backed installer GA history view with zero-count days.';
