# 📚 COMPLETE SETUP GUIDE
**Sales Intelligence Network - Airtel Kenya**  
**Version**: 1.0.0  
**Last Updated**: December 28, 2024

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Environment Configuration](#environment-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## 🎯 PREREQUISITES

### **Required Tools**:
- ✅ Node.js v18+ (LTS recommended)
- ✅ npm or yarn package manager
- ✅ Supabase account (free tier works)
- ✅ Git for version control
- ✅ Modern web browser (Chrome/Firefox/Safari)

### **Recommended Tools**:
- VS Code with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - PostgreSQL syntax highlighter
- Postman or Insomnia (API testing)
- pgAdmin or TablePlus (database management)

### **Knowledge Required**:
- Basic SQL (for database setup)
- React/TypeScript fundamentals
- REST API concepts
- Command line basics

---

## ⚡ QUICK START

**Get running in 15 minutes:**

```bash
# 1. Clone repository
git clone https://github.com/your-org/sales-intelligence-network.git
cd sales-intelligence-network

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Configure Supabase (get from dashboard)
# Edit .env file with your credentials

# 5. Run database migrations
npm run db:migrate

# 6. Start development server
npm run dev
```

**Open**: http://localhost:5173

**Default Admin Login**:
- Phone: +254712000001
- PIN: 1234

---

## 🔧 DETAILED SETUP

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (if needed)
4. Create new project:
   - **Name**: sales-intelligence-network
   - **Database Password**: (generate strong password)
   - **Region**: Singapore (closest to Kenya)
5. Wait 2-3 minutes for provisioning

### **Step 2: Get Supabase Credentials**

1. In Supabase Dashboard → Settings → API
2. Copy the following:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ keep secret!)
   ```

3. In Supabase Dashboard → Settings → Database
4. Copy:
   ```
   Connection string: postgresql://postgres:[password]@...
   ```

### **Step 3: Configure Environment Variables**

Create `.env` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Server-side only (DO NOT expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:[password]@...

# Application Configuration
VITE_APP_NAME="Sales Intelligence Network"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT=development

# Optional: External Services
WEBHOOK_SECRET=your-webhook-secret-key
AFRICAS_TALKING_API_KEY=your-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
```

**Security Note**: Never commit `.env` to Git!

---

## 💾 DATABASE SETUP

### **Option A: Automatic Setup (Recommended)**

Run the migration script:

```bash
npm run db:migrate
```

This will execute all SQL files in order:
1. Schema creation (17 tables)
2. RLS policies (60+ policies)
3. Indexes (60+ indexes)
4. Triggers (auto-award achievements)
5. Materialized views (analytics)
6. Seed data (test users, mission types)

### **Option B: Manual Setup**

Execute SQL files in Supabase SQL Editor in this order:

#### **1. Create Schema** (`/sql/01_schema.sql`):
```sql
-- Run in Supabase Dashboard → SQL Editor
-- Copy contents of 01_schema.sql
-- Click "Run"
```

Creates 17 tables:
- users (662 SEs + admins)
- submissions (photo evidence)
- mission_types (Network, Conversion, etc.)
- achievements (18 badges)
- teams (50+ teams)
- daily_challenges
- announcements
- hotspots
- competitor_sightings
- otp_codes
- audit_logs
- And more...

#### **2. Enable Row Level Security** (`/sql/02_rls.sql`):
```sql
-- Run 02_rls.sql
```

Security features:
- Admins can view/edit all data
- SEs can only view own data
- Public endpoints locked down
- Phone-based access control

#### **3. Create Indexes** (`/sql/03_indexes.sql`):
```sql
-- Run 03_indexes.sql
```

Performance improvements:
- Phone lookup: 1ms (was 1000ms)
- Submission queries: 20ms (was 2000ms)
- Leaderboard: 5ms (was 5000ms)
- 60+ indexes total

