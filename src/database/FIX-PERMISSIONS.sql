-- ✅ FIX: Add RLS policies to allow anon access
-- Run this in Supabase SQL Editor

-- 1. Enable RLS (for security)
ALTER TABLE kv_store_28f2f653 ENABLE ROW LEVEL SECURITY;

-- 2. Allow anonymous users to read all data
CREATE POLICY "Allow anon read access"
ON kv_store_28f2f653
FOR SELECT
TO anon
USING (true);

-- 3. Allow anonymous users to insert data
CREATE POLICY "Allow anon insert access"
ON kv_store_28f2f653
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Allow anonymous users to update data
CREATE POLICY "Allow anon update access"
ON kv_store_28f2f653
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 5. Allow anonymous users to delete data
CREATE POLICY "Allow anon delete access"
ON kv_store_28f2f653
FOR DELETE
TO anon
USING (true);

-- 6. Grant permissions to anon role
GRANT ALL ON kv_store_28f2f653 TO anon;
GRANT ALL ON kv_store_28f2f653 TO authenticated;

-- ✅ VERIFY
SELECT 
  '✅ Policies created!' as status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'kv_store_28f2f653';

SELECT 
  '✅ Permissions granted!' as status,
  grantee,
  string_agg(privilege_type, ', ') as permissions
FROM information_schema.table_privileges
WHERE table_name = 'kv_store_28f2f653'
GROUP BY grantee;
