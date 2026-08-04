-- ============================================================================
-- 20260804_07  RLS lockdown - tables the application never reads
-- ============================================================================
-- Scope was derived by intersecting two searches, not one:
--
--   1. static  - every .from('<table>') and .rpc('<name>') in src/
--   2. dynamic - every table named inside program_fields.options
--                (`{"database_source": {"table": "..."}}`) and
--                programs.whitelist_config / whitelist_target
--
-- The dynamic pass matters: a static-only scope would have locked
-- NEW_SITES_JULY, Priority_sites, SITEWISE_MAY and challenges, which are
-- referenced from database configuration rather than code. Locking those
-- silently empties dropdowns instead of raising an error.
--
-- The 32 tables below appear in neither pass. Access is revoked from anon
-- and authenticated, and RLS is enabled with no policy, so only service_role
-- (Edge Functions) can reach them. 153912 rows leave public reach.
--
-- No data is deleted. Rollback: scratchpad/rollback-rls-lockdown.sql
-- ============================================================================

begin;

-- AIRTELMONEY_HQ (1 rows)
revoke all on public."AIRTELMONEY_HQ" from anon;
revoke all on public."AIRTELMONEY_HQ" from authenticated;
alter table public."AIRTELMONEY_HQ" enable row level security;

-- HBB_TEAM_LEAD (31 rows)
revoke all on public."HBB_TEAM_LEAD" from anon;
revoke all on public."HBB_TEAM_LEAD" from authenticated;
alter table public."HBB_TEAM_LEAD" enable row level security;

-- NEW_SITES_APRIL (236 rows)
revoke all on public."NEW_SITES_APRIL" from anon;
revoke all on public."NEW_SITES_APRIL" from authenticated;
alter table public."NEW_SITES_APRIL" enable row level security;

-- NEW_SITES_MARCH (236 rows)
revoke all on public."NEW_SITES_MARCH" from anon;
revoke all on public."NEW_SITES_MARCH" from authenticated;
alter table public."NEW_SITES_MARCH" enable row level security;

-- Partner_vans (28 rows)
revoke all on public."Partner_vans" from anon;
revoke all on public."Partner_vans" from authenticated;
alter table public."Partner_vans" enable row level security;

-- Retailer_dump_3rd_march (146694 rows)
revoke all on public."Retailer_dump_3rd_march" from anon;
revoke all on public."Retailer_dump_3rd_march" from authenticated;
alter table public."Retailer_dump_3rd_march" enable row level security;

-- SD_DASHBOARD (3856 rows)
revoke all on public."SD_DASHBOARD" from anon;
revoke all on public."SD_DASHBOARD" from authenticated;
alter table public."SD_DASHBOARD" enable row level security;

-- _inst_id (1 rows)
revoke all on public."_inst_id" from anon;
revoke all on public."_inst_id" from authenticated;
alter table public."_inst_id" enable row level security;

-- departments (1 rows)
revoke all on public."departments" from anon;
revoke all on public."departments" from authenticated;
alter table public."departments" enable row level security;

-- estate_neighbours (970 rows)
revoke all on public."estate_neighbours" from anon;
revoke all on public."estate_neighbours" from authenticated;
alter table public."estate_neighbours" enable row level security;

-- hashtags (0 rows)
revoke all on public."hashtags" from anon;
revoke all on public."hashtags" from authenticated;
alter table public."hashtags" enable row level security;

-- hbb_ga_calendar (120 rows)
revoke all on public."hbb_ga_calendar" from anon;
revoke all on public."hbb_ga_calendar" from authenticated;
alter table public."hbb_ga_calendar" enable row level security;

-- hbb_ga_upload_history (21 rows)
revoke all on public."hbb_ga_upload_history" from anon;
revoke all on public."hbb_ga_upload_history" from authenticated;
alter table public."hbb_ga_upload_history" enable row level security;

-- hbb_ga_upload_warnings (0 rows)
revoke all on public."hbb_ga_upload_warnings" from anon;
revoke all on public."hbb_ga_upload_warnings" from authenticated;
alter table public."hbb_ga_upload_warnings" enable row level security;

-- hbb_incentive_bands (16 rows)
revoke all on public."hbb_incentive_bands" from anon;
revoke all on public."hbb_incentive_bands" from authenticated;
alter table public."hbb_incentive_bands" enable row level security;

-- installer_locations_2026_w13 (0 rows)
revoke all on public."installer_locations_2026_w13" from anon;
revoke all on public."installer_locations_2026_w13" from authenticated;
alter table public."installer_locations_2026_w13" enable row level security;

-- installer_locations_2026_w14 (0 rows)
revoke all on public."installer_locations_2026_w14" from anon;
revoke all on public."installer_locations_2026_w14" from authenticated;
alter table public."installer_locations_2026_w14" enable row level security;

-- installer_locations_archive (6 rows)
revoke all on public."installer_locations_archive" from anon;
revoke all on public."installer_locations_archive" from authenticated;
alter table public."installer_locations_archive" enable row level security;

-- installers_availability (109 rows)
revoke all on public."installers_availability" from anon;
revoke all on public."installers_availability" from authenticated;
alter table public."installers_availability" enable row level security;

-- kv_store_9ea3f468 (0 rows)
revoke all on public."kv_store_9ea3f468" from anon;
revoke all on public."kv_store_9ea3f468" from authenticated;
alter table public."kv_store_9ea3f468" enable row level security;

-- kv_store_c9fd4e51 (0 rows)
revoke all on public."kv_store_c9fd4e51" from anon;
revoke all on public."kv_store_c9fd4e51" from authenticated;
alter table public."kv_store_c9fd4e51" enable row level security;

-- kv_store_e446c708 (1556 rows)
revoke all on public."kv_store_e446c708" from anon;
revoke all on public."kv_store_e446c708" from authenticated;
alter table public."kv_store_e446c708" enable row level security;

-- odu_call_logs (0 rows)
revoke all on public."odu_call_logs" from anon;
revoke all on public."odu_call_logs" from authenticated;
alter table public."odu_call_logs" enable row level security;

-- odu_inactive_customers (0 rows)
revoke all on public."odu_inactive_customers" from anon;
revoke all on public."odu_inactive_customers" from authenticated;
alter table public."odu_inactive_customers" enable row level security;

-- point_config (0 rows)
revoke all on public."point_config" from anon;
revoke all on public."point_config" from authenticated;
alter table public."point_config" enable row level security;

-- program_column_presets (3 rows)
revoke all on public."program_column_presets" from anon;
revoke all on public."program_column_presets" from authenticated;
alter table public."program_column_presets" enable row level security;

-- regions (17 rows)
revoke all on public."regions" from anon;
revoke all on public."regions" from authenticated;
alter table public."regions" enable row level security;

-- shujaas (10 rows)
revoke all on public."shujaas" from anon;
revoke all on public."shujaas" from authenticated;
alter table public."shujaas" enable row level security;

-- streaks (0 rows)
revoke all on public."streaks" from anon;
revoke all on public."streaks" from authenticated;
alter table public."streaks" enable row level security;

-- submission_exports (0 rows)
revoke all on public."submission_exports" from anon;
revoke all on public."submission_exports" from authenticated;
alter table public."submission_exports" enable row level security;

-- user_challenges (0 rows)
revoke all on public."user_challenges" from anon;
revoke all on public."user_challenges" from authenticated;
alter table public."user_challenges" enable row level security;

-- van_calendar_conflicts (0 rows)
revoke all on public."van_calendar_conflicts" from anon;
revoke all on public."van_calendar_conflicts" from authenticated;
alter table public."van_calendar_conflicts" enable row level security;

commit;
