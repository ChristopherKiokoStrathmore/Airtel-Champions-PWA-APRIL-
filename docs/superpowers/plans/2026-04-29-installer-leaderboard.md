# Installer Leaderboard & Supervisor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Installers see a peer leaderboard (ranked by GA count and jobs completed) among colleagues who share the same supervisor; supervisors can log in with a new role and see a full team dashboard.

**Architecture:** Add a `checkInstallerSupervisorTable` login step that matches against `installer_supervisor.Phone`, assigning role `hbb_installer_supervisor`. `App.tsx` routes this role to a new `HBBInstallerSupervisorDashboard`. The installer's own GA tab gains a leaderboard panel that queries all installers sharing the same `team_lead_msisdn`. All data is read-only; no DB migrations are needed.

**Tech Stack:** React 18, TypeScript, Supabase JS client, Tailwind CSS, Lucide icons, Sonner toasts.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/hbb/hbb-ga-api.ts` | Modify | Add 2 new API functions + 2 interfaces |
| `src/components/LoginPage.tsx` | Modify | Add supervisor login step (step 2c) |
| `src/App.tsx` | Modify | Add role type + routing for `hbb_installer_supervisor` |
| `src/components/hbb/hbb-installer-supervisor-dashboard.tsx` | **Create** | Full supervisor dashboard with leaderboard |
| `src/components/hbb/hbb-installer-ga-dashboard.tsx` | Modify | Add team leaderboard panel + `team_lead_msisdn` field |

---

## Task 1: Add API functions to `hbb-ga-api.ts`

**Files:**
- Modify: `src/components/hbb/hbb-ga-api.ts`

- [ ] **Step 1.1 — Add interfaces after the existing `InstallerDailyHistoryEntry` interface (around line 356)**

Open `src/components/hbb/hbb-ga-api.ts`. Find the block that ends with:
```ts
export interface TeamLeadData {
```
Insert these two interfaces immediately before it:

```ts
export interface InstallerLeaderboardEntry {
  msisdn: string;
  name: string;
  town: string;
  gaCount: number;
  incentiveEarned: number;
  position: number;
}

export interface InstallerJobsEntry {
  msisdn: string;
  name: string;
  town: string;
  jobsCompleted: number;
  position: number;
}
```

- [ ] **Step 1.2 — Add `getInstallersByTeamLead` after the closing brace of `getInstallerGACurrentMonth` (after line ~152)**

Find the end of `getInstallerGACurrentMonth` (the `return null;` line then `}`). Add directly after:

```ts
/**
 * Fetch all installers under a supervisor for the given month, ranked by GA count.
 * Queries hbb_installer_ga_monthly filtered by team_lead_msisdn.
 */
export async function getInstallersByTeamLead(
  teamLeadMsisdn: string,
  monthYear: string
): Promise<InstallerLeaderboardEntry[]> {
  const normalized = normalizePhone(teamLeadMsisdn);

  const { data, error } = await supabase
    .from('hbb_installer_ga_monthly')
    .select('installer_msisdn, installer_name, town, ga_count, incentive_earned')
    .eq('team_lead_msisdn', normalized)
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false });

  if (error) throw error;

  return (data || []).map((d, idx) => ({
    msisdn: d.installer_msisdn,
    name: d.installer_name,
    town: d.town || '',
    gaCount: d.ga_count || 0,
    incentiveEarned: d.incentive_earned || 0,
    position: idx + 1,
  }));
}
```

- [ ] **Step 1.3 — Add `getInstallerJobsLeaderboard` directly after `getInstallersByTeamLead`**

```ts
/**
 * Count completed service_requests per installer for all installers under a supervisor.
 * period='month' filters to the current calendar month; 'all' counts all time.
 */
