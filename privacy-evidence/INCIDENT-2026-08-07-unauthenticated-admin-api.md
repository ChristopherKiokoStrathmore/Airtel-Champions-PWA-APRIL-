# Security exposure notification: unauthenticated administrative API

**To:** Data Protection Officer; Legal; OpCo IT Director
**From:** Airtel Champions Sales Platform, engineering
**Date raised:** 2026-08-07
**Classification:** Airtel Internal
**Status at time of writing:** Exposure confirmed live. Remediation prepared, not yet deployed.

---

## 1. Why you are receiving this now

This is being reported **before** remediation is deployed, not after. The finding
was made today during a self-initiated security review conducted ahead of a
Shadow IT Policy submission. No third party reported it.

`[Likely]` Kenya Data Protection Act 2019 s.43 measures the notification window
from the point of **awareness**, not from the point of fix. Awareness is
2026-08-07. This document exists so that the time of awareness is recorded
accurately and so that Legal can begin the notifiability assessment immediately
rather than after engineering work concludes.

**No determination of notifiability is made in this document.** That is a legal
assessment, not an engineering one. What follows is fact.

---

## 2. What was found

A Supabase Edge Function, `make-server-e446c708`, is deployed and reachable on
the public internet with JWT verification disabled.

| Property | Value |
|---|---|
| Function | `make-server-e446c708` |
| Configuration | `verify_jwt = false` (`shared/supabase/config.toml`) |
| Source | `shared/supabase/functions/server/index.tsx` |
| Total HTTP routes | 93 |
| Routes with any authorisation check | 7 |
| **Routes with no authorisation check** | **86** |
| Database credential used | `SUPABASE_SERVICE_ROLE_KEY`, which bypasses Row Level Security entirely |
| Client call sites | 113 |

### 2.1 The 86 unauthenticated routes

These execute with no caller identity check of any kind. They include state
changing operations. One example, verifiable in source:

```
app.post("/make-server-e446c708/admin/cleanup-vans", ...)   // no auth check
```

### 2.2 The 7 "protected" routes are also bypassable

The sole authorisation helper is `verifyDeveloper()` at line 1216:

```js
const accessToken = c.req.header("Authorization")?.split(" ")[1];
if (!accessToken) return c.json({ error: "Missing authorization token" }, 401);
// token is checked for PRESENCE only. It is never validated.

const phone = c.req.header("X-User-Phone");   // supplied by the caller
if (phone === "0785638462") return { userId: phone };   // hardcoded exemption
```

Two independent defects:

1. The bearer token is never verified. Any non-empty string satisfies it.
2. Authorisation is decided from `X-User-Phone`, a request header the caller
   controls. A caller may assert any identity, including the hardcoded value
   above or the phone number of any account holding the `developer` role.

The application's own client code sends the **public** API key as the bearer
token (`FeatureTestPanel.tsx:252`), confirming that no secret is required.

---

## 3. Evidence of exposure

Verified 2026-08-07 from outside the application, using only the public API key
that ships in the browser bundle and is extractable by any visitor:

```
GET /functions/v1/make-server-e446c708/db-admin/tables
    Authorization: Bearer <public anon key>

HTTP 401  {"error":"Missing user phone header"}
```

The 401 is the finding, not a refusal. It proves the request passed the platform
authentication layer and reached application code, where the only remaining
check is a header the caller writes.

**The exposure was confirmed without being exercised.** The `X-User-Phone`
header was deliberately not sent. No data was accessed, altered, or exfiltrated
during this verification. No exploitation was performed.

---

## 4. Data within reach

The service-role credential bypasses Row Level Security, so the practical reach
is the whole database:

| Data | Volume |
|---|---|
| Sales staff records (`app_users`) | 2,606 |
| Third-party retailer records (`retailer_dump_full`) | 125,758 |
| Submissions | 183,778 |
| Activity logs | 10,971 |

Categories include name, phone number, employee ID, email, organisational
placement and performance data.

---

## 5. Duration of exposure

**Not yet established.** Determining when `verify_jwt = false` was first
deployed requires deployment history from Supabase and the git history of
`shared/supabase/config.toml`. This is being retrieved.

`[Guessing]` The function predates the 2026-08-04 privacy remediation and was
not in scope of it, because that work covered the field PWA and this function
belongs to the HQ dashboard. The exposure is therefore likely to be measured in
months rather than days.

---

## 6. Whether it was accessed

**Unknown at the time of writing, and this is the most important open question.**

Supabase retains Edge Function request logs. A query for requests to
`make-server-e446c708` carrying an `X-User-Phone` header, or originating from
unrecognised clients, would establish whether the exposure was ever exercised.

**These logs age out.** Retrieving them is time-critical and materially changes
the notifiability assessment in either direction. This is being actioned as a
priority and the result will follow as an addendum.

---

## 7. Remediation

Prepared on branch `hardening/phase-0`, not yet deployed, pending your
acknowledgement of this notice.

| Step | Effect |
|---|---|
| Set `verify_jwt = true` and redeploy | Closes all 93 routes at the platform layer immediately |
| Rewrite `verifyDeveloper()` | Validates the token and derives identity from it, never from a client header |
| Remove the hardcoded phone exemption | Removes the fixed backdoor identity, in this function and in 6 other locations |
| Add authorisation middleware | Extends coverage from 7 routes to all 93 |
| Rotate `SUPABASE_SERVICE_ROLE_KEY` | The credential must be treated as potentially exposed |

**Accepted operational consequence.** The dashboard currently holds no valid
session token and sends the public key instead. Enforcing JWT verification will
therefore take the dashboard's server-backed features offline until server-side
token issuance is implemented. This outage has been accepted deliberately: an
administrative interface being unavailable is preferable to it being open.

---

## 8. What is requested

1. **Legal:** begin the s.43 notifiability assessment. Awareness date is
   2026-08-07.
2. **DPO:** confirm whether the Office of the Data Protection Commissioner
   should be notified, and by when.
3. **OpCo ITD:** note that this was found and reported by the business function
   under Shadow IT Policy section 8(a), ahead of the section 7 quarterly
   assessment.
4. **All:** acknowledge receipt so the remediation deployment can proceed.

---

## 9. Related

This finding sits alongside the pre-existing disclosures in
`privacy-evidence/PRIVACY_EVIDENCE_PACK.md` section 6. It is a **separate and
additional** exposure, in a different codebase (the HQ dashboard rather than the
field PWA), and was not covered by the 2026-08-04 remediation.

The public API key also still returns rows from `app_users`, `submissions` and
`activity_logs`, verified 2026-08-07. That is the previously disclosed and
tracked Row Level Security gap, not a new finding.
