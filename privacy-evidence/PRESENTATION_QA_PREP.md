# Presentation prep — Sales side

**Audience:** IT Service Delivery Manager + Data Protection Officer
**Date:** 2026-08-05
**Scope:** Sales programme only (2,558 staff accounts across SE / ZSM / ZBM roles)

---

## Read this first

Three questions are likely to be asked, and all three have answers you will not
enjoy giving. Prepare them properly — being caught improvising on any of these
costs more credibility than the underlying gaps do.

### 1. "Is the data anonymised?"

**Answer: No. It is pseudonymised and encrypted.**

Say this before anyone else says it. Anonymisation under the Kenya Data
Protection Act 2019 is irreversible and takes data out of scope of the Act.
Your app shows users their own name, so it is reversible by design and remains
personal data. If you say "anonymised" and the DPO knows the definition, every
other claim you make gets re-examined.

What to say instead:

> "Personal data is pseudonymised at rest and encrypted with a key held outside
> the database. Nobody with database access — including our hosting provider or
> anyone holding a stolen backup — can read a name. Plaintext exists only inside
> an authenticated session, and every decryption is logged."

### 2. "Where is the data hosted?"

**Answer: Ireland (AWS eu-west-1).**

This is the hardest question in the room and it is a legal one, not a technical
one. Kenyan personal data is stored outside Kenya. `[Likely]` Kenya DPA 2019
ss.48–49 restricts cross-border transfer unless there are appropriate safeguards,
the data subject consents, or one of the listed exceptions applies. There is also
a data-localisation angle for certain categories under the 2021 Regulations.

Do not attempt to argue this. Say:

> "Postgres is in AWS eu-west-1. I am aware ss.48–49 govern cross-border
> transfer and I have flagged it for Legal to confirm the lawful basis and
> whether a localisation requirement applies. It is on the register as an open
> item, not something we have concluded on."

Have ready: whether Airtel Kenya has an existing group position on EU-hosted
processors, since that may already resolve it.

### 3. "Has there been a breach?"

**Answer: Personal data was accessible without authorisation. Legal has to
classify it.**

Do not minimise this and do not volunteer a legal conclusion. What is factual:

- Until 2026-08-04 the public API key — which ships in the browser bundle —
  could read roughly 176,000 rows including 2,606 staff records
- The same key could insert, update and delete
- PINs were stored in plaintext; 973 of 1,000 sampled were `1234`
- `pin_hash` was not a hash: it was base64 of `"1234"` for every row
- `se_login()` contained `IF input_pin = '1234'` and never checked the stored
  PIN — anyone knowing a staff phone number could authenticate as that person
- 33 personal photos were downloadable with no credential at all

All are now closed. `[Likely]` Kenya DPA 2019 s.43 requires ODPC notification
within 72 hours of becoming aware. **The clock started when this was
discovered, not when it was fixed.** Whether it is notifiable absent evidence of
exfiltration is Legal's call.

Bring this yourself rather than being asked. Discovering-and-fixing reads as
competence; being caught concealing it does not.

**Action before the meeting:** Supabase retains request logs. Ask whether the
exposed endpoints were accessed by unrecognised clients. Logs age out, and this
evidence materially changes the notification assessment.

---

## DPO questions

### Lawful basis and minimisation

**"What personal data do you hold on sales staff, and why?"**
Name, phone number, employee ID, email (749 of 2,606), organisational placement
(region / zone / ZSM / ZBM), performance points, submission history. Basis is
most likely performance of the employment contract plus legitimate interest in
managing a sales incentive programme — confirm with Legal, do not assert it.

**"Do you collect more than you need?"**
Honest answer: some. `zbm` held manager names, now digested. 346 accounts are
synthetic placeholder records from a bulk import that nobody has ever used —
identified and quarantined, pending HR review.

**"What about location data?"**
Be careful. `gps_tracking_consent` is **true for 0 of 2,606 users**, and location
tables exist in the schema. If any tracking is active for sales staff, it is
running without recorded consent. Verify before the meeting and be ready to say
whether the sales programme uses it at all.

