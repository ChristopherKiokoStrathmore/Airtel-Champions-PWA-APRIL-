# Installer Morning Check-In — Design Spec
**Date:** 2026-05-06  
**Status:** Approved  
**Approach:** Option A — self-contained card in InstallerHome + direct Supabase RPC call

---

## 1. Problem

HBB field installers have no way to record their presence at the start of the working day. Management needs a timestamped, GPS-verified daily check-in per installer. The check-in must be enforced once per calendar day at the database level.

---

## 2. Scope

| In scope | Out of scope |
|---|---|
| Morning check-in button on installer home tab | Check-in history view |
| GPS coordinate capture (lat/lng/accuracy) | Push notifications reminding installers to check in |
| DB-level one-per-day uniqueness | Admin dashboard to view check-ins |
| Clear duplicate-day error handling | Time-gating (visible all day by design) |
| Shared GPS utility (deduplicates existing code) | Points/incentive integration |

---

## 3. Database

### 3.1 New table: `public.hbb_installer_morning_checkins`

Follows the `hbb_installer_ga_daily` / `hbb_installer_ga_monthly` lowercase naming convention.

```sql
CREATE TABLE public.hbb_installer_morning_checkins (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  installer_msisdn text NOT NULL,
  installer_name   text,
  team_lead_msisdn text REFERENCES public.hbb_installer_team_lead(team_lead_msisdn) ON DELETE SET NULL,
  check_in_date    date NOT NULL DEFAULT current_date,
  checked_in_at    timestamptz NOT NULL DEFAULT now(),
  latitude         double precision NOT NULL,
  longitude        double precision NOT NULL,
  accuracy_meters  double precision,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_morning_checkins_pkey PRIMARY KEY (id),
  CONSTRAINT hbb_installer_checkin_once_per_day UNIQUE (installer_msisdn, check_in_date)
);
```

Indexes:
- `(installer_msisdn)` — for per-installer queries
- `(check_in_date DESC)` — for daily reporting

### 3.2 RPC: `public.hbb_installer_check_in`

```sql
CREATE OR REPLACE FUNCTION public.hbb_installer_check_in(
  p_installer_msisdn   text,
  p_installer_name     text,
  p_team_lead_msisdn   text,
  p_latitude           double precision,
  p_longitude          double precision,
  p_accuracy_meters    double precision DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msisdn text;
  v_row    public.hbb_installer_morning_checkins;
BEGIN
  -- Input validation
  IF btrim(COALESCE(p_installer_msisdn, '')) = '' THEN
    RAISE EXCEPTION 'CHECKIN_INPUT_INVALID';
  END IF;
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RAISE EXCEPTION 'CHECKIN_INPUT_INVALID';
  END IF;

  v_msisdn := public.normalize_phone(p_installer_msisdn);

  INSERT INTO public.hbb_installer_morning_checkins (
    installer_msisdn, installer_name, team_lead_msisdn,
    latitude, longitude, accuracy_meters
  )
  VALUES (
    v_msisdn,
    btrim(COALESCE(p_installer_name, '')),
    NULLIF(btrim(COALESCE(p_team_lead_msisdn, '')), ''),
    p_latitude, p_longitude, p_accuracy_meters
  )
  ON CONFLICT (installer_msisdn, check_in_date) DO NOTHING
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CHECKIN_ALREADY_SUBMITTED_TODAY';
  END IF;

  RETURN json_build_object(
    'id',            v_row.id,
    'check_in_date', v_row.check_in_date,
    'checked_in_at', v_row.checked_in_at,
    'latitude',      v_row.latitude,
    'longitude',     v_row.longitude
  );
END;
$$;
```

**Error codes raised:**
| Code | Meaning |
|---|---|
| `CHECKIN_INPUT_INVALID` | Empty MSISDN or null coordinates |
| `CHECKIN_ALREADY_SUBMITTED_TODAY` | Unique constraint slot already taken for today |

---

## 4. Shared GPS Helper

**File:** `src/utils/geolocation.ts`

```ts
export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export function captureCurrentPosition(): Promise<GeoPosition>
```

- Wraps `navigator.geolocation.getCurrentPosition` with `{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }`
- Validates `lat`/`lng`/`accuracy` against `isNaN` — rejects if invalid
- Rejects with human-readable messages:
  - Permission denied → `'Location permission denied. Please allow location access and try again.'`
  - Unavailable → `'Location unavailable. Please check your GPS signal.'`
  - Timeout → `'Location request timed out. Please try again.'`
  - NaN coords → `'Invalid GPS coordinates received. Please try again.'`
