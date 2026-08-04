# Privacy Evidence Pack — Airtel Champions Platform

**Prepared for:** Head of Data Privacy
**System:** Airtel Champions PWA (Supabase project `xspogpfohjmkykfjadhk`, eu-west-1)
**Date:** 2026-08-04
**Status:** Remediation in progress — see §7 for what is complete and what is not

---

## 1. The claim being made

This document does **not** claim the data is anonymised.

Anonymisation under the Kenya Data Protection Act 2019 and GDPR Recital 26 is
*irreversible*, and takes data out of scope of the legislation entirely. This
system must show each user their own details, so the process is by definition
reversible and the data remains personal data. Claiming otherwise would be
inaccurate and would not survive review.

The claim made here is narrower, stronger, and testable:

> Personal data is **pseudonymised and protected by a secret held outside the
> database**. No party with database access — including a database administrator,
> the hosting provider, or the holder of a stolen backup — can recover a name,
> phone number, or credential from stored data. Plaintext exists only transiently,
> in an authenticated session, for the data subject and audited authorised roles.

This corresponds to "appropriate technical and organisational measures" under
Kenya DPA 2019 s.41 and GDPR Art. 32.

**Legal note.** Data that is pseudonymised remains personal data *for the
controller*, who holds the means of reversal. Whether it constitutes personal
data *for a recipient without those means* — the argument that Supabase itself
holds no personal data — has support in *SRB v EDPS* (EU General Court,
T-557/20, April 2023). That judgment was appealed and Airtel Legal should confirm
its current standing before the argument is relied on in any regulatory filing.
It is offered here as supporting reasoning, not as settled law.

---

## 2. Design — why login works without storing a phone number

Authentication is a **recognition** problem, not a retrieval problem. The system
never needs to read a phone number back; it only needs to determine whether the
number just entered matches the one that registered. That does not require
storing it.

```
login_index = HMAC-SHA256( normalise(msisdn), PEPPER )
secret_hash = PBKDF2-SHA256( HMAC-SHA256(pin, PEPPER), salt, 600000 )
```

`PEPPER` is a 256-bit secret held in the application environment. **It is never
written to Postgres.** The database stores a 64-character hex digest and a salted
key-derivation output — neither reversible without the pepper.

Peppering the PIN before derivation is the load-bearing control. A 4-digit PIN
has only 10,000 possible values; no key-derivation cost factor can protect it
against an attacker holding the table. Peppering moves the secret outside the
blast radius of a database compromise entirely.

### The identity record

| Column | Content | Personal data? |
|---|---|---|
| `id` | random UUID | No |
| `login_index` | HMAC digest of the phone number | No — not reversible without the pepper |
| `secret_hash` | salted PBKDF2 output | No |
| `handle` | e.g. `SALESE-AWKDC` | No — derived from the UUID |
| `role` | job function | No |
| `app_user_id` | opaque UUID link to the legacy profile row | No |

There is no name, phone number, email, or national identifier in this table.

---

## 3. Controls

| # | Control | Mechanism |
|---|---|---|
| C1 | Credentials never reach the browser | Authentication performed in an Edge Function; the client posts phone + PIN and receives only a session token |
| C2 | Credentials never reach the database | Phone converted to a blind index and PIN to a peppered hash before any query is issued |
| C3 | Key material is outside the data store | `PRIVACY_PEPPER` held in the deployment environment; absent from Postgres, from backups, and from the browser bundle |
| C4 | Offline attack on PINs is infeasible | Peppering defeats exhaustive search over the 10,000-value PIN space |
| C5 | Personal-data files are not publicly retrievable | Buckets private; all `anon`/PUBLIC storage policies removed; access via short-lived signed URLs only |
| C6 | Access is attributable | Every authentication and every signed-URL issue is recorded in `auth_audit` against an opaque identity id |
| C7 | Merge decisions are auditable | `identity_app_user_map` records every legacy row folded into an identity and why |
| C8 | Non-migrated accounts are justified | `identity_migration_exclusions` records each excluded account with its reason |

---

## 4. Independent verification

The Head of Data Privacy or their delegate can verify these controls without
relying on any statement in this document:

```bash
node scripts/privacy/attestation.mjs
```

The script takes the **attacker's position**. It authenticates using only the
public `anon` key — the same key any visitor can extract from the browser bundle
using developer tools — and reports what that key can actually reach. It performs
reads and non-destructive probes only; it modifies nothing.

It checks:

1. **Readability** — every table that carries or carried personal data, asserting zero rows returned
2. **Writability** — INSERT / UPDATE / DELETE against personal-data tables, asserting all are refused
3. **Storage** — anonymous enumeration of every personal-data bucket, asserting none list content
4. **Structure** — that `identities` contains no identifier-bearing column, that `login_index` is an opaque 256-bit digest, that `secret_hash` is a salted KDF output, that RLS is enabled, and that **the pepper is absent from the database**

Exit code `0` means every control holds. A JSON report is written to
`privacy-evidence/attestation-<date>.json` for the file.

---

## 5. Re-identification risk

Encryption does not address *singling out*. Organisational attributes and
in-app scores are visible by design and cannot be encrypted without breaking
the product. This was measured directly against live data (n = 2,606):

| Quasi-identifiers | k (smallest class) | Uniquely identified |
|---|---|---|
| role + region | 1 | 18 (0.7%) |
| role + region + zone | 1 | 74 (2.8%) |
| role + region + zone + zsm + zbm | 1 | 120 (4.6%) |
| **+ total_points (leaderboard)** | 1 | **339 (13.0%)** |

**Every combination fails a k=5 threshold.** With names and phone numbers
entirely removed, 13% of staff remain identifiable from organisational
attributes plus their public leaderboard score; 11 users hold a point value no
one else holds.

