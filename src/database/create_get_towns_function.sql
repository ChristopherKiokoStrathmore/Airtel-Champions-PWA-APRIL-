-- Create function to get towns from DSE_14TOWNS table
-- This bypasses the case-sensitivity issue with Supabase JS client

CREATE OR REPLACE FUNCTION get_towns()
RETURNS TABLE (
  id bigint,
  name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY DISTINCT_TOWN)::bigint as id,
    DISTINCT_TOWN as name
  FROM (
    SELECT DISTINCT "Town" as DISTINCT_TOWN
    FROM "DSE_14TOWNS"
    WHERE "Town" IS NOT NULL
    ORDER BY "Town"
  ) towns;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_towns() TO authenticated;
GRANT EXECUTE ON FUNCTION get_towns() TO anon;
GRANT EXECUTE ON FUNCTION get_towns() TO service_role;
