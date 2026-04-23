# HBB GA (Gross Adds) Dashboard Implementation Guide

## Overview

The HBB GA Dashboard is a comprehensive performance tracking system designed for the Airtel Champions App's mobile sales ecosystem. It provides real-time insights into sales performance, incentive tracking, and team management across four user roles.

## Architecture

### Component Structure

```
hbb/
├── hbb-ga-dashboard-router.tsx       # Main entry point, role-based routing
├── hbb-dse-ga-dashboard.tsx          # DSE agent dashboard
├── hbb-team-lead-dashboard.tsx       # Team lead dashboard
├── hbb-manager-dashboard.tsx         # Area manager dashboard
├── hbb-ga-api.ts                    # API client functions
└── hbb-ga-utilities.ts              # Utility functions (bands, calculations)
```

### Database Schema

The GA dashboard requires the following Supabase tables:

#### 1. `hbb_ga_performance`
```sql
CREATE TABLE hbb_ga_performance (
  id BIGINT PRIMARY KEY,
  dse_msisdn VARCHAR NOT NULL,
  ga_count INT NOT NULL,
  incentive_earned NUMERIC NOT NULL,
  month_year VARCHAR NOT NULL,  -- YYYY-MM format
  created_at TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier
- `dse_msisdn`: Phone number of DSE agent
- `ga_count`: Number of gross adds in the period
- `incentive_earned`: Amount earned in KES
- `month_year`: Month in YYYY-MM format (e.g., "2024-01")
- `created_at`: Timestamp of record creation

#### 2. `hbb_users`
```sql
CREATE TABLE hbb_users (
  msisdn VARCHAR PRIMARY KEY,
  name VARCHAR,
  role VARCHAR,  -- 'dse', 'team_lead', 'manager', 'admin'
  team_lead_msisdn VARCHAR,  -- For DSE agents
  area_code VARCHAR,  -- For team leads and managers
  created_at TIMESTAMP
);
```

**Columns:**
- `msisdn`: Phone number (primary key)
- `name`: User's name
- `role`: User role in the hierarchy
- `team_lead_msisdn`: Reference to team lead (for DSE agents)
- `area_code`: Area code (for team leads and managers)
- `created_at`: Account creation timestamp

#### 3. `hbb_teams`
```sql
CREATE TABLE hbb_teams (
  id BIGINT PRIMARY KEY,
  team_lead_msisdn VARCHAR NOT NULL,
  dse_msisdn VARCHAR NOT NULL,
  month_year VARCHAR NOT NULL,
  created_at TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier
- `team_lead_msisdn`: Team lead's phone
- `dse_msisdn`: DSE agent's phone
- `month_year`: Period (YYYY-MM)
- `created_at`: Timestamp

**Purpose:** Maps DSE agents to their team leads for a given period to support historical reassignments.

## User Roles & Dashboards

### 1. DSE (Direct Sales Executive) Agent

**Dashboard:** `HBBDSEGADashboard`

**Features:**
- View current month's GA count and incentive earned
- Track band progression (Band 1-5)
- Visual progress bar to next band
- Monthly history with trend data
- Top 3 performers list for motivation
- Band breakdown information

**Key Metrics:**
- Current GA count
- Current band status
- Progress to next band (%)
- Incentive earned (KES)
- Team lead assignment

**Data Flow:**
1. User logs in with phone number
2. System queries `hbb_users` to get role
3. If DSE, fetch from `hbb_ga_performance` for current month
4. Get top 3 performers from same area for comparison
5. Calculate band info using utility functions

---

### 2. Team Lead

**Dashboard:** `HBBTeamLeadDashboard`

**Features:**
- View all team members and their GA counts
- Team performance analytics
- Individual DSE rankings within team
- Top performer and underperformers identification
- GA distribution analysis
- Team incentive tracking

**Key Metrics:**
- Total team GAs
- Team size
- Average GA per DSE
- Total team incentive earning
- Top DSE in team
- Underperforming team members

**Data Flow:**
1. User logs in with phone number
2. System queries `hbb_users` to verify team lead role
3. Fetch all DSEs under this team lead from `hbb_teams`
4. Get GA data for all team members from `hbb_ga_performance`
5. Calculate analytics and team statistics

---

### 3. Manager (Area Manager)

**Dashboard:** `HBBManagerDashboard`

**Features:**
- Oversee multiple teams in an area
- View all DSE agents across teams
- Area-level KPIs and performance
- Team lead performance comparison
- Identify underperforming teams
- Area health status and insights

**Key Metrics:**
- Total area GAs
- Total DSEs in area
- Total team leads in area
- Total incentive distributed
- Average GA per DSE (area-wide)
- Top team lead
- Top DSE
- Underperforming teams alert

**Data Flow:**
1. User logs in with phone number
2. System queries `hbb_users` to verify manager role and area_code
3. Fetch all team leads in area
4. Fetch all DSEs in teams within area
5. Calculate area-wide analytics
6. Identify performance outliers

---

### 4. Admin

Uses the Manager dashboard with system-wide data across all areas.

---

## Incentive Bands System

The dashboard includes a 5-tier band system that maps GA counts to incentive levels:

### Band Configuration

```javascript
const BAND_CONFIG = {
  dse: [
    { band: 1, min: 0, max: 4, incentive: 0 },
    { band: 2, min: 5, max: 9, incentive: 5000 },
    { band: 3, min: 10, max: 14, incentive: 10000 },
    { band: 4, min: 15, max: 19, incentive: 15000 },
    { band: 5, min: 20, max: Infinity, incentive: 20000 }
  ],
  team_lead: [
    // Team lead bands (calculated differently, based on team performance)
  ]
};
```

### Key Functions

**`getIncentiveBand(gaCount, role)`**
- Returns band info for given GA count
- Includes band name, min/max range, and incentive amount

**`calculateProgressToNextBand(gaCount, role)`**
- Calculates progress percentage to next band
- Returns GAs needed to reach next band
- Returns null if already in maximum band

---

## API Functions

### Core API Methods

#### DES Agent APIs

```typescript
// Get current month GA data for a DSE
getDSEGAData(msisdn: string, monthYear: string): Promise<DSEGAData>

// Get historical GA data for a DSE
getPersonGAHistory(msisdn: string, role: 'dse'): Promise<HistoryEntry[]>

// Get top 3 performers in area
getTop3DSEs(): Promise<TopPerformer[]>
```

#### Team Lead APIs

```typescript
// Get team summary data
getTeamLeadData(msisdn: string, monthYear: string): Promise<TeamLeadData>

// Get all DSEs under team lead
getTeamMembers(msisdn: string): Promise<TeamMember[]>

// Get team analytics
getTeamAnalytics(msisdn: string): Promise<TeamAnalytics>
```

#### Manager APIs

```typescript
// Get area summary data
getManagerAreaData(msisdn: string, monthYear: string): Promise<AreaData>

// Get all team leads in area
getTeamLeadsByArea(msisdn: string): Promise<TeamLeadSummary[]>

// Get all DSEs in area
getAllDSEsByArea(msisdn: string): Promise<DSESummary[]>

// Get area analytics
getAreaAnalytics(msisdn: string): Promise<AreaAnalytics>
```

#### Authentication APIs

```typescript
// Determine user role based on phone/MSISDN
getUserRole(msisdn: string): Promise<UserRole>

// Logout user
logoutUser(): Promise<void>
```

---

## Data Models

### DSEGAData
```typescript
interface DSEGAData {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  team_lead_msisdn: string;
  month_year: string;
}
```

### TeamLeadData
```typescript
interface TeamLeadData {
  team_lead_msisdn: string;
  team_lead_name: string;
  total_team_gas: number;
  team_size: number;
  team_incentive_total: number;
  avg_ga_per_dse: number;
  month_year: string;
}
```

### AreaData
```typescript
interface AreaData {
  area_code: string;
  area_name: string;
  total_gas: number;
  total_dses: number;
  total_team_leads: number;
  total_incentive: number;
  avg_ga_per_dse: number;
  month_year: string;
}
```

---

## Integration Guide

### 1. Add to Main Route

In your main app routing file:

```typescript
import { HBBGADashboardRouter } from '@/components/hbb/hbb-ga-dashboard-router';

// In your router/app setup
<Route path="/hbb-ga" element={<HBBGADashboardRouter />} />
```

### 2. Enable Supabase Tables

Ensure RLS policies are configured:

```sql
-- Allow authenticated users to view own data
CREATE POLICY "Allow users to view own GA data"
  ON hbb_ga_performance FOR SELECT
  USING (auth.uid()::text = dse_msisdn);

-- Allow managers to view team data
CREATE POLICY "Allow team leads to view team data"
  ON hbb_ga_performance FOR SELECT
  USING (
    dse_msisdn IN (
      SELECT dse_msisdn FROM hbb_teams 
      WHERE team_lead_msisdn = auth.uid()::text
    )
  );
```

### 3. Configure API Endpoints

Update `hbb-ga-api.ts` with your Supabase client:

```typescript
import { supabase } from '@/lib/supabase-client';

// All API functions use this client
```

---

## UI/UX Features

### Responsive Design
- Mobile-first approach
- Optimized for small screens
- Tablet and desktop layouts

### Visual Elements
- Color-coded metrics (red GA counts, green incentives, etc.)
- Progress bars showing band progression
- Card-based layout for information hierarchy
- Icons for quick visual identification
- Loading states and error handling

### Navigation
- Tab-based view switching (Current, History, Analytics)
- Breadcrumb where needed
- Search functionality for large lists
- Filter options for team members

---

## Performance Optimization

### Caching Strategy
```typescript
// Cache user role for session
localStorage.setItem('hbb_user', JSON.stringify(userData));

// Cache is invalidated on logout
localStorage.removeItem('hbb_user');
```

### Data Loading
- Parallel requests using `Promise.all()` where possible
- Lazy loading for history/detailed data
- Pagination for large lists (implement if needed)

### API Optimization
- Use indexed queries (month_year, dse_msisdn)
- Limit data ranges to prevent large datasets
- Cache aggregated data at the API level

---

## Testing Checklist

- [ ] DSE sees only own data
- [ ] Team lead sees all team members' data
- [ ] Manager sees all area data
- [ ] Band progression calculations are accurate
- [ ] Incentive values display correctly
- [ ] History loads and displays properly
- [ ] Search/filter works on team member lists
- [ ] Mobile responsiveness verified
- [ ] Error handling for missing data
- [ ] Logout clears cached data
- [ ] Role-based access control verified

---

## Future Enhancements

1. **Export Functionality**: Allow export to CSV/PDF
2. **Notifications**: Push alerts for achievement milestones
3. **Predictions**: ML-based projections for band achievement
4. **Comparison Charts**: Visual comparison of team performance
5. **Goal Setting**: Allow DSEs to set personal targets
6. **Performance Trends**: Multi-month trend analysis
7. **Offline Mode**: Cache data for offline access
8. **Real-time Updates**: WebSocket integration for live data

---

## Troubleshooting

### Common Issues

**1. No data displaying**
- Check Supabase RLS policies
- Verify user exists in `hbb_users` table
- Check month_year format (YYYY-MM)

**2. Wrong role displaying**
- Verify `hbb_users.role` value
- Check for cache invalidation needed

**3. Incorrect band calculations**
- Review band configuration in utilities
- Test with known GA values

**4. Team lead not seeing team members**
- Verify `hbb_teams` table has entries
- Check team_lead_msisdn matches

---

## Support & Questions

For issues or questions about the GA Dashboard system, contact the development team.