export async function getInstallerJobsLeaderboard(
  teamLeadMsisdn: string,
  period: 'month' | 'all'
): Promise<InstallerJobsEntry[]> {
  const normalized = normalizePhone(teamLeadMsisdn);

  // Step 1: get all installer MSISDNs under this supervisor
  const { data: gaRows, error: gaErr } = await supabase
    .from('hbb_installer_ga_monthly')
    .select('installer_msisdn, installer_name, town')
    .eq('team_lead_msisdn', normalized);

  if (gaErr) throw gaErr;
  if (!gaRows || gaRows.length === 0) return [];

  // Step 2: generate phone variants for each MSISDN and look up installer IDs
  const allVariants: string[] = [];
  gaRows.forEach(inst => {
    const base = inst.installer_msisdn.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
    allVariants.push(base, '0' + base, '254' + base, '+254' + base);
  });

  const { data: installerRows, error: idErr } = await supabase
    .from('installers')
    .select('id, phone')
    .in('phone', [...new Set(allVariants)]);

  if (idErr) throw idErr;

  // Build phone → installer id map (try all variant formats)
  const phoneToId = new Map<string, number>();
  (installerRows || []).forEach(row => {
    const base = row.phone.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
    [base, '0' + base, '254' + base, '+254' + base].forEach(v => {
      if (!phoneToId.has(v)) phoneToId.set(v, row.id);
    });
  });

  const installerIds = [...new Set(Array.from(phoneToId.values()))];

  // Step 3: count completed service_requests per installer_id
  let jobCounts = new Map<number, number>();
  if (installerIds.length > 0) {
    let query = supabase
      .from('service_requests')
      .select('installer_id')
      .eq('status', 'completed')
      .in('installer_id', installerIds);

    if (period === 'month') {
      const [year, month] = getCurrentMonthYear().split('-');
      query = query.gte('completed_at', `${year}-${month}-01`);
    }

    const { data: jobs, error: jobErr } = await query;
    if (!jobErr) {
      (jobs || []).forEach(j => {
        const id = j.installer_id as number;
        jobCounts.set(id, (jobCounts.get(id) || 0) + 1);
      });
    }
  }

  // Step 4: merge and rank (keep all installers, even those with 0 jobs)
  return gaRows
    .map(inst => {
      const base = inst.installer_msisdn.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
      const instId = phoneToId.get(base) ?? phoneToId.get('0' + base) ?? null;
      return {
        msisdn: inst.installer_msisdn,
        name: inst.installer_name,
        town: inst.town || '',
        jobsCompleted: instId ? (jobCounts.get(instId) || 0) : 0,
        position: 0,
      };
    })
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
    .map((e, idx) => ({ ...e, position: idx + 1 }));
}
```

- [ ] **Step 1.4 — Verify TypeScript compiles with no new errors**

```bash
cd "C:/DEV/PWA/Airtel Champions App Web" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (pre-existing errors are OK, only new ones matter).

- [ ] **Step 1.5 — Commit**

```bash
git add src/components/hbb/hbb-ga-api.ts
git commit -m "feat(hbb): add installer leaderboard API functions"
```

---

## Task 2: Add supervisor login check to `LoginPage.tsx`

**Files:**
- Modify: `src/components/LoginPage.tsx`

- [ ] **Step 2.1 — Add `checkInstallerSupervisorTable` function after `checkDSETable` (around line 277)**

Find the closing brace of `checkDSETable` (the function that ends with `return null;` after the catch). Add immediately after:

```ts
// ─────────────────────────────────────────────────────────────────────────────
// STEP 2c — Installer Supervisor table check
// ─────────────────────────────────────────────────────────────────────────────
const checkInstallerSupervisorTable = async (
  normalised: string,
  enteredPin: string,
): Promise<any | null> => {
  const formats = phoneFormats(normalised);

  try {
    const { data, error: qErr } = await supabase
      .from('installer_supervisor')
      .select('"Installers supervisor", "Phone", pin')
      .in('"Phone"', formats)
      .limit(1);

    if (qErr) {
      console.log('[Auth] installer_supervisor not accessible:', qErr.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    const row = data[0];
    const storedPin = String(row.pin ?? '1234').trim();
    if (enteredPin !== storedPin) throw new Error(ERR_GENERIC);

    return {
      id:           row['Phone'],
      full_name:    row['Installers supervisor'],
      phone_number: row['Phone'],
      role:         'hbb_installer_supervisor',
      source_table: 'installer_supervisor',
      _loginAt:     Date.now(),
    };
  } catch (err: any) {
    if (err.message === ERR_GENERIC) throw err;
    console.log('[Auth] Supervisor table check error (non-fatal):', err.message);
    return null;
  }
};
```

- [ ] **Step 2.2 — Wire step 2c into `handleLogin`**

Find this block in `handleLogin` (around line 467–482):
```ts
      // ── STEP 2b: DSE table check ─────────────────────────────────────────
      const dseUser = await checkDSETable(normalised, pin || '');

      if (dseUser) {
        if (mode === 'hbb') {
          console.log('✅ DSE login (DSE_14TOWNS table):', dseUser.full_name);
          localStorage.setItem('tai_user', JSON.stringify(dseUser));
          setUser(dseUser);
          setUserData(dseUser);
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          throw new Error(ERR_GENERIC);
        }
        return;
      }
```

