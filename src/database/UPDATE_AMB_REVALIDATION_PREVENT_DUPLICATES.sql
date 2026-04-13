-- ============================================================================
-- UPDATE AMB REVALIDATION TO ENABLE PREVENT DUPLICATE SELECTIONS
-- ============================================================================
-- This enables the "prevent duplicate selections" feature for the AMB NAME field
-- so that each AMB shop can only be validated once
-- ============================================================================

-- Update the AMB NAME field to enable prevent_duplicates
UPDATE program_fields
SET 
  options = jsonb_set(
    COALESCE(options, '{}'::jsonb),
    '{prevent_duplicates}',
    'true'::jsonb
  ),
  validation = jsonb_set(
    COALESCE(validation, '{}'::jsonb),
    '{prevent_duplicates}',
    'true'::jsonb
  )
WHERE program_id = (
  SELECT id FROM programs WHERE title = 'AMB REVALIDATION'
)
AND field_type IN ('dropdown', 'select');

-- Verify the update
SELECT 
  field_label,
  field_type,
  options,
  validation
FROM program_fields
WHERE program_id = (
  SELECT id FROM programs WHERE title = 'AMB REVALIDATION'
)
ORDER BY order_index;
