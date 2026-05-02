-- Test: Show all installers assigned to Tonny Blaire (Phone: 733862039)
-- This demonstrates supervisor dashboard functionality

-- 1. Verify Tonny Blaire exists in team lead registry
SELECT 
  team_lead_msisdn,
  team_lead_name,
  is_active
FROM public.hbb_installer_team_lead
WHERE team_lead_msisdn = '733862039';

-- 2. Count of installers assigned to Tonny Blaire
SELECT 
  COUNT(*) AS total_installers_for_tonny,
  COUNT(DISTINCT installer_msisdn) AS unique_installer_msisdns,
  COUNT(DISTINCT month_year) AS months_covered,
  SUM(ga_count) AS total_gas
FROM public.hbb_installer_ga_monthly
WHERE team_lead_msisdn = '733862039';

-- 3. All installers under Tonny Blaire with their GA data
SELECT
  installer_name,
  installer_msisdn,
  ga_count,
  month_year,
  team_lead_msisdn
FROM public.hbb_installer_ga_monthly
WHERE team_lead_msisdn = '733862039'
ORDER BY month_year DESC, ga_count DESC, installer_name ASC;

-- 4. Summary: Tonny's installers by unique installer
SELECT
  installer_name,
  installer_msisdn,
  COUNT(*) AS months_with_data,
  SUM(ga_count) AS total_gas,
  ROUND(AVG(ga_count), 2) AS avg_ga_per_month,
  MIN(ga_count) AS min_ga,
  MAX(ga_count) AS max_ga
FROM public.hbb_installer_ga_monthly
WHERE team_lead_msisdn = '733862039'
GROUP BY installer_name, installer_msisdn
ORDER BY total_gas DESC;

-- 5. Dashboard view: Show Tonny's team structure
SELECT
  'Tonny Blaire' AS supervisor_name,
  '733862039' AS supervisor_phone,
  COUNT(DISTINCT installer_msisdn) AS team_size,
  COUNT(DISTINCT month_year) AS reporting_periods,
  SUM(ga_count) AS total_ga_count,
  ROUND(AVG(ga_count), 2) AS avg_ga_per_period
FROM public.hbb_installer_ga_monthly
WHERE team_lead_msisdn = '733862039';
