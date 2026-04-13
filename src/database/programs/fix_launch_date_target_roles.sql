-- =====================================================
-- FIX LAUNCH DATE PROGRAM TARGET ROLES
-- =====================================================

-- Check current target_roles
SELECT 
  id,
  title,
  target_roles,
  status
FROM programs 
WHERE title = 'Launch Date';

-- Update Launch Date program to target all roles
UPDATE programs
SET target_roles = ARRAY['sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_command_center', 'director']::text[]
WHERE title = 'Launch Date';

-- Verify the update
SELECT 
  id,
  title,
  target_roles,
  status,
  category
FROM programs 
WHERE title = 'Launch Date';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ LAUNCH DATE TARGET ROLES UPDATED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'The Launch Date program now targets:';
  RAISE NOTICE '  - Sales Executives';
  RAISE NOTICE '  - Zonal Sales Managers';
  RAISE NOTICE '  - Zonal Business Managers';
  RAISE NOTICE '  - HQ Command Center';
  RAISE NOTICE '  - Directors';
  RAISE NOTICE '============================================';
END $$;
