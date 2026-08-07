-- Preview script to validate fuzzy matching logic (50% similarity threshold).
-- This is READ-ONLY and does not modify any data.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Show potential fuzzy matches for a sample of unmatched GA installers.
-- This demonstrates how the fuzzy matching will work before applying it.
SELECT
  m.installer_name AS ga_installer_name,
  i."Installer name" AS inhouse_installer_name,
  i."Supervisor" AS supervisor_name,
  similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) AS match_score,
  CASE 
    WHEN similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.50 
    THEN 'WILL MATCH'
    ELSE 'no match'
  END AS fuzzy_match_status
FROM public.hbb_installer_ga_monthly m
JOIN public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
  ON similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.50
LEFT JOIN (
  SELECT DISTINCT LOWER(TRIM(i."Installer name")) AS matched_installer
  FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
) exact_match
  ON LOWER(TRIM(exact_match.matched_installer)) = LOWER(TRIM(m.installer_name))
WHERE exact_match.matched_installer IS NULL  -- Not already matched exactly
  AND COALESCE(NULLIF(TRIM(m.team_lead_msisdn), ''), '') = ''  -- Not yet assigned a supervisor
ORDER BY match_score DESC, m.ga_count DESC
LIMIT 50;

-- Count breakdowns: how many installers at each similarity level could be matched.
SELECT
  CASE
    WHEN similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.9 THEN '90-100% match'
    WHEN similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.85 THEN '85-89% match'
    WHEN similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.8 THEN '80-84% match'
    WHEN similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.50 THEN '50-59% match (TARGET)'
    ELSE 'below 50%'
  END AS similarity_band,
  COUNT(DISTINCT m.installer_name) AS unmatched_ga_installer_count
FROM public.hbb_installer_ga_monthly m
LEFT JOIN (
  SELECT DISTINCT LOWER(TRIM(i."Installer name")) AS matched_installer
  FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
) exact_match
  ON LOWER(TRIM(exact_match.matched_installer)) = LOWER(TRIM(m.installer_name))
CROSS JOIN public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
WHERE exact_match.matched_installer IS NULL  -- Not exactly matched
  AND COALESCE(NULLIF(TRIM(m.team_lead_msisdn), ''), '') = ''  -- Not yet assigned a supervisor
  AND similarity(LOWER(TRIM(m.installer_name)), LOWER(TRIM(i."Installer name"))) >= 0.50
GROUP BY similarity_band
ORDER BY similarity_band DESC;

-- Specific test case: Benard Kiplangat (typo example - should match at 75% threshold).
SELECT
  'Benard Kiplangat' AS ga_name,
  i."Installer name" AS inhouse_name,
  i."Supervisor" AS supervisor_name,
  similarity('Benard Kiplangat', i."Installer name") AS similarity_score,
  CASE 
    WHEN similarity('Benard Kiplangat', i."Installer name") >= 0.50 
    THEN '✓ WILL MATCH (>= 50%)'
    ELSE '✗ Below 50% threshold'
  END AS match_status
FROM public."INHOUSE_INSTALLER_6TOWNS_MARCH" i
WHERE similarity(LOWER('benard kiplangat'), LOWER(TRIM(i."Installer name"))) >= 0.7
ORDER BY similarity_score DESC
LIMIT 10;
