-- Migration: Copy existing GA data from old uppercase tables to new lowercase tables
-- Created: 2026-04-28

-- Copy installer GA data from old to new monthly table
INSERT INTO public.hbb_installer_ga_monthly (
  installer_msisdn, installer_name, town, ga_count, current_band_min, current_band_max, incentive_earned,
  report_batch_id, month_year, upload_date, last_updated, created_at
)
SELECT 
  installer_msisdn, 
  installer_name, 
  town, 
  ga_count, 
  COALESCE(current_band_min, 0) as current_band_min,
  COALESCE(current_band_max, 0) as current_band_max,
  COALESCE(incentive_earned, 0) as incentive_earned,
  report_batch_id,
  month_year,
  upload_date,
  COALESCE(last_updated, now()) as last_updated,
  COALESCE(created_at, now()) as created_at
FROM public.HBB_INSTALLER_GA_MONTHLY
ON CONFLICT (installer_msisdn, month_year) DO NOTHING;

-- Copy DSE GA data from old to new monthly table
INSERT INTO public.hbb_dse_ga_monthly (
  dse_msisdn, dse_name, town, ga_count, current_band_min, current_band_max, incentive_earned,
  report_batch_id, month_year, upload_date, last_updated, created_at
)
SELECT 
  dse_msisdn, 
  dse_name, 
  town, 
  ga_count, 
  COALESCE(current_band_min, 0) as current_band_min,
  COALESCE(current_band_max, 0) as current_band_max,
  COALESCE(incentive_earned, 0) as incentive_earned,
  report_batch_id,
  month_year,
  upload_date,
  COALESCE(last_updated, now()) as last_updated,
  COALESCE(created_at, now()) as created_at
FROM public.HBB_DSE_GA_MONTHLY
ON CONFLICT (dse_msisdn, month_year) DO NOTHING;
