-- ============================================================================
-- ADD GPS AUTO-DETECT TOGGLE TO PROGRAMS TABLE
-- ============================================================================
-- This adds a boolean column that controls whether the GPS auto-detect
-- button appears in the program submission modal

ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS gps_auto_detect_enabled BOOLEAN DEFAULT true;

-- Update existing programs to default to GPS enabled
UPDATE programs 
SET gps_auto_detect_enabled = true 
WHERE gps_auto_detect_enabled IS NULL;

-- Optionally disable GPS for Van Calendar (since it's planning, not field work)
UPDATE programs 
SET gps_auto_detect_enabled = false 
WHERE id = '848582a6-29a9-4992-ae11-1f8397f198d9';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT title, gps_auto_detect_enabled 
-- FROM programs 
-- ORDER BY created_at DESC;
