# TAI Database Setup Instructions

## ⚠️ Important: Fix Permission Errors

If you see errors like **"permission denied for table kv_store_28f2f653"**, follow these steps:

### 🔧 Quick Fix - Run this SQL in Supabase

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click "**New query**"
3. **Copy and paste** the SQL below
4. Click **"Run"**
5. **Refresh** your TAI app

```sql
-- Disable RLS on KV store table (required for service role access)
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to all roles
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_28f2f653(key);
```

### ✅ What This Fixes

- ✅ Groups backend (user data, messages)
- ✅ Programs backend (caching, storage)
- ✅ Social feed backend (posts, caching)
- ✅ Announcements backend (notifications)

### 📱 Client-Side Features (No Setup Required)

The following features work **immediately without any setup**:

- ✅ **Groups** - Create groups, send messages (100% localStorage)
- ✅ **User Authentication** - Login system
- ✅ **Navigation** - All tabs and navigation

### 🔍 How to Check if Setup Worked

After running the SQL:
1. Refresh your app
2. Check browser console (F12)
3. You should see: `✅ Database is ready`
4. No more "permission denied" errors!

### 📞 Need Help?

If you still see errors after running the SQL:
1. Verify the table `kv_store_28f2f653` exists in your database
2. Check that you're using the correct Supabase project
3. Ensure you have admin access to the Supabase project

---

**Last Updated:** January 13, 2026
