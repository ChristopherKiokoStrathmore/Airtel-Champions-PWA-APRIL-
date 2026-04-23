// Quick Start Guide for HBB GA Dashboard Integration

## Step 1: Add Route to Your App

In your main app routing file (e.g., `src/App.tsx` or `src/routes.tsx`):

```typescript
// Add this import at the top
import { HBBGADashboardPage } from '@/pages/hbb-ga-dashboard';

// Add this route in your router configuration
<Route path="/hbb-ga" element={<HBBGADashboardPage />} />
```

---

## Step 2: Create Database Tables

Run this SQL in Supabase to create the required tables:

```sql
-- Create hbb_ga_performance table
CREATE TABLE IF NOT EXISTS hbb_ga_performance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dse_msisdn VARCHAR NOT NULL,
  ga_count INT NOT NULL DEFAULT 0,
  incentive_earned NUMERIC NOT NULL DEFAULT 0,
  month_year VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hbb_ga_dse_month ON hbb_ga_performance(dse_msisdn, month_year);
CREATE INDEX idx_hbb_ga_month ON hbb_ga_performance(month_year);

-- Create hbb_users table
CREATE TABLE IF NOT EXISTS hbb_users (
  msisdn VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('dse', 'team_lead', 'manager', 'admin')),
  team_lead_msisdn VARCHAR,
  area_code VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for hbb_users
CREATE INDEX idx_hbb_users_role ON hbb_users(role);
CREATE INDEX idx_hbb_users_area ON hbb_users(area_code);

-- Create hbb_teams table (team assignments)
CREATE TABLE IF NOT EXISTS hbb_teams (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_lead_msisdn VARCHAR NOT NULL REFERENCES hbb_users(msisdn),
  dse_msisdn VARCHAR NOT NULL REFERENCES hbb_users(msisdn),
  month_year VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for hbb_teams
CREATE INDEX idx_hbb_teams_lead_month ON hbb_teams(team_lead_msisdn, month_year);
CREATE INDEX idx_hbb_teams_dse_month ON hbb_teams(dse_msisdn, month_year);

-- Enable Row Level Security
ALTER TABLE hbb_ga_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for hbb_ga_performance: Users can see own data
CREATE POLICY "Users can view own GA data"
  ON hbb_ga_performance FOR SELECT
  USING (dse_msisdn = current_setting('app.current_user', true));

-- Policy for hbb_teams: Team leads can see their teams
CREATE POLICY "Team leads can view team members"
  ON hbb_teams FOR SELECT
  USING (team_lead_msisdn = current_setting('app.current_user', true));

-- Policy for hbb_users: Users can view own record
CREATE POLICY "Users can view own profile"
  ON hbb_users FOR SELECT
  USING (msisdn = current_setting('app.current_user', true));
```

---

## Step 3: Create API Service File

Create `src/components/hbb/hbb-ga-api.ts`:

```typescript
import { supabase } from '@/lib/supabase-client';

/**
 * Fetch GA data for a DSE agent
 */
export async function getDSEGAData(msisdn: string, monthYear: string) {
  const { data, error } = await supabase
    .from('hbb_ga_performance')
    .select('*')
    .eq('dse_msisdn', msisdn)
    .eq('month_year', monthYear)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch GA history for a person
 */
export async function getPersonGAHistory(msisdn: string, role: string) {
  const { data, error } = await supabase
    .from('hbb_ga_performance')
    .select('*')
    .eq('dse_msisdn', msisdn)
    .order('month_year', { ascending: false })
    .limit(12);

  if (error) throw error;
  return data || [];
}

/**
 * Get top 3 DSEs
 */
export async function getTop3DSEs() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const { data, error } = await supabase
    .from('hbb_ga_performance')
    .select('*')
    .eq('month_year', currentMonth)
    .order('ga_count', { ascending: false })
    .limit(3);

  if (error) throw error;
  return data || [];
}

/**
 * Get team lead data
 */
export async function getTeamLeadData(msisdn: string, monthYear: string) {
  // Fetch all team members
  const { data: teamMembers, error: teamError } = await supabase
    .from('hbb_teams')
    .select('dse_msisdn')
    .eq('team_lead_msisdn', msisdn)
    .eq('month_year', monthYear);

  if (teamError) throw teamError;

  const dseList = teamMembers?.map(t => t.dse_msisdn) || [];

  // Fetch GA data for all team members
  const { data: gaData, error: gaError } = await supabase
    .from('hbb_ga_performance')
    .select('*')
    .in('dse_msisdn', dseList)
    .eq('month_year', monthYear);

  if (gaError) throw gaError;

  // Calculate totals
  const totalGAs = gaData?.reduce((sum, item) => sum + item.ga_count, 0) || 0;
  const totalIncentive = gaData?.reduce((sum, item) => sum + item.incentive_earned, 0) || 0;

  return {
    team_lead_msisdn: msisdn,
    team_lead_name: 'Team Lead',
    total_team_gas: totalGAs,
    team_size: dseList.length,
    team_incentive_total: totalIncentive,
    avg_ga_per_dse: dseList.length > 0 ? totalGAs / dseList.length : 0,
    month_year: monthYear
  };
}

/**
 * Get all team members
 */
export async function getTeamMembers(msisdn: string) {
  const { data, error } = await supabase
    .from('hbb_teams')
    .select('dse_msisdn')
    .eq('team_lead_msisdn', msisdn);

  if (error) throw error;
  
  const dseList = data?.map(t => t.dse_msisdn) || [];
  
  return dseList;
}

/**
 * Get user role
 */
export async function getUserRole(msisdn: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('hbb_users')
    .select('role')
    .eq('msisdn', msisdn)
    .single();

  if (error) return null;
  return data?.role || null;
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ... Add other API functions as needed (see hbb-ga-api.ts in components)
```

