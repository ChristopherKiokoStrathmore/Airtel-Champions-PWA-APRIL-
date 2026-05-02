-- =============================================================================
-- Migration: Remove default PIN values and add pin_changed tracking column
-- Corrected: 2026-05-02 after schema review
--
-- What this does:
--   1. For every table that actually has a `pin`/`PIN` column with
--      DEFAULT '1234', removes that default so new rows can no longer
--      silently receive a known weak PIN.
--   2. Adds a `pin_changed` boolean column (DEFAULT false) to each
--      user-facing table, enabling first-login PIN-reset enforcement.
--
-- IMPORTANT — installers table:
--   The `installers.pin` column is NOT NULL. Dropping its DEFAULT means
--   any INSERT that omits `pin` will fail. Only run this section once you
--   have confirmed that all installer-creation flows explicitly supply a PIN.
--   It is commented out below — uncomment when ready.
--
-- All statements use information_schema guards and are safe to re-run.
-- =============================================================================

DO $$
BEGIN

  -- -------------------------------------------------------------------------
  -- app_users  (main user table — most critical)
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_users'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public.app_users ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_users'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public.app_users ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- app_users_staging
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_users_staging'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public.app_users_staging ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'app_users_staging'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public.app_users_staging ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- hq_directors
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hq_directors'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public.hq_directors ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'hq_directors'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public.hq_directors ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- HBB_HQ_TEAM
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'HBB_HQ_TEAM'
      AND lower(column_name) = 'pin'
  ) THEN
    ALTER TABLE public."HBB_HQ_TEAM" ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'HBB_HQ_TEAM'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public."HBB_HQ_TEAM" ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- agents_HBB
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agents_HBB'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public."agents_HBB" ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agents_HBB'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public."agents_HBB" ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- installers_HBB
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'installers_HBB'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public."installers_HBB" ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'installers_HBB'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public."installers_HBB" ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- INHOUSE_INSTALLER_6TOWNS_MARCH
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'INHOUSE_INSTALLER_6TOWNS_MARCH'
      AND lower(column_name) = 'pin'
  ) THEN
    ALTER TABLE public."INHOUSE_INSTALLER_6TOWNS_MARCH" ALTER COLUMN "PIN" DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'INHOUSE_INSTALLER_6TOWNS_MARCH'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public."INHOUSE_INSTALLER_6TOWNS_MARCH"
        ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- installer_supervisor
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'installer_supervisor'
      AND column_name = 'pin'
  ) THEN
    ALTER TABLE public.installer_supervisor ALTER COLUMN pin DROP DEFAULT;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'installer_supervisor'
        AND column_name = 'pin_changed'
    ) THEN
      ALTER TABLE public.installer_supervisor ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- installers
  -- ⚠️  pin is NOT NULL — verify all INSERT paths supply a PIN before enabling.
  -- -------------------------------------------------------------------------
  -- UNCOMMENT WHEN READY:
  -- IF EXISTS (
  --   SELECT 1 FROM information_schema.columns
  --   WHERE table_schema = 'public' AND table_name = 'installers'
  --     AND column_name = 'pin'
  -- ) THEN
  --   ALTER TABLE public.installers ALTER COLUMN pin DROP DEFAULT;
  --   IF NOT EXISTS (
  --     SELECT 1 FROM information_schema.columns
  --     WHERE table_schema = 'public' AND table_name = 'installers'
  --       AND column_name = 'pin_changed'
  --   ) THEN
  --     ALTER TABLE public.installers ADD COLUMN pin_changed BOOLEAN NOT NULL DEFAULT false;
  --   END IF;
  -- END IF;

  -- -------------------------------------------------------------------------
  -- HBB_INSTALLER_GA_MONTHLY
  -- Note: This is a data/reporting table, not a user table. The PIN column
  -- here seems to be a data artefact. We drop the default but do NOT add
  -- pin_changed since this table doesn't represent a login identity.
  -- -------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'HBB_INSTALLER_GA_MONTHLY'
      AND upper(column_name) = 'PIN'
  ) THEN
    ALTER TABLE public."HBB_INSTALLER_GA_MONTHLY" ALTER COLUMN "PIN" DROP DEFAULT;
  END IF;

END $$;
