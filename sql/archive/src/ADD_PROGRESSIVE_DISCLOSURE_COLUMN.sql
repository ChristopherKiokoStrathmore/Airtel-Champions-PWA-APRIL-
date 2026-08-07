-- ============================================================================
-- ADD PROGRESSIVE DISCLOSURE TOGGLE TO PROGRAMS TABLE
-- ============================================================================
-- Purpose: Add a toggle for HQ to enable/disable progressive disclosure UI
--          for multi-field patterns (like Van Calendar's 4 sites per day)
--
-- Default: FALSE (disabled by default to maintain backward compatibility)
--          HQ can enable it for specific programs that benefit from progressive UI
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add progressive_disclosure_enabled column (defaults to FALSE for backward compatibility)
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS progressive_disclosure_enabled BOOLEAN DEFAULT FALSE;

-- Update comment for documentation
COMMENT ON COLUMN programs.progressive_disclosure_enabled IS 
  'When TRUE, multi-field patterns (e.g., Van Calendar sites) use progressive disclosure UI - showing 1 field with "+ Add Another" buttons. When FALSE, all fields shown at once. Default: FALSE for backward compatibility.';

-- ✅ OPTIONAL: Enable progressive disclosure for Van Calendar program if it exists
-- Uncomment the line below to auto-enable it for Van Calendar:
-- UPDATE programs SET progressive_disclosure_enabled = TRUE WHERE title = '🚐 Van Weekly Calendar';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'programs' 
  AND column_name = 'progressive_disclosure_enabled';

-- View all programs with their progressive disclosure setting
SELECT 
  id,
  title,
  progressive_disclosure_enabled,
  gps_auto_detect_enabled,
  points_enabled
FROM programs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS! 
-- ============================================================================
-- ✅ Column added: progressive_disclosure_enabled
-- ✅ Default value: FALSE (backward compatible)
-- ✅ Can be toggled per program in HQ Program Creator settings
-- 
-- Next Steps:
-- 1. Refresh your browser
-- 2. Edit Van Calendar program → Settings tab
-- 3. Enable "Progressive Disclosure UI" toggle
-- 4. Save program
-- 5. Test submission: You'll see 1 site per day with "+ Add Another Site" button
-- ============================================================================
