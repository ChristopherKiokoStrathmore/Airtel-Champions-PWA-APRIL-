-- ============================================================
-- NETWORK ISSUES FEATURE MIGRATION
-- Run this once in Supabase SQL Editor
-- ============================================================
-- Schema verified against: app_users (role = character varying, no constraint),
--   programs (uuid PK), submissions (uuid PK, user_id FK → app_users)
-- ============================================================

-- NOTE: app_users.role is character varying with no CHECK constraint.
-- No schema change is needed to support the 'network_team' role value.
-- Simply create user accounts with role = 'network_team' in the Supabase
-- dashboard or via the existing signup flow.

-- 1. Add program_type to programs table
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS program_type TEXT DEFAULT 'standard';

-- Add check constraint separately (safe — column is new, no existing data conflict)
DO $$
BEGIN
  ALTER TABLE programs
    ADD CONSTRAINT programs_program_type_check
    CHECK (program_type IN ('standard', 'network_issues'));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- constraint already exists, skip
END;
$$;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_programs_program_type ON programs(program_type);

-- 2. Add network_issue_status to submissions
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS network_issue_status TEXT DEFAULT NULL;

DO $$
BEGIN
  ALTER TABLE submissions
    ADD CONSTRAINT submissions_network_issue_status_check
    CHECK (network_issue_status IN ('open', 'acknowledged', 'resolved') OR network_issue_status IS NULL);
EXCEPTION WHEN duplicate_object THEN
  NULL; -- constraint already exists, skip
END;
$$;

CREATE INDEX IF NOT EXISTS idx_submissions_network_status
  ON submissions(network_issue_status)
  WHERE network_issue_status IS NOT NULL;

-- 3. Auto-set network_issue_status = 'open' on insert for network programs
CREATE OR REPLACE FUNCTION auto_set_network_issue_status()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM programs
    WHERE id = NEW.program_id
    AND program_type = 'network_issues'
  ) THEN
    NEW.network_issue_status = 'open';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_network_status ON submissions;
CREATE TRIGGER trg_auto_network_status
  BEFORE INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_network_issue_status();

-- 4. Create submission_threads table
--    FKs: submissions(id) uuid ✓  app_users(id) uuid ✓
CREATE TABLE IF NOT EXISTS submission_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_threads_submission_id
  ON submission_threads(submission_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at
  ON submission_threads(created_at DESC);

-- 5. RLS on submission_threads
ALTER TABLE submission_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threads_select_all" ON submission_threads;
CREATE POLICY "threads_select_all" ON submission_threads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "threads_insert_all" ON submission_threads;
CREATE POLICY "threads_insert_all" ON submission_threads
  FOR INSERT WITH CHECK (true);

-- Permissions
GRANT ALL ON submission_threads TO anon;
GRANT ALL ON submission_threads TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these after migration to confirm success:
--
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'programs' AND column_name = 'program_type';
--
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'submissions' AND column_name = 'network_issue_status';
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'submission_threads';
-- ============================================================