- `JobDetailView`'s inline `captureGPS()` (lines 682–730 of `hbb-installer-dashboard.tsx`) is replaced with a call to this function — no behavior change, just deduplication

---

## 5. API Function

**Added to:** `src/components/hbb/hbb-api.ts`

```ts
export async function submitInstallerCheckIn(params: {
  installerMsisdn: string;
  installerName: string;
  teamLeadMsisdn?: string | null;
  lat: number;
  lng: number;
  accuracy?: number;
}): Promise<{ id: string; checkInDate: string; checkedInAt: string; latitude: number; longitude: number }>
```

- Calls `supabase.rpc('hbb_installer_check_in', {...})` directly (same direct-Supabase pattern as `hbb-ga-api.ts`)
- Maps `CHECKIN_ALREADY_SUBMITTED_TODAY` PostgreSQL exception to `throw new Error('CHECKIN_ALREADY_SUBMITTED_TODAY')`
- Maps `CHECKIN_INPUT_INVALID` to `throw new Error('CHECKIN_INPUT_INVALID')`
- Any other error is re-thrown as-is

---

## 6. Frontend

### 6.1 Team lead MSISDN lookup

On `InstallerHome` mount, a single Supabase query fetches `team_lead_msisdn` from `hbb_installer_ga_monthly` where `installer_msisdn = normalizedPhone`. Result stored in component state. If not found, proceeds with `null` (column is nullable).

### 6.2 Check-in card placement

Inserted **between the stats row and "Today's Jobs" section** in `InstallerHome`. This is the first thing visible after the greeting — prominent without being intrusive.

### 6.3 Card states

**Idle (not yet checked in today):**
```
┌─────────────────────────────────────────┐
│  📍 Morning Check-In                    │
│  Tap to record your location for today  │
│                                         │
│  [ Check In for Today ]  ← red button  │
└─────────────────────────────────────────┘
```

**Loading (geolocation in progress):**
- Button disabled, spinner + "Getting your location…"

**Success (checked in this session):**
```
┌─────────────────────────────────────────┐
│  ✓ Checked In                 07:42 AM  │
│  -1.28602, 36.82034  (±8m)             │
└─────────────────────────────────────────┘
```
Green card. Persists for the session (state in component).

**Already checked in (duplicate returned by RPC):**
- Transitions to the success card showing today's date
- `toast.error('You already checked in today')`

### 6.4 Error handling

| Error | User-facing message |
|---|---|
| Geolocation denied | `toast.error('Location permission denied. Allow location access and try again.')` |
| Geolocation unavailable | `toast.error('Location unavailable. Check your GPS signal.')` |
| Geolocation timeout | `toast.error('Location timed out. Please try again.')` |
| Already checked in | `toast.error('You already checked in today')` + show success card |
| Network/DB error | `toast.error('Check-in failed. Please try again.')` |

### 6.5 Props flow

`HBBInstallerDashboard` passes props to `InstallerHome` via the `renderContent()` call. One new prop must be threaded down:
- `installerMsisdn` — add as a new prop to `InstallerHome`, sourced from `userPhone` in the parent (already in scope)
- `installerName` — already passed as `installerName` prop
- `teamLeadMsisdn` — fetched inside `InstallerHome` on mount via Supabase query; not threaded through the parent

No props need to bubble **up** to the parent — the check-in is fully self-contained once `installerMsisdn` is passed in.

---

## 7. Files Changed

| File | Change |
|---|---|
| `supabase/migrations/20260506_hbb_installer_morning_checkins.sql` | New — table + RPC |
| `src/utils/geolocation.ts` | New — shared GPS helper |
| `src/components/hbb/hbb-api.ts` | Add `submitInstallerCheckIn()` |
| `src/components/hbb/hbb-installer-dashboard.tsx` | Add check-in card to `InstallerHome`; refactor `JobDetailView.captureGPS()` to use shared helper |

---

## 8. Validation

- `tsc --noEmit` must pass after changes
- Check-in submits with valid lat/lng visible in response
- Second check-in same day returns `CHECKIN_ALREADY_SUBMITTED_TODAY` error and shows correct UI state
- Geolocation denial shows correct error toast
- Existing job status flow and GPS capture in `JobDetailView` unchanged
