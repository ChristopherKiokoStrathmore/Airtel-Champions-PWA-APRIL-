# ODU Retrieval Workflow — Implementation Plan & Guide

**Source:** `odu_workflow_full.svg` (ODU Retrieval Workflow: All Operations & Branches)
**Scope:** Recover ODUs from ~19,000 inactive HBB customers via HQ upload → CX intake → Installer field collection → Warehouse validation → Reconciliation & payment (KSh 600/unit = 300 fare + 300 incentive).
**Date:** 2026-07-13

## Confirmed design decisions
| Decision | Choice |
|---|---|
| IMEI/MAC capture | Barcode scan (`@zxing/browser`) + manual fallback with validation |
| Actors | Two new roles: `hbb_cx`, `hbb_warehouse` (PIN login, own dashboards) |
| Data model | New `odu_*` tables — zero risk to live installation `jobs` flow |
| Payment v1 | In-app reconciliation + Excel/CSV export; paid offline month-end |

## What already exists (reuse, don't rebuild)

| Workflow need | Existing asset | Where |
|---|---|---|
| HQ bulk upload w/ staging, validation, go-live, rollback | GA upload batch system | `hbb-ga-upload-manager.tsx`, `hbb_ga_upload_batches` (migration `20260422_hbb_ga_infrastructure.sql`) |
| Lat/long allocation w/ scoring, radius tiers, optimistic lock, rejection loop | Unified auto-assign engine | `src/components/hbb/hbb-auto-assign.ts` |
| GPS capture on device | `captureCurrentPosition()` | `src/utils/geolocation.ts` |
| Photo capture → Supabase Storage | Completion-photo modal + `installer_photos` bucket | `hbb-installer-dashboard.tsx:1773-1801` |
| PIN login + session | `/login` edge route + `hbb-api.ts` session helpers | `hbb-api.ts:423-436` |
| Role-based routing | `UserRole` union + per-role blocks | `App.tsx:132`, `~770-830`, `~1001-1061`, isHBBUser list at `App.tsx:534` |
| Phone normalization | `normalizeKenyanPhone()` (client) + `normalize_phone()` (SQL) | `hbb-api.ts:48`, GA migration |
| Incentive/config pattern | `HBB_INCENTIVE_BANDS` HQ-editable table | GA migration |
| Notifications | `installer_notifications` + `hbb-notifications.tsx` | existing |
| Audit | `activity_logs` table pattern | `20260402_create_activity_logs_table.sql` |
| Program feature toggle | HQ-controlled program toggle (networks feature) | existing pattern |

## Net-new (nothing to reuse)

1. **Warehouse actor** — role, dashboard, receipt/matching logic.
2. **CX call queue** — work-the-list UI over an uploaded customer list (different from lead creation).
3. **Device identity capture** — IMEI/MAC scan, dedupe registry, installer-vs-warehouse match.
4. **Time-based expiry** — 48h acceptance deadline (no timer exists anywhere in the app today).

---

# Architecture

## Request state machine (`odu_requests.status`)

```
new ──CX call──▶ contacting ──consent──▶ confirmed ──allocate──▶ allocated
 │                   │                       ▲                      │
 │                   └─declines──▶ not_recovered (reason)           ├─ accept ──▶ accepted
 │                                                                  └─ reject / 48h timeout ──▶ confirmed (re-allocate, installer excluded)
accepted ──door refusal──▶ not_recovered
accepted ──devices captured + consent doc──▶ collected
collected ──warehouse match OK──▶ delivered ──recon match──▶ payable ──batch export──▶ paid
collected ──mismatch / duplicate──▶ flagged (HQ resolves → delivered or not_recovered)
delivered ──no inactive-list match──▶ not_paid
```

`not_recovered_reason` enum: `no_funds | network | seasonal | faulty_odu | switched_isp | customer_declined | door_refusal | unreachable | other`.

## Database migration — `supabase/migrations/2026MMDD_odu_retrieval_infrastructure.sql`

