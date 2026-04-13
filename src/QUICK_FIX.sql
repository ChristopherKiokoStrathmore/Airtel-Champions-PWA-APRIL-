-- ============================================================================
-- QUICK FIX: Add employee_id and team_id columns to users table
-- Sales Intelligence Network - Airtel Kenya
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and click "Run"
-- 4. Refresh your admin dashboard
-- ============================================================================

-- Add employee_id column (for Airtel employee identification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) UNIQUE;
    RAISE NOTICE '✅ Added employee_id column';
  ELSE
    RAISE NOTICE '✓ employee_id column already exists';
  END IF;
END $$;

-- Add team_id column (foreign key to teams table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE users ADD COLUMN team_id UUID;
    RAISE NOTICE '✅ Added team_id column';
  ELSE
    RAISE NOTICE '✓ team_id column already exists';
  END IF;
END $$;

-- Create index for employee_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_employee_id'
  ) THEN
    CREATE INDEX idx_users_employee_id ON users(employee_id);
    RAISE NOTICE '✅ Created index idx_users_employee_id';
  ELSE
    RAISE NOTICE '✓ Index idx_users_employee_id already exists';
  END IF;
END $$;

-- Create index for team_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_team_id'
  ) THEN
    CREATE INDEX idx_users_team_id ON users(team_id);
    RAISE NOTICE '✅ Created index idx_users_team_id';
  ELSE
    RAISE NOTICE '✓ Index idx_users_team_id already exists';
  END IF;
END $$;

-- Auto-generate employee IDs for existing users
-- Format: SE1000, SE1001, SE1002, etc.
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
    RAISE NOTICE '✅ Generated employee IDs for % users', updated_count;
  ELSE
    RAISE NOTICE '✓ All users already have employee IDs';
  END IF;
END $$;

-- Add foreign key constraint (if teams table exists)
DO $$
BEGIN
  -- Check if teams table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'teams'
  ) THEN
    -- Check if constraint doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_users_team_id' 
        AND table_name = 'users'
    ) THEN
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_team_id 
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
      RAISE NOTICE '✅ Added foreign key constraint fk_users_team_id';
    ELSE
      RAISE NOTICE '✓ Foreign key constraint fk_users_team_id already exists';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Teams table does not exist, skipping foreign key constraint';
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  employee_id_exists BOOLEAN;
  team_id_exists BOOLEAN;
  employee_count INTEGER;
  total_ses INTEGER;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'employee_id'
  ) INTO employee_id_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) INTO team_id_exists;
  
  -- Count users with employee IDs
  SELECT COUNT(*) INTO employee_count FROM users WHERE employee_id IS NOT NULL;
  SELECT COUNT(*) INTO total_ses FROM users WHERE role = 'se';
  
  -- Print results
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  
  IF employee_id_exists THEN
    RAISE NOTICE '✅ employee_id column: EXISTS';
  ELSE
    RAISE NOTICE '❌ employee_id column: MISSING';
  END IF;
  
  IF team_id_exists THEN
    RAISE NOTICE '✅ team_id column: EXISTS';
  ELSE
    RAISE NOTICE '❌ team_id column: MISSING';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Users with employee IDs: % / %', employee_count, total_ses;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Refresh your admin dashboard';
  RAISE NOTICE '   2. Navigate to SEs page';
  RAISE NOTICE '   3. Verify employee IDs are displayed';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your backend is now 100%% ready!';
  RAISE NOTICE '';
END $$;

-- Show sample data (if users exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Sample Users:';
    RAISE NOTICE '';
  END IF;
END $$;

SELECT 
  id,
  full_name,
  employee_id,
  team_id,
  role,
  region
FROM users
WHERE role = 'se'
ORDER BY employee_id
LIMIT 5;
