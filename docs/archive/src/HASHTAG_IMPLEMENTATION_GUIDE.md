# 🏷️ HASHTAG SYSTEM IMPLEMENTATION - Complete Guide

## ✅ PART 1: Database Setup (COMPLETED - Run SQL Migration)

### Step 1: Run the SQL Migration
```bash
Open Supabase Dashboard → SQL Editor → Paste contents of:
/database/HASHTAG_SYSTEM_MIGRATION.sql
```

This migration adds:
1. ✅ `hashtags` JSONB column to `social_posts` table
2. ✅ GIN index for fast hashtag searches
3. ✅ `hashtags` analytics table for trending tags
4. ✅ Auto-extraction trigger (extracts hashtags when posts are created)
5. ✅ Helper functions and views
6. ✅ Backfills existing posts with hashtags

**Verification:**
```sql
-- Check if hashtags column exists
SELECT * FROM social_posts LIMIT 1;

-- Check trending hashtags
SELECT * FROM trending_hashtags;

-- Test hashtag search
SELECT * FROM get_posts_by_hashtag('marketvisit', 50, 0);
```

---

## ✅ PART 2: Utility Functions (COMPLETED)

### Files Created:
1. **`/utils/hashtags.ts`** - Core hashtag utilities
   - `extractHashtags()` - Extract hashtags from text
   - `parseTextWithHashtags()` - Parse text into segments
   - `getHashtagStats()` - Get hashtag statistics
   - `filterPostsByHashtag()` - Filter posts by hashtag
   - Many more helper functions

2. **`/components/hashtag-components.tsx`** - React components
   - `<HashtagText>` - Displays text with clickable hashtags
   - `<HashtagChip>` - Individual hashtag badge
   - `<HashtagList>` - List of hashtags
   - `<TrendingHashtags>` - Trending hashtags widget
   - `<HashtagFilterBar>` - Active filter display

---

## 📝 PART 3: Integration Steps

### Step 1: Update Backend API to Store Hashtags

The database trigger automatically extracts hashtags, but we should also validate on the backend.

**File:** `/supabase/functions/server/social.tsx`

```typescript
import { extractHashtags } from '../../utils/hashtags';

// In the create post endpoint:
app.post('/make-server-28f2f653/posts', async (c) => {
  const { user_id, content, image_url, location } = await c.req.json();
  
  // Extract hashtags (the trigger will also do this, but good to validate)
  const hashtags = extractHashtags(content);
  
  // Limit hashtags (max 10)
  if (hashtags.length > 10) {
    return c.json({ error: 'Maximum 10 hashtags allowed' }, 400);
  }
  
  // Insert post (trigger will auto-add hashtags)
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      author_id: user_id,
      caption: content,
      photo_url: image_url,
      author_zone: location,
      // hashtags will be added by trigger
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return c.json({ success: true, post: data });
});

// Add new endpoint for hashtag search
app.get('/make-server-28f2f653/posts/hashtag/:tag', async (c) => {
  const tag = c.req.param('tag');
  const limit = c.req.query('limit') || '50';
  const offset = c.req.query('offset') || '0';
  
  // Use the database function
  const { data, error } = await supabase
    .rpc('get_posts_by_hashtag', {
      hashtag_filter: tag,
      limit_count: parseInt(limit),
      offset_count: parseInt(offset)
    });
  
  if (error) throw error;
  
  return c.json({ posts: data });
});

// Add endpoint for trending hashtags
app.get('/make-server-28f2f653/hashtags/trending', async (c) => {
  const { data, error } = await supabase
    .from('trending_hashtags')
    .select('*')
    .limit(20);
  
  if (error) throw error;
  
  return c.json({ hashtags: data });
});
```

### Step 2: Update Explore Feed Component

**File:** `/components/explore-feed.tsx`

Add these imports at the top:
```typescript
import { extractHashtags, getTopHashtags } from '../utils/hashtags';
import { 
  HashtagText, 
  HashtagList, 
  TrendingHashtags, 
  HashtagFilterBar 
} from './hashtag-components';
```

Add state for hashtags:
```typescript
const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
const [trendingHashtags, setTrendingHashtags] = useState<Array<{ tag: string; count: number }>>([]);
const [popularHashtags, setPopularHashtags] = useState<Array<{ tag: string; count: number }>>([]);
```

