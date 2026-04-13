-- =====================================================
-- VERIFY PROGRAMS SETUP IS COMPLETE
-- =====================================================

-- 1. Check if Launch Date program exists with category
SELECT 
  title,
  category,
  status,
  points_value,
  target_roles,
  created_at
FROM programs 
WHERE title = 'Launch Date';

-- 2. Check all fields for Launch Date program
SELECT 
  pf.order_index,
  pf.field_name,
  pf.field_type,
  pf.is_required,
  CASE 
    WHEN pf.field_type = 'dropdown' THEN 
      jsonb_array_length(pf.options->'options')
    ELSE NULL
  END as num_options
FROM program_fields pf
JOIN programs p ON pf.program_id = p.id
WHERE p.title = 'Launch Date'
ORDER BY pf.order_index;

-- 3. Verify Site ID field has all 1,489 site IDs
SELECT 
  pf.field_name,
  jsonb_array_length(pf.options->'options') as total_site_ids
FROM program_fields pf
JOIN programs p ON pf.program_id = p.id
WHERE p.title = 'Launch Date' 
  AND pf.field_name = 'Site ID';

-- 4. Check RLS policies on programs table
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'programs'
ORDER BY policyname;

-- 5. Check RLS policies on program_fields table
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'program_fields'
ORDER BY policyname;

-- 6. Check RLS policies on program_submissions table
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'program_submissions'
ORDER BY policyname;

-- 7. Sample a few Site IDs from the dropdown
SELECT 
  jsonb_array_elements_text(pf.options->'options') as site_id
FROM program_fields pf
JOIN programs p ON pf.program_id = p.id
WHERE p.title = 'Launch Date' 
  AND pf.field_name = 'Site ID'
LIMIT 10;

-- 8. Check if category column exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'programs'
  AND column_name = 'category';

-- 9. Count programs by category
SELECT 
  category,
  COUNT(*) as program_count,
  array_agg(title) as programs
FROM programs
GROUP BY category;

-- 10. Check if there are any test submissions
SELECT 
  COUNT(*) as total_submissions,
  COUNT(DISTINCT program_id) as programs_with_submissions,
  COUNT(DISTINCT user_id) as unique_submitters
FROM program_submissions;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ PROGRAMS SETUP VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Check the results above to ensure:';
  RAISE NOTICE '1. Launch Date program exists';
  RAISE NOTICE '2. Has category = Network Experience';
  RAISE NOTICE '3. Has 10 fields configured';
  RAISE NOTICE '4. Site ID field has 1,489 options';
  RAISE NOTICE '5. RLS policies are in place';
  RAISE NOTICE '============================================';
END $$;
