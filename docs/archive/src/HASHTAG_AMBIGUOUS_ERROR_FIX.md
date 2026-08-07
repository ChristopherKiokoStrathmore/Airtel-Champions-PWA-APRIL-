# 🔴 HASHTAG ERROR FIX - Ambiguous Column Reference

## 🔴 Error Encountered

```
Error creating post: {
  "code": "42702",
  "details": "It could refer to either a PL/pgSQL variable or a table column.",
  "hint": null,
  "message": "column reference \"tag\" is ambiguous"
}
```

---

## 🔍 Root Cause

**Location:** `/database/HASHTAG_SYSTEM_MIGRATION.sql` - Lines 107-114

**Problem:** In the `auto_extract_hashtags()` trigger function, the variable name `tag` conflicts with the column name `tag` in the INSERT statement.

### Problematic Code:
```sql
DECLARE
  tag TEXT;  -- ← Variable named "tag"
BEGIN
  FOREACH tag IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (tag, post_count, last_used_at)  -- ← Column named "tag"
    VALUES (tag, 1, NOW())  -- ← AMBIGUOUS! Which "tag"?
    ON CONFLICT (tag) DO UPDATE
    ...
  END LOOP;
END;
```

**PostgreSQL Error:** The database can't determine if `tag` in the VALUES clause refers to:
1. The PL/pgSQL variable `tag` (from the FOREACH loop)
2. The table column `tag` (from the hashtags table)

---

## ✅ Solution

**Qualify the variable name** using the function name as a prefix: `auto_extract_hashtags.tag`

This explicitly tells PostgreSQL we're referring to the variable, not the column.

### Fixed Code:
```sql
DECLARE
  tag TEXT;
BEGIN
  FOREACH tag IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (tag, post_count, last_used_at)
    VALUES (auto_extract_hashtags.tag, 1, NOW())  -- ✅ QUALIFIED!
    ON CONFLICT (tag) DO UPDATE
    SET 
      post_count = hashtags.post_count + 1,
      last_used_at = NOW();
  END LOOP;
END;
```

---

## 🔧 How to Apply the Fix

### **Option 1: Run the Patch File (Fastest)**

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste contents of: `/database/HASHTAG_AMBIGUOUS_FIX.sql`
4. Click **Run**

This will recreate the function with the fix.

---

### **Option 2: Manual Fix in Supabase**

Run this SQL in Supabase SQL Editor:

```sql
-- Fix the ambiguous column reference
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_tags TEXT[];
  tag TEXT;
BEGIN
  -- Extract hashtags from content
  extracted_tags := extract_hashtags(NEW.content);
  
  -- Store in hashtags column
  NEW.hashtags := to_jsonb(extracted_tags);
  
  -- Update hashtags analytics table
  FOREACH tag IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (tag, post_count, last_used_at)
    VALUES (auto_extract_hashtags.tag, 1, NOW())  -- FIXED: Qualified variable name
    ON CONFLICT (tag) DO UPDATE
    SET 
      post_count = hashtags.post_count + 1,
      last_used_at = NOW();
  END LOOP;
  
  RETURN NEW;
END;
$$;
```

---

## ✅ Verification

After applying the fix, verify it's working:

### Test 1: Check Trigger Still Exists
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_extract_hashtags';
```

**Expected Result:**
```
trigger_name: trigger_auto_extract_hashtags
event_manipulation: INSERT
action_timing: BEFORE
```

### Test 2: Create a Post with Hashtags
```sql
-- Insert a test post (replace 'your-user-id' with a real user ID)
INSERT INTO social_posts (author_id, content) 
VALUES ('your-user-id', 'Testing hashtags #marketvisit #airtel #test');

-- Check if hashtags were extracted
SELECT id, content, hashtags 
FROM social_posts 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result:**
```json
{
  "content": "Testing hashtags #marketvisit #airtel #test",
  "hashtags": ["marketvisit", "airtel", "test"]
}
```

### Test 3: Check Hashtag Analytics
```sql
SELECT * FROM hashtags 
WHERE tag IN ('marketvisit', 'airtel', 'test')
ORDER BY last_used_at DESC;
```

**Expected Result:**
```
tag         | post_count | last_used_at
------------|------------|---------------
marketvisit | 1          | 2026-01-22 ...
airtel      | 1          | 2026-01-22 ...
test        | 1          | 2026-01-22 ...
```

---

## 📊 What This Fixes

| Issue | Before Fix | After Fix |
|-------|------------|-----------|
| **Creating posts** | ❌ Error 42702 | ✅ Works |
| **Hashtag extraction** | ❌ Fails | ✅ Auto-extracts |
| **Analytics table** | ❌ Not updated | ✅ Updated |
| **Error in console** | ❌ Ambiguous column | ✅ No errors |

---

## 🎯 Technical Explanation

### Why PostgreSQL Couldn't Resolve It:

In PL/pgSQL, when you have a variable with the same name as a column, PostgreSQL needs disambiguation:

**Scope Resolution Order:**
1. PL/pgSQL variables (local scope)
2. Table columns (when in SQL context)
3. Function parameters

**The Ambiguity:**
```sql
VALUES (tag, 1, NOW())
```

PostgreSQL sees:
- Could be: The variable `tag` from `FOREACH tag IN ARRAY`
- Could be: The column `hashtags.tag` from the table being inserted into

**The Fix:**
```sql
VALUES (auto_extract_hashtags.tag, 1, NOW())
```

Now PostgreSQL knows:
- `auto_extract_hashtags.tag` = The variable (fully qualified)
- `hashtags.tag` = The column (implicitly qualified by table name)

---

## 📁 Files Modified

1. ✅ `/database/HASHTAG_SYSTEM_MIGRATION.sql` - Line 109 fixed
2. ✅ `/database/HASHTAG_AMBIGUOUS_FIX.sql` - Created (patch file)

---

## 🚀 After Applying Fix

You can now:
- ✅ Create posts with hashtags
- ✅ Hashtags are auto-extracted and stored
- ✅ Analytics table is updated automatically
- ✅ No more "ambiguous column" errors

---

## 📝 PostgreSQL Best Practices Learned

**To avoid this issue in future:**

1. **Use descriptive variable names:**
   ```sql
   -- AVOID:
   DECLARE tag TEXT;
   
   -- BETTER:
   DECLARE current_tag TEXT;
   DECLARE hashtag_value TEXT;
   ```

2. **Qualify variables when necessary:**
   ```sql
   -- Always qualify in ambiguous contexts
   VALUES (function_name.variable_name, ...)
   ```

3. **Use EXCLUDED for ON CONFLICT:**
   ```sql
   ON CONFLICT (tag) DO UPDATE
   SET 
     post_count = EXCLUDED.post_count + hashtags.post_count,
     -- EXCLUDED refers to the row that would have been inserted
   ```

---

## ✅ Status: READY TO FIX

**Next Step:** Run `/database/HASHTAG_AMBIGUOUS_FIX.sql` in Supabase SQL Editor

**Estimated Time:** 10 seconds

**Test After:** Create a post with hashtags and verify they're extracted! 🚀
