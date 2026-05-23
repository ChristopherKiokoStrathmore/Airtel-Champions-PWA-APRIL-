# 🚀 QUICK START: Database Check for Profile UAT

## What You Need to Do RIGHT NOW

### Step 1: Run the In-App Database Checker ⚡
1. **Refresh your app**
2. **Go to the login screen**
3. **Look for the GREEN button** in the bottom-right corner that says **"🔍 DB Check"**
4. **Click it**
5. **Click "Run Database Check"**
6. **Wait for results** (takes 5-10 seconds)
7. **Take a screenshot** or **click "📋 Copy Results"**
8. **Share the results** (paste here or send to developer)

---

## Step 2: Look for Red X Marks ❌

The checker will show you:

### ✅ = Good (everything works)
### ❌ = Problem (needs fixing)

### Critical Things to Check:

1. **app_users Table**
   - ❌ **bio** column missing?
   - ❌ **avatar_url** column missing?
   - ❌ **banner_url** column missing?
   - ❌ **created_at** column missing?

2. **submissions Table**
   - Which field is ✅ green?
     - agent_id?
     - user_id?
     - author_id?
     - employee_id?

3. **Storage Buckets**
   - ❌ **make-28f2f653-profile-pictures** missing?
   - ❌ **make-28f2f653-profile-banners** missing?

---

## Step 3: Fix Missing Columns (If Needed)

### If you see ❌ for bio, avatar_url, or banner_url:

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Run these commands ONE AT A TIME:**

```sql
-- Only run if bio is missing
ALTER TABLE app_users ADD COLUMN bio TEXT;

-- Only run if avatar_url is missing
ALTER TABLE app_users ADD COLUMN avatar_url TEXT;

-- Only run if banner_url is missing
ALTER TABLE app_users ADD COLUMN banner_url TEXT;

-- Only run if created_at is missing
ALTER TABLE app_users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
```

4. **Run the DB Checker again** to verify ✅

---

## Step 4: Tell Me About Submissions Field

After running the DB Checker, look at the **submissions Table** section.

**Which one shows ✅ FOUND?**
- [ ] agent_id
- [ ] user_id
- [ ] author_id
- [ ] employee_id
- [ ] Something else? (tell me the field name)

**Just reply with:** "The submissions table uses `[field_name]`"

---

## Step 5: Verify Storage Buckets

The DB Checker will show if buckets exist.

**If ❌ missing:**
1. Go to Supabase Dashboard → Storage
2. Create new bucket
3. Name: `make-28f2f653-profile-pictures`
4. Set to **Public**
5. Repeat for `make-28f2f653-profile-banners`

---

## Alternative: Use SQL Queries Manually

If the in-app checker doesn't work:

1. **Open** `/database-check-queries.sql` file
2. **Copy Query #1** (app_users table check)
3. **Paste in Supabase SQL Editor**
4. **Run it**
5. **Copy the results and paste here**

Repeat for Query #2 (submissions table)

---

## That's It! 🎉

Once you share the results, I'll:
1. Fix any code issues
2. Update the correct field names
3. Make sure everything is UAT-ready

**Time needed:** 5-10 minutes total

**Questions?** Just ask! 😊
