-- ============================================================================
-- AIRTEL CHAMPIONS - Fix Database Dropdown Permissions
-- ============================================================================
-- Run this in Supabase SQL Editor to fix permission errors
-- ============================================================================

-- Grant SELECT permissions to service_role for all dropdown tables
-- This allows the backend to read data for dropdowns

-- 🚗 Vehicle Management
GRANT SELECT ON public.van_db TO service_role;

-- 🏪 Shop Management
GRANT SELECT ON public.amb_shops TO service_role;
GRANT SELECT ON public.amb_sitewise TO service_role;
GRANT SELECT ON public.sitewise TO service_role;

-- 👥 People & Teams
GRANT SELECT ON public.app_users TO service_role;
GRANT SELECT ON public.departments TO service_role;
GRANT SELECT ON public.regions TO service_role;
GRANT SELECT ON public.teams TO service_role;
GRANT SELECT ON public.groups TO service_role;
GRANT SELECT ON public.group_members TO service_role;

-- 🎯 Gamification
GRANT SELECT ON public.achievements TO service_role;
GRANT SELECT ON public.mission_types TO service_role;
GRANT SELECT ON public.challenges TO service_role;

-- 📊 System
GRANT SELECT ON public.programs TO service_role;
GRANT SELECT ON public.submissions TO service_role;
GRANT SELECT ON public.social_posts TO service_role;

-- Fix KV Store permissions (CRITICAL - fixes the autocreate error)
GRANT ALL ON public.kv_store_28f2f653 TO anon, authenticated, service_role;
ALTER TABLE public.kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Alternative: Disable RLS (if you want service_role to bypass RLS)
-- ============================================================================
-- If you still get permission errors, you can disable RLS on specific tables:
-- (Uncomment the tables you want to disable RLS for)

-- ALTER TABLE public.van_db DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.amb_shops DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.amb_sitewise DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sitewise DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.regions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mission_types DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verify Permissions (Run this to check if it worked)
-- ============================================================================
-- SELECT tablename, has_table_privilege('service_role', schemaname || '.' || tablename, 'SELECT') as can_select
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('van_db', 'amb_shops', 'sitewise', 'app_users', 'programs');

-- ============================================================================
-- Done! Now reload your app and try creating a database dropdown field
-- ============================================================================
