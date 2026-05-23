# ⚠️ IMPORTANT: Schema Alignment Required

## 🔍 Issue Detected

There's a mismatch between table names in your database migration and the API functions in `/lib/supabase.ts`.

---

## 📊 Table Name Mismatches

| API Function References | Actual DB Schema | Status |
|------------------------|------------------|--------|
| `sales_executives` | `users` (filtered by role='se') | ❌ Mismatch |
| `mission_types` | `mission_types` | ✅ Match |
| `submissions` | `submissions` | ✅ Match |
| `daily_challenges` | `challenges` | ❌ Mismatch |
| `competitor_sightings` | `competitor_activity` | ❌ Mismatch |
| `achievements` | `achievements` | ✅ Match |
| `announcements` | `announcements` | ✅ Match |
| `regions` | ❌ Not in migration | ❌ Missing |
| `teams` | ❌ Not in migration | ❌ Missing |
| `admin_users` | `users` (filtered by role='admin') | ❌ Mismatch |

---

## 🎯 Solution: Create Database Views

The cleanest solution is to add **views** to your database that match the API's expectations. This way:
- ✅ API code doesn't need changes
- ✅ Database maintains clean single-source structure
- ✅ No duplicate data

### SQL to Add to Your Migration:

```sql
-- =====================================================
-- VIEWS FOR API COMPATIBILITY
-- =====================================================

-- Sales Executives View (SEs only)
CREATE VIEW sales_executives AS
SELECT 
  id,
  phone AS employee_id,
  full_name AS name,
  email,
  region AS region_id,
  team AS team_id,
  avatar_url,
  is_active,
  join_date,
  created_at
FROM users
WHERE role = 'se';

-- Admin Users View (Admins only)
CREATE VIEW admin_users AS
SELECT 
  id,
  email,
  full_name AS name,
  region,
  created_at
FROM users
WHERE role = 'admin';

-- Daily Challenges View (Alias for challenges table)
CREATE VIEW daily_challenges AS
SELECT 
  id,
  title,
  description,
  requirement AS target_type,
  reward_points,
  start_date,
  end_date,
  is_active,
  created_at
FROM challenges;

-- Competitor Sightings View (Alias for competitor_activity)
CREATE VIEW competitor_sightings AS
SELECT 
  id,
  competitor_name,
  activity_type,
  location_lat,
  location_lng,
  region,
  description,
  threat_level,
  reported_by,
  reported_at AS created_at
FROM competitor_activity;

-- =====================================================
-- MISSING TABLES
-- =====================================================

-- Regions Table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) UNIQUE,
  country VARCHAR(100) DEFAULT 'Kenya',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Kenya regions
INSERT INTO regions (name, code) VALUES
  ('Nairobi', 'NBI'),
  ('Mombasa', 'MBA'),
  ('Kisumu', 'KSM'),
  ('Nakuru', 'NKU'),
  ('Eldoret', 'ELD'),
  ('Central', 'CNT'),
  ('Rift Valley', 'RVL'),
  ('Western', 'WST'),
  ('Nyanza', 'NYZ'),
  ('Eastern', 'EST'),
  ('Coast', 'CST'),
  ('North Eastern', 'NET')
ON CONFLICT (name) DO NOTHING;

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regions(id),
  leader_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(name);
CREATE INDEX IF NOT EXISTS idx_teams_region ON teams(region_id);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add foreign key constraints if needed (after data migration)
-- Note: Only add these after ensuring region/team names match region_id/team_id values
-- ALTER TABLE users ADD CONSTRAINT fk_users_region FOREIGN KEY (region) REFERENCES regions(name);
-- ALTER TABLE users ADD CONSTRAINT fk_users_team FOREIGN KEY (team) REFERENCES teams(name);
```

---

## 🚀 How to Apply This Fix

### Option 1: Append to Migration File
1. Open `/supabase/migrations/001_initial_schema.sql`
2. Scroll to the end
3. Add the SQL above
4. Run the migration

### Option 2: Create New Migration File
1. Create `/supabase/migrations/002_add_views.sql`
2. Paste the SQL above
3. Run migrations in order

### Option 3: Run Directly in Supabase Dashboard
1. Go to SQL Editor in Supabase
2. Paste the SQL above
3. Execute

---

## 📝 Alternative: Update API Functions

If you prefer NOT to use views, you can update `/lib/supabase.ts` to use the correct table names:

- Change `sales_executives` queries to `users` with `WHERE role = 'se'`
- Change `daily_challenges` to `challenges`
- Change `competitor_sightings` to `competitor_activity`
- Add `regions` and `teams` tables to migration

---

## ⚡ Recommended Approach

**Use database views** (Option 1 above) because:

✅ No frontend code changes needed  
✅ Cleaner separation of concerns  
✅ Easier to maintain  
✅ Better performance (views are optimized)  
✅ Follows SQL best practices  

---

## 🎯 Action Items

- [ ] Decide: Views or API updates?
- [ ] Apply the SQL fix
- [ ] Re-run your database migration
- [ ] Test the admin dashboard
- [ ] Verify all API functions work

---

**Status:** ⚠️ Requires attention before full deployment  
**Priority:** High (blocks database integration)  
**Time to Fix:** 5-10 minutes
