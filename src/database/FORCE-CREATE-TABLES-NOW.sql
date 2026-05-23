-- ============================================
-- 🚀 FORCE CREATE TABLES - Definitive Fix
-- ============================================
-- This will create the tables NO MATTER WHAT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.program_fields CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;

-- Step 2: Create programs table
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📊',
    color TEXT DEFAULT '#EF4444',
    points_value INTEGER DEFAULT 50,
    target_roles TEXT[] DEFAULT '{}',
    category TEXT,
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create program_fields table
CREATE TABLE public.program_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    placeholder TEXT,
    help_text TEXT,
    options JSONB,
    validation JSONB,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create submissions table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    se_id TEXT,
    responses JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    gps_location JSONB,
    photos TEXT[] DEFAULT '{}',
    points_awarded INTEGER DEFAULT 0,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Disable RLS completely
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;

-- Step 6: Grant ALL permissions to ALL roles
GRANT ALL ON public.programs TO anon;
GRANT ALL ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON public.program_fields TO anon;
GRANT ALL ON public.program_fields TO authenticated;
GRANT ALL ON public.program_fields TO service_role;

GRANT ALL ON public.submissions TO anon;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

-- Step 7: Create indexes
CREATE INDEX idx_programs_status ON public.programs(status);
CREATE INDEX idx_programs_target_roles ON public.programs USING GIN(target_roles);
CREATE INDEX idx_program_fields_program_id ON public.program_fields(program_id);
CREATE INDEX idx_program_fields_order ON public.program_fields(program_id, order_index);
CREATE INDEX idx_submissions_program_id ON public.submissions(program_id);
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

-- Step 8: Insert sample program with fields
DO $$
DECLARE
    v_program_id UUID;
BEGIN
    -- Insert sample program
    INSERT INTO public.programs (title, description, icon, color, points_value, target_roles, category, status)
    VALUES (
        'Competitor Intelligence',
        'Report competitor activity in your territory',
        '🎯',
        '#EF4444',
        100,
        ARRAY['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'],
        'Network Experience',
        'active'
    ) RETURNING id INTO v_program_id;

    -- Insert fields for this program
    INSERT INTO public.program_fields (program_id, field_name, field_label, field_type, is_required, placeholder, order_index)
    VALUES 
        (v_program_id, 'competitor_name', 'Competitor Name', 'text', true, 'e.g., Safaricom, Telkom', 0),
        (v_program_id, 'activity_type', 'Activity Type', 'select', true, null, 1),
        (v_program_id, 'description', 'Description', 'textarea', true, 'Describe what you observed...', 2),
        (v_program_id, 'location', 'Location/Site', 'text', true, 'e.g., Nairobi CBD, Westlands', 3);

    -- Set options for select field
    UPDATE public.program_fields 
    SET options = '["Promotion", "New Product Launch", "Price Change", "Store Opening", "Network Expansion", "Other"]'::JSONB
    WHERE program_id = v_program_id AND field_name = 'activity_type';

    RAISE NOTICE '✅ Sample program created with ID: %', v_program_id;
END $$;

-- Step 9: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 10: Verification
SELECT 
    '✅ PROGRAMS' as table_name,
    COUNT(*) as rows,
    CASE WHEN pg_tables.rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END as rls_status
FROM public.programs, pg_tables 
WHERE pg_tables.tablename = 'programs' AND pg_tables.schemaname = 'public'
GROUP BY pg_tables.rowsecurity

UNION ALL

SELECT 
    '✅ PROGRAM_FIELDS',
    COUNT(*),
    CASE WHEN pg_tables.rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END
FROM public.program_fields, pg_tables 
WHERE pg_tables.tablename = 'program_fields' AND pg_tables.schemaname = 'public'
GROUP BY pg_tables.rowsecurity

UNION ALL

SELECT 
    '✅ SUBMISSIONS',
    COUNT(*),
    CASE WHEN pg_tables.rowsecurity THEN '❌ RLS ON' ELSE '✅ RLS OFF' END
FROM public.submissions, pg_tables 
WHERE pg_tables.tablename = 'submissions' AND pg_tables.schemaname = 'public'
GROUP BY pg_tables.rowsecurity;

-- ============================================
-- ✅ SUCCESS CHECK
-- ============================================
-- You should see:
-- ✅ PROGRAMS       | 1 | ✅ RLS OFF
-- ✅ PROGRAM_FIELDS | 4 | ✅ RLS OFF
-- ✅ SUBMISSIONS    | 0 | ✅ RLS OFF
-- ============================================

SELECT '🎉 TABLES CREATED SUCCESSFULLY!' as status;
