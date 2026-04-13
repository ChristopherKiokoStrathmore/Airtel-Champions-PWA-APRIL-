-- ============================================================================
-- VAN CALENDAR: CHANGE FROM MULTI-SELECT TO 4 DROPDOWNS PER DAY
-- ============================================================================
-- This changes each day from 1 multi_select field to 4 separate dropdown fields
-- so ZSMs can specify the order of site visits (Site 1, Site 2, Site 3, Site 4)

-- Step 1: Delete existing multi_select fields for all days
DELETE FROM program_fields 
WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
AND field_name IN (
  'monday_sites',
  'tuesday_sites', 
  'wednesday_sites',
  'thursday_sites',
  'friday_sites',
  'saturday_sites'
);

-- Step 2: Add 4 dropdown fields for each day (24 total fields)
-- Each dropdown allows selecting 1 site from the sitewise table

-- MONDAY (4 fields)
INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, order_index)
VALUES
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'monday_site_1', 'Monday - Site 1', 'dropdown', false,
   'Select first site for Monday',
   'Choose the first site the van will visit on Monday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   3),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'monday_site_2', 'Monday - Site 2', 'dropdown', false,
   'Select second site for Monday',
   'Choose the second site the van will visit on Monday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   4),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'monday_site_3', 'Monday - Site 3', 'dropdown', false,
   'Select third site for Monday',
   'Choose the third site the van will visit on Monday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   5),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'monday_site_4', 'Monday - Site 4', 'dropdown', false,
   'Select fourth site for Monday',
   'Choose the fourth site the van will visit on Monday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   6),

-- TUESDAY (4 fields)
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'tuesday_site_1', 'Tuesday - Site 1', 'dropdown', false,
   'Select first site for Tuesday',
   'Choose the first site the van will visit on Tuesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   7),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'tuesday_site_2', 'Tuesday - Site 2', 'dropdown', false,
   'Select second site for Tuesday',
   'Choose the second site the van will visit on Tuesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   8),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'tuesday_site_3', 'Tuesday - Site 3', 'dropdown', false,
   'Select third site for Tuesday',
   'Choose the third site the van will visit on Tuesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   9),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'tuesday_site_4', 'Tuesday - Site 4', 'dropdown', false,
   'Select fourth site for Tuesday',
   'Choose the fourth site the van will visit on Tuesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   10),

-- WEDNESDAY (4 fields)
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'wednesday_site_1', 'Wednesday - Site 1', 'dropdown', false,
   'Select first site for Wednesday',
   'Choose the first site the van will visit on Wednesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   11),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'wednesday_site_2', 'Wednesday - Site 2', 'dropdown', false,
   'Select second site for Wednesday',
   'Choose the second site the van will visit on Wednesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   12),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'wednesday_site_3', 'Wednesday - Site 3', 'dropdown', false,
   'Select third site for Wednesday',
   'Choose the third site the van will visit on Wednesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   13),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'wednesday_site_4', 'Wednesday - Site 4', 'dropdown', false,
   'Select fourth site for Wednesday',
   'Choose the fourth site the van will visit on Wednesday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   14),

-- THURSDAY (4 fields)
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'thursday_site_1', 'Thursday - Site 1', 'dropdown', false,
   'Select first site for Thursday',
   'Choose the first site the van will visit on Thursday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   15),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'thursday_site_2', 'Thursday - Site 2', 'dropdown', false,
   'Select second site for Thursday',
   'Choose the second site the van will visit on Thursday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   16),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'thursday_site_3', 'Thursday - Site 3', 'dropdown', false,
   'Select third site for Thursday',
   'Choose the third site the van will visit on Thursday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   17),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'thursday_site_4', 'Thursday - Site 4', 'dropdown', false,
   'Select fourth site for Thursday',
   'Choose the fourth site the van will visit on Thursday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   18),

-- FRIDAY (4 fields)
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'friday_site_1', 'Friday - Site 1', 'dropdown', false,
   'Select first site for Friday',
   'Choose the first site the van will visit on Friday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   19),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'friday_site_2', 'Friday - Site 2', 'dropdown', false,
   'Select second site for Friday',
   'Choose the second site the van will visit on Friday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   20),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'friday_site_3', 'Friday - Site 3', 'dropdown', false,
   'Select third site for Friday',
   'Choose the third site the van will visit on Friday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   21),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'friday_site_4', 'Friday - Site 4', 'dropdown', false,
   'Select fourth site for Friday',
   'Choose the fourth site the van will visit on Friday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   22),

-- SATURDAY (4 fields)
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'saturday_site_1', 'Saturday - Site 1', 'dropdown', false,
   'Select first site for Saturday',
   'Choose the first site the van will visit on Saturday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   23),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'saturday_site_2', 'Saturday - Site 2', 'dropdown', false,
   'Select second site for Saturday',
   'Choose the second site the van will visit on Saturday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   24),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'saturday_site_3', 'Saturday - Site 3', 'dropdown', false,
   'Select third site for Saturday',
   'Choose the third site the van will visit on Saturday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   25),
  
  ('848582a6-29a9-4992-ae11-1f8397f198d9', 'saturday_site_4', 'Saturday - Site 4', 'dropdown', false,
   'Select fourth site for Saturday',
   'Choose the fourth site the van will visit on Saturday.',
   '{"database_source": {"table": "sitewise", "display_field": "SITE", "metadata_fields": ["SITE ID", "ZONE"]}}',
   26);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all 26 fields exist (2 base fields + 24 site fields)
-- SELECT COUNT(*) as total_fields 
-- FROM program_fields 
-- WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9';
-- Expected: 26 (van_selection, week_start_date, plus 4 sites × 6 days)

-- View all fields in order
-- SELECT field_name, field_label, field_type, order_index 
-- FROM program_fields 
-- WHERE program_id = '848582a6-29a9-4992-ae11-1f8397f198d9'
-- ORDER BY order_index;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Benefits of 4 separate dropdowns per day:
-- 1. ✅ Specifies ORDER of site visits (Site 1 → Site 2 → Site 3 → Site 4)
-- 2. ✅ Clear route planning for drivers
-- 3. ✅ Easy to see daily capacity (max 4 sites per day)
-- 4. ✅ Optional fields - ZSM can fill 1, 2, 3, or all 4 sites
-- 5. ✅ Better for route optimization and scheduling
-- 
-- The form will now show:
-- - Van Selection (dropdown)
-- - Week Starting (date)
-- - Monday - Site 1 (dropdown)
-- - Monday - Site 2 (dropdown)
-- - Monday - Site 3 (dropdown)
-- - Monday - Site 4 (dropdown)
-- - Tuesday - Site 1 (dropdown)
-- - ... and so on for all days
-- 
-- ============================================================================
