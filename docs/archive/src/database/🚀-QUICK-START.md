# 🚀 TAI Database Quick Start

## Problem: `programs` table doesn't exist

Your console shows:
```
Could not find the table 'public.programs' in the schema cache
```

---

## ✅ SOLUTION (2 Steps - 3 Minutes)

### Step 1️⃣: Create Tables (REQUIRED)

**Go to:** Supabase Dashboard → SQL Editor → New Query

**Copy & Paste:** Open `/database/CREATE-TABLES.sql` and copy the ENTIRE file

**Click:** RUN (or Ctrl+Enter)

**Result:** Creates 7 tables:
- ✅ `programs` - Intelligence gathering programs
- ✅ `submissions` - SE submissions
- ✅ `users` - User profiles
- ✅ `posts` - Social network posts
- ✅ `likes` - Post likes
- ✅ `comments` - Post comments
- ✅ Fixes `kv_store_28f2f653` permissions

---

### Step 2️⃣: Add Sample Data (OPTIONAL - for testing)

**Go to:** Supabase Dashboard → SQL Editor → New Query

**Copy & Paste:** Open `/database/SEED-SAMPLE-DATA.sql` and copy the ENTIRE file

**Click:** RUN (or Ctrl+Enter)

**Result:** Adds:
- ✅ 7 sample users (SEs, ZSM, ZBM, HQ, Director)
- ✅ 5 sample programs (Competitor SIM, Retail Mapping, Pain Points, Promos, Network Quality)
- ✅ 3 sample submissions for testing analytics

---

## 🎉 DONE!

**Refresh your TAI app** - everything should work now!

---

## ✅ What You'll See

After running these scripts:

### For Sales Executives (SE):
- ✅ Programs tab shows 5 intelligence gathering missions
- ✅ Can submit forms with photos and GPS
- ✅ Instant points awarded
- ✅ Leaderboard works
- ✅ Explore/Social feed active

### For Managers (ZSM/ZBM):
- ✅ Analytics dashboard with submission trends
- ✅ Zone comparison vs national benchmarks
- ✅ Program performance insights
- ✅ Leaderboard for their zones

### For HQ/Director:
- ✅ National analytics overview
- ✅ All zones comparison
- ✅ Top performers across regions
- ✅ System-wide intelligence insights

---

## 📋 Tables Created

| Table | Purpose | RLS |
|-------|---------|-----|
| `programs` | Intelligence programs/missions | OFF ✅ |
| `submissions` | SE field submissions | OFF ✅ |
| `users` | User profiles & points | OFF ✅ |
| `posts` | Social network posts | OFF ✅ |
| `likes` | Post engagement | OFF ✅ |
| `comments` | Post discussions | OFF ✅ |
| `kv_store_28f2f653` | Key-value storage | OFF ✅ |

**All permissions granted to `anon` role** (since you're using localStorage auth, not Supabase Auth)

---

## 🔍 Verify It Worked

After running the scripts, check in Supabase:

1. **Table Editor** → Should see all 7 tables
2. **SQL Editor** → Run:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
   All `rowsecurity` should be `false`

---

## ⚠️ Important Notes

- ✅ **RLS is OFF** - Your app uses localStorage auth, not Supabase Auth
- ✅ **Direct access** - Frontend reads/writes directly to tables
- ✅ **No approval flow** - All submissions auto-approved for analytics
- ✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` and `ON CONFLICT`

---

## 🆘 Troubleshooting

**Still getting errors?**

1. Check Supabase project is active (not paused)
2. Verify API keys in `utils/supabase/info.tsx` are correct
3. Check browser console for specific error messages
4. Ensure no typos when copying SQL

**Need to start fresh?**

Drop and recreate:
```sql
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run `CREATE-TABLES.sql`

---

## 🚀 Next Steps After Database Setup

1. ✅ Refresh TAI app
2. ✅ Test program listing (should show 5 programs)
3. ✅ Test form submission as SE
4. ✅ Check leaderboard updates
5. ✅ Verify manager analytics dashboards
6. ✅ Create social posts in Explore tab

**Your TAI Sales Intelligence Network is ready!** 🎉
