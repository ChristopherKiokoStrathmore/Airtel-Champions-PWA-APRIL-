-- ============================================================================
-- FIX: Ambiguous column reference "tag" in auto_extract_hashtags trigger
-- Error: column reference "tag" is ambiguous
-- Date: 2026-01-22
-- ============================================================================

-- Drop and recreate the function with qualified variable names
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
  -- FIXED: Qualify variable name to avoid ambiguity
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

-- Verify the trigger is still active
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_extract_hashtags'
  AND event_object_table = 'social_posts';

-- Test the function (optional)
-- INSERT INTO social_posts (author_id, content) 
-- VALUES ('test-user-id', 'Testing hashtags #marketvisit #airtel #test');
-- 
-- SELECT * FROM social_posts ORDER BY created_at DESC LIMIT 1;
-- SELECT * FROM hashtags ORDER BY last_used_at DESC;
