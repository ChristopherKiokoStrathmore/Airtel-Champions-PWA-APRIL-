-- ============================================
-- 🔍 CHECK WHAT EXISTS IN DATABASE
-- ============================================
-- Run this FIRST to see what tables you have
-- ============================================

-- Check all tables in public schema
SELECT 
    '📋 ALL TABLES IN PUBLIC SCHEMA' as info,
    tablename,
    CASE WHEN rowsecurity THEN '🔒 RLS ON' ELSE '🔓 RLS OFF' END as security
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if programs-related tables exist
SELECT 
    '🔍 PROGRAMS TABLE CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'programs')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

SELECT 
    '🔍 PROGRAM_FIELDS TABLE CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'program_fields')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

SELECT 
    '🔍 SUBMISSIONS TABLE CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submissions')
        THEN '✅ EXISTS'
        ELSE '❌ DOES NOT EXIST'
    END as status;

-- Count rows if tables exist (will error if they don't)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs' AND table_schema = 'public') THEN
        RAISE NOTICE '📊 Programs count: %', (SELECT COUNT(*) FROM public.programs);
    ELSE
        RAISE NOTICE '❌ Programs table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_fields' AND table_schema = 'public') THEN
        RAISE NOTICE '📊 Program fields count: %', (SELECT COUNT(*) FROM public.program_fields);
    ELSE
        RAISE NOTICE '❌ Program_fields table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions' AND table_schema = 'public') THEN
        RAISE NOTICE '📊 Submissions count: %', (SELECT COUNT(*) FROM public.submissions);
    ELSE
        RAISE NOTICE '❌ Submissions table does not exist';
    END IF;
END $$;

-- ============================================
-- 📖 HOW TO READ THE OUTPUT
-- ============================================
-- If you see:
--   ✅ EXISTS = Table is there, good!
--   ❌ DOES NOT EXIST = Need to create it
--
-- Next step:
--   If tables DON'T exist → Run FORCE-CREATE-TABLES-NOW.sql
--   If tables DO exist → Check permissions/RLS
-- ============================================
