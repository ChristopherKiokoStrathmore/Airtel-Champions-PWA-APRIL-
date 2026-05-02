// Admin Utilities & Developer Routes
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import { initializeStorageBucket } from "./storage-setup.tsx";

const app = new Hono();

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Admin] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

// Direct DB mode: Uses X-User-Id header instead of JWT auth
async function authenticateUser(req: any) {
  const userId = req.header ? req.header('X-User-Id') : null;
  if (!userId) {
    throw new Error('Missing X-User-Id header - not authenticated');
  }

  const { data: userData, error } = await supabase
    .from('app_users')
    .select('id, role, full_name, email, region, zone')
    .eq('id', userId)
    .single();

  if (error || !userData) {
    throw new Error('User not found in app_users');
  }

  return { id: userData.id, user_metadata: { full_name: userData.full_name }, ...userData };
}

async function requireAdmin(req: any) {
  const user = await authenticateUser(req);

  const { data: userData, error } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    throw new Error('User not found');
  }

  const adminRoles = [
    'admin',
    'zsm',
    'asm',
    'rsm',
    'director',
    'hbb_hq_admin',
    'hq_command_center',
    'zonal_business_manager',
    'zonal_sales_manager',
  ];
  if (!adminRoles.includes(userData.role)) {
    throw new Error('Insufficient permissions - admin access required');
  }

  return { user, role: userData.role };
}

// ============================================================================
// ADMIN UTILITIES
// ============================================================================

