-- ============================================================================
-- VAN CALENDAR AS A PROGRAM - DATABASE MIGRATION
-- ============================================================================
-- This migration adds a points_enabled toggle to programs table and creates
-- the Van Calendar program with points disabled

-- Step 1: Add points_enabled column to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS points_enabled BOOLEAN DEFAULT true;

-- Step 2: Create Van Weekly Calendar as a proper program
INSERT INTO programs (
  id,
  title,
  description,
  icon,
  color,
  points_value,
  points_enabled,
  target_roles,
  who_can_submit,
  category,
  status,
  created_at
) VALUES (
  'VAN_CALENDAR_SYSTEM',  -- Fixed ID for easy reference
  '🚐 Van Weekly Calendar',
  'Submit weekly route plans for all vans in your zone. Plan Monday through Saturday routes with shop names and locations. This is for ZSM planning only - no points awarded.',
  '🚐',
  '#3B82F6',  -- Blue color
  0,  -- 0 points (won't be awarded anyway)
  false,  -- Points disabled
  ARRAY['zonal_sales_manager', 'hq_command_center', 'director']::TEXT[],  -- Who can see it
  ARRAY['zonal_sales_manager']::TEXT[],  -- Only ZSMs can submit
  'Operations',
  'active',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  points_enabled = EXCLUDED.points_enabled,
  target_roles = EXCLUDED.target_roles,
  who_can_submit = EXCLUDED.who_can_submit,
  updated_at = NOW();

-- Step 3: Create program fields for Van Calendar
-- We'll create fields that match the van_calendar_plans structure

-- Delete existing fields if any
DELETE FROM program_fields WHERE program_id = 'VAN_CALENDAR_SYSTEM';

-- Insert Van Calendar fields
INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, order_index)
VALUES
  -- Van Selection (from database)
  ('VAN_CALENDAR_SYSTEM', 'van_selection', 'Select Van', 'dropdown', true, 
   'Choose a van from your zone', 
   'Select the van you are planning for. Only vans in your zone are shown.',
   jsonb_build_object(
     'database_source', jsonb_build_object(
       'table', 'vans',
       'display_field', 'numberplate',
       'metadata_fields', ARRAY['zone', 'id']
     )
   ),
   1),
  
  -- Week Start Date
  ('VAN_CALENDAR_SYSTEM', 'week_start_date', 'Week Starting', 'date', true,
   'Select Monday of the week',
   'Choose the Monday that starts the week you are planning. Calendar will show Mon-Sat.',
   '{}',
   2),
  
  -- Daily Routes (Monday to Saturday)
  -- We'll store each day as a long_text field with shop names and locations
  ('VAN_CALENDAR_SYSTEM', 'monday_route', 'Monday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Monday. One shop per line.',
   '{}',
   3),
  
  ('VAN_CALENDAR_SYSTEM', 'tuesday_route', 'Tuesday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Tuesday. One shop per line.',
   '{}',
   4),
  
  ('VAN_CALENDAR_SYSTEM', 'wednesday_route', 'Wednesday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Wednesday. One shop per line.',
   '{}',
   5),
  
  ('VAN_CALENDAR_SYSTEM', 'thursday_route', 'Thursday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Thursday. One shop per line.',
   '{}',
   6),
  
  ('VAN_CALENDAR_SYSTEM', 'friday_route', 'Friday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Friday. One shop per line.',
   '{}',
   7),
  
  ('VAN_CALENDAR_SYSTEM', 'saturday_route', 'Saturday Route', 'long_text', false,
   'Enter shop names, one per line',
   'List all shops the van will visit on Saturday. One shop per line.',
   '{}',
   8);

-- Step 4: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_programs_points_enabled ON programs(points_enabled);

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================
-- 
-- 1. The van_calendar_plans table can remain for backward compatibility
--    or be deprecated once the program submission system takes over
--
-- 2. Submissions will be stored in the submissions table with:
--    - program_id = 'VAN_CALENDAR_SYSTEM'
--    - points_awarded = 0 (because points_enabled = false)
--
-- 3. The program submission flow will:
--    - Check if program.points_enabled = true before awarding points
--    - Still log to submissions table for tracking
--    - Still show in analytics but with 0 points
--
-- 4. HQ can see all Van Calendar submissions through:
--    - Programs Dashboard → Van Weekly Calendar → View Submissions
--    - Submissions Analytics (filtered by program)
--
-- 5. Benefits of making it a program:
--    - Uses existing submission infrastructure
--    - Appears in Programs Dashboard naturally
--    - Can add/modify fields easily through program creator
--    - Leverages all existing analytics
--    - Can toggle points on/off without code changes
--
-- ============================================================================

-- Verification Queries (Run these to confirm setup):

-- Check if program was created
-- SELECT * FROM programs WHERE id = 'VAN_CALENDAR_SYSTEM';

-- Check program fields
-- SELECT * FROM program_fields WHERE program_id = 'VAN_CALENDAR_SYSTEM' ORDER BY order_index;

-- Check which programs have points disabled
-- SELECT title, points_enabled, points_value FROM programs WHERE points_enabled = false;
