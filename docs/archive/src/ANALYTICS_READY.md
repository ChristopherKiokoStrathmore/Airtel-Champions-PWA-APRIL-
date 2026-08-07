# ✅ SESSION ANALYTICS - READY TO USE!

## 🎉 What's Working Now

### ✅ Database (Complete)
- `user_sessions` table created ✅
- `page_views` table created ✅  
- `user_actions` table created ✅
- 7 analytics views ready ✅
- All indexes and security configured ✅

### ✅ Code Files (Complete)
- `/utils/analytics.ts` - Core tracking functions ✅
- `/hooks/usePageTracking.ts` - Auto page tracking ✅
- `/App.tsx` - Login/logout tracking added ✅

### ✅ Components Updated (Automatic Tracking)
- `ZoneCommanderDashboard` - Dashboard tracking ✅
- `ZoneBusinessLeadDashboard` - Dashboard tracking ✅
- `HQDashboard` - Dashboard tracking ✅
- `DirectorDashboard` - Dashboard tracking ✅
- `ExploreFeed` - Explore page tracking ✅

---

## 📊 What's Being Tracked NOW

### Already Tracking:
1. **Every login** → Stored in `user_sessions` table
2. **Every logout** → Updates `session_end` column
3. **Dashboard views** → Tracked for all 4 role dashboards
4. **Explore Feed views** → Tracked automatically
5. **Time spent on pages** → Calculated on page exit

### Example Data You Can Query:

```sql
-- Active users today
SELECT * FROM daily_active_users 
WHERE date = CURRENT_DATE;

-- Most popular pages
SELECT * FROM popular_pages 
LIMIT 10;

-- User engagement scores
SELECT * FROM user_engagement_scores 
ORDER BY engagement_score DESC 
LIMIT 20;

-- Session summary
SELECT * FROM session_analytics_summary;
```

---

## 🚀 Test It NOW

1. **Login to Airtel Champions app**
2. **Navigate to Dashboard**
3. **Navigate to Explore Feed**
4. **Stay on each page for 10-20 seconds**
5. **Check Supabase Database:**

```sql
-- You should see your session
SELECT * FROM user_sessions 
ORDER BY session_start DESC 
LIMIT 5;

-- You should see page views
SELECT * FROM page_views 
ORDER BY viewed_at DESC 
LIMIT 10;

-- You should see time spent
SELECT page_name, time_spent_seconds 
FROM page_views 
WHERE time_spent_seconds > 0
ORDER BY viewed_at DESC;
```

---

## 📈 Add More Tracking (5 minutes each)

### Programs Page
```typescript
// In /components/programs/programs-list.tsx
import { usePageTracking } from '../../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../../utils/analytics';

export function ProgramsList() {
  usePageTracking(ANALYTICS_PAGES.PROGRAMS); // Add this line
  // ... rest of component
}
```

### Leaderboard Page
```typescript
// In /components/leaderboard-enhanced-unified.tsx
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function LeaderboardEnhancedUnified() {
  usePageTracking(ANALYTICS_PAGES.LEADERBOARD); // Add this line
  // ... rest of component
}
```

### Profile Page
```typescript
// In /components/profile-screen-enhanced.tsx
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function ProfileScreenEnhanced() {
  usePageTracking(ANALYTICS_PAGES.PROFILE); // Add this line
  // ... rest of component
}
```

### Settings Page
```typescript
// In /components/settings-screen.tsx
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function SettingsScreen() {
  usePageTracking(ANALYTICS_PAGES.SETTINGS); // Add this line
  // ... rest of component
}
```

---

## 🎯 Track User Actions (Example)

### Program Submission
```typescript
// In submit handler
import { trackAction, ANALYTICS_ACTIONS } from '../utils/analytics';

const handleSubmit = async () => {
  await submitProgram(data);
  
  // ✅ Track the action
  await trackAction(ANALYTICS_ACTIONS.SUBMIT_PROGRAM, {
    program_id: result.id,
    program_title: data.title,
  });
};
```

### Like Post
```typescript
// In like button handler
const handleLike = async (postId: string) => {
  await likePost(postId);
  
  // ✅ Track the action
  await trackAction(ANALYTICS_ACTIONS.LIKE_POST, {
    post_id: postId,
  });
};
```

---

## 📊 HQ Dashboard Queries

Add these to your HQ Command Center dashboard:

```typescript
// Today's metrics
const { data: todayStats } = await supabase
  .from('session_analytics_summary')
  .select('*')
  .single();

console.log('Active users today:', todayStats.active_users_today);
console.log('Sessions today:', todayStats.sessions_today);
console.log('Avg session duration:', todayStats.avg_session_duration_minutes);

// Top pages
const { data: topPages } = await supabase
  .from('popular_pages')
  .select('*')
  .limit(10);

console.log('Most visited pages:', topPages);

// Engagement leaderboard
const { data: topUsers } = await supabase
  .from('user_engagement_scores')
  .select('*')
  .order('engagement_score', { ascending: false })
  .limit(20);

console.log('Most engaged SEs:', topUsers);

// Inactive users
const { data: inactive } = await supabase
  .from('inactive_users')
  .select('*')
  .limit(20);

console.log('SEs who need follow-up:', inactive);
```

---

## 📁 Reference Files

- **Setup Guide**: `/SESSION_ANALYTICS_SETUP.md`
- **Implementation Examples**: `/ANALYTICS_IMPLEMENTATION_GUIDE.tsx`
- **Core Functions**: `/utils/analytics.ts`
- **Page Tracking Hook**: `/hooks/usePageTracking.ts`

---

## ✅ Success Checklist

- [x] Database tables created
- [x] Analytics functions created
- [x] Login/logout tracking working
- [x] Dashboard tracking working (all 4 roles)
- [x] Explore Feed tracking working
- [ ] Programs page tracking (5 min to add)
- [ ] Leaderboard tracking (5 min to add)
- [ ] Profile tracking (5 min to add)
- [ ] Settings tracking (5 min to add)
- [ ] Submit program action tracking (5 min to add)
- [ ] Like/comment action tracking (5 min to add)

---

## 🎉 YOU'RE READY!

The analytics system is **LIVE** and **WORKING**!

Every time a user:
- ✅ Logs in → Tracked
- ✅ Views Dashboard → Tracked
- ✅ Views Explore Feed → Tracked
- ✅ Stays on a page → Time tracked
- ✅ Logs out → Tracked

Start using the app and check your `user_sessions` and `page_views` tables! 🚀
