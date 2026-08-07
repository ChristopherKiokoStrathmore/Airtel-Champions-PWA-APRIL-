-- Find where program submissions are stored

-- STEP 1: List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- STEP 2: Search for tables with 'submission' or 'program' in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name ILIKE '%submission%' OR table_name ILIKE '%program%' OR table_name ILIKE '%form%')
ORDER BY table_name;

-- STEP 3: If you see a likely table name, replace 'TABLE_NAME_HERE' and run:
/*
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME_HERE'
ORDER BY ordinal_position;
*/

-- STEP 4: Check the kv_store for program submissions (fallback)
-- Since we use kv_store for a lot of data, it might be there
SELECT key, value
FROM kv_store_28f2f653
WHERE key ILIKE '%van%calendar%'
OR key ILIKE '%program%848582a6%'
OR key ILIKE '%submission%'
LIMIT 20;
