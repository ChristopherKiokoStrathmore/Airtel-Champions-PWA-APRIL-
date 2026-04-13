import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Social] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Social] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

async function safeKvDel(key: string): Promise<boolean> {
  try {
    await kv.del(key);
    return true;
  } catch (err: any) {
    console.warn(`[Social] KV del("${key}") failed: ${err.message}.`);
    return false;
  }
}

async function safeKvGetByPrefix(prefix: string): Promise<any[]> {
  try {
    return await kv.getByPrefix(prefix);
  } catch (err: any) {
    console.warn(`[Social] KV getByPrefix("${prefix}") failed: ${err.message}. Returning [].`);
    return [];
  }
}

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.toLowerCase()).slice(0, 5) : []; // Max 5 hashtags
}

// Calculate post visibility score for trending algorithm
function calculatePostScore(post: any): number {
  const now = Date.now();
  const postAge = now - new Date(post.created_at).getTime();
  const hoursSincePost = postAge / (1000 * 60 * 60);
  
  // Time decay factor (newer posts boosted)
  const timeFreshness = Math.max(0, 100 - (hoursSincePost * 2));
  
  const score = (
    (post.likes_count * 1.0) +
    (post.comments_count * 2.0) +
    (post.reshares_count * 3.0) +
    (timeFreshness * 0.5) +
    (post.is_hall_of_fame ? 1000 : 0)
  );
  
  return score;
}

// Calculate points earned from a post
function calculatePostPoints(post: any): number {
  const basePoints = 10;
  const likeBonus = post.likes_count * 1;
  const commentBonus = post.comments_count * 2;
  const reshareBonus = post.reshares_count * 5;
  
  // Trending threshold
  const score = calculatePostScore(post);
  const trendingBonus = score > 200 ? 50 : 0;
  
  return basePoints + likeBonus + commentBonus + reshareBonus + trendingBonus;
}

// ============================================================================
// CREATE POST
// ============================================================================

