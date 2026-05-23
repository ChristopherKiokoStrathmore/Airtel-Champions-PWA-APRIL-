-- Check what data actually exists in the table

-- 1. Show all keys
SELECT 
  'All Keys' as check_type,
  key,
  CASE 
    WHEN key LIKE 'programs:%' THEN 'Program'
    WHEN key LIKE 'program_fields:%' THEN 'Program Field'
    WHEN key LIKE 'submissions:%' THEN 'Submission'
    ELSE 'Other'
  END as type
FROM kv_store_28f2f653
ORDER BY key;

-- 2. Count by type
SELECT 
  CASE 
    WHEN key LIKE 'programs:%' THEN 'Programs'
    WHEN key LIKE 'program_fields:%' THEN 'Program Fields'
    WHEN key LIKE 'submissions:%' THEN 'Submissions'
    ELSE 'Other'
  END as data_type,
  COUNT(*) as count
FROM kv_store_28f2f653
GROUP BY data_type
ORDER BY data_type;

-- 3. Show program details if they exist
SELECT 
  'Program Data' as check_type,
  key,
  value
FROM kv_store_28f2f653
WHERE key LIKE 'programs:%'
LIMIT 5;

-- 4. Show program fields if they exist
SELECT 
  'Field Data' as check_type,
  key,
  value
FROM kv_store_28f2f653
WHERE key LIKE 'program_fields:%'
LIMIT 5;
