-- ============================================================================
-- ADD ZONE FILTERING TOGGLE TO PROGRAMS TABLE
-- ============================================================================
-- Purpose: Add a toggle for HQ to lock database dropdowns to only show
--          items within the user's zone (e.g., only show NAIROBI sites
--          to users in NAIROBI zone)
--
-- Default: FALSE (disabled by default - show all zones)
--          HQ can enable it for zone-specific programs like Van Calendar
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add zone_filtering_enabled column (defaults to FALSE)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS zone_filtering_enabled BOOLEAN DEFAULT FALSE;

-- Update comment for documentation
COMMENT ON COLUMN programs.zone_filtering_enabled IS 
  'When TRUE, database dropdowns filter items by user zone (e.g., only show NAIROBI sites to NAIROBI users). When FALSE, show all items across all zones. Default: FALSE.';

-- ✅ OPTIONAL: Enable zone filtering for Van Calendar program if it exists
-- Uncomment the line below to auto-enable it for Van Calendar:
-- UPDATE programs SET zone_filtering_enabled = TRUE WHERE title LIKE '%Van%Calendar%';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'programs' 
  AND column_name = 'zone_filtering_enabled';

-- View all programs with their zone filtering setting
SELECT 
  id,
  title,
  zone_filtering_enabled,
  progressive_disclosure_enabled,
  gps_auto_detect_enabled,
  points_enabled
FROM programs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- VERIFY ZONE DATA EXISTS
-- ============================================================================

-- Check if users have zones assigned
SELECT zone, COUNT(*) as user_count
FROM app_users
WHERE zone IS NOT NULL
GROUP BY zone
ORDER BY user_count DESC;

-- Check if sitewise table has zone column
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'sitewise' 
  AND column_name = 'zone';

-- If sitewise has zones, show distribution:
SELECT zone, COUNT(*) as site_count
FROM sitewise
WHERE zone IS NOT NULL
GROUP BY zone
ORDER BY site_count DESC;

-- ============================================================================
-- EXAMPLE: How Zone Filtering Works
-- ============================================================================

-- Without zone filtering (zone_filtering_enabled = FALSE):
-- User in NAIROBI zone submitting Van Calendar
-- SQL query: SELECT * FROM sitewise ORDER BY site_name
-- Result: Shows ALL sites (NAIROBI, MOMBASA, COAST, WESTERN, etc.)

-- With zone filtering (zone_filtering_enabled = TRUE):
-- User in NAIROBI zone submitting Van Calendar
-- SQL query: SELECT * FROM sitewise WHERE zone = 'NAIROBI' ORDER BY site_name
-- Result: Shows ONLY NAIROBI sites

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- 1. This feature assumes the following database structure:
--    - app_users table has a 'zone' column (e.g., 'NAIROBI', 'MOMBASA')
--    - Source tables (sitewise, van_db, etc.) have a 'zone' column
--
-- 2. If your tables use different column names (e.g., 'region' instead of 'zone'),
--    you'll need to update the frontend code in program-submit-modal.tsx
--    to use the correct column name.
--
-- 3. Zone filtering applies to ALL database dropdowns in the program,
--    not just site fields. This includes van selection, shop selection, etc.
--
-- 4. If a user has no zone assigned (zone = NULL), they will see:
--    - With filtering ON: NO items (empty dropdown)
--    - With filtering OFF: ALL items (normal behavior)

-- ============================================================================
-- SUCCESS! 
-- ============================================================================
-- ✅ Column added: zone_filtering_enabled
-- ✅ Default value: FALSE (backward compatible)
-- ✅ Can be toggled per program in HQ Program Creator settings
-- 
-- Next Steps:
-- 1. Verify app_users have zones assigned
-- 2. Verify sitewise table has zone column
-- 3. Refresh your browser
-- 4. Edit Van Calendar program → Settings tab
-- 5. Enable "🔒 Lock Dropdowns to User's Zone" toggle
-- 6. Save program
-- 7. Test submission: Users should only see sites from their zone
-- ============================================================================
