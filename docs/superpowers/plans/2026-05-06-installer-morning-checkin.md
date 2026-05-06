# HBB Installer Morning Check-In — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a morning check-in feature to the HBB installer dashboard that captures and stores live GPS coordinates once per calendar day per installer.

**Architecture:** New Supabase table `hbb_installer_morning_checkins` with a DB-level uniqueness constraint (one row per installer per date), an atomic RPC `hbb_installer_check_in` that raises named exceptions on validation failure or duplicate, and a self-contained `MorningCheckInCard` component embedded in `InstallerHome`. GPS capture is extracted into a shared `captureCurrentPosition()` helper that also replaces the inline `captureGPS()` in `JobDetailView`.

**Tech Stack:** React 18, TypeScript 5, Supabase JS client (direct), sonner (toasts), Lucide icons, Vite (`npm run type-check`)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260506_hbb_installer_morning_checkins.sql` | Create | Table DDL + indexes + RPC |
| `src/utils/geolocation.ts` | Create | Promise-based `captureCurrentPosition()` |
| `src/components/hbb/hbb-api.ts` | Modify | Add `submitInstallerCheckIn()` |
| `src/components/hbb/hbb-installer-dashboard.tsx` | Modify | `MorningCheckInCard`, `InstallerHome` prop, `JobDetailView` refactor |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260506_hbb_installer_morning_checkins.sql`

- [ ] **Step 1.1: Create the migration file**

```sql
-- supabase/migrations/20260506_hbb_installer_morning_checkins.sql
-- Table and RPC for installer daily morning check-in.

-- ─── TABLE ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hbb_installer_morning_checkins (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  installer_msisdn text        NOT NULL,
  installer_name   text,
  team_lead_msisdn text        REFERENCES public.hbb_installer_team_lead(team_lead_msisdn) ON DELETE SET NULL,
  check_in_date    date        NOT NULL DEFAULT current_date,
  checked_in_at    timestamptz NOT NULL DEFAULT now(),
  latitude         double precision NOT NULL,
  longitude        double precision NOT NULL,
  accuracy_meters  double precision,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hbb_installer_morning_checkins_pkey        PRIMARY KEY (id),
  CONSTRAINT hbb_installer_checkin_once_per_day         UNIQUE (installer_msisdn, check_in_date)
);

CREATE INDEX IF NOT EXISTS hbb_installer_checkin_msisdn_idx
  ON public.hbb_installer_morning_checkins (installer_msisdn);

CREATE INDEX IF NOT EXISTS hbb_installer_checkin_date_idx
  ON public.hbb_installer_morning_checkins (check_in_date DESC);

-- ─── RPC ─────────────────────────────────────────────────────────────────────
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

- [ ] **Step 1.2: Commit the migration**

```bash
git add supabase/migrations/20260506_hbb_installer_morning_checkins.sql
git commit -m "feat(db): add hbb_installer_morning_checkins table and RPC"
```

---

## Task 2: Shared GPS Helper

**Files:**
- Create: `src/utils/geolocation.ts`

- [ ] **Step 2.1: Create the helper**

```typescript
// src/utils/geolocation.ts
export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export function captureCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location unavailable. Your browser does not support geolocation.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        if (isNaN(lat) || isNaN(lng) || isNaN(accuracy)) {
          reject(new Error('Invalid GPS coordinates received. Please try again.'));
          return;
        }
        resolve({ lat, lng, accuracy });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please allow location access and try again.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Please check your GPS signal.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Could not get location. Please try again.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
```

- [ ] **Step 2.2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/utils/geolocation.ts
git commit -m "feat(utils): add captureCurrentPosition GPS helper"
```

---

## Task 3: API Function

**Files:**
- Modify: `src/components/hbb/hbb-api.ts` (append after the `seedTestData` export)

- [ ] **Step 3.1: Add `submitInstallerCheckIn` to `hbb-api.ts`**

Append the following after the last export in the file (`getDebugInfo`):

