-- ============================================================================
-- 20260804_03  Identity merge map
-- ============================================================================
-- 664 phone numbers mapped to more than one active app_users row (1,343 users),
-- caused by the same person being imported repeatedly from different source
-- tables under different role labels (e.g. 'se' vs 'sales_executive').
--
-- Each distinct phone number becomes ONE identity. This table records every
-- legacy app_users row that folded into it, and why one row was chosen as
-- authoritative. Nothing is deleted - the losing rows remain in app_users and
-- simply stop being login targets.
--
-- This is the audit trail for the merge decision.
-- ============================================================================

begin;

create table if not exists public.identity_app_user_map (
  identity_id     uuid        not null references public.identities(id) on delete cascade,
  app_user_id     uuid        not null references public.app_users(id),
  is_authoritative boolean    not null default false,
  richness_score  integer,
  reason          text,
  created_at      timestamptz not null default now(),
  primary key (identity_id, app_user_id)
);

create index if not exists identity_map_app_user_idx on public.identity_app_user_map (app_user_id);

comment on table public.identity_app_user_map is
  'Audit trail for the phone-duplicate merge. One identity may map to several legacy app_users rows; exactly one is authoritative.';

alter table public.identity_app_user_map enable row level security;
revoke all on public.identity_app_user_map from anon;
revoke all on public.identity_app_user_map from authenticated;

-- Accounts excluded from migration, with the reason. 346 rows are expected:
-- synthetic placeholder phone numbers from the sales_force_contacts import.
create table if not exists public.identity_migration_exclusions (
  app_user_id uuid        not null references public.app_users(id),
  reason      text        not null,
  detail      text,
  excluded_at timestamptz not null default now(),
  primary key (app_user_id)
);

comment on table public.identity_migration_exclusions is
  'Accounts not migrated to the zero-PII identity store, with justification. Review list for HR.';

alter table public.identity_migration_exclusions enable row level security;
revoke all on public.identity_migration_exclusions from anon;
revoke all on public.identity_migration_exclusions from authenticated;

commit;
