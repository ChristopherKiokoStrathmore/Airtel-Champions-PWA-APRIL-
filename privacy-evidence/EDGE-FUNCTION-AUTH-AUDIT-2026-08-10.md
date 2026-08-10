# Edge Function authentication audit

**Date:** 2026-08-10
**Scope:** `supabase/functions/` in the Airtel Champions PWA repository
**Method:** static review of every function listed in `supabase/config.toml` with
`verify_jwt = false`, plus enumeration of their route surfaces and their use of
the Supabase service-role key. No live probing was performed for this audit.
**Related:** `INCIDENT-2026-08-07-unauthenticated-admin-api.md` covers the same
class of finding in the HQ Command Center repository.

---

## Summary

Eleven functions are declared in `supabase/config.toml`. All eleven carry
`verify_jwt = false`, meaning the Supabase gateway does not require a valid JWT
and forwards the request to the function regardless of who sent it.

Of those eleven, four are HBB and are recorded here for completeness only. They
were not modified, per the standing instruction to leave HBB and Airtel Money
alone. Seven are in scope.

Across the seven, **49 HTTP routes accept unauthenticated requests**, and
**five of the seven functions hold `SUPABASE_SERVICE_ROLE_KEY`**, which bypasses
row-level security entirely. Two functions are static responders that hold no
secret and touch no data.

| Function | Routes | Service role | Auth check | Data reached | Programme |
|---|---|---|---|---|---|
| `make-server-28f2f653` | 43 | yes | none | programs, submissions, check-in sessions, announcements, staff uploads, schema | Sales |
| `service-requests` | 3 | yes | none | `jobs`, incl. customer name and phone | HBB |
| `auto-allocate` | 1 | yes | none | `jobs`, `allocate_installer` RPC, installer directory | HBB |
| `activity-log` | 1 | yes | none | writes `activity_logs` | Sales |
| `activity-batch` | 1 | yes | none | bulk writes `activity_logs` | Sales |
| `towns` | 1 | no | none | none, static array | HBB |
| `health` | 1 | no | none | none, static response | HBB |

The four remaining `verify_jwt = false` entries (`hbb-auto-allocate`,
`hbb-handle-rejection`, `hbb-installer-by-phone`, `hbb-notifications`) are HBB
and were not reviewed.

Functions **not** listed in `config.toml` default to `verify_jwt = true` and are
therefore gateway-protected: `se-login`, `auth-login`, `login`, `resolve-names`,
`storage-signed-url`. That is the correct posture and should be the target state
for everything above.

---

## Finding 1: `make-server-28f2f653` is a second unauthenticated service-role API

**Severity: critical. Sales programme.**

This is the PWA's main application server. It is a Hono app mounting four route
modules, holding the service-role key, with `verify_jwt = false` and no
authentication middleware of any kind.

Route surface, 43 routes:

- `announcements.tsx`, 5 routes: read, create and delete announcements, mark read
- `programs.tsx`, 18 routes: full CRUD on programmes, read and approve or reject
  submissions, programme analytics, van checkout enforcement toggle, and
  `GET /schema/tables` plus `GET /schema/tables/:tableName/columns`
- `checkin.tsx`, 12 routes: check-in configs and flags, open, save and close
  sessions, van register and van lookup
- `user-upload.tsx`, 6 routes: upload sales force contacts, upload and apply
  Sitewise mapping, go-live, fix-warning, upload history
- health and root, 2 routes

Three properties make this worse than the route count suggests.

**1a. Schema enumeration.** `GET /make-server-28f2f653/schema/tables` returns the
list of tables in the database and `/schema/tables/:tableName/columns` returns
the columns of any named table. An unauthenticated caller can map the schema
before touching data.

**1b. Client-supplied identity.** `checkin.tsx:24`:

```ts
function getUserId(c: any): string | null {
  return c.req.header('X-User-Id') || null;
}
```

Six routes derive the acting user from a header the caller sets. This is the
same defect as the `X-User-Phone` bypass recorded in the 2026-08-07 incident
notice, in a different repository. Any caller can act as any user by changing
one header value.

**1c. Bulk staff data ingest.** `POST /upload-sales-force-contacts` and the
Sitewise mapping routes write staff records. Unauthenticated write access to the
staff directory is a data integrity exposure, not only a confidentiality one.

**Current live state.** The deployed function has been returning `BOOT_ERROR`
and 503, so the routes above are likely not currently serving. That is an
accident of a broken deployment, not a control. The moment it boots
successfully, all 43 routes are open. This must be fixed before it is
redeployed, not after.