Add immediately after the closing `return;` of that block (before `if (mode === 'sales')`):

```ts
      // ── STEP 2c: Installer Supervisor table check ────────────────────────
      if (mode === 'hbb') {
        const supervisorUser = await checkInstallerSupervisorTable(normalised, pin || '');
        if (supervisorUser) {
          console.log('✅ Supervisor login:', supervisorUser.full_name);
          localStorage.setItem('tai_user', JSON.stringify(supervisorUser));
          setUser(supervisorUser);
          setUserData(supervisorUser);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      }
```

- [ ] **Step 2.3 — Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 2.4 — Commit**

```bash
git add src/components/LoginPage.tsx
git commit -m "feat(auth): add installer supervisor login step (step 2c)"
```

---

## Task 3: Add role + routing to `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 3.1 — Add role to `UserRole` type**

Find (around line 99):
```ts
type UserRole = 'sales_executive' | 'zonal_sales_manager' | 'zonal_business_manager' | 'hq_command_center' | 'director' | 'hbb_agent' | 'hbb_installer' | 'hbb_dse' | 'hbb_hq' | 'hbb_hq_admin' | 'airtel_money_agent' | 'airtel_money_admin';
```

Replace with:
```ts
type UserRole = 'sales_executive' | 'zonal_sales_manager' | 'zonal_business_manager' | 'hq_command_center' | 'director' | 'hbb_agent' | 'hbb_installer' | 'hbb_installer_supervisor' | 'hbb_dse' | 'hbb_hq' | 'hbb_hq_admin' | 'airtel_money_agent' | 'airtel_money_admin';
```

- [ ] **Step 3.2 — Add import for the new supervisor dashboard**

Find the existing HBB imports block:
```ts
import { HBBAgentDashboard } from './components/hbb/hbb-agent-dashboard';
import { HBBInstallerDashboard } from './components/hbb/hbb-installer-dashboard';
import { DSEDashboard } from './components/hbb/hbb-dse-dashboard';
import { HBBHQDashboard } from './components/hbb/hbb-hq-dashboard';
```

Add a new import line after `HBBInstallerDashboard`:
```ts
import { HBBInstallerSupervisorDashboard } from './components/hbb/hbb-installer-supervisor-dashboard';
```

- [ ] **Step 3.3 — Add supervisor to the HBB session TTL check**

Find (around line 432):
```ts
const isHBBUser = ['hbb_agent','hbb_installer','hbb_dse','hbb_hq','hbb_hq_admin'].includes(parsedUserData.role);
```

Replace with:
```ts
const isHBBUser = ['hbb_agent','hbb_installer','hbb_installer_supervisor','hbb_dse','hbb_hq','hbb_hq_admin'].includes(parsedUserData.role);
```

- [ ] **Step 3.4 — Add routing for supervisor role**

Find the first occurrence of this block (around line 653):
```ts
    if (userRole === 'hbb_installer') {
      return (
        <MobileContainer>
          <HBBInstallerDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }
```

Add immediately after the closing `}` of that block:
```ts
    if (userRole === 'hbb_installer_supervisor') {
      return (
        <MobileContainer>
          <HBBInstallerSupervisorDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }
```

Find the **second** occurrence of the same `hbb_installer` block (around line 878) and add the same supervisor block after it:
```ts
    if (userRole === 'hbb_installer_supervisor') {
      return (
        <MobileContainer>
          <HBBInstallerSupervisorDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }
```

