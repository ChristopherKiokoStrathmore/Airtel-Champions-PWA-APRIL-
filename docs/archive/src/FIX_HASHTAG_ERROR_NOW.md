# 🚨 FIX HASHTAG ERROR RIGHT NOW

## The Error You're Seeing
```
Error creating post: {
  "code": "42P01",
  "message": "missing FROM-clause entry for table \"auto_extract_hashtags\""
}
```

---

## 📋 **STEP-BY-STEP FIX (2 MINUTES)**

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: **xspogpfohjmkykfjadhk**

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### Step 3: Copy the SQL
Open the file `/database/FIX_NOW.sql` in this project and copy ALL the text.

**OR copy this directly:**

```sql
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_tags TEXT[];
  hashtag_text TEXT;
BEGIN
  -- Extract hashtags from content
  extracted_tags := extract_hashtags(NEW.content);
  
  -- Store in hashtags column
  NEW.hashtags := to_jsonb(extracted_tags);
  
  -- Update hashtags analytics table
  FOREACH hashtag_text IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (tag, post_count, last_used_at)
    VALUES (hashtag_text, 1, NOW())
    ON CONFLICT (tag) DO UPDATE
    SET 
      post_count = hashtags.post_count + 1,
      last_used_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$;

SELECT 'SUCCESS: Trigger function updated!' as status;
```

### Step 4: Paste and Run
1. Paste the SQL into the editor
2. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
3. Wait for success message

### Step 5: Verify Success
You should see:
```
status
────────────────────────────────────
SUCCESS: Trigger function updated!
```

---

## ✅ **Test It Works**

1. Go back to your Airtel Champions app
2. Refresh the page (F5)
3. Click **"+ New"** to create a post
4. Type: `"Great sale today! #marketday #saleswin"`
5. Add a photo (optional)
6. Click **"Post"**

**Result:** 
- ✅ No errors in console
- ✅ Post is created successfully
- ✅ Hashtags appear in BLUE
- ✅ Hashtags are clickable

---

## 🤔 **Why This Error Happened**

The database trigger function had incorrect code:
```sql
-- ❌ WRONG (old code)
FOREACH tag IN ARRAY extracted_tags
LOOP
  INSERT INTO hashtags (tag, post_count, last_used_at)
  VALUES (auto_extract_hashtags.tag, 1, NOW())  -- ❌ This caused the error
```

PostgreSQL thought `auto_extract_hashtags` was a table name!

**Fixed code:**
```sql
-- ✅ CORRECT (new code)
FOREACH hashtag_text IN ARRAY extracted_tags
LOOP
  INSERT INTO hashtags (tag, post_count, last_used_at)
  VALUES (hashtag_text, 1, NOW())  -- ✅ Simple variable reference
```

---

## 🆘 **Still Having Issues?**

### Error: "function extract_hashtags does not exist"
This means the base function is missing. Run this FIRST:

```sql
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
DECLARE
  hashtags TEXT[];
BEGIN
  -- Extract all hashtags using regex
  SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
  INTO hashtags
  FROM regexp_matches(text_content, '(#[a-zA-Z0-9_]+)', 'g') AS match;
  
  RETURN COALESCE(hashtags, ARRAY[]::TEXT[]);
END;
$$;
```

Then run the main fix again.

### Error: "table hashtags does not exist"
Create the table first:

```sql
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_post_count ON hashtags(post_count DESC);
```

Then run the main fix again.

### Error: "column hashtags does not exist in social_posts"
Add the column:

```sql
ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS hashtags JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags 
ON social_posts USING gin(hashtags);
```

Then run the main fix again.

---

## 📞 **Quick Debug Checklist**

Run these queries to check your database state:

```sql
-- Check if extract_hashtags function exists
SELECT proname, prokind 
FROM pg_proc 
WHERE proname = 'extract_hashtags';

-- Check if auto_extract_hashtags function exists
SELECT proname, prokind 
FROM pg_proc 
WHERE proname = 'auto_extract_hashtags';

-- Check if trigger exists
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_extract_hashtags';

-- Check if hashtags table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'hashtags';

-- Check if social_posts.hashtags column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'social_posts' 
  AND column_name = 'hashtags';
```

**Expected Results:**
- ✅ extract_hashtags function: 1 row
- ✅ auto_extract_hashtags function: 1 row
- ✅ trigger_auto_extract_hashtags: 1 row
- ✅ hashtags table: 1 row
- ✅ social_posts.hashtags column: 1 row (type: jsonb)

---

## 🎯 **After Fixing**

Once you run the SQL fix:

1. **Hashtag Creation**
   - Type hashtags in post caption
   - They turn BLUE in real-time ✨
   - Post successfully (no errors)

2. **Hashtag Display**
   - All hashtags appear in BLUE
   - Hovering shows underline
   - Cursor becomes pointer

3. **Hashtag Filtering**
   - Click any hashtag
   - Feed filters to show only posts with that tag
   - Blue banner shows: `#hashtag (X posts)`
   - Click "Clear Filter" to return

---

**Last Updated:** January 22, 2026  
**Status:** Ready to fix - just run the SQL!