---

## Step 4: Create Utilities File

Create `src/components/hbb/hbb-ga-utilities.ts`:

```typescript
interface Band {
  bandName: string;
  gaRangeMin: number;
  gaRangeMax: number;
  totalBonus: number;
}

const BAND_CONFIGURATION: Record<string, Array<Band>> = {
  dse: [
    { bandName: 'Band 1', gaRangeMin: 0, gaRangeMax: 4, totalBonus: 0 },
    { bandName: 'Band 2', gaRangeMin: 5, gaRangeMax: 9, totalBonus: 5000 },
    { bandName: 'Band 3', gaRangeMin: 10, gaRangeMax: 14, totalBonus: 10000 },
    { bandName: 'Band 4', gaRangeMin: 15, gaRangeMax: 19, totalBonus: 15000 },
    { bandName: 'Band 5', gaRangeMin: 20, gaRangeMax: 100, totalBonus: 20000 }
  ]
};

/**
 * Get incentive band for given GA count
 */
export function getIncentiveBand(gaCount: number, role: string): Band | null {
  const bands = BAND_CONFIGURATION[role];
  return bands.find(band => gaCount >= band.gaRangeMin && gaCount <= band.gaRangeMax) || null;
}

/**
 * Calculate progress to next band
 */
export function calculateProgressToNextBand(gaCount: number, role: string) {
  const bands = BAND_CONFIGURATION[role];
  const currentBandIdx = bands.findIndex(b => gaCount >= b.gaRangeMin && gaCount <= b.gaRangeMax);
  
  if (currentBandIdx === -1 || currentBandIdx === bands.length - 1) {
    return null; // At max band
  }

  const currentBand = bands[currentBandIdx];
  const nextBand = bands[currentBandIdx + 1];
  
  const gasNeeded = Math.max(0, nextBand.gaRangeMin - gaCount);
  const gasInRange = nextBand.gaRangeMin - currentBand.gaRangeMin;
  const gasProgress = gaCount - currentBand.gaRangeMin;
  const percent = Math.min(100, Math.round((gasProgress / gasInRange) * 100));

  return { gasNeeded, percent };
}
```

---

## Step 5: Add Navigation Link

In your main navigation component:

```typescript
// In your navigation/menu component
<Link to="/hbb-ga" className="...">
  GA Dashboard
</Link>
```

---

## Step 6: Test with Sample Data

Add test data to Supabase:

```sql
-- Insert test users
INSERT INTO hbb_users (msisdn, name, role, area_code) VALUES
('254712345678', 'John DSE', 'dse', 'AREA001'),
('254712345679', 'Jane Team Lead', 'team_lead', 'AREA001'),
('254712345680', 'Bob Manager', 'manager', 'AREA001');

-- Insert test GA data
INSERT INTO hbb_ga_performance (dse_msisdn, ga_count, incentive_earned, month_year) VALUES
('254712345678', 12, 10000, '2024-01'),
('254712345678', 8, 5000, '2023-12'),
('254712345679', 45, 20000, '2024-01');

-- Insert test teams
INSERT INTO hbb_teams (team_lead_msisdn, dse_msisdn, month_year) VALUES
('254712345679', '254712345678', '2024-01');
```

---

## Step 7: Test the Dashboard

1. Navigate to `http://localhost:5173/hbb-ga` (adjust port as needed)
2. Enter phone number: `254712345678`
3. You should see the DSE dashboard
4. Try other test phone numbers to see different roles

---

## Troubleshooting

### "No GA data found"
- Check that user exists in `hbb_users` table
- Check that GA data exists in `hbb_ga_performance` for current month
- Verify `month_year` format is `YYYY-MM`

### "Unable to determine your role"
- Check user role in `hbb_users` table
- Valid roles: 'dse', 'team_lead', 'manager', 'admin'

### "No team members found" (Team Lead)
- Check `hbb_teams` table has entries
- Verify `team_lead_msisdn` matches the team lead's phone
- Check `month_year` format

### RLS Policy Errors
- Verify RLS is enabled on tables
- Check user authentication setup
- Ensure Supabase client is properly initialized

---

## Next Steps

1. ✅ Implement full `hbb-ga-api.ts` with all API functions
2. ✅ Complete `hbb-ga-utilities.ts` with all utility functions
3. 🔄 Setup database with RLS policies
4. 🔄 Test all dashboards with real data
5. 🔄 Optimize performance with indexes
6. 🔄 Setup error monitoring
7. 🔄 Deploy and monitor

---

## Support

For questions or issues, refer to:
- `HBB_GA_DASHBOARD_GUIDE.md` - Full documentation
- Component source code comments
- Supabase documentation

Good luck! 🚀
