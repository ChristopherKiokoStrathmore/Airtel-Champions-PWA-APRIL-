# 🎯 VISUAL SETUP GUIDE

```
┌─────────────────────────────────────────────────────────────────┐
│                    SETUP CHECKLIST                              │
│                 (Follow in this order)                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Get Service Role Key                        [2 minutes] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Open: https://supabase.com/dashboard/project/               │
│           xspogpfohjmkykfjadhk/settings/api                     │
│                                                                  │
│  2. Find section: "Project API keys"                            │
│                                                                  │
│  3. Look for: "service_role" (⚠️ secret)                        │
│     ┌──────────────────────────────────────────┐               │
│     │ service_role • secret                     │               │
│     │ ey...                           [Copy]    │               │
│     └──────────────────────────────────────────┘               │
│                                                                  │
│  4. Click [Copy] button                                         │
│                                                                  │
│  5. Open file: `.env` in your project root                      │
│                                                                  │
│  6. Find line:                                                  │
│     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here        │
│                                                                  │
│  7. Replace "your-service-role-key-here" with copied key        │
│                                                                  │
│  8. Save file                                                   │
│                                                                  │
│     ✅ DONE when .env file has real service role key            │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Apply Database Schema                       [5 minutes] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CHOOSE ONE METHOD:                                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ METHOD A: Supabase Dashboard (RECOMMENDED - Easier)    │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  1. Open: https://supabase.com/dashboard/project/               │
│           xspogpfohjmkykfjadhk/sql/new                          │
│                                                                  │
│  2. In your code editor, open file:                             │
│     `/supabase/migrations/001_initial_schema.sql`               │
│                                                                  │
│  3. Select ALL (Ctrl+A / Cmd+A)                                 │
│                                                                  │
│  4. Copy (Ctrl+C / Cmd+C)                                       │
│                                                                  │
│  5. Go back to Supabase SQL Editor browser tab                  │
│                                                                  │
│  6. Click in the SQL editor text area                           │
│                                                                  │
│  7. Paste (Ctrl+V / Cmd+V)                                      │
│                                                                  │
│  8. Click big blue [RUN] button (bottom right)                  │
│                                                                  │
│  9. Wait for "Success" message (takes ~30 seconds)              │
│                                                                  │
│     ✅ DONE when you see "Success. No rows returned"            │
│                                                                  │
│  ──────────────────────────────────────────────────────────    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ METHOD B: Supabase CLI (For Advanced Users)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  In terminal:                                                   │
│                                                                  │
│  $ npm install -g supabase                                      │
│  $ supabase link --project-ref xspogpfohjmkykfjadhk             │
│  $ supabase db push                                             │
│                                                                  │
│     ✅ DONE when migrations complete successfully               │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Restart Development Server                  [1 minute]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  In your terminal where dev server is running:                  │
│                                                                  │
│  1. Press: Ctrl+C  (stops current server)                       │
│                                                                  │
│  2. Wait for "Process terminated" or similar message            │
│                                                                  │
│  3. Run: npm run dev                                            │
│     (or: yarn dev)                                              │
│                                                                  │
│  4. Wait for server to start (look for URL like                 │
│     "http://localhost:5173")                                    │
│                                                                  │
│  5. Open browser to that URL                                    │
│                                                                  │
│     ✅ DONE when you see the login screen (not DEMO notice)     │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Verify Connection (Optional)                [2 minutes] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Open browser console (Press F12)                            │
│                                                                  │
│  2. Click "Console" tab                                         │
│                                                                  │
│  3. Look for message:                                           │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ 🔍 Environment Check:                              │    │
│     │   envExists: true                                   │    │
│     │   url: ✅ Set                                       │    │
│     │   key: ✅ Set                                       │    │
│     │   urlValue: https://xspogpfohjmkykfjadhk...         │    │
│     │   mode: development                                 │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  4. Should NOT see "🎮 DEMO MODE" message                       │
│                                                                  │
│     ✅ DONE when both url and key show "✅ Set"                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Add Test Data (Optional)                    [3 minutes] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Your database is now empty. To test the dashboard with data:   │
│                                                                  │
│  1. Go to Supabase SQL Editor (same as Step 2)                  │
│                                                                  │
│  2. Open file: `/supabase/migrations/002_seed_test_data.sql`    │
│                                                                  │
│  3. Copy entire file contents                                   │
│                                                                  │
│  4. Paste into Supabase SQL Editor                              │
│                                                                  │
│  5. Click [RUN]                                                 │
│                                                                  │
│  6. This adds:                                                  │
│     • 10 test Sales Executives                                  │
│     • 17 sample submissions (pending, approved, rejected)       │
│     • 5 competitor activity reports                             │
│     • 4 announcements                                           │
│     • 5 hotspots                                                │
│     • 3 active challenges                                       │
│                                                                  │
│  7. Refresh your admin dashboard                                │
│                                                                  │
│     ✅ DONE when dashboard shows test submissions & leaderboard │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ VERIFICATION - What You Should See                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Login screen appears (no demo mode notice)                  │
│  ✅ After login, dashboard loads without errors                 │
│  ✅ Browser console shows no red errors                         │
│  ✅ All 10 navigation items work:                               │
│      • Dashboard Overview                                       │
│      • Submission Review                                        │
│      • Leaderboard                                              │
│      • Point Configuration                                      │
│      • Battle Map                                               │
│      • Analytics Dashboard                                      │
│      • SE Profile Viewer                                        │
│      • Achievements                                             │
│      • Daily Challenges                                         │
│      • Announcements                                            │
│                                                                  │
│  If you ran Step 5 (test data):                                 │
│  ✅ Leaderboard shows 10 SEs                                    │
│  ✅ Submissions page shows 17 submissions                       │
│  ✅ Dashboard overview shows statistics                         │
│  ✅ Battle map shows 5 hotspots                                 │
│                                                                  │
│  If you skipped Step 5:                                         │
│  ✅ All pages load but show "No data" messages                  │
│     (This is normal - data will come from mobile app)           │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ TROUBLESHOOTING                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ❌ Still seeing "DEMO MODE" notice                             │
│     → Check .env file exists in project root                    │
│     → Restart dev server (Step 3)                               │
│     → Hard refresh browser (Ctrl+Shift+R)                       │
│                                                                  │
│  ❌ "Failed to fetch" or "Network error"                        │
│     → Check database migration ran (Step 2)                     │
│     → Verify internet connection                                │
│     → Check Supabase project is active                          │
│                                                                  │
│  ❌ "Invalid API key" error                                     │
│     → Verify .env has correct VITE_SUPABASE_ANON_KEY            │
│     → Make sure you copied anon key (not service role key)      │
│     → Check for typos/extra spaces                              │
│                                                                  │
│  ❌ SQL migration errors                                        │
│     → Check you copied ENTIRE file (scroll to end)              │
│     → Run again (DROP commands are safe to re-run)              │
│     → Check for copy/paste formatting issues                    │
│                                                                  │
│  ❌ Dashboard is empty                                          │
│     → This is normal if you skipped Step 5                      │
│     → Run seed data script (002_seed_test_data.sql)             │
│     → Or wait for mobile app to create real data                │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ SECURITY REMINDERS                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Safe for frontend code:                                     │
│     • VITE_SUPABASE_URL                                         │
│     • VITE_SUPABASE_ANON_KEY                                    │
│                                                                  │
│  ⚠️  NEVER expose in frontend:                                  │
│     • SUPABASE_SERVICE_ROLE_KEY (backend only!)                 │
│     • Database password                                         │
│     • JWT secret                                                │
│                                                                  │
│  📝 The .env file should NEVER be committed to Git              │
│     (It's in .gitignore by default)                             │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ WHAT'S NEXT?                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  After setup is complete, you're ready for:                     │
│                                                                  │
│  📱 Phase 5: Flutter Mobile App Development                     │
│     • SE authentication with PIN                                │
│     • Camera integration with EXIF validation                   │
│     • GPS location verification                                 │
│     • Offline-first architecture                                │
│     • Photo submission workflow                                 │
│                                                                  │
│  🚀 Phase 6: Production Deployment                              │
│     • Deploy admin dashboard                                    │
│     • Configure production Supabase                             │
│     • Set up CI/CD pipeline                                     │
│     • Mobile app to Play Store                                  │
│                                                                  │
│  🎓 Phase 7: SE Training & Rollout                              │
│     • Create training materials                                 │
│     • Pilot with select SEs                                     │
│     • Full rollout to 662 SEs                                   │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│ TOTAL TIME: ~10 minutes                                         │
│ DIFFICULTY: Easy                                                │
│ SUPPORT: Check other .md files for detailed guides             │
└─────────────────────────────────────────────────────────────────┘

```