app.post("/posts", async (c) => {
  try {
    const body = await c.req.json();
    const { 
      user_id, 
      content, 
      image_url, 
      submission_id, 
      program_id,
      location,
      program_name
    } = body;

    if (!user_id || !content) {
      return c.json({ error: 'user_id and content are required' }, 400);
    }

    // Validate content length (280 chars)
    if (content.length > 280) {
      return c.json({ error: 'Content must be 280 characters or less' }, 400);
    }

    // Extract hashtags
    const hashtags = extractHashtags(content);

    // Create post
    const postId = `post_${Date.now()}_${user_id}`;
    const post = {
      id: postId,
      user_id,
      content,
      image_url: image_url || null,
      submission_id: submission_id || null,
      program_id: program_id || null,
      program_name: program_name || null,
      location: location || null,
      likes_count: 0,
      comments_count: 0,
      reshares_count: 0,
      shares_count: 0,
      is_hall_of_fame: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await safeKvSet(postId, JSON.stringify(post));

    // Store hashtags
    for (const tag of hashtags) {
      const tagKey = `tag:${tag}:${postId}`;
      await safeKvSet(tagKey, JSON.stringify({ post_id: postId, tag, created_at: post.created_at }));
    }

    // Award base points (10 points for creating a post)
    const userPointsKey = `user_points:${user_id}`;
    const { value: currentPoints } = await safeKvGet(userPointsKey);
    const newPoints = (currentPoints ? parseInt(currentPoints as string) : 0) + 10;
    await safeKvSet(userPointsKey, newPoints.toString());

    return c.json({ 
      success: true, 
      post,
      points_earned: 10
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return c.json({ error: error.message || 'Failed to create post' }, 500);
  }
});

// ============================================================================
// GET FEED
// ============================================================================

app.get("/posts", async (c) => {
  try {
    const user_id = c.req.query('user_id'); // Optional user_id filter
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get all posts from KV store (with error handling for database degradation)
    let allPostsKeys: any[] = [];
    try {
      allPostsKeys = await safeKvGetByPrefix('post_');
    } catch (kvError: any) {
      console.error('[Feed] ❌ KV Store error (database degraded):', kvError.message);
      // Return empty feed if database is unavailable
      return c.json({ 
        success: true, 
        posts: [],
        total: 0,
        hasMore: false,
        message: 'Feed temporarily unavailable - database migration in progress'
      });
    }
    
    // Handle empty posts gracefully
    if (!allPostsKeys || allPostsKeys.length === 0) {
      return c.json({ 
        success: true, 
        posts: [], 
        total: 0,
        hasMore: false,
        message: 'No posts yet. Be the first to share!'
      });
    }
    
    let posts: any[] = [];

    for (const item of allPostsKeys) {
      try {
        const post = JSON.parse(item.value as string);
        
        // Skip hidden posts
        if (post.is_hidden) continue;

        // User ID filtering (for profile view)
        if (user_id && post.user_id !== user_id) continue;

        // Get user info from cache
        const { value: userDataValue } = await safeKvGet(`user:${post.user_id}`);
        let userData: any = null;
        
        if (userDataValue) {
          userData = JSON.parse(userDataValue as string);
        } else {
          // Try to get from user_points which has basic info
          const userPointsData = await safeKvGet(`user_points:${post.user_id}`);
          
          // If still no user data, skip this post
          if (!userPointsData) {
            console.log(`Skipping post ${post.id} - user ${post.user_id} not found in cache`);
            continue;
          }
          
          // Create minimal user data
          userData = {
            id: post.user_id,
            full_name: 'Sales Executive',
            role: 'se',
            zone: 'Unknown',
            region: 'Unknown'
          };
        }

        if (!userData) continue; // Skip if user not found

        // Attach user info to post
        post.user = {
          id: userData.id,
          full_name: userData.full_name,
          role: userData.role,
          zone: userData.zone,
          region: userData.region,
          profile_image: userData.profile_image || null
        };

        // Calculate score for sorting
        post.score = calculatePostScore(post);

        posts.push(post);
      } catch (err) {
        console.error('Error parsing post:', err);
        continue;
      }
    }

    // Sort based on score (trending)
    posts.sort((a, b) => b.score - a.score);

    // Pagination
    const paginatedPosts = posts.slice(offset, offset + limit);

    return c.json({ 
      success: true, 
      posts: paginatedPosts,
      total: posts.length,
      hasMore: posts.length > offset + limit
    });
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return c.json({ error: error.message || 'Failed to fetch feed' }, 500);
  }
});

// ============================================================================
// GET HALL OF FAME
// ============================================================================

app.get("/posts/hall-of-fame", async (c) => {
  try {
    // Get all posts from KV store (with error handling for database degradation)
    let allPostsKeys: any[] = [];
    try {
      allPostsKeys = await safeKvGetByPrefix('post_');
    } catch (kvError: any) {
      console.error('[Hall of Fame] ❌ KV Store error (database degraded):', kvError.message);
      // Return empty hall of fame if database is unavailable
      return c.json({ 
        success: true, 
        posts: [],
        message: 'Hall of Fame temporarily unavailable - database migration in progress'
      });
    }
    
    let hallOfFamePosts: any[] = [];

    for (const item of allPostsKeys) {
      try {
        const post = JSON.parse(item.value as string);
        
        // Only hall of fame posts
        if (!post.is_hall_of_fame || post.is_hidden) continue;

        // Get user info from cache only
        const { value: userDataValue } = await safeKvGet(`user:${post.user_id}`);
        let userData: any = null;
        
        if (userDataValue) {
          userData = JSON.parse(userDataValue as string);
        } else {
          // Create minimal user data if not cached
          userData = {
            id: post.user_id,
            full_name: 'Sales Executive',
            role: 'se',
            zone: 'Unknown',
            region: 'Unknown'
          };
        }

        if (!userData) continue;

        post.user = {
          id: userData.id,
          full_name: userData.full_name,
          role: userData.role,
          zone: userData.zone,
          region: userData.region,
          profile_image: userData.profile_image || null
        };

        hallOfFamePosts.push(post);
      } catch (err) {
        console.error('Error parsing hall of fame post:', err);
        continue;
      }
    }

    // Sort by created_at (newest first)
    hallOfFamePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Limit to 10 posts
    hallOfFamePosts = hallOfFamePosts.slice(0, 10);

    return c.json({ 
      success: true, 
      posts: hallOfFamePosts
    });
  } catch (error: any) {
    console.error('Error fetching hall of fame:', error);
    return c.json({ error: error.message || 'Failed to fetch hall of fame' }, 500);
  }
});

// ============================================================================
// LIKE POST
// ============================================================================

app.post("/posts/:id/like", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id } = await c.req.json();

    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Check if user already liked
    const likeKey = `like:${postId}:${user_id}`;
    const { value: existingLike } = await safeKvGet(likeKey);

    let action = '';
    if (existingLike) {
      // Unlike
      await safeKvDel(likeKey);
      post.likes_count = Math.max(0, post.likes_count - 1);
      action = 'unliked';
    } else {
      // Like
      await safeKvSet(likeKey, JSON.stringify({ 
        post_id: postId, 
        user_id, 
        created_at: new Date().toISOString() 
      }));
      post.likes_count++;
      action = 'liked';

      // Award 1 point to post owner
      const ownerPointsKey = `user_points:${post.user_id}`;
      const { value: currentPoints } = await safeKvGet(ownerPointsKey);
      const newPoints = (currentPoints ? parseInt(currentPoints as string) : 0) + 1;
      await safeKvSet(ownerPointsKey, newPoints.toString());
    }

    // Update post
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    return c.json({ 
      success: true, 
      action,
      likes_count: post.likes_count
    });
  } catch (error: any) {
    console.error('Error liking post:', error);
    return c.json({ error: error.message || 'Failed to like post' }, 500);
  }
});

// ============================================================================
// COMMENT ON POST
// ============================================================================

app.post("/posts/:id/comment", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, comment_text } = await c.req.json();

    if (!user_id || !comment_text) {
      return c.json({ error: 'user_id and comment_text are required' }, 400);
    }

    if (comment_text.length > 500) {
      return c.json({ error: 'Comment must be 500 characters or less' }, 400);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Create comment
    const commentId = `comment_${Date.now()}_${user_id}`;
    const comment = {
      id: commentId,
      post_id: postId,
      user_id,
      comment_text,
      created_at: new Date().toISOString()
    };

    await safeKvSet(`comment:${commentId}`, JSON.stringify(comment));

    // Update post comment count
    post.comments_count++;
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    // Award 2 points to post owner
    const ownerPointsKey = `user_points:${post.user_id}`;
    const { value: currentPoints } = await safeKvGet(ownerPointsKey);
    const newPoints = (currentPoints ? parseInt(currentPoints as string) : 0) + 2;
    await safeKvSet(ownerPointsKey, newPoints.toString());

    // Get commenter info from cache
    const { value: userDataValue } = await safeKvGet(`user:${user_id}`);
    let userData: any = null;
    
    if (userDataValue) {
      userData = JSON.parse(userDataValue as string);
    } else {
      // Use minimal user data if not cached
      userData = {
        id: user_id,
        full_name: 'User',
        role: 'se'
      };
    }

    // Attach user info to comment
    comment.user = userData ? {
      id: userData.id,
      full_name: userData.full_name,
      role: userData.role,
      zone: userData.zone,
      profile_image: userData.profile_image || null
    } : null;

    return c.json({ 
      success: true, 
      comment,
      comments_count: post.comments_count
    });
  } catch (error: any) {
    console.error('Error commenting on post:', error);
    return c.json({ error: error.message || 'Failed to comment on post' }, 500);
  }
});

// ============================================================================
// GET COMMENTS FOR POST
// ============================================================================

