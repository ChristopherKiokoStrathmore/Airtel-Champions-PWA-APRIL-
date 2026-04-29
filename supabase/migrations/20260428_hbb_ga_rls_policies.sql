-- Migration: Add RLS policies to HBB GA daily and monthly tables
-- Created: 2026-04-28
-- NOTE: RLS policies disabled for now - keeping tables accessible without row-level restrictions

-- DISABLED: Enable RLS on daily tables
-- ALTER TABLE public.hbb_installer_ga_daily ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.hbb_dse_ga_daily ENABLE ROW LEVEL SECURITY;

-- DISABLED: Enable RLS on monthly tables (if not already)
-- ALTER TABLE public.hbb_installer_ga_monthly ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.hbb_dse_ga_monthly ENABLE ROW LEVEL SECURITY;

-- DISABLED: Installer daily: Allow anon/authenticated users to read all rows (GA is public)
-- CREATE POLICY "hbb_installer_ga_daily_read_all" 
--   ON public.hbb_installer_ga_daily 
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "hbb_installer_ga_daily_insert_admin" 
--   ON public.hbb_installer_ga_daily 
--   FOR INSERT 
--   WITH CHECK (true);

-- DISABLED: DSE daily: Allow anon/authenticated users to read all rows
-- CREATE POLICY "hbb_dse_ga_daily_read_all" 
--   ON public.hbb_dse_ga_daily 
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "hbb_dse_ga_daily_insert_admin" 
--   ON public.hbb_dse_ga_daily 
--   FOR INSERT 
--   WITH CHECK (true);

-- DISABLED: Installer monthly: Allow anon/authenticated users to read all rows
-- CREATE POLICY "hbb_installer_ga_monthly_read_all" 
--   ON public.hbb_installer_ga_monthly 
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "hbb_installer_ga_monthly_insert_admin" 
--   ON public.hbb_installer_ga_monthly 
--   FOR INSERT 
--   WITH CHECK (true);

-- DISABLED: DSE monthly: Allow anon/authenticated users to read all rows
-- CREATE POLICY "hbb_dse_ga_monthly_read_all" 
--   ON public.hbb_dse_ga_monthly 
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "hbb_dse_ga_monthly_insert_admin" 
--   ON public.hbb_dse_ga_monthly 
--   FOR INSERT 
--   WITH CHECK (true);
