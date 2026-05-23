# 🔧 SCHEMA FIX GUIDE
**Critical Database Errors - Fixed**

---

## 🚨 ERRORS FOUND

### **Error 1**: "Could not find relationship between 'submissions' and 'user_id'"
**Root Cause**: Column is named `se_id`, not `user_id`

### **Error 2**: "More than one relationship found for 'users' and 'submissions'"
**Root Cause**: Two foreign keys: `se_id` and `reviewed_by`

### **Error 3**: "column user_achievements.unlocked_at does not exist"
**Root Cause**: Column might be named `awarded_at` instead

### **Error 4**: "Auth session missing!"
**Root Cause**: Authentication not properly configured

---

## ✅ STEP 1: RUN SQL FIX

```bash
# In Supabase Dashboard > SQL Editor
# Run this file:
/sql/CRITICAL_SCHEMA_FIXES.sql
```

**What it does**:
- Creates views with user_id alias
- Fixes ambiguous relationships
- Adds missing columns
- Creates helper functions
- Updates RLS policies

---

## ✅ STEP 2: FIX ADMIN DASHBOARD QUERIES

### **File**: Find all Supabase queries in your admin dashboard

### **OLD (BROKEN) CODE**:
```typescript
// ❌ BROKEN - Don't use this
const { data: submissions } = await supabase
  .from('submissions')
  .select('*, users(full_name)')  // Ambiguous!
  .eq('user_id', userId);  // Column doesn't exist!
```

### **NEW (FIXED) CODE - Option 1: Use View**:
```typescript
// ✅ FIXED - Use pre-joined view
const { data: submissions } = await supabase
  .from('submissions_full')
  .select('*')
  .eq('se_id', userId);

// submissions now includes:
// - All submission fields
// - se_name, se_phone, se_email, se_region
// - mission_type_name, mission_category
// - reviewer_name (if reviewed)
```

### **NEW (FIXED) CODE - Option 2: Helper Function**:
```typescript
// ✅ FIXED - Use helper function
const { data: submissions } = await supabase
  .rpc('get_user_submissions', { 
    p_user_id: userId 
  });
```

### **NEW (FIXED) CODE - Option 3: Explicit Relationship**:
```typescript
// ✅ FIXED - Specify which relationship
const { data: submissions } = await supabase
  .from('submissions')
  .select(`
    *,
    se:users!submissions_se_id_fkey(full_name, phone, email),
    reviewer:users!submissions_reviewed_by_fkey(full_name),
    mission_type:mission_types(name, category, icon)
  `)
  .eq('se_id', userId);
```

---

## ✅ STEP 3: FIX SPECIFIC QUERIES

### **Get All SEs (Admin Dashboard)**

**OLD (BROKEN)**:
```typescript
const { data: ses } = await supabase
  .from('users')
  .select('*, submissions(count)')  // ❌ Ambiguous!
  .eq('role', 'se');
```

**NEW (FIXED)**:
```typescript
const { data: ses } = await supabase
  .rpc('get_all_ses_with_stats');

// Returns:
// {
//   id, full_name, phone, email, region, team,
//   total_submissions, approved_submissions,
//   pending_submissions, total_points
// }
```

---

### **Get My Submissions (Mobile App)**

**OLD (BROKEN)**:
```typescript
const { data } = await supabase
  .from('submissions')
  .select('*')
  .eq('user_id', userId);  // ❌ Column doesn't exist!
```

**NEW (FIXED)**:
```typescript
const { data } = await supabase
  .from('submissions')
  .select('*')
  .eq('se_id', userId);  // ✅ Correct column name

// Or use helper function:
const { data } = await supabase
  .rpc('get_user_submissions', { p_user_id: userId });
```

---

### **Get Leaderboard**

**OLD (BROKEN)**:
```typescript
const { data } = await supabase
  .from('leaderboard')
  .select('*')
  .limit(20);  // ❌ Might use old materialized view
```

**NEW (FIXED)**:
```typescript
// First, refresh the materialized view
await supabase.rpc('refresh_leaderboard');

// Then query it
const { data } = await supabase
  .from('leaderboard')
  .select('*')
  .order('rank', { ascending: true })
  .limit(20);
```

---

### **Get Analytics (Admin Dashboard)**

**OLD (BROKEN)**:
```typescript
const { data: submissions } = await supabase
  .from('submissions')
  .select('status, points_awarded, users(full_name)');  // ❌ Ambiguous!
```

**NEW (FIXED)**:
```typescript
// Use helper function for summary
const { data: analytics } = await supabase
  .rpc('get_analytics_summary')
  .single();

// Returns:
// {
//   total_submissions,
//   pending_submissions,
//   approved_submissions,
//   rejected_submissions,
//   total_points_awarded,
//   total_active_ses,
//   avg_approval_rate
// }

// For detailed analytics, use view:
const { data: submissions } = await supabase
  .from('submissions_full')
  .select('*');
```

---

### **Get Map Data (All Submissions with Location)**

**OLD (BROKEN)**:
```typescript
const { data } = await supabase
  .from('submissions')
  .select('location_lat, location_lng, users(full_name)')  // ❌ Ambiguous!
  .eq('status', 'approved');
```