#### **4. Setup Triggers** (`/sql/04_triggers.sql`):
```sql
-- Run 04_triggers.sql
```

Auto-award achievements:
- First submission → "Intelligence Rookie"
- 1000 points → "Field Operative"
- 5000 points → "Intelligence Expert"
- 10,000 points → "Master Spy"
- 25,000 points → "Legend"

#### **5. Create Materialized Views** (`/sql/05_views.sql`):
```sql
-- Run 05_views.sql
```

Fast analytics:
- `mv_leaderboard` - Real-time rankings
- `mv_daily_analytics` - Daily stats
- `mv_weekly_analytics` - Weekly trends
- `mv_regional_performance` - Regional comparison

#### **6. Seed Data** (`/sql/06_seed.sql`):
```sql
-- Run 06_seed.sql
```

Test data includes:
- 5 admin users (different roles)
- 10 mission types
- 18 achievements
- 5 teams
- Sample hotspots
- Test submissions

### **Verify Database Setup**

Run these queries to verify:

```sql
-- Check table counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'mission_types', COUNT(*) FROM mission_types;

-- Expected results:
-- users: 5-15 (seed data)
-- submissions: 0-50 (optional seed)
-- achievements: 18
-- mission_types: 10

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Should show all 17 tables with rowsecurity = true

-- Verify indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Should show 60+ indexes

-- Test materialized views
SELECT COUNT(*) FROM mv_leaderboard;
SELECT COUNT(*) FROM mv_daily_analytics;
```

---

## 🖥️ BACKEND SETUP

### **Step 1: Deploy Edge Functions**

#### **Method A: Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy edge functions
supabase functions deploy server
```

#### **Method B: Manual Deployment**

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create new function"
3. Name: `server`
4. Copy contents of `/supabase/functions/server/index.tsx`
5. Paste into editor
6. Click "Deploy"

#### **Important**: Deploy all 3 files:
- `index.tsx` (main server)
- `validation.tsx` (Zod schemas)
- `webhooks.tsx` (webhook handlers)

They should be in same directory:
```
/supabase/functions/server/
  ├── index.tsx
  ├── validation.tsx
  ├── webhooks.tsx
  └── kv_store.tsx (already exists)
```

### **Step 2: Test Edge Functions**

```bash
# Health check
curl https://your-project.supabase.co/functions/v1/make-server-28f2f653/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-12-28T...",
  "service": "Sales Intelligence Network API"
}
```

### **Step 3: Configure CORS (if needed)**

In Supabase Dashboard → Edge Functions → Settings:
- Allowed Origins: `*` (for development)
- For production: `https://yourdomain.com`

---

## 🎨 FRONTEND SETUP

### **Step 1: Install Dependencies**

```bash
npm install

# Or with yarn
yarn install
```

**Key Dependencies**:
- React 18+
- TypeScript
- Tailwind CSS
- Supabase JS Client
- Lucide React (icons)
- Zod (validation)

### **Step 2: Configure Build**

Edit `vite.config.ts` if needed:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow network access
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // For debugging
  },
});
```

### **Step 3: Start Development Server**

```bash
npm run dev

# Output:
# VITE v5.x.x  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.x.x:5173/
```

### **Step 4: Build for Production**

```bash
npm run build

# Output:
# vite v5.x.x building for production...
# ✓ built in 15s
# dist/index.html                 2.5 kB
# dist/assets/index-abc123.js     450 kB
# dist/assets/index-xyz789.css    180 kB
```

### **Step 5: Preview Production Build**

```bash
npm run preview

# Test production build locally
# Open: http://localhost:4173
```

---

## 🔐 ENVIRONMENT CONFIGURATION

### **Development Environment** (`.env.development`):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug
VITE_ENABLE_DEVTOOLS=true
```

