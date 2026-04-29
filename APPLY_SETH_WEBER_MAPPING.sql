-- Apply full installer-to-supervisor mapping using names as the source of truth.
-- This backfills all installers that can be resolved from INHOUSE -> installer_supervisor.
-- Uses two-pass matching: (1) exact name match, (2) fuzzy match at 80% similarity threshold.

-- Enable pg_trgm extension for similarity matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Backfill installer-to-supervisor mappings using 50% fuzzy name matching.
-- This script maps installers from hbb_installer_ga_monthly to supervisors via INHOUSE_INSTALLER_6TOWNS_MARCH.
-- Two-pass approach: (1) Exact name match, (2) Fuzzy match at 50%+ similarity.

-- First, define all available INHOUSE supervisors.
WITH supervisor_lookup AS (
  SELECT
    LOWER(TRIM(i."Supervisor")) AS supervisor_key,
    TRIM(i."Supervisor") AS supervisor_name,
    TRIM(s."Phone") AS team_lead_msisdn
  FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
  JOIN public.installer_supervisor s
    ON LOWER(TRIM(s."Installers supervisor")) = LOWER(TRIM(i."Supervisor"))
  WHERE COALESCE(TRIM(i."Installer name"), '') <> ''
    AND COALESCE(TRIM(i."Supervisor"), '') <> ''
    AND COALESCE(NULLIF(TRIM(s."Phone"), ''), '') <> ''
  GROUP BY LOWER(TRIM(i."Supervisor")), TRIM(i."Supervisor"), TRIM(s."Phone")
),

-- Pass 1: Exact name matches (INHOUSE installers that match GA installers exactly).
exact_matches AS (
  SELECT DISTINCT
    LOWER(TRIM(i."Installer name")) AS installer_name_key,
    TRIM(i."Installer name") AS installer_name,
    i."Supervisor" AS team_lead_name,
    sl.team_lead_msisdn,
    'exact' AS match_type
  FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
  JOIN supervisor_lookup sl
    ON LOWER(TRIM(sl.supervisor_name)) = LOWER(TRIM(i."Supervisor"))
  WHERE COALESCE(TRIM(i."Installer name"), '') <> ''
    AND COALESCE(TRIM(i."Supervisor"), '') <> ''
    AND COALESCE(NULLIF(TRIM(sl.team_lead_msisdn), ''), '') <> ''
),

-- Pass 2: Fuzzy name matches (50%+ similarity for GA installers not in exact_matches).
-- This handles typos and name variations like "Benard Kiplangat" vs "Benard Kiplagat" (73.68% match).
fuzzy_candidates AS (
  SELECT
    m.installer_name AS ga_installer_name,
    i."Installer name" AS inhouse_installer_name,
    i."Supervisor" AS team_lead_name,
    sl.team_lead_msisdn,
    similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) AS match_score,
    ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(m.installer_name)) ORDER BY similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) DESC, m.ga_count DESC) AS rank_by_score
  FROM public.hbb_installer_ga_monthly m
  LEFT JOIN exact_matches em
    ON LOWER(TRIM(em.installer_name_key)) = LOWER(TRIM(m.installer_name))
  JOIN public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
    ON similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.50
  JOIN supervisor_lookup sl
    ON LOWER(TRIM(sl.supervisor_name)) = LOWER(TRIM(i."Supervisor"))
  WHERE em.installer_name_key IS NULL  -- Not already matched exactly
    AND COALESCE(NULLIF(TRIM(m.team_lead_msisdn), ''), '') = ''  -- Not yet assigned a supervisor
    AND COALESCE(NULLIF(TRIM(sl.team_lead_msisdn), ''), '') <> ''
),

fuzzy_matches AS (
  SELECT
    LOWER(TRIM(ga_installer_name)) AS installer_name_key,
    ga_installer_name AS installer_name,
    team_lead_name,
    team_lead_msisdn,
    'fuzzy' AS match_type,
    match_score
  FROM fuzzy_candidates
  WHERE rank_by_score = 1  -- Pick best match (highest similarity or highest GA count as tiebreaker)
),