// Recalculate user points
app.post("/make-server-28f2f653/admin/recalculate-points", async (c) => {
  try {
    const { user } = await requireAdmin(c.req);

    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('points_awarded')
      .eq('se_id', userId)
      .eq('status', 'approved');

    if (error) {
      throw error;
    }

    const totalPoints = submissions?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0;

    return c.json({ 
      success: true, 
      data: {
        userId,
        totalPoints,
        totalSubmissions: submissions?.length || 0,
      }
    });

  } catch (error: any) {
    console.error('Error recalculating points:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Refresh materialized views
app.post("/make-server-28f2f653/admin/refresh-views", async (c) => {
  try {
    const { user } = await requireAdmin(c.req);
    
    return c.json({ 
      success: true, 
      message: 'View refresh initiated (run SQL manually or via cron)',
      views: [
        'mv_leaderboard',
        'mv_daily_analytics', 
        'mv_weekly_analytics',
        'mv_regional_performance'
      ]
    });

  } catch (error: any) {
    console.error('Error refreshing views:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

app.post("/make-server-28f2f653/webhooks", async (c) => {
  try {
    const body = await c.req.json();
    const { event, data } = body;

    if (!event || !data) {
      return c.json({ error: 'Invalid webhook payload' }, 400);
    }

    // Handle different events
    switch (event) {
      case 'submission_created':
        // Handle submission created event
        console.log('[Webhook] Submission created:', data);
        break;
      default:
        return c.json({ error: 'Unknown event type' }, 400);
    }

    return c.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============================================================================
// DEVELOPER UTILITIES
// ============================================================================

// Seed sample posts
app.post("/make-server-28f2f653/seed-posts", async (c) => {
  try {
    console.log('[SeedPosts] Creating sample posts for demo');
    
    const { data: users, error } = await supabase
      .from('app_users')
      .select('id, full_name, zone, role')
      .in('role', ['sales_executive', 'zonal_sales_manager', 'director'])
      .limit(10);

    if (error || !users || users.length === 0) {
      return c.json({ error: 'No users found to create posts' }, 400);
    }

    const samplePosts = [
      { content: "Just completed a market survey in #Nairobi. Competitor activity is high near CBD! #MarketIntel", zone: "NAIROBI EAST" },
      { content: "Airtel network quality excellent in #Mombasa coastal region. Customers very satisfied! #NetworkQuality #CompetitorIntel", zone: "COAST" },
      { content: "Visited 15 shops today. #Safaricom has new promotion running. We need to respond! #CompetitorIntel #SalesWin", zone: "MT KENYA" },
      { content: "Great customer feedback on our new data packages! #CustomerInsights #SalesWin", zone: "EASTERN" },
      { content: "Network coverage improving in rural areas of #Aberdare. Seeing more customer activations! #NetworkQuality", zone: "ABERDARE" },
    ];

    const createdPosts = [];

    for (let i = 0; i < samplePosts.length; i++) {
      const user = users[i % users.length];
      const postContent = samplePosts[i];
      
      const postId = `post_${Date.now()}_${user.id}_${i}`;
      const post = {
        id: postId,
        user_id: user.id,
        content: postContent.content,
        image_url: null,
        location: postContent.zone,
        likes_count: Math.floor(Math.random() * 20),
        comments_count: Math.floor(Math.random() * 10),
        reshares_count: Math.floor(Math.random() * 5),
        shares_count: 0,
        is_hall_of_fame: false,
        is_hidden: false,
        created_at: new Date(Date.now() - (i * 3600000)).toISOString(),
        updated_at: new Date().toISOString()
      };

      await safeKvSet(postId, JSON.stringify(post));
      await safeKvSet(`user:${user.id}`, JSON.stringify(user));
      
      createdPosts.push(post);
    }

    console.log(`[SeedPosts] ✅ Created ${createdPosts.length} sample posts`);

    return c.json({ 
      success: true,
      message: `Created ${createdPosts.length} sample posts`,
      posts: createdPosts
    });

  } catch (error: any) {
    console.error('[SeedPosts] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create storage buckets
app.post("/make-server-28f2f653/create-buckets", async (c) => {
  try {
    console.log('[CreateBuckets] Manually creating storage buckets');
    
    const storageResult = await initializeStorageBucket();
    
    if (storageResult.success) {
      console.log('[CreateBuckets] ✅ All buckets created successfully');
      return c.json({
        success: true,
        message: 'All storage buckets created successfully',
        buckets: storageResult.results
      });
    } else {
      console.error('[CreateBuckets] ⚠️ Some buckets failed to create');
      return c.json({
        success: false,
        message: 'Some buckets failed to create',
        buckets: storageResult.results
      }, 500);
    }
    
  } catch (error: any) {
    console.error('[CreateBuckets] Error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Upload image
app.post("/make-server-28f2f653/upload-image", async (c) => {
  try {
    console.log('[UploadImage] Processing image upload');
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;
    const bucketType = formData.get('bucket_type') as string || 'postImages';
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    if (!userId) {
      return c.json({ error: 'user_id is required' }, 400);
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.' }, 400);
    }
    
    const maxSize = bucketType === 'postImages' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ 
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.` 
      }, 400);
    }
    
    const bucketName = bucketType === 'postImages' 
      ? 'make-28f2f653-post-images' 
      : 'make-28f2f653-profile-photos';
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${bucketType}_${userId}_${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('[UploadImage] Upload error:', uploadError);
      return c.json({ error: 'Internal server error' }, 500);
    }
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('[UploadImage] Failed to get public URL');
      return c.json({ error: 'Failed to get image URL' }, 500);
    }
    
    console.log(`[UploadImage] ✅ Image uploaded successfully: ${urlData.publicUrl}`);
    
    return c.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    });
    
  } catch (error: any) {
    console.error('[UploadImage] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all ZSMs
app.get("/make-server-28f2f653/users/zsms", async (c) => {
  try {
    console.log('[GetZSMs] Fetching all ZSMs from database');
    
    const { data: zsms, error } = await supabase
      .from('app_users')
      .select('employee_id, full_name, zone')
      .eq('role', 'zonal_sales_manager')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[GetZSMs] Error fetching ZSMs:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }

    console.log(`[GetZSMs] ✅ Found ${zsms?.length || 0} ZSMs`);

    return c.json({ 
      success: true, 
      zsms: zsms || [],
      count: zsms?.length || 0
    });

  } catch (error: any) {
    console.error('[GetZSMs] Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reset all points
app.post("/make-server-28f2f653/reset-all-points", async (c) => {
  try {
    console.log('[ResetPoints] 🔴 RESET ALL POINTS requested');
    
    const { data: users, error: fetchError } = await supabase
      .from('app_users')
      .select('id');

    if (fetchError) {
      console.error('[ResetPoints] Error fetching users:', fetchError);
      return c.json({ error: 'Internal server error' }, 500);
    }

    console.log(`[ResetPoints] Found ${users?.length || 0} users to reset`);

    const { data: updatedUsers, error: updateError } = await supabase
      .from('app_users')
      .update({
        total_points: 0,
        weekly_points: 0,
        monthly_points: 0,
        total_submissions: 0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError) {
      console.error('[ResetPoints] Error resetting points:', updateError);
      return c.json({ error: 'Internal server error' }, 500);
    }

    console.log(`[ResetPoints] ✅ Successfully reset points for all users`);
    
    return c.json({
      success: true,
      message: 'All user points have been reset to zero',
      usersUpdated: users?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[ResetPoints] Unexpected error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Deprecated endpoint
app.post("/make-server-28f2f653/groups/users-hierarchy", async (c) => {
  try {
    console.log('[GetUsersHierarchy] ⚠️ WARNING: This endpoint is deprecated. Use direct frontend query instead.');
    
    return c.json({
      error: 'This endpoint is deprecated. Please query app_users directly from the frontend.',
      deprecated: true
    }, 410);
    
  } catch (error: any) {
    console.error('[GetUsersHierarchy] ❌ Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;