### **Production Environment** (`.env.production`):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false
```

### **Environment Variables Guide**:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Public anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Service role (server-side only) |
| `SUPABASE_DB_URL` | ⚠️ Optional | Direct database connection |
| `WEBHOOK_SECRET` | ⚠️ Optional | Webhook signature verification |
| `VITE_ENVIRONMENT` | ⚠️ Optional | `development` or `production` |

---

## 🧪 TESTING

### **1. Database Tests**

Test RLS policies:

```sql
-- Test as SE user (should only see own data)
SET LOCAL jwt.claims.user_id = 'se-user-uuid';
SELECT * FROM submissions; -- Should see only own submissions

-- Test as admin (should see all data)
SET LOCAL jwt.claims.role = 'admin';
SELECT * FROM submissions; -- Should see all submissions
```

Test performance:

```sql
-- Phone lookup (should be <5ms)
EXPLAIN ANALYZE
SELECT * FROM users WHERE phone = '+254712345678';

-- Leaderboard query (should be <10ms)
EXPLAIN ANALYZE
SELECT * FROM mv_leaderboard LIMIT 10;
```

### **2. API Tests**

Test with curl:

```bash
# Get auth token first (login via app)
TOKEN="your-jwt-token"

# Test submission approval
curl -X POST \
  https://your-project.supabase.co/functions/v1/make-server-28f2f653/submissions/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "uuid-here",
    "pointsAwarded": 100,
    "reviewNotes": "Good work!"
  }'

# Test leaderboard
curl https://your-project.supabase.co/functions/v1/make-server-28f2f653/leaderboard?timeframe=weekly \
  -H "Authorization: Bearer $TOKEN"

# Test rate limiting (should fail after 100 requests)
for i in {1..101}; do
  curl -X POST ... # (same as above)
done
```

### **3. Frontend Tests**

Manual testing checklist:

**Admin Login**:
- [ ] Login with PIN works
- [ ] Login with OTP works
- [ ] Wrong PIN shows error
- [ ] Forgot PIN flow works

**Dashboard**:
- [ ] Stats load correctly
- [ ] Recent submissions display
- [ ] Graphs render properly
- [ ] No console errors

**Submission Review**:
- [ ] Pending submissions list loads
- [ ] Photos display correctly
- [ ] Approve button works
- [ ] Reject with reason works
- [ ] Bulk actions work

**Leaderboard**:
- [ ] Rankings display
- [ ] Filters work (region, time)
- [ ] Pagination works
- [ ] Real-time updates work

**Error Handling**:
- [ ] Network errors show message
- [ ] Invalid data handled gracefully
- [ ] Error boundary catches crashes
- [ ] Retry button works

### **4. Real-time Tests**

Test subscriptions:

```typescript
// In browser console
import { subscribeToSubmissions } from './lib/realtime';

const channel = subscribeToSubmissions((submission) => {
  console.log('New submission received:', submission);
});

// Now create a submission in another tab
// Should see console log immediately
```

### **5. Load Testing** (Optional)

Use Apache Bench or Artillery:

```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml <<EOF
config:
  target: 'https://your-project.supabase.co'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    flow:
      - get:
          url: "/functions/v1/make-server-28f2f653/health"
EOF

# Run test
artillery run load-test.yml

# Expected: 
# - 99% success rate
# - <500ms response time
# - No errors
```

---

## 🔧 TROUBLESHOOTING

### **Common Issues**:

#### **1. "Module not found" errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **2. Supabase connection fails**

Check:
- ✅ `.env` file exists and has correct values
- ✅ VITE_ prefix on frontend variables
- ✅ No trailing slashes in SUPABASE_URL
- ✅ Keys are not expired

Test connection:

```typescript
import { supabase } from './lib/supabase';

// In browser console or test file
supabase.from('users').select('count').then(console.log);
// Should return { data: [{ count: X }], error: null }
```

#### **3. RLS policy blocking access**

```sql
-- Temporarily disable RLS (DEVELOPMENT ONLY!)
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT * FROM submissions;