### Retention

**"What is your retention policy?"**
There isn't one yet. Say so. Current oldest data:

| Table | Oldest | Rows |
|---|---|---|
| `submissions` | Jan 2026 | 183,778 |
| `activity_logs` | Apr 2026 | 10,971 |
| `app_users` | Jan 2026 | 2,606 |

Proposing a policy in the meeting is much better than being asked why you don't
have one.

### Data subject rights

**"How does a sales executive request their data, or ask for it to be erased?"**
No process exists today. This is a gap and will be asked. A right-of-access
request would currently be handled manually.

Worth noting in your favour: because names are now encrypted with an external
key, **erasure is technically clean** — destroying the ciphertext renders the
record unreadable permanently.

### Processors

**"Do you have data processing agreements with Supabase and Vercel?"**
`[Likely]` Kenya DPA 2019 s.42 requires a written contract with any processor.
Both offer standard DPAs. Check whether they have been executed; if not, that is
a concrete action item.

### The one they will probe hardest

**"You say the database has no names, but the app displays them. Explain."**

> "Names are stored only as AES-256-GCM ciphertext. The key is not in the
> database — it lives in the application environment. When a signed-in user
> loads a screen, an authenticated server-side function decrypts the names that
> screen needs and logs the access. A database administrator, our hosting
> provider, or anyone with a backup sees ciphertext and a pseudonymous handle
> like `SALESE-4BVR8`."

**Follow-up: "So where exactly is the key?"**
An environment variable in the serverless function configuration. **This is your
weakest technical answer.** A managed KMS with rotation and access logging would
be stronger, and it is on the roadmap. Say that plainly rather than overstating
what you have.

### Re-identification

**"If names are removed, can people still be identified?"**
Yes, partially, and you should present the number before they find it. Measured
on live data:

| Attributes | Uniquely identified |
|---|---|
| role + region | 18 (0.7%) |
| role + region + zone | 74 (2.8%) |
| + ZSM + ZBM | 120 (4.6%) |
| **+ leaderboard points** | **339 (13.0%)** |

Encryption cannot fix this — the app must display these attributes. Mitigation is
access control plus k≥5 suppression in analytics views, which is built and live.
The live monitor is `privacy_reidentification_risk`; you can run it in front of
them.

---

## IT Service Delivery Manager questions

### Continuity — expect this first

**"Who else can support this?"**
The honest answer appears to be one person. This will be the SDM's primary
concern, ahead of anything about privacy. Have a view on documentation, handover,
and what happens during leave or departure.

**"Is there a staging environment?"**
No. Eight database migrations were applied directly to production on 2026-08-04.
They were transactional, individually verified, and every one has a rollback
script — but there is no pre-production environment. Expect a change-control
challenge.

**"What is your change management process?"**
Currently: commit to `main`, auto-deploy. No tickets, no approvals, no release
notes. Propose something rather than defending the absence.

### Security posture

**"What is your vulnerability position?"**
GitHub reports **69 dependency vulnerabilities — 21 high, 40 moderate, 8 low.**
They will look. Know the number before they say it.

**"Key management?"**
The service-role key and database password both sit in environment
configuration. Rotation policy: none documented. Given credentials were exposed
during the period described above, **rotating the service-role key is worth doing
before the meeting** so you can say it has been done.

**"Access control on the database?"**
Partial, and be precise: 32 tables are fully locked (153,912 rows including
146,694 retailer records). The remaining tables are still reachable by the public
key because 156 places in the app query them directly. That migration is scoped
but not done.

### Operations

**"Backup and recovery? RPO/RTO?"**
Supabase provides automated backups; point-in-time recovery depends on plan
tier. Confirm which you are on and whether a restore has ever been tested. "We
have backups" invites "when did you last restore one?"

