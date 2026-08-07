# 🚨 CRITICAL: Run This SQL Migration First!

## Error You're Seeing
```
Error creating post: {
  code: '42P01', 
  message: 'missing FROM-clause entry for table "auto_extract_hashtags"'
}
```

## The Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### Step 2: Copy and Paste This SQL

```sql
-- ============================================================================
-- FIX: Remove invalid table reference in auto_extract_hashtags trigger
-- Error: missing FROM-clause entry for table "auto_extract_hashtags"
-- Issue: Cannot use function name as a qualifier for loop variables
-- Date: 2026-01-22
-- ============================================================================

-- Drop and recreate the function with correct variable references
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_tags TEXT[];
  hashtag_text TEXT;  -- Renamed from 'tag' to be more explicit
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

-- Verify the trigger is still active
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_extract_hashtags'
  AND event_object_table = 'social_posts';

COMMENT ON FUNCTION auto_extract_hashtags() IS 
'Trigger function that extracts hashtags from post content and updates the hashtags analytics table. 
Uses a loop variable named hashtag_text to avoid any ambiguity with table columns.';
```

### Step 3: Run the Query
1. Click **Run** or press `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)
2. You should see a success message and trigger information

### Step 4: Verify Success
You should see output like:
```
trigger_name                    | event_manipulation | action_timing | event_object_table
trigger_auto_extract_hashtags  | INSERT             | BEFORE        | social_posts
```

## What This Does

### The Problem
- Previous migration used `auto_extract_hashtags.tag` in the trigger function
- PostgreSQL thought `auto_extract_hashtags` was a table name (it's the function name!)
- This caused the "missing FROM-clause entry" error

### The Solution
- Renamed the loop variable from `tag` to `hashtag_text` (more explicit)
- Use the variable directly: `hashtag_text` instead of `auto_extract_hashtags.tag`
- No table qualification needed for local variables

## After Running the Migration

✅ Creating posts will work without errors  
✅ Hashtags will be automatically extracted and stored  
✅ The hashtags table will track usage analytics  
✅ All hashtag UI features will work correctly  

## Test It Works

1. Go to Champions Feed in your app
2. Click "+ New" to create a post
3. Type a caption with hashtags: `"Great sale today! #marketday #saleswin"`
4. Post it
5. **Check console** - should see no errors
6. **Hashtags should appear in blue** and be clickable

## Still Having Issues?

Check the following:
1. **Migration ran successfully** - verify in SQL Editor
2. **Trigger is active** - run the SELECT query above
3. **Clear browser cache** - sometimes needed for UI updates
4. **Check browser console** - look for any JavaScript errors

## Files Reference

- Migration file: `/database/HASHTAG_TRIGGER_FIX_FINAL.sql`
- Full documentation: `/HASHTAG_IMPLEMENTATION_COMPLETE.md`

---

**Last Updated:** January 22, 2026  
**Status:** Ready to deploy
