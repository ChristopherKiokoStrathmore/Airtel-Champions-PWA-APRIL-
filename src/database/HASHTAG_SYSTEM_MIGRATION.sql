  -- ============================================================================
  -- HASHTAG SYSTEM IMPLEMENTATION - Database-Backed (Option B)
  -- ============================================================================
  -- This migration adds hashtag support to the Airtel Champions social feed
  -- with database-backed storage for fast queries and analytics.
  --
  -- Run this in Supabase SQL Editor
  -- ============================================================================
  
  -- ============================================================================
  -- STEP 1: Add hashtags field to social_posts table
  -- ============================================================================
  
  -- Add hashtags JSONB column to store array of hashtags
  ALTER TABLE social_posts 
  ADD COLUMN IF NOT EXISTS hashtags JSONB DEFAULT '[]'::jsonb;
  
  -- Add comment for documentation
  COMMENT ON COLUMN social_posts.hashtags IS 
  'Array of lowercase hashtags extracted from content (e.g., ["marketvisit", "clientmeeting"])';
  
  -- ============================================================================
  -- STEP 2: Create GIN index for fast hashtag searches
  -- ============================================================================
  
  -- GIN (Generalized Inverted Index) allows fast JSONB array searches
  CREATE INDEX IF NOT EXISTS idx_social_posts_hashtags 
  ON social_posts USING GIN (hashtags);
  
  COMMENT ON INDEX idx_social_posts_hashtags IS 
  'GIN index for fast hashtag searches using @> operator';
  
  -- ============================================================================
  -- STEP 3: Create hashtags analytics table (optional but recommended)
  -- ============================================================================
  
  -- This table tracks hashtag usage for trending/analytics
  CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    post_count INTEGER DEFAULT 0,
    first_used_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Index for sorting by popularity
  CREATE INDEX IF NOT EXISTS idx_hashtags_post_count 
  ON hashtags(post_count DESC, last_used_at DESC);
  
  -- Index for tag lookups
  CREATE INDEX IF NOT EXISTS idx_hashtags_tag 
  ON hashtags(tag);
  
  COMMENT ON TABLE hashtags IS 
  'Tracks hashtag usage statistics for trending and analytics';
  
  -- ============================================================================
  -- STEP 4: Create function to extract hashtags from text
  -- ============================================================================
  
  CREATE OR REPLACE FUNCTION extract_hashtags(text_content TEXT)
  RETURNS TEXT[]
  LANGUAGE plpgsql
  IMMUTABLE
  AS $$
  DECLARE
    hashtag_array TEXT[];
  BEGIN
    -- Extract all hashtags (words starting with #)
    -- Returns array of lowercase hashtags without the # symbol
    SELECT ARRAY(
      SELECT LOWER(match[1])
      FROM REGEXP_MATCHES(text_content, '#(\w+)', 'g') AS match
    ) INTO hashtag_array;
    
    RETURN COALESCE(hashtag_array, ARRAY[]::TEXT[]);
  END;
  $$;
  
  COMMENT ON FUNCTION extract_hashtags IS 
  'Extracts hashtags from text and returns array of lowercase tags';
  
  -- Test the function
  -- SELECT extract_hashtags('Great visit today! #marketvisit #clientmeeting #Airtel');
  -- Expected output: {marketvisit, clientmeeting, airtel}
  
  -- ============================================================================
  -- STEP 5: Create trigger to auto-extract hashtags on post creation
  -- ============================================================================
  
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
    -- Use qualified variable name to avoid ambiguity
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
  
  -- Create trigger for INSERT operations
  DROP TRIGGER IF EXISTS trigger_auto_extract_hashtags ON social_posts;
  CREATE TRIGGER trigger_auto_extract_hashtags
    BEFORE INSERT ON social_posts
    FOR EACH ROW
    EXECUTE FUNCTION auto_extract_hashtags();
  
  COMMENT ON TRIGGER trigger_auto_extract_hashtags ON social_posts IS 
  'Automatically extracts and stores hashtags when a post is created';
  
  -- ============================================================================
  -- STEP 6: Backfill hashtags for existing posts
  -- ============================================================================
  
  -- Extract hashtags from all existing posts
  UPDATE social_posts
  SET hashtags = to_jsonb(extract_hashtags(content))
  WHERE hashtags = '[]'::jsonb OR hashtags IS NULL;
  
  -- Rebuild hashtags analytics from existing posts
  TRUNCATE TABLE hashtags;
  
  INSERT INTO hashtags (tag, post_count, first_used_at, last_used_at)
  SELECT 
    jsonb_array_elements_text(hashtags) as tag,
    COUNT(*) as post_count,
    MIN(created_at) as first_used_at,
    MAX(created_at) as last_used_at
  FROM social_posts
  WHERE jsonb_array_length(hashtags) > 0
  GROUP BY tag
  ON CONFLICT (tag) DO NOTHING;
  
  -- ============================================================================
  -- STEP 7: Create helper views and functions
  -- ============================================================================
  
  -- View: Trending hashtags (last 7 days)
  CREATE OR REPLACE VIEW trending_hashtags AS
  SELECT 
    h.tag,
    COUNT(DISTINCT sp.id) as recent_post_count,
    h.post_count as total_post_count,
    MAX(sp.created_at) as last_used_at
  FROM hashtags h
  LEFT JOIN social_posts sp ON sp.hashtags @> to_jsonb(ARRAY[h.tag])
    AND sp.created_at >= NOW() - INTERVAL '7 days'
  WHERE sp.id IS NOT NULL
  GROUP BY h.tag, h.post_count
  ORDER BY recent_post_count DESC, h.post_count DESC
  LIMIT 20;
  
  COMMENT ON VIEW trending_hashtags IS 
  'Shows top 20 trending hashtags based on usage in last 7 days';
  
  -- Function: Get posts by hashtag
  CREATE OR REPLACE FUNCTION get_posts_by_hashtag(
    hashtag_filter TEXT,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
  )
  RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_role TEXT,
    content TEXT,
    image_url TEXT,
    hashtags JSONB,
    likes_count INTEGER,
    comments_count INTEGER,
    created_at TIMESTAMPTZ
  )
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN QUERY
    SELECT 
      sp.id,
      sp.author_id,
      sp.author_name,
      sp.author_role,
      sp.content,
      sp.image_url,
      sp.hashtags,
      sp.likes_count,
      sp.comments_count,
      sp.created_at
    FROM social_posts sp
    WHERE sp.hashtags @> to_jsonb(ARRAY[LOWER(hashtag_filter)])
    ORDER BY sp.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
  END;
  $$;
  
  COMMENT ON FUNCTION get_posts_by_hashtag IS 
  'Retrieves posts containing a specific hashtag, sorted by newest first';
  
  -- ============================================================================
  -- STEP 8: Create RLS policies for hashtags table
  -- ============================================================================
  
  -- Enable RLS
  ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
  
  -- Allow everyone to read hashtags
  CREATE POLICY "Allow read access to hashtags" 
  ON hashtags FOR SELECT 
  USING (true);
  
  -- Only system can modify hashtags (via triggers)
  CREATE POLICY "System only can modify hashtags" 
  ON hashtags FOR ALL 
  USING (false);
  
  -- ============================================================================
  -- STEP 9: Create useful queries for common operations
  -- ============================================================================
  
  -- Query 1: Get all posts with a specific hashtag
  -- SELECT * FROM get_posts_by_hashtag('marketvisit', 50, 0);
  
  -- Query 2: Get trending hashtags
  -- SELECT * FROM trending_hashtags;
  
  -- Query 3: Search posts by hashtag (alternative syntax)
  -- SELECT * FROM social_posts 
  -- WHERE hashtags @> '["marketvisit"]'
  -- ORDER BY created_at DESC;
  
  -- Query 4: Get posts with multiple hashtags (AND)
  -- SELECT * FROM social_posts 
  -- WHERE hashtags @> '["marketvisit", "airtel"]'
  -- ORDER BY created_at DESC;
  
  -- Query 5: Get posts with any of multiple hashtags (OR)
  -- SELECT * FROM social_posts 
  -- WHERE hashtags ?| ARRAY['marketvisit', 'clientmeeting']
  -- ORDER BY created_at DESC;
  
  -- Query 6: Count posts per hashtag
  -- SELECT 
  --   jsonb_array_elements_text(hashtags) as tag,
  --   COUNT(*) as post_count
  -- FROM social_posts
  -- WHERE jsonb_array_length(hashtags) > 0
  -- GROUP BY tag
  -- ORDER BY post_count DESC;
  
  -- ============================================================================
  -- VERIFICATION QUERIES
  -- ============================================================================
  
  -- Check if hashtags column exists
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'social_posts' AND column_name = 'hashtags';
  
  -- Check if index exists
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'social_posts' AND indexname = 'idx_social_posts_hashtags';
  
  -- Check if hashtags table exists
  SELECT COUNT(*) as hashtag_count FROM hashtags;
  
  -- Check if trigger exists
  SELECT trigger_name, event_manipulation, action_timing
  FROM information_schema.triggers
  WHERE event_object_table = 'social_posts' 
  AND trigger_name = 'trigger_auto_extract_hashtags';
  
  -- Sample data check
  SELECT 
    id,
    SUBSTRING(content, 1, 50) as content_preview,
    hashtags,
    created_at
  FROM social_posts
  WHERE jsonb_array_length(hashtags) > 0
  ORDER BY created_at DESC
  LIMIT 5;
  
  -- ============================================================================
  -- PERFORMANCE NOTES
  -- ============================================================================
  
  /*
  The GIN index allows these fast operations:
  
  1. Contains check (@>):
     WHERE hashtags @> '["marketvisit"]'
     → Returns posts containing "marketvisit"
     → Uses index, very fast even with 100,000+ posts
  
  2. Any of (？|):
     WHERE hashtags ?| ARRAY['tag1', 'tag2']
     → Returns posts with tag1 OR tag2
     → Uses index
  
  3. All of (?&):
     WHERE hashtags ?& ARRAY['tag1', 'tag2']
     → Returns posts with tag1 AND tag2
     → Uses index
  
  Index size: ~1-2% of table size for typical social media usage
  */
  
  -- ============================================================================
  -- SUCCESS MESSAGE
  -- ============================================================================
  
  DO $$
  BEGIN
    RAISE NOTICE '✅ HASHTAG SYSTEM INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update frontend to extract hashtags from post content';
    RAISE NOTICE '2. Display clickable hashtags in posts';
    RAISE NOTICE '3. Add hashtag filter UI to Explore page';
    RAISE NOTICE '4. Show trending hashtags';
    RAISE NOTICE '';
    RAISE NOTICE 'Example queries:';
    RAISE NOTICE '- Get posts by hashtag: SELECT * FROM get_posts_by_hashtag(''marketvisit'', 50, 0);';
    RAISE NOTICE '- Get trending tags: SELECT * FROM trending_hashtags;';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Ready to use!';
  END $$;
