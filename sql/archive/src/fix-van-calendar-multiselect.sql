-- First, let's find the Van Weekly Calendar program
-- Run this FIRST to see what columns exist and find the program ID:

SELECT id, title, created_at 
FROM programs 
WHERE title ILIKE '%van%' OR title ILIKE '%calendar%'
LIMIT 10;

-- Once you see the program, note its ID, then run ONE of these options:

-- OPTION 1: If the program ID is shown in the results above, use it directly
-- Replace 'YOUR-PROGRAM-ID-HERE' with the actual ID
/*
UPDATE program_fields
SET options = jsonb_set(
  options::jsonb,
  '{database_source,multi_select}',
  'true'::jsonb
)
WHERE program_id = 'YOUR-PROGRAM-ID-HERE'
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');
*/

-- OPTION 2: Use title column (if that's the correct column name)
/*
UPDATE program_fields
SET options = jsonb_set(
  options::jsonb,
  '{database_source,multi_select}',
  'true'::jsonb
)
WHERE program_id = (SELECT id FROM programs WHERE title = '🚐 Van Weekly Calendar')
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');
*/

-- OPTION 3: Use the program_id directly (from your logs it was: 848582a6-29a9-4992-ae11-1f8397f198d9)
-- This is the FASTEST and SAFEST option:
UPDATE program_fields
SET options = jsonb_set(
  options::jsonb,
  '{database_source,multi_select}',
  'true'::jsonb
)
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');

-- Verify the update worked:
SELECT field_name, field_label, options->'database_source'->>'multi_select' as multi_select_enabled
FROM program_fields
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
AND field_name IN ('monday_sites', 'tuesday_sites', 'wednesday_sites', 'thursday_sites', 'friday_sites', 'saturday_sites');
