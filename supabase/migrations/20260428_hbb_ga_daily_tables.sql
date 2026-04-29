-- Migration: Add daily GA tables for installers and DSEs
-- Created: 2026-04-28

CREATE TABLE IF NOT EXISTS public.hbb_installer_ga_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installer_msisdn text NOT NULL,
  installer_name text,
  town text,
  ga_date date NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  report_batch_id uuid REFERENCES public.hbb_ga_upload_batches(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hbb_installer_ga_daily_msisdn_idx ON public.hbb_installer_ga_daily(installer_msisdn);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_daily_date_idx ON public.hbb_installer_ga_daily(ga_date);
CREATE INDEX IF NOT EXISTS hbb_installer_ga_daily_batch_idx ON public.hbb_installer_ga_daily(report_batch_id);

CREATE TABLE IF NOT EXISTS public.hbb_dse_ga_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dse_msisdn text NOT NULL,
  dse_name text,
  town text,
  ga_date date NOT NULL,
  ga_count integer NOT NULL DEFAULT 0,
  report_batch_id uuid REFERENCES public.hbb_ga_upload_batches(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hbb_dse_ga_daily_msisdn_idx ON public.hbb_dse_ga_daily(dse_msisdn);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_daily_date_idx ON public.hbb_dse_ga_daily(ga_date);
CREATE INDEX IF NOT EXISTS hbb_dse_ga_daily_batch_idx ON public.hbb_dse_ga_daily(report_batch_id);
