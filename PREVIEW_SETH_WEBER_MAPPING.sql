-- Preview installers that would map to Seth Weber through INHOUSE -> installer_supervisor
-- Safe to run read-only in Supabase SQL editor.

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
)
SELECT
  m.installer_name,
  m.installer_msisdn,
  m.ga_count,
  m.month_year,
  mi.team_lead_name,
  mi.team_lead_msisdn
FROM public.hbb_installer_ga_monthly m
JOIN mapped_installers mi
  ON LOWER(TRIM(m.installer_name)) = mi.installer_name_key
WHERE LOWER(TRIM(mi.team_lead_name)) = 'seth weber'
ORDER BY m.ga_count DESC, m.installer_name ASC;