The mitigation is access control and aggregation thresholds, not cryptography:
restrict quasi-identifiers to the data subject and their management chain, and
suppress any analytics group smaller than k=5. **This work is outstanding — see §7.**

---

## 6. Findings from the pre-remediation audit

Recorded here in full. A privacy submission that omits the starting position is
not credible, and these findings bear on notification obligations.

| Finding | Measured state |
|---|---|
| Public key could **read** personal data | 35 tables, ~176,000 rows, incl. 2,606 staff records and 125,758 retailer records |
| Public key could **write** personal data | INSERT / UPDATE / DELETE confirmed on `app_users` and 135 other tables |
| **PINs stored in plaintext** | `pin` column populated for all sampled users; 973 of 1,000 were `1234`; 14 distinct values across 1,000 accounts |
| **`pin_hash` was not a hash** | Value was `MTIzNA==` — base64 of `"1234"` — for 100% of sampled rows |
| RLS defined but never enabled | `app_users` carried **5 policies** with `relrowsecurity = false`; none had ever been enforced |
| Personal-data files publicly retrievable | 33 objects (staff photos, installer job photos, complaint evidence) enumerable and downloadable; 9 of 10 buckets public |
| OTP table publicly readable and writable | `otp_codes` reachable by `anon` — an authentication bypass in its own right |
| Root cause | Authentication was a client-side JavaScript string comparison (`LoginPage.tsx:590`), which required the browser to read PINs, which required RLS to remain open |

### Notification

`[Likely]` Kenya DPA 2019 s.43 requires notification to the Office of the Data
Protection Commissioner within 72 hours of becoming aware of a personal data
breach. Personal data was demonstrably accessible without authorisation. Whether
this constitutes a notifiable breach absent evidence of exfiltration is a legal
determination for Airtel Legal and the ODPC, **not an engineering one**. It is
raised here because the assessment is time-bound and the clock starts at
awareness, not at remediation.

Supporting evidence for that assessment: Supabase retains request logs, which can
establish whether the exposed endpoints were accessed by unrecognised clients.
That query should be run before the logs age out.

---

## 7. Status

| # | Item | State |
|---|---|---|
| 1 | Storage lockdown | **Complete and verified** — 33/33 files return 400 to the public key; buckets holding non-personal data (app bundles, training videos) deliberately remain public |
| 2 | Pepper provisioned, primitives validated | **Complete** — determinism, pepper-dependence, salting and rejection paths all tested |
| 3 | Identity backfill | **In progress** — 1,581 identities from 2,260 usable accounts |
| 4 | Server-side auth Edge Function | **Written, not yet deployed** |
| 5 | Client cut-over | **Not started** |
| 6 | Revoke `anon`, enable RLS | **Not started — requires a maintenance window** |
| 7 | Clear plaintext columns | **Not started** |
| 8 | k-anonymity views and audit log | Audit table created; suppression views **not started** |
| 9 | This pack and the attestation script | **Complete** |

**Until items 5 and 6 are complete, the database remains readable with the public
key.** The attestation script will report Control 1 as FAILED, correctly. It
should be run again after the cut-over, and that run — not this document — is the
evidence.

### Data quality issues surfaced

- **346 accounts hold synthetic placeholder phone numbers.** 96% of adjacent numbers are strictly consecutive; all originate from `import_source = 'sales_force_contacts'`; only 1 of 346 has ever logged in. They are excluded from migration and listed in `identity_migration_exclusions` for HR. No digit was guessed — fabricating one would bind a login to a number that may belong to a real, unrelated subscriber.
- **664 phone numbers mapped to more than one active account** (1,343 users), from repeated imports of the same person under different role labels. Each number now resolves to exactly one identity, chosen by data completeness, with every folded row recorded in `identity_app_user_map`. No rows were deleted.
- **1,570 of 1,581 identities (99.3%) carry a default or weak PIN.** They are flagged `must_change_secret`. A forced PIN change at next login is required; without it, the migration preserves a credential that is effectively public.

---

## 8. Residual risk

Stated plainly, because a pack that claims none is not credible.

1. **Pepper custody is the single point of failure.** Phone numbers are low-entropy; the Kenyan MSISDN space is roughly 10⁸. An attacker holding both the database and the pepper can reverse every blind index by exhaustive search in minutes. The control is not the hash — it is custody. Rotation policy, split knowledge, and access logging on the pepper are required. Moving it to a managed KMS would strengthen this materially and is recommended.
2. **Quasi-identifiers remain.** 13% of staff are re-identifiable from attributes the product must display (§5).
3. **Free-text fields leak.** Approximately 30 `description` / `remarks` / `bio` / `content` columns exist where staff can type real names. No schema control prevents this.
4. **The legacy plaintext columns still exist.** `app_users.pin`, `phone_number`, `full_name`, and `email` remain populated until item 7 runs. The claim in §1 is not fully true until they are cleared.
5. **`retailer_dump_full` (125,758 rows) is third-party data** — not staff. It carries a different lawful basis and has not yet been assessed. It is the largest single body of personal data in the system and warrants its own review.

---

## 9. Recommended next steps

1. Complete items 5–7 in a single maintenance window; re-run the attestation script and file the resulting report.
2. Force a PIN change for all 1,570 flagged identities.
3. Obtain a legal determination on the s.43 notification question, supported by a Supabase access-log review before logs expire.
4. Commission a DPIA (Kenya DPA 2019 s.31) — GPS tracking of staff plus 162,000 third-party records is high-risk processing.
5. Produce a ROPA covering every table, its classification, lawful basis, and retention period.
6. Assess `retailer_dump_full` separately.
7. Move `PRIVACY_PEPPER` to a managed KMS with rotation and access logging.
