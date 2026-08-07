-- ============================================================================
-- HBB GA Dashboard - Sample Test Data
-- Schema: hbb_users, hbb_ga_performance, hbb_teams (LIVE)
-- ============================================================================

-- NOTE: This script matches your LIVE database schema.
-- Tables that ACTUALLY EXIST: hbb_users, hbb_ga_performance, hbb_teams

-- ============================================================================
-- USERS (DSEs and Team Leads)
-- ============================================================================
INSERT INTO public.hbb_users (msisdn, name, role, team_lead_msisdn, area_code) VALUES
('711111111', 'Prisca Mutheu Kyende', 'dse', '720000000', '001'),
('712222222', 'John Kamau DSE', 'dse', '720000000', '001'),
('713333333', 'Mary Kipchoge DSE', 'dse', '720000000', '001'),
('714444444', 'David Ochieng DSE', 'dse', '720000000', '001'),
('715555555', 'Susan Kariuki DSE', 'dse', '720000000', '001'),
('720000000', 'Alpha Team Lead', 'team_lead', NULL, '001')
ON CONFLICT (msisdn) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  team_lead_msisdn = EXCLUDED.team_lead_msisdn,
  area_code = EXCLUDED.area_code;

-- ============================================================================
-- GA PERFORMANCE DATA
-- ============================================================================
INSERT INTO public.hbb_ga_performance 
  (dse_msisdn, ga_count, incentive_earned, month_year) 
VALUES
('711111111', 18, 15000, '2026-04'),
('712222222', 25, 20000, '2026-04'),
('713333333', 20, 15000, '2026-04'),
('714444444', 12, 10000, '2026-04'),
('715555555', 8, 5000, '2026-04'),
('711111111', 15, 12000, '2026-03'),
('712222222', 22, 18000, '2026-03'),
('713333333', 18, 14000, '2026-03'),
('714444444', 10, 8000, '2026-03'),
('715555555', 7, 4000, '2026-03'),
('711111111', 12, 10000, '2026-02'),
('712222222', 20, 16000, '2026-02'),
('713333333', 16, 12000, '2026-02'),
('714444444', 8, 6000, '2026-02'),
('715555555', 5, 3000, '2026-02');

-- ============================================================================
-- TEAM ASSIGNMENTS
-- ============================================================================
INSERT INTO public.hbb_teams (team_lead_msisdn, dse_msisdn, month_year) VALUES
('720000000', '711111111', '2026-04'),
('720000000', '712222222', '2026-04'),
('720000000', '713333333', '2026-04'),
('720000000', '714444444', '2026-04'),
('720000000', '715555555', '2026-04'),
('720000000', '711111111', '2026-03'),
('720000000', '712222222', '2026-03'),
('720000000', '713333333', '2026-03'),
('720000000', '714444444', '2026-03'),
('720000000', '715555555', '2026-03');

-- ============================================================================
-- VERIFY DATA
-- ============================================================================
SELECT * FROM public.hbb_users WHERE role IN ('dse', 'team_lead');
SELECT * FROM public.hbb_ga_performance;
SELECT * FROM public.hbb_teams;
SELECT * FROM public.hbb_ga_performance WHERE dse_msisdn = '711111111' AND month_year = '2026-04';

-- Check row counts:
SELECT COUNT(*) as total_users FROM public.hbb_users WHERE role = 'dse';
SELECT COUNT(*) as dse_count FROM public.hbb_ga_performance;
SELECT COUNT(*) as april_count FROM public.hbb_ga_performance WHERE month_year = '2026-04';


-- Optional diagnostics for empty dashboard due to RLS:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('hbb_users', 'hbb_ga_performance', 'hbb_teams');
-- SELECT * FROM pg_policies WHERE tablename IN ('hbb_users', 'hbb_ga_performance', 'hbb_teams');

-- ============================================================================
-- EXPECTED TEST DATA
-- ============================================================================
-- DSE Team Lead:
--   720000000 Alpha Team Lead
-- DSEs:
--   711111111 Prisca Mutheu Kyende (April: 18 GAs, 15000 KES)
--   712222222 John Kamau DSE (April: 25 GAs, 20000 KES)
--   713333333 Mary Kipchoge DSE (April: 20 GAs, 15000 KES)
--   714444444 David Ochieng DSE (April: 12 GAs, 10000 KES)
--   715555555 Susan Kariuki DSE (April: 8 GAs, 5000 KES)
-- Total expected rows in hbb_ga_performance: 15 (5 DSEs × 3 months)
-- Total expected April 2026 rows: 5
-- Total expected team assignments: 10 (5 DSEs × 2 months)
