-- =============================================================================
-- FIX: "INSERT has more expressions than target columns" on jobs table
-- Two triggers are broken: trigger_archive_gps_on_completion
--                          trigger_auto_maintenance
--
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 (optional): View the broken function bodies before changing anything
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  proname AS function_name,
  pg_get_functiondef(oid) AS body
FROM pg_proc
WHERE proname IN ('archive_gps_on_completion', 'auto_maintenance_on_job_change');


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Drop both broken triggers from jobs
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_archive_gps_on_completion ON public.jobs;
DROP TRIGGER IF EXISTS trigger_auto_maintenance          ON public.jobs;

-- Drop the underlying functions (CASCADE just in case other triggers use them)
DROP FUNCTION IF EXISTS public.archive_gps_on_completion()     CASCADE;
DROP FUNCTION IF EXISTS public.auto_maintenance_on_job_change() CASCADE;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Recreate archive_gps_on_completion — fixed column list
--
-- installer_locations_archive schema:
--   id uuid, installer_id bigint, lat float8, lng float8,
--   accuracy float8, timestamp timestamptz
-- (NO job_id column — that was the mismatch)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.archive_gps_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only archive when a job is completed and GPS coords are present
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.completion_lat IS NOT NULL
     AND NEW.completion_lng IS NOT NULL
     AND NEW.installer_id IS NOT NULL THEN

    INSERT INTO public.installer_locations_archive
      (installer_id, lat, lng, accuracy, timestamp)
    VALUES
      (NEW.installer_id,
       NEW.completion_lat,
       NEW.completion_lng,
       NULL,
       NOW());

  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Never let archiving block the job update
    RAISE WARNING '[archive_gps_on_completion] failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_archive_gps_on_completion
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_gps_on_completion();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Recreate auto_maintenance_on_job_change — safe stub
--
-- The original function had a broken INSERT. This safe version:
--  • Resets daily_job_count on the installer when a job completes/fails
--  • Wraps everything in EXCEPTION so it never blocks the main update
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_maintenance_on_job_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a job finishes (completed/failed/cancelled), mark installer available again
  IF NEW.status IN ('completed', 'failed', 'cancelled', 'rescheduled')
     AND OLD.status NOT IN ('completed', 'failed', 'cancelled', 'rescheduled')
     AND NEW.installer_id IS NOT NULL THEN

    UPDATE public.installers
    SET
      is_available   = true,
      current_job_id = NULL
    WHERE id = NEW.installer_id;

  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[auto_maintenance_on_job_change] failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_maintenance
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_maintenance_on_job_change();


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verify — all four triggers should now be clean
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  t.tgname   AS trigger_name,
  CASE t.tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
  p.proname  AS function_name
FROM pg_trigger t
JOIN pg_proc    p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.jobs'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;
