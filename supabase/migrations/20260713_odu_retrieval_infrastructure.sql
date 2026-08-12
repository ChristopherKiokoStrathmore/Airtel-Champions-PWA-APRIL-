-- ═══════════════════════════════════════════════════════════════════════════
-- ODU Retrieval Workflow — Database Infrastructure
-- Created: 2026-07-13
-- Plan: ODU_RETRIEVAL_IMPLEMENTATION_PLAN.md
--
-- Recover ODUs from ~19,000 inactive HBB customers:
--   HQ upload → CX intake → Installer collection → Warehouse validation
--   → Reconciliation & payment (KSh 600/unit = 300 fare + 300 incentive)
--
-- Security model: this app authenticates HBB users with a custom PIN/session
-- token (NOT Supabase auth.uid()), and the browser uses the anon key for DB
-- access. Because we cannot row-scope on a real JWT identity, we harden as
-- follows: RLS is ENABLED on every odu_* table, anon/authenticated get SELECT
-- only, and ALL writes flow through SECURITY DEFINER RPCs (which bypass RLS and
-- enforce the state-machine guards). A client holding the anon key therefore
-- cannot tamper with payment/collection records directly.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Prerequisite: installers opt-in flag (drives the TL opt-in coverage loop)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.installers
  ADD COLUMN IF NOT EXISTS odu_opt_in boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Upload batches (mirrors hbb_ga_upload_batches semantics)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_upload_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename          text NOT NULL,
  status            text NOT NULL DEFAULT 'staged'
                      CHECK (status IN ('staged','live','rolled_back')),
  total_records     integer NOT NULL DEFAULT 0,
  warnings_count    integer NOT NULL DEFAULT 0,
  validation_errors jsonb   NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by       text,
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  went_live_at      timestamptz,
  rolled_back_at    timestamptz,
  rolled_back_reason text
);
CREATE INDEX IF NOT EXISTS odu_batches_status_idx   ON public.odu_upload_batches(status);
CREATE INDEX IF NOT EXISTS odu_batches_uploaded_idx ON public.odu_upload_batches(uploaded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Inactive customer list (the ~19,000)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_inactive_customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id       uuid REFERENCES public.odu_upload_batches(id) ON DELETE CASCADE,
  msisdn         text NOT NULL,              -- normalize_phone() applied by ingest RPC
  customer_name  text NOT NULL,
  account_number text,
  town           text,
  estate         text,
  lat            double precision,
  lng            double precision,
  expected_units integer NOT NULL DEFAULT 2,
  original_imei  text,                       -- from HQ export if available
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT odu_inactive_msisdn_batch_unique UNIQUE (msisdn, batch_id)
);
CREATE INDEX IF NOT EXISTS odu_inactive_batch_idx  ON public.odu_inactive_customers(batch_id);
CREATE INDEX IF NOT EXISTS odu_inactive_msisdn_idx ON public.odu_inactive_customers(msisdn);
CREATE INDEX IF NOT EXISTS odu_inactive_town_idx   ON public.odu_inactive_customers(town);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Retrieval requests (one per worked customer)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_requests (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          uuid NOT NULL REFERENCES public.odu_inactive_customers(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'new' CHECK (status IN
                         ('new','contacting','confirmed','allocated','accepted','collected',
                          'delivered','flagged','payable','paid','not_paid','not_recovered')),
  not_recovered_reason text CHECK (not_recovered_reason IS NULL OR not_recovered_reason IN
                         ('no_funds','network','seasonal','faulty_odu','switched_isp',
                          'customer_declined','door_refusal','unreachable','other')),
  -- CX capture
  cx_phone         text,
  consent_given_at timestamptz,
  capture_estate   text,
  capture_house    text,
  capture_notes    text,
  retrieval_date   date,
  customer_lat     double precision,
  customer_lng     double precision,
  -- Allocation / acceptance
  installer_id     bigint REFERENCES public.installers(id) ON DELETE SET NULL,
  installer_name   text,
  allocated_at     timestamptz,
  accept_deadline  timestamptz,             -- allocated_at + odu_config.accept_window_hours
  accepted_at      timestamptz,
  rejected_by      bigint[] NOT NULL DEFAULT '{}',
  rejection_count  integer  NOT NULL DEFAULT 0,
  -- Collection
  collected_at     timestamptz,
  consent_doc_url  text,                     -- signed legal doc photo
  collection_lat   double precision,
  collection_lng   double precision,
  -- Warehouse
  warehouse_id     uuid,
  delivered_at     timestamptz,
  -- Payment
  payable_amount   integer,                  -- computed at delivery from odu_config
  payment_batch_id uuid,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS odu_requests_status_idx    ON public.odu_requests(status);
CREATE INDEX IF NOT EXISTS odu_requests_installer_idx ON public.odu_requests(installer_id);
CREATE INDEX IF NOT EXISTS odu_requests_customer_idx  ON public.odu_requests(customer_id);
CREATE INDEX IF NOT EXISTS odu_requests_deadline_idx  ON public.odu_requests(accept_deadline)
  WHERE status = 'allocated';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Devices (typically 2 per request)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES public.odu_requests(id) ON DELETE CASCADE,
  -- Installer capture
  imei            text,
  mac             text,
  capture_method  text CHECK (capture_method IN ('scan','manual')),
  label_photo_url text,
  captured_by     text,
  captured_at     timestamptz,
  -- Warehouse capture
  wh_imei         text,
  wh_mac          text,
  wh_capture_method text CHECK (wh_capture_method IN ('scan','manual')),
  wh_captured_by  text,
  wh_captured_at  timestamptz,
  match_status    text NOT NULL DEFAULT 'pending'
                    CHECK (match_status IN ('pending','matched','mismatch','duplicate')),
  flag_notes      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
-- Duplicate/reuse protection: one MATCHED device per IMEI, program-wide.
CREATE UNIQUE INDEX IF NOT EXISTS odu_devices_imei_matched_unique
  ON public.odu_devices (imei) WHERE match_status = 'matched';
CREATE INDEX IF NOT EXISTS odu_devices_request_idx ON public.odu_devices(request_id);
CREATE INDEX IF NOT EXISTS odu_devices_imei_idx    ON public.odu_devices(imei);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Call log (every CX attempt — feeds the "Reason logged" box)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_call_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     uuid NOT NULL REFERENCES public.odu_requests(id) ON DELETE CASCADE,
  cx_phone       text NOT NULL,
  outcome        text NOT NULL CHECK (outcome IN
                   ('no_answer','callback_later','confirmed','declined','wrong_number')),
  decline_reason text,
  notes          text,
  callback_at    timestamptz,
  called_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS odu_call_logs_request_idx ON public.odu_call_logs(request_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Warehouses
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_warehouses (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  town      text NOT NULL,
  lat       double precision,
  lng       double precision,
  is_active boolean NOT NULL DEFAULT true
);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. ODU staff (CX agents + warehouse operators) — PIN login
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_staff (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msisdn       text NOT NULL UNIQUE,       -- normalized 0XXXXXXXXX
  name         text NOT NULL,
  role         text NOT NULL CHECK (role IN ('hbb_cx','hbb_warehouse')),
  warehouse_id uuid REFERENCES public.odu_warehouses(id) ON DELETE SET NULL,
  pin          text NOT NULL DEFAULT '1234',
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Payment batches (month-end)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_payment_batches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year   text NOT NULL,               -- e.g. '2026-07'
  status       text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','exported','paid')),
  total_units  integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,
  generated_by text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  exported_at  timestamptz,
  paid_at      timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. Config (HQ-editable, like HBB_INCENTIVE_BANDS)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.odu_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.odu_config (key, value) VALUES
  ('pay_per_unit',        '{"fare":300,"incentive":300,"total":600}'::jsonb),
  ('accept_window_hours', '48'::jsonb),
  ('program_enabled',     'false'::jsonb),
  ('radius_tiers_km',     '[2,5,10]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- HELPERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Luhn-valid 15-digit IMEI check. Returns false for null/short/non-numeric.
CREATE OR REPLACE FUNCTION public.odu_is_valid_imei(p_imei text)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  s text;
  total int := 0;
  d int;
  i int;
  dbl boolean := false;
BEGIN
  IF p_imei IS NULL THEN RETURN false; END IF;
  s := regexp_replace(p_imei, '[^0-9]', '', 'g');
  IF length(s) <> 15 THEN RETURN false; END IF;
  -- Luhn from rightmost digit
  FOR i IN REVERSE 15..1 LOOP
    d := substr(s, i, 1)::int;
    IF dbl THEN
      d := d * 2;
      IF d > 9 THEN d := d - 9; END IF;
    END IF;
    total := total + d;
    dbl := NOT dbl;
  END LOOP;
  RETURN (total % 10) = 0;
END;
$$;

-- Read a numeric config value with a fallback.
CREATE OR REPLACE FUNCTION public.odu_config_int(p_key text, p_default int)
RETURNS int
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE((SELECT value::text::int FROM public.odu_config WHERE key = p_key), p_default);
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPCs — every state transition. SECURITY DEFINER, structured error codes.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Upload: create a staged batch, return its id ─────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_create_batch(p_filename text, p_uploaded_by text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.odu_upload_batches (filename, uploaded_by, status)
    VALUES (COALESCE(NULLIF(btrim(p_filename),''), 'upload'), p_uploaded_by, 'staged')
    RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── Upload: bulk ingest customers into a staged batch ────────────────────────
-- p_rows: jsonb array of {msisdn,customer_name,account_number,town,estate,lat,lng,expected_units,original_imei}
CREATE OR REPLACE FUNCTION public.odu_ingest_customers(p_batch_id uuid, p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  INSERT INTO public.odu_inactive_customers
    (batch_id, msisdn, customer_name, account_number, town, estate, lat, lng, expected_units, original_imei)
  SELECT
    p_batch_id,
    public.normalize_phone(r->>'msisdn'),
    COALESCE(r->>'customer_name',''),
    NULLIF(r->>'account_number',''),
    NULLIF(r->>'town',''),
    NULLIF(r->>'estate',''),
    NULLIF(r->>'lat','')::double precision,
    NULLIF(r->>'lng','')::double precision,
    COALESCE(NULLIF(r->>'expected_units','')::int, 2),
    NULLIF(r->>'original_imei','')
  FROM jsonb_array_elements(p_rows) AS r
  ON CONFLICT (msisdn, batch_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.odu_upload_batches
    SET total_records = (SELECT count(*) FROM public.odu_inactive_customers WHERE batch_id = p_batch_id)
    WHERE id = p_batch_id;
  RETURN v_count;
END;
$$;

-- ── Upload: go live — create a 'new' request for each customer in the batch ──
CREATE OR REPLACE FUNCTION public.odu_batch_go_live(p_batch_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  INSERT INTO public.odu_requests (customer_id, customer_lat, customer_lng, status)
  SELECT c.id, c.lat, c.lng, 'new'
  FROM public.odu_inactive_customers c
  WHERE c.batch_id = p_batch_id
    AND NOT EXISTS (SELECT 1 FROM public.odu_requests r WHERE r.customer_id = c.id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.odu_upload_batches
    SET status = 'live', went_live_at = now()
    WHERE id = p_batch_id;
  RETURN v_count;
END;
$$;

-- ── Upload: rollback — only removes UNTOUCHED ('new') requests, keeps history ─
CREATE OR REPLACE FUNCTION public.odu_batch_rollback(p_batch_id uuid, p_reason text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  DELETE FROM public.odu_requests r
  USING public.odu_inactive_customers c
  WHERE r.customer_id = c.id AND c.batch_id = p_batch_id AND r.status = 'new';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.odu_upload_batches
    SET status = 'rolled_back', rolled_back_at = now(), rolled_back_reason = p_reason
    WHERE id = p_batch_id;
  RETURN v_count;
END;
$$;

-- ── CX: log a call attempt ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_cx_log_call(
  p_request uuid, p_cx_phone text, p_outcome text,
  p_decline_reason text DEFAULT NULL, p_notes text DEFAULT NULL, p_callback timestamptz DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.odu_requests WHERE id = p_request;
  IF v_status IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF v_status NOT IN ('new','contacting') THEN RAISE EXCEPTION 'ODU_NOT_IN_INTAKE'; END IF;

  INSERT INTO public.odu_call_logs (request_id, cx_phone, outcome, decline_reason, notes, callback_at)
  VALUES (p_request, public.normalize_phone(p_cx_phone), p_outcome, p_decline_reason, p_notes, p_callback);

  IF p_outcome = 'declined' THEN
    UPDATE public.odu_requests
      SET status = 'not_recovered',
          not_recovered_reason = COALESCE(NULLIF(p_decline_reason,''), 'customer_declined'),
          cx_phone = public.normalize_phone(p_cx_phone), updated_at = now()
      WHERE id = p_request;
  ELSIF v_status = 'new' THEN
    UPDATE public.odu_requests
      SET status = 'contacting', cx_phone = public.normalize_phone(p_cx_phone), updated_at = now()
      WHERE id = p_request;
  END IF;
END;
$$;

-- ── CX: confirm consent + capture retrieval details ──────────────────────────
CREATE OR REPLACE FUNCTION public.odu_cx_confirm(
  p_request uuid, p_cx_phone text, p_estate text, p_house text,
  p_date date, p_lat double precision DEFAULT NULL, p_lng double precision DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_status text;
BEGIN
  SELECT status INTO v_status FROM public.odu_requests WHERE id = p_request;
  IF v_status IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF v_status NOT IN ('new','contacting') THEN RAISE EXCEPTION 'ODU_NOT_IN_INTAKE'; END IF;

  UPDATE public.odu_requests SET
    status = 'confirmed',
    cx_phone = public.normalize_phone(p_cx_phone),
    consent_given_at = now(),
    capture_estate = NULLIF(btrim(COALESCE(p_estate,'')),''),
    capture_house  = NULLIF(btrim(COALESCE(p_house,'')),''),
    capture_notes  = NULLIF(btrim(COALESCE(p_notes,'')),''),
    retrieval_date = p_date,
    customer_lat = COALESCE(p_lat, customer_lat),
    customer_lng = COALESCE(p_lng, customer_lng),
    updated_at = now()
  WHERE id = p_request;

  INSERT INTO public.odu_call_logs (request_id, cx_phone, outcome, notes)
  VALUES (p_request, public.normalize_phone(p_cx_phone), 'confirmed', p_notes);
END;
$$;

-- ── Allocation: optimistic-lock claim (called by client scoring engine) ──────
CREATE OR REPLACE FUNCTION public.odu_allocate_lock(
  p_request uuid, p_installer_id bigint, p_installer_name text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_hours int; v_updated int;
BEGIN
  v_hours := public.odu_config_int('accept_window_hours', 48);
  UPDATE public.odu_requests SET
    status = 'allocated',
    installer_id = p_installer_id,
    installer_name = p_installer_name,
    allocated_at = now(),
    accept_deadline = now() + make_interval(hours => v_hours),
    updated_at = now()
  WHERE id = p_request AND status = 'confirmed';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

-- ── Installer: accept within the window ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_installer_accept(p_request uuid, p_installer_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.odu_requests;
BEGIN
  SELECT * INTO r FROM public.odu_requests WHERE id = p_request;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF r.status <> 'allocated' THEN RAISE EXCEPTION 'ODU_NOT_ALLOCATED'; END IF;
  IF r.installer_id <> p_installer_id THEN RAISE EXCEPTION 'ODU_NOT_YOUR_JOB'; END IF;
  IF r.accept_deadline IS NOT NULL AND now() > r.accept_deadline THEN
    RAISE EXCEPTION 'ODU_ACCEPT_WINDOW_EXPIRED';
  END IF;
  UPDATE public.odu_requests SET status = 'accepted', accepted_at = now(), updated_at = now()
    WHERE id = p_request;
END;
$$;

-- ── Installer: reject → back to confirmed, exclude this installer, escalate ──
CREATE OR REPLACE FUNCTION public.odu_installer_reject(
  p_request uuid, p_installer_id bigint, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.odu_requests; v_max int := 3;
BEGIN
  SELECT * INTO r FROM public.odu_requests WHERE id = p_request;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF r.status NOT IN ('allocated','accepted') THEN RAISE EXCEPTION 'ODU_NOT_REJECTABLE'; END IF;
  IF r.installer_id <> p_installer_id THEN RAISE EXCEPTION 'ODU_NOT_YOUR_JOB'; END IF;

  UPDATE public.odu_requests SET
    status = CASE WHEN (r.rejection_count + 1) >= v_max THEN 'flagged' ELSE 'confirmed' END,
    not_recovered_reason = NULL,
    installer_id = NULL, installer_name = NULL, allocated_at = NULL,
    accept_deadline = NULL, accepted_at = NULL,
    rejected_by = array_append(r.rejected_by, p_installer_id),
    rejection_count = r.rejection_count + 1,
    capture_notes = COALESCE(capture_notes,'') ||
      format(E'\nREJECTED_BY:%s at %s reason:%s', p_installer_id, now(), COALESCE(p_reason,'n/a')),
    updated_at = now()
  WHERE id = p_request;
END;
$$;

-- ── Installer: capture a device (scan/manual) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_capture_device(
  p_request uuid, p_installer_id bigint, p_imei text, p_mac text,
  p_method text, p_photo_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.odu_requests; v_imei text; v_id uuid;
BEGIN
  SELECT * INTO r FROM public.odu_requests WHERE id = p_request;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF r.status <> 'accepted' THEN RAISE EXCEPTION 'ODU_NOT_ACCEPTED'; END IF;
  IF r.installer_id <> p_installer_id THEN RAISE EXCEPTION 'ODU_NOT_YOUR_JOB'; END IF;

  v_imei := regexp_replace(COALESCE(p_imei,''), '[^0-9]', '', 'g');
  IF NOT public.odu_is_valid_imei(v_imei) THEN RAISE EXCEPTION 'ODU_IMEI_INVALID'; END IF;

  -- Reject IMEIs already matched (delivered) on another device — reuse/duplicate
  IF EXISTS (SELECT 1 FROM public.odu_devices
             WHERE imei = v_imei AND match_status = 'matched') THEN
    RAISE EXCEPTION 'ODU_IMEI_ALREADY_COLLECTED';
  END IF;

  INSERT INTO public.odu_devices
    (request_id, imei, mac, capture_method, label_photo_url, captured_by, captured_at)
  VALUES (p_request, v_imei, NULLIF(p_mac,''), p_method, p_photo_url,
          p_installer_id::text, now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── Installer: mark collected (needs expected units + consent doc) ───────────
CREATE OR REPLACE FUNCTION public.odu_mark_collected(
  p_request uuid, p_installer_id bigint, p_consent_url text,
  p_lat double precision, p_lng double precision
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.odu_requests; v_expected int; v_captured int;
BEGIN
  SELECT * INTO r FROM public.odu_requests WHERE id = p_request;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF r.status <> 'accepted' THEN RAISE EXCEPTION 'ODU_NOT_ACCEPTED'; END IF;
  IF r.installer_id <> p_installer_id THEN RAISE EXCEPTION 'ODU_NOT_YOUR_JOB'; END IF;
  IF COALESCE(p_consent_url,'') = '' THEN RAISE EXCEPTION 'ODU_CONSENT_DOC_REQUIRED'; END IF;

  SELECT COALESCE(expected_units,2) INTO v_expected
    FROM public.odu_inactive_customers WHERE id = r.customer_id;
  SELECT count(*) INTO v_captured FROM public.odu_devices WHERE request_id = p_request;
  IF v_captured < v_expected THEN RAISE EXCEPTION 'ODU_UNITS_INCOMPLETE'; END IF;

  UPDATE public.odu_requests SET
    status = 'collected', collected_at = now(),
    consent_doc_url = p_consent_url, collection_lat = p_lat, collection_lng = p_lng,
    updated_at = now()
  WHERE id = p_request;
END;
$$;

-- ── Installer: door refusal → not recovered ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_door_refusal(
  p_request uuid, p_installer_id bigint, p_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r public.odu_requests;
BEGIN
  SELECT * INTO r FROM public.odu_requests WHERE id = p_request;
  IF r.id IS NULL THEN RAISE EXCEPTION 'ODU_REQUEST_NOT_FOUND'; END IF;
  IF r.status <> 'accepted' THEN RAISE EXCEPTION 'ODU_NOT_ACCEPTED'; END IF;
  IF r.installer_id <> p_installer_id THEN RAISE EXCEPTION 'ODU_NOT_YOUR_JOB'; END IF;
  UPDATE public.odu_requests SET
    status = 'not_recovered', not_recovered_reason = 'door_refusal',
    capture_notes = COALESCE(capture_notes,'') || E'\nDOOR_REFUSAL: ' || COALESCE(p_notes,''),
    updated_at = now()
  WHERE id = p_request;
END;
$$;

-- ── Warehouse: receive & match one device ────────────────────────────────────
-- Compares warehouse capture against the installer capture and sets match_status.
-- When ALL devices on the request are 'matched', the request becomes 'delivered'
-- (then 'payable' if the customer maps to a live inactive batch, else 'not_paid').
CREATE OR REPLACE FUNCTION public.odu_warehouse_receive(
  p_device uuid, p_wh_imei text, p_wh_mac text, p_method text,
  p_warehouse uuid, p_operator text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  d public.odu_devices; r public.odu_requests;
  v_imei text; v_match text; v_pending int; v_pay int; v_maps boolean;
BEGIN
  SELECT * INTO d FROM public.odu_devices WHERE id = p_device;
  IF d.id IS NULL THEN RAISE EXCEPTION 'ODU_DEVICE_NOT_FOUND'; END IF;
  IF d.match_status <> 'pending' THEN RAISE EXCEPTION 'ODU_DEVICE_ALREADY_RECEIVED'; END IF;

  v_imei := regexp_replace(COALESCE(p_wh_imei,''), '[^0-9]', '', 'g');

  -- Duplicate: this IMEI already matched on a different device
  IF EXISTS (SELECT 1 FROM public.odu_devices
             WHERE imei = v_imei AND match_status = 'matched' AND id <> p_device) THEN
    v_match := 'duplicate';
  ELSIF v_imei = d.imei THEN
    v_match := 'matched';
  ELSE
    v_match := 'mismatch';
  END IF;

  UPDATE public.odu_devices SET
    wh_imei = v_imei, wh_mac = NULLIF(p_wh_mac,''), wh_capture_method = p_method,
    wh_captured_by = p_operator, wh_captured_at = now(),
    match_status = v_match
  WHERE id = p_device;

  -- Attach the warehouse to the request on first receipt
  UPDATE public.odu_requests SET warehouse_id = p_warehouse, updated_at = now()
    WHERE id = d.request_id AND warehouse_id IS NULL;

  IF v_match = 'matched' THEN
    -- All devices received & matched?
    SELECT count(*) INTO v_pending FROM public.odu_devices
      WHERE request_id = d.request_id AND match_status <> 'matched';
    IF v_pending = 0 THEN
      SELECT * INTO r FROM public.odu_requests WHERE id = d.request_id;
      -- Maps to a live inactive batch?
      SELECT EXISTS (
        SELECT 1 FROM public.odu_inactive_customers c
        JOIN public.odu_upload_batches b ON b.id = c.batch_id
        WHERE c.id = r.customer_id AND b.status = 'live'
      ) INTO v_maps;
      v_pay := public.odu_config_int('pay_per_unit', 600)
               * (SELECT count(*) FROM public.odu_devices WHERE request_id = d.request_id);
      UPDATE public.odu_requests SET
        status = CASE WHEN v_maps THEN 'payable' ELSE 'not_paid' END,
        delivered_at = now(),
        payable_amount = CASE WHEN v_maps THEN v_pay ELSE 0 END,
        updated_at = now()
      WHERE id = d.request_id;
    ELSE
      UPDATE public.odu_requests SET status = 'delivered', delivered_at = now(), updated_at = now()
        WHERE id = d.request_id AND status = 'collected';
    END IF;
  ELSE
    -- mismatch/duplicate → flag the request for HQ
    UPDATE public.odu_requests SET status = 'flagged', updated_at = now()
      WHERE id = d.request_id AND status IN ('collected','delivered');
  END IF;

  RETURN v_match;
END;
$$;

-- ── HQ: resolve a flagged device (mismatch/duplicate) ────────────────────────
CREATE OR REPLACE FUNCTION public.odu_resolve_flag(
  p_device uuid, p_resolution text, p_notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d public.odu_devices; v_pending int; v_pay int; v_maps boolean; r public.odu_requests;
BEGIN
  -- p_resolution: 'accept' (treat as matched) | 'reject' (mark request not_recovered)
  SELECT * INTO d FROM public.odu_devices WHERE id = p_device;
  IF d.id IS NULL THEN RAISE EXCEPTION 'ODU_DEVICE_NOT_FOUND'; END IF;

  IF p_resolution = 'accept' THEN
    UPDATE public.odu_devices SET match_status = 'matched', flag_notes = p_notes WHERE id = p_device;
    SELECT count(*) INTO v_pending FROM public.odu_devices
      WHERE request_id = d.request_id AND match_status <> 'matched';
    IF v_pending = 0 THEN
      SELECT * INTO r FROM public.odu_requests WHERE id = d.request_id;
      SELECT EXISTS (
        SELECT 1 FROM public.odu_inactive_customers c
        JOIN public.odu_upload_batches b ON b.id = c.batch_id
        WHERE c.id = r.customer_id AND b.status = 'live'
      ) INTO v_maps;
      v_pay := public.odu_config_int('pay_per_unit', 600)
               * (SELECT count(*) FROM public.odu_devices WHERE request_id = d.request_id);
      UPDATE public.odu_requests SET
        status = CASE WHEN v_maps THEN 'payable' ELSE 'not_paid' END,
        delivered_at = COALESCE(delivered_at, now()),
        payable_amount = CASE WHEN v_maps THEN v_pay ELSE 0 END,
        updated_at = now()
      WHERE id = d.request_id;
    END IF;
  ELSE
    UPDATE public.odu_devices SET flag_notes = p_notes WHERE id = p_device;
    UPDATE public.odu_requests SET status = 'not_recovered',
      not_recovered_reason = 'other', updated_at = now()
      WHERE id = d.request_id;
  END IF;
END;
$$;

-- ── Sweep expired allocations back to confirmed (pg_cron) ─────────────────────
CREATE OR REPLACE FUNCTION public.odu_sweep_expired()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count int := 0;
BEGIN
  WITH expired AS (
    UPDATE public.odu_requests SET
      status = CASE WHEN (rejection_count + 1) >= 3 THEN 'flagged' ELSE 'confirmed' END,
      rejected_by = array_append(rejected_by, installer_id),
      rejection_count = rejection_count + 1,
      installer_id = NULL, installer_name = NULL, allocated_at = NULL,
      accept_deadline = NULL,
      capture_notes = COALESCE(capture_notes,'') || format(E'\nTIMEOUT at %s', now()),
      updated_at = now()
    WHERE status = 'allocated' AND accept_deadline IS NOT NULL AND now() > accept_deadline
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM expired;
  RETURN v_count;
END;
$$;

-- ── HQ: generate a month-end payment batch from payable requests ─────────────
CREATE OR REPLACE FUNCTION public.odu_generate_payment_batch(p_month text, p_generated_by text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_batch uuid; v_units int; v_amount int;
BEGIN
  INSERT INTO public.odu_payment_batches (month_year, generated_by)
    VALUES (p_month, p_generated_by) RETURNING id INTO v_batch;

  WITH claimed AS (
    UPDATE public.odu_requests r SET payment_batch_id = v_batch, updated_at = now()
    WHERE r.status = 'payable' AND r.payment_batch_id IS NULL
    RETURNING r.id, r.payable_amount
  )
  SELECT COALESCE(count(*),0), COALESCE(sum(payable_amount),0) INTO v_units, v_amount FROM claimed;

  UPDATE public.odu_payment_batches
    SET total_units = v_units, total_amount = v_amount, status = 'draft'
    WHERE id = v_batch;
  RETURN v_batch;
END;
$$;

-- ── HQ: mark a payment batch paid ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_mark_batch_paid(p_batch uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.odu_requests SET status = 'paid', paid_at = now(), updated_at = now()
    WHERE payment_batch_id = p_batch AND status = 'payable';
  UPDATE public.odu_payment_batches SET status = 'paid', paid_at = now() WHERE id = p_batch;
END;
$$;

-- ── HQ: set a config value ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.odu_set_config(p_key text, p_value jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.odu_config (key, value, updated_at) VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Enable on all odu_* tables. Grant SELECT to anon/authenticated (dashboards
-- read directly). No write policies → every mutation must use the SECURITY
-- DEFINER RPCs above. odu_staff PINs stay server-side (no client SELECT).
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'odu_upload_batches','odu_inactive_customers','odu_requests','odu_devices',
    'odu_call_logs','odu_warehouses','odu_payment_batches','odu_config'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true);', t||'_read', t);
  END LOOP;

  -- odu_staff: RLS on, NO select policy for clients (login goes through the edge fn / service role).
  EXECUTE 'ALTER TABLE public.odu_staff ENABLE ROW LEVEL SECURITY;';
END $$;

-- Function execute grants (client calls RPCs with the anon key)
GRANT EXECUTE ON FUNCTION
  public.odu_create_batch(text, text),
  public.odu_ingest_customers(uuid, jsonb),
  public.odu_batch_go_live(uuid),
  public.odu_batch_rollback(uuid, text),
  public.odu_cx_log_call(uuid, text, text, text, text, timestamptz),
  public.odu_cx_confirm(uuid, text, text, text, date, double precision, double precision, text),
  public.odu_allocate_lock(uuid, bigint, text),
  public.odu_installer_accept(uuid, bigint),
  public.odu_installer_reject(uuid, bigint, text),
  public.odu_capture_device(uuid, bigint, text, text, text, text),
  public.odu_mark_collected(uuid, bigint, text, double precision, double precision),
  public.odu_door_refusal(uuid, bigint, text),
  public.odu_warehouse_receive(uuid, text, text, text, uuid, text),
  public.odu_resolve_flag(uuid, text, text),
  public.odu_sweep_expired(),
  public.odu_generate_payment_batch(text, text),
  public.odu_mark_batch_paid(uuid),
  public.odu_set_config(text, jsonb),
  public.odu_is_valid_imei(text),
  public.odu_config_int(text, int)
TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE — consent docs + label photos (AUTHENTICATED read; these are legal PII,
-- unlike the public installer_photos bucket)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('odu_documents', 'odu_documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "odu_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "odu_documents_read"   ON storage.objects;
-- Uploads: anon allowed (app uses the anon key for field capture), scoped to bucket
CREATE POLICY "odu_documents_upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'odu_documents');
CREATE POLICY "odu_documents_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'odu_documents');

-- ═══════════════════════════════════════════════════════════════════════════
-- pg_cron — sweep expired allocations every 15 minutes (idempotent scheduling)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('odu-sweep-expired')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'odu-sweep-expired');
    PERFORM cron.schedule('odu-sweep-expired', '*/15 * * * *', 'SELECT public.odu_sweep_expired();');
  ELSE
    RAISE NOTICE 'pg_cron not installed — enable it in the Supabase dashboard, then run: SELECT cron.schedule(''odu-sweep-expired'', ''*/15 * * * *'', ''SELECT public.odu_sweep_expired();'');';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
