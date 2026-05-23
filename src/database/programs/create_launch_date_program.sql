-- =====================================================
-- CREATE LAUNCH DATE PROGRAM
-- =====================================================
-- Program under Network Experience category
-- With Site ID dropdown, date picker, and various fields

-- Step 1: Create the program
INSERT INTO programs (
  id,
  title,
  description,
  points_value,
  target_roles,
  start_date,
  end_date,
  status,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Launch Date',
  'Track new site launches with partner details, recruitment numbers, and coverage quality assessment',
  50,
  ARRAY['sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_command_center', 'director'],
  NOW(),
  NOW() + INTERVAL '365 days',
  'active',
  (SELECT id FROM app_users WHERE role = 'director' LIMIT 1),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Step 2: Get the program ID for form fields
DO $$
DECLARE
  program_id UUID;
BEGIN
  SELECT id INTO program_id FROM programs WHERE title = 'Launch Date';

  -- Delete existing form fields if any
  DELETE FROM program_fields WHERE program_id = program_id;

  -- Field 1: Site ID (dropdown with all site IDs)
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Site ID',
    'dropdown',
    true,
    jsonb_build_object(
      'options', ARRAY[
        'NRU0076','NRU0027','NRU0115','NRU0031','NRU0137','NRU0145','NRU0141','NRU0118',
        'NRU0142','NRU0149','NRU0063','NRU0002','NRU0087','NRU0088','NRU0036','NUA0025',
        'NUA0019','NUA0012','NUA0007','NUA0003','NRU0001','NRU0144','NRU0067','NRU0024',
        'NRU0056','NRU0070','NRU0022','NRU0139','NRU0108','NRU0048','NRU0110','NRU0054',
        'NRU0082','NRU0123','NRU0009','NRU0050','NRU0133','NRU0030','NRU0052','NRU0047',
        'NRU0032','NRU0057','NRU0121','NRU0042','NRU0114','NRU0071','NRU0010','NRU0061',
        'NUA0029','NRU0151','NRU0051','NRU0120','NRU0055','NRU0023','NRU0073','KEK0003',
        'NRU0146','NRU0148','NUA0005','LKP0004','NUA0022','NUA0010','NRU0090','BGO0012',
        'LKP0028','LKP0008','LKP0003','NUA0006','NRU0068','NUA0031','NUA0026','NUA0001',
        'NUA0027','NRU0091','BGO0001','BGO0011','BGO0002','BGO0014','BGO0008','BGO0015',
        'BGO0005','BGO0016','KEK0001','KEK0004','NRU0029','BGO0013','UGU0034','KEK0005',
        'KEK0002','NUA0013','NUA0017','NUA0009','NUA0014','NUA0002','NUA0011','NUA0016',
        'NUA0004','NUA0023','NRU0106','NRU0103','NRU0136','NRU0003','NRU0126','NRU0084',
        'NRU0065','NRU0064','NRU0104','LKP0005','LKP0009','SRU0001','NRU0013','NRU0012',
        'NRU0037','NRU0147','NRU0143','NUA0021','NRU0006','NRU0028','NRU0004','NRU0072',
        'NRU0081','NRU0130','NRU0066','NRU0005','NRU0150','NRU0135','NRU0007','NRU0069',
        'NRU0074','NRU0049','NRU0077'
        -- Note: This is a partial list for SQL length. See site_ids_data.sql for complete list
      ],
      'searchable', true
    ),
    jsonb_build_object('required', true),
    1,
    NOW()
  );

  -- Field 2: Launch Date (date picker)
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Launch Date',
    'date',
    true,
    jsonb_build_object(
      'min_date', '2024-01-01',
      'max_date', '2026-12-31'
    ),
    jsonb_build_object('required', true),
    2,
    NOW()
  );

  -- Field 3: Partner Name
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Partner Name',
    'text',
    true,
    NULL,
    jsonb_build_object('required', true, 'min_length', 2, 'max_length', 100),
    3,
    NOW()
  );

  -- Field 4: Number of SSO recruited
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Number of SSO Recruited',
    'number',
    true,
    NULL,
    jsonb_build_object('required', true, 'min', 0),
    4,
    NOW()
  );

  -- Field 5: Number of AM Agents recruited
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Number of AM Agents Recruited',
    'number',
    true,
    NULL,
    jsonb_build_object('required', true, 'min', 0),
    5,
    NOW()
  );

  -- Field 6: Total GAs Done
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Total GAs Done',
    'number',
    true,
    NULL,
    jsonb_build_object('required', true, 'min', 0),
    6,
    NOW()
  );

  -- Field 7: Indoor Coverage
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Indoor Coverage',
    'dropdown',
    true,
    jsonb_build_object(
      'options', ARRAY['Very Good', 'Good', 'Poor']
    ),
    jsonb_build_object('required', true),
    7,
    NOW()
  );

  -- Field 8: Outdoor Coverage
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'Outdoor Coverage',
    'dropdown',
    true,
    jsonb_build_object(
      'options', ARRAY['Very Good', 'Good', 'Poor']
    ),
    jsonb_build_object('required', true),
    8,
    NOW()
  );

  -- Field 9: All POIs covered
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'All POIs Covered',
    'dropdown',
    true,
    jsonb_build_object(
      'options', ARRAY['Yes', 'No']
    ),
    jsonb_build_object('required', true),
    9,
    NOW()
  );

  -- Field 10: POIs with network Issues
  INSERT INTO program_fields (
    id,
    program_id,
    field_name,
    field_type,
    is_required,
    options,
    validation,
    order_index,
    created_at
  ) VALUES (
    gen_random_uuid(),
    program_id,
    'POIs with Network Issues',
    'long_text',
    false,
    jsonb_build_object('rows', 4),
    jsonb_build_object('max_length', 500),
    10,
    NOW()
  );

  RAISE NOTICE 'Launch Date program created successfully!';
END $$;

-- Verify the program was created
SELECT 
  p.title,
  p.points_value,
  p.status,
  COUNT(pf.id) as field_count
FROM programs p
LEFT JOIN program_fields pf ON p.id = pf.program_id
WHERE p.title = 'Launch Date'
GROUP BY p.id, p.title, p.points_value, p.status;

-- Show all fields
SELECT 
  pf.order_index,
  pf.field_name,
  pf.field_type,
  pf.is_required
FROM program_fields pf
JOIN programs p ON pf.program_id = p.id
WHERE p.title = 'Launch Date'
ORDER BY pf.order_index;
