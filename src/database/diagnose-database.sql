-- ============================================
-- TAI APP - DATABASE DIAGNOSTIC
-- ============================================
-- Run this to check if tables exist
-- ============================================

-- Check if programs table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'programs'
    ) THEN '✅ programs table EXISTS'
    ELSE '❌ programs table MISSING'
  END as programs_status;

-- Check if program_fields table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'program_fields'
    ) THEN '✅ program_fields table EXISTS'
    ELSE '❌ program_fields table MISSING'
  END as fields_status;

-- Check if submissions table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'submissions'
    ) THEN '✅ submissions table EXISTS'
    ELSE '❌ submissions table MISSING'
  END as submissions_status;

-- Count records in each table (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs') THEN
    RAISE NOTICE 'Programs count: %', (SELECT COUNT(*) FROM programs);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_fields') THEN
    RAISE NOTICE 'Program fields count: %', (SELECT COUNT(*) FROM program_fields);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submissions') THEN
    RAISE NOTICE 'Submissions count: %', (SELECT COUNT(*) FROM submissions);
  END IF;
END $$;

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
