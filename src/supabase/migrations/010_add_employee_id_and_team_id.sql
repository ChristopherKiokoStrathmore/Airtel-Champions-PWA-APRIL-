-- Migration 010: Add employee_id and team_id columns to users table
-- Sales Intelligence Network - Airtel Kenya
-- This migration is IDEMPOTENT - safe to run multiple times

-- ============================================================================
-- Add employee_id column (for Airtel employee identification)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) UNIQUE;
    RAISE NOTICE 'Added employee_id column to users table';
  ELSE
    RAISE NOTICE 'Column employee_id already exists, skipping';
  END IF;
END $$;

-- ============================================================================
-- Add team_id column (foreign key to teams table)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE users ADD COLUMN team_id UUID;
    RAISE NOTICE 'Added team_id column to users table';
  ELSE
    RAISE NOTICE 'Column team_id already exists, skipping';
  END IF;
END $$;

-- ============================================================================
-- Create indexes for fast lookups
-- ============================================================================

-- Index for employee_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_employee_id'
  ) THEN
    CREATE INDEX idx_users_employee_id ON users(employee_id);
    RAISE NOTICE 'Created index idx_users_employee_id';
  ELSE
    RAISE NOTICE 'Index idx_users_employee_id already exists, skipping';
  END IF;
END $$;

-- Index for team_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_team_id'
  ) THEN
    CREATE INDEX idx_users_team_id ON users(team_id);
    RAISE NOTICE 'Created index idx_users_team_id';
  ELSE
    RAISE NOTICE 'Index idx_users_team_id already exists, skipping';
  END IF;
END $$;

-- ============================================================================
-- Update existing users with sequential employee IDs (for testing)
-- In production, these would be real Airtel employee IDs
-- ============================================================================
DO $$
DECLARE
  user_record RECORD;
  counter INTEGER := 1000;
  updated_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id FROM users WHERE employee_id IS NULL AND role = 'se'
  LOOP
    UPDATE users 
    SET employee_id = 'SE' || LPAD(counter::text, 4, '0')
    WHERE id = user_record.id;
    counter := counter + 1;
    updated_count := updated_count + 1;
  END LOOP;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Generated employee IDs for % users (SE1000, SE1001, etc.)', updated_count;
  ELSE
    RAISE NOTICE 'All Sales Executives already have employee IDs';
  END IF;
END $$;

-- ============================================================================
-- Add foreign key constraint (only if teams table exists)
-- ============================================================================
DO $$
BEGIN
  -- First check if teams table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'teams'
  ) THEN
    -- Then check if constraint doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_users_team_id' 
        AND table_name = 'users'
    ) THEN
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_team_id 
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
      RAISE NOTICE 'Added foreign key constraint fk_users_team_id';
    ELSE
      RAISE NOTICE 'Foreign key constraint fk_users_team_id already exists, skipping';
    END IF;
  ELSE
    RAISE NOTICE 'Teams table does not exist, skipping foreign key constraint';
    RAISE NOTICE 'Run the initial schema migration first: 001_initial_schema_FIXED.sql';
  END IF;
END $$;

-- ============================================================================
-- Verification and summary
-- ============================================================================
DO $$
DECLARE
  employee_id_exists BOOLEAN;
  team_id_exists BOOLEAN;
  employee_id_index_exists BOOLEAN;
  team_id_index_exists BOOLEAN;
  fk_constraint_exists BOOLEAN;
  user_count INTEGER;
  se_count INTEGER;
  se_with_employee_id INTEGER;
BEGIN
  -- Check columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'employee_id'
  ) INTO employee_id_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) INTO team_id_exists;
  
  -- Check indexes
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_employee_id'
  ) INTO employee_id_index_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_team_id'
  ) INTO team_id_index_exists;
  
  -- Check foreign key constraint
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_users_team_id' AND table_name = 'users'
  ) INTO fk_constraint_exists;
  
  -- Count users
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO se_count FROM users WHERE role = 'se';
  SELECT COUNT(*) INTO se_with_employee_id FROM users WHERE role = 'se' AND employee_id IS NOT NULL;
  
  -- Print verification report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 010 VERIFICATION REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'COLUMNS:';
  IF employee_id_exists THEN
    RAISE NOTICE '  ✅ employee_id column exists';
  ELSE
    RAISE NOTICE '  ❌ employee_id column MISSING';
  END IF;
  
  IF team_id_exists THEN
    RAISE NOTICE '  ✅ team_id column exists';
  ELSE
    RAISE NOTICE '  ❌ team_id column MISSING';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'INDEXES:';
  IF employee_id_index_exists THEN
    RAISE NOTICE '  ✅ idx_users_employee_id exists';
  ELSE
    RAISE NOTICE '  ❌ idx_users_employee_id MISSING';
  END IF;
  
  IF team_id_index_exists THEN
    RAISE NOTICE '  ✅ idx_users_team_id exists';
  ELSE
    RAISE NOTICE '  ❌ idx_users_team_id MISSING';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'CONSTRAINTS:';
  IF fk_constraint_exists THEN
    RAISE NOTICE '  ✅ fk_users_team_id foreign key exists';
  ELSE
    RAISE NOTICE '  ⚠️  fk_users_team_id foreign key not created (teams table may not exist)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'DATA:';
  RAISE NOTICE '  Total users: %', user_count;
  RAISE NOTICE '  Sales Executives: %', se_count;
  RAISE NOTICE '  SEs with employee IDs: %', se_with_employee_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF employee_id_exists AND team_id_exists AND employee_id_index_exists AND team_id_index_exists THEN
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL';
  ELSE
    RAISE NOTICE '⚠️  MIGRATION INCOMPLETE - CHECK ERRORS ABOVE';
  END IF;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Comment on columns (for documentation)
COMMENT ON COLUMN users.employee_id IS 'Airtel Kenya employee identification number (e.g., SE1000, AIR-2024-001234)';
COMMENT ON COLUMN users.team_id IS 'Foreign key reference to teams table - links user to their assigned team';
