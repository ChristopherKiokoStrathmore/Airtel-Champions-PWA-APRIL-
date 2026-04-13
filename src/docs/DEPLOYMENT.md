# 🚀 DEPLOYMENT GUIDE
**Sales Intelligence Network - Airtel Kenya**  
**Version**: 1.0.0  
**Last Updated**: December 28, 2024

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Environment Setup](#production-environment-setup)
3. [Database Migration](#database-migration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)
9. [Scaling Strategy](#scaling-strategy)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### **Code Quality** ✅
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation clean (`npm run type-check`)
- [ ] No console errors in production build
- [ ] Code reviewed by 2+ team members
- [ ] Security audit completed
- [ ] Performance benchmarks met

### **Database** ✅
- [ ] All migrations tested on staging
- [ ] Backup created before migration
- [ ] RLS policies verified
- [ ] Indexes created and tested
- [ ] Materialized views working
- [ ] Data validation passed

### **Environment** ✅
- [ ] Production `.env` configured
- [ ] API keys rotated
- [ ] Secrets stored in secure vault
- [ ] CORS settings updated
- [ ] Rate limits configured
- [ ] Monitoring tools set up

### **Documentation** ✅
- [ ] API documentation up to date
- [ ] Deployment runbook reviewed
- [ ] Rollback plan documented
- [ ] Team trained on new features
- [ ] User guides updated
- [ ] Change log prepared

### **Infrastructure** ✅
- [ ] Staging environment tested
- [ ] Load testing completed
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] CDN configured (if applicable)
- [ ] Backup systems verified

---

## 🏗️ PRODUCTION ENVIRONMENT SETUP

### **1. Create Production Supabase Project**

```bash
# Create new project
# Name: sales-intel-network-prod
# Region: Singapore (closest to Kenya)
# Plan: Pro ($25/month recommended)
```

**Pro Plan Benefits**:
- 8GB database
- 250GB bandwidth
- 100GB storage
- Daily backups
- Point-in-time recovery
- No pausing

### **2. Configure Production Database**

**Connection Pooling**:
```
Mode: Transaction
Pool Size: 15 (adjust based on load)
```

**Extensions**:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Performance Settings**:
```sql
-- In Supabase Dashboard → Settings → Database
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

### **3. Set Environment Variables**

**Production `.env`**:
```env
# Supabase
VITE_SUPABASE_URL=https://prod-xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI... # Keep secret!
SUPABASE_DB_URL=postgresql://postgres:...

# Application
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=error
VITE_ENABLE_DEVTOOLS=false

# External Services
WEBHOOK_SECRET=strong-random-secret-key
AFRICAS_TALKING_API_KEY=your-production-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOGROCKET_APP_ID=your-app-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@airtel.co.ke
SMTP_PASS=app-specific-password
```

**Security Notes**:
- ⚠️ Never commit `.env` to Git
- ⚠️ Use different keys for prod/staging
- ⚠️ Rotate keys every 90 days
- ⚠️ Store in secure vault (AWS Secrets Manager, Vault, etc.)

### **4. Configure Supabase Settings**

**Authentication**:
```
Settings → Authentication → Configuration

- Site URL: https://yourdomain.com
- Redirect URLs: https://yourdomain.com/auth/callback
- JWT Expiry: 3600 seconds (1 hour)
- Enable Email Confirmations: Yes
- Secure email change: Yes
```

**Realtime**:
```
Settings → API → Realtime

- Enable Realtime: Yes
- Max clients per channel: 100
- Max channels per client: 10
- Enable presence: Yes
- Enable broadcast: Yes
```

**Storage**:
```
Storage → Settings

- File size limit: 10MB
- Allowed MIME types: image/jpeg, image/png
- Enable RLS: Yes
```

---

## 📊 DATABASE MIGRATION

### **Method 1: Automated Migration (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref your-prod-ref

# Apply migrations
supabase db push

# Verify
supabase db pull
```

### **Method 2: Manual Migration**

**Execute in order**:

1. **Backup Current Database**:
```sql
-- In Supabase Dashboard → Database → Backups
-- Click "Create backup"
-- Wait for completion
```

2. **Run Schema Migration** (`01_schema.sql`):
```bash
psql $DATABASE_URL < sql/01_schema.sql
```

3. **Apply RLS Policies** (`02_rls.sql`):
```bash
psql $DATABASE_URL < sql/02_rls.sql
```

4. **Create Indexes** (`03_indexes.sql`):
```bash
psql $DATABASE_URL < sql/03_indexes.sql
```

5. **Setup Triggers** (`04_triggers.sql`):
```bash
psql $DATABASE_URL < sql/04_triggers.sql
```

6. **Create Views** (`05_views.sql`):
```bash
psql $DATABASE_URL < sql/05_views.sql
```

7. **Seed Data** (`06_seed.sql`) - **Production only includes essential data**:
```bash
# DO NOT run full seed file in production
# Only create:
# - Admin users
# - Mission types
# - Achievements
# - Active teams

psql $DATABASE_URL < sql/06_seed_production.sql
```

### **Verify Migration**:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 17

-- Check RLS enabled
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: All 17 tables

-- Check indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Expected: 60+

-- Check materialized views
SELECT matviewname FROM pg_matviews;
-- Expected: 4 views

-- Test query performance
EXPLAIN ANALYZE
SELECT * FROM users WHERE phone = '+254712000001';
-- Expected: < 5ms
```

---

## 🖥️ BACKEND DEPLOYMENT

### **Deploy Edge Functions**

#### **Option A: Supabase CLI**

```bash
# Deploy all functions
supabase functions deploy server

# Deploy with secrets
supabase secrets set WEBHOOK_SECRET=your-secret
supabase secrets set SMTP_PASSWORD=your-password

# Verify deployment
supabase functions list
```

#### **Option B: Manual Deployment**

1. Go to Supabase Dashboard → Edge Functions
2. Create function named `server`
3. Copy `/supabase/functions/server/index.tsx`
4. Add environment variables in function settings
5. Deploy

**Required Environment Variables**:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
WEBHOOK_SECRET
```

### **Test Edge Functions**

```bash
# Health check
curl https://your-prod-project.supabase.co/functions/v1/make-server-28f2f653/health

# Test with auth
curl -X POST https://your-prod-project.supabase.co/functions/v1/make-server-28f2f653/submissions/approve \
  -H "Authorization: Bearer YOUR_PROD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"test-uuid","pointsAwarded":100}'
```

### **Configure Cron Jobs** (Optional)

For automated tasks like refreshing materialized views:

```sql
-- Create cron job extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Refresh materialized views daily at 2 AM
SELECT cron.schedule(
  'refresh-materialized-views',
  '0 2 * * *',
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_regional_performance;
  $$
);

-- Cleanup old OTP codes daily at 3 AM
SELECT cron.schedule(
  'cleanup-old-otps',
  '0 3 * * *',
  $$
    DELETE FROM otp_codes WHERE created_at < NOW() - INTERVAL '24 hours';
  $$
);

-- Archive old audit logs monthly
SELECT cron.schedule(
  'archive-audit-logs',
  '0 4 1 * *',
  $$
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '6 months';
  $$
);
```

---

## 🎨 FRONTEND DEPLOYMENT

### **Build Production Bundle**

```bash
# Install dependencies
npm ci  # Use 'ci' for reproducible builds

# Run linting
npm run lint

# Type check
npm run type-check

# Build for production
npm run build

# Output:
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-abc123.js (450KB)
#   │   └── index-xyz789.css (180KB)
#   └── ...

# Test production build locally
npm run preview
```

### **Deployment Options**

#### **Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### **Option 2: Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

#### **Option 3: AWS S3 + CloudFront**

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

**CloudFront Configuration**:
- Origin: S3 bucket
- Default Root Object: index.html
- Error Pages: Redirect 404 to /index.html (200)
- HTTPS Only
- Compression: Enabled

#### **Option 4: Custom Server**

```bash
# Install serve
npm install -g serve

# Serve on port 3000
serve -s dist -l 3000

# Or use nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### **Configure CDN**

**Cloudflare** (Recommended):
1. Add domain to Cloudflare
2. Enable SSL (Full Strict)
3. Enable Auto Minify (JS, CSS, HTML)
4. Enable Brotli compression
5. Set caching rules:
   - `/assets/*` → Cache everything, 1 year TTL
   - `*.js`, `*.css` → Cache everything, 1 year TTL
   - `/` → Cache HTML, 1 hour TTL

---

## ✅ POST-DEPLOYMENT

### **1. Smoke Tests**

Test critical paths:

```bash
# Login flow
# 1. Open https://yourdomain.com
# 2. Enter phone: +254712000001
# 3. Enter PIN: 1234
# 4. Verify dashboard loads

# Submission review
# 1. Navigate to Submissions
# 2. Approve a submission
# 3. Verify points awarded
# 4. Check real-time updates

# Leaderboard
# 1. Open Leaderboard
# 2. Verify rankings display
# 3. Test filters (region, time)
# 4. Check data accuracy
```

### **2. Performance Tests**

```bash
# Lighthouse audit
npm install -g lighthouse

lighthouse https://yourdomain.com \
  --output=html \
  --output-path=./lighthouse-report.html \
  --view

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+

# Load testing
artillery quick --count 100 --num 10 https://yourdomain.com
# Expected: < 500ms p95 response time
```

### **3. Security Scan**

```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://yourdomain.com

# Expected: No high-risk vulnerabilities
```

### **4. Database Health Check**

```sql
-- Check connection count
SELECT COUNT(*) FROM pg_stat_activity;
-- Expected: < 50

-- Check slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
-- Expected: 0 rows

-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres'));
-- Expected: < 1GB initially

-- Check cache hit ratio
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
-- Expected: ratio > 0.99
```

### **5. Monitoring Setup**

**Sentry** (Error Tracking):
```typescript
// In main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event) {
    // Don't send if local development
    if (import.meta.env.DEV) return null;
    return event;
  },
});
```

**LogRocket** (Session Replay):
```typescript
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init(import.meta.env.VITE_LOGROCKET_APP_ID);
}
```

**Uptime Robot** (Uptime Monitoring):
- Add monitor: https://yourdomain.com/health
- Check interval: 5 minutes
- Alert via: Email, SMS, Slack

### **6. Create Admin Users**

```sql
-- Production admin
INSERT INTO users (phone, full_name, role, region, is_active)
VALUES ('+254712000001', 'System Administrator', 'admin', 'Nairobi', true);

-- Set strong PIN (hash with bcrypt)
UPDATE users
SET pin_hash = '$2a$10$...' -- Use bcrypt.hash('strong-pin', 10)
WHERE phone = '+254712000001';

-- Regional managers
INSERT INTO users (phone, full_name, role, region, is_active)
VALUES 
  ('+254712000002', 'Nairobi RSM', 'rsm', 'Nairobi', true),
  ('+254712000003', 'Mombasa RSM', 'rsm', 'Mombasa', true);
```

### **7. Communication Plan**

**Email to SEs**:
```
Subject: Sales Intelligence Network - Now Live! 🚀

Dear Sales Executives,

We're excited to announce that the Sales Intelligence Network is now live!

Login Details:
- URL: https://yourdomain.com
- Phone: Your registered mobile number
- PIN: Check your SMS for temporary PIN

What's New:
✅ Submit field intelligence via mobile
✅ Earn points for every submission
✅ Compete on live leaderboards
✅ Unlock achievements and badges
✅ Win rewards and recognition

Training:
- Live session: Jan 5, 2025 @ 10 AM
- Video tutorials: Available in app
- Support: +254-XXX-XXX-XXX

Let's make 2025 our best year yet!

— Airtel Kenya Sales Team
```

---

## 📊 MONITORING & MAINTENANCE

### **Daily Checks**

```bash
# Morning checklist (automated)
#!/bin/bash

echo "🔍 Daily Health Check - $(date)"

# 1. Check API health
curl -f https://yourdomain.com/health || echo "❌ API Down!"

# 2. Check database
psql $DB_URL -c "SELECT 1" || echo "❌ DB Down!"

# 3. Check submission count
SUBS=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM submissions WHERE created_at > NOW() - INTERVAL '24 hours'")
echo "📤 Submissions (24h): $SUBS"

# 4. Check error rate
ERRORS=$(psql $DB_URL -t -c "SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%ERROR%' AND created_at > NOW() - INTERVAL '1 hour'")
echo "❌ Errors (1h): $ERRORS"
if [ $ERRORS -gt 10 ]; then
  echo "⚠️  HIGH ERROR RATE!"
fi

# 5. Check disk usage
DISK=$(df -h | grep '/dev/sda1' | awk '{print $5}')
echo "💾 Disk usage: $DISK"

# 6. Check response time
TIME=$(curl -o /dev/null -s -w '%{time_total}\n' https://yourdomain.com)
echo "⚡ Response time: ${TIME}s"
```

### **Weekly Tasks**

- [ ] Review error logs
- [ ] Check slow queries
- [ ] Monitor disk usage
- [ ] Review user feedback
- [ ] Update dependencies
- [ ] Security updates

### **Monthly Tasks**

- [ ] Full database backup
- [ ] Performance audit
- [ ] Security scan
- [ ] Cost review
- [ ] Capacity planning
- [ ] Update documentation

---

## ⏪ ROLLBACK PROCEDURES

### **If Deployment Fails**:

**1. Immediate Rollback**:
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Manual
git checkout previous-release
npm run build
npm run deploy
```

**2. Database Rollback**:
```sql
-- Restore from backup
-- In Supabase Dashboard → Database → Backups
-- Click "Restore" on previous backup
-- Confirm restoration
```

**3. Edge Functions Rollback**:
```bash
# List deployments
supabase functions list

# Deploy previous version
supabase functions deploy server --version=previous
```

### **Communication**:
```
Subject: System Maintenance - Temporary Rollback

Dear Users,

We've temporarily rolled back to the previous version due to technical issues.

Status: System is stable
Impact: No data loss
ETA: Resolution within 2 hours

We'll keep you updated.

— Technical Team
```

---

## 📈 SCALING STRATEGY

### **Current Capacity**

- **Users**: 662 SEs + ~20 admins
- **Submissions**: ~5,000/day
- **Database**: Pro plan (8GB)
- **API**: 100,000 requests/day

### **Scaling Triggers**

**Scale when**:
- DB CPU > 70% for 5+ minutes
- API response time > 500ms p95
- Error rate > 1%
- Active users > 1,000

### **Horizontal Scaling**

**Database**:
```
Upgrade to Team plan:
- 32GB RAM
- Dedicated CPU
- Read replicas
```

**Edge Functions**:
- Auto-scales (Supabase handles)
- Consider AWS Lambda if > 1M requests/day

**Frontend**:
- Already CDN-cached (Cloudflare)
- Add more CDN regions if needed

### **Cost Optimization**

Current costs (estimated):
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Cloudflare Pro: $20/month
- **Total**: ~$65/month

At scale (10,000 SEs):
- Supabase Team: $599/month
- Vercel Enterprise: $150/month
- Cloudflare Business: $200/month
- **Total**: ~$950/month

---

## ✅ DEPLOYMENT CHECKLIST

**Pre-Deploy**:
- [ ] Code frozen 24h before
- [ ] All tests passing
- [ ] Staging tested
- [ ] Backup created
- [ ] Team notified
- [ ] Rollback plan ready

**Deploy**:
- [ ] Database migrated
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] DNS updated
- [ ] SSL verified
- [ ] CDN configured

**Post-Deploy**:
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Performance verified
- [ ] Security scan clean
- [ ] Users notified
- [ ] Documentation updated

---

## 🎉 SUCCESS!

Congratulations! Your application is now live in production! 🚀

**Next Steps**:
1. Monitor closely for first 24 hours
2. Respond to user feedback
3. Plan next sprint
4. Celebrate with team! 🎊

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Author**: Airtel Kenya DevOps Team
