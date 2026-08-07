-- =====================================================
-- LAUNCH DATE PROGRAM SETUP
-- =====================================================
-- Creates the Launch Date program under Network Experience

-- Insert the Launch Date program
INSERT INTO programs (
  id,
  name,
  description,
  category,
  icon,
  color,
  points_per_submission,
  status,
  created_by,
  fields_schema,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Launch Date',
  'Track new site launches including coverage, recruitment, and POI status',
  'Network Experience',
  '🚀',
  'bg-purple-50 border-purple-200 text-purple-600',
  50,
  'active',
  (SELECT id FROM public.users WHERE role = 'director' LIMIT 1),
  '{
    "fields": [
      {
        "id": "site_id",
        "name": "Site ID",
        "type": "select",
        "required": true,
        "options": [
          "NRU0076", "NRU0027", "NRU0115", "NRU0031", "NRU0137", "NRU0145", "NRU0141", "NRU0118",
          "NRU0142", "NRU0149", "NRU0063", "NRU0002", "NRU0087", "NRU0088", "NRU0036", "NUA0025",
          "NUA0019", "NUA0012", "NUA0007", "NUA0003", "NRU0001", "NRU0144", "NRU0067", "NRU0024",
          "NRU0056", "NRU0070", "NRU0022", "NRU0139", "NRU0108", "NRU0048", "NRU0110", "NRU0054",
          "NRU0082", "NRU0123", "NRU0009", "NRU0050", "NRU0133", "NRU0030", "NRU0052", "NRU0047",
          "NRU0032", "NRU0057", "NRU0121", "NRU0042", "NRU0114", "NRU0071", "NRU0010", "NRU0061",
          "NUA0029", "NRU0151", "NRU0051", "NRU0120", "NRU0055", "NRU0023", "NRU0073", "KEK0003"
        ],
        "placeholder": "Select Site ID"
      },
      {
        "id": "launch_date",
        "name": "Launch Date",
        "type": "date",
        "required": true,
        "placeholder": "Select launch date"
      },
      {
        "id": "partner_name",
        "name": "Partner Name",
        "type": "text",
        "required": true,
        "placeholder": "Enter partner name"
      },
      {
        "id": "sso_recruited",
        "name": "Number of SSO Recruited",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0
      },
      {
        "id": "am_agents_recruited",
        "name": "Number of AM Agents Recruited",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0
      },
      {
        "id": "total_gas_done",
        "name": "Total GAs Done",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0
      },
      {
        "id": "indoor_coverage",
        "name": "Indoor Coverage",
        "type": "select",
        "required": true,
        "options": ["Very good", "Good", "Poor"],
        "placeholder": "Select indoor coverage quality"
      },
      {
        "id": "outdoor_coverage",
        "name": "Outdoor Coverage",
        "type": "select",
        "required": true,
        "options": ["Very good", "Good", "Poor"],
        "placeholder": "Select outdoor coverage quality"
      },
      {
        "id": "all_pois_covered",
        "name": "All POIs Covered (Y/N)",
        "type": "select",
        "required": true,
        "options": ["Yes", "No"],
        "placeholder": "Select Yes or No"
      },
      {
        "id": "pois_with_issues",
        "name": "POIs with Network Issues",
        "type": "textarea",
        "required": false,
        "placeholder": "List any POIs with network issues (optional)"
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify the program was created
SELECT 
  name,
  category,
  icon,
  points_per_submission,
  status,
  jsonb_array_length(fields_schema->'fields') as field_count
FROM programs 
WHERE name = 'Launch Date';

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN programs.fields_schema IS 'JSON schema defining the form fields for this program';
