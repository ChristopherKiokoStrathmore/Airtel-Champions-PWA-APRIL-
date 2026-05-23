# ✅ ENABLE VAN CALENDAR - Run This SQL

## Step 1: Enable Van Calendar Feature

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Van Calendar feature for all users
INSERT INTO kv_store_28f2f653 (key, value)
VALUES ('feature_van_calendar_enabled', 'true')
ON CONFLICT (key) 
DO UPDATE SET value = 'true';
```

## Step 2: Verify It's Enabled

```sql
-- Check if it's enabled
SELECT * FROM kv_store_28f2f653 
WHERE key = 'feature_van_calendar_enabled';
```

You should see:
```
key                          | value
-----------------------------+-------
feature_van_calendar_enabled | true
```

## ✅ Done!

Now when you:
1. Login as any user (ZSM, HQ, Director)
2. Click **Programs tab** (2nd icon from left in bottom nav)
3. You'll see the blue **🚐 Van Weekly Calendar** card at the very top!

## 🎮 To Disable Later (If Needed)

HQ/Directors can disable it via:
- Settings → Feature Management → Van Calendar Feature → DISABLE

Or run this SQL:
```sql
UPDATE kv_store_28f2f653 
SET value = 'false' 
WHERE key = 'feature_van_calendar_enabled';
```

---

**No APK deployment required!** The existing APK will see the Van Calendar as soon as you run the SQL above. 🎉
