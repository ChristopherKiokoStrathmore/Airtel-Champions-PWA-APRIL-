-- Helper functions for the Program Whitelist feature
-- Used by the Settings UI table/column pickers and the submission form dropdowns

-- Returns all public base tables (for the table picker)
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT table_name::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
$$;

-- Returns column names for a given table (for the column picker)
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE(column_name text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT column_name::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;

-- Returns distinct non-null values from any table+column (for dropdown options in submission form)
-- Uses %I format to safely quote identifiers — not vulnerable to SQL injection
CREATE OR REPLACE FUNCTION get_distinct_values(p_table text, p_column text)
RETURNS TABLE(value text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT DISTINCT %I::text FROM public.%I WHERE %I IS NOT NULL ORDER BY 1 LIMIT 200',
    p_column, p_table, p_column
  );
END;
$$;
