-- Migration: RPCs to recompute monthly aggregates from daily GA rows
-- Created: 2026-04-28

CREATE OR REPLACE FUNCTION public.recompute_hbb_installer_monthly_from_daily(batch_uuid uuid)
RETURNS void AS $$
DECLARE
  rec record;
  v_band record;
BEGIN
  FOR rec IN
    SELECT installer_msisdn, installer_name, town, to_char(ga_date, 'YYYY-MM') AS month_year, SUM(ga_count) AS total_ga, MAX(created_at) AS upload_date
    FROM public.hbb_installer_ga_daily
    WHERE report_batch_id = batch_uuid
    GROUP BY installer_msisdn, installer_name, town, to_char(ga_date, 'YYYY-MM')
  LOOP
    SELECT band_name, ga_range_min, ga_range_max, total_bonus INTO v_band
    FROM public.get_incentive_band(rec.total_ga, 'installer');

    INSERT INTO public.hbb_installer_ga_monthly(
      installer_msisdn, installer_name, town, ga_count, current_band_min, current_band_max, incentive_earned,
      report_batch_id, month_year, upload_date, last_updated, created_at
    ) VALUES (
      rec.installer_msisdn, rec.installer_name, rec.town, rec.total_ga, COALESCE(v_band.ga_range_min, 0), COALESCE(v_band.ga_range_max, 0), COALESCE(v_band.total_bonus, 0),
      batch_uuid, rec.month_year, rec.upload_date, now(), now()
    )
    ON CONFLICT (installer_msisdn, month_year) DO UPDATE SET
      ga_count = EXCLUDED.ga_count,
      current_band_min = EXCLUDED.current_band_min,
      current_band_max = EXCLUDED.current_band_max,
      incentive_earned = EXCLUDED.incentive_earned,
      report_batch_id = EXCLUDED.report_batch_id,
      upload_date = EXCLUDED.upload_date,
      last_updated = now();
  END LOOP;
END; $$
LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.recompute_hbb_dse_monthly_from_daily(batch_uuid uuid)
RETURNS void AS $$
DECLARE
  rec record;
  v_band record;
BEGIN
  FOR rec IN
    SELECT dse_msisdn, dse_name, town, to_char(ga_date, 'YYYY-MM') AS month_year, SUM(ga_count) AS total_ga, MAX(created_at) AS upload_date
    FROM public.hbb_dse_ga_daily
    WHERE report_batch_id = batch_uuid
    GROUP BY dse_msisdn, dse_name, town, to_char(ga_date, 'YYYY-MM')
  LOOP
    SELECT band_name, ga_range_min, ga_range_max, total_bonus INTO v_band
    FROM public.get_incentive_band(rec.total_ga, 'dse');

    INSERT INTO public.hbb_dse_ga_monthly(
      dse_msisdn, dse_name, town, ga_count, current_band_min, current_band_max, incentive_earned,
      report_batch_id, month_year, upload_date, last_updated, created_at
    ) VALUES (
      rec.dse_msisdn, rec.dse_name, rec.town, rec.total_ga, COALESCE(v_band.ga_range_min, 0), COALESCE(v_band.ga_range_max, 0), COALESCE(v_band.total_bonus, 0),
      batch_uuid, rec.month_year, rec.upload_date, now(), now()
    )
    ON CONFLICT (dse_msisdn, month_year) DO UPDATE SET
      ga_count = EXCLUDED.ga_count,
      current_band_min = EXCLUDED.current_band_min,
      current_band_max = EXCLUDED.current_band_max,
      incentive_earned = EXCLUDED.incentive_earned,
      report_batch_id = EXCLUDED.report_batch_id,
      upload_date = EXCLUDED.upload_date,
      last_updated = now();
  END LOOP;
END; $$
LANGUAGE plpgsql;
