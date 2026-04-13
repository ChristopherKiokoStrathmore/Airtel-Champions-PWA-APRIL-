-- Fix the get_towns function with proper table name
DROP FUNCTION IF EXISTS public.get_towns();

CREATE OR REPLACE FUNCTION public.get_towns()
RETURNS TABLE (id bigint, name text) AS $$
BEGIN
  RETURN QUERY
  SELECT ROW_NUMBER() OVER (ORDER BY Town)::bigint as id,
         Town as name
  FROM "DSE_14TOWNS"
  WHERE Town IS NOT NULL
  GROUP BY Town
  ORDER BY Town;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_towns() TO authenticated, anon, service_role;
