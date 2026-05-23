# Promoter Team Lead Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully isolated Promoter Team Lead system — self-registration, promoter management, and daily GA reporting — accessible via a new button on the Sales-mode login page.

**Architecture:** 4 new Supabase tables (zero changes to existing tables), 2 Supabase RPCs for bcrypt auth, a dedicated React component tree under `src/components/promoter-team-lead/`, and two small wiring changes to `LoginPage.tsx` and `App.tsx`. Session stored in `localStorage` as `tai_tl_user`, entirely separate from `tai_user`.

**Tech Stack:** React + TypeScript, Tailwind CSS, Supabase (anon key, no Supabase Auth), pgcrypto (bcrypt), Vite dev server (`npm run dev`), type-check with `npm run type-check`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/supabase/migrations/012_promoter_team_lead.sql` | Create | All 4 tables, indexes, RPCs, locking trigger |
| `src/components/promoter-team-lead/promoter-tl-api.ts` | Create | All Supabase calls + TypeScript types |
| `src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx` | Create | Login + signup screen |
| `src/components/promoter-team-lead/tabs/TodayTab.tsx` | Create | GA entry rows, total bar, submit |
| `src/components/promoter-team-lead/tabs/PromotersTab.tsx` | Create | Add / drop promoters |
| `src/components/promoter-team-lead/tabs/HistoryTab.tsx` | Create | Past reports read-only view |
| `src/components/promoter-team-lead/tabs/SettingsTab.tsx` | Create | Profile display + logout |
| `src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx` | Create | 4-tab shell + header |
| `src/components/LoginPage.tsx` | Modify | Add PROMOTER TEAM LEAD button (Sales mode only) |
| `src/App.tsx` | Modify | Add TL session check + route to dashboard |

---

## Task 1: Database Migration

**Files:**
- Create: `src/supabase/migrations/012_promoter_team_lead.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ================================================================
-- 012_promoter_team_lead.sql
-- Promoter Team Lead system — 4 new tables, 2 RPCs, locking trigger
-- Run this entire file in Supabase SQL Editor at once.
-- ================================================================