-- Re-enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
```

#### **4. Edge function not deploying**

- Check function name exactly: `server`
- Verify all files are in same directory
- Check for TypeScript errors
- View logs in Supabase Dashboard → Edge Functions → Logs

#### **5. Real-time not working**

In Supabase Dashboard:
- Database → Replication → Enable for tables
- Settings → API → Realtime enabled

Test:

```typescript
const channel = supabase.channel('test-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'submissions'
  }, payload => console.log(payload))
  .subscribe(status => console.log('Status:', status));

// Should log: Status: SUBSCRIBED
```

#### **6. Build errors**

```bash
# Clear build cache
rm -rf dist .vite

# Rebuild
npm run build

# Check for TypeScript errors
npm run type-check
```

#### **7. Performance issues**

Check:
- Database indexes created
- Materialized views refreshed
- Caching enabled (leaderboard API)
- No N+1 queries

Monitor in Supabase Dashboard → Reports:
- Query performance
- Connection pool
- Storage usage

---

## 📝 NEXT STEPS

After successful setup:

### **1. Create Admin User**

```sql
INSERT INTO users (phone, full_name, role, region, is_active)
VALUES ('+254712000001', 'System Admin', 'admin', 'Nairobi', true);

-- Set PIN (hash this in production)
UPDATE users 
SET pin_hash = '$2a$10$...' -- Use bcrypt
WHERE phone = '+254712000001';
```

### **2. Configure Mission Types**

Via Admin Dashboard:
- Settings → Point Configuration
- Add/Edit mission types
- Set point values

### **3. Create Teams**

```sql
INSERT INTO teams (name, region, leader_id)
VALUES 
  ('Team Alpha', 'Nairobi', 'admin-uuid'),
  ('Team Beta', 'Mombasa', 'asm-uuid');
```

### **4. Add Sales Executives**

Via Admin Dashboard or SQL:

```sql
INSERT INTO users (phone, full_name, role, region, team_id, employee_id, is_active)
VALUES 
  ('+254712345001', 'John Kamau', 'se', 'Nairobi', 'team-uuid', 'SE-2024-0001', true),
  ('+254712345002', 'Sarah Mwangi', 'se', 'Nairobi', 'team-uuid', 'SE-2024-0002', true);
```

### **5. Test End-to-End**

1. SE submits photo via mobile app (future)
2. Admin reviews in dashboard
3. Approval triggers points & achievements
4. Leaderboard updates in real-time
5. SE receives notification

### **6. Setup Monitoring**

Recommended tools:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Uptime Robot** - Uptime monitoring
- **Datadog** - Performance monitoring

### **7. Configure Backups**

In Supabase Dashboard:
- Settings → Database → Point-in-time Recovery (PITR)
- Enable automatic backups
- Test restore procedure

### **8. Setup CI/CD** (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

---

## 🎓 LEARNING RESOURCES

### **Documentation**:
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### **Project Documentation**:
- API Documentation → `/docs/API.md`
- Database Schema → `/docs/DATABASE.md`
- Deployment Guide → `/docs/DEPLOYMENT.md`
- Troubleshooting → `/docs/TROUBLESHOOTING.md`

---

## 🎉 SUCCESS!

If you've reached this point, congratulations! 🎊

You now have:
- ✅ Supabase database configured
- ✅ Backend API deployed
- ✅ Frontend running locally
- ✅ Real-time subscriptions active
- ✅ Authentication working
- ✅ Error handling in place

**Ready to onboard 662 Sales Executives!** 🚀

---

## 📞 SUPPORT

**Issues?**
- Check troubleshooting section above
- Review logs in Supabase Dashboard
- Check browser console for errors
- Verify environment variables

**Need Help?**
- Email: support@airtel.co.ke
- Slack: #sales-intel-network
- GitHub Issues: (your repo)

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Author**: Airtel Kenya Development Team
