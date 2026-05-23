-- ============================================================================
-- Add "who_can_submit" column to programs table
-- ============================================================================
-- This allows program creators to control WHO CAN SUBMIT the form,
-- separate from WHO CAN SEE the program (target_roles)
--
-- USAGE:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run"
-- ============================================================================

-- Add who_can_submit column (array of role strings)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS who_can_submit TEXT[] DEFAULT ARRAY['sales_executive']::TEXT[];

-- Update existing programs to allow all roles to submit by default
-- (maintains backward compatibility - everyone who can see it can submit it)
UPDATE programs 
SET who_can_submit = target_roles 
WHERE who_can_submit IS NULL OR who_can_submit = '{}';

-- For your CHECK IN and CHECK OUT programs, enable both SEs and ZSMs to submit
UPDATE programs
SET who_can_submit = ARRAY['sales_executive', 'zonal_sales_manager']::TEXT[]
WHERE title ILIKE '%CHECK%IN%' OR title ILIKE '%CHECK%OUT%';

-- Add comment for documentation
COMMENT ON COLUMN programs.who_can_submit IS 'Array of user roles that can submit this program (e.g., sales_executive, zonal_sales_manager, zonal_business_manager)';

-- ============================================================================
-- ✅ DONE! Programs now support separate submission permissions
-- ============================================================================
-- 
-- NEXT STEPS:
-- 1. Existing programs will now allow target audience members to submit
-- 2. CHECK IN and CHECK OUT programs are configured for both SEs and ZSMs
-- 3. When creating new programs, set "Who Can Submit" in the program creator
-- ============================================================================
