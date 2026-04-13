================================================================================
          TAI - SALES INTELLIGENCE NETWORK
          DATABASE PERMISSION ERROR - QUICK FIX GUIDE
================================================================================

🚨 PROBLEM:
You're seeing errors like:
- "permission denied for table kv_store_28f2f653"
- "Could not find the function public.exec_sql"
- "Database setup issue: Not Found"

✅ SOLUTION:
The database table exists but doesn't have the correct permissions.
This is a ONE-TIME setup that takes 2 minutes.

================================================================================
                    QUICK FIX (RECOMMENDED)
================================================================================

1. Open Supabase Dashboard
   → Go to: https://supabase.com/dashboard
   → Select your TAI project

2. Open SQL Editor
   → Click "SQL Editor" in left sidebar
   → Click "+ New query" button

3. Copy & Paste This SQL:

   ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
   GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;

4. Run the Query
   → Click "Run" or press Cmd/Ctrl + Enter
   → You should see "Success. No rows returned"

5. Refresh TAI App
   → Go back to your TAI app
   → Refresh the page (F5 or Cmd+R)
   → ✅ Errors should be GONE!

================================================================================
                  ALTERNATIVE: FULL SETUP
================================================================================

If you want to run the complete database setup (includes programs tables):

→ Open file: /DATABASE-SETUP.sql
→ Copy the ENTIRE file
→ Paste in Supabase SQL Editor
→ Run it
→ Refresh TAI app

================================================================================
                      WHY THIS HAPPENS
================================================================================

Supabase creates tables with Row Level Security (RLS) enabled by default.
TAI uses a custom authentication system (localStorage-based) instead of
Supabase Auth, so we need to disable RLS and grant direct permissions.

The app tries to fix this automatically on startup, but Supabase doesn't 
allow programmatic permission changes via the REST API, so it must be 
done manually through the SQL Editor.

================================================================================
                      VERIFICATION
================================================================================

After running the SQL, you can verify it worked:

1. Check the console (F12 → Console)
   ✅ Should see: "[App] ✅ Database setup: kv_store_28f2f653 table is accessible"
   ❌ Should NOT see: "permission denied" errors

2. Check the Explore feed
   ✅ Should load posts
   ❌ Should NOT show empty state with errors

3. Check Hall of Fame
   ✅ Should show leaderboard
   ❌ Should NOT show loading forever

================================================================================
                    STILL HAVING ISSUES?
================================================================================

If the error persists after running the SQL:

1. Wait 2-3 minutes
   → Supabase Edge Functions cache needs to refresh
   → The server restarts automatically

2. Hard refresh the browser
   → Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   → Clear cache if needed

3. Check table exists
   → In Supabase, go to Table Editor
   → Look for "kv_store_28f2f653" table
   → If it doesn't exist, run /DATABASE-SETUP.sql

4. Check server logs
   → In Supabase, go to Edge Functions
   → Click on "make-server-28f2f653"
   → Check logs for errors

================================================================================
                    FILES REFERENCE
================================================================================

📄 /DATABASE-SETUP.sql
   → Complete database setup (recommended for first-time setup)
   → Creates all tables + fixes permissions
   → Includes sample data

📄 /QUICK-FIX-README.txt (this file)
   → Quick reference guide
   → Use when you just need to fix permissions

📄 /UAT-TESTING-FORM.txt
   → Full testing checklist
   → 65 test cases across 12 categories

================================================================================
                    CONTACT & SUPPORT
================================================================================

For additional help:
→ Check the browser console (F12) for detailed error messages
→ Check Supabase Edge Function logs
→ Contact your system administrator

================================================================================
                         END OF GUIDE
================================================================================

Last updated: January 2026
TAI Version: 1.0.1
