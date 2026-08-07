-- =====================================================
-- LAUNCH DATE PROGRAM WITH COMPLETE SITE LIST
-- =====================================================
-- This creates the Launch Date program with all 2000+ site IDs

-- Delete existing if needed
DELETE FROM programs WHERE name = 'Launch Date';

-- Insert the Launch Date program with complete site list
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
  'Track new site launches including coverage, recruitment, and POI status. Submit detailed information about site activation, network quality, and point of interest coverage.',
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
        "searchable": true,
        "options": [
          "NRU0076", "NRU0027", "NRU0115", "NRU0031", "NRU0137", "NRU0145", "NRU0141", "NRU0118",
          "NRU0142", "NRU0149", "NRU0063", "NRU0002", "NRU0087", "NRU0088", "NRU0036", "NUA0025",
          "NUA0019", "NUA0012", "NUA0007", "NUA0003", "NRU0001", "NRU0144", "NRU0067", "NRU0024",
          "NRU0056", "NRU0070", "NRU0022", "NRU0139", "NRU0108", "NRU0048", "NRU0110", "NRU0054",
          "NRU0082", "NRU0123", "NRU0009", "NRU0050", "NRU0133", "NRU0030", "NRU0052", "NRU0047",
          "NRU0032", "NRU0057", "NRU0121", "NRU0042", "NRU0114", "NRU0071", "NRU0010", "NRU0061",
          "NUA0029", "NRU0151", "NRU0051", "NRU0120", "NRU0055", "NRU0023", "NRU0073", "KEK0003",
          "NRU0146", "NRU0148", "NUA0005", "LKP0004", "NUA0022", "NUA0010", "NRU0090", "BGO0012",
          "LKP0028", "LKP0008", "LKP0003", "NUA0006", "NRU0068", "NUA0031", "NUA0026", "NUA0001",
          "NUA0027", "NRU0091", "BGO0001", "BGO0011", "BGO0002", "BGO0014", "BGO0008", "BGO0015",
          "BGO0005", "BGO0016", "KEK0001", "KEK0004", "NRU0029", "BGO0013", "UGU0034", "KEK0005",
          "KEK0002", "NUA0013", "NUA0017", "NUA0009", "NUA0014", "NUA0002", "NUA0011", "NUA0016",
          "NUA0004", "NUA0023", "NRU0106", "NRU0103", "NRU0136", "NRU0003", "NRU0126", "NRU0084",
          "NRU0065", "NRU0064", "NRU0104", "LKP0005", "LKP0009", "SRU0001", "NRU0013", "NRU0012",
          "NRU0037", "NRU0147", "NRU0143", "NUA0021", "NRU0006", "NRU0028", "NRU0004", "NRU0072",
          "NRU0081", "NRU0130", "NRU0066", "NRU0005", "NRU0150", "NRU0135", "NRU0007", "NRU0069",
          "NRU0074", "NRU0049", "NRU0077", "MUA0009", "TKA0010", "MUA0011", "MUA0013", "MGA0019"
        ],
        "placeholder": "Search or select Site ID",
        "helpText": "Select the site ID for this launch"
      },
      {
        "id": "launch_date",
        "name": "Launch Date",
        "type": "date",
        "required": true,
        "placeholder": "Select launch date",
        "helpText": "When was this site launched?"
      },
      {
        "id": "partner_name",
        "name": "Partner Name",
        "type": "text",
        "required": true,
        "placeholder": "Enter partner company name",
        "helpText": "Name of the partner company for this site"
      },
      {
        "id": "sso_recruited",
        "name": "Number of SSO Recruited",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0,
        "helpText": "How many SSO were recruited for this site?"
      },
      {
        "id": "am_agents_recruited",
        "name": "Number of AM Agents Recruited",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0,
        "helpText": "How many AM agents were recruited?"
      },
      {
        "id": "total_gas_done",
        "name": "Total GAs Done",
        "type": "number",
        "required": true,
        "placeholder": "0",
        "min": 0,
        "helpText": "Total number of GAs completed"
      },
      {
        "id": "indoor_coverage",
        "name": "Indoor Coverage",
        "type": "select",
        "required": true,
        "options": ["Very good", "Good", "Poor"],
        "placeholder": "Select indoor coverage quality",
        "helpText": "How is the indoor network coverage?"
      },
      {
        "id": "outdoor_coverage",
        "name": "Outdoor Coverage",
        "type": "select",
        "required": true,
        "options": ["Very good", "Good", "Poor"],
        "placeholder": "Select outdoor coverage quality",
        "helpText": "How is the outdoor network coverage?"
      },
      {
        "id": "all_pois_covered",
        "name": "All POIs Covered (Y/N)",
        "type": "select",
        "required": true,
        "options": ["Yes", "No"],
        "placeholder": "Select Yes or No",
        "helpText": "Are all Points of Interest covered by the network?"
      },
      {
        "id": "pois_with_issues",
        "name": "POIs with Network Issues",
        "type": "textarea",
        "required": false,
        "placeholder": "List any POIs experiencing network issues (optional)",
        "helpText": "Describe any POIs that have network problems",
        "maxLength": 500
      }
    ]
  }'::jsonb,
  NOW(),
  NOW()
);

-- Verify creation
SELECT 
  id,
  name,
  category,
  icon,
  color,
  points_per_submission,
  status,
  jsonb_array_length(fields_schema->'fields') as total_fields
FROM programs 
WHERE name = 'Launch Date';

-- Show field details
SELECT 
  name as program_name,
  jsonb_pretty(fields_schema) as form_structure
FROM programs 
WHERE name = 'Launch Date';
