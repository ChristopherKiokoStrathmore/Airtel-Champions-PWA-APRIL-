-- Find Van Weekly Calendar submissions in the database

-- STEP 1: Verify the program exists and get its ID
SELECT id, title, created_at, is_active
FROM programs
WHERE id = '848582a6-29a9-4992-ae11-1f8397f198d9';

-- STEP 2: Check the program_submissions table for Van Calendar submissions
SELECT 
  id,
  program_id,
  user_id,
  field_data,
  points_awarded,
  status,
  created_at,
  updated_at
FROM program_submissions
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: See what the field_data JSONB structure looks like
-- This shows you the actual submitted data format
SELECT 
  id,
  field_data->>'van_number' as van_number,
  field_data->>'week_starting' as week_starting,
  field_data->>'monday_sites' as monday_sites,
  field_data->>'tuesday_sites' as tuesday_sites,
  field_data->>'wednesday_sites' as wednesday_sites,
  field_data->>'thursday_sites' as thursday_sites,
  field_data->>'friday_sites' as friday_sites,
  field_data->>'saturday_sites' as saturday_sites,
  created_at
FROM program_submissions
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
ORDER BY created_at DESC
LIMIT 5;

-- STEP 4: Count total submissions
SELECT COUNT(*) as total_van_calendar_submissions
FROM program_submissions
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9';

-- STEP 5: See which users have submitted
SELECT 
  u.full_name,
  u.phone_number,
  COUNT(ps.id) as submission_count,
  MAX(ps.created_at) as latest_submission
FROM program_submissions ps
JOIN users u ON ps.user_id = u.id
WHERE ps.program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
GROUP BY u.id, u.full_name, u.phone_number
ORDER BY submission_count DESC;

-- BONUS: Check the database tables structure
-- If you want to see what columns exist in program_submissions:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'program_submissions'
ORDER BY ordinal_position;
