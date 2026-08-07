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

-- Test the function works correctly
-- Uncomment to test:
-- INSERT INTO social_posts (author_id, content) 
-- VALUES ('test-user-id', 'Testing hashtags #marketvisit #airtel #saleswin')
-- RETURNING id, content, hashtags;
-- 
-- SELECT tag, post_count FROM hashtags WHERE tag IN ('marketvisit', 'airtel', 'saleswin');
