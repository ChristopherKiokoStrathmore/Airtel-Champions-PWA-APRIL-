-- Diagnostic: Find where the 252 uploaded installer records actually are

-- Check upload batch status
SELECT id, batch_name, status, record_count, created_at, processed_at 
FROM hbb_ga_upload_batches 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if data is in a batch details or staging table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%batch%' OR table_name ILIKE '%upload%' OR table_name ILIKE '%staging%')
ORDER BY table_name;

-- Check exact schema of old table - column names might differ
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'HBB_INSTALLER_GA_MONTHLY'
ORDER BY ordinal_position;

-- Check schema of new table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'hbb_installer_ga_monthly'
ORDER BY ordinal_position;

-- Count all rows in any GA-related table
SELECT 'HBB_INSTALLER_GA_MONTHLY' as table_name, COUNT(*) as row_count FROM "HBB_INSTALLER_GA_MONTHLY"
UNION ALL
SELECT 'HBB_DSE_GA_MONTHLY', COUNT(*) FROM "HBB_DSE_GA_MONTHLY"
UNION ALL
SELECT 'hbb_installer_ga_monthly', COUNT(*) FROM hbb_installer_ga_monthly
UNION ALL
SELECT 'hbb_dse_ga_monthly', COUNT(*) FROM hbb_dse_ga_monthly
UNION ALL
SELECT 'hbb_installer_ga_daily', COUNT(*) FROM hbb_installer_ga_daily
UNION ALL
SELECT 'hbb_dse_ga_daily', COUNT(*) FROM hbb_dse_ga_daily;

-- Look for any table with "Pauline Wambui" or "0100008040"
-- This won't work as generic query, but you can run per-table:
-- SELECT * FROM [ANY_TABLE] WHERE installer_name ILIKE '%Pauline%' OR installer_msisdn LIKE '%0100008040%';
