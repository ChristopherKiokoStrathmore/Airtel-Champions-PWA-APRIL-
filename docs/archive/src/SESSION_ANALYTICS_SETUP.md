# 🎯 SESSION ANALYTICS - IMPLEMENTATION COMPLETE

## ✅ What Was Created

### 1. **Database Schema** (Already Done ✅)
- `user_sessions` - Login/logout tracking
- `page_views` - Page navigation tracking  
- `user_actions` - User action tracking
- 7 analytics views for quick queries
- 1 function for user stats

### 2. **Core Analytics Files** (Just Created ✅)

#### `/utils/analytics.ts`
Core tracking functions:
- `trackLogin(userId)` - Track user login
- `trackLogout()` - Track user logout
- `trackPageView(pageName)` - Track page views
- `trackAction(actionType, details)` - Track user actions
- `ANALYTICS_ACTIONS` - Predefined action constants
- `ANALYTICS_PAGES` - Predefined page name constants

#### `/hooks/usePageTracking.ts`
Automatic page tracking hook:
- Automatically tracks page entry
- Automatically tracks page exit
- Automatically calculates time spent
- Usage: `usePageTracking('Dashboard')`

#### Updated `/App.tsx`
- Imports new analytics functions
- Tracks login in 3 places (RPC, CAROLYN, Partial match)
- Tracks logout
- Backward compatible with old session tracker

---

## 🚀 HOW TO USE

### **Automatic Page Tracking** (Add to ANY component)

```typescript
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function DashboardComponent() {
  // ✅ This ONE line tracks everything automatically!
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  return <div>Dashboard content...</div>;
}
```

### **Track User Actions** (Add to buttons/handlers)

```typescript
import { trackAction, ANALYTICS_ACTIONS } from '../utils/analytics';

export function SubmitButton() {
  const handleSubmit = async () => {
    // Submit program
    await submitProgram(data);
    
    // ✅ Track the action
    await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
      program_id: result.id,
      program_title: data.title,
    });
  };
  
  return <button onClick={handleSubmit}>Submit</button>;
}
```

---

## 📍 WHERE TO ADD TRACKING

### **Priority 1: Main Pages** (Add `usePageTracking`)

1. ✅ **App.tsx** - Login/logout already tracked
2. 🔴 **Dashboard** - `/components/role-dashboards.tsx`
3. 🔴 **Explore Feed** - `/components/explore-feed-local.tsx`
4. 🔴 **Programs** - `/components/programs/programs-list.tsx`
5. 🔴 **Leaderboard** - `/components/leaderboard-enhanced-unified.tsx`
6. 🔴 **Profile** - `/components/profile-screen-enhanced.tsx`
7. 🔴 **Settings** - `/components/settings-screen.tsx`
8. 🔴 **Groups** - `/components/groups-list-screen.tsx`
9. 🔴 **Group Chat** - `/components/group-chat.tsx`

### **Priority 2: Key Actions** (Add `trackAction`)

10. 🔴 **Program Submission** - `/components/programs/program-submit-modal.tsx`
11. 🔴 **Shop Verification** - (wherever shop verification happens)
12. 🔴 **Social Interactions** - Like/Comment buttons
13. 🔴 **Calling** - Start/end call actions
14. 🔴 **Profile Updates** - Profile edit saves
15. 🔴 **Director Actions** - Approve/reject submissions

---

## 📊 QUERYING ANALYTICS (HQ Dashboard)

### **Today's Active Users**
```typescript
const { data } = await supabase
  .from('daily_active_users')
  .select('*')
  .eq('date', new Date().toISOString().split('T')[0])
  .single();

console.log('Active users today:', data.active_users);
```

### **Most Popular Pages**
```typescript
const { data } = await supabase
  .from('popular_pages')
  .select('*')
  .limit(10);

console.log('Top pages:', data);
```

### **Top User Actions**
```typescript
const { data } = await supabase
  .from('top_actions')
  .select('*')
  .limit(10);

console.log('Most performed actions:', data);
```

### **User Engagement Scores**
```typescript
const { data } = await supabase
  .from('user_engagement_scores')
  .select('*')
  .order('engagement_score', { ascending: false })
  .limit(20);

console.log('Most engaged users:', data);
```

### **Real-Time Analytics Summary**
```typescript
const { data } = await supabase
  .from('session_analytics_summary')
  .select('*')
  .single();

console.log('Analytics summary:', {
  activeToday: data.active_users_today,
  sessionsToday: data.sessions_today,
  avgDuration: data.avg_session_duration_minutes,
});
```

### **Inactive Users** (Haven't logged in 7+ days)
```typescript
const { data } = await supabase
  .from('inactive_users')
  .select('*')
  .limit(20);

console.log('Inactive SEs:', data);
```

### **Specific User Stats**
```typescript
const { data } = await supabase
  .rpc('get_user_session_stats', { 
    p_user_id: 'USER_UUID_HERE' 
  });

console.log('User stats:', data);
```

---

## 🎨 EXAMPLE: Add Tracking to Dashboard

```typescript
// Before:
export function SEDashboard() {
  return <div>Dashboard content...</div>;
}

// After:
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function SEDashboard() {
  usePageTracking(ANALYTICS_PAGES.DASHBOARD); // ✅ Add this line
  return <div>Dashboard content...</div>;
}
```

