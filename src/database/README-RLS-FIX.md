# Database Permission Fix Required

## Issue
Your TAI app is encountering this error:
```
Error: permission denied for table kv_store_28f2f653
Error code: 42501
```

## Root Cause
Row Level Security (RLS) is enabled on the `kv_store_28f2f653` table in your Supabase database, which is blocking the app from accessing the table even with the service role key.

## Solution
You need to disable RLS and grant proper permissions to the table by running a SQL script in Supabase.

## Steps to Fix

### 1. Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new

### 2. Copy the SQL Fix
Open the file `/database/FIX-KV-STORE-RLS.sql` and copy all its contents.

### 3. Paste and Run
- Paste the SQL into the Supabase SQL Editor
- Click the **"Run"** button (or press Cmd/Ctrl + Enter)
- You should see a success message

### 4. Verify
The output should show:
```
Success. No rows returned
```

Or you should see a table with:
```
tablename              | RLS Enabled
kv_store_28f2f653      | f (false)
```

### 5. Refresh Your App
Go back to your TAI app and refresh the page. The error should be gone!

## What This Does
The SQL script:
1. ✅ Disables Row Level Security on `kv_store_28f2f653`
2. ✅ Grants full permissions to the `anon`, `authenticated`, and `service_role` roles
3. ✅ Verifies that RLS is disabled

## Alternative: Diagnostic Endpoint
You can also call this endpoint to get diagnostic information:
```
POST https://mcbbtrrhqweypfnlzwht.supabase.co/functions/v1/make-server-28f2f653/fix-kv-store-rls
```

This will return detailed instructions and the SQL to run.

## Still Having Issues?
If you still see errors after running the SQL:
1. Make sure you're logged into the correct Supabase project
2. Verify you have admin access to the project
3. Check the browser console for any new error messages
4. Try refreshing the page with a hard reload (Cmd/Ctrl + Shift + R)
