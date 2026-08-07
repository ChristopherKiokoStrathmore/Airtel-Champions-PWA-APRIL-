# 🔴 QUICK FIX - Run This Now!

## Error:
```
column reference "tag" is ambiguous
```

## Fix:
Run this SQL in **Supabase SQL Editor**:

```sql
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_tags TEXT[];
  tag TEXT;
BEGIN
  extracted_tags := extract_hashtags(NEW.content);
  NEW.hashtags := to_jsonb(extracted_tags);
  
  FOREACH tag IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (tag, post_count, last_used_at)
    VALUES (auto_extract_hashtags.tag, 1, NOW())
    ON CONFLICT (tag) DO UPDATE
    SET 
      post_count = hashtags.post_count + 1,
      last_used_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$;
```

## What Changed:
**Line 17:** `VALUES (tag, 1, NOW())` → `VALUES (auto_extract_hashtags.tag, 1, NOW())`

This qualifies the variable name to avoid ambiguity with the column name.

## Test:
```sql
-- Create a test post
INSERT INTO social_posts (author_id, content) 
VALUES ('test-user', 'Great day! #marketvisit #airtel');

-- Check it worked
SELECT content, hashtags FROM social_posts ORDER BY created_at DESC LIMIT 1;
```

**Expected:** `hashtags: ["marketvisit", "airtel"]`

---

**Or:** Copy `/database/HASHTAG_AMBIGUOUS_FIX.sql` into SQL Editor and run it!

✅ Takes 10 seconds to fix!
