-- Add town column to hbb_installer_ga_monthly if it was created without it.
-- The 20260422 infrastructure migration used CREATE TABLE IF NOT EXISTS, so
-- tables that already existed kept their old schema (missing the town column).
ALTER TABLE public."HBB_INSTALLER_GA_MONTHLY" ADD COLUMN IF NOT EXISTS town text;

-- Belt-and-suspenders: cover the lowercase alias if a separate table exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hbb_installer_ga_monthly'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hbb_installer_ga_monthly' AND column_name = 'town'
  ) THEN
    ALTER TABLE public.hbb_installer_ga_monthly ADD COLUMN town text;
  END IF;
END
$$;