```typescript
// ─── INSTALLER MORNING CHECK-IN ─────────────────────────────────────────────
export async function submitInstallerCheckIn(params: {
  installerMsisdn: string;
  installerName: string;
  teamLeadMsisdn?: string | null;
  lat: number;
  lng: number;
  accuracy?: number;
}): Promise<{
  id: string;
  checkInDate: string;
  checkedInAt: string;
  latitude: number;
  longitude: number;
}> {
  const { data, error } = await supabase.rpc('hbb_installer_check_in', {
    p_installer_msisdn:  params.installerMsisdn,
    p_installer_name:    params.installerName,
    p_team_lead_msisdn:  params.teamLeadMsisdn ?? null,
    p_latitude:          params.lat,
    p_longitude:         params.lng,
    p_accuracy_meters:   params.accuracy ?? null,
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('CHECKIN_ALREADY_SUBMITTED_TODAY')) throw new Error('CHECKIN_ALREADY_SUBMITTED_TODAY');
    if (msg.includes('CHECKIN_INPUT_INVALID'))           throw new Error('CHECKIN_INPUT_INVALID');
    throw error;
  }

  return {
    id:          data.id,
    checkInDate: data.check_in_date,
    checkedInAt: data.checked_in_at,
    latitude:    data.latitude,
    longitude:   data.longitude,
  };
}
```

- [ ] **Step 3.2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/components/hbb/hbb-api.ts
git commit -m "feat(hbb-api): add submitInstallerCheckIn RPC wrapper"
```

---

## Task 4: Check-In Card UI + InstallerHome Wiring

**Files:**
- Modify: `src/components/hbb/hbb-installer-dashboard.tsx`

### Step 4.1 — Add imports

- [ ] **Step 4.1: Update the import block at the top of `hbb-installer-dashboard.tsx`**

Find the existing import from `./hbb-api`:
```typescript
import { getServiceRequests, updateServiceRequestStatus, getInstallerByPhone, generateWhatsAppLink, changePin } from './hbb-api';
```

Replace it with:
```typescript
import { getServiceRequests, updateServiceRequestStatus, getInstallerByPhone, generateWhatsAppLink, changePin, submitInstallerCheckIn, normalizeKenyanPhone } from './hbb-api';
```

Then add a new import line directly after the existing `import { supabase }` line:
```typescript
import { captureCurrentPosition } from '../../utils/geolocation';
```

### Step 4.2 — Pass `installerMsisdn` down to `InstallerHome`

- [ ] **Step 4.2: Update the `InstallerHome` call inside `renderContent()`**

Find:
```typescript
      default:
        return (
          <InstallerHome
            userName={userName}
            installerName={installer?.name || userName}
            assignedCount={assignedJobs.length}
            todayCount={todayJobs.length}
            completedCount={completedJobs.length}
            totalCount={jobs.length}
            todayJobs={todayJobs.length > 0 ? todayJobs : assignedJobs.slice(0, 3)}
            loading={loading}
            onRefresh={fetchData}
            onSelectJob={setSelectedJob}
            onViewAll={() => setActiveTab('jobs')}
          />
        );
```

Replace with:
```typescript
      default:
        return (
          <InstallerHome
            userName={userName}
            installerName={installer?.name || userName}
            assignedCount={assignedJobs.length}
            todayCount={todayJobs.length}
            completedCount={completedJobs.length}
            totalCount={jobs.length}
            todayJobs={todayJobs.length > 0 ? todayJobs : assignedJobs.slice(0, 3)}
            loading={loading}
            onRefresh={fetchData}
            onSelectJob={setSelectedJob}
            onViewAll={() => setActiveTab('jobs')}
            installerMsisdn={userPhone}
          />
        );
```

### Step 4.3 — Add `MorningCheckInCard` component

- [ ] **Step 4.3: Insert `MorningCheckInCard` before the `// ─── JOBS LIST` comment**

Find this comment line in the file:
```typescript
// ─── JOBS LIST ──────────────────────────────────────────────────────────────
```

Insert the following block immediately before it:

