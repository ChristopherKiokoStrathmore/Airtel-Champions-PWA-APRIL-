# Promoter Team Lead — Design Spec
**Date:** 2026-04-13  
**Status:** Approved  
**Approach:** A — Fully isolated from existing auth and app_users

---

## 1. Overview

A new entry point on the Sales-mode login page allows Promoter Team Leads (TLs) to self-register and log in to a dedicated dashboard. TLs are entirely separate from Sales Executives, HBB users, and any existing role in the system. They have their own tables, their own auth flow, and their own dashboard — no existing screens or data are touched.

**What a Team Lead can do:**
- Register themselves (no admin approval needed)
- Add promoters to their team by name and MSISDN
- Drop promoters from their team
- Enter daily Gross Adds (GAs) per promoter and submit a locked end-of-day report
- View history of past submitted reports

**What a Team Lead cannot do:**
- Access the Sales Executive dashboard
- Access any HBB screen
- Edit a submitted report (locked permanently on submit)
- Add a promoter already assigned to another TL

---

## 2. Login Page Change

**Trigger:** Sales mode only (cube on Sales face).  
**Placement:** Below "Need help signing in?" — identical slot to the HBB SIGN UP button.  
**Structure mirrors the HBB pattern exactly:**

| Mode | Divider label | Button |
|------|--------------|--------|
| HBB | "Want to submit HBB leads?" | `SIGN UP` |
| Sales | "Are you a Promoter Team Lead?" | `PROMOTER TEAM LEAD` |

The button is hidden when the cube is in HBB mode. The space it occupies in Sales mode is identical to the SIGN UP space in HBB mode — fully symmetrical, no layout shift.

**File changed:** `src/components/LoginPage.tsx` (~10 lines, inside the existing `!isHBB` conditional block)

---

## 3. TL Entry Page

**File:** `src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx`

Single scrollable screen. Login section at the top, Sign Up section below. No tabs or separate routes — one page, two sections.

### Login section (returning TL)
- MSISDN input
- Password input
- LOG IN button
- Divider: "New here? Sign Up below ↓"

### Sign Up section (new TL)
Fields:
1. Full Name
2. MSISDN
3. Zone — dropdown (ABERDARE, COAST, EASTERN, MT KENYA, NAIROBI EAST, NAIROBI METROPOLITAN, NAIROBI WEST, NYANZA, RIFT VALLEY, WESTERN)
4. SE Cluster / Location — free text input (e.g. "Eastlands", "Mombasa CBD")
5. Password — free-form, user-chosen
6. Confirm Password

On submit: calls `tl_signup` RPC → account created → auto-logged in → routed to dashboard.  
On MSISDN conflict (duplicate): error shown inline — "An account with this phone number already exists."

**No admin approval step.** TL is immediately active after signup.

---

## 4. Dashboard — 4 Tabs

**File:** `src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx`  
**Session key:** `localStorage.tai_tl_user`

Header (Airtel red): TL name, greeting, 3 stat pills — Promoters count, Today's total GAs, Month total GAs.

### Tab 1 — Today (default)
- Date badge showing current date + zone/cluster
- List of active promoters, each row:
  - Avatar (initials), Promoter Name (primary), MSISDN (secondary)
  - GA input field (numeric, min 0)
- "Add Promoter" dashed button at bottom of list (links to Promoters tab)
- Total bar (dark): "Team Total — XX GAs — [date]" + count of filled vs total rows
- "Submit Today's Report" button (Airtel red)
- On submit: `is_locked = true` set on the report, all inputs become read-only, button replaced with "✓ Submitted"
- If report already submitted today: page loads in read-only state

### Tab 2 — Promoters
- List of active promoters with name, MSISDN, today's GAs, Drop button
- "Add New Promoter" section:
  - Promoter Name input
  - MSISDN input
  - Add button
  - System checks `promoter_members.msisdn` UNIQUE constraint
  - On conflict: "This promoter is already assigned to another Team Lead"
- Drop: sets `is_active = false`, `dropped_at = now()`. Soft delete — history preserved. Removed from future GA entry rows.

### Tab 3 — History
- List of all past submitted reports, newest first (paginated at 20 per page)
- Each card: date, total GAs, per-promoter breakdown (name + MSISDN + GA count)
- All cards are read-only (locked at DB level)

### Tab 4 — Settings
- TL profile: name, MSISDN, zone, cluster (read-only display)
- Log Out button — clears `tai_tl_user` from localStorage → back to login page

