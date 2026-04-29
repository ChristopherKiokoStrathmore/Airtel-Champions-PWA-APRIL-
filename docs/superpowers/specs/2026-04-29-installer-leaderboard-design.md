# Installer Leaderboard & Supervisor Dashboard

**Date:** 2026-04-29  
**Status:** Approved

---

## Goal

Installers should see where they rank among peers who share the same supervisor. Supervisors should have a dedicated login and dashboard showing all their installers ranked by GA count and jobs completed.

---

## Data Model (existing — no migrations needed)

- `hbb_installer_ga_monthly.team_lead_msisdn` links each installer to their supervisor
- `installer_supervisor` table: columns `"Installers supervisor"` (PK/name), `"Phone"`, `pin` (default 1234)
- `installers` table: `id`, `phone` — used to join with `service_requests`
- `service_requests`: `installer_id`, `status` — used for jobs completed count

The supervisor's `Phone` in `installer_supervisor` is the same value stored in `team_lead_msisdn` in `hbb_installer_ga_monthly`.

---

## Architecture

### 1. Login — Step 2c (inserted between DSE check and HBB login chain)

**File:** `src/components/LoginPage.tsx`

New function `checkInstallerSupervisorTable(normalised, pin)`:
- Queries `installer_supervisor` table matching `Phone` against all phone variants
- Validates `pin` column (default `1234`)
- Returns user object with `role: 'hbb_installer_supervisor'`

Inserted in `handleLogin` after the DSE check (step 2b), before `runHbbLogin` (step 3b).
Only runs in `mode === 'hbb'`.

### 2. App routing — new role

**File:** `src/App.tsx`

- Add `'hbb_installer_supervisor'` to the `UserRole` type
- Add `'hbb_installer_supervisor'` to the HBB session TTL check
- Add routing block: `userRole === 'hbb_installer_supervisor'` → `<HBBInstallerSupervisorDashboard>`

### 3. New component: `HBBInstallerSupervisorDashboard`

**File:** `src/components/hbb/hbb-installer-supervisor-dashboard.tsx`

Mobile-first, Airtel red theme (matches existing dashboards).

**Layout:**
- Top bar: supervisor name, logout button
- Summary cards: total team GAs this month, number of installers on team
- Leaderboard list: ranked installers, medal icons for top 3 (#1 gold, #2 silver, #3 bronze)
- **Two bottom tabs:** "GA Count" | "Jobs Completed"
  - GA Count: current month, sourced from `hbb_installer_ga_monthly` filtered by `team_lead_msisdn`
  - Jobs Completed: current month by default, with an "All Time" toggle, sourced by joining `installers` (phone → id) then counting `service_requests` where `status = 'completed'`

Each leaderboard row shows: rank, name, town, count (GA or jobs), incentive earned (GA tab only).

### 4. Installer leaderboard panel — added to existing installer GA dashboard

**File:** `src/components/hbb/hbb-installer-ga-dashboard.tsx`

In the "current month" view, add a **"Team Leaderboard"** section below the installer's own stats (GA card + band progress + incentive).

- Fetches all installers sharing the same `team_lead_msisdn` via `getInstallersByTeamLead`
- Renders a compact ranked list
- Current installer's row is highlighted with Airtel red background + bold text
- Shows their position: "You are #2 of 5 installers"
- Only rendered when `team_lead_msisdn` is non-null for this installer

---

## New API Functions

**File:** `src/components/hbb/hbb-ga-api.ts`

```ts
getSupervisorByPhone(phone: string, pin: string): Promise<SupervisorUser | null>
// Queries installer_supervisor, validates PIN, returns supervisor object

getInstallersByTeamLead(teamLeadMsisdn: string, monthYear: string): Promise<InstallerLeaderboardEntry[]>
// Queries hbb_installer_ga_monthly WHERE team_lead_msisdn = $1 AND month_year = $2
// Orders by ga_count DESC, assigns position

getInstallerJobsLeaderboard(teamLeadMsisdn: string, period: 'month' | 'all'): Promise<InstallerJobsEntry[]>
// 1. Get all installer MSISDNs from hbb_installer_ga_monthly by team_lead_msisdn
// 2. Normalize phones, look up installer IDs from installers table
// 3. Count completed service_requests per installer_id
// 4. Merge names from step 1, order by count DESC
```

---

## Components Summary

| File | Change |
|------|--------|
| `src/components/LoginPage.tsx` | Add `checkInstallerSupervisorTable()`, insert step 2c in `handleLogin` |
| `src/App.tsx` | Add role type, TTL check, routing for `hbb_installer_supervisor` |
| `src/components/hbb/hbb-installer-supervisor-dashboard.tsx` | **New** — supervisor dashboard |
| `src/components/hbb/hbb-installer-ga-dashboard.tsx` | Add team leaderboard section to current-month view |
| `src/components/hbb/hbb-ga-api.ts` | Add 3 new API functions |

---

## Out of Scope

- No new DB migrations (all data relationships already exist)
- No real-time leaderboard updates (pull-to-refresh is sufficient)
- No supervisor editing of installer data
