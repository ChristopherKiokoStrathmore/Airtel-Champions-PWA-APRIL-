-- ============================================
-- FORCE SUPABASE SCHEMA CACHE RELOAD
-- ============================================

-- Method 1: Send reload notification to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Verify tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('programs', 'program_fields', 'submissions', 'app_users', 'director_messages')
ORDER BY tablename;

-- Method 3: Check if PostgREST can see the tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'programs'
ORDER BY ordinal_position;

-- Method 4: Refresh materialized views (if any)
DO $$
BEGIN
  RAISE NOTICE '✅ Schema cache reload signal sent!';
  RAISE NOTICE '📊 If tables appear above, cache will refresh in 10-30 seconds';
  RAISE NOTICE '🔄 If error persists, restart your Supabase project from dashboard';
END $$;
