-- =============================================================================
-- HBB TABLE CONSOLIDATION MIGRATION  (schema-accurate rewrite 2026-04-10)
-- =============================================================================
-- Tables read from .schema:
--
--   INHOUSE_INSTALLER_6TOWNS_MARCH
--     ID bigint PK, "Installer name" text, "Installer contact" bigint,
--     "Estate Name" text, Town text, PIN numeric, is_available bool,
--     last_known_lat double, last_known_lng double, max_jobs_per_day int,
--     current_job_id uuid, daily_job_count int
--
--   installers_HBB
--     id bigint PK, name text, phone text UNIQUE, pin text,
--     town_id bigint, status text DEFAULT 'active', max_jobs_per_day int
--     (no is_available column — see installers_availability table)
--
--   installers_availability
--     installer_id bigint PK FK→INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
--     is_available bool, current_job_id uuid, daily_job_count int, updated_at
--
--   service_request
--     id bigint GENERATED ALWAYS AS IDENTITY,
--     sr_number text, customer_name text, customer_phone text,
--     town_id integer, estate text, package text,
--     preferred_date date, preferred_time text,
--     status text CHECK('open','assigned','completed','failed',
--                        'rescheduled','unreachable','not_ready'),
--     assigned_installer_id bigint, assigned_at timestamptz,
--     agent_name text, agent_phone text, remarks text, completed_at timestamptz,
--     rejection_count int, rejected_by bigint[], escalated_at timestamptz,
--     source_type text, source_id bigint, source_name text
--
--   jobs (existing — UUID PK, already has most live data)
--     id uuid PK, customer_phone text NOT NULL, customer_name text,
--     town text, estate_name text NOT NULL, status text CHECK(...),
--     installer_id bigint FK→INHOUSE_INSTALLER_6TOWNS_MARCH(ID),
--     requested_at, assigned_at, on_way_at, arrived_at, completed_at,
--     before_photo_url, after_photo_url, customer_lat, customer_lng,
--     street_address, landmark, building, "Estate" text, package,
--     scheduled_date text, zone, scheduled_time, service_request_id bigint,
--     source_type, source_id bigint, source_name, sr_number bigint,
--     rejected_by bigint[], created_at
--
-- What this migration does (in order):
--   1. Create unified `installers` table
--   2. Migrate INHOUSE_INSTALLER_6TOWNS_MARCH → installers  (highest priority)
--   3. Migrate installers_HBB → installers  (skip phone dupes)
--   4. Drop old FK on jobs.installer_id, point it to new installers(id)
--   5. Extend jobs with columns needed for service_request migration
--   6. Expand jobs.status constraint to cover service_request statuses
--   7. Migrate service_request → jobs  (skip rows already linked via service_request_id)
--   8. Indexes
--   9. RLS
--
-- IMPORTANT: Old tables are NOT renamed because other tables
--   (installer_locations, installer_locations_archive, installers_availability,
--    job_reviews, jobs) have FK constraints pointing to INHOUSE_INSTALLER_6TOWNS_MARCH(ID).
--   Renaming would break those FKs.  The old tables are left in place;
--   application code is updated to write only to the new unified tables.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Create unified installers table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS installers (
  id               BIGSERIAL     PRIMARY KEY,
  name             TEXT          NOT NULL,
  phone            TEXT          NOT NULL,       -- normalised 0XXXXXXXXX
  town             TEXT,
  estate           TEXT,                         -- service estate/area
  lat              DOUBLE PRECISION,             -- installer base lat
  lng              DOUBLE PRECISION,             -- installer base lng
  status           TEXT          NOT NULL DEFAULT 'available',
  max_jobs_per_day INTEGER       NOT NULL DEFAULT 6,
  pin              TEXT          NOT NULL DEFAULT '1234',
  is_available     BOOLEAN       NOT NULL DEFAULT TRUE,
  current_job_id   UUID,                         -- jobs.id (uuid)
  source_table     TEXT,                         -- origin table name
  legacy_id        BIGINT,                       -- original PK from source table
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Unique index on phone — used for deduplication during import
CREATE UNIQUE INDEX IF NOT EXISTS installers_phone_unique ON installers (phone);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Migrate INHOUSE_INSTALLER_6TOWNS_MARCH → installers
--
-- "Installer contact" is stored as bigint in the DB.  Cast to text and
-- normalise to 0XXXXXXXXX (Kenyan mobile format).
-- lat/lng come from last_known_lat / last_known_lng.
-- Estate comes from "Estate Name" column.
-- availability comes from is_available column.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO installers
  (name, phone, town, estate, lat, lng, status, max_jobs_per_day, pin,
   is_available, current_job_id, source_table, legacy_id, created_at)
SELECT
  COALESCE("Installer name", 'Installer')        AS name,
  -- Normalise bigint phone to 0XXXXXXXXX
  CASE
    WHEN LENGTH("Installer contact"::TEXT) = 9  THEN '0' || "Installer contact"::TEXT
    WHEN LENGTH("Installer contact"::TEXT) = 12 THEN '0' || SUBSTRING("Installer contact"::TEXT, 4)
    ELSE "Installer contact"::TEXT
  END                                             AS phone,
  Town                                            AS town,
  "Estate Name"                                   AS estate,
  last_known_lat                                  AS lat,
  last_known_lng                                  AS lng,
  CASE WHEN COALESCE(is_available, TRUE) THEN 'available' ELSE 'unavailable' END AS status,
  COALESCE(max_jobs_per_day, 6),
  -- PIN is numeric in schema; cast to text, strip trailing .0
  REGEXP_REPLACE(COALESCE(PIN::TEXT, '1234'), '\.0+$', '') AS pin,
  COALESCE(is_available, TRUE),
  current_job_id,
  'INHOUSE_INSTALLER_6TOWNS_MARCH'                AS source_table,
  ID                                              AS legacy_id,
  NOW()
FROM "INHOUSE_INSTALLER_6TOWNS_MARCH"
WHERE "Installer contact" IS NOT NULL
ON CONFLICT (phone) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Migrate installers_HBB → installers  (skip phone dupes)
--
-- installers_HBB.status = 'active' maps to 'available'.
-- installers_HBB has no is_available column; derive from status.
-- No lat/lng on this table.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO installers
  (name, phone, town, status, max_jobs_per_day, pin,
   is_available, source_table, legacy_id, created_at)
SELECT
  COALESCE(name, 'Installer')                     AS name,
  -- phone is already text in installers_HBB (UNIQUE constraint confirms valid format)
  CASE
    WHEN phone LIKE '+254%' THEN '0' || SUBSTRING(phone, 5)
    WHEN phone LIKE '254%'  THEN '0' || SUBSTRING(phone, 4)
    ELSE phone
  END                                             AS phone,
  NULL                                            AS town,   -- no town text; only town_id
  CASE WHEN COALESCE(status, 'active') = 'active'
       THEN 'available' ELSE 'unavailable' END    AS status,
  COALESCE(max_jobs_per_day, 6),
  COALESCE(pin, '1234'),
  (COALESCE(status, 'active') = 'active')        AS is_available,
  'installers_HBB'                               AS source_table,
  id                                             AS legacy_id,
  NOW()
FROM installers_HBB
WHERE phone IS NOT NULL
ON CONFLICT (phone) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Re-point jobs.installer_id → installers(id)
--
-- Current: jobs.installer_id bigint FK → INHOUSE_INSTALLER_6TOWNS_MARCH(ID)
-- Target:  jobs.installer_id bigint FK → installers(id)
--
-- 4a. Drop the old FK constraint.
-- 4b. Update existing installer_id values to the new installers.id.
-- 4c. Add the new FK constraint.
-- ─────────────────────────────────────────────────────────────────────────────

-- 4a. Drop old FK (constraint name from .schema)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_installer_id_fkey;

-- 4b. Remap values: old INHOUSE ID → new installers.id
--     We use a correlated subquery. Rows with no match will be set to NULL
--     (installer no longer in the unified table — safe to null out).
UPDATE jobs j
SET installer_id = (
  SELECT ins.id
  FROM   installers ins
  WHERE  ins.legacy_id     = j.installer_id
    AND  ins.source_table  = 'INHOUSE_INSTALLER_6TOWNS_MARCH'
  LIMIT  1
)
WHERE j.installer_id IS NOT NULL;

-- 4c. Add new FK
ALTER TABLE jobs
  ADD CONSTRAINT jobs_installer_id_fkey
  FOREIGN KEY (installer_id) REFERENCES installers(id)
  ON DELETE SET NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Add missing columns to jobs for service_request migration
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS agent_name      TEXT,
  ADD COLUMN IF NOT EXISTS agent_phone     TEXT,
  ADD COLUMN IF NOT EXISTS remarks         TEXT,
  ADD COLUMN IF NOT EXISTS completion_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS completion_lng  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS legacy_sr_id    BIGINT;   -- service_request.id


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Expand jobs.status CHECK to include service_request statuses
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (
  status IN (
    -- original jobs statuses
    'pending', 'assigned', 'on_way', 'arrived', 'completed',
    'cancelled', 'scheduled', 'pending_escalation', 'pending_reassignment',
    -- added from service_request
    'open', 'failed', 'rescheduled', 'unreachable', 'not_ready'
  )
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Migrate service_request → jobs
--
-- Skip rows that are already linked via jobs.service_request_id.
-- estate_name is NOT NULL in jobs — use COALESCE(estate, '') as fallback.
-- preferred_date is DATE in service_request; cast to TEXT for scheduled_date.
-- installer_id must map to the new installers(id) via installers_HBB legacy_id.
-- sr_number in jobs is bigint; we store NULL (service_request uses text sr_number).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO jobs (
  id,
  customer_phone,
  customer_name,
  town,
  estate_name,
  package,
  scheduled_date,
  scheduled_time,
  status,
  installer_id,
  assigned_at,
  completed_at,
  agent_name,
  agent_phone,
  remarks,
  source_type,
  source_id,
  source_name,
  rejected_by,
  service_request_id,
  legacy_sr_id,
  created_at
)
SELECT
  gen_random_uuid()                             AS id,
  COALESCE(sr.customer_phone, '')               AS customer_phone,
  sr.customer_name,
  NULL                                          AS town,      -- no text town on SR; only town_id (no towns_HBB table)
  COALESCE(sr.estate, '')                       AS estate_name,  -- NOT NULL constraint
  sr.package,
  sr.preferred_date::TEXT                       AS scheduled_date,
  sr.preferred_time                             AS scheduled_time,
  -- Map 'open' → 'pending'; all other statuses pass through (now in CHECK)
  CASE WHEN sr.status = 'open' THEN 'pending' ELSE sr.status END AS status,
  -- Map assigned_installer_id (installers_HBB.id) → new installers.id
  (
    SELECT ins.id
    FROM   installers ins
    WHERE  ins.legacy_id    = sr.assigned_installer_id
      AND  ins.source_table = 'installers_HBB'
    LIMIT  1
  )                                             AS installer_id,
  sr.assigned_at,
  sr.completed_at,
  sr.agent_name,
  sr.agent_phone,
  sr.remarks,
  sr.source_type,
  sr.source_id,
  sr.source_name,
  COALESCE(sr.rejected_by, '{}'::bigint[])      AS rejected_by,
  sr.id                                         AS service_request_id,
  sr.id                                         AS legacy_sr_id,
  sr.created_at
FROM service_request sr
-- Skip rows that have already been imported via service_request_id link
WHERE NOT EXISTS (
  SELECT 1 FROM jobs j
  WHERE  j.service_request_id = sr.id
     OR  j.legacy_sr_id       = sr.id
);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS installers_town_idx      ON installers (town);
CREATE INDEX IF NOT EXISTS installers_estate_idx    ON installers (estate);
CREATE INDEX IF NOT EXISTS installers_avail_idx     ON installers (is_available, status);
CREATE INDEX IF NOT EXISTS installers_legacy_idx    ON installers (legacy_id, source_table);

CREATE INDEX IF NOT EXISTS jobs_status_idx          ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_installer_id_idx    ON jobs (installer_id);
CREATE INDEX IF NOT EXISTS jobs_agent_phone_idx     ON jobs (agent_phone);
CREATE INDEX IF NOT EXISTS jobs_assigned_at_idx     ON jobs (assigned_at);
CREATE INDEX IF NOT EXISTS jobs_estate_name_idx     ON jobs (estate_name);
CREATE INDEX IF NOT EXISTS jobs_legacy_sr_idx       ON jobs (legacy_sr_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: RLS policies for the new installers table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='installers' AND policyname='installers_anon_select') THEN
    CREATE POLICY installers_anon_select ON installers FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='installers' AND policyname='installers_anon_update') THEN
    CREATE POLICY installers_anon_update ON installers FOR UPDATE TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='installers' AND policyname='installers_anon_insert') THEN
    CREATE POLICY installers_anon_insert ON installers FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;
