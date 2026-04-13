-- ============================================================================
-- ADD ID COLUMN TO VAN_DB TABLE
-- ============================================================================
-- This migration adds an auto-incrementing ID column to van_db
-- Run this in your Supabase SQL Editor

-- Step 1: Add ID column (SERIAL for auto-increment)
ALTER TABLE van_db 
ADD COLUMN IF NOT EXISTS id SERIAL;

-- Step 2: Make number_plate unique but not primary key
-- (We'll keep number_plate as the unique identifier for backwards compatibility)
ALTER TABLE van_db 
DROP CONSTRAINT IF EXISTS van_db_pkey;

-- Step 3: Add UNIQUE constraint to number_plate
ALTER TABLE van_db
ADD CONSTRAINT van_db_number_plate_unique UNIQUE (number_plate);

-- Step 4: Set ID as the new primary key
ALTER TABLE van_db
ADD PRIMARY KEY (id);

-- Step 5: Verify the changes
SELECT 
  'van_db schema updated' AS status,
  COUNT(*) AS total_vans,
  MIN(id) AS min_id,
  MAX(id) AS max_id
FROM van_db;

-- Step 6: View updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'van_db'
ORDER BY ordinal_position;

-- ============================================================================
-- COMPLETE! 🎉
-- ============================================================================
-- The van_db table now has an auto-incrementing ID column
-- - id: SERIAL PRIMARY KEY (auto-generated)
-- - number_plate: TEXT UNIQUE (still unique, but not PK)
-- All existing data is preserved with new IDs assigned