- [ ] **Step 3.5 — Verify TypeScript compiles (will fail on missing component — that's expected)**

```bash
npx tsc --noEmit 2>&1 | grep "hbb-installer-supervisor"
```

Expected: error about missing module — this resolves in Task 4.

- [ ] **Step 3.6 — Commit (with the TS error noted — component created next)**

```bash
git add src/App.tsx
git commit -m "feat(routing): add hbb_installer_supervisor role + routing"
```

---

## Task 4: Create `HBBInstallerSupervisorDashboard`

**Files:**
- Create: `src/components/hbb/hbb-installer-supervisor-dashboard.tsx`

- [ ] **Step 4.1 — Create the full component file**

```tsx
// src/components/hbb/hbb-installer-supervisor-dashboard.tsx
// Supervisor dashboard: shows a ranked leaderboard of installers under this supervisor.
// Two tabs — GA Count (current month) and Jobs Completed (current month / all time).

import { useState, useEffect } from 'react';
import { LogOut, RefreshCw, TrendingUp, Briefcase, Medal, User, Users } from 'lucide-react';
import {
  getInstallersByTeamLead,
  getInstallerJobsLeaderboard,
  InstallerLeaderboardEntry,
  InstallerJobsEntry,
} from './hbb-ga-api';
import { getCurrentMonthYear, normalizePhone, formatCurrency } from './hbb-ga-utilities';
import { toast } from 'sonner';

const ACCENT = '#E60000';
const ACCENT_DARK = '#CC0000';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

export function HBBInstallerSupervisorDashboard({ user, userData, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'ga' | 'jobs'>('ga');
  const [jobsPeriod, setJobsPeriod] = useState<'month' | 'all'>('month');
  const [gaList, setGaList] = useState<InstallerLeaderboardEntry[]>([]);
  const [jobsList, setJobsList] = useState<InstallerJobsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const supervisorPhone = normalizePhone(userData?.phone_number || user?.phone_number || '');
  const supervisorName  = userData?.full_name || user?.full_name || 'Supervisor';
  const monthYear = getCurrentMonthYear();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getInstallersByTeamLead(supervisorPhone, monthYear),
      getInstallerJobsLeaderboard(supervisorPhone, jobsPeriod),
    ]).then(([gaData, jobsData]) => {
      if (cancelled) return;
      setGaList(gaData);
      setJobsList(jobsData);
    }).catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // refreshKey bumped by the refresh button to force a re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorPhone, monthYear, jobsPeriod, refreshKey]);

  const totalGAs  = gaList.reduce((s, e) => s + e.gaCount, 0);
  const totalJobs = jobsList.reduce((s, e) => s + e.jobsCompleted, 0);
  const teamSize  = gaList.length;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)' }}
    >
      {/* Top Bar */}
      <div
        className="flex-shrink-0 px-4 pb-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(155deg, ${ACCENT} 0%, ${ACCENT_DARK} 80%, #A80C23 100%)`,
          paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 14px)',
          boxShadow: '0 10px 24px rgba(168,12,35,0.24)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/18 border border-white/15">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] tracking-wide leading-tight">{supervisorName}</h1>
            <p className="text-white/72 text-[10px]">Installer Supervisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-xl bg-white/20 active:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-white/20 active:bg-white/30 transition-colors"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex-shrink-0 px-4 pt-4 grid grid-cols-3 gap-2.5">
        <SummaryCard label="Installers" value={teamSize} icon={User} />
        <SummaryCard label="Team GAs" value={totalGAs} icon={TrendingUp} />
        <SummaryCard label={activeTab === 'ga' ? 'Month' : 'Jobs'} value={activeTab === 'ga' ? totalGAs : totalJobs} icon={Briefcase} />
      </div>

      {/* Tab toggle */}
      <div className="flex-shrink-0 px-4 pt-4 flex gap-2">
        <button
          onClick={() => setActiveTab('ga')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'ga' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
          style={activeTab === 'ga' ? { backgroundColor: ACCENT } : undefined}
        >
          GA Count
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'jobs' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
          style={activeTab === 'jobs' ? { backgroundColor: ACCENT } : undefined}
        >
          Jobs Completed
        </button>
      </div>

      {/* Jobs period toggle (only in jobs tab) */}
      {activeTab === 'jobs' && (
        <div className="flex-shrink-0 px-4 pt-2 flex gap-1.5">
          {(['month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setJobsPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                jobsPeriod === p ? 'text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
              style={jobsPeriod === p ? { backgroundColor: ACCENT_DARK } : undefined}
            >
              {p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-8 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'ga' ? (
          gaList.length === 0 ? (
            <EmptyState message="No GA data found for this month" />
          ) : (
            gaList.map(entry => (
              <GALeaderboardRow key={entry.msisdn} entry={entry} />
            ))
          )
        ) : (
          jobsList.length === 0 ? (
            <EmptyState message="No installers found under your supervision" />
          ) : (
            jobsList.map(entry => (
              <JobsLeaderboardRow key={entry.msisdn} entry={entry} />
            ))
          )
        )}
      </div>
    </div>
  );
}

// ─── SUMMARY CARD ───────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: ACCENT }} />
      <p className="text-xl font-bold" style={{ color: ACCENT_DARK }}>{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── MEDAL HELPER ────────────────────────────────────────────────────────────
function MedalBadge({ position }: { position: number }) {
  const medals: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: '#FEF3C7', text: '#D97706', label: '🥇' },
    2: { bg: '#F3F4F6', text: '#6B7280', label: '🥈' },
    3: { bg: '#FEF2F2', text: '#B45309', label: '🥉' },
  };
  const m = medals[position];
  if (m) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: m.bg, color: m.text }}>
        {m.label}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 flex-shrink-0">
      {position}
    </div>
  );
}

