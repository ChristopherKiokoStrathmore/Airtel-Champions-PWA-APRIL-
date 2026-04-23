-- HBB GA Dashboard - Database Setup SQL
-- Run this in Supabase SQL Editor
-- Tables for role-based GA tracking system

-- =============================================================================
-- TABLE 1: HBB Users Registry
-- Stores user information with role hierarchy
-- =============================================================================

CREATE TABLE IF NOT EXISTS hbb_users (
  msisdn VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('dse', 'team_lead', 'manager', 'admin')),
  team_lead_msisdn VARCHAR(20),
  area_code VARCHAR(50),
  town VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key relationships
  CONSTRAINT fk_team_lead FOREIGN KEY (team_lead_msisdn) 
    REFERENCES hbb_users(msisdn) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_hbb_users_role ON hbb_users(role);
CREATE INDEX idx_hbb_users_area ON hbb_users(area_code);
CREATE INDEX idx_hbb_users_team_lead ON hbb_users(team_lead_msisdn);

-- =============================================================================
-- TABLE 2: GA Performance Data
-- Monthly GA counts and incentive earnings
-- =============================================================================

CREATE TABLE IF NOT EXISTS hbb_ga_performance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  dse_msisdn VARCHAR(20) NOT NULL REFERENCES hbb_users(msisdn) ON DELETE CASCADE,
  ga_count INT NOT NULL DEFAULT 0,
  incentive_earned NUMERIC(12, 2) NOT NULL DEFAULT 0,
  month_year VARCHAR(7) NOT NULL,  -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique per DSE per month
  CONSTRAINT unique_dse_month UNIQUE(dse_msisdn, month_year)
);

-- Create indexes for performance queries
CREATE INDEX idx_hbb_ga_dse_month ON hbb_ga_performance(dse_msisdn, month_year);
CREATE INDEX idx_hbb_ga_month ON hbb_ga_performance(month_year);
CREATE INDEX idx_hbb_ga_count ON hbb_ga_performance(ga_count DESC);

-- =============================================================================
-- TABLE 3: Team Assignments (Historical)
-- Tracks which DSEs belong to which team lead by month
-- Allows for team reassignments over time
-- =============================================================================

CREATE TABLE IF NOT EXISTS hbb_teams (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  team_lead_msisdn VARCHAR(20) NOT NULL REFERENCES hbb_users(msisdn) ON DELETE CASCADE,
  dse_msisdn VARCHAR(20) NOT NULL REFERENCES hbb_users(msisdn) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL,  -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique per team per DSE per month
  CONSTRAINT unique_team_dse_month UNIQUE(team_lead_msisdn, dse_msisdn, month_year)
);

-- Create indexes for team queries
CREATE INDEX idx_hbb_teams_lead_month ON hbb_teams(team_lead_msisdn, month_year);
CREATE INDEX idx_hbb_teams_dse_month ON hbb_teams(dse_msisdn, month_year);
CREATE INDEX idx_hbb_teams_month ON hbb_teams(month_year);

-- =============================================================================
-- TABLE 4: Incentive Band Configuration
-- Configurable bands for different roles
-- =============================================================================

CREATE TABLE IF NOT EXISTS hbb_incentive_bands (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_type VARCHAR(50) NOT NULL,  -- 'dse', 'team_lead', 'manager'
  band_name VARCHAR(100) NOT NULL,
  ga_range_min INT NOT NULL,
  ga_range_max INT NOT NULL,
  incentive_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_band_config UNIQUE(role_type, band_name)
);

-- Insert default DSE bands
INSERT INTO hbb_incentive_bands (role_type, band_name, ga_range_min, ga_range_max, incentive_amount)
VALUES
  ('dse', 'Band 1', 0, 4, 0),
  ('dse', 'Band 2', 5, 9, 5000),
  ('dse', 'Band 3', 10, 14, 10000),
  ('dse', 'Band 4', 15, 19, 15000),
  ('dse', 'Band 5', 20, 999, 20000)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TABLE 5: Audit Log
-- Track all changes to GA data for compliance
-- =============================================================================

CREATE TABLE IF NOT EXISTS hbb_audit_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  action VARCHAR(50) NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  table_name VARCHAR(100) NOT NULL,
  record_id BIGINT,
  user_msisdn VARCHAR(20),
  changes JSONB,  -- JSON of what changed
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Create index for audit queries
CREATE INDEX idx_hbb_audit_timestamp ON hbb_audit_log(timestamp DESC);
CREATE INDEX idx_hbb_audit_user ON hbb_audit_log(user_msisdn);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE hbb_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_ga_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_incentive_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE hbb_audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLICIES FOR hbb_users
-- =============================================================================

-- Anyone can read their own user record
CREATE POLICY "Users can view own profile"
  ON hbb_users FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- Managers can view team members in their area
CREATE POLICY "Managers can view area users"
  ON hbb_users FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- =============================================================================
-- POLICIES FOR hbb_ga_performance
-- =============================================================================

-- DSE can see only their own GA data
CREATE POLICY "DSEs can view own GA data"
  ON hbb_ga_performance FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- Team leads can see their team's GA data
CREATE POLICY "Team leads can view team GA data"
  ON hbb_ga_performance FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- Managers can see all GA data in their area
CREATE POLICY "Managers can view area GA data"
  ON hbb_ga_performance FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- =============================================================================