```typescript
// ─── MORNING CHECK-IN CARD ──────────────────────────────────────────────────
function MorningCheckInCard({ installerMsisdn, installerName }: { installerMsisdn: string; installerName: string }) {
  const [state, setState] = React.useState<'loading-today' | 'idle' | 'checking' | 'done'>('loading-today');
  const [result, setResult] = React.useState<{ checkedInAt: string; lat: number; lng: number; accuracy?: number } | null>(null);
  const [teamLeadMsisdn, setTeamLeadMsisdn] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!installerMsisdn) return;
    const msisdn = normalizeKenyanPhone(installerMsisdn);
    const today = new Date().toISOString().split('T')[0];

    (async () => {
      try {
        const { data: existing } = await supabase
          .from('hbb_installer_morning_checkins')
          .select('checked_in_at, latitude, longitude, accuracy_meters')
          .eq('installer_msisdn', msisdn)
          .eq('check_in_date', today)
          .maybeSingle();

        if (existing) {
          setResult({ checkedInAt: existing.checked_in_at, lat: existing.latitude, lng: existing.longitude, accuracy: existing.accuracy_meters ?? undefined });
          setState('done');
          return;
        }

        const { data: gaRow } = await supabase
          .from('hbb_installer_ga_monthly')
          .select('team_lead_msisdn')
          .eq('installer_msisdn', msisdn)
          .order('month_year', { ascending: false })
          .limit(1)
          .maybeSingle();

        setTeamLeadMsisdn(gaRow?.team_lead_msisdn ?? null);
        setState('idle');
      } catch {
        setState('idle');
      }
    })();
  }, [installerMsisdn]);

  const handleCheckIn = async () => {
    setState('checking');
    try {
      const pos = await captureCurrentPosition();
      const res = await submitInstallerCheckIn({
        installerMsisdn,
        installerName,
        teamLeadMsisdn,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
      });
      setResult({ checkedInAt: res.checkedInAt, lat: res.latitude, lng: res.longitude, accuracy: pos.accuracy });
      setState('done');
      toast.success('Checked in successfully!');
    } catch (err: any) {
      if (err.message === 'CHECKIN_ALREADY_SUBMITTED_TODAY') {
        toast.error('You already checked in today');
        setState('done');
        return;
      }
      toast.error(err.message || 'Check-in failed. Please try again.');
      setState('idle');
    }
  };

  if (state === 'loading-today') {
    return (
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm text-gray-400">Loading check-in status…</span>
      </div>
    );
  }

  if (state === 'done') {
    const time = result ? new Date(result.checkedInAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';
    return (
      <div className="rounded-3xl p-4 border border-green-200 bg-green-50 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-700">Checked In Today</p>
          {result && (
            <p className="text-[11px] text-green-600 font-mono truncate">
              {result.lat.toFixed(5)}, {result.lng.toFixed(5)}
              {result.accuracy ? ` (±${Math.round(result.accuracy)}m)` : ''}
            </p>
          )}
        </div>
        {time && <span className="text-xs font-semibold text-green-600 flex-shrink-0">{time}</span>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF2F2' }}>
          <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Morning Check-In</p>
          <p className="text-[10px] text-gray-400">Tap to record your location for today</p>
        </div>
      </div>
      <button
        onClick={handleCheckIn}
        disabled={state === 'checking'}
        className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
        style={{ backgroundColor: ACCENT }}
      >
        {state === 'checking' ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Getting your location…
          </>
        ) : (
          <>
            <Navigation className="w-4 h-4" />
            Check In for Today
          </>
        )}
      </button>
    </div>
  );
}

```

### Step 4.4 — Place the card in `InstallerHome`

- [ ] **Step 4.4: Add `installerMsisdn` prop and the card to `InstallerHome`**

Find the `InstallerHome` function signature:
```typescript
function InstallerHome({ userName, assignedCount, todayCount, completedCount, totalCount, todayJobs, loading, onRefresh, onSelectJob, onViewAll, installerName }: any) {
```

Replace with:
```typescript
function InstallerHome({ userName, assignedCount, todayCount, completedCount, totalCount, todayJobs, loading, onRefresh, onSelectJob, onViewAll, installerName, installerMsisdn }: any) {
```

Then find the Stats section inside `InstallerHome`:
```typescript
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Pending" value={assignedCount} color={ACCENT_DARK} bg="#FFF5F5" />
        <StatCard label="Today" value={todayCount} color={ACCENT} bg="#FEF2F2" />
        <StatCard label="Done" value={completedCount} color="#10B981" bg="#ECFDF5" />
      </div>

      {/* Upcoming Jobs */}
```

Replace with:
```typescript
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Pending" value={assignedCount} color={ACCENT_DARK} bg="#FFF5F5" />
        <StatCard label="Today" value={todayCount} color={ACCENT} bg="#FEF2F2" />
        <StatCard label="Done" value={completedCount} color="#10B981" bg="#ECFDF5" />
      </div>

      {/* Morning Check-In */}
      {installerMsisdn && (
        <MorningCheckInCard
          installerMsisdn={installerMsisdn}
          installerName={installerName || userName}
        />
      )}

      {/* Upcoming Jobs */}
```