// ─── GA LEADERBOARD ROW ──────────────────────────────────────────────────────
function GALeaderboardRow({ entry }: { entry: InstallerLeaderboardEntry }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
      <MedalBadge position={entry.position} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
        <p className="text-[11px] text-gray-500">{entry.town || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold" style={{ color: ACCENT }}>{entry.gaCount}</p>
        <p className="text-[9px] text-gray-400">GAs</p>
        {entry.incentiveEarned > 0 && (
          <p className="text-[10px] font-medium text-green-600">{formatCurrency(entry.incentiveEarned)}</p>
        )}
      </div>
    </div>
  );
}

// ─── JOBS LEADERBOARD ROW ────────────────────────────────────────────────────
function JobsLeaderboardRow({ entry }: { entry: InstallerJobsEntry }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
      <MedalBadge position={entry.position} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
        <p className="text-[11px] text-gray-500">{entry.town || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold" style={{ color: '#10B981' }}>{entry.jobsCompleted}</p>
        <p className="text-[9px] text-gray-400">jobs</p>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
```

- [ ] **Step 4.2 — Verify TypeScript compiles with no new errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4.3 — Commit**

```bash
git add src/components/hbb/hbb-installer-supervisor-dashboard.tsx
git commit -m "feat(hbb): add HBBInstallerSupervisorDashboard with GA + jobs leaderboard"
```

---

## Task 5: Add team leaderboard panel to installer GA dashboard

**Files:**
- Modify: `src/components/hbb/hbb-installer-ga-dashboard.tsx`

- [ ] **Step 5.1 — Add `team_lead_msisdn` to `InstallerGAData` interface**

Find (around line 11):
```ts
interface InstallerGAData {
  installer_msisdn: string;
  installer_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  month_year: string;
}
```

Replace with:
```ts
interface InstallerGAData {
  installer_msisdn: string;
  installer_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  month_year: string;
  team_lead_msisdn?: string | null;
}
```

- [ ] **Step 5.2 — Import the new API types and functions**

Find the existing imports at the top:
```ts
import { getInstallerDailyHistory, getInstallerGACurrentMonth } from './hbb-ga-api';
```

Replace with:
```ts
import {
  getInstallerDailyHistory,
  getInstallerGACurrentMonth,
  getInstallersByTeamLead,
  InstallerLeaderboardEntry,
} from './hbb-ga-api';
```

- [ ] **Step 5.3 — Extract `team_lead_msisdn` in `loadData`**

Find in `loadData` (around line 72) this block:
```ts
      if (data) {
        setGaData({
          installer_msisdn: data.installer_msisdn,
          installer_name: data.installer_name,
          ga_count: data.ga_count || 0,
          current_band_min: data.current_band_min || 0,
          current_band_max: data.current_band_max || 20,
          incentive_earned: data.incentive_earned || 0,
          month_year: data.month_year,
        });
```

Replace with:
```ts
      if (data) {
        setGaData({
          installer_msisdn: data.installer_msisdn,
          installer_name: data.installer_name,
          ga_count: data.ga_count || 0,
          current_band_min: data.current_band_min || 0,
          current_band_max: data.current_band_max || 20,
          incentive_earned: data.incentive_earned || 0,
          month_year: data.month_year,
          team_lead_msisdn: data.team_lead_msisdn || null,
        });
```

- [ ] **Step 5.4 — Add leaderboard state to `HBBInstallerGADashboard`**

Find in the component body (around line 43):
```ts
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
```

Add after it:
```ts
  const [leaderboard, setLeaderboard] = useState<InstallerLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
```

- [ ] **Step 5.5 — Fetch leaderboard when `gaData` has a `team_lead_msisdn`**

Find the existing `useEffect` that calls `loadData()`:
```ts
  useEffect(() => {
    loadData();
  // Re-run when phone changes or when real name first becomes available after async lookup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhone, hasRealName]);
```

Add a new `useEffect` immediately after it:
```ts
  useEffect(() => {
    if (!gaData?.team_lead_msisdn) return;
    let cancelled = false;
    setLeaderboardLoading(true);
    getInstallersByTeamLead(gaData.team_lead_msisdn, gaData.month_year)
      .then(data => { if (!cancelled) setLeaderboard(data); })
      .catch(() => {/* silent — leaderboard is best-effort */})
      .finally(() => { if (!cancelled) setLeaderboardLoading(false); });
    return () => { cancelled = true; };
  }, [gaData?.team_lead_msisdn, gaData?.month_year]);
```

- [ ] **Step 5.6 — Render the leaderboard panel in the `current` view**

Find the closing `</>` of the `viewMode === 'current'` block (around line 253, after the Incentive Breakdown section). Add the leaderboard panel before that closing tag:

```tsx
            {/* Team Leaderboard */}
            {(leaderboard.length > 0 || leaderboardLoading) && gaData.team_lead_msisdn && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Team Leaderboard</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Your position among installers under your supervisor ({gaData.month_year})
                </p>

                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Position banner */}
                    {(() => {
                      const myEntry = leaderboard.find(e => e.msisdn === gaData.installer_msisdn);
                      if (!myEntry) return null;
                      return (
                        <div
                          className="rounded-xl px-4 py-2 mb-4 text-center text-sm font-semibold text-white"
                          style={{ backgroundColor: '#E60000' }}
                        >
                          You are #{myEntry.position} of {leaderboard.length} installers
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      {leaderboard.map(entry => {
                        const isMe = entry.msisdn === gaData.installer_msisdn;
                        return (
                          <div
                            key={entry.msisdn}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 border"
                            style={{
                              backgroundColor: isMe ? '#FEF2F2' : '#F9FAFB',
                              borderColor: isMe ? '#FECACA' : '#E5E7EB',
                            }}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: entry.position <= 3 ? '#E60000' : '#E5E7EB',
                                color: entry.position <= 3 ? 'white' : '#6B7280',
                              }}
                            >
                              {entry.position}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isMe ? 'font-bold text-red-700' : 'font-medium text-gray-800'}`}>
                                {entry.name}{isMe ? ' (You)' : ''}
                              </p>
                              {entry.town && (
                                <p className="text-[10px] text-gray-500">{entry.town}</p>
                              )}
                            </div>
                            <span
                              className={`text-sm font-bold flex-shrink-0 ${isMe ? 'text-red-600' : 'text-gray-700'}`}
                            >
                              {entry.gaCount} GAs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
```

- [ ] **Step 5.7 — Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5.8 — Commit**

```bash
git add src/components/hbb/hbb-installer-ga-dashboard.tsx
git commit -m "feat(hbb): add team leaderboard panel to installer GA dashboard"
```

---

## Task 6: Manual verification

- [ ] **Step 6.1 — Start the dev server**

```bash
npm run dev
```

- [ ] **Step 6.2 — Test supervisor login**
  1. Switch the app to **HBB mode**
  2. Enter a phone number that exists in `installer_supervisor."Phone"` with PIN `1234`
  3. Verify you land on `HBBInstallerSupervisorDashboard` (shows the supervisor's name in the top bar, not the installer dashboard)
  4. Verify wrong PIN shows "Sorry, user cannot log in"
  5. Verify a phone NOT in `installer_supervisor` falls through to the normal HBB installer/agent check

- [ ] **Step 6.3 — Test supervisor GA leaderboard tab**
  1. Logged in as supervisor: confirm the GA tab shows a ranked list of installers
  2. Names and GA counts match what's in `hbb_installer_ga_monthly` for `team_lead_msisdn = supervisorPhone`
  3. Top 3 show medal emojis (🥇🥈🥉)

- [ ] **Step 6.4 — Test supervisor Jobs tab**
  1. Switch to "Jobs Completed" tab
  2. Confirm the list renders (may show all zeros if no service_requests data links via phone → installer ID)
  3. Toggle "This Month" / "All Time" — list re-fetches each time

- [ ] **Step 6.5 — Test installer leaderboard panel**
  1. Log in as an installer whose `hbb_installer_ga_monthly` row has a non-null `team_lead_msisdn`
  2. Go to the GA tab → "Current Month" view
  3. Scroll below the incentive card — the "Team Leaderboard" section should appear
  4. Confirm your own row is highlighted in red with "(You)" appended
  5. Confirm the position banner shows "You are #X of Y installers"
  6. If `team_lead_msisdn` is null (no supervisor linked), the leaderboard section does not render

- [ ] **Step 6.6 — Final commit**

```bash
git add -A
git status
git commit -m "feat(hbb): installer leaderboard + supervisor dashboard — complete"
```
