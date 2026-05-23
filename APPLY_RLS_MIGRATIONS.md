# Apply RLS Migrations to Fix 406 Errors

## Problem
Dashboard shows "Everything is on 0" because new tables (`hbb_installer_ga_monthly` etc.) have RLS enabled but **no SELECT/INSERT policies defined**. This causes all queries to return **406 Not Acceptable**.

## Solution
Apply two migrations to Supabase:

### Step 1: Enable RLS Policies (BLOCKING - DO THIS FIRST)
**File:** `supabase/migrations/20260428_hbb_ga_rls_policies.sql`

**What it does:** 
- Enables RLS on all 4 new GA tables
- Adds SELECT policies allowing anon/authenticated read (GA data is public-facing)
- Adds INSERT policies for server to persist data

**How to apply:**

#### Option A: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new
2. Copy the entire content of `supabase/migrations/20260428_hbb_ga_rls_policies.sql`
3. Paste into the SQL editor
4. Click **Execute** (play button, top right)
5. Wait for success message (should be instant)

#### Option B: psql (if available)
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/20260428_hbb_ga_rls_policies.sql
```

#### Option C: Supabase CLI (if installed)
```bash
cd c:\DEV\PWA\Airtel Champions App Web
supabase db push
```

**Expected Result:**
- No error messages
- All 8 policies created successfully
- New table queries no longer return 406

---

### Step 2: Migrate 252 Installer Records (DO AFTER STEP 1)
**File:** `supabase/migrations/20260428_hbb_ga_migrate_data.sql`

**What it does:**
- Copies 252 installer records from old `HBB_INSTALLER_GA_MONTHLY` to new `hbb_installer_ga_monthly`
- Copies DSE records from old `HBB_DSE_GA_MONTHLY` to new `hbb_dse_ga_monthly`
- Handles NULL values safely with COALESCE

**Prerequisites:** Step 1 (RLS migration) must complete successfully first

**How to apply:**

#### Option A: Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql/new
2. Copy the entire content of `supabase/migrations/20260428_hbb_ga_migrate_data.sql`
3. Paste into the SQL editor
4. Click **Execute**
5. Wait for success message (should show 252 rows copied)

#### Option B: psql
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/20260428_hbb_ga_migrate_data.sql
```

**Expected Result:**
- `INSERT INTO ... SELECT ...` messages
- `hbb_installer_ga_monthly` row count ≥ 252
- `hbb_dse_ga_monthly` row count ≥ number of DSE records

---

## Verification

After both migrations applied, verify in Supabase dashboard:

1. **Check RLS Policies:**
   - Go to Tables > `hbb_installer_ga_monthly` > RLS Policies
   - Should see 2 policies: `hbb_installer_ga_monthly_read_all` and `hbb_installer_ga_monthly_insert_admin`
   - Same for other 3 tables

2. **Check Data Migrated:**
   ```sql
   -- Run in SQL editor
   SELECT COUNT(*) FROM hbb_installer_ga_monthly;
   -- Should show 252 or higher
   
   SELECT COUNT(*) FROM hbb_dse_ga_monthly;
   -- Should show DSE count
   ```

3. **Check Specific Record:**
   ```sql
   -- Verify "Pauline Wambui Kinuthia" is present
   SELECT installer_msisdn, installer_name, ga_count FROM hbb_installer_ga_monthly 
   WHERE installer_msisdn = '0100008040' AND month_year = '2026-04';
   -- Should show 1 row with GA count 146 (or actual value)
   ```

---

## Testing in App

After migrations applied:

1. **Reload installer dashboard**
   - Open http://localhost:3001 (or your PWA URL)
   - Log in as "CAVEN OUMA" / 0100010159
   - Navigate to HBB GA Dashboard

2. **Check console (F12 > Console tab)**
   - Should NOT see: `GET .../hbb_installer_ga_monthly?... 406`
   - Should see successful queries if RLS applied correctly

3. **Verify GA count displays**
   - Month 2026-04 should show correct GA count (e.g., 146 for Pauline Wambui Kinuthia)
   - No more "Everything is on 0"

4. **Click "View details" button**
   - Should show day-by-day breakdown of GA (if batch rows were persisted)
   - Or blank if no daily records yet (awaiting go-live handler activation)

---

## Troubleshooting

**Still seeing 406 errors after RLS migration?**
- Clear browser cache: Ctrl+Shift+Delete in Chrome/Edge
- Check browser console for exact error message
- Verify RLS policies were created: `SELECT * FROM pg_policies WHERE tablename = 'hbb_installer_ga_monthly';`

**Still seeing 0 GA counts?**
- Confirm data migration ran: `SELECT COUNT(*) FROM hbb_installer_ga_monthly;`
- Check if installer MSISDN matches: Phone should be normalized as `0XXXXXXXXX`
- Verify month_year format: Should be `2026-04` (YYYY-MM)

**Queries still pointing to old table?**
- Check browser network tab: Look for table names in request URLs
- Verify fallback helpers are being called (check console logs)
- Restart dev server if needed: `npm run dev`

---

## Next Steps (Phase 2)

After migrations applied and verified:

1. Test `/hbb-ga-go-live` endpoint with real batch_id
2. Verify day-level history display (day-by-day GA breakdown)
3. Monitor RPC aggregation: `recompute_hbb_installer_monthly_from_daily()`
4. Plan long-term go-live flow integration

---

**Timeline:** Both migrations typically complete in < 5 seconds total
**Risk:** Very low - RLS policies are read-all (permissive), data copy uses ON CONFLICT (idempotent)
**Rollback:** Can safely re-run both migrations (ON CONFLICT DO NOTHING prevents duplicates)
