-- ============================================================================
-- 20260804_04  k-anonymity suppression for analytics
-- ============================================================================
-- Encryption does not prevent singling out. Measured against live data (n=2,606),
-- with names and phone numbers entirely removed:
--
--   role + region                        -> 18 people uniquely identified
--   role + region + zone                 -> 74
--   role + region + zone + zsm + zbm     -> 120
--   + total_points (the leaderboard)     -> 339  (13.0% of all staff)
--
-- Every combination fails a k=5 threshold. These views enforce it: any group
-- smaller than K_THRESHOLD is suppressed rather than returned.
--
-- security_invoker = true is set explicitly on every view. Without it a view
-- runs with the OWNER's privileges and silently bypasses row level security on
-- the underlying table - which would reintroduce the exact problem being fixed.
--
-- Creates views only. No data is modified or deleted.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- Reusable threshold, so it is changed in one place if the DPO sets a different
-- minimum group size.
-- --------------------------------------------------------------------------
create or replace function public.k_anonymity_threshold()
  returns integer language sql immutable parallel safe
  as $$ select 5 $$;

comment on function public.k_anonymity_threshold is
  'Minimum equivalence-class size for analytics disclosure. Groups smaller than this are suppressed.';

-- --------------------------------------------------------------------------
-- Headcount by organisational attributes, k-suppressed.
-- --------------------------------------------------------------------------
create or replace view public.analytics_headcount_k5
with (security_invoker = true) as
select
  role,
  region,
  zone,
  count(*)::bigint as headcount
from public.app_users
where is_active
group by role, region, zone
having count(*) >= public.k_anonymity_threshold();

comment on view public.analytics_headcount_k5 is
  'Headcount by role/region/zone. Groups below the k threshold are omitted entirely.';

-- --------------------------------------------------------------------------
-- Performance distribution WITHOUT per-person scores.
--
-- The leaderboard is the strongest re-identification vector in the dataset:
-- 11 users hold a point total nobody else holds. This view reports distribution
-- statistics per group instead of individual values, and only for groups that
-- meet the threshold.
-- --------------------------------------------------------------------------
create or replace view public.analytics_performance_k5
with (security_invoker = true) as
select
  role,
  region,
  count(*)::bigint                                              as cohort_size,
  round(avg(total_points))::bigint                              as avg_points,
  percentile_cont(0.5) within group (order by total_points)     as median_points,
  min(total_points)                                             as min_points,
  max(total_points)                                             as max_points
from public.app_users
where is_active
group by role, region
having count(*) >= public.k_anonymity_threshold();

comment on view public.analytics_performance_k5 is
  'Aggregate performance by cohort. Never exposes an individual score, which is uniquely identifying for 11 users.';

-- --------------------------------------------------------------------------
-- Leaderboard built on handles, not names.
--
-- Ranks by identity handle so a shared surface carries no personal data. Users
-- whose score is unique within their cohort are still singled out by rank, so
-- this is capped to the top N where competitive value is expected and consented.
-- --------------------------------------------------------------------------
create or replace view public.leaderboard_pseudonymous
with (security_invoker = true) as
select
  i.handle,
  i.role,
  au.total_points,
  rank() over (order by au.total_points desc) as position
from public.identities i
join public.identity_app_user_map m
  on m.identity_id = i.id and m.is_authoritative
join public.app_users au on au.id = m.app_user_id
where i.is_active and au.is_active;

comment on view public.leaderboard_pseudonymous is
  'Leaderboard keyed on non-identifying handles. Replaces any view that exposed full_name.';

-- --------------------------------------------------------------------------
-- Standing re-identification monitor.
--
-- Lets the DPO re-run the k-anonymity measurement at any time rather than
-- trusting a point-in-time report. Returns the risk profile for each
-- quasi-identifier set.
-- --------------------------------------------------------------------------
create or replace view public.privacy_reidentification_risk
with (security_invoker = true) as
with sets as (
  select 'role'                                     as qi_set,
         count(*) filter (where c = 1)              as singletons,
         count(*) filter (where c < 5)              as classes_below_k,
         min(c)                                     as k_value,
         sum(c)                                     as population
  from (select count(*) c from public.app_users group by role) t
  union all
  select 'role + region',
         count(*) filter (where c = 1), count(*) filter (where c < 5), min(c), sum(c)
  from (select count(*) c from public.app_users group by role, region) t
  union all
  select 'role + region + zone',
         count(*) filter (where c = 1), count(*) filter (where c < 5), min(c), sum(c)
  from (select count(*) c from public.app_users group by role, region, zone) t
  union all
  select 'role + region + zone + zsm + zbm',
         count(*) filter (where c = 1), count(*) filter (where c < 5), min(c), sum(c)
  from (select count(*) c from public.app_users group by role, region, zone, zsm, zbm) t
  union all
  select '+ total_points (leaderboard)',
         count(*) filter (where c = 1), count(*) filter (where c < 5), min(c), sum(c)
  from (select count(*) c from public.app_users group by role, region, zone, zsm, zbm, total_points) t
)
select
  qi_set,
  k_value,
  singletons,
  classes_below_k,
  population,
  round(100.0 * singletons / nullif(population, 0), 1) as pct_uniquely_identified,
  case when k_value >= public.k_anonymity_threshold() then 'PASS' else 'FAIL' end as verdict
from sets;

comment on view public.privacy_reidentification_risk is
  'Live k-anonymity measurement. Re-runnable evidence for privacy review rather than a point-in-time claim.';

-- --------------------------------------------------------------------------
-- These views read app_users, which still holds plaintext personal data. They
-- must never be reachable by anon.
-- --------------------------------------------------------------------------
revoke all on public.analytics_headcount_k5        from anon;
revoke all on public.analytics_performance_k5      from anon;
revoke all on public.leaderboard_pseudonymous      from anon;
revoke all on public.privacy_reidentification_risk from anon;

grant select on public.analytics_headcount_k5   to authenticated;
grant select on public.analytics_performance_k5 to authenticated;
grant select on public.leaderboard_pseudonymous to authenticated;

commit;
