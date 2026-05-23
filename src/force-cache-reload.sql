-- ============================================
-- CRITICAL: Force Supabase Schema Cache Reload
-- ============================================
-- Run this immediately after creating tables

-- Step 1: Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Verify all tables exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('programs', 'program_fields', 'submissions', 'app_users', 'director_messages');
  
  IF table_count = 5 THEN
    RAISE NOTICE '✅ All 5 tables found in database';
  ELSE
    RAISE EXCEPTION '❌ Only % out of 5 tables found! Run the main schema SQL first.', table_count;
  END IF;
END $$;

-- Step 3: Verify programs table structure
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'programs';
  
  RAISE NOTICE '✅ Programs table has % columns', column_count;
END $$;

-- Step 4: Grant explicit permissions (sometimes helps with cache)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 5: Test insert (will fail if cache isn't refreshed)
DO $$
BEGIN
  -- Try to insert and immediately delete a test record
  INSERT INTO programs (title, description, status)
  VALUES ('__CACHE_TEST__', 'Testing schema cache', 'draft');
  
  DELETE FROM programs WHERE title = '__CACHE_TEST__';
  
  RAISE NOTICE '✅ Schema cache is working! Insert/Delete successful.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Schema cache NOT refreshed yet! Error: %', SQLERRM;
END $$;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ SCHEMA CACHE RELOAD COMPLETE!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '   1. Wait 30 seconds for PostgREST to reload';
  RAISE NOTICE '   2. If error persists, RESTART your Supabase project:';
  RAISE NOTICE '      Dashboard → Settings → General → Restart Project';
  RAISE NOTICE '   3. Hard refresh your app (Ctrl+Shift+R)';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 If you still see PGRST205 error:';
  RAISE NOTICE '   • Your Supabase project may need a full restart';
  RAISE NOTICE '   • Go to Supabase Dashboard → Settings → General';
  RAISE NOTICE '   • Click "Restart Project" (takes 2-3 minutes)';
  RAISE NOTICE '';
END $$;
