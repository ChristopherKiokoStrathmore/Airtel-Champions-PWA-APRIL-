# Fix: Supabase API Key Auto-Rotation Issue

## 🔴 Problem
Error: "Permission denied for table kv_store_28f2f653"

**Root Cause:** Supabase auto-rotates API keys for security, invalidating the keys hardcoded in your app.

---

## ✅ Solution: Disable Auto-Rotation

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your TAI project

### Step 2: Navigate to API Settings
1. Click **Settings** (gear icon) in left sidebar
2. Click **API** under Project Settings

### Step 3: Disable Auto-Rotation
Look for one of these sections:
- **"API Key Management"**
- **"Auto-rotate keys"**
- **"Key rotation policy"**

**Find the toggle/checkbox that says:**
- ❌ "Automatically rotate anon key"
- ❌ "Auto-regenerate API keys"
- ❌ "Enable key rotation"

**TURN IT OFF** (disable it)

### Step 4: Copy Current Valid Keys
While on the API settings page, copy the **current valid keys**:

1. **Project URL** (looks like: `https://xxxxx.supabase.co`)
2. **anon/public key** (long string starting with `eyJ...`)
3. **service_role key** (even longer string, keep this SECRET)

---

## Step 5: Update Your App Keys

### Option A: Update via Supabase Secrets UI (Recommended)

1. In your Figma Make app, there should be a button to update secrets
2. Click it and paste the new keys

### Option B: Update Manually

If you need to update the keys in code (though Make should handle this):

**File:** `/utils/supabase/info.tsx` (THIS IS A PROTECTED FILE - DON'T EDIT MANUALLY)

The keys should be stored as environment variables, not hardcoded.

---

## Step 6: Test

1. Refresh your app
2. Try logging in
3. Error should be gone ✅

---

## 🔒 Why This Happens

Supabase auto-rotates keys for security:
- **Good:** Prevents stolen keys from working forever
- **Bad:** Breaks apps that hardcode keys (like yours)

**For MVP:** Disable auto-rotation (you control when to rotate)
**For Production:** Use environment variables + CI/CD to update keys automatically

---

## 📋 Prevention Checklist

- [ ] Disable auto-rotation in Supabase dashboard
- [ ] Copy current valid keys
- [ ] Update keys in app
- [ ] Test app works
- [ ] Set calendar reminder to manually rotate keys every 6 months (optional)

---

## 🆘 If Still Getting Error After Disabling

**Possible causes:**
1. **Keys not updated yet** - Make sure you pasted the NEW keys from dashboard
2. **Browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **RLS policies blocking access** - Check if Row Level Security policies exist on kv_store table

**To check RLS:**
```sql
-- In Supabase SQL Editor, run:
SELECT * FROM pg_policies WHERE tablename = 'kv_store_28f2f653';

-- If policies exist, disable RLS for MVP:
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
```

---

## ✅ Expected Result

After fixing:
- ✅ Login works
- ✅ No more "Permission denied" errors
- ✅ App can read/write to database
- ✅ Keys remain stable (no auto-rotation)

---

**Time to fix:** 5 minutes
**Difficulty:** Easy (just a settings toggle)

Good luck! 🚀