-- Combine exact and fuzzy matches.
mapped_installers AS (
  SELECT
    installer_name_key,
    installer_name,
    team_lead_name,
    team_lead_msisdn,
    match_type
  FROM exact_matches
  UNION ALL
  SELECT
    installer_name_key,
    installer_name,
    team_lead_name,
    team_lead_msisdn,
    match_type
  FROM fuzzy_matches
),
mapped_supervisors AS (
  SELECT DISTINCT
    team_lead_msisdn,
    team_lead_name,
    COUNT(*) OVER (PARTITION BY team_lead_msisdn) AS installer_count
  FROM mapped_installers
  WHERE COALESCE(TRIM(team_lead_msisdn), '') <> ''
    AND COALESCE(TRIM(team_lead_name), '') <> ''
),
unique_supervisors AS (
  SELECT
    team_lead_msisdn,
    MIN(team_lead_name) AS team_lead_name
  FROM mapped_supervisors
  GROUP BY team_lead_msisdn
),
upsert_team_leads AS (
  INSERT INTO public.hbb_installer_team_lead (team_lead_msisdn, team_lead_name, is_active)
  SELECT DISTINCT
    us.team_lead_msisdn,
    us.team_lead_name,
    true
  FROM unique_supervisors us
  ON CONFLICT (team_lead_msisdn) DO UPDATE
    SET team_lead_name = EXCLUDED.team_lead_name,
        is_active = true
  RETURNING team_lead_msisdn
),
updated_monthly AS (
  UPDATE public.hbb_installer_ga_monthly m
  SET team_lead_msisdn = mi.team_lead_msisdn
  FROM mapped_installers mi
  WHERE LOWER(TRIM(m.installer_name)) = mi.installer_name_key
    AND COALESCE(TRIM(mi.team_lead_msisdn), '') <> ''
    AND m.team_lead_msisdn IS DISTINCT FROM mi.team_lead_msisdn
  RETURNING m.installer_name, m.installer_msisdn, m.ga_count, m.month_year, m.team_lead_msisdn
),
final_report AS (
  SELECT
    'updated_monthly' AS report_type,
    COUNT(*) AS mapped_installers,
    COUNT(DISTINCT team_lead_msisdn) AS unique_supervisors
  FROM updated_monthly
)
SELECT * FROM final_report;

-- Overall coverage: total installers with supervisor mapping.
SELECT
  COUNT(*) AS total_installers_with_supervisor,
  COUNT(DISTINCT team_lead_msisdn) AS total_supervisors,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.hbb_installer_ga_monthly), 2) AS coverage_percentage
FROM public.hbb_installer_ga_monthly
WHERE COALESCE(NULLIF(TRIM(team_lead_msisdn), ''), '') <> '';

-- Backfill summary by supervisor.
SELECT
  tl.team_lead_msisdn,
  tl.team_lead_name,
  COUNT(*) AS ga_installer_count,
  COUNT(DISTINCT m.month_year) AS months_covered
FROM public.hbb_installer_ga_monthly m
LEFT JOIN public.hbb_installer_team_lead tl
  ON tl.team_lead_msisdn = m.team_lead_msisdn
WHERE COALESCE(NULLIF(TRIM(m.team_lead_msisdn), ''), '') <> ''
GROUP BY tl.team_lead_msisdn, tl.team_lead_name
ORDER BY ga_installer_count DESC;

-- Unmatched installers still needing a mapping.
SELECT
  m.installer_name,
  m.installer_msisdn,
  m.ga_count,
  m.month_year,
  i."Supervisor" AS inhouse_supervisor_name,
  i."Installer name" AS inhouse_installer_name
FROM public.hbb_installer_ga_monthly m
LEFT JOIN public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
  ON LOWER(TRIM(i."Installer name")) = LOWER(TRIM(m.installer_name))
WHERE COALESCE(NULLIF(TRIM(m.team_lead_msisdn), ''), '') = ''
ORDER BY m.month_year DESC, m.ga_count DESC, m.installer_name ASC
LIMIT 100;

-- FINAL SUMMARY: How many installers are still unmatched?
SELECT
  COUNT(*) AS still_unmatched_installers,
  (SELECT COUNT(*) FROM public.hbb_installer_ga_monthly) AS total_installers,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM public.hbb_installer_ga_monthly), 2) AS unmatched_percentage
FROM public.hbb_installer_ga_monthly
WHERE COALESCE(NULLIF(TRIM(team_lead_msisdn), ''), '') = '';