app.get("/posts/:id/comments", async (c) => {
  try {
    const postId = c.req.param('id');

    // Get all comments for this post (with error handling for database degradation)
    let allCommentsKeys: any[] = [];
    try {
      allCommentsKeys = await safeKvGetByPrefix('comment:');
    } catch (kvError: any) {
      console.error('[Comments] ❌ KV Store error (database degraded):', kvError.message);
      // Return empty comments if database is unavailable
      return c.json({ 
        success: true, 
        comments: [],
        message: 'Comments temporarily unavailable - database migration in progress'
      });
    }
    
    let comments: any[] = [];

    for (const item of allCommentsKeys) {
      try {
        const comment = JSON.parse(item.value as string);
        
        if (comment.post_id !== postId) continue;

        // Get commenter info
        const { value: userDataValue } = await safeKvGet(`user:${comment.user_id}`);
        let userData: any = null;
        
        if (userDataValue) {
          userData = JSON.parse(userDataValue as string);
        } else {
          // Use minimal user data if not cached
          userData = {
            id: comment.user_id,
            full_name: 'User',
            role: 'se',
            zone: 'Unknown',
            profile_image: null
          };
        }

        comment.user = userData ? {
          id: userData.id,
          full_name: userData.full_name,
          role: userData.role,
          zone: userData.zone,
          profile_image: userData.profile_image || null
        } : null;

        comments.push(comment);
      } catch (err) {
        console.error('Error parsing comment:', err);
        continue;
      }
    }

    // Sort by created_at (oldest first)
    comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return c.json({ 
      success: true, 
      comments
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return c.json({ error: error.message || 'Failed to fetch comments' }, 500);
  }
});

// ============================================================================
// DELETE COMMENT
// ============================================================================

app.delete("/posts/:postId/comments/:commentId", async (c) => {
  try {
    const postId = c.req.param('postId');
    const commentId = c.req.param('commentId');
    const { user_id } = await c.req.json();

    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get comment
    const { value: commentValue } = await safeKvGet(`comment:${commentId}`);
    if (!commentValue) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const comment = JSON.parse(commentValue as string);

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Check if user is comment owner or post owner
    if (comment.user_id !== user_id && post.user_id !== user_id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Delete comment
    await safeKvDel(`comment:${commentId}`);

    // Update post comment count
    post.comments_count = Math.max(0, post.comments_count - 1);
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    return c.json({ 
      success: true,
      comments_count: post.comments_count
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return c.json({ error: error.message || 'Failed to delete comment' }, 500);
  }
});

// ============================================================================
// RESHARE POST
// ============================================================================

app.post("/posts/:id/reshare", async (c) => {
  try {
    const originalPostId = c.req.param('id');
    const { user_id, caption } = await c.req.json();

    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get original post
    const { value: originalPostValue } = await safeKvGet(originalPostId);
    if (!originalPostValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const originalPost = JSON.parse(originalPostValue as string);

    // Create reshare post
    const reshareId = `post_${Date.now()}_${user_id}_reshare`;
    const reshare = {
      id: reshareId,
      user_id,
      content: caption || `Reshared: ${originalPost.content}`,
      image_url: originalPost.image_url,
      submission_id: null,
      program_id: null,
      program_name: null,
      location: originalPost.location,
      original_post_id: originalPostId,
      original_user_id: originalPost.user_id,
      likes_count: 0,
      comments_count: 0,
      reshares_count: 0,
      shares_count: 0,
      is_hall_of_fame: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await safeKvSet(reshareId, JSON.stringify(reshare));

    // Update original post reshare count
    originalPost.reshares_count++;
    originalPost.updated_at = new Date().toISOString();
    await safeKvSet(originalPostId, JSON.stringify(originalPost));

    // Award 5 points to original post owner
    const ownerPointsKey = `user_points:${originalPost.user_id}`;
    const { value: currentPoints } = await safeKvGet(ownerPointsKey);
    const newPoints = (currentPoints ? parseInt(currentPoints as string) : 0) + 5;
    await safeKvSet(ownerPointsKey, newPoints.toString());

    return c.json({ 
      success: true, 
      reshare,
      points_earned: 10 // User who reshared earns 10 points
    });
  } catch (error: any) {
    console.error('Error resharing post:', error);
    return c.json({ error: error.message || 'Failed to reshare post' }, 500);
  }
});

// ============================================================================
// SHARE POST (External/Internal)
// ============================================================================

app.post("/posts/:id/share", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, share_type } = await c.req.json(); // share_type: 'whatsapp', 'sms', 'internal'

    if (!user_id || !share_type) {
      return c.json({ error: 'user_id and share_type are required' }, 400);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Track share
    const shareId = `share_${Date.now()}_${user_id}`;
    await safeKvSet(`share:${shareId}`, JSON.stringify({
      id: shareId,
      post_id: postId,
      user_id,
      share_type,
      created_at: new Date().toISOString()
    }));

    // Update post share count
    post.shares_count++;
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    // Generate share URL/text
    const shareUrl = `https://tai.airtel.ke/posts/${postId}`;
    const shareText = `Check out this from TAI: ${post.content.substring(0, 100)}... ${shareUrl}`;

    return c.json({ 
      success: true, 
      share_url: shareUrl,
      share_text: shareText,
      shares_count: post.shares_count
    });
  } catch (error: any) {
    console.error('Error sharing post:', error);
    return c.json({ error: error.message || 'Failed to share post' }, 500);
  }
});

// ============================================================================
// REPORT POST
// ============================================================================

app.post("/posts/:id/report", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, reason } = await c.req.json();

    if (!user_id || !reason) {
      return c.json({ error: 'user_id and reason are required' }, 400);
    }

    // Create report
    const reportId = `report_${Date.now()}_${user_id}`;
    const report = {
      id: reportId,
      post_id: postId,
      user_id,
      reason,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await safeKvSet(`report:${reportId}`, JSON.stringify(report));

    return c.json({ 
      success: true, 
      message: 'Post reported successfully'
    });
  } catch (error: any) {
    console.error('Error reporting post:', error);
    return c.json({ error: error.message || 'Failed to report post' }, 500);
  }
});

// ============================================================================
// DELETE POST (Soft Delete)
// ============================================================================

app.delete("/posts/:id", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, role } = await c.req.json();

    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Check permissions
    const canDelete = (
      post.user_id === user_id || // Post owner
      role === 'director' || // Director
      role === 'hq_staff' || // HQ
      role === 'zonal_business_manager' || // ZBM
      role === 'zonal_sales_manager' // ZSM
    );

    if (!canDelete) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Soft delete (hide post)
    post.is_hidden = true;
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    return c.json({ 
      success: true, 
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return c.json({ error: error.message || 'Failed to delete post' }, 500);
  }
});

// ============================================================================
// NOMINATE FOR HALL OF FAME (ZBM)
// ============================================================================

app.post("/posts/:id/nominate", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, role } = await c.req.json();

    if (!user_id || !role) {
      return c.json({ error: 'user_id and role are required' }, 400);
    }

    // Only ZBMs can nominate
    if (role !== 'zonal_business_manager') {
      return c.json({ error: 'Only ZBMs can nominate posts' }, 403);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Create nomination
    const nominationId = `nomination_${Date.now()}_${user_id}`;
    const nomination = {
      id: nominationId,
      post_id: postId,
      nominated_by: user_id,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await safeKvSet(`nomination:${nominationId}`, JSON.stringify(nomination));

    return c.json({ 
      success: true, 
      message: 'Post nominated for Hall of Fame'
    });
  } catch (error: any) {
    console.error('Error nominating post:', error);
    return c.json({ error: error.message || 'Failed to nominate post' }, 500);
  }
});

// ============================================================================
// ESCALATE TO HALL OF FAME (HQ/Director)
// ============================================================================

app.post("/posts/:id/escalate", async (c) => {
  try {
    const postId = c.req.param('id');
    const { user_id, role } = await c.req.json();

    if (!user_id || !role) {
      return c.json({ error: 'user_id and role are required' }, 400);
    }

    // Only Directors/HQ can escalate
    if (role !== 'director' && role !== 'hq_staff') {
      return c.json({ error: 'Only Directors/HQ can escalate posts to Hall of Fame' }, 403);
    }

    // Get post
    const { value: postValue } = await safeKvGet(postId);
    if (!postValue) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const post = JSON.parse(postValue as string);

    // Add to Hall of Fame
    post.is_hall_of_fame = true;
    post.hall_of_fame_added_by = user_id;
    post.hall_of_fame_added_at = new Date().toISOString();
    post.updated_at = new Date().toISOString();
    await safeKvSet(postId, JSON.stringify(post));

    // Award 100 bonus points to post owner
    const ownerPointsKey = `user_points:${post.user_id}`;
    const { value: currentPoints } = await safeKvGet(ownerPointsKey);
    const newPoints = (currentPoints ? parseInt(currentPoints as string) : 0) + 100;
    await safeKvSet(ownerPointsKey, newPoints.toString());

    return c.json({ 
      success: true, 
      message: 'Post added to Hall of Fame',
      bonus_points: 100
    });
  } catch (error: any) {
    console.error('Error escalating post:', error);
    return c.json({ error: error.message || 'Failed to escalate post' }, 500);
  }
});

// ============================================================================
// GET USER PROFILE
// ============================================================================

app.get("/users/:id/profile", async (c) => {
  try {
    const userId = c.req.param('id');

    // Get user data
    const { value: userDataValue } = await safeKvGet(`user:${userId}`);
    let userData: any = null;
    
    if (userDataValue) {
      userData = JSON.parse(userDataValue as string);
    } else {
      // Use minimal user data if not cached
      userData = {
        id: userId,
        full_name: 'User',
        role: 'se',
        zone: 'Unknown',
        region: 'Unknown'
      };
    }

    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get user's posts
    const allPostsKeys = await safeKvGetByPrefix('post_');
    let userPosts: any[] = [];
    let totalLikes = 0;
    let totalReshares = 0;

    for (const item of allPostsKeys) {
      try {
        const post = JSON.parse(item.value as string);
        
        if (post.user_id !== userId || post.is_hidden) continue;

        userPosts.push(post);
        totalLikes += post.likes_count;
        totalReshares += post.reshares_count;
      } catch (err) {
        console.error('Error parsing post:', err);
        continue;
      }
    }

    // Sort posts by created_at (newest first)
    userPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Get user points
    const { value: pointsValue } = await safeKvGet(`user_points:${userId}`);
    const totalPoints = pointsValue ? parseInt(pointsValue as string) : 0;

    // Get user rank (from leaderboard)
    // This is a simplified version - in production, you'd calculate this from all users
    const rank = 0; // TODO: Calculate actual rank

    const profile = {
      user: {
        id: userData.id,
        full_name: userData.full_name,
        role: userData.role,
        zone: userData.zone,
        region: userData.region,
        profile_image: userData.profile_image || null,
        bio: userData.bio || null
      },
      stats: {
        total_posts: userPosts.length,
        total_likes: totalLikes,
        total_reshares: totalReshares,
        total_points: totalPoints,
        rank
      },
      posts: userPosts
    };

    return c.json({ 
      success: true, 
      profile
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: error.message || 'Failed to fetch user profile' }, 500);
  }
});

// ============================================================================
// CHECK IF USER LIKED POST
// ============================================================================

app.get("/posts/:id/liked", async (c) => {
  try {
    const postId = c.req.param('id');
    const userId = c.req.query('user_id');

    if (!userId) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    const likeKey = `like:${postId}:${userId}`;
    const { value: existingLike } = await safeKvGet(likeKey);

    return c.json({ 
      success: true, 
      liked: !!existingLike
    });
  } catch (error: any) {
    console.error('Error checking like status:', error);
    return c.json({ error: error.message || 'Failed to check like status' }, 500);
  }
});

export default app;