Add function to fetch trending hashtags:
```typescript
const fetchTrendingHashtags = async () => {
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/hashtags/trending`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      setTrendingHashtags(data.hashtags);
    }
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
  }
};
```

Update fetchPosts to support hashtag filtering:
```typescript
const fetchPosts = async () => {
  try {
    setLoading(true);
    
    let url: string;
    
    if (selectedHashtag) {
      // Fetch posts by hashtag
      url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/hashtag/${selectedHashtag}`;
    } else {
      // Regular fetch
      const zone = filter === 'my_zone' ? currentUser.zone : undefined;
      const queryParams = new URLSearchParams({
        filter: filter === 'my_zone' ? 'recent' : filter,
        ...(zone && { zone }),
        limit: '20',
        offset: '0'
      });
      url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts?${queryParams}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      setPosts(data.posts || []);
      
      // Calculate popular hashtags from loaded posts
      const popular = getTopHashtags(data.posts || [], 10);
      setPopularHashtags(popular);
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
  } finally {
    setLoading(false);
  }
};
```

Add hashtag click handler:
```typescript
const handleHashtagClick = (hashtag: string) => {
  console.log('📎 Hashtag clicked:', hashtag);
  setSelectedHashtag(hashtag);
  setFilter('recent'); // Reset filter to show all when searching hashtag
};

const handleClearHashtagFilter = () => {
  setSelectedHashtag(null);
  fetchPosts();
};
```

Update the UI to show hashtag components:
```typescript
// In the header section, add trending hashtags
{viewMode === 'public' && (
  <>
    {/* Filter buttons */}
    <div className="flex gap-2 mb-4">
      {/* existing filter buttons */}
    </div>
    
    {/* Trending Hashtags */}
    {!selectedHashtag && trendingHashtags.length > 0 && (
      <div className="mb-4">
        <TrendingHashtags 
          hashtags={trendingHashtags}
          onHashtagClick={handleHashtagClick}
          maxDisplay={8}
        />
      </div>
    )}
    
    {/* Active Hashtag Filter */}
    {selectedHashtag && (
      <HashtagFilterBar 
        selectedHashtag={selectedHashtag}
        onClearFilter={handleClearHashtagFilter}
        postCount={posts.length}
      />
    )}
  </>
)}
```

Replace plain text caption with HashtagText component:
```typescript
// OLD (Line ~597):
<p className="text-sm whitespace-pre-wrap">{post.content}</p>

// NEW:
<HashtagText 
  text={post.content}
  onHashtagClick={handleHashtagClick}
  className="text-sm whitespace-pre-wrap"
/>
```

Update useEffect to fetch trending hashtags:
```typescript
useEffect(() => {
  fetchPosts();
  fetchHallOfFame();
  fetchTrendingHashtags();
}, [filter, selectedHashtag]);
```

---

## 🎨 PART 4: UI Enhancements

### Popular Hashtags Section

Add below the filter tabs:
```typescript
{!selectedHashtag && popularHashtags.length > 0 && (
  <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
    <h3 className="text-sm font-semibold text-gray-700 mb-2">
      🏷️ Popular Tags
    </h3>
    <HashtagList 
      hashtags={popularHashtags}
      selectedHashtag={selectedHashtag}
      onHashtagClick={handleHashtagClick}
      maxDisplay={10}
      showCounts={true}
      variant="outline"
    />
  </div>
)}
```

### Hashtag Input Validation (Create Post Modal)

Add hashtag count validation when creating a post:
```typescript
import { validateHashtagCount, extractHashtags } from '../utils/hashtags';

const handleCreatePost = async () => {
  if (!newPostContent.trim()) {
    alert('Please write something');
    return;
  }
  
  // Validate hashtag count
  const validation = validateHashtagCount(newPostContent, 10);
  if (!validation.valid) {
    alert(validation.message);
    return;
  }
  
  // Show user which hashtags will be added
  const hashtags = extractHashtags(newPostContent);
  if (hashtags.length > 0) {
    console.log('📎 Post will include hashtags:', hashtags);
  }
  
  // Continue with post creation...
};
```

Add hashtag counter in the create post modal:
```typescript
{/* Inside create post modal */}
<div className="flex justify-between items-center text-xs text-gray-500 mt-2">
  <span>{newPostContent.length}/280 characters</span>
  {extractHashtags(newPostContent).length > 0 && (
    <span className="text-blue-600 font-medium">
      {extractHashtags(newPostContent).length} hashtag(s)
    </span>
  )}
</div>
```

---

## 🧪 PART 5: Testing Checklist

### Database Testing:
- [ ] Run SQL migration successfully
- [ ] Verify `hashtags` column exists in `social_posts`
- [ ] Check that `hashtags` table exists
- [ ] Test `extract_hashtags()` function
- [ ] Verify trigger works on new posts
- [ ] Check backfilled hashtags on existing posts

### Frontend Testing:
- [ ] Create a post with hashtags: "Great visit! #marketvisit #airtel"
- [ ] Verify hashtags are clickable and blue
- [ ] Click a hashtag and verify filter works
- [ ] Check trending hashtags appear
- [ ] Clear hashtag filter and verify all posts show
- [ ] Test popular hashtags section
- [ ] Verify hashtag count validation (max 10)
- [ ] Test empty state (no hashtags)

### API Testing:
- [ ] Test GET `/posts/hashtag/:tag` endpoint
- [ ] Test GET `/hashtags/trending` endpoint
- [ ] Verify posts endpoint returns hashtags field
- [ ] Check error handling for invalid hashtags

---

## 📊 PART 6: Analytics & Monitoring

### Queries to Run Regularly:

**Most Popular Hashtags (All Time):**
```sql
SELECT tag, post_count, last_used_at
FROM hashtags
ORDER BY post_count DESC
LIMIT 20;
```

**Trending Hashtags (Last 7 Days):**
```sql
SELECT * FROM trending_hashtags;
```

**Hashtag Usage by Zone:**
```sql
SELECT 
  sp.author_zone,
  jsonb_array_elements_text(sp.hashtags) as tag,
  COUNT(*) as usage_count
FROM social_posts sp
WHERE jsonb_array_length(sp.hashtags) > 0
GROUP BY sp.author_zone, tag
ORDER BY sp.author_zone, usage_count DESC;
```

**User Hashtag Activity:**
```sql
SELECT 
  u.full_name,
  COUNT(DISTINCT sp.id) as posts_with_hashtags,
  COUNT(*) as total_hashtags_used
FROM app_users u
JOIN social_posts sp ON u.id = sp.author_id
WHERE jsonb_array_length(sp.hashtags) > 0
GROUP BY u.id, u.full_name
ORDER BY posts_with_hashtags DESC
LIMIT 20;
```

---

## 🚀 PART 7: Deployment Steps

### Step 1: Database (Run First)
```bash
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste contents of /database/HASHTAG_SYSTEM_MIGRATION.sql
4. Click "Run"
5. Wait for success message
6. Verify with: SELECT * FROM trending_hashtags;
```

### Step 2: Backend (Update Server)
```bash
1. Update /supabase/functions/server/social.tsx
2. Add hashtag endpoints
3. Test locally: deno run --allow-all supabase/functions/server/index.tsx
4. Deploy to Supabase
```

### Step 3: Frontend (Update Components)
```bash
1. Utility functions already created (/utils/hashtags.ts)
2. Components already created (/components/hashtag-components.tsx)
3. Update /components/explore-feed.tsx (integration code above)
4. Test in browser
5. Deploy to Vercel/production
```

---

## ⚡ Quick Start (TL;DR)

1. **Run SQL:** Copy `/database/HASHTAG_SYSTEM_MIGRATION.sql` → Supabase SQL Editor → Run
2. **Update Backend:** Add hashtag endpoints to `/supabase/functions/server/social.tsx`
3. **Update Frontend:** Import hashtag components in `/components/explore-feed.tsx`
4. **Test:** Create post with `#test` and click it
5. **Done!** ✅

---

## 🎯 Success Metrics

After 1 week, check:
- **Adoption Rate:** % of posts with hashtags
- **Top Hashtags:** Which tags are most popular?
- **Click Rate:** How often are hashtags clicked?
- **Filter Usage:** How many users use hashtag filters?

**Target Metrics:**
- 40%+ of posts should include hashtags
- Top 5 hashtags should have 50+ posts each
- 20%+ of users should click hashtags weekly

---

## 🆘 Troubleshooting

### Issue: Hashtags not showing up
**Solution:** Check if trigger is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_extract_hashtags';
```

### Issue: Hashtags not clickable
**Solution:** Verify HashtagText component is imported and used

### Issue: Trending hashtags empty
**Solution:** Run backfill query:
```sql
-- Rebuild hashtags table
TRUNCATE TABLE hashtags;
INSERT INTO hashtags (tag, post_count, first_used_at, last_used_at)
SELECT 
  jsonb_array_elements_text(hashtags) as tag,
  COUNT(*) as post_count,
  MIN(created_at) as first_used_at,
  MAX(created_at) as last_used_at
FROM social_posts
WHERE jsonb_array_length(hashtags) > 0
GROUP BY tag;
```

### Issue: Slow hashtag searches
**Solution:** Verify GIN index exists:
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename = 'social_posts' AND indexname = 'idx_social_posts_hashtags';
```

---

## ✅ Ready to Implement!

All files are created. Next steps:

1. **YOU:** Run the SQL migration in Supabase
2. **ME:** Update explore-feed.tsx with hashtag integration
3. **ME:** Update backend API with hashtag endpoints
4. **WE:** Test and deploy!

Let me know when the SQL migration is complete, and I'll proceed with the code updates! 🚀