-- POLICIES FOR hbb_teams
-- =============================================================================

-- Team leads can see their team assignments
CREATE POLICY "Team leads can view their teams"
  ON hbb_teams FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- DSEs can see their team assignment
CREATE POLICY "DSEs can view their team assignment"
  ON hbb_teams FOR SELECT
  USING (TRUE);  -- Will be enhanced with auth checks

-- =============================================================================
-- VIEWS FOR DASHBOARD QUERIES
-- =============================================================================

-- View for DSE monthly performance
CREATE OR REPLACE VIEW hbb_dse_monthly_performance AS
SELECT
  g.dse_msisdn,
  u.name AS dse_name,
  g.ga_count,
  g.incentive_earned,
  g.month_year,
  u.team_lead_msisdn,
  u.area_code,
  u.town,
  RANK() OVER (PARTITION BY g.month_year ORDER BY g.ga_count DESC) AS rank_in_month
FROM hbb_ga_performance g
JOIN hbb_users u ON g.dse_msisdn = u.msisdn
WHERE u.role = 'dse';

-- View for Team Lead aggregated data
CREATE OR REPLACE VIEW hbb_team_lead_performance AS
SELECT
  t.team_lead_msisdn,
  u.name AS team_lead_name,
  t.month_year,
  COUNT(DISTINCT t.dse_msisdn) AS team_size,
  COALESCE(SUM(g.ga_count), 0) AS total_team_gas,
  COALESCE(SUM(g.incentive_earned), 0) AS total_team_incentive,
  COALESCE(AVG(g.ga_count), 0) AS avg_ga_per_dse
FROM hbb_teams t
JOIN hbb_users u ON t.team_lead_msisdn = u.msisdn
LEFT JOIN hbb_ga_performance g ON t.dse_msisdn = g.dse_msisdn 
  AND t.month_year = g.month_year
WHERE u.role = 'team_lead'
GROUP BY t.team_lead_msisdn, u.name, t.month_year;

-- View for Area Manager aggregated data
CREATE OR REPLACE VIEW hbb_area_performance AS
SELECT
  u.area_code,
  u.name AS area_manager,
  g.month_year,
  COUNT(DISTINCT g.dse_msisdn) AS total_dses,
  COUNT(DISTINCT CASE WHEN u2.role = 'team_lead' THEN u2.msisdn END) AS total_team_leads,
  COALESCE(SUM(g.ga_count), 0) AS total_area_gas,
  COALESCE(SUM(g.incentive_earned), 0) AS total_area_incentive,
  COALESCE(AVG(g.ga_count), 0) AS avg_ga_per_dse
FROM hbb_users u
LEFT JOIN hbb_ga_performance g ON TRUE
LEFT JOIN hbb_users u2 ON u2.area_code = u.area_code
WHERE u.role = 'manager'
  AND g.dse_msisdn IN (SELECT msisdn FROM hbb_users WHERE area_code = u.area_code)
GROUP BY u.area_code, u.name, g.month_year;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample users
INSERT INTO hbb_users (msisdn, name, role, area_code, town)
VALUES
  ('0712345678', 'John DSE 1', 'dse', 'AREA001', 'Nairobi'),
  ('0712345679', 'Jane DSE 2', 'dse', 'AREA001', 'Nairobi'),
  ('0712345680', 'Bob DSE 3', 'dse', 'AREA001', 'Nairobi'),
  ('0712345681', 'Alice Team Lead', 'team_lead', 'AREA001', 'Nairobi'),
  ('0712345682', 'Charlie Manager', 'manager', 'AREA001', 'Nairobi'),
  ('0712345683', 'Admin User', 'admin', NULL, 'Nairobi')
ON CONFLICT DO NOTHING;

-- Update team assignments
UPDATE hbb_users SET team_lead_msisdn = '0712345681' 
WHERE msisdn IN ('0712345678', '0712345679', '0712345680');

-- Insert sample GA data
INSERT INTO hbb_ga_performance (dse_msisdn, ga_count, incentive_earned, month_year)
VALUES
  ('0712345678', 12, 10000, '2026-04'),
  ('0712345679', 8, 5000, '2026-04'),
  ('0712345680', 18, 15000, '2026-04'),
  ('0712345678', 10, 10000, '2026-03'),
  ('0712345679', 6, 5000, '2026-03'),
  ('0712345680', 22, 20000, '2026-03')
ON CONFLICT DO NOTHING;

-- Insert team assignments
INSERT INTO hbb_teams (team_lead_msisdn, dse_msisdn, month_year)
VALUES
  ('0712345681', '0712345678', '2026-04'),
  ('0712345681', '0712345679', '2026-04'),
  ('0712345681', '0712345680', '2026-04'),
  ('0712345681', '0712345678', '2026-03'),
  ('0712345681', '0712345679', '2026-03'),
  ('0712345681', '0712345680', '2026-03')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFY SETUP
-- =============================================================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'hbb_%';

-- Check sample data
SELECT * FROM hbb_users LIMIT 5;
SELECT * FROM hbb_ga_performance LIMIT 5;
SELECT * FROM hbb_teams LIMIT 5;

-- Test views
SELECT * FROM hbb_dse_monthly_performance LIMIT 5;
SELECT * FROM hbb_team_lead_performance LIMIT 5;

COMMIT;
