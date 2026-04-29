-- Backfill installer team lead mapping using names as the source of truth.
-- INHOUSE_INSTALLER_6TOWNS_MARCH carries installer -> supervisor names.
-- installer_supervisor carries supervisor name -> supervisor phone.

WITH mapped_installers AS (
  SELECT DISTINCT
    LOWER(TRIM(i."Installer name")) AS installer_name_key,
    TRIM(i."Installer name") AS installer_name,
    TRIM(i."Supervisor") AS team_lead_name,
    TRIM(s."Phone") AS team_lead_msisdn
  FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
  JOIN public.installer_supervisor s
    ON LOWER(TRIM(s."Installers supervisor")) = LOWER(TRIM(i."Supervisor"))
  WHERE COALESCE(TRIM(i."Installer name"), '') <> ''
    AND COALESCE(TRIM(i."Supervisor"), '') <> ''
    AND COALESCE(TRIM(s."Phone"), '') <> ''
),
mapped_supervisors AS (
  SELECT DISTINCT
    team_lead_name,
    team_lead_msisdn
  FROM mapped_installers
),
upsert_team_leads AS (
  INSERT INTO public.hbb_installer_team_lead (team_lead_msisdn, team_lead_name, is_active)
  SELECT DISTINCT
    ms.team_lead_msisdn,
    ms.team_lead_name,
    true
  FROM mapped_supervisors ms
  ON CONFLICT (team_lead_msisdn) DO UPDATE
    SET team_lead_name = EXCLUDED.team_lead_name,
        is_active = true
  RETURNING team_lead_msisdn
)
UPDATE public.hbb_installer_ga_monthly m
SET team_lead_msisdn = mi.team_lead_msisdn
FROM mapped_installers mi
WHERE LOWER(TRIM(m.installer_name)) = mi.installer_name_key
  AND mi.team_lead_msisdn IS NOT NULL
  AND m.team_lead_msisdn IS DISTINCT FROM mi.team_lead_msisdn;

-- Verification: count the number of April records now linked to a supervisor.
SELECT
  COUNT(*) AS total_installers,
  COUNT(CASE WHEN team_lead_msisdn IS NOT NULL THEN 1 END) AS with_team_lead,
  COUNT(DISTINCT team_lead_msisdn) AS unique_team_leads
FROM public.hbb_installer_ga_monthly
WHERE month_year = '2026-04';
