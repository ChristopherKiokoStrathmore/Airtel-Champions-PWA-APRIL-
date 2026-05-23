# Conversion Rate Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three conversion rate metric cards to the installer GA dashboard (Current Month view): Days Productive %, GA Efficiency, and Job Conversion Rate.

**Architecture:** All three metrics are computed frontend-side from existing `history` data (daily GA array) plus one new Supabase query for completed job count. A utility function handles working-days calculation (6-day week, Sundays excluded). A new API function fetches completed `service_requests` count for the installer this month. Three stat cards render below the GA Count card in the current month view.

**Tech Stack:** React, TypeScript, Supabase JS client, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `src/components/hbb/hbb-ga-utilities.ts` | Add `getWorkingDaysElapsed(monthYear)` |
| `src/components/hbb/hbb-ga-api.ts` | Add `getInstallerCompletedJobsCount(msisdn, monthYear)` |
| `src/components/hbb/hbb-installer-ga-dashboard.tsx` | Add state, fetch call, and 3 conversion metric cards |

---

## Task 1: Add `getWorkingDaysElapsed` utility

**Files:**
- Modify: `src/components/hbb/hbb-ga-utilities.ts` (append after `getDaysRemainingInMonth`)

- [ ] **Step 1: Add the function**

Append this to `src/components/hbb/hbb-ga-utilities.ts` after the `getDaysRemainingInMonth` function:

```ts
/**
 * Count working days elapsed so far in a given month_year (e.g. "2026-05").
 * A working day is any day that is NOT a Sunday (1 rest day per week).
 * For the current month, counts up to today. For past months, counts the full month.
 */
export function getWorkingDaysElapsed(monthYear: string): number {
  const [y, m] = monthYear.split('-').map(Number);
  if (!y || !m) return 0;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;
  const lastDay = isCurrentMonth
    ? today.getDate()
    : new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    if (new Date(y, m - 1, d).getDay() !== 0) count++;
  }
  return count;
}
```

- [ ] **Step 2: Manual verify**

In browser console (after build), run:
```js
// Should return number of non-Sunday days from May 1–6 2026 = 5
// (May 1=Fri, 2=Sat, 3=Sun, 4=Mon, 5=Tue, 6=Wed → 5 working days)
```
Expected: 5 for `"2026-05"` on May 6.

- [ ] **Step 3: Commit**

```bash
git add src/components/hbb/hbb-ga-utilities.ts
git commit -m "feat(installer-ga): add getWorkingDaysElapsed utility (6-day week)"
```

---

## Task 2: Add `getInstallerCompletedJobsCount` API function

**Files:**
- Modify: `src/components/hbb/hbb-ga-api.ts` (append before the closing of the file)

- [ ] **Step 1: Add the function**

Append this to `src/components/hbb/hbb-ga-api.ts` (before the last closing line):

```ts
/**
 * Count completed service_requests for an installer in the given month.
 * Looks up the installer's numeric ID from the `installers` table by phone variants,
 * then counts completed jobs within the calendar month.
 * Returns 0 silently on any error — metric is best-effort.
 */
export async function getInstallerCompletedJobsCount(
  msisdn: string,
  monthYear: string
): Promise<number> {
  try {
    const normalized = normalizePhone(msisdn);
    const base = normalized.replace(/^0/, '');
    const variants = Array.from(new Set([
      normalized, base, `254${base}`, `+254${base}`,
    ]));

    const { data: installerRows, error: idErr } = await supabase
      .from('installers')
      .select('id')
      .in('phone', variants);

    if (idErr || !installerRows || installerRows.length === 0) return 0;

    const ids = installerRows.map((r: any) => r.id);
    const [year, month] = monthYear.split('-');
    const nextMonthNum = Number(month) + 1;
    const nextYear = nextMonthNum > 12 ? Number(year) + 1 : Number(year);
    const nextMonthStr = (nextMonthNum > 12 ? 1 : nextMonthNum).toString().padStart(2, '0');

    const { count, error: jobErr } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in('installer_id', ids)
      .gte('completed_at', `${year}-${month}-01`)
      .lt('completed_at', `${nextYear}-${nextMonthStr}-01`);

    if (jobErr) {
      console.warn('[GA API] Completed jobs count failed:', jobErr.message);
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hbb/hbb-ga-api.ts
git commit -m "feat(installer-ga): add getInstallerCompletedJobsCount API function"
```

---

## Task 3: Wire conversion metrics into the GA dashboard

**Files:**
- Modify: `src/components/hbb/hbb-installer-ga-dashboard.tsx`

- [ ] **Step 1: Update imports**

In `hbb-installer-ga-dashboard.tsx`, update the import from `hbb-ga-api.ts`:

```ts
import {
  getInstallerDailyHistory,
  getInstallerGACurrentMonth,
  getInstallersByTeamLead,
  getInstallerCompletedJobsCount,
  InstallerLeaderboardEntry,
} from './hbb-ga-api';
```

And update the import from `hbb-ga-utilities.ts`:

```ts
import { getIncentiveBand, calculateProgressToNextBand, getCurrentMonthYear, normalizePhone, formatCurrency, getWorkingDaysElapsed } from './hbb-ga-utilities';
```

- [ ] **Step 2: Add completed jobs state**

Inside `HBBInstallerGADashboard`, add this state alongside the existing state declarations (after the `leaderboard` states):

```ts
const [completedJobsCount, setCompletedJobsCount] = useState<number | null>(null);
```

- [ ] **Step 3: Fetch completed jobs count in loadData**

Inside `loadData`, after `setHistory(historyData);`, add:

```ts
      // Fetch completed jobs count for job conversion metric (best-effort)
      const jobsMsisdn = data?.installer_msisdn || msisdnToQuery;
      const jobMonth = data?.month_year || currentMonth;
      getInstallerCompletedJobsCount(jobsMsisdn, jobMonth)
        .then(count => setCompletedJobsCount(count))
        .catch(() => setCompletedJobsCount(0));
```

- [ ] **Step 4: Compute the three metrics**

In the render section, just before the `return (` statement (after the `filteredHistory` derivation), add:

```ts
  const daysProductive = history.filter(e => (e.total_ga ?? 0) >= 1).length;
  const workingDaysElapsed = getWorkingDaysElapsed(gaData.month_year);
  const daysProductivePct = workingDaysElapsed > 0
    ? Math.round((daysProductive / workingDaysElapsed) * 100)
    : 0;
  const gaEfficiency = daysProductive > 0
    ? (gaData.ga_count / daysProductive).toFixed(1)
    : '0.0';
  const jobConversionPct = (completedJobsCount !== null && completedJobsCount > 0)
    ? Math.round((gaData.ga_count / completedJobsCount) * 100)
    : null;
```

- [ ] **Step 5: Add the Conversion Rate cards to the JSX**

Inside the `{viewMode === 'current' && (` block, add this section immediately after the closing `</div>` of the "GA Count Card":

```tsx
            {/* Conversion Rate Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                Conversion Rate
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {/* Days Productive % */}
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{daysProductivePct}%</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">Days Productive</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{daysProductive}/{workingDaysElapsed} days</p>
                </div>

                {/* GA Efficiency */}
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{gaEfficiency}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">GA / Day</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">on active days</p>
                </div>

                {/* Job Conversion */}
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  {jobConversionPct !== null ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{jobConversionPct}%</p>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">Job Conversion</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{gaData.ga_count} GA / {completedJobsCount} jobs</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-400">—</p>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">Job Conversion</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">no jobs yet</p>
                    </>
                  )}
                </div>
              </div>
            </div>
```

- [ ] **Step 6: Build and verify in browser**

```bash
npm run build
```

Open the installer GA dashboard → Current Month view. Confirm:
- "Conversion Rate" section appears below the GA count card with 3 stats
- Days Productive % shows `X/Y days` where Y matches working days elapsed this month
- GA/Day shows a decimal (e.g. 2.0)
- Job Conversion shows `—` if no completed jobs, or a % with the fraction

- [ ] **Step 7: Commit**

```bash
git add src/components/hbb/hbb-installer-ga-dashboard.tsx
git commit -m "feat(installer-ga): add conversion rate metrics (days productive, GA efficiency, job conversion)"
```