```sql
-- 1. Upload batches (clone of hbb_ga_upload_batches semantics)
CREATE TABLE odu_upload_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'staged' CHECK (status IN ('staged','live','rolled_back')),
  total_records int DEFAULT 0,
  warnings_count int DEFAULT 0,
  validation_errors jsonb DEFAULT '[]',
  uploaded_by text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  went_live_at timestamptz, rolled_back_at timestamptz, rolled_back_reason text
);

-- 2. Inactive customer list (the 19,000)
CREATE TABLE odu_inactive_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES odu_upload_batches(id) ON DELETE CASCADE,
  msisdn text NOT NULL,                -- normalize_phone() applied on insert
  customer_name text NOT NULL,
  account_number text,
  town text, estate text,
  lat double precision, lng double precision,
  expected_units int NOT NULL DEFAULT 2,
  original_imei text,                  -- from HQ export if available (strengthens matching)
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT odu_inactive_msisdn_batch_unique UNIQUE (msisdn, batch_id)
);

-- 3. Retrieval requests (one per worked customer)
CREATE TABLE odu_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES odu_inactive_customers(id),
  status text NOT NULL DEFAULT 'new' CHECK (status IN
    ('new','contacting','confirmed','allocated','accepted','collected',
     'delivered','flagged','payable','paid','not_paid','not_recovered')),
  not_recovered_reason text,
  -- CX capture
  cx_phone text, consent_given_at timestamptz,
  capture_estate text, capture_house text, capture_notes text,
  retrieval_date date,
  customer_lat double precision, customer_lng double precision,
  -- Allocation / acceptance
  installer_id bigint REFERENCES installers(id),
  allocated_at timestamptz,
  accept_deadline timestamptz,          -- allocated_at + interval '48 hours'
  accepted_at timestamptz,
  rejected_by bigint[] NOT NULL DEFAULT '{}',
  rejection_count int NOT NULL DEFAULT 0,
  -- Collection
  collected_at timestamptz,
  consent_doc_url text,                 -- signed legal doc photo
  collection_lat double precision, collection_lng double precision,
  -- Warehouse
  warehouse_id uuid, delivered_at timestamptz,
  -- Payment
  payable_amount int,                   -- computed at delivery from odu_config
  payment_batch_id uuid, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX odu_requests_status_idx ON odu_requests(status);
CREATE INDEX odu_requests_installer_idx ON odu_requests(installer_id);
CREATE INDEX odu_requests_deadline_idx ON odu_requests(accept_deadline)
  WHERE status = 'allocated';

-- 4. Devices (2 per request typically)
CREATE TABLE odu_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES odu_requests(id) ON DELETE CASCADE,
  -- Installer capture
  imei text, mac text,
  capture_method text CHECK (capture_method IN ('scan','manual')),
  label_photo_url text,
  captured_by text, captured_at timestamptz,
  -- Warehouse capture
  wh_imei text, wh_mac text,
  wh_capture_method text, wh_captured_by text, wh_captured_at timestamptz,
  match_status text NOT NULL DEFAULT 'pending'
    CHECK (match_status IN ('pending','matched','mismatch','duplicate')),
  flag_notes text
);
-- Duplicate/reuse protection: one delivered device per IMEI, program-wide
CREATE UNIQUE INDEX odu_devices_imei_delivered_unique
  ON odu_devices (imei) WHERE match_status = 'matched';
CREATE INDEX odu_devices_request_idx ON odu_devices(request_id);
CREATE INDEX odu_devices_imei_idx ON odu_devices(imei);

-- 5. Call log (every CX attempt — feeds "Reason logged" box)
CREATE TABLE odu_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES odu_requests(id) ON DELETE CASCADE,
  cx_phone text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN
    ('no_answer','callback_later','confirmed','declined','wrong_number')),
  decline_reason text, notes text,
  callback_at timestamptz,
  called_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Warehouses
CREATE TABLE odu_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, town text NOT NULL,
  lat double precision, lng double precision,
  is_active boolean NOT NULL DEFAULT true
);

-- 7. Payment batches (month-end)
CREATE TABLE odu_payment_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','exported','paid')),
  total_units int DEFAULT 0, total_amount int DEFAULT 0,
  generated_by text, generated_at timestamptz DEFAULT now(),
  exported_at timestamptz, paid_at timestamptz
);

-- 8. Config (HQ-editable, like HBB_INCENTIVE_BANDS)
CREATE TABLE odu_config (
  key text PRIMARY KEY, value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO odu_config VALUES
  ('pay_per_unit',       '{"fare":300,"incentive":300,"total":600}'),
  ('accept_window_hours','48'),
  ('program_enabled',    'false'),
  ('radius_tiers_km',    '[2,5,10]');

-- installers: retrieval opt-in flag (drives TL opt-in loop)
ALTER TABLE installers ADD COLUMN IF NOT EXISTS odu_opt_in boolean NOT NULL DEFAULT false;
```

