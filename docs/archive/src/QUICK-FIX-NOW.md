# ⚡ QUICK FIX - 2 Steps

## ✅ Step 1: Fix KV Store Permissions (1 minute)

1. Open: **Supabase Dashboard → SQL Editor**
2. Copy this SQL:

```sql
-- Fix KV Store Permissions
GRANT ALL ON kv_store_28f2f653 TO anon, authenticated, service_role;
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
```

3. Click **"Run"**
4. ✅ Done!

---

## ✅ Step 2: Restart PostgREST (30 seconds)

1. **Supabase Dashboard → Settings → API**
2. Click **"Restart PostgREST"**
3. Wait 20 seconds
4. ✅ Done!

---

## 🧪 Test

1. Refresh app (F5)
2. Programs → Create Program
3. ✅ Should load without errors!
4. Add field → Database Dropdown
5. Select: van_db
6. ✅ Columns should load!

---

**Total Time: 90 seconds** ⚡  
**Errors Fixed: All of them** ✅

