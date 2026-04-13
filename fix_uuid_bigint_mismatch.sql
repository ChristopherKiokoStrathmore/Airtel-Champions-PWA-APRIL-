-- Fix for UUID vs Bigint mismatch in auto-allocation
-- The jobs table uses UUID but allocate_installer expects bigint

-- Option 1: Add a bigint sequence column to jobs table (RECOMMENDED)
-- This keeps UUID for FK relationships while providing bigint for allocation

-- Add a new bigint column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sr_number BIGINT;

-- Create sequence for sr_number if not exists
CREATE SEQUENCE IF NOT EXISTS jobs_sr_number_seq START 10001;

-- Create trigger to auto-populate sr_number on insert
CREATE OR REPLACE FUNCTION populate_jobs_sr_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sr_number IS NULL THEN
    NEW.sr_number := nextval('jobs_sr_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_populate_sr_number ON jobs;
CREATE TRIGGER trigger_populate_sr_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION populate_jobs_sr_number();

-- Update existing jobs that don't have sr_number
UPDATE jobs SET sr_number = nextval('jobs_sr_number_seq') WHERE sr_number IS NULL;

-- Option 2: Modify the allocate_installer function to accept UUID
-- (Alternative approach if you prefer to change the function)

-- First, let's check the current function signature
-- The function expects bigint for p_sr_id

-- Create a wrapper function that accepts UUID and looks up the bigint
CREATE OR REPLACE FUNCTION allocate_installer_uuid(
  p_job_id UUID,
  p_rejected_by INTEGER[] DEFAULT '{}'
) RETURNS TABLE (
  installer_id INTEGER,
  job_id BIGINT,
  allocation_tier TEXT
) AS $$
DECLARE
  v_sr_number BIGINT;
BEGIN
  -- Look up the sr_number (bigint) from the jobs table
  SELECT j.sr_number INTO v_sr_number
  FROM jobs j
  WHERE j.id = p_job_id;
  
  IF v_sr_number IS NULL THEN
    RAISE EXCEPTION 'Job not found or missing sr_number for id: %', p_job_id;
  END IF;
  
  -- Call the original function with the bigint
  RETURN QUERY SELECT * FROM allocate_installer(v_sr_number, p_rejected_by);
END;
$$ LANGUAGE plpgsql;

-- Note: You'll need to update your auto-allocate Edge Function to use 
-- allocate_installer_uuid instead of allocate_installer, OR modify the 
-- Edge Function to pass sr_number instead of id

-- Verify the changes:
-- SELECT * FROM jobs LIMIT 5;
-- Should show both id (UUID) and sr_number (bigint)