**Deployability note.** As of commit `2d5ac8b` the function is buildable again.
Its route modules had been imported from `../../../src/supabase/functions/server/`,
a path outside the `supabase/functions/` root that the Supabase CLI does not
bundle. That is the most likely cause of the `BOOT_ERROR` and is unverified
until a redeploy is attempted. Commit `1938962` had deleted that directory as
dead code, which was wrong; the four modules actually in use were restored into
the function's own directory.

---

## Finding 2: the audit trail is unauthenticated-writable

**Severity: high. Sales programme.**

`activity-log` and `activity-batch` both hold the service-role key and insert
directly into `activity_logs` with no authentication and no validation of who
the caller claims to be. Every field, including `user_id`, `user_name` and
`user_role`, is taken from the request body.

Anyone who knows the URL can write arbitrary entries into the audit log, or
flood it. `activity-batch` accepts an unbounded `events` array in a single call.

This matters beyond the usual integrity argument. `activity_logs` is part of the
evidence base for the Shadow IT submission and for any Kenya DPA accountability
demonstration. An audit trail that any anonymous party can write to is not
evidence of anything.

**Secondary defect.** `activity-log/index.ts` destructures `metadata` with
`const` and then reassigns `finalMetadata` inside the string-parsing branch.
That throws `TypeError: Assignment to constant variable` whenever a client sends
`metadata` as a string, surfacing as a 500. This is a live bug independent of
the security finding.

---

## Finding 3: `service-requests` exposes customer PII unauthenticated

**Severity: high. HBB programme, recorded not remediated.**

`GET /service-requests` returns up to 100 rows from `jobs` with no
authentication, including `customer_name` and `customer_phone`. `POST` creates
jobs. `PUT /:id` updates the status, remarks and completion GPS of any job by
id, with no check that the caller is the assigned installer or an operator.

The function also logs `SUPABASE_URL` and runs a debug `information_schema`
query on every request.

This is HBB and out of scope for changes under the current instruction. It is
recorded here because the DPO submission covers one Supabase project, and a
reviewer will find it. It should be raised with whoever owns HBB.

---

## Finding 4: `auto-allocate` permits unauthenticated allocation

**Severity: medium. HBB programme, recorded not remediated.**

One route, service-role key, no authentication. Takes an `sr_id` and a
`rejected_by` array from the body, calls the `allocate_installer` RPC, and
returns the installer id and name from `INHOUSE_INSTALLER_6TOWNS_MARCH`. An
unauthenticated caller can drive installer assignment and enumerate installer
names by iterating job ids. Same scope note as Finding 3.

---

## Finding 5: `towns` and `health` are open but harmless

**Severity: informational.**

`towns` returns a hardcoded array of 14 town names. `health` returns a static
status object. Neither touches the database or holds a secret. They can stay
`verify_jwt = false` if a genuinely unauthenticated health probe is wanted; the
cleaner outcome is to authenticate them too and keep exactly one documented
unauthenticated route, so that "why is this one open" is never a question a
reviewer has to ask twice.

Note that `towns` duplicates data that the `DSE_14TOWNS` table already holds, and
`health` labels itself `HBB API` while sitting in the Sales repository. Both are
documentation hazards rather than security ones.

---

## Remediation sequence

The order matters. Setting `verify_jwt = true` before the callers can send a real
JWT will break the app.

1. **Do not redeploy `make-server-28f2f653` in its current state.** It is
   buildable again as of `2d5ac8b`, which means the 43 open routes would go live
   the moment someone deploys. Add the authentication middleware first.
2. **Add a fail-closed authentication middleware** to `make-server-28f2f653`,
   matching the pattern applied to the dashboard's `server` function in
   `e5025bc`: validate the bearer token with `supabase.auth.getUser()`, reject
   anonymous tokens, derive identity from the validated token, and delete
   `getUserId`'s use of `X-User-Id`.
3. **Authenticate `activity-log` and `activity-batch`**, derive `user_id`,
   `user_name` and `user_role` from the validated token rather than the body,
   and cap the `activity-batch` array length. Fix the `const` reassignment bug.
4. **Flip `verify_jwt = true`** for the in-scope functions once their callers
   send a session token, and remove the config entries entirely so the secure
   default applies.
5. **Raise Findings 3 and 4 with the HBB owner.** No changes made here.
6. **Re-run the attestation script** and record the result in the evidence pack.

## Cross-reference to policy

Shadow IT Policy v2.0 section 5(f) names absence of code review as a named risk;
these functions are the concrete instance of it. Section 6 requires the AAISP
control set before a solution is used for anything mission-critical. Kenya Data
Protection Act 2019 section 41 requires appropriate technical measures; an
unauthenticated service-role API reaching identifiable staff and customer data
is the clearest possible failure of that duty, and it is the reason the
2026-08-07 notice was raised.
