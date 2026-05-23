# 🚨 FIX: Permission Denied Error

## Error You're Seeing:
```
permission denied for table kv_store_28f2f653
```

## Why This Happens:
The `kv_store_28f2f653` table exists, but it doesn't have the right permissions for the Edge Function to access it.

---

## ✅ SOLUTION (Takes 30 Seconds):

### **Step 1: Open Supabase Dashboard**
Go to: https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht

### **Step 2: Open SQL Editor**
Click "SQL Editor" in the left sidebar

### **Step 3: Copy This SQL**
Open the file `/database/RUN-THIS-NOW.sql` and copy everything (Ctrl+A, Ctrl+C)

Or copy this:
```sql
-- Grant permissions to all roles
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO anon;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO authenticated;
GRANT ALL PRIVILEGES ON TABLE kv_store_28f2f653 TO service_role;

-- Disable Row Level Security
ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;
```

### **Step 4: Paste and Run**
1. Paste the SQL into the SQL Editor
2. Click the **"Run"** button (or press Ctrl+Enter)
3. Wait for success message

### **Step 5: Refresh TAI App**
Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac) to hard refresh

---

## ✅ What You'll See After:

- ✅ No more "permission denied" error
- ✅ Programs tab loads successfully
- ✅ "Competitor Intel" sample program appears
- ✅ Everything works!

---

## 🎯 Why This Works:

The KV store table was created with restricted permissions by default. The SQL grants full access to all roles and disables Row Level Security (RLS) since TAI uses custom authentication instead of Supabase auth.

---

## 📊 Verification:

After running the SQL, you should see:
```
✅ Permissions fixed! Refresh your TAI app now.
```

If you see this, the fix worked! Now refresh your TAI app.

---

**Time to complete: 30 seconds**
**Difficulty: Copy & Paste**

**DO IT NOW! →** 🚀