---

## 🎨 EXAMPLE: Add Tracking to Submit Button

```typescript
// Before:
const handleSubmit = async () => {
  await submitProgram(data);
  alert('Submitted!');
};

// After:
import { trackAction, ANALYTICS_ACTIONS } from '../utils/analytics';

const handleSubmit = async () => {
  await submitProgram(data);
  
  // ✅ Add this tracking
  await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
    program_id: result.id,
    program_title: data.title,
  });
  
  alert('Submitted!');
};
```

---

## 🔥 PREDEFINED ACTION TYPES

Use these constants for consistency:

```typescript
ANALYTICS_ACTIONS.SUBMIT_PROGRAM
ANALYTICS_ACTIONS.VERIFY_SHOP
ANALYTICS_ACTIONS.CREATE_POST
ANALYTICS_ACTIONS.LIKE_POST
ANALYTICS_ACTIONS.COMMENT_POST
ANALYTICS_ACTIONS.VIEW_LEADERBOARD
ANALYTICS_ACTIONS.VIEW_HALL_OF_FAME
ANALYTICS_ACTIONS.CREATE_GROUP
ANALYTICS_ACTIONS.JOIN_GROUP
ANALYTICS_ACTIONS.SEND_MESSAGE
ANALYTICS_ACTIONS.START_CALL
ANALYTICS_ACTIONS.END_CALL
ANALYTICS_ACTIONS.UPDATE_PROFILE
ANALYTICS_ACTIONS.APPROVE_SUBMISSION
ANALYTICS_ACTIONS.REJECT_SUBMISSION
ANALYTICS_ACTIONS.EXPORT_DATA
// ... and 15 more!
```

See `/utils/analytics.ts` for the full list.

---

## 🔥 PREDEFINED PAGE NAMES

Use these constants for consistency:

```typescript
ANALYTICS_PAGES.DASHBOARD
ANALYTICS_PAGES.EXPLORE
ANALYTICS_PAGES.PROGRAMS
ANALYTICS_PAGES.LEADERBOARD
ANALYTICS_PAGES.HALL_OF_FAME
ANALYTICS_PAGES.PROFILE
ANALYTICS_PAGES.SETTINGS
ANALYTICS_PAGES.GROUPS
ANALYTICS_PAGES.GROUP_CHAT
ANALYTICS_PAGES.SUBMISSIONS
ANALYTICS_PAGES.ANALYTICS
ANALYTICS_PAGES.CALLING
// ... and more!
```

---

## 💡 IMPORTANT NOTES

1. **Silent Failures** - Analytics functions fail silently and never break your app
2. **Offline Support** - If offline, tracking is skipped (app continues working)
3. **Performance** - All tracking is non-blocking and optimized
4. **Privacy** - Only tracks actions, not content (e.g., we track "message sent" but not the message text)
5. **Backward Compatible** - Old session tracker still works alongside new system

---

## 📁 FILES CREATED

```
✅ /utils/analytics.ts                      (Core analytics functions)
✅ /hooks/usePageTracking.ts                (Auto page tracking hook)
✅ /ANALYTICS_IMPLEMENTATION_GUIDE.tsx      (Full usage examples)
✅ /SESSION_ANALYTICS_SETUP.md              (This file)
✅ App.tsx updated                          (Login/logout tracking added)
```

---

## 🎯 NEXT STEPS

1. **Add page tracking** to main components (5 minutes)
   - Copy `usePageTracking(ANALYTICS_PAGES.DASHBOARD)` into each dashboard
   
2. **Add action tracking** to key buttons (10 minutes)
   - Copy `trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM)` into submit handlers
   
3. **Test it works** (5 minutes)
   - Login as a user
   - Navigate to a few pages
   - Submit a program
   - Check Supabase database tables:
     - `user_sessions` should have your login
     - `page_views` should have your page visits
     - `user_actions` should have your actions

4. **Add analytics dashboard** to HQ Command Center (20 minutes)
   - Query the views: `daily_active_users`, `popular_pages`, `top_actions`
   - Display charts and stats

---

## 🚨 TESTING CHECKLIST

After adding tracking, test these scenarios:

- [ ] Login → Check `user_sessions` table has new row
- [ ] Navigate to Dashboard → Check `page_views` table
- [ ] Stay on page 30+ seconds → Check `time_spent_seconds` updates
- [ ] Submit a program → Check `user_actions` table
- [ ] Logout → Check `session_end` is updated
- [ ] Query `daily_active_users` view → Should see today's count
- [ ] Query `popular_pages` view → Should see page rankings
- [ ] Query `user_engagement_scores` → Should see user rankings

---

## 📚 REFERENCE FILES

- **Full Usage Guide**: `/ANALYTICS_IMPLEMENTATION_GUIDE.tsx`
- **Core Functions**: `/utils/analytics.ts`
- **Page Tracking Hook**: `/hooks/usePageTracking.ts`
- **SQL Schema**: (Already in database)

---

## 🎉 SUCCESS!

Your analytics system is now ready to track:
- ✅ Every login/logout
- ✅ Every page view
- ✅ Time spent on each page
- ✅ Every important user action
- ✅ Real-time engagement metrics
- ✅ User activity patterns

**Start adding `usePageTracking` to your components now!** 🚀
