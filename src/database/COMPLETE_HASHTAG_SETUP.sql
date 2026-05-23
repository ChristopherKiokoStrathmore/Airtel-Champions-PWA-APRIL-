-- ============================================================================
-- COMPLETE HASHTAG SYSTEM SETUP FOR AIRTEL CHAMPIONS
-- Run this ENTIRE file in Supabase SQL Editor to set up everything
-- Includes: table, functions, trigger, and indexes
-- Safe to run multiple times (uses IF NOT EXISTS and CREATE OR REPLACE)
-- ============================================================================

-- Step 1: Create hashtags analytics table (if it doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_post_count ON hashtags(post_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON hashtags(last_used_at DESC);

COMMENT ON TABLE hashtags IS 'Analytics table tracking hashtag usage across all posts';
COMMENT ON COLUMN hashtags.tag IS 'Lowercase hashtag text without the # symbol';
COMMENT ON COLUMN hashtags.post_count IS 'Total number of posts using this hashtag';
COMMENT ON COLUMN hashtags.last_used_at IS 'Timestamp of most recent post with this hashtag';


-- Step 2: Add hashtags column to social_posts (if it doesn't exist)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'social_posts' 
      AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE social_posts 
    ADD COLUMN hashtags JSONB DEFAULT '[]'::jsonb;
    
    RAISE NOTICE 'Added hashtags column to social_posts table';
  ELSE
    RAISE NOTICE 'hashtags column already exists in social_posts table';
  END IF;
END $$;

-- Create GIN index for fast hashtag searches
CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags 
ON social_posts USING gin(hashtags);

COMMENT ON COLUMN social_posts.hashtags IS 'JSONB array of lowercase hashtags extracted from post content';


-- Step 3: Create extract_hashtags utility function
-- ============================================================================
CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hashtags TEXT[];
BEGIN
  -- Return empty array if content is null or empty
  IF text_content IS NULL OR text_content = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Extract all hashtags using regex
  -- Pattern: #[a-zA-Z0-9_]+ (hashtag symbol followed by letters, numbers, underscores)
  -- Convert to lowercase and remove duplicates
  SELECT array_agg(DISTINCT lower(substring(match FROM 2)))
  INTO hashtags
  FROM regexp_matches(text_content, '(#[a-zA-Z0-9_]+)', 'g') AS match;
  
  -- Return empty array if no hashtags found
  RETURN COALESCE(hashtags, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION extract_hashtags(TEXT) IS 
'Extracts hashtags from text content. Returns array of lowercase hashtag strings without # symbol.';


-- Step 4: Create auto_extract_hashtags trigger function (THE FIX!)
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_extract_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_tags TEXT[];
  hashtag_text TEXT;
BEGIN
  -- Extract hashtags from content using utility function
  extracted_tags := extract_hashtags(NEW.content);
  
  -- Store hashtags in the post's hashtags column as JSONB array
  NEW.hashtags := to_jsonb(extracted_tags);
  
  -- Update hashtags analytics table for each hashtag
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

COMMENT ON FUNCTION auto_extract_hashtags() IS 
'Trigger function that extracts hashtags from post content and updates analytics. 
Fires BEFORE INSERT on social_posts table.';


-- Step 5: Create or replace the trigger
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_auto_extract_hashtags ON social_posts;

CREATE TRIGGER trigger_auto_extract_hashtags
  BEFORE INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_extract_hashtags();

COMMENT ON TRIGGER trigger_auto_extract_hashtags ON social_posts IS 
'Automatically extracts hashtags from post content before insert';


-- Step 6: Verify everything is set up correctly
-- ============================================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  column_exists BOOLEAN;
  extract_func_exists BOOLEAN;
  trigger_func_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Check hashtags table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'hashtags'
  ) INTO table_exists;
  
  -- Check hashtags column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_posts' AND column_name = 'hashtags'
  ) INTO column_exists;
  
  -- Check extract_hashtags function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'extract_hashtags'
  ) INTO extract_func_exists;
  
  -- Check auto_extract_hashtags function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'auto_extract_hashtags'
  ) INTO trigger_func_exists;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_auto_extract_hashtags'
  ) INTO trigger_exists;
  
  -- Report status
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'HASHTAG SYSTEM SETUP VERIFICATION';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'hashtags table:              %', CASE WHEN table_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'social_posts.hashtags column: %', CASE WHEN column_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'extract_hashtags() function:  %', CASE WHEN extract_func_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'auto_extract_hashtags() func: %', CASE WHEN trigger_func_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'trigger_auto_extract_hashtags: %', CASE WHEN trigger_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '====================================';
  
  IF table_exists AND column_exists AND extract_func_exists AND trigger_func_exists AND trigger_exists THEN
    RAISE NOTICE '✅ SUCCESS! All hashtag system components are installed!';
    RAISE NOTICE '📝 You can now create posts with hashtags!';
  ELSE
    RAISE EXCEPTION '❌ SETUP INCOMPLETE - Some components are missing!';
  END IF;
END $$;


-- Step 7: Test the system (optional - uncomment to test)
-- ============================================================================
-- This will create a test post, extract hashtags, and verify everything works
-- Uncomment the lines below to run a test

/*
DO $$
DECLARE
  test_post_id UUID;
  test_hashtags JSONB;
  test_tag_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TESTING HASHTAG EXTRACTION';
  RAISE NOTICE '====================================';
  
  -- Create test post with hashtags
  INSERT INTO social_posts (
    author_id,
    author_name,
    author_role,
    author_zone,
    content,
    likes,
    liked_by,
    comments
  ) VALUES (
    gen_random_uuid(),
    'Test User',
    'sales_executive',
    'Test Zone',
    'Testing the hashtag system! #marketvisit #airtel #saleswin #champion',
    0,
    ARRAY[]::TEXT[],
    ARRAY[]::JSONB[]
  )
  RETURNING id, hashtags INTO test_post_id, test_hashtags;
  
  RAISE NOTICE 'Created test post: %', test_post_id;
  RAISE NOTICE 'Extracted hashtags: %', test_hashtags;
  
  -- Check hashtags table
  SELECT COUNT(*) INTO test_tag_count
  FROM hashtags 
  WHERE tag IN ('marketvisit', 'airtel', 'saleswin', 'champion');
  
  RAISE NOTICE 'Hashtags in analytics table: %', test_tag_count;
  
  -- Cleanup test post
  DELETE FROM social_posts WHERE id = test_post_id;
  RAISE NOTICE 'Test post cleaned up';
  
  IF test_tag_count = 4 THEN
    RAISE NOTICE '✅ TEST PASSED! Hashtag system is working correctly!';
  ELSE
    RAISE NOTICE '⚠️  TEST WARNING: Expected 4 hashtags, found %', test_tag_count;
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
*/


-- ============================================================================
-- FINAL STATUS MESSAGE
-- ============================================================================
SELECT '✅ HASHTAG SYSTEM SETUP COMPLETE!' as status,
       'You can now create posts with hashtags in the Airtel Champions app!' as message;

SELECT 
  'Table: ' || table_name as component,
  'Columns: ' || count(*)::text as details
FROM information_schema.columns
WHERE table_name IN ('hashtags', 'social_posts')
GROUP BY table_name

UNION ALL

SELECT 
  'Function: ' || proname,
  'Language: ' || (SELECT lanname FROM pg_language WHERE oid = prolang)
FROM pg_proc
WHERE proname IN ('extract_hashtags', 'auto_extract_hashtags')

UNION ALL

SELECT
  'Trigger: ' || trigger_name,
  'Event: ' || event_manipulation || ' ' || action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_extract_hashtags';