**RLS is mandatory here from day one** (unlike the deferred RLS on other HBB tables — see `DEFERRED_20260501_enable_rls_hbb_tables.sql.disabled`). This workflow carries customer PII plus money. All writes go through SECURITY DEFINER RPCs; direct table grants are read-only and role-scoped.

## RPCs (state transitions, one per arrow)

Mirror the `hbb_installer_check_in` RPC pattern (`20260506_hbb_installer_morning_checkins.sql`) — SECURITY DEFINER, structured error codes:

| RPC | Guards | Effect |
|---|---|---|
| `odu_cx_log_call(p_request, p_outcome, p_reason, p_notes, p_callback)` | status in (new, contacting) | insert call log; transition to `contacting` / `confirmed` / `not_recovered` |
| `odu_cx_confirm(p_request, p_estate, p_house, p_date, p_lat, p_lng)` | status contacting/new | capture details, set `confirmed`, `consent_given_at` |
| `odu_installer_accept(p_request, p_installer)` | status=`allocated`, installer matches, `now() < accept_deadline` | set `accepted`, `accepted_at` |
| `odu_installer_reject(p_request, p_installer, p_reason)` | status=`allocated`, installer matches | append `rejected_by`, increment count, back to `confirmed`; escalate to HQ after 3 |
| `odu_capture_device(p_request, p_imei, p_mac, p_method, p_photo_url)` | status=`accepted`, IMEI Luhn-valid, not already matched elsewhere | insert/update `odu_devices` row |
| `odu_mark_collected(p_request, p_consent_url, p_lat, p_lng)` | status=`accepted`, captured device count ≥ expected_units, consent doc present | set `collected` |
| `odu_door_refusal(p_request, p_notes)` | status=`accepted` | `not_recovered`, reason `door_refusal` |
| `odu_warehouse_receive(p_device, p_imei, p_mac, p_warehouse, p_user)` | device status pending | match vs installer capture: equal → `matched`; differs → `mismatch`; IMEI already matched elsewhere → `duplicate`. When all devices of a request matched → request `delivered`, compute `payable_amount`, then `payable` if maps to inactive list else `not_paid` |
| `odu_resolve_flag(p_device, p_resolution, p_notes)` | HQ only | resolve mismatch/duplicate |
| `odu_sweep_expired()` | — | `allocated` past deadline → `confirmed` + note; returns swept count |
| `odu_generate_payment_batch(p_month)` | HQ only | gather `payable`, create batch, mark rows |
| `odu_mark_batch_paid(p_batch)` | HQ only | `paid` |

## 48-hour timeout mechanism

1. **pg_cron** (available on Supabase): `SELECT cron.schedule('odu-sweep', '*/15 * * * *', $$SELECT odu_sweep_expired()$$);` — resets expired allocations to `confirmed`.
2. **Re-allocation:** swept requests are picked up by `bulkOduAllocate()` which runs (a) on HQ/CX dashboard load (same pattern as `autoAllocateAllOpen`) and (b) via a manual "Allocate all" button. Defensive check-on-read: installer dashboard hides/blocks allocations past deadline even if sweep hasn't fired.
3. Phase 2 hardening (optional): scheduled Edge Function running allocation server-side so re-allocation doesn't depend on someone opening a dashboard.

