# Updated Evaluator Instructions for Activity-Log Testing

## Test Scenario: Activity-Log Function Fix Verification

### Objective
Verify that the "POST /functions/v1/activity-log 500" error has been resolved after implementing fixes for:
1. Data structure mismatch between client and server
2. Missing `activity_logs` database table

### Testing Steps

#### 1. Navigate to Application
- Open Chrome DevTools and navigate to: `https://airtel-champions-app-web-git-main-christopherkiokos-projects.vercel.app/`
- Open Console and Network tabs

#### 2. Handle Login with Side Selection Modal
**Important**: The app now shows a side-selection modal after phone/PIN entry.

**Steps:**
1. Enter phone: `711111111`
2. Enter PIN: `0000` (or try `1234`)
3. Click "SIGN IN"
4. **Wait for side-selection modal** - choose between "SALES" and "HBB"
5. Click on **"SALES"** side (recommended for testing)
6. Proceed to dashboard

#### 3. Monitor Activity-Log Requests
**In Network Tab:**
- Filter requests by `/activity-log`
- Look for POST requests to `/functions/v1/activity-log`
- Check response status codes:
  - ✅ **200** = Success
  - ❌ **500** = Error (investigate further)

**In Console Tab:**
- Look for `[ActivityTracker]` messages
- Check for any error messages related to activity logging

#### 4. Expected Behavior
**Successful Fix Indicators:**
- POST requests to `/functions/v1/activity-log` return **200 OK**
- Console shows: `[ActivityTracker] ✅ Logged: [action_type]`
- No repeated 500 errors in console/network
- User actions are being tracked (login, page views, etc.)

#### 5. Test Actions to Trigger Activity Logging
After successful login:
1. Navigate between different tabs/sections
2. View programs or announcements
3. Open user profile
4. Perform any user interactions
5. Monitor each action generates an activity-log request

#### 6. Verification Commands
**Manual Test via Console (Optional):**
```javascript
// Test activity-log endpoint directly
fetch('https://xspogpfohjmkykfjadhk.supabase.co/functions/v1/activity-log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sb_publishable_B2hLBFhep0AptrUyzsV01w_jLDh4dVo'
  },
  body: JSON.stringify({
    userId: 'test-user-123',
    userName: 'Test User',
    userRole: 'sales',
    actionType: 'login',
    actionDetails: { test: true },
    sessionId: 'test-session-123',
    deviceInfo: { deviceType: 'desktop' },
    timestamp: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log);
```

### Success Criteria
- ✅ No 500 errors on activity-log requests
- ✅ All activity requests return 200 OK
- ✅ Console shows successful logging messages
- ✅ User can navigate app without activity-related errors
- ✅ Side-selection modal handled properly during login

### Troubleshooting
**If 500 errors persist:**
1. Check Network tab for specific error messages
2. Verify `activity_logs` table exists in Supabase
3. Check function deployment status
4. Review console for JavaScript errors

**If login fails:**
1. Try different PIN combinations (0000, 1234, 1111)
2. Ensure side-selection modal is handled
3. Check if user exists in database tables

### Previous Fixes Applied
1. **Data Structure Mapping**: Updated `activity-log` function to handle both `actionType`→`action` and `actionDetails`→`metadata` field mappings
2. **Database Table**: Created `activity_logs` table with proper schema, indexes, and RLS policies
3. **Function Deployment**: Redeployed updated function to Supabase
