# Security Remediation Runbook: close the anon-key credential exposure

Status: DRAFT for review. Nothing here has been applied to the live database or deployed.
Prepared: 2026-08-12. Owner: [assign].

## 1. The vulnerability (verified 2026-08-12 with the live anon key)

The public anon key (present in the JS bundle) can read staff PII and plaintext PINs
directly from the REST API. Confirmed readable by anon:

| Table | Rows | Credential columns exposed to anon |
|---|---|---|
| `app_users` | ~2,604 | `pin` (plaintext), `pin_hash`, `password_hash` |
| `DSE_14TOWNS` | ~2,216 | `pin` |
| `HBB_HQ_TEAM` | HQ | `pin` |
| `installers` | ~110 | `pin` |
| `airtelmoney_agents` | 5 | `pin` |
| `agents_HBB`, `installer_supervisor`, `INHOUSE_INSTALLER_6TOWNS_MARCH`, `HBB_INSTALLER_GA_MONTHLY`, `AIRTELMONEY_HQ` | various | `pin` / `PIN` / `Supervisor PIN` |

Already protected (RLS cut-over done): `odu_inactive_customers` (401), `odu_staff` (0 rows to anon).

Attack path: read `app_users?select=phone_number,pin`, then log in as any user including
director / admin / HQ. Compounded by a universal default PIN `1234` and disabled forced
change (`LoginPage.tsx` `interceptDefaultPin()` returns `false`). Net effect: full account
takeover of the platform.

## 2. Why there is no SQL-only shortcut

The app reads these tables directly with the anon key in ~166 places across ~63 files,
and 165 of those calls use `select('*')`. Any revoke of anon access, whether table-level
or column-level, breaks every dashboard, leaderboard, directory and profile that reads
these tables. The fix is therefore a coordinated cut-over, not a single migration.

## 3. What already exists (do not rebuild)

- `identities` table: blind-index login (`login_index = HMAC(msisdn, PEPPER)`) and peppered
  PIN hash (`secret_hash`). ~1,581 identities backfilled (sales / `app_users` population).
- Edge functions (written; deploy status to confirm):
  - `auth-login` and `se-login`: verify against `identities`, issue a JWT signed with the
    project JWT secret so PostgREST treats the caller as `authenticated`.
  - `login`: legacy server-side HBB lookup (service role) covering `agents_HBB`,
    `installers`, `HBB_HQ_TEAM` with plaintext PIN compare.
- `app_users` sealed PII columns already exist (`full_name_ct`, `email_ct`, `phone_number_ct`,
  `pii_sealed_at`); `se-login` unseals the caller's own name.

Coverage gap: `identities` covers sales only. HBB (`DSE_14TOWNS`, `installer_supervisor`,
`INHOUSE_INSTALLER_6TOWNS_MARCH`, GA monthly) and Airtel Money are NOT in `identities`, and
the client still checks them in the browser (`checkDSETable`, `checkInstallerSupervisorTable`,
`checkHQTeamTable`, `checkUnifiedInstallersTable`, `checkGAMonthlyTable`, `checkInstallerTable`).

## 4. Staged plan

### Stage 0 - Prerequisites
- Deploy `auth-login`, `se-login`, `login`, `storage-signed-url`.
- Set function secrets: `PRIVACY_PEPPER`, `PROJECT_JWT_SECRET` (NOT `SUPABASE_JWT_SECRET`,
  which the platform drops), and confirm `SUPABASE_SERVICE_ROLE_KEY`.
- Decide HBB/AM auth model: either (a) extend the `identities` backfill to cover HBB and
  Airtel Money populations (preferred, gives hashed PINs everywhere), or (b) keep the
  legacy server-side `login` function for HBB/AM (service role, plaintext compare) for now
  and hash later. Either way the browser stops reading these tables for login.

### Stage 1 - Move all login PIN checks server-side
- Extend the server login coverage so every table the client currently checks in the
  browser is checked server-side instead: add `DSE_14TOWNS`, `installer_supervisor`,
  `INHOUSE_INSTALLER_6TOWNS_MARCH`, `HBB_INSTALLER_GA_MONTHLY`, `AIRTELMONEY_HQ`.
- In `LoginPage.tsx handleLogin`, remove the client-side `check*` steps (2, 2b, 2c, 2c-2,
  2d, 2e) and route each mode entirely through its server function (`runSalesLogin` ->
  se-login; `runHbbLogin` -> extended `login`; `runAMLogin` -> server AM login).
- Keep the returned user shapes identical (role, `source_table`, `town_id`, HBB HQ role
  normalisation `"HBB HQ"` -> `hbb_hq`, etc.) so downstream routing is unchanged.
- Result: the browser no longer fetches any PIN. (Anon can still read the tables until
  Stage 3; this stage is a prerequisite, not the closure.)

### Stage 2 - Authenticate the client for all reads
- On successful login, store the issued JWT and attach it to the Supabase client
  (`global.headers.Authorization = 'Bearer <token>'`, or `supabase.auth.setSession`), so
  every subsequent request runs as `authenticated`, not `anon`.
- Audit the ~63 files that read these tables; confirm they use the authenticated client.
  (Generate the list with: grep for `.from('app_users'|'installers'|'HBB_HQ_TEAM'|
  'DSE_14TOWNS'|'airtelmoney_agents'|...)` under `src/`.)

### Stage 3 - Apply RLS + lockdown (staging first)
- Apply `supabase/migrations/20260812_credential_tables_lockdown.sql` in STAGING.
- Full regression pass: every role logs in; dashboards, leaderboards, directories,
  profiles, program analytics, developer tools all load.
- Verify as anon that all listed tables now 401. Verify as authenticated that
  non-credential reads still work.

### Stage 4 - Production cut-over (maintenance window)
- Deploy client + functions, apply the migration, run Section B (null then drop plaintext
  PIN columns).
- Re-enable forced PIN change (`interceptDefaultPin`) and give GA-monthly installers a real
  credential (they are currently hardcoded to `1234` with no PIN column).
- Run the zero-PII attestation (`scripts/privacy/attestation.mjs`); it must now report PASS.

## 5. Rollback
- Client and functions: redeploy previous build.
- Database: the lockdown migration is wrapped in a transaction; before Section B (the
  destructive null/drop) take a snapshot. To roll back Section A, `DISABLE ROW LEVEL
  SECURITY` and re-`GRANT SELECT ... TO anon` on each table. Section B (dropped columns)
  is only recoverable from the snapshot, so keep them nulled (not dropped) until fully
  confident.

## 6. Independent hardening (can proceed in parallel, lower risk)
- Re-enable forced PIN change once PINs are server-side.
- Audit the ~20 edge functions running `verify_jwt = false` for their own auth (the commit
  "Audit every Edge Function running with verify_jwt = false" started this).
- Rotate `PRIVACY_PEPPER` handling toward a managed KMS.

## 7. Related documents
- `Airtel_Champions_App_ShadowIT_VM_Approval.docx` (Section 10 controls, Section 12 migration).
- Zero-PII migration notes and `privacy-evidence/PRIVACY_EVIDENCE_PACK.md`.