## Allocation engine adapter — `src/components/odu/odu-auto-assign.ts`

Parameterized fork of `unifiedAutoAssign` (keep `jobs` engine untouched):
- Candidate filter: `installers.odu_opt_in = true` AND status available AND same town.
- **Distance-first scoring** (diagram allocates by lat/long): distance 50%, workload 25%, acceptance 15%, availability 10%. Radius tiers from `odu_config` (2/5/10 km).
- Optimistic lock: `UPDATE odu_requests SET status='allocated', installer_id=?, allocated_at=now(), accept_deadline=now()+interval '48 hours' WHERE id=? AND status='confirmed'`.
- Excludes `rejected_by` installers; escalates after 3 rejections (HQ queue).
- Workload counts `odu_requests` in (allocated, accepted) **plus** active `jobs` — installers do both installations and retrievals; don't double-book.

## Barcode capture — `src/components/odu/odu-barcode-scanner.tsx`

- `npm install @zxing/browser @zxing/library`.
- `BrowserMultiFormatReader` over `getUserMedia` (rear camera, `facingMode: environment`), formats: Code-128, Code-39, EAN — covers router labels.
- Parse: 15-digit numeric → IMEI (validate with Luhn); 12 hex chars / colon-separated → MAC.
- Manual fallback: input with same validation + mandatory label photo (reuses photo-upload pattern from completion modal) so every manual entry has audit evidence.
- Shared by installer and warehouse screens.

## Storage

New bucket `odu_documents` (consent docs + label photos). Policies modeled on `FIX_INSTALLER_PHOTOS_STORAGE.sql` **but authenticated-only** — consent docs are legal PII; do not repeat the anon-open policy used for installer_photos.

---

# Frontend

New module `src/components/odu/`:

| File | Purpose |
|---|---|
| `odu-api.ts` | Typed wrappers over RPCs + queries (follow `hbb-api.ts` conventions: retry, cache, phone normalization) |
| `odu-auto-assign.ts` | Allocation adapter (above) |
| `odu-upload-manager.tsx` | Clone of `hbb-ga-upload-manager.tsx`: CSV/XLS/XLSX → staged batch → validation report → go live → rollback. Columns: MSISDN, Name, Account, Town, Estate, Lat, Lng, IMEI (optional). Chunk inserts (500/req) for the 19k list |
| `odu-cx-dashboard.tsx` | Call queue: filter by town/status, customer profile card (name, MSISDN, town, estate), tap-to-call `tel:` link, outcome form (consent → details capture → confirm; decline → reason picker), callback scheduling, my-calls stats |
| `odu-installer-tasks.tsx` | New "Retrievals" tab inside `hbb-installer-dashboard.tsx`: opt-in toggle, allocated list with countdown to deadline, Accept/Reject, job detail → consent-doc photo → device capture (scanner ×2) → GPS → mark collected |
| `odu-warehouse-dashboard.tsx` | For `hbb_warehouse`: expected incoming (status collected, nearest warehouse), receive flow (scan both units), auto-match result (green matched / red mismatch / duplicate), receipt log |
| `odu-hq-tab.tsx` | New `odu` tab in `hbb-hq-dashboard.tsx` (extend the `Tab` union at `hbb-hq-dashboard.tsx:31`): funnel stats (uploaded → confirmed → allocated → collected → delivered → paid), upload manager, escalations/flags queue, TL opt-in coverage view, config editor (pay rate, window) |
| `odu-recon.tsx` | Payment: payable list grouped by installer, generate month batch, CSV/Excel export (installer, phone, units, amount, IMEIs), mark paid |
| `odu-types.ts` | Shared types + status maps |

## App.tsx integration

