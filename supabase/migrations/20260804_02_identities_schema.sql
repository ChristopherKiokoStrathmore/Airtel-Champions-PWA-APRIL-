-- ============================================================================
-- 20260804_02  Zero-PII identity store
-- ============================================================================
-- The identities table holds NO personal data:
--
--   login_index  HMAC-SHA256(normalised_msisdn, PEPPER) - the pepper lives in
--                the application environment, never in Postgres. Supports exact
--                -match login lookup but cannot be inverted from a DB dump.
--   secret_hash  PBKDF2-SHA256 over an HMAC-peppered PIN. A 4-digit PIN has
--                only 10,000 values, so peppering (not cost factor) is what
--                makes offline recovery infeasible.
--   handle       Deterministic non-identifying label, e.g. SALESE-AWKDC.
--
-- Nothing here is reversible without a secret the database does not hold.
-- No rows are deleted anywhere by this migration.
-- ============================================================================

begin;

alter table public.identities
  add column if not exists app_user_id        uuid references public.app_users(id),
  add column if not exists is_active          boolean     not null default true,
  add column if not exists must_change_secret boolean     not null default false,
  add column if not exists updated_at         timestamptz not null default now(),
  add column if not exists last_login_at      timestamptz,
  add column if not exists migrated_from      text;

comment on table  public.identities              is 'Zero-PII authentication store. Contains no name, phone, or email.';
comment on column public.identities.login_index  is 'HMAC-SHA256(msisdn, PRIVACY_PEPPER). Pepper is external to the database.';
comment on column public.identities.secret_hash  is 'PBKDF2-SHA256 over an HMAC-peppered PIN. Format: pbkdf2$sha256$<iter>$<salt>$<hash>';
comment on column public.identities.handle       is 'Non-identifying display label. Safe for leaderboards and shared surfaces.';
comment on column public.identities.app_user_id  is 'Opaque UUID link to the legacy profile row. Carries no personal data itself.';

-- Lookup path used by every login. Unique constraint already exists on login_index.
create index if not exists identities_app_user_id_idx on public.identities (app_user_id);
create index if not exists identities_active_idx      on public.identities (is_active) where is_active;

-- --------------------------------------------------------------------------
-- Lock the table down. RLS is already enabled; make the posture explicit.
-- --------------------------------------------------------------------------
alter table public.identities enable row level security;

-- No anon access of any kind. Authentication happens server-side in an Edge
-- Function using the service role; the browser must never read this table.
revoke all on public.identities from anon;
revoke all on public.identities from authenticated;

-- A user may read their own row (once real JWTs exist), and nothing else.
drop policy if exists identities_self_read on public.identities;
create policy identities_self_read on public.identities
  for select to authenticated
  using (id = auth.uid());

-- --------------------------------------------------------------------------
-- Append-only audit of authentication events. Holds no PII - only the opaque
-- identity id - so it is safe to retain for the period the DPO requires.
-- --------------------------------------------------------------------------
create table if not exists public.auth_audit (
  id           bigint generated always as identity primary key,
  identity_id  uuid references public.identities(id),
  event        text        not null,
  succeeded    boolean     not null,
  reason       text,
  ip_hash      text,
  user_agent   text,
  occurred_at  timestamptz not null default now()
);

create index if not exists auth_audit_identity_idx on public.auth_audit (identity_id, occurred_at desc);
create index if not exists auth_audit_time_idx     on public.auth_audit (occurred_at desc);

comment on table public.auth_audit is 'Append-only authentication audit. No personal data: identity_id is opaque and ip_hash is salted.';

alter table public.auth_audit enable row level security;
revoke all on public.auth_audit from anon;
revoke all on public.auth_audit from authenticated;

commit;