**"Monitoring and alerting?"**
No APM, no uptime monitoring, no alerting evident. If the app breaks at 2am, a
user tells you.

**"What is the SLA?"**
None defined. The SDM will want one, or at least a stated target.

**"Is there test coverage?"**
No automated test suite. Verification today was manual and evidence-based —
which is defensible for a remediation, but not a substitute for CI.

### A question they may ask that you can answer well

**"How do you know the security fixes actually work?"**

> "We can demonstrate it rather than assert it."

Run `node scripts/privacy/attestation.mjs` live. It takes the attacker's
position, using only the public key from the browser bundle, and reports what
that key can reach. It exits non-zero if any control fails. Offer to let their
team run it themselves — that lands far better than a slide.

Be aware it will currently report **2 controls PASS, 2 FAIL.** That is honest and
correct: the failures are the tables still pending the client migration. Show it
anyway. A tool that only ever prints green is not evidence.

---

## What you can state confidently

| Control | Evidence |
|---|---|
| Authentication is server-side | Phone and PIN never reach the database; it sees a 256-bit opaque index |
| Credentials are not recoverable | PBKDF2 over an HMAC-peppered PIN; the pepper is not in the database |
| Auth bypass eliminated | `IF input_pin = '1234'` removed and verified closed |
| Staff names not readable at rest | 2,590 of 2,590 digested; emails and manager names likewise |
| Nothing was destroyed | Originals AES-256-GCM encrypted; decrypt round-trip verified |
| Photos not publicly accessible | 33 of 33 return 400 to the public key; 0 enumerable |
| Account enumeration prevented | Unknown number and wrong PIN return identical errors |
| Brute force limited | Lockout after 5 attempts |
| Access is attributable | Every login and every name decryption written to `auth_audit` |
| Duplicate identities resolved | 664 merges, each recorded with justification; no rows deleted |
| Re-identification measured | Live, re-runnable — not a point-in-time claim |

---

## Open items — present these yourself

1. `phone_number` still plaintext — deliberately deferred; 211 code references need migrating first
2. 99 tables still reachable by the public key — needs 156 client read-sites migrated
3. Cross-border transfer position (Ireland) — with Legal
4. s.43 breach notification assessment — with Legal, time-bound
5. No DPIA — `[Likely]` required under s.31 for this processing
6. No ROPA — `[Likely]` required under s.31
7. No retention policy
8. No data-subject-rights process
9. Encryption key in environment config, not a managed KMS
10. **1,570 of 1,581 accounts still carry a default PIN** — forced reset needed
11. `retailer_dump_full` (125,758 third-party records) — separate lawful basis, unassessed
12. 69 dependency vulnerabilities

A list you volunteer reads as control. The same list extracted from you reads as
discovery.

---

## Questions to ask them

Turning it into a working session beats being interrogated:

1. Does Airtel Kenya have a group position on EU-hosted processors, or does this need its own transfer assessment?
2. Who signs off the s.43 notification decision, and by when?
3. What retention period does Airtel apply to sales performance data?
4. Is there an existing DPIA template, or do we start from the ODPC guidance?
5. What SLA tier should this sit at, and does that change the hosting decision?
6. Who owns data-subject requests operationally — HR, Legal, or this team?

---

## Before you walk in

- [ ] Rotate the Supabase service-role key
- [ ] Confirm whether GPS tracking is active for sales staff (consent is recorded for 0 users)
- [ ] Pull Supabase request logs for the exposure window — they age out
- [ ] Check whether Supabase and Vercel DPAs are executed
- [ ] Confirm the production URL is publicly reachable (preview URLs sit behind Vercel SSO)
- [ ] Test `scripts/privacy/attestation.mjs` runs cleanly on the machine you present from
- [ ] Have `privacy-evidence/PRIVACY_EVIDENCE_PACK.md` open

**Do not seal `phone_number` before this meeting.** It touches 211 code
references and would risk digests appearing on screen mid-demo. It is a
15-minute change afterwards.
