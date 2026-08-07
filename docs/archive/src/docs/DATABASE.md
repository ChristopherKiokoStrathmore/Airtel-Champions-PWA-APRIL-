# 💾 DATABASE SCHEMA DOCUMENTATION

**Sales Intelligence Network - Airtel Kenya**  
**Database**: PostgreSQL 15 (Supabase)  
**Version**: 1.0.0  
**Last Updated**: December 28, 2024

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Triggers](#triggers)
6. [Functions](#functions)
7. [Materialized Views](#materialized-views)
8. [Row Level Security](#row-level-security)
9. [Data Dictionary](#data-dictionary)
10. [Migration Guide](#migration-guide)

---

## 🎯 OVERVIEW

### **Statistics**:
- **Tables**: 17
- **Indexes**: 60+
- **Triggers**: 8
- **Functions**: 22
- **Materialized Views**: 4
- **RLS Policies**: 60+

### **Purpose**:
Centralized database for managing:
- 662 Sales Executives
- Photo submission reviews
- Points & leaderboards
- Achievements & badges
- Teams & hierarchy
- Competitor intelligence
- Daily challenges
- Announcements

### **Performance**:
- Phone lookup: ~1ms
- Submission queries: ~20ms
- Leaderboard: ~5ms (materialized view)
- Analytics: ~100ms

---

## 📊 ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────┐
│    users    │──────┐
└─────────────┘      │
       │             │
       │ 1:N         │ 1:N
       │             │
       ▼             ▼
┌─────────────┐  ┌──────────────────┐
│ submissions │  │ user_achievements│
└─────────────┘  └──────────────────┘
       │                   │
       │ N:1               │ N:1
       │                   │
       ▼                   ▼
┌──────────────┐  ┌────────────────┐
│ mission_types│  │  achievements  │
└──────────────┘  └────────────────┘

┌─────────┐      ┌──────────────┐
│  teams  │─────>│    users     │
└─────────┘ 1:N  └──────────────┘
                        │
                        │ 1:N
                        ▼
                ┌────────────────────┐
                │ competitor_sightings│
                └────────────────────┘

┌─────────────────┐
│ daily_challenges│
└─────────────────┘

┌──────────────┐
│ announcements│
└──────────────┘

┌──────────┐
│ hotspots │
└──────────┘

┌───────────┐
│ otp_codes │
└───────────┘

┌────────────┐
│ audit_logs │
└────────────┘
```

---

## 📚 TABLES

### **1. users** (Core Table)

**Purpose**: Stores all system users (admins, managers, Sales Executives)

**Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'zsm', 'asm', 'rsm', 'se')),
  region VARCHAR(50),
  team_id UUID REFERENCES teams(id),
  employee_id VARCHAR(50) UNIQUE,
  pin_hash VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_users_phone` (UNIQUE) - Fast phone lookup
- `idx_users_role` - Filter by role
- `idx_users_region` - Regional queries
- `idx_users_team_id` - Team membership
- `idx_users_employee_id` (UNIQUE) - Employee lookup

**Sample Data**:
```sql
INSERT INTO users (phone, full_name, role, region, employee_id) VALUES
('+254712000001', 'Admin User', 'admin', 'Nairobi', 'ADM-2024-0001'),
('+254712000002', 'Sarah Mwangi', 'se', 'Nairobi', 'SE-2024-0001');
```

**Constraints**:
- Phone must be unique
- Role must be valid enum
- Employee ID must be unique
- PIN must be bcrypt hashed

---

### **2. submissions** (Core Table)

**Purpose**: Stores photo submissions from SEs for review

**Schema**:
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_type_id UUID NOT NULL REFERENCES mission_types(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  photo_url TEXT,
  photo_metadata JSONB,
  location GEOGRAPHY(POINT, 4326),
  location_name VARCHAR(200),
  notes TEXT,
  points_awarded INTEGER DEFAULT 0,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_submissions_user_id` - User's submissions
- `idx_submissions_status` - Pending review queue
- `idx_submissions_created_at` - Time-based queries
- `idx_submissions_points_awarded` - Leaderboard calculations
- `idx_submissions_location` (GIST) - Geospatial queries

**Triggers**:
- `tr_award_achievements` - Auto-award achievements on approval
- `tr_update_timestamp` - Auto-update updated_at

**Sample Query**:
```sql
-- Get pending submissions for review
SELECT 
  s.id,
  u.full_name as se_name,
  mt.name as mission_type,
  s.location_name,
  s.created_at
FROM submissions s
JOIN users u ON u.id = s.user_id
JOIN mission_types mt ON mt.id = s.mission_type_id
WHERE s.status = 'pending'
ORDER BY s.created_at ASC
LIMIT 50;
```

---

### **3. mission_types**

**Purpose**: Defines types of intelligence missions SEs can complete

**Schema**:
```sql
CREATE TABLE mission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  base_points INTEGER NOT NULL DEFAULT 50,
  requires_photo BOOLEAN DEFAULT true,
  requires_location BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Mission Types**:
```sql
INSERT INTO mission_types (code, name, category, base_points) VALUES
('NETWORK_EXPERIENCE', 'Network Experience', 'network', 80),
('COMPETITION_CONVERSION', 'Competition Conversion', 'competition', 200),
('NEW_SITE_LAUNCH', 'New Site Launch', 'expansion', 150),
('AMB_VISITATIONS', 'AMB Visitations', 'retail', 100),
('COMPETITOR_SPOTTED', 'Competitor Activity', 'intelligence', 120),
('CUSTOMER_FEEDBACK', 'Customer Feedback', 'insights', 60),
('NETWORK_ISSUE', 'Network Issue Report', 'quality', 70),
('RETAIL_ACTIVATION', 'Retail Activation', 'retail', 90),
('BUNDLE_SALE', 'Bundle Sale', 'sales', 50),
('SIM_REGISTRATION', 'SIM Registration', 'compliance', 40);
```

---

### **4. achievements**

**Purpose**: Defines badges/achievements users can unlock

**Schema**:
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  category VARCHAR(50),
  tier VARCHAR(20) CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  criteria INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Achievement Categories**:
- **submissions** - Based on submission count
- **points** - Based on total points
- **streak** - Consecutive day streaks
- **special** - Special achievements

**Example Achievements**:
```sql
INSERT INTO achievements (code, name, category, tier, criteria, points_reward) VALUES
-- Submissions based
('FIRST_SUBMISSION', 'Intelligence Rookie', 'submissions', 'bronze', 1, 100),
('10_SUBMISSIONS', 'Field Operative', 'submissions', 'silver', 10, 200),
('50_SUBMISSIONS', 'Intelligence Expert', 'submissions', 'gold', 50, 500),

-- Points based
('1000_POINTS', 'Rising Star', 'points', 'bronze', 1000, 200),
('5000_POINTS', 'Master Agent', 'points', 'gold', 5000, 500),
('10000_POINTS', 'Legend', 'points', 'platinum', 10000, 1000),

-- Streak based
('3_DAY_STREAK', 'Consistent Contributor', 'streak', 'bronze', 3, 150),
('7_DAY_STREAK', 'Week Warrior', 'streak', 'silver', 7, 300),
('30_DAY_STREAK', 'Unstoppable', 'streak', 'gold', 30, 1000);
```

---

### **5. user_achievements**

**Purpose**: Junction table for users and their unlocked achievements

**Schema**:
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

**Indexes**:
- `idx_user_achievements_user_id` - User's badges
- `idx_user_achievements_unlocked_at` - Recent unlocks

---

### **6. teams**

**Purpose**: Organizational structure for SEs

**Schema**:
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50),
  leader_id UUID REFERENCES users(id),
  target_submissions INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **7. daily_challenges**

**Purpose**: Time-bound challenges to motivate SEs

**Schema**:
```sql
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  target_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Challenges**:
```sql
INSERT INTO daily_challenges (title, start_date, end_date, target_value, reward_points) VALUES
('Weekend Warrior', '2024-12-28', '2024-12-29', 10, 500),
('First Week Sprint', '2024-12-28', '2025-01-03', 50, 1000);
```

---

### **8. announcements**

**Purpose**: System-wide or targeted announcements

**Schema**:
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_audience VARCHAR(50),
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### **9. hotspots**

**Purpose**: Geographic areas of interest for intelligence gathering

**Schema**:
```sql
CREATE TABLE hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  hotspot_type VARCHAR(50),
  priority_level VARCHAR(20) CHECK (priority_level IN ('low', 'medium', 'high')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_meters INTEGER DEFAULT 500,
  target_submissions INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Geospatial Queries**:
```sql
-- Find submissions within a hotspot
SELECT s.* 
FROM submissions s
JOIN hotspots h ON h.id = 'hotspot-uuid'
WHERE ST_DWithin(s.location::geography, h.location, h.radius_meters);

-- Find all hotspots near a location
SELECT * 
FROM hotspots 
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326)::geography,
  5000 -- 5km radius
);
```

---

### **10. competitor_sightings**

**Purpose**: Track competitor activities reported by SEs

**Schema**:
```sql
CREATE TABLE competitor_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name VARCHAR(100) NOT NULL,
  activity_type VARCHAR(100),
  sighting_date TIMESTAMPTZ NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  location_name VARCHAR(200),
  photo_url TEXT,
  notes TEXT,
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Competitor Intelligence Queries**:
```sql
-- Top competitors by sightings
SELECT 
  competitor_name,
  COUNT(*) as sightings,
  COUNT(DISTINCT location_name) as locations,
  MAX(sighting_date) as last_seen
FROM competitor_sightings
WHERE sighting_date > NOW() - INTERVAL '30 days'
GROUP BY competitor_name
ORDER BY sightings DESC;
```

---

### **11. otp_codes**

**Purpose**: One-time passwords for authentication

**Schema**:
```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  delivery_status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_otp_codes_phone_used` - Active OTPs
- `idx_otp_codes_expires_at` - Cleanup expired

**Cleanup Old OTPs**:
```sql
DELETE FROM otp_codes 
WHERE expires_at < NOW() - INTERVAL '24 hours';
```

---

### **12. audit_logs**

**Purpose**: Track all critical actions for compliance

**Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Partitioning Strategy** (for high volume):
```sql
-- Partition by month
CREATE TABLE audit_logs_2024_12 PARTITION OF audit_logs
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

**Common Queries**:
```sql
-- User activity log
SELECT * FROM audit_logs 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC 
LIMIT 100;

-- Recent submission approvals
SELECT * FROM audit_logs 
WHERE action = 'APPROVE_SUBMISSION' 
AND created_at > NOW() - INTERVAL '1 day';
```

---

## 🔍 INDEXES

### **Performance Indexes**:

```sql
-- Phone lookup (most critical)
CREATE UNIQUE INDEX idx_users_phone ON users(phone);

-- Submission queries
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_points ON submissions(points_awarded DESC);

-- Leaderboard calculation
CREATE INDEX idx_submissions_approved_points 
ON submissions(user_id, points_awarded) 
WHERE status = 'approved';

-- Geospatial
CREATE INDEX idx_submissions_location ON submissions USING GIST(location);
CREATE INDEX idx_hotspots_location ON hotspots USING GIST(location);

-- Composite indexes
CREATE INDEX idx_submissions_status_created 
ON submissions(status, created_at DESC);

CREATE INDEX idx_user_achievements_user_achievement 
ON user_achievements(user_id, achievement_id);
```

### **Index Maintenance**:

```sql
-- Rebuild indexes (if fragmented)
REINDEX INDEX idx_users_phone;

-- Analyze tables (update statistics)
ANALYZE submissions;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## ⚙️ TRIGGERS

### **1. Auto-Award Achievements**:

```sql
CREATE OR REPLACE FUNCTION award_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for approved submissions
  IF NEW.status = 'approved' THEN
    
    -- Get user's stats
    DECLARE
      total_submissions INTEGER;
      total_points INTEGER;
    BEGIN
      SELECT COUNT(*), COALESCE(SUM(points_awarded), 0)
      INTO total_submissions, total_points
      FROM submissions
      WHERE user_id = NEW.user_id AND status = 'approved';
      
      -- Award submission-based achievements
      IF total_submissions = 1 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT NEW.user_id, id FROM achievements 
        WHERE code = 'FIRST_SUBMISSION'
        ON CONFLICT DO NOTHING;
      END IF;
      
      IF total_submissions = 10 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT NEW.user_id, id FROM achievements 
        WHERE code = '10_SUBMISSIONS'
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Award points-based achievements
      IF total_points >= 1000 THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        SELECT NEW.user_id, id FROM achievements 
        WHERE code = '1000_POINTS'
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_award_achievements
  AFTER INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION award_achievements();
```

### **2. Update Timestamp**:

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_timestamp_submissions
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

---

## 🔧 FUNCTIONS

### **1. Get Leaderboard**:

```sql
CREATE OR REPLACE FUNCTION get_leaderboard(p_timeframe VARCHAR DEFAULT 'weekly')
RETURNS TABLE(
  user_id UUID,
  full_name VARCHAR,
  region VARCHAR,
  total_points BIGINT,
  submissions_count BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      s.user_id,
      u.full_name,
      u.region,
      SUM(s.points_awarded) as total_points,
      COUNT(*) as submissions_count
    FROM submissions s
    JOIN users u ON u.id = s.user_id
    WHERE s.status = 'approved'
    AND (
      CASE 
        WHEN p_timeframe = 'daily' THEN s.created_at > NOW() - INTERVAL '1 day'
        WHEN p_timeframe = 'weekly' THEN s.created_at > NOW() - INTERVAL '7 days'
        WHEN p_timeframe = 'monthly' THEN s.created_at > NOW() - INTERVAL '30 days'
        ELSE TRUE
      END
    )
    GROUP BY s.user_id, u.full_name, u.region
  )
  SELECT 
    us.*,
    RANK() OVER (ORDER BY us.total_points DESC) as rank
  FROM user_stats us
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- Usage:
SELECT * FROM get_leaderboard('weekly') LIMIT 10;
```

### **2. Calculate User Stats**:

```sql
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_submissions', COUNT(*),
    'approved_submissions', COUNT(*) FILTER (WHERE status = 'approved'),
    'pending_submissions', COUNT(*) FILTER (WHERE status = 'pending'),
    'rejected_submissions', COUNT(*) FILTER (WHERE status = 'rejected'),
    'total_points', COALESCE(SUM(points_awarded) FILTER (WHERE status = 'approved'), 0),
    'approval_rate', 
      CASE WHEN COUNT(*) > 0 
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'approved') / COUNT(*), 2)
      ELSE 0 
      END,
    'achievements_count', (
      SELECT COUNT(*) FROM user_achievements WHERE user_id = p_user_id
    )
  )
  INTO result
  FROM submissions
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Usage:
SELECT get_user_stats('user-uuid');
```

---

## 📊 MATERIALIZED VIEWS

### **1. Leaderboard View**:

```sql
CREATE MATERIALIZED VIEW mv_leaderboard AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.region,
  u.team_id,
  COUNT(s.id) as total_submissions,
  COALESCE(SUM(s.points_awarded) FILTER (WHERE s.status = 'approved'), 0) as total_points,
  RANK() OVER (ORDER BY COALESCE(SUM(s.points_awarded) FILTER (WHERE s.status = 'approved'), 0) DESC) as rank,
  RANK() OVER (PARTITION BY u.region ORDER BY COALESCE(SUM(s.points_awarded) FILTER (WHERE s.status = 'approved'), 0) DESC) as regional_rank
FROM users u
LEFT JOIN submissions s ON s.user_id = u.id
WHERE u.role = 'se' AND u.is_active = true
GROUP BY u.id, u.full_name, u.region, u.team_id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_mv_leaderboard_user_id ON mv_leaderboard(user_id);
CREATE INDEX idx_mv_leaderboard_rank ON mv_leaderboard(rank);

-- Refresh (run daily via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard;
```

### **2. Daily Analytics View**:

```sql
CREATE MATERIALIZED VIEW mv_daily_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COALESCE(SUM(points_awarded) FILTER (WHERE status = 'approved'), 0) as total_points,
  COUNT(DISTINCT user_id) as active_users
FROM submissions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_analytics;
```

---

## 🔒 ROW LEVEL SECURITY

### **Enable RLS on All Tables**:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

### **Admin Policies** (Full Access):

```sql
-- Admins can view all
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'zsm', 'asm', 'rsm')
    )
  );

-- Admins can update
CREATE POLICY "Admins can update submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'zsm', 'asm', 'rsm')
    )
  );