---

## 5. Database Schema

Four new Supabase tables. Zero changes to existing tables.

### `promoter_team_leads`
```sql
CREATE TABLE promoter_team_leads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT NOT NULL,
  msisdn        TEXT NOT NULL UNIQUE,
  zone          TEXT NOT NULL,
  se_cluster    TEXT NOT NULL,
  password_hash TEXT NOT NULL,           -- bcrypt via pgcrypto
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `promoter_members`
```sql
CREATE TABLE promoter_members (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id   UUID NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  promoter_name  TEXT NOT NULL,
  msisdn         TEXT NOT NULL UNIQUE,   -- global uniqueness across all TLs
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dropped_at     TIMESTAMPTZ             -- null = still active
);
```

### `promoter_daily_reports`
```sql
CREATE TABLE promoter_daily_reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_lead_id  UUID NOT NULL REFERENCES promoter_team_leads(id) ON DELETE CASCADE,
  report_date   DATE NOT NULL,
  total_gas     INTEGER NOT NULL DEFAULT 0,
  is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at  TIMESTAMPTZ,
  UNIQUE (team_lead_id, report_date)     -- one report per TL per day
);
```

### `promoter_gas_entries`
```sql
CREATE TABLE promoter_gas_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL REFERENCES promoter_daily_reports(id) ON DELETE CASCADE,
  team_lead_id    UUID NOT NULL REFERENCES promoter_team_leads(id),
  promoter_msisdn TEXT NOT NULL,
  promoter_name   TEXT NOT NULL,         -- snapshot at time of entry
  ga_count        INTEGER NOT NULL DEFAULT 0 CHECK (ga_count >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, promoter_msisdn)    -- one entry per promoter per report
);
```

**Migration file:** `src/supabase/migrations/012_promoter_team_lead.sql`

---

## 6. Auth — Supabase RPCs

Two RPCs using pgcrypto. No Supabase Auth. No email required.

### `tl_signup`
```
Input:  p_full_name, p_msisdn, p_zone, p_se_cluster, p_password
Logic:  Check UNIQUE on msisdn → hash password → INSERT → return row
Output: promoter_team_leads row (no password_hash)
```

### `tl_login`
```
Input:  p_msisdn, p_password
Logic:  SELECT row → crypt(p_password, password_hash) = password_hash → return row
Output: promoter_team_leads row (no password_hash), or NULL on failure
```

Password hashing: `crypt(p_password, gen_salt('bf', 10))` — bcrypt, cost factor 10.

---

## 7. App.tsx Routing

One new check added **before** the existing Sales/HBB routing block:

```typescript
// Check for Team Lead session
const tlUser = localStorage.getItem('tai_tl_user');
if (tlUser) {
  return <PromoterTeamLeadDashboard />;
}
```

This is the only change to App.tsx. The TL dashboard is a fully self-contained React tree — it handles its own tabs, data fetching, and logout.

---

## 8. Security

| Concern | Enforcement |
|---------|------------|
| Password storage | bcrypt (pgcrypto), cost 10. Never plaintext. |
| One promoter per TL | UNIQUE constraint on `promoter_members.msisdn` at DB level |
| Immutable reports | RLS policy blocks UPDATE/DELETE on gas_entries when `is_locked = true` |
| TL data isolation | RLS on all 4 tables — TLs can only read/write their own rows |
| Session | `tai_tl_user` in localStorage, cleared on logout. Separate key from `tai_user`. |

---

## 9. Files Changed / Created

| File | Type | Notes |
|------|------|-------|
| `src/components/LoginPage.tsx` | Modified | Add PROMOTER TEAM LEAD button in Sales mode only |
| `src/App.tsx` | Modified | Add TL session check + route to dashboard |
| `src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx` | New | Login + signup screen |
| `src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx` | New | 4-tab dashboard shell |
| `src/components/promoter-team-lead/tabs/TodayTab.tsx` | New | GA entry rows + submit |
| `src/components/promoter-team-lead/tabs/PromotersTab.tsx` | New | Add/drop promoters |
| `src/components/promoter-team-lead/tabs/HistoryTab.tsx` | New | Past reports (read-only) |
| `src/components/promoter-team-lead/tabs/SettingsTab.tsx` | New | Profile + logout |
| `src/components/promoter-team-lead/promoter-tl-api.ts` | New | All Supabase calls |
| `src/supabase/migrations/012_promoter_team_lead.sql` | New | Full DB migration |