-- Bcrypt password hashing requires pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------
-- TABLE 1: promoter_team_leads
-- One row per Team Lead account.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_team_leads (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  msisdn        TEXT        NOT NULL UNIQUE,   -- login identifier
  zone          TEXT        NOT NULL,
  se_cluster    TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,           -- bcrypt, never plaintext
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptl_msisdn ON promoter_team_leads(msisdn);

-- ----------------------------------------------------------------
-- TABLE 2: promoter_members
-- Promoters belonging to a Team Lead.
-- msisdn is UNIQUE globally — one promoter, one TL, enforced at DB level.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_members (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id   UUID        NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  promoter_name  TEXT        NOT NULL,
  msisdn         TEXT        NOT NULL UNIQUE,   -- global uniqueness across all TLs
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at     TIMESTAMPTZ                     -- NULL = still active
);

CREATE INDEX IF NOT EXISTS idx_pm_team_lead ON promoter_members(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_pm_msisdn    ON promoter_members(msisdn);

-- ----------------------------------------------------------------
-- TABLE 3: promoter_daily_reports
-- One report per Team Lead per calendar day.
-- is_locked = TRUE after submit — enforced by trigger below.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_daily_reports (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id  UUID        NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  report_date   DATE        NOT NULL,
  total_gas     INTEGER     NOT NULL DEFAULT 0,
  is_locked     BOOLEAN     NOT NULL DEFAULT FALSE,
  submitted_at  TIMESTAMPTZ,
  UNIQUE (team_lead_id, report_date)   -- one report per TL per day
);

CREATE INDEX IF NOT EXISTS idx_pdr_team_lead   ON promoter_daily_reports(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_pdr_report_date ON promoter_daily_reports(report_date);

-- ----------------------------------------------------------------
-- TABLE 4: promoter_gas_entries
-- One row per promoter per daily report.
-- promoter_name is a snapshot — safe after promoter is dropped.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promoter_gas_entries (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID        NOT NULL REFERENCES promoter_daily_reports(id) ON DELETE CASCADE,
  team_lead_id    UUID        NOT NULL REFERENCES promoter_team_leads(id),
  promoter_msisdn TEXT        NOT NULL,
  promoter_name   TEXT        NOT NULL,         -- snapshot at time of entry
  ga_count        INTEGER     NOT NULL DEFAULT 0 CHECK (ga_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, promoter_msisdn)            -- one entry per promoter per report
);

CREATE INDEX IF NOT EXISTS idx_pge_report_id ON promoter_gas_entries(report_id);

-- ----------------------------------------------------------------
-- TRIGGER: prevent writes to gas_entries once the report is locked
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_report_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_locked BOOLEAN;
  v_report_id UUID;
BEGIN
  -- For DELETE, use OLD; for INSERT/UPDATE, use NEW
  IF TG_OP = 'DELETE' THEN
    v_report_id := OLD.report_id;
  ELSE
    v_report_id := NEW.report_id;
  END IF;

  SELECT is_locked INTO v_locked
  FROM promoter_daily_reports
  WHERE id = v_report_id;

  IF v_locked IS TRUE THEN
    RAISE EXCEPTION 'Cannot modify entries for a locked report';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_report_lock ON promoter_gas_entries;
CREATE TRIGGER trg_check_report_lock
  BEFORE INSERT OR UPDATE OR DELETE ON promoter_gas_entries
  FOR EACH ROW EXECUTE FUNCTION fn_check_report_lock();

-- ----------------------------------------------------------------
-- RPC 1: tl_signup
-- Creates a new Team Lead account. Returns the new row (no password_hash).
-- Raises an exception if the MSISDN is already registered.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION tl_signup(
  p_full_name  TEXT,
  p_msisdn     TEXT,
  p_zone       TEXT,
  p_se_cluster TEXT,
  p_password   TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash TEXT;
  v_row  promoter_team_leads;
BEGIN
  -- Check for duplicate MSISDN
  IF EXISTS (SELECT 1 FROM promoter_team_leads WHERE msisdn = p_msisdn) THEN
    RAISE EXCEPTION 'MSISDN_EXISTS';
  END IF;

  -- Hash the password with bcrypt (cost 10)
  v_hash := crypt(p_password, gen_salt('bf', 10));

  -- Insert the new Team Lead
  INSERT INTO promoter_team_leads (full_name, msisdn, zone, se_cluster, password_hash)
  VALUES (p_full_name, p_msisdn, p_zone, p_se_cluster, v_hash)
  RETURNING * INTO v_row;

  -- Return row without password_hash
  RETURN json_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'msisdn',     v_row.msisdn,
    'zone',       v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active',  v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;

-- ----------------------------------------------------------------
-- RPC 2: tl_login
-- Verifies MSISDN + password. Returns row on success, NULL on failure.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION tl_login(
  p_msisdn   TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row promoter_team_leads;
BEGIN
  SELECT * INTO v_row
  FROM promoter_team_leads
  WHERE msisdn = p_msisdn
    AND is_active = TRUE;

  -- Row not found or password does not match
  IF NOT FOUND OR crypt(p_password, v_row.password_hash) <> v_row.password_hash THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'msisdn',     v_row.msisdn,
    'zone',       v_row.zone,
    'se_cluster', v_row.se_cluster,
    'is_active',  v_row.is_active,
    'created_at', v_row.created_at
  );
END;
$$;
```

- [ ] **Step 2: Run the migration in Supabase**

Open Supabase dashboard → SQL Editor → paste the entire file → Run.

Expected: No errors. Check Table Editor — you should see 4 new tables: `promoter_team_leads`, `promoter_members`, `promoter_daily_reports`, `promoter_gas_entries`.

- [ ] **Step 3: Smoke-test the RPCs**

In Supabase SQL Editor, run:

```sql
-- Test signup
SELECT tl_signup('Test Lead', '0712000001', 'NAIROBI EAST', 'Eastlands', 'testpass123');

-- Test login (should return the row)
SELECT tl_login('0712000001', 'testpass123');

-- Test wrong password (should return null)
SELECT tl_login('0712000001', 'wrongpassword');

-- Test duplicate MSISDN (should raise MSISDN_EXISTS)
SELECT tl_signup('Another Lead', '0712000001', 'COAST', 'Mombasa CBD', 'pass456');

-- Clean up test data
DELETE FROM promoter_team_leads WHERE msisdn = '0712000001';
```

Expected: signup returns JSON row, login returns row, wrong password returns null, duplicate raises exception.

- [ ] **Step 4: Commit**

```bash
git add src/supabase/migrations/012_promoter_team_lead.sql
git commit -m "feat(db): add promoter team lead tables, RPCs, and locking trigger"
```

---

## Task 2: API Module

**Files:**
- Create: `src/components/promoter-team-lead/promoter-tl-api.ts`

- [ ] **Step 1: Create the API module**

```typescript
// src/components/promoter-team-lead/promoter-tl-api.ts
// All Supabase interactions for the Promoter Team Lead feature.
// Uses the anon key client — no Supabase Auth required.

import { supabase } from '../../utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TLUser {
  id: string;
  full_name: string;
  msisdn: string;
  zone: string;
  se_cluster: string;
  is_active: boolean;
  created_at: string;
}

export interface PromoterMember {
  id: string;
  team_lead_id: string;
  promoter_name: string;
  msisdn: string;
  is_active: boolean;
  added_at: string;
  dropped_at: string | null;
}

export interface DailyReport {
  id: string;
  team_lead_id: string;
  report_date: string;      // 'YYYY-MM-DD'
  total_gas: number;
  is_locked: boolean;
  submitted_at: string | null;
}

export interface GasEntry {
  id: string;
  report_id: string;
  team_lead_id: string;
  promoter_msisdn: string;
  promoter_name: string;
  ga_count: number;
  created_at: string;
}

export interface DailyReportWithEntries extends DailyReport {
  entries: GasEntry[];
}

// ── Session helpers ───────────────────────────────────────────────────────────

const SESSION_KEY = 'tai_tl_user';

export function saveTLSession(user: TLUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getTLSession(): TLUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TLUser;
  } catch {
    return null;
  }
}

export function clearTLSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function tlSignup(
  fullName: string,
  msisdn: string,
  zone: string,
  seCluster: string,
  password: string,
): Promise<{ user: TLUser | null; error: string | null }> {
  const { data, error } = await supabase.rpc('tl_signup', {
    p_full_name:  fullName,
    p_msisdn:     msisdn,
    p_zone:       zone,
    p_se_cluster: seCluster,
    p_password:   password,
  });

  if (error) {
    if (error.message.includes('MSISDN_EXISTS')) {
      return { user: null, error: 'An account with this phone number already exists.' };
    }
    return { user: null, error: 'Sign up failed. Please try again.' };
  }

  return { user: data as TLUser, error: null };
}

export async function tlLogin(
  msisdn: string,
  password: string,
): Promise<{ user: TLUser | null; error: string | null }> {
  const { data, error } = await supabase.rpc('tl_login', {
    p_msisdn:   msisdn,
    p_password: password,
  });

  if (error) {
    return { user: null, error: 'Login failed. Please try again.' };
  }

  if (!data) {
    return { user: null, error: 'Incorrect phone number or password.' };
  }

  return { user: data as TLUser, error: null };
}

// ── Promoter management ───────────────────────────────────────────────────────

export async function getActivePromoters(teamLeadId: string): Promise<PromoterMember[]> {
  const { data, error } = await supabase
    .from('promoter_members')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('is_active', true)
    .order('added_at', { ascending: true });

  if (error || !data) return [];
  return data as PromoterMember[];
}

export async function addPromoter(
  teamLeadId: string,
  promoterName: string,
  msisdn: string,
): Promise<{ member: PromoterMember | null; error: string | null }> {
  const { data, error } = await supabase
    .from('promoter_members')
    .insert({ team_lead_id: teamLeadId, promoter_name: promoterName, msisdn })
    .select()
    .single();

  if (error) {
    // Postgres unique violation code
    if (error.code === '23505') {
      return { member: null, error: 'This promoter is already assigned to another Team Lead.' };
    }
    return { member: null, error: 'Could not add promoter. Please try again.' };
  }

  return { member: data as PromoterMember, error: null };
}

export async function dropPromoter(memberId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_members')
    .update({ is_active: false, dropped_at: new Date().toISOString() })
    .eq('id', memberId);

  if (error) return { error: 'Could not drop promoter. Please try again.' };
  return { error: null };
}

// ── Daily reports ─────────────────────────────────────────────────────────────

/** Returns today's date as 'YYYY-MM-DD' in local time. */
export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getOrCreateTodayReport(teamLeadId: string): Promise<DailyReport | null> {
  const today = todayDateString();

  // Try to get existing report
  const { data: existing } = await supabase
    .from('promoter_daily_reports')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('report_date', today)
    .maybeSingle();

  if (existing) return existing as DailyReport;

  // Create a new one
  const { data: created, error } = await supabase
    .from('promoter_daily_reports')
    .insert({ team_lead_id: teamLeadId, report_date: today })
    .select()
    .single();

  if (error || !created) return null;
  return created as DailyReport;
}

export async function getGasEntriesForReport(reportId: string): Promise<GasEntry[]> {
  const { data, error } = await supabase
    .from('promoter_gas_entries')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as GasEntry[];
}

/** Upsert a single promoter's GA count for the open report. */
export async function upsertGasEntry(
  reportId: string,
  teamLeadId: string,
  promoterMsisdn: string,
  promoterName: string,
  gaCount: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_gas_entries')
    .upsert(
      { report_id: reportId, team_lead_id: teamLeadId, promoter_msisdn: promoterMsisdn, promoter_name: promoterName, ga_count: gaCount },
      { onConflict: 'report_id,promoter_msisdn' },
    );

  if (error) {
    if (error.message.includes('locked report')) {
      return { error: 'This report has already been submitted and is locked.' };
    }
    return { error: 'Could not save GA count. Please try again.' };
  }
  return { error: null };
}

/** Lock the report and record total_gas + submitted_at. */
export async function submitReport(
  reportId: string,
  totalGas: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_daily_reports')
    .update({ is_locked: true, total_gas: totalGas, submitted_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('is_locked', false);  // safety: don't re-lock

  if (error) return { error: 'Could not submit report. Please try again.' };
  return { error: null };
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getReportHistory(
  teamLeadId: string,
  page = 0,
  pageSize = 20,
): Promise<DailyReportWithEntries[]> {
  const { data: reports, error } = await supabase
    .from('promoter_daily_reports')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('is_locked', true)
    .order('report_date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error || !reports || reports.length === 0) return [];

  const reportIds = reports.map((r: DailyReport) => r.id);
  const { data: entries } = await supabase
    .from('promoter_gas_entries')
    .select('*')
    .in('report_id', reportIds)
    .order('promoter_name', { ascending: true });

  const entriesByReport: Record<string, GasEntry[]> = {};
  (entries ?? []).forEach((e: GasEntry) => {
    if (!entriesByReport[e.report_id]) entriesByReport[e.report_id] = [];
    entriesByReport[e.report_id].push(e);
  });

  return (reports as DailyReport[]).map(r => ({
    ...r,
    entries: entriesByReport[r.id] ?? [],
  }));
}

/** Total GAs for the TL in the current calendar month. */
export async function getMonthTotalGas(teamLeadId: string): Promise<number> {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('promoter_daily_reports')
    .select('total_gas')
    .eq('team_lead_id', teamLeadId)
    .gte('report_date', monthStart);

  if (error || !data) return 0;
  return (data as { total_gas: number }[]).reduce((sum, r) => sum + (r.total_gas ?? 0), 0);
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors in `promoter-tl-api.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/promoter-tl-api.ts
git commit -m "feat(tl): add promoter team lead API module and types"
```

---

## Task 3: Settings Tab

**Files:**
- Create: `src/components/promoter-team-lead/tabs/SettingsTab.tsx`

- [ ] **Step 1: Create SettingsTab**

```tsx
// src/components/promoter-team-lead/tabs/SettingsTab.tsx
import React from 'react';
import { TLUser, clearTLSession } from '../promoter-tl-api';

interface Props {
  tlUser: TLUser;
  onLogout: () => void;
}

export function SettingsTab({ tlUser, onLogout }: Props) {
  const handleLogout = () => {
    clearTLSession();
    onLogout();
  };

  const fields: { label: string; value: string }[] = [
    { label: 'Full Name',   value: tlUser.full_name  },
    { label: 'Phone (MSISDN)', value: tlUser.msisdn   },
    { label: 'Zone',        value: tlUser.zone        },
    { label: 'SE Cluster',  value: tlUser.se_cluster  },
    { label: 'Member Since', value: new Date(tlUser.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Profile card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {tlUser.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{tlUser.full_name}</p>
            <p className="text-white/70 text-sm mt-0.5">Promoter Team Lead</p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-white rounded-2xl shadow-sm text-red-600 font-bold text-sm tracking-wide hover:bg-red-50 active:scale-[0.98] transition-all"
      >
        Log Out
      </button>

      <p className="text-center text-[10px] text-gray-300 pb-2">
        Airtel Champions · Promoter Team Lead
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/tabs/SettingsTab.tsx
git commit -m "feat(tl): add Settings tab with profile and logout"
```

---

## Task 4: History Tab

**Files:**
- Create: `src/components/promoter-team-lead/tabs/HistoryTab.tsx`

- [ ] **Step 1: Create HistoryTab**

```tsx
// src/components/promoter-team-lead/tabs/HistoryTab.tsx
import React, { useEffect, useState } from 'react';
import { DailyReportWithEntries, getReportHistory } from '../promoter-tl-api';

interface Props {
  teamLeadId: string;
}

export function HistoryTab({ teamLeadId }: Props) {
  const [reports, setReports] = useState<DailyReportWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const loadPage = async (p: number) => {
    setLoading(true);
    const data = await getReportHistory(teamLeadId, p, PAGE_SIZE);
    if (p === 0) {
      setReports(data);
    } else {
      setReports(prev => [...prev, ...data]);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => { loadPage(0); }, [teamLeadId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

  if (loading && reports.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold text-gray-700">No reports yet</p>
        <p className="text-sm text-gray-400 mt-1">Submitted reports will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold px-1">
        Past Reports — {reports.length} shown
      </p>

      {reports.map(report => (
        <div key={report.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Report header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-bold text-gray-900">{formatDate(report.report_date)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Submitted {report.submitted_at
                  ? new Date(report.submitted_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl px-3 py-1.5 text-center">
              <p className="text-white font-bold text-lg leading-none">{report.total_gas}</p>
              <p className="text-white/50 text-[9px] uppercase tracking-wide">GAs</p>
            </div>
          </div>

          {/* Per-promoter rows */}
          {report.entries.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No entries recorded</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {report.entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{entry.promoter_name}</p>
                    <p className="text-[11px] text-gray-400">{entry.promoter_msisdn}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">{entry.ga_count} GAs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => { const next = page + 1; setPage(next); loadPage(next); }}
          disabled={loading}
          className="w-full py-3 bg-white rounded-2xl shadow-sm text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}

    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/tabs/HistoryTab.tsx
git commit -m "feat(tl): add History tab with paginated submitted reports"
```

---

## Task 5: Promoters Tab

**Files:**
- Create: `src/components/promoter-team-lead/tabs/PromotersTab.tsx`

- [ ] **Step 1: Create PromotersTab**

```tsx
// src/components/promoter-team-lead/tabs/PromotersTab.tsx
import React, { useEffect, useState } from 'react';
import {
  PromoterMember,
  getActivePromoters,
  addPromoter,
  dropPromoter,
} from '../promoter-tl-api';

interface Props {
  teamLeadId: string;
  onPromoterChange: () => void; // notify parent to refresh Today tab
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-red-500 to-red-400',
  'bg-gradient-to-br from-emerald-500 to-emerald-400',
  'bg-gradient-to-br from-blue-500 to-blue-400',
  'bg-gradient-to-br from-amber-500 to-amber-400',
  'bg-gradient-to-br from-purple-500 to-purple-400',
  'bg-gradient-to-br from-pink-500 to-pink-400',
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function PromotersTab({ teamLeadId, onPromoterChange }: Props) {
  const [promoters, setPromoters] = useState<PromoterMember[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [newName,   setNewName]   = useState('');
  const [newMsisdn, setNewMsisdn] = useState('');
  const [adding,    setAdding]    = useState(false);
  const [addError,  setAddError]  = useState('');
  const [dropId,    setDropId]    = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getActivePromoters(teamLeadId);
    setPromoters(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [teamLeadId]);

  const handleAdd = async () => {
    setAddError('');
    const name  = newName.trim();
    const msisdn = newMsisdn.trim();
    if (!name)   { setAddError('Enter the promoter\'s name.'); return; }
    if (!msisdn) { setAddError('Enter the promoter\'s MSISDN.'); return; }

    setAdding(true);
    const { member, error } = await addPromoter(teamLeadId, name, msisdn);
    setAdding(false);

    if (error) { setAddError(error); return; }
    if (member) {
      setPromoters(prev => [...prev, member]);
      setNewName('');
      setNewMsisdn('');
      onPromoterChange();
    }
  };

  const handleDrop = async (member: PromoterMember) => {
    if (!window.confirm(`Remove ${member.promoter_name} from your team?`)) return;
    setDropId(member.id);
    await dropPromoter(member.id);
    setPromoters(prev => prev.filter(p => p.id !== member.id));
    setDropId(null);
    onPromoterChange();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{promoters.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Active Promoters</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">👥</div>
      </div>

      {/* Active list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : promoters.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">No promoters yet. Add your first one below.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {promoters.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(idx)}`}>
                {initials(p.promoter_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.promoter_name}</p>
                <p className="text-xs text-gray-400">{p.msisdn}</p>
              </div>
              <button
                onClick={() => handleDrop(p)}
                disabled={dropId === p.id}
                className="flex-shrink-0 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-red-100 active:scale-95 transition-all"
              >
                {dropId === p.id ? '…' : 'Drop'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add promoter form */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Add New Promoter</p>

        <input
          type="text"
          value={newName}
          onChange={e => { setNewName(e.target.value); setAddError(''); }}
          placeholder="Promoter Full Name"
          className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <input
          type="tel"
          value={newMsisdn}
          onChange={e => { setNewMsisdn(e.target.value); setAddError(''); }}
          placeholder="MSISDN (e.g. 0712 345 678)"
          className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        {addError && (
          <p className="text-xs text-red-600 font-medium px-1">{addError}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {adding ? 'Adding…' : 'Add Promoter'}
        </button>

        <div className="bg-amber-50 rounded-xl p-3 flex gap-2">
          <span className="text-sm flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">If this MSISDN is already mapped to another Team Lead, you'll see an error and the promoter will not be added.</p>
        </div>
      </div>

    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/tabs/PromotersTab.tsx
git commit -m "feat(tl): add Promoters tab with add/drop functionality"
```

---

## Task 6: Today Tab

**Files:**
- Create: `src/components/promoter-team-lead/tabs/TodayTab.tsx`

- [ ] **Step 1: Create TodayTab**

```tsx
// src/components/promoter-team-lead/tabs/TodayTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  TLUser,
  PromoterMember,
  DailyReport,
  GasEntry,
  getActivePromoters,
  getOrCreateTodayReport,
  getGasEntriesForReport,
  upsertGasEntry,
  submitReport,
  todayDateString,
} from '../promoter-tl-api';

interface Props {
  tlUser: TLUser;
  refreshKey: number; // increment from parent to force reload after promoter changes
  onTotalChange: (total: number) => void;
}

const AVATAR_COLORS = [
  'from-red-500 to-red-400',
  'from-emerald-500 to-emerald-400',
  'from-blue-500 to-blue-400',
  'from-amber-500 to-amber-400',
  'from-purple-500 to-purple-400',
  'from-pink-500 to-pink-400',
];
function avatarColor(i: number) { return AVATAR_COLORS[i % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); }

function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function TodayTab({ tlUser, refreshKey, onTotalChange }: Props) {
  const [promoters,   setPromoters]   = useState<PromoterMember[]>([]);
  const [report,      setReport]      = useState<DailyReport | null>(null);
  const [entries,     setEntries]     = useState<Record<string, number>>({}); // msisdn → ga_count
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [members, todayReport] = await Promise.all([
      getActivePromoters(tlUser.id),
      getOrCreateTodayReport(tlUser.id),
    ]);
    setPromoters(members);
    setReport(todayReport);

    if (todayReport) {
      const saved = await getGasEntriesForReport(todayReport.id);
      const map: Record<string, number> = {};
      saved.forEach((e: GasEntry) => { map[e.promoter_msisdn] = e.ga_count; });
      setEntries(map);
      const total = saved.reduce((s: number, e: GasEntry) => s + e.ga_count, 0);
      onTotalChange(total);
    }
    setLoading(false);
  }, [tlUser.id, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const total = Object.values(entries).reduce((s, v) => s + (v || 0), 0);
  const filledCount = Object.values(entries).filter(v => v > 0).length;
  const isLocked = report?.is_locked ?? false;

  const handleGaChange = async (msisdn: string, name: string, raw: string) => {
    if (isLocked || !report) return;
    const count = Math.max(0, parseInt(raw, 10) || 0);
    setEntries(prev => {
      const next = { ...prev, [msisdn]: count };
      const newTotal = Object.values(next).reduce((s, v) => s + (v || 0), 0);
      onTotalChange(newTotal);
      return next;
    });
    // Auto-save in background — debounce not needed for integer fields
    await upsertGasEntry(report.id, tlUser.id, msisdn, name, count);
  };

  const handleSubmit = async () => {
    if (!report || isLocked) return;
    setSubmitError('');
    setSubmitting(true);

    // Final upsert pass to ensure all values are saved
    await Promise.all(
      promoters.map(p =>
        upsertGasEntry(report.id, tlUser.id, p.msisdn, p.promoter_name, entries[p.msisdn] ?? 0)
      )
    );

    const { error } = await submitReport(report.id, total);
    if (error) {
      setSubmitError(error);
      setSubmitting(false);
      return;
    }

    setReport(prev => prev ? { ...prev, is_locked: true } : prev);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      {/* Date badge */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {report ? formatDisplayDate(report.report_date) : formatDisplayDate(todayDateString())}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{tlUser.zone} · {tlUser.se_cluster}</p>
        </div>
        {isLocked && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            ✓ Submitted
          </span>
        )}
      </div>

      {/* Promoter rows */}
      {promoters.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-400">No promoters yet.</p>
          <p className="text-xs text-gray-400 mt-1">Go to the Promoters tab to add your team.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {promoters.map((p, idx) => {
            const val = entries[p.msisdn] ?? 0;
            const filled = val > 0;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(idx)}`}>
                  {initials(p.promoter_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.promoter_name}</p>
                  <p className="text-xs text-gray-400">{p.msisdn}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    value={val === 0 && !filled ? '' : val}
                    placeholder="—"
                    readOnly={isLocked}
                    onChange={e => handleGaChange(p.msisdn, p.promoter_name, e.target.value)}
                    className={`w-14 h-10 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all
                      ${isLocked
                        ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                        : filled
                          ? 'bg-red-50 border-red-500 text-red-600'
                          : 'bg-gray-50 border-gray-200 text-gray-400 focus:border-red-400 focus:bg-red-50'
                      }`}
                  />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">GAs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total bar */}
      {promoters.length > 0 && (
        <div className="bg-gray-900 rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Team Total</p>
            <p className="text-3xl font-black text-white tracking-tight mt-0.5">{total} <span className="text-lg font-bold text-white/60">GAs</span></p>
            <p className="text-[10px] text-white/40 mt-1">
              {report ? formatDisplayDate(report.report_date) : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">{filledCount} of {promoters.length} filled</p>
            <p className="text-2xl mt-1">📊</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      {promoters.length > 0 && (
        <>
          {submitError && (
            <p className="text-xs text-red-600 font-medium text-center px-2">{submitError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLocked || submitting || promoters.length === 0}
            className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-[0.98]
              ${isLocked
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
              }`}
            style={!isLocked ? { boxShadow: '0 4px 20px rgba(230,0,0,0.35)' } : {}}
          >
            {isLocked ? '✓ Report Submitted' : submitting ? 'Submitting…' : 'Submit Today\'s Report'}
          </button>
        </>
      )}

    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/tabs/TodayTab.tsx
git commit -m "feat(tl): add Today tab with GA entry, auto-save, and submit"
```

---

## Task 7: Dashboard Shell

**Files:**
- Create: `src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx`

- [ ] **Step 1: Create the dashboard shell**

```tsx
// src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx
import React, { useEffect, useState } from 'react';
import { TLUser, getTLSession, getMonthTotalGas, getActivePromoters } from './promoter-tl-api';
import { TodayTab }     from './tabs/TodayTab';
import { PromotersTab } from './tabs/PromotersTab';
import { HistoryTab }   from './tabs/HistoryTab';
import { SettingsTab }  from './tabs/SettingsTab';

type Tab = 'today' | 'promoters' | 'history' | 'settings';

interface Props {
  onLogout: () => void;
}

export function PromoterTeamLeadDashboard({ onLogout }: Props) {
  const tlUser = getTLSession();
  const [activeTab,      setActiveTab]      = useState<Tab>('today');
  const [todayTotal,     setTodayTotal]     = useState(0);
  const [monthTotal,     setMonthTotal]     = useState(0);
  const [promoterCount,  setPromoterCount]  = useState(0);
  const [promoterRefKey, setPromoterRefKey] = useState(0);

  const refreshHeader = async () => {
    if (!tlUser) return;
    const [month, members] = await Promise.all([
      getMonthTotalGas(tlUser.id),
      getActivePromoters(tlUser.id),
    ]);
    setMonthTotal(month);
    setPromoterCount(members.length);
  };

  useEffect(() => { refreshHeader(); }, []);

  const handlePromoterChange = () => {
    setPromoterRefKey(k => k + 1);
    refreshHeader();
  };

  if (!tlUser) {
    onLogout();
    return null;
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'today',     icon: '📋', label: 'Today'     },
    { id: 'promoters', icon: '👥', label: 'Promoters' },
    { id: 'history',   icon: '📈', label: 'History'   },
    { id: 'settings',  icon: '⚙️', label: 'Settings'  },
  ];

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ background: '#E60000' }} className="px-5 pt-10 pb-5">
        <p className="text-white/80 text-xs tracking-wide">{greeting()}, Team Lead 👋</p>
        <p className="text-white text-2xl font-black tracking-tight mt-0.5 mb-4">
          {tlUser.full_name.split(' ')[0]}
        </p>

        <div className="flex gap-2.5">
          {[
            { num: promoterCount, lbl: 'Promoters'  },
            { num: todayTotal,    lbl: 'Today\'s GAs' },
            { num: monthTotal,    lbl: 'Month GAs'  },
          ].map(({ num, lbl }) => (
            <div key={lbl} className="flex-1 rounded-2xl px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <p className="text-white text-xl font-black leading-none">{num}</p>
              <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
        {activeTab === 'today' && (
          <TodayTab
            tlUser={tlUser}
            refreshKey={promoterRefKey}
            onTotalChange={total => { setTodayTotal(total); }}
          />
        )}
        {activeTab === 'promoters' && (
          <PromotersTab
            teamLeadId={tlUser.id}
            onPromoterChange={handlePromoterChange}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab teamLeadId={tlUser.id} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab tlUser={tlUser} onLogout={onLogout} />
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors
              ${activeTab === t.id ? 'text-red-600' : 'text-gray-400'}`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
            {activeTab === t.id && (
              <span className="w-1 h-1 rounded-full bg-red-600 mt-0.5" />
            )}
          </button>
        ))}
      </div>

    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx
git commit -m "feat(tl): add Team Lead dashboard shell with 4-tab navigation"
```

---

## Task 8: Entry Page

**Files:**
- Create: `src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx`

- [ ] **Step 1: Create the entry page**

```tsx
// src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx
import React, { useState } from 'react';
import { tlLogin, tlSignup, saveTLSession } from './promoter-tl-api';

const ZONES = [
  'ABERDARE', 'COAST', 'EASTERN', 'MT KENYA',
  'NAIROBI EAST', 'NAIROBI METROPOLITAN', 'NAIROBI WEST',
  'NYANZA', 'RIFT VALLEY', 'WESTERN',
];

interface Props {
  onSuccess: () => void;
  onBack:    () => void;
}

export function PromoterTeamLeadEntryPage({ onSuccess, onBack }: Props) {
  // Login state
  const [loginMsisdn,   setLoginMsisdn]   = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState('');

  // Signup state
  const [signupName,     setSignupName]     = useState('');
  const [signupMsisdn,   setSignupMsisdn]   = useState('');
  const [signupZone,     setSignupZone]     = useState('');
  const [signupCluster,  setSignupCluster]  = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm,  setSignupConfirm]  = useState('');
  const [signupLoading,  setSignupLoading]  = useState(false);
  const [signupError,    setSignupError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginMsisdn.trim() || !loginPassword) {
      setLoginError('Enter your phone number and password.');
      return;
    }
    setLoginLoading(true);
    const { user, error } = await tlLogin(loginMsisdn.trim(), loginPassword);
    setLoginLoading(false);
    if (error || !user) { setLoginError(error ?? 'Login failed.'); return; }
    saveTLSession(user);
    onSuccess();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim())              { setSignupError('Enter your full name.'); return; }
    if (!signupMsisdn.trim())            { setSignupError('Enter your MSISDN.'); return; }
    if (!signupZone)                     { setSignupError('Select your zone.'); return; }
    if (!signupCluster.trim())           { setSignupError('Enter your SE cluster / location.'); return; }
    if (signupPassword.length < 6)       { setSignupError('Password must be at least 6 characters.'); return; }
    if (signupPassword !== signupConfirm){ setSignupError('Passwords do not match.'); return; }

    setSignupLoading(true);
    const { user, error } = await tlSignup(
      signupName.trim(),
      signupMsisdn.trim(),
      signupZone,
      signupCluster.trim(),
      signupPassword,
    );
    setSignupLoading(false);
    if (error || !user) { setSignupError(error ?? 'Sign up failed.'); return; }
    saveTLSession(user);
    onSuccess();
  };

  const inputCls = 'w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 text-gray-900';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">

      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 -ml-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to login
      </button>

      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#E60000' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg leading-tight">Promoter Team Lead</p>
          <p className="text-xs text-gray-400">Airtel Champions Sales</p>
        </div>
      </div>

      {/* ── LOGIN SECTION ─────────────────────────────────────── */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Log In</p>

      <form onSubmit={handleLogin} className="space-y-3 mb-2">
        {loginError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-sm text-red-600 font-medium">{loginError}</p>
          </div>
        )}
        <input
          type="tel"
          value={loginMsisdn}
          onChange={e => setLoginMsisdn(e.target.value)}
          placeholder="Phone number (MSISDN)"
          className={inputCls}
        />
        <input
          type="password"
          value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          placeholder="Password"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={loginLoading}
          className="w-full py-3.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
          style={{ background: '#E60000', boxShadow: '0 4px 20px rgba(230,0,0,0.3)' }}
        >
          {loginLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in…
            </span>
          ) : 'LOG IN'}
        </button>
      </form>

      {/* Divider to signup */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">New here? Sign Up below ↓</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ── SIGNUP SECTION ────────────────────────────────────── */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Create Account</p>

      <form onSubmit={handleSignup} className="space-y-3 pb-8">
        {signupError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-sm text-red-600 font-medium">{signupError}</p>
          </div>
        )}
        <input
          type="text"
          value={signupName}
          onChange={e => setSignupName(e.target.value)}
          placeholder="Full Name"
          className={inputCls}
        />
        <input
          type="tel"
          value={signupMsisdn}
          onChange={e => setSignupMsisdn(e.target.value)}
          placeholder="MSISDN (phone number)"
          className={inputCls}
        />
        <select
          value={signupZone}
          onChange={e => setSignupZone(e.target.value)}
          className={`${inputCls} ${!signupZone ? 'text-gray-400' : 'text-gray-900'}`}
        >
          <option value="">Select Zone</option>
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <input
          type="text"
          value={signupCluster}
          onChange={e => setSignupCluster(e.target.value)}
          placeholder="SE Cluster / Location (e.g. Eastlands)"
          className={inputCls}
        />
        <input
          type="password"
          value={signupPassword}
          onChange={e => setSignupPassword(e.target.value)}
          placeholder="Create Password (min. 6 characters)"
          className={inputCls}
        />
        <input
          type="password"
          value={signupConfirm}
          onChange={e => setSignupConfirm(e.target.value)}
          placeholder="Confirm Password"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={signupLoading}
          className="w-full py-3.5 text-sm font-bold text-white bg-gray-900 rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {signupLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account…
            </span>
          ) : 'SIGN UP AS TEAM LEAD'}
        </button>
        <p className="text-center text-[11px] text-gray-400">Already registered? Log in above ↑</p>
      </form>

    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx
git commit -m "feat(tl): add Team Lead entry page with login and signup"
```

---

## Task 9: Wire into LoginPage.tsx

**Files:**
- Modify: `src/components/LoginPage.tsx`

- [ ] **Step 1: Add state and import**

In `LoginPage.tsx`, add the import at the top (after the existing imports):

```tsx
import { PromoterTeamLeadEntryPage } from './promoter-team-lead/PromoterTeamLeadEntryPage';
```

Add state inside the `LoginPage` component (after the existing `useState` declarations):

```tsx
const [showTLEntry, setShowTLEntry] = useState(false);
```

- [ ] **Step 2: Handle TL entry page routing**

Add this block immediately after the `const isHBB = mode === 'hbb';` line:

```tsx
// Show the Team Lead entry page when the button is tapped
if (showTLEntry) {
  return (
    <PromoterTeamLeadEntryPage
      onSuccess={() => {
        // Session is saved by the entry page — App.tsx will pick it up on re-render
        // Force a reload to trigger App.tsx's session check
        window.location.reload();
      }}
      onBack={() => setShowTLEntry(false)}
    />
  );
}
```

- [ ] **Step 3: Add the button in Sales mode**

In the JSX, find the block that starts with `{/* ⑤ HBB-only: submit leads section */}`. That block is wrapped in `{isHBB && (...)}`. 

Add a new block directly after the closing `)}` of that HBB block:

```tsx
{/* ⑤b Sales-only: Promoter Team Lead section */}
{!isHBB && (
  <div className="mt-3">
    <div className="relative my-3">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-[10px]">
        <span className="px-3 text-gray-400 uppercase tracking-widest font-medium"
          style={{ background: 'var(--theme-bg-card, #ffffff)' }}>
          Are you a Promoter Team Lead?
        </span>
      </div>
    </div>
    <button
      type="button"
      onClick={() => setShowTLEntry(true)}
      className="w-full py-3.5 text-sm border-2 text-red-600 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all font-semibold tracking-wide"
      style={{ borderColor: '#E60000' }}
    >
      PROMOTER TEAM LEAD
    </button>
  </div>
)}
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 5: Verify in dev server**

```bash
npm run dev
```

Open the app. In Sales mode you should see the "PROMOTER TEAM LEAD" button below "Need help signing in?" with a divider. Switch to HBB mode — the button must disappear and HBB SIGN UP must appear.

- [ ] **Step 6: Commit**

```bash
git add src/components/LoginPage.tsx
git commit -m "feat(tl): add Promoter Team Lead button to Sales mode login page"
```

---

## Task 10: Wire into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add import**

Add this import near the top of `App.tsx` (after the existing component imports):

```tsx
import { PromoterTeamLeadDashboard } from './components/promoter-team-lead/PromoterTeamLeadDashboard';
import { getTLSession, clearTLSession } from './components/promoter-team-lead/promoter-tl-api';
```

- [ ] **Step 2: Add TL session state**

Inside the `App` function, add this state alongside the existing `useState` declarations at the top of the component:

```tsx
const [isTLAuthenticated, setIsTLAuthenticated] = useState<boolean>(() => getTLSession() !== null);
```

- [ ] **Step 3: Add TL route**

Find the section in App.tsx's render that decides what to show after the splash screen. It begins with something like the `isAuthenticated` check or the role-based routing. Add the TL check **before** the existing `isAuthenticated` block:

```tsx
// ── Promoter Team Lead session ──────────────────────────────────────────────
if (isTLAuthenticated) {
  return (
    <MobileContainer>
      <PromoterTeamLeadDashboard
        onLogout={() => {
          clearTLSession();
          setIsTLAuthenticated(false);
        }}
      />
    </MobileContainer>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 5: End-to-end verification**

```bash
npm run dev
```

Run through the full flow:

1. Open the app in Sales mode → tap PROMOTER TEAM LEAD → Entry page appears with Login and Sign Up sections
2. Sign up with a test name, MSISDN (`0799000001`), zone, cluster, and password → dashboard opens
3. On Today tab: enter GAs for a promoter (if you added one) — total bar updates
4. On Promoters tab: add a promoter (name + MSISDN) → appears in Today tab after switching back
5. On History tab: empty on first day (nothing submitted yet)
6. Submit today's report → rows go read-only, button shows ✓
7. On Settings tab: profile shows TL details → Log Out → back to login page
8. Tap cube to HBB mode → PROMOTER TEAM LEAD button disappears, HBB SIGN UP appears
9. Re-open app → session persists, goes straight to dashboard

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(tl): wire Promoter Team Lead dashboard into App.tsx routing"
```

---

## Done

All tasks complete. The Promoter Team Lead feature is fully isolated — zero changes to existing Sales or HBB flows. The database migration (`012_promoter_team_lead.sql`) must be run in Supabase before the app is deployed.
