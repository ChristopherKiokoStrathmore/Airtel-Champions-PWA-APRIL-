-- =============================================================================
-- PATCH: Fix for failing steps 2, 3, 5, 7, 8
-- Run each block separately in the Supabase SQL editor (one at a time).
-- Steps 1, 4, 6 from the original migration are assumed already done.
-- =============================================================================


-- =============================================================================
-- PATCH STEP 2: Migrate INHOUSE_INSTALLER_6TOWNS_MARCH into installers
-- Fix: added table alias "t" so "t.Town" is unambiguous vs target column "town"
-- =============================================================================

INSERT INTO installers (
  name, phone, town, estate,
  lat, lng,
  status, max_jobs_per_day, pin,
  is_available, current_job_id,
  source_table, legacy_id, created_at
)
SELECT
  COALESCE(t."Installer name", 'Installer'),
  CASE
    WHEN LENGTH(t."Installer contact"::TEXT) = 9  THEN '0' || t."Installer contact"::TEXT
    WHEN LENGTH(t."Installer contact"::TEXT) = 12 THEN '0' || SUBSTRING(t."Installer contact"::TEXT, 4)
    ELSE t."Installer contact"::TEXT
  END,
  t."Town",
  t."Estate Name",
  t.last_known_lat,
  t.last_known_lng,
  CASE WHEN COALESCE(t.is_available, TRUE) THEN 'available' ELSE 'unavailable' END,
  COALESCE(t.max_jobs_per_day, 6),
  REGEXP_REPLACE(COALESCE(t."PIN"::TEXT, '1234'), '\.0+$', ''),
  COALESCE(t.is_available, TRUE),
  t.current_job_id,
  'INHOUSE_INSTALLER_6TOWNS_MARCH',
  t."ID",
  NOW()
FROM "INHOUSE_INSTALLER_6TOWNS_MARCH" t
WHERE t."Installer contact" IS NOT NULL
ON CONFLICT (phone) DO NOTHING;


-- =============================================================================
-- PATCH STEP 3: Migrate installers_HBB into installers
-- Fix: "installers_HBB" must be quoted (PostgreSQL is case-sensitive)
-- =============================================================================

INSERT INTO installers (
  name, phone, town,
  status, max_jobs_per_day, pin,
  is_available,
  source_table, legacy_id, created_at
)
SELECT
  COALESCE(h.name, 'Installer'),
  CASE
    WHEN h.phone LIKE '+254%' THEN '0' || SUBSTRING(h.phone, 5)
    WHEN h.phone LIKE '254%'  THEN '0' || SUBSTRING(h.phone, 4)
    ELSE h.phone
  END,
  NULL,
  CASE WHEN COALESCE(h.status, 'active') = 'active' THEN 'available' ELSE 'unavailable' END,
  COALESCE(h.max_jobs_per_day, 6),
  COALESCE(h.pin, '1234'),
  (COALESCE(h.status, 'active') = 'active'),
  'installers_HBB',
  h.id,
  NOW()
FROM "installers_HBB" h
WHERE h.phone IS NOT NULL
ON CONFLICT (phone) DO NOTHING;


-- =============================================================================
-- RE-RUN installer_id remap (Step 4 may have run while installers was empty)
-- Safe to re-run: only updates rows where installer_id currently has no match
-- in the new installers table (i.e. still points to the old INHOUSE ID).
-- =============================================================================

UPDATE jobs j
SET installer_id = (
  SELECT ins.id
  FROM   installers ins
  WHERE  ins.legacy_id    = j.installer_id
    AND  ins.source_table = 'INHOUSE_INSTALLER_6TOWNS_MARCH'
  LIMIT  1
)
WHERE j.installer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM installers ins WHERE ins.id = j.installer_id
  );


-- =============================================================================
-- PATCH STEP 5: Add missing columns to jobs
-- Fix: one statement per column — no trailing inline comments
-- =============================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agent_name     TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS agent_phone    TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remarks        TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_lat DOUBLE PRECISION;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_lng DOUBLE PRECISION;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS legacy_sr_id   BIGINT;


-- =============================================================================
-- PATCH STEP 7: Migrate service_request rows into jobs
-- (unchanged logic — will now succeed because columns exist)
-- =============================================================================

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
  gen_random_uuid(),
  COALESCE(sr.customer_phone, ''),
  sr.customer_name,
  NULL,
  COALESCE(sr.estate, ''),
  sr.package,
  sr.preferred_date::TEXT,
  sr.preferred_time,
  CASE WHEN sr.status = 'open' THEN 'pending' ELSE sr.status END,
  (
    SELECT ins.id
    FROM   installers ins
    WHERE  ins.legacy_id    = sr.assigned_installer_id
      AND  ins.source_table = 'installers_HBB'
    LIMIT  1
  ),
  sr.assigned_at,
  sr.completed_at,
  sr.agent_name,
  sr.agent_phone,
  sr.remarks,
  sr.source_type,
  sr.source_id,
  sr.source_name,
  COALESCE(sr.rejected_by, '{}'::bigint[]),
  sr.id,
  sr.id,
  sr.created_at
FROM service_request sr
WHERE NOT EXISTS (
  SELECT 1 FROM jobs j
  WHERE  j.service_request_id = sr.id
     OR  j.legacy_sr_id       = sr.id
);


-- =============================================================================
-- PATCH STEP 8: Indexes
-- (will now succeed because agent_phone and legacy_sr_id columns exist)
-- =============================================================================

CREATE INDEX IF NOT EXISTS jobs_status_idx       ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_installer_idx    ON jobs (installer_id);
CREATE INDEX IF NOT EXISTS jobs_agent_phone_idx  ON jobs (agent_phone);
CREATE INDEX IF NOT EXISTS jobs_assigned_at_idx  ON jobs (assigned_at);
CREATE INDEX IF NOT EXISTS jobs_estate_idx       ON jobs (estate_name);
CREATE INDEX IF NOT EXISTS jobs_legacy_sr_idx    ON jobs (legacy_sr_id);

CREATE INDEX IF NOT EXISTS installers_town_idx   ON installers (town);
CREATE INDEX IF NOT EXISTS installers_estate_idx ON installers (estate);
CREATE INDEX IF NOT EXISTS installers_avail_idx  ON installers (is_available, status);
CREATE INDEX IF NOT EXISTS installers_legacy_idx ON installers (legacy_id, source_table);
