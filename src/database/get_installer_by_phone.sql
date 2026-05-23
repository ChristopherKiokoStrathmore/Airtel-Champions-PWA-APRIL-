-- Simple function to get installer by phone number
CREATE OR REPLACE FUNCTION get_installer_by_phone(phone_pattern TEXT)
RETURNS TABLE (
  id BIGINT,
  installer_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i."Installer name" as installer_name
  FROM "INHOUSE_INSTALLER_6TOWNS_MARCH" i
  WHERE i."Installer contact" ILIKE phone_pattern
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