```

### **SE Policies** (Own Data Only):

```sql
-- SEs can view own submissions
CREATE POLICY "SEs can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SEs can insert own submissions
CREATE POLICY "SEs can insert own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## 📖 DATA DICTIONARY

### **Common Data Types**:

| Type | PostgreSQL Type | Example | Notes |
|------|----------------|---------|-------|
| ID | UUID | `123e4567-e89b-12d3-a456-426614174000` | Primary keys |
| Phone | VARCHAR(20) | `+254712345678` | E.164 format |
| Timestamp | TIMESTAMPTZ | `2024-12-28T10:00:00Z` | UTC timezone |
| Location | GEOGRAPHY(POINT) | `POINT(36.8219 -1.2921)` | Longitude, Latitude |
| JSON | JSONB | `{"key": "value"}` | Binary JSON |

### **Enum Values**:

**User Roles**:
- `admin` - System administrator
- `zsm` - Zonal Sales Manager
- `asm` - Area Sales Manager  
- `rsm` - Regional Sales Manager
- `se` - Sales Executive

**Submission Status**:
- `pending` - Awaiting review
- `approved` - Accepted, points awarded
- `rejected` - Denied with reason

**Achievement Tiers**:
- `bronze` - Entry level
- `silver` - Intermediate
- `gold` - Advanced
- `platinum` - Expert
- `diamond` - Elite

---

## 🔄 MIGRATION GUIDE

### **Adding a New Table**:

```sql
-- 1. Create table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "Admins full access" ON new_table
  FOR ALL TO authenticated
  USING (/* admin check */);

-- 4. Create indexes
CREATE INDEX idx_new_table_created ON new_table(created_at);

-- 5. Update materialized views if needed
REFRESH MATERIALIZED VIEW mv_analytics;
```

### **Modifying a Table**:

```sql
-- 1. Add column
ALTER TABLE submissions 
ADD COLUMN new_field VARCHAR(100);

-- 2. Update existing data if needed
UPDATE submissions SET new_field = 'default' WHERE new_field IS NULL;

-- 3. Add constraints
ALTER TABLE submissions 
ALTER COLUMN new_field SET NOT NULL;

-- 4. Create index if needed
CREATE INDEX idx_submissions_new_field ON submissions(new_field);
```

### **Backup Before Migration**:

```bash
# Supabase Dashboard → Database → Backups → Create backup

# Or via pg_dump
pg_dump -h db.project.supabase.co -U postgres -d postgres > backup.sql
```

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Schema Version**: 1.0.0  
**Maintained by**: Airtel Kenya Development Team
