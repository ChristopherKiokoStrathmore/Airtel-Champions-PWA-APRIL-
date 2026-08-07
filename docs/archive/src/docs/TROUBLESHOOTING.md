# 🔧 TROUBLESHOOTING GUIDE

**Sales Intelligence Network - Airtel Kenya**  
**Version**: 1.0.0  
**Last Updated**: December 28, 2024

---

## 📋 TABLE OF CONTENTS

1. [Common Issues](#common-issues)
2. [Database Issues](#database-issues)
3. [Authentication Issues](#authentication-issues)
4. [API Issues](#api-issues)
5. [Frontend Issues](#frontend-issues)
6. [Real-time Issues](#real-time-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)
9. [Mobile App Issues](#mobile-app-issues)
10. [Emergency Procedures](#emergency-procedures)

---

## 🚨 COMMON ISSUES

### **1. "Cannot connect to Supabase" Error**

**Symptoms**:
- Dashboard shows "Setup Notice"
- API calls fail with network errors
- Console shows `ERR_CONNECTION_REFUSED`

**Solutions**:

✅ **Check Environment Variables**:
```bash
# Verify .env file exists
cat .env

# Should contain:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Restart dev server after changing .env
npm run dev
```

✅ **Verify Supabase Project Status**:
- Go to https://supabase.com/dashboard
- Check project status (should be "Active")
- Verify no service disruptions

✅ **Test Connection Manually**:
```typescript
// In browser console
import { supabase } from './lib/supabase';
const { data, error } = await supabase.from('users').select('count');
console.log({ data, error });
// Should return data without error
```

---

### **2. "Module not found" Errors**

**Symptoms**:
```
Error: Cannot find module 'lucide-react'
Error: Cannot resolve './components/...'
```

**Solutions**:

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# If still failing, clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Verify all dependencies installed
npm ls
```

---

### **3. Build Fails with TypeScript Errors**

**Symptoms**:
```
error TS2305: Module '"@supabase/supabase-js"' has no exported member 'createClient'
```

**Solutions**:

```bash
# Update TypeScript
npm install -D typescript@latest

# Regenerate types
npm run type-check

# If Supabase types missing:
npx supabase gen types typescript --project-id your-project > lib/database.types.ts
```

---

## 💾 DATABASE ISSUES

### **1. RLS Policy Blocking Access**

**Symptoms**:
- Queries return empty results
- Console shows "new row violates row-level security policy"
- Admins can't see submissions

**Diagnosis**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'submissions';

-- Should show: rowsecurity = true
```

**Solutions**:

✅ **Verify User Role**:
```sql
-- Check user role
SELECT id, phone, role FROM users WHERE phone = '+254712345678';

-- Should return role: 'admin', 'zsm', 'asm', or 'se'
```

✅ **Test RLS Policy**:
```sql
-- Temporarily disable RLS (DEVELOPMENT ONLY!)
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT COUNT(*) FROM submissions;

-- Re-enable RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
```

✅ **Recreate Policies**:
```sql
-- Drop and recreate admin policy
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;

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
```

---

### **2. Slow Query Performance**

**Symptoms**:
- Leaderboard takes >5 seconds to load
- Dashboard stats timeout
- Phone lookup slow

**Diagnosis**:
```sql
-- Check for missing indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Should show 60+ indexes
```

**Solutions**:

✅ **Create Missing Indexes**:
```sql
-- Phone lookup index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Submission status index
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Points index for leaderboard
CREATE INDEX IF NOT EXISTS idx_submissions_points ON submissions(points_awarded);
```

✅ **Analyze Query**:
```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT u.full_name, SUM(s.points_awarded) as total_points
FROM users u
JOIN submissions s ON s.user_id = u.id
WHERE s.status = 'approved'
GROUP BY u.id, u.full_name
ORDER BY total_points DESC
LIMIT 10;

-- Look for "Seq Scan" (bad) vs "Index Scan" (good)
```

✅ **Refresh Materialized Views**:
```sql
-- Refresh leaderboard view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard;

-- Refresh analytics views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_analytics;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_analytics;
```

---

### **3. Triggers Not Firing**

**Symptoms**:
- Achievements not auto-awarded
- Submission count not updating
- Audit logs empty

**Diagnosis**:
```sql
-- Check triggers exist
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%achievement%';

-- tgenabled should be 'O' (origin)
```

**Solutions**:

✅ **Recreate Trigger**:
```sql
-- Drop and recreate
DROP TRIGGER IF EXISTS tr_award_achievements ON submissions;

CREATE TRIGGER tr_award_achievements
  AFTER INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION award_achievements();
```

✅ **Test Trigger Manually**:
```sql
-- Call function directly
SELECT award_achievements();

-- Insert test submission
INSERT INTO submissions (user_id, mission_type_id, status, points_awarded)
VALUES ('test-user-uuid', 'mission-uuid', 'approved', 100);

-- Check achievements awarded
SELECT * FROM user_achievements WHERE user_id = 'test-user-uuid';
```

---

## 🔐 AUTHENTICATION ISSUES

### **1. Login Fails with "Invalid Credentials"**

**Symptoms**:
- Correct phone/PIN shows error
- OTP verification fails
- "User not found" message

**Solutions**:

✅ **Verify User Exists**:
```sql
SELECT id, phone, role, is_active 
FROM users 
WHERE phone = '+254712345678';

-- Check:
-- - User exists
-- - is_active = true
-- - role is correct
```

✅ **Check PIN Hash**:
```sql
-- PIN should be hashed
SELECT pin_hash FROM users WHERE phone = '+254712345678';

-- Should return: $2a$10$... (bcrypt hash)
-- NOT raw PIN: '1234'
```

✅ **Reset PIN**:
```sql
-- Hash new PIN (use bcrypt library)
-- Example: bcrypt.hash('1234', 10) = '$2a$10$...'

UPDATE users 
SET pin_hash = '$2a$10$...' 
WHERE phone = '+254712345678';
```

---

### **2. OTP Not Received**

**Symptoms**:
- OTP request succeeds but SMS not received
- Delivery status shows "failed"

**Solutions**:

✅ **Check OTP Records**:
```sql
-- Find recent OTP
SELECT * FROM otp_codes 
WHERE phone = '+254712345678' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check:
-- - code exists
-- - expires_at is in future
-- - used = false
-- - delivery_status
```

✅ **Verify SMS Service**:
```bash
# Check Africa's Talking balance
curl -H "apiKey: YOUR_API_KEY" \
  https://api.africastalking.com/version1/user?username=YOUR_USERNAME

# Response should show positive balance
```

✅ **Resend OTP**:
```sql
-- Mark old OTP as used
UPDATE otp_codes 
SET used = true 
WHERE phone = '+254712345678' 
AND used = false;

-- Request new OTP via app
```

---

### **3. Token Expired**

**Symptoms**:
- "JWT expired" error
- Logged out after 1 hour
- API calls return 401 Unauthorized

**Solutions**:

✅ **Refresh Token**:
```typescript
import { supabase } from './lib/supabase';

// Automatic refresh (recommended)
const { data: { session }, error } = await supabase.auth.getSession();

if (session) {
  // Token is valid
} else {
  // Need to re-login
  redirectToLogin();
}
```

✅ **Handle Token Refresh Globally**:
```typescript
// In App.tsx or auth provider
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    redirectToLogin();
  }
});
```

---

## 🌐 API ISSUES

### **1. Edge Function Returns 500 Error**

**Symptoms**:
- API calls fail with "Internal Server Error"
- Edge function logs show errors
- Specific endpoints broken

**Diagnosis**:
```bash
# View edge function logs
# In Supabase Dashboard → Edge Functions → server → Logs

# Or via CLI
supabase functions logs server
```

**Solutions**:

✅ **Check Function Code**:
```typescript
// Add error logging
try {
  // Your code
} catch (error) {
  console.error('Detailed error:', error);
  return c.json({ error: error.message, stack: error.stack }, 500);
}
```

✅ **Verify Dependencies**:
```typescript
// In edge function
import { Hono } from "npm:hono@latest";
import { z } from "npm:zod@3";

// Make sure versions are specified
```

✅ **Test Locally**:
```bash
# Run edge function locally
supabase functions serve server

# Test with curl
curl -X POST http://localhost:54321/functions/v1/make-server-28f2f653/submissions/approve \
  -H "Authorization: Bearer token" \
  -d '{"submissionId": "uuid", "pointsAwarded": 100}'
```

---

### **2. Rate Limit Exceeded**

**Symptoms**:
- "429 Too Many Requests" error
- API calls blocked after batch operations
- Rate limit header shows 0 remaining

**Solutions**:

✅ **Check Current Limits**:
```typescript
// In browser console
// Check rate limit headers
fetch('https://your-project.supabase.co/functions/v1/make-server-28f2f653/health', {
  headers: { 'Authorization': 'Bearer token' }
}).then(r => {
  console.log('Remaining:', r.headers.get('X-RateLimit-Remaining'));
  console.log('Reset:', new Date(r.headers.get('X-RateLimit-Reset') * 1000));
});
```

✅ **Clear Rate Limit (Admin Only)**:
```typescript
// In edge function code, temporarily increase limit
const allowed = await checkRateLimit(rateLimitKey, 1000, 60); // Increase to 1000

// Or clear KV store
await kv.del(`ratelimit:${rateLimitKey}`);
```

✅ **Implement Retry Logic**:
```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitTime = (resetTime * 1000) - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  throw new Error('Rate limit exceeded after retries');
}
```

---

### **3. CORS Errors**

**Symptoms**:
- "CORS policy: No 'Access-Control-Allow-Origin' header"
- API calls fail from browser
- Works in Postman but not web app

**Solutions**:

✅ **Verify CORS Configuration**:
```typescript
// In edge function index.tsx
app.use(
  "/*",
  cors({
    origin: "*", // For development
    // origin: "https://yourdomain.com", // For production
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
```

✅ **Handle Preflight Requests**:
```typescript
// Edge function should auto-handle OPTIONS
// Verify OPTIONS returns 200:
curl -X OPTIONS https://your-project.supabase.co/functions/v1/make-server-28f2f653/health \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization"

// Should return 200 with CORS headers
```

---

## 🎨 FRONTEND ISSUES

### **1. Components Not Rendering**

**Symptoms**:
- Blank screen
- "Cannot read property of undefined"
- React error boundaries triggered

**Solutions**:

✅ **Check Console for Errors**:
```javascript
// Browser console (F12)
// Look for:
// - Import errors
// - Type errors
// - Null reference errors
```

✅ **Verify Data Loading**:
```typescript
// Add loading states
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  loadData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <div>No data</div>;

return <YourComponent data={data} />;
```

✅ **Clear Browser Cache**:
```bash
# Hard refresh
# Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Or clear storage
# Browser → DevTools → Application → Clear Storage → Clear site data
```

---

### **2. Styles Not Applied**

**Symptoms**:
- Tailwind classes not working
- Components unstyled
- CSS not loading

**Solutions**:

✅ **Verify Tailwind Setup**:
```typescript
// Check tailwind.config.js exists
// Check styles/globals.css imported in App.tsx
import './styles/globals.css';
```

✅ **Rebuild CSS**:
```bash
# Clear build cache
rm -rf .vite dist

# Restart dev server
npm run dev
```

✅ **Check Class Names**:
```tsx
// Correct
<div className="bg-red-500 text-white">

// Incorrect (class instead of className)
<div class="bg-red-500 text-white">
```

---

### **3. Images Not Loading**

**Symptoms**:
- Broken image icons
- 404 errors for images
- Photos from submissions not displaying

**Solutions**:

✅ **Check Image URLs**:
```typescript
// Verify URL is valid
console.log('Image URL:', photoUrl);

// Test in browser
fetch(photoUrl)
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e));
```

✅ **Check CORS on Storage**:
```sql
-- In Supabase Dashboard → Storage → Policies
-- Ensure bucket has read policy:

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions');
```

✅ **Use ImageWithFallback Component**:
```tsx
import { ImageWithFallback } from './components/figma/ImageWithFallback';

<ImageWithFallback 
  src={photoUrl} 
  alt="Submission photo"
  fallback="/placeholder.png"
/>
```

---

## ⚡ REAL-TIME ISSUES

### **1. Subscriptions Not Working**

**Symptoms**:
- New submissions don't appear automatically
- Leaderboard doesn't update
- No live notifications

**Diagnosis**:
```typescript
// Test subscription
const channel = supabase.channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'submissions'
  }, payload => {
    console.log('Change received:', payload);
  })
  .subscribe(status => {
    console.log('Subscription status:', status);
  });

// Should log: Subscription status: SUBSCRIBED
```

**Solutions**:

✅ **Enable Realtime on Tables**:
```sql
-- In Supabase Dashboard → Database → Replication
-- Enable realtime for:
-- - submissions
-- - user_achievements
-- - announcements
-- - daily_challenges
```

✅ **Check Realtime Settings**:
```bash
# In Supabase Dashboard → Settings → API
# Ensure "Realtime" is enabled
```

✅ **Verify Subscription Cleanup**:
```typescript
useEffect(() => {
  const channel = subscribeToSubmissions((submission) => {
    // Handle update
  });

  // IMPORTANT: Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, []); // Empty deps array
```

---

### **2. Presence Not Tracking**

**Symptoms**:
- Online users count always 0
- Can't see who's online
- Presence state empty

**Solutions**:

✅ **Check Presence Configuration**:
```typescript
const channel = supabase.channel('online-users', {
  config: {
    presence: {
      key: userId, // Make sure userId is defined
    },
  },
});

// Track presence
await channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user_id: userId,
      user_name: userName,
      online_at: new Date().toISOString(),
    });
  }
});
```

✅ **Get Presence State**:
```typescript
// After subscription
const state = channel.presenceState();
console.log('Online users:', Object.keys(state).length);
console.log('Users:', state);
```

---

## 📊 PERFORMANCE ISSUES

### **1. Dashboard Loads Slowly**

**Symptoms**:
- Initial page load >3 seconds
- Stats take long to appear
- Sluggish interactions

**Solutions**:

✅ **Optimize Queries**:
```typescript
// Bad: Multiple sequential queries
const users = await getUsers();
const submissions = await getSubmissions();
const achievements = await getAchievements();

// Good: Parallel queries
const [users, submissions, achievements] = await Promise.all([
  getUsers(),
  getSubmissions(),
  getAchievements(),
]);
```

✅ **Implement Caching**:
```typescript
// Cache leaderboard for 5 minutes
const cacheKey = 'leaderboard-weekly';
const cached = localStorage.getItem(cacheKey);
const cacheTime = localStorage.getItem(cacheKey + '-time');

if (cached && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
  return JSON.parse(cached);
}

const data = await fetchLeaderboard();
localStorage.setItem(cacheKey, JSON.stringify(data));
localStorage.setItem(cacheKey + '-time', Date.now().toString());
```

✅ **Use useMemo for Expensive Calculations**:
```typescript
const stats = useMemo(() => {
  return calculateComplexStats(submissions);
}, [submissions]); // Only recalculate when submissions change
```

---

### **2. Memory Leaks**

**Symptoms**:
- Browser tab crashes after 30+ minutes
- Memory usage grows continuously
- Page becomes unresponsive

**Solutions**:

✅ **Clean Up Subscriptions**:
```typescript
useEffect(() => {
  const channel = subscribeToData();
  return () => {
    // CRITICAL: Always cleanup
    supabase.removeChannel(channel);
  };
}, []);
```

✅ **Cancel Pending Requests**:
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  fetch(url, { signal: abortController.signal })
    .then(handleData)
    .catch(err => {
      if (err.name === 'AbortError') return;
      handleError(err);
    });
  
  return () => abortController.abort();
}, []);
```

✅ **Profile Memory**:
```bash
# Chrome DevTools → Performance → Memory
# Take heap snapshot
# Look for detached DOM nodes
# Look for growing arrays
```

---

## 🚀 DEPLOYMENT ISSUES

### **1. Production Build Fails**

**Symptoms**:
- `npm run build` errors
- Vite build crashes
- TypeScript compilation errors

**Solutions**:

```bash
# Clear everything
rm -rf node_modules dist .vite package-lock.json

# Reinstall
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Build with verbose output
npm run build -- --debug
```

---

### **2. Environment Variables Not Working in Production**

**Symptoms**:
- App works locally but not in production
- "Supabase URL undefined" error
- API calls fail

**Solutions**:

✅ **Verify Environment Variables**:
```bash
# In deployment platform (Vercel/Netlify)
# Add all VITE_ prefixed variables:

VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

✅ **Check Build Logs**:
```bash
# Look for warnings like:
# "Environment variable VITE_XXX is not defined"
```

✅ **Test Production Build Locally**:
```bash
npm run build
npm run preview

# Should work same as dev
```

---

## 📱 MOBILE APP ISSUES

### **1. Camera Not Working (Future Flutter App)**

**Solutions will be added when Flutter app is developed**

---

## 🆘 EMERGENCY PROCEDURES

### **1. System Down - Complete Outage**

**Immediate Actions**:

1. **Check Supabase Status**:
   - Visit https://status.supabase.com
   - Check if there's an ongoing incident

2. **Enable Maintenance Mode**:
   ```typescript
   // Add to App.tsx
   if (isMaintenanceMode()) {
     return <MaintenanceScreen />;
   }
   ```

3. **Notify Users**:
   - Post on internal Slack
   - Send SMS to admins
   - Update status page

4. **Rollback if Needed**:
   ```bash
   # Git rollback
   git revert HEAD
   git push origin main
   
   # Or restore from backup
   # Supabase Dashboard → Database → Backups → Restore
   ```

---

### **2. Data Corruption Detected**

**Immediate Actions**:

1. **Stop All Writes**:
   ```sql
   -- Revoke write permissions (temporary)
   REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
   ```

2. **Assess Damage**:
   ```sql
   -- Check data integrity
   SELECT COUNT(*) FROM submissions WHERE points_awarded < 0;
   SELECT COUNT(*) FROM users WHERE phone IS NULL;
   ```

3. **Restore from Backup**:
   ```bash
   # Supabase Dashboard → Database → Backups
   # Select recent backup before corruption
   # Restore to point-in-time
   ```

4. **Re-grant Permissions**:
   ```sql
   GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
   ```

---

### **3. Security Breach Suspected**

**Immediate Actions**:

1. **Rotate All Keys**:
   ```bash
   # Supabase Dashboard → Settings → API
   # Click "Reset API Keys"
   # Update .env files everywhere
   ```

2. **Review Audit Logs**:
   ```sql
   SELECT * FROM audit_logs 
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

3. **Disable Compromised Accounts**:
   ```sql
   UPDATE users 
   SET is_active = false 
   WHERE id IN (SELECT user_id FROM suspicious_activity);
   ```

4. **Notify Security Team**:
   - Email: security@airtel.co.ke
   - Document incident
   - Preserve logs

---

## 📞 GETTING HELP

### **Self-Service**:
1. Check this troubleshooting guide
2. Review error logs in Supabase Dashboard
3. Check browser console (F12)
4. Search GitHub issues

### **Internal Support**:
- **Slack**: #sales-intel-network-support
- **Email**: dev-team@airtel.co.ke
- **Emergency**: +254 712 000 999

### **External Support**:
- **Supabase Discord**: https://discord.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: (your repo)

---

## 📝 LOGGING CHECKLIST

When reporting an issue, include:

- [ ] Error message (full text)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Browser console logs
- [ ] Supabase function logs (if API issue)
- [ ] Database query (if data issue)
- [ ] Environment (dev/staging/production)
- [ ] Timestamp of issue
- [ ] User ID (if user-specific)
- [ ] Screenshots (if UI issue)

---

**Last Updated**: December 28, 2024  
**Version**: 1.0.0  
**Maintained by**: Airtel Kenya Development Team