**NEW (FIXED)**:
```typescript
const { data } = await supabase
  .from('submissions_full')
  .select('id, location_lat, location_lng, se_name, mission_type_name, status')
  .eq('status', 'approved');
```

---

### **Get User Achievements**

**OLD (BROKEN)**:
```typescript
const { data } = await supabase
  .from('user_achievements')
  .select('*, achievements(*)')
  .eq('user_id', userId);  // Column name might be wrong
```

**NEW (FIXED)**:
```typescript
const { data } = await supabase
  .from('user_achievements')
  .select(`
    id,
    unlocked_at,
    achievement:achievements(
      id,
      name,
      description,
      icon,
      required_points
    )
  `)
  .eq('user_id', userId)
  .order('unlocked_at', { ascending: false });
```

---

## ✅ STEP 4: FIX AUTHENTICATION

### **Error**: "Auth session missing!"

**Root Cause**: Supabase client not initialized with auth token

### **Fix in Admin Dashboard**:

```typescript
// Make sure you create Supabase client with auth
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// After login, set the session:
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Session is now active for all queries
```

### **Fix in Mobile App**:

```dart
// Initialize Supabase
await Supabase.initialize(
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_ANON_KEY',
);

// Get instance
final supabase = Supabase.instance.client;

// After login, queries automatically include auth
final response = await supabase.auth.signInWithPassword(
  email: 'user@example.com',
  password: 'password',
);

// Now authenticated queries work
final data = await supabase
  .from('submissions')
  .select()
  .eq('se_id', response.user!.id);
```

---

## ✅ STEP 5: UPDATE MOBILE API (Backend)

### **File**: `/supabase/functions/server/mobile-api.tsx`

Find all occurrences of `user_id` and replace with `se_id`:

```typescript
// OLD (BROKEN)
export async function getMySubmissions(userId: string) {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId);  // ❌ Wrong column
  
  return { success: true, data };
}

// NEW (FIXED)
export async function getMySubmissions(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_submissions', { p_user_id: userId });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
```

---

## ✅ STEP 6: VERIFICATION

After running all fixes, test these queries:

### **Test 1: Get My Submissions**
```sql
-- Should return results without error
SELECT * FROM get_user_submissions('YOUR_USER_ID');
```

### **Test 2: Get All SEs**
```sql
-- Should return all SEs with stats
SELECT * FROM get_all_ses_with_stats();
```

### **Test 3: Get Analytics**
```sql
-- Should return summary
SELECT * FROM get_analytics_summary();
```

### **Test 4: Query Submissions Full View**
```sql
-- Should return submissions with all joined data
SELECT * FROM submissions_full LIMIT 10;
```

---

## 📝 QUICK REFERENCE CHEAT SHEET

| Old (Broken) | New (Fixed) | Reason |
|--------------|-------------|--------|
| `.eq('user_id', ...)` | `.eq('se_id', ...)` | Column name is `se_id` |
| `.select('*, users(...)')` | `.select('*, users!submissions_se_id_fkey(...)')` | Ambiguous relationship |
| `.from('submissions')` | `.from('submissions_full')` | Use pre-joined view |
| Manual JOIN queries | `.rpc('get_user_submissions', ...)` | Use helper function |
| `unlocked_at` doesn't exist | Run schema fix SQL | Added missing column |

---

## 🔍 FINDING ALL BROKEN QUERIES

### **Search in Admin Dashboard**:
```bash
# Find all Supabase queries
grep -r "from('submissions')" src/
grep -r "eq('user_id'" src/
grep -r "users(full_name)" src/

# Replace all instances
find src/ -type f -name "*.tsx" -exec sed -i "s/eq('user_id'/eq('se_id'/g" {} +
```

### **Search in Mobile API**:
```bash
# Find in server functions
grep -r "user_id" supabase/functions/
grep -r "from('submissions')" supabase/functions/

# Check for ambiguous relationships
grep -r "users(.*)" supabase/functions/
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Run `/sql/CRITICAL_SCHEMA_FIXES.sql` in Supabase Dashboard
- [ ] Verify all views created: `submissions_full`, `submissions_with_se`, etc.
- [ ] Verify helper functions: `get_user_submissions`, `get_all_ses_with_stats`
- [ ] Update all admin dashboard queries (se_id, explicit relationships)
- [ ] Update all mobile API queries
- [ ] Update mobile app queries (if applicable)
- [ ] Test authentication flow
- [ ] Test submissions query
- [ ] Test leaderboard query
- [ ] Test analytics query
- [ ] Test achievements query
- [ ] Refresh materialized views
- [ ] Monitor for errors in production logs

---

## 🆘 IF ERRORS PERSIST

### **Error: "relationship not found"**
```sql
-- Check what foreign keys exist:
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'submissions'
  AND tc.constraint_type = 'FOREIGN KEY';
```

### **Error: "column does not exist"**
```sql
-- Check what columns actually exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'submissions';
```

### **Error: "function does not exist"**
```sql
-- Check what functions exist:
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION'
  AND routine_schema = 'public';
```

---

**All fixes documented! Run the SQL file and update your queries according to this guide.**