1. `UserRole` union (`App.tsx:132`): add `'hbb_cx' | 'hbb_warehouse'`.
2. `isHBBUser` list (`App.tsx:534`): add both.
3. Dashboard routing blocks (mirror `~770-830` and `~1001-1061`): route `hbb_cx` → CX dashboard, `hbb_warehouse` → warehouse dashboard.
4. Login: add the two roles to the `/login` edge-route role handling (`src/supabase/functions/server/hbb.tsx`) and seed users in `app_users` with PINs (follow `20260507_fix_se_login_to_app_users.sql` pattern).
5. Feature flag: gate all ODU UI behind `odu_config.program_enabled` (reuse the HQ program-toggle pattern from the networks feature) — enables per-pilot rollout and instant kill-switch.

---

# Phased delivery

**Phase 1 — Foundation + HQ upload (Week 1)**
Migration (tables, RPC stubs, RLS, bucket, pg_cron), seed warehouses + test users, `odu-api.ts`, upload manager, HQ tab skeleton with funnel stats. *Exit: 19k list uploaded, staged, live, visible.*

**Phase 2 — CX intake (Week 2)**
`hbb_cx` role end-to-end (login → dashboard), call queue + outcome logging + confirm/not-recovered flows, callback scheduling. *Exit: a request reaches `confirmed` with full capture data.*

**Phase 3 — Installer collection (Weeks 2–3)**
Opt-in toggle + TL coverage view, allocation adapter + bulk allocate, accept/reject with countdown, 48h sweep (pg_cron), barcode scanner, consent-doc photo, mark collected. *Exit: `confirmed → collected` works on a real phone in the field, including reject → reassign and timeout → reassign.*

**Phase 4 — Warehouse (Week 3–4)**
`hbb_warehouse` role, receive/scan/match flow, duplicate + mismatch flagging, HQ flag-resolution queue. *Exit: `collected → delivered` with a forced mismatch and a forced duplicate both flagged correctly.*

**Phase 5 — Reconciliation & payment (Week 4)**
Payable computation, month-end batch generation, export, mark paid, not-paid bucket, full funnel analytics. *Exit: month-end export matches a hand-computed sample.*

**Phase 6 — Hardening & pilot (Week 5)**
RLS audit, load test upload with the full 19k file, offline behavior on flaky networks (scanner + photo queue), UAT scenarios in the existing UAT harness, pilot in **one town** behind the feature flag, then staged rollout.

# DevOps checklist

- [ ] Migrations via `supabase db push`; timestamp-named files in `supabase/migrations/`; every migration idempotent (`IF NOT EXISTS`).
- [ ] pg_cron extension enabled in Supabase dashboard; schedule `odu-sweep` every 15 min.
- [ ] `odu_documents` bucket + authenticated-only policies (SQL in migration, not clicked in dashboard).
- [ ] RLS enabled on all `odu_*` tables at creation; writes only via SECURITY DEFINER RPCs.
- [ ] Seed script: warehouses, CX + warehouse test users, config rows.
- [ ] `npm install @zxing/browser @zxing/library` (+ `xlsx` if Excel-native export is required; CSV otherwise).
- [ ] Feature flag default OFF in production; ON in preview deployment.
- [ ] Vercel preview → UAT → production; kill-switch = flip `program_enabled`.
- [ ] Audit: log every state transition into `activity_logs` (existing pattern) from within the RPCs.
- [ ] Dashboards to watch during pilot: sweep count per day (timeouts), rejection rate, mismatch/duplicate rate, CX contact rate.

# Risks

| Risk | Mitigation |
|---|---|
| Inactive-list data quality (bad MSISDNs, no lat/lng) kills allocation | Validation report at upload (GA pattern); geocode estate centroid as fallback (Nominatim already used in lead form); Pass-4 town-level allocation |
| Low installer opt-in → allocation dead-ends | TL coverage view + HQ escalation queue from day one; the diagram's ↻ loop is a product lever, not code |
| Barcode won't read on damaged labels | Manual + mandatory label photo path is first-class, not an afterthought |
| Client-side re-allocation depends on dashboard sessions | Acceptable for pilot; scheduled Edge Function in Phase 2 hardening |
| Payment disputes | Every unit has: installer scan + photo + GPS + warehouse scan + timestamps; export includes IMEIs |