- [ ] **Step 4.5: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add src/components/hbb/hbb-installer-dashboard.tsx
git commit -m "feat(installer): add morning check-in card to InstallerHome"
```

---

## Task 5: Refactor `JobDetailView.captureGPS` to Use Shared Helper

**Files:**
- Modify: `src/components/hbb/hbb-installer-dashboard.tsx` (inside `JobDetailView`)

- [ ] **Step 5.1: Replace the inline `captureGPS` function in `JobDetailView`**

Find the entire `captureGPS` function inside `JobDetailView` (approximately lines 682–730):
```typescript
  // Capture GPS location
  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[GPS] Raw position object:', pos);
        console.log('[GPS] Position coords:', pos.coords);
        
        // Validate GPS coordinates to prevent NaN values
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        
        console.log('[GPS] Extracted values:', {
          lat,
          lng,
          accuracy,
          latIsNaN: isNaN(lat),
          lngIsNaN: isNaN(lng),
          accuracyIsNaN: accuracy ? isNaN(accuracy) : 'N/A'
        });
        
        if (isNaN(lat) || isNaN(lng) || (accuracy && isNaN(accuracy))) {
          setGpsError('Invalid GPS coordinates received');
          setGpsLoading(false);
          toast.error('Invalid GPS coordinates');
          return;
        }
        
        setGpsLocation({
          lat: lat,
          lng: lng,
          accuracy: accuracy,
        });
        setGpsLoading(false);
        toast.success('Location captured!');
      },
      (err) => {
        setGpsError(err.message || 'Failed to get location');
        setGpsLoading(false);
        toast.error('Could not capture location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
```

Replace with:
```typescript
  // Capture GPS location
  const captureGPS = async () => {
    setGpsLoading(true);
    setGpsError('');
    try {
      const pos = await captureCurrentPosition();
      setGpsLocation({ lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy });
      toast.success('Location captured!');
    } catch (err: any) {
      setGpsError(err.message || 'Failed to get location');
      toast.error('Could not capture location');
    } finally {
      setGpsLoading(false);
    }
  };
```

- [ ] **Step 5.2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add src/components/hbb/hbb-installer-dashboard.tsx
git commit -m "refactor(installer): replace inline captureGPS with shared helper"
```

---

## Task 6: Final Validation

- [ ] **Step 6.1: Full type-check**

```bash
npm run type-check
```

Expected: zero errors.

- [ ] **Step 6.2: Build check (optional but recommended)**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 6.3: Manual validation checklist**

Open the installer dashboard in a browser and verify:

1. **First load**: Check-in card appears in home tab between stats and jobs; shows spinner briefly then "Check In for Today" button.
2. **Tap check-in**: Button shows "Getting your location…" spinner while GPS is captured.
3. **Success**: Green "Checked In Today" card appears with lat/lng coordinates and time. `toast.success` fires.
4. **Reload**: Card immediately shows green success state (loads from DB on mount).
5. **Second tap (different session)**: Duplicate error shows `toast.error('You already checked in today')` and card stays green.
6. **GPS denied**: `toast.error` shows "Location permission denied…" message; button returns to idle.
7. **Existing GPS flow**: Opening a job and using "Capture My Location" in `JobDetailView` still works correctly.
8. **DB check**: Confirm row exists in `hbb_installer_morning_checkins` with correct `installer_msisdn`, `latitude`, `longitude`, and `check_in_date = today`.

- [ ] **Step 6.4: Verify uniqueness constraint**

Run in Supabase SQL editor:
```sql
-- Insert a test row
INSERT INTO public.hbb_installer_morning_checkins (installer_msisdn, latitude, longitude)
VALUES ('0712345678', -1.2921, 36.8219);

-- Attempt a duplicate — must fail with unique_violation
INSERT INTO public.hbb_installer_morning_checkins (installer_msisdn, latitude, longitude)
VALUES ('0712345678', -1.2922, 36.8220);
-- Expected: ERROR: duplicate key value violates unique constraint "hbb_installer_checkin_once_per_day"
```

Clean up:
```sql
DELETE FROM public.hbb_installer_morning_checkins WHERE installer_msisdn = '0712345678';
```
