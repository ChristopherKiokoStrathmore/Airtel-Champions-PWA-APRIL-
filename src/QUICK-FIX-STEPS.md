# 🚀 QUICK FIX - 3 Easy Steps

## ✅ BUTTONS FIXED
The two buttons are now **vertically stacked** in the bottom-right corner:
- 🔍 **DB Check** (green) - TOP button
- 🔧 **Phone Debug** (purple) - BOTTOM button

## ✅ CODE FIXED
- Changed `agent_id` to `user_id` in stats-tab.tsx ✅

---

## 🔧 DATABASE FIXES NEEDED (3 Steps)

### **Step 1: Add Missing Columns** ⏱️ 30 seconds

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste THIS command:

```sql
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS banner_url TEXT;
```

3. Click **RUN**
4. You should see: ✅ Success

---

### **Step 2: Create Social Tables** ⏱️ 1 minute

Copy and paste THIS command:

```sql
CREATE TABLE IF NOT EXISTS social_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);

CREATE TABLE IF NOT EXISTS social_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS hall_of_fame BOOLEAN DEFAULT FALSE;
```

Click **RUN**

---

### **Step 3: Create Storage Buckets** ⏱️ 2 minutes

**MUST be done via Dashboard (SQL doesn't work for storage):**

1. Go to: **Supabase Dashboard → Storage**
2. Click: **"New Bucket"**
3. Name: `make-28f2f653-profile-pictures`
4. Check: **"Public bucket"**
5. Click: **"Create bucket"**

6. **Repeat** for second bucket:
7. Click: **"New Bucket"**
8. Name: `make-28f2f653-profile-banners`
9. Check: **"Public bucket"**
10. Click: **"Create bucket"**

---

## ✅ VERIFY IT WORKED

1. **Refresh your app**
2. Click the **🔍 DB Check** button (green, top)
3. Click **"Run Database Check"**
4. **ALL items should show ✅** green checkmarks!

---

## 📊 WHAT YOU SHOULD SEE:

### Before:
```
❌ bio
❌ avatar_url
❌ banner_url
✅ user_id (FOUND)
❌ social_comments
❌ social_likes
❌ profile-pictures bucket
❌ profile-banners bucket
```

### After:
```
✅ bio
✅ avatar_url
✅ banner_url
✅ user_id (FOUND)
✅ social_comments
✅ social_likes
✅ profile-pictures bucket
✅ profile-banners bucket
```

---

## 🎉 DONE!

Once you see all ✅, the profile functionality is **100% ready for UAT testing!**

You can now:
- ✅ Upload profile pictures
- ✅ Upload banner images
- ✅ Edit bio (150 characters)
- ✅ View 30-day stats chart
- ✅ See activity timeline
- ✅ View posts grid
- ✅ Like and comment on posts

---

## ❓ Having Issues?

**If storage buckets still show ❌:**
- Make sure you created them in the **Storage** tab (not SQL Editor)
- Make sure they're set to **PUBLIC**
- Double-check the names are **exactly**:
  - `make-28f2f653-profile-pictures`
  - `make-28f2f653-profile-banners`

**If social tables show ❌:**
- Re-run the Step 2 SQL command
- Check for any error messages in SQL Editor

**If app_users columns show ❌:**
- Re-run the Step 1 SQL command
- Refresh the DB Check tool
