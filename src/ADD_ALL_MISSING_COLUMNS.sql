-- ============================================================================
-- ADD ALL MISSING COLUMNS TO PROGRAMS TABLE
-- ============================================================================
-- This migration adds:
-- 1. progressive_disclosure_enabled - Toggle for clean progressive UI
-- 2. zone_filtering_enabled - Toggle for zone-based dropdown filtering
--
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Run this in Supabase SQL Editor NOW to fix the error
-- ============================================================================

-- 1️⃣ Add progressive_disclosure_enabled column
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS progressive_disclosure_enabled BOOLEAN DEFAULT FALSE;

-- 2️⃣ Add zone_filtering_enabled column
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS zone_filtering_enabled BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN programs.progressive_disclosure_enabled IS 
  'When TRUE, multi-field patterns (like Van Calendar sites) show 1 field initially with "+ Add Another" buttons. When FALSE, all fields visible at once. Default: FALSE.';

COMMENT ON COLUMN programs.zone_filtering_enabled IS 
  'When TRUE, database dropdowns filter items by user zone (e.g., only show NAIROBI sites to NAIROBI users). When FALSE, show all items across all zones. Default: FALSE.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check both columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'programs' 
  AND column_name IN ('progressive_disclosure_enabled', 'zone_filtering_enabled');

-- Expected output: 2 rows showing both columns

-- View all programs with their new settings
SELECT 
  id,
  title,
  progressive_disclosure_enabled,
  zone_filtering_enabled,
  gps_auto_detect_enabled,
  points_enabled,
  created_at
FROM programs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS! 
-- ============================================================================
-- ✅ Columns added: progressive_disclosure_enabled, zone_filtering_enabled
-- ✅ Default values: FALSE (backward compatible)
-- ✅ Safe to run multiple times
-- 
-- Next Steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Refresh your browser (Ctrl+Shift+R to clear cache)
-- 3. Edit Van Calendar program → Settings tab
-- 4. You'll now see both toggles working!
-- ============================================================================
