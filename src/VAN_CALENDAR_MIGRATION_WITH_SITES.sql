-- ✅ VAN CALENDAR MIGRATION - With Site Dropdowns (Updated)
-- This replaces the old Van Calendar with a proper program that includes site selection

-- Step 1: Add points_enabled column if not exists
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS points_enabled BOOLEAN DEFAULT true;

-- Step 2: Add system_id for special programs
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS system_id TEXT UNIQUE;

-- Step 3: Create/Update Van Calendar Program
DO $$
DECLARE
  van_program_id UUID;
BEGIN
  -- Check if Van Calendar already exists
  SELECT id INTO van_program_id 
  FROM programs 
  WHERE system_id = 'VAN_CALENDAR_SYSTEM';
  
  IF van_program_id IS NULL THEN
    -- Insert new program
    INSERT INTO programs (
      system_id,
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
      'VAN_CALENDAR_SYSTEM',
      '🚐 Van Weekly Calendar',
      'Submit weekly route plans for all vans in your zone. Plan routes with site selections for each day. This is for ZSM planning only - no points awarded.',
      '🚐',
      '#3B82F6',
      0,
      false,
      ARRAY['zonal_sales_manager', 'hq_command_center', 'director']::TEXT[],
      ARRAY['zonal_sales_manager']::TEXT[],
      'Operations',
      'active',
      NOW()
    ) RETURNING id INTO van_program_id;
  ELSE
    -- Update existing program
    UPDATE programs SET
      title = '🚐 Van Weekly Calendar',
      description = 'Submit weekly route plans for all vans in your zone. Plan routes with site selections for each day. This is for ZSM planning only - no points awarded.',
      icon = '🚐',
      color = '#3B82F6',
      points_enabled = false,
      target_roles = ARRAY['zonal_sales_manager', 'hq_command_center', 'director']::TEXT[],
      who_can_submit = ARRAY['zonal_sales_manager']::TEXT[],
      updated_at = NOW()
    WHERE id = van_program_id;
  END IF;

  -- Delete old fields
  DELETE FROM program_fields WHERE program_id = van_program_id;

  -- Create new fields with site dropdowns for each day
  INSERT INTO program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, order_index)
  VALUES
    -- Van Selection
    (van_program_id, 'van_selection', 'Select Van', 'dropdown', true, 
     'Choose a van from your zone', 
     'Select the van you are planning for. Only vans in your zone are shown.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'van_db',
         'display_field', 'numberplate',
         'metadata_fields', ARRAY['zone', 'id']
       )
     ),
     1),
    
    -- Week Starting Date
    (van_program_id, 'week_start_date', 'Week Starting', 'date', true,
     'Select Monday of the week',
     'Choose the Monday that starts the week you are planning.',
     '{}',
     2),
    
    -- Monday Sites
    (van_program_id, 'monday_sites', 'Monday Sites', 'multi_select', false,
     'Select sites for Monday',
     'Choose all sites the van will visit on Monday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     3),
    
    -- Tuesday Sites
    (van_program_id, 'tuesday_sites', 'Tuesday Sites', 'multi_select', false,
     'Select sites for Tuesday',
     'Choose all sites the van will visit on Tuesday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     4),
    
    -- Wednesday Sites
    (van_program_id, 'wednesday_sites', 'Wednesday Sites', 'multi_select', false,
     'Select sites for Wednesday',
     'Choose all sites the van will visit on Wednesday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     5),
    
    -- Thursday Sites
    (van_program_id, 'thursday_sites', 'Thursday Sites', 'multi_select', false,
     'Select sites for Thursday',
     'Choose all sites the van will visit on Thursday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     6),
    
    -- Friday Sites
    (van_program_id, 'friday_sites', 'Friday Sites', 'multi_select', false,
     'Select sites for Friday',
     'Choose all sites the van will visit on Friday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     7),
    
    -- Saturday Sites
    (van_program_id, 'saturday_sites', 'Saturday Sites', 'multi_select', false,
     'Select sites for Saturday',
     'Choose all sites the van will visit on Saturday. You can select multiple sites.',
     jsonb_build_object(
       'database_source', jsonb_build_object(
         'table', 'sitewise',
         'display_field', 'SITE',
         'metadata_fields', ARRAY['SITE ID', 'ZONE', 'TOWN CATEGORY']
       )
     ),
     8);
  
  RAISE NOTICE 'Van Calendar program created/updated with ID: %', van_program_id;
END $$;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_points_enabled ON programs(points_enabled);
CREATE INDEX IF NOT EXISTS idx_programs_system_id ON programs(system_id);

-- ✅ MIGRATION COMPLETE
-- Van Calendar now has:
-- 1. Van selection dropdown (from van_db)
-- 2. Week start date picker
-- 3. Multi-select site dropdowns for each day Mon-Sat (from sitewise table)
-- 4. No points awarded (tracking only)
