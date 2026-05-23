# Runtime Error Verification Checklist

## ✅ COMPLETED FIXES

### 1. Manifest.json Location & Paths
- [x] Moved manifest.json from `src/public/` to `public/`
- [x] Fixed start_url and scope to use root-relative paths
- [x] Added proper PWA icons and shortcuts

### 2. Service Worker 404 Error
- [x] Created `public/sw.js` with basic caching
- [x] Added service worker registration in `src/main.tsx`
- [x] Added error handling for SW registration failures

## 🔧 IN PROGRESS

### 3. Supabase Edge Functions CORS/500 Errors
- [x] Verified CORS headers in `_shared/cors.ts` are correct
- [x] Verified `activity-log` function has proper CORS handling
- [x] Verified `towns` function has proper CORS handling
- [ ] Deploy functions to correct Supabase project (`xspogpfohjmkykfjadhk`)
- [ ] Test functions after deployment

### 4. Auto-Allocation "No Installer Available"
- [x] Created SQL script to check available installers
- [ ] Run SQL to verify installer availability
- [ ] Check `allocate_installer` RPC function logic
- [ ] Fix allocation logic if needed

## 🟡 PENDING

### 5. WebGL Context Lost Error
- [x] Created WebGL recovery script
- [ ] Integrate WebGL error handling into Three.js usage
- [ ] Test WebGL context recovery

## 🧪 VERIFICATION STEPS

### Step 1: Test Manifest & Service Worker
1. Open browser DevTools → Application tab
2. Check Manifest loads without errors
3. Check Service Worker is registered and active
4. Verify no 404 errors for sw.js

### Step 2: Test Edge Functions
1. Run: `npx supabase functions deploy --project-ref xspogpfohjmkykfjadhk`
2. Test: `curl -X POST https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/towns`
3. Test: `curl -X POST https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/activity-log`
4. Check for CORS headers in responses

### Step 3: Test Auto-Allocation
1. Run SQL: `check_installers.sql` in Supabase SQL Editor
2. Verify installers exist with `available = true`
3. Submit test lead and check console logs
4. Verify allocation response in browser console

### Step 4: Test WebGL
1. Open app and check for WebGL context errors
2. Force context loss (if possible) to test recovery
3. Monitor console for WebGL error messages

## 📊 EXPECTED RESULTS

### After Fix 1 & 2:
- No manifest warnings in console
- Service Worker registers successfully
- No 404 errors for sw.js

### After Fix 3:
- Edge Functions return 200 OK
- CORS headers present in responses
- No 500 errors from activity-log/towns

### After Fix 4:
- Auto-allocation returns `{allocated: true, installer_name: "..."}`
- Jobs table gets installer_id assigned
- Status changes from 'pending' to 'allocated'

### After Fix 5:
- No WebGL context lost errors
- Smooth 3D rendering recovery

## 🚀 DEPLOYMENT COMMANDS

```bash
# Install PWA dependency
npm install

# Deploy Edge Functions
npx supabase functions deploy --project-ref xspogpfohjmkykfjadhk

# Build and test locally
npm run dev
```

## 📝 NOTES

- All fixes are backwards compatible
- Service worker is simple and can be enhanced later
- WebGL recovery is defensive - won't break existing functionality
- Edge Functions need proper deployment to take effect
