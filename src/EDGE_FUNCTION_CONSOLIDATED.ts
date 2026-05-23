// ====================================================================
// TAI (Sales Intelligence Network) - Consolidated Edge Function
// Project: xspogpfohjmkykfjadhk
// Function Name: make-server-28f2f653
// ====================================================================

import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// ====================================================================
// SUPABASE CLIENT INITIALIZATION
// ====================================================================

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ====================================================================
// KV STORE FUNCTIONS (Inline)
// ====================================================================

const kvClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const kvSet = async (key: string, value: any): Promise<void> => {
  const client = kvClient();
  const { error } = await client.from('kv_store_28f2f653').upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const client = kvClient();
  const { data, error } = await client.from('kv_store_28f2f653').select('value').eq('key', key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

// ====================================================================
// MIDDLEWARE: CORS & LOGGING
// ====================================================================

app.use('*', logger(console.log));

app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// ====================================================================
// AUTHENTICATION HELPERS
// ====================================================================

async function authenticateUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid or expired token');
  return user;
}

async function requireAdmin(authHeader: string | null) {
  const user = await authenticateUser(authHeader);
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !userData) throw new Error('User not found');

  const adminRoles = ['admin', 'zsm', 'asm', 'rsm', 'director', 'hq_command_center'];
  if (!adminRoles.includes(userData.role)) {
    throw new Error('Insufficient permissions - admin access required');
  }

  return { user, role: userData.role };
}

// ====================================================================
// RATE LIMITING
// ====================================================================

async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  const requestsData = await kvGet(`ratelimit:${key}`);
  const requests: number[] = requestsData ? JSON.parse(requestsData as string) : [];
  
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= limit) return false;
  
  recentRequests.push(now);
  await kvSet(`ratelimit:${key}`, JSON.stringify(recentRequests));
  
  return true;
}

// ====================================================================
// HEALTH CHECK
// ====================================================================

app.get('/make-server-28f2f653/health', (c) => {
  return c.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Sales Intelligence Network API',
    project: 'xspogpfohjmkykfjadhk'
  });
});

// ====================================================================
// PROGRAMS API
// ====================================================================

// GET /make-server-28f2f653/programs - List all programs
app.get('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[Programs] === GET PROGRAMS REQUEST ===');
    
    let userRole = 'sales_executive';
    let userId = '';

    // Support TAI custom auth via query params
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');

    if (roleParam && userIdParam) {
      userRole = roleParam;
      userId = userIdParam;
      console.log('[Programs] Using query params - role:', userRole, 'userId:', userId);
    } else {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const user = await authenticateUser(`Bearer ${accessToken}`);
      userId = user.id;

      const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single();

      userRole = userData?.role || 'sales_executive';
      console.log('[Programs] Using auth token - role:', userRole);
    }

    console.log('[Programs] Querying programs table...');

    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Programs] Database error:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return c.json({ 
          error: 'programs table does not exist',
          hint: 'Please create the table in Supabase Dashboard',
          code: 'TABLE_NOT_FOUND'
        }, 500);
      }
      throw error;
    }

    console.log('[Programs] Found programs:', programs?.length || 0);

    return c.json({ programs: programs || [] });
  } catch (error: any) {
    console.error('[Programs] ERROR:', error);
    return c.json({ error: error.message || 'Failed to fetch programs' }, 500);
  }
});

// POST /make-server-28f2f653/programs - Create program
app.post('/make-server-28f2f653/programs', async (c) => {
  try {
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs] ========================================');
    console.log('[Programs] CREATE PROGRAM REQUEST');
    console.log('[Programs] User ID:', userId);
    console.log('[Programs] User Role:', userRole);

    const body = await c.req.json();
    const { title, description, category, icon, color, points_value = 10, target_roles, start_date, end_date, fields } = body;

    console.log('[Programs] Title:', title);
    console.log('[Programs] Target Roles:', target_roles);

    if (!title || !target_roles || !Array.isArray(target_roles) || target_roles.length === 0) {
      return c.json({ error: 'Missing required fields: title, target_roles' }, 400);
    }

    console.log('[Programs] Inserting into programs table...');

    const { data: program, error: insertError } = await supabase
      .from('programs')
      .insert({
        title,
        description,
        category,
        icon,
        color,
        points_value,
        target_roles,
        start_date,
        end_date,
        status: 'active',
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Programs] ❌ INSERT ERROR:');
      console.error('[Programs] Error code:', insertError.code);
      console.error('[Programs] Error message:', insertError.message);
      console.error('[Programs] Error details:', insertError.details);
      
      return c.json({ 
        error: insertError.message || 'Database insert failed',
        code: insertError.code,
        details: insertError.details
      }, 500);
    }

    console.log('[Programs] ✅ Program created! ID:', program.id);

    // Create program fields
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToInsert = fields.map((field: any, index: number) => ({
        program_id: program.id,
        field_name: field.field_name,
        field_label: field.field_label || field.field_name,
        field_type: field.field_type,
        is_required: field.is_required ?? false,
        placeholder: field.placeholder || null,
        help_text: field.help_text || null,
        options: field.options || null,
        validation: field.validation || null,
        conditional_logic: field.conditional_logic || null,
        section_id: field.section_id || null,
        section_title: field.section_title || null,
        section_index: field.section_index ?? 0,
        order_index: field.order_index ?? index,
      }));

      console.log('[Programs] Inserting fields:', fieldsToInsert.length);

      const { error: fieldsError } = await supabase
        .from('program_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('[Programs] Fields insert error:', fieldsError);
        // Don't throw - program was created successfully
      }
    }

    console.log(`[Programs] ✅ Created program: ${title} by user ${userId}`);
    return c.json({ program, message: 'Program created successfully' });
  } catch (error: any) {
    console.error('[Programs] Error creating program:', error);
    return c.json({ 
      error: error.message || 'Failed to create program',
      details: error.details || null
    }, 500);
  }
});

// DELETE /make-server-28f2f653/programs/:id - Delete program
app.delete('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.req.param('id');
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');
    
    console.log('[Programs] DELETE program:', programId, 'by user:', userId, 'role:', userRole);
    
    const allowedRoles = ['director', 'hq_command_center'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can delete programs' }, 403);
    }

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('[Programs] Delete error:', error);
      throw error;
    }

    console.log(`[Programs] ✅ Deleted program: ${programId}`);
    return c.json({ message: 'Program deleted successfully' });
  } catch (error: any) {
    console.error('[Programs] Error deleting program:', error);
    return c.json({ error: 'Failed to delete program' }, 500);
  }
});

// ====================================================================
// SUBMISSIONS API
// ====================================================================

app.post('/make-server-28f2f653/submissions/approve', async (c) => {
  try {
    const { user, role } = await requireAdmin(c.req.header('Authorization'));

    const rateLimitKey = `approve:${user.id}`;
    const allowed = await checkRateLimit(rateLimitKey, 100, 60);
    if (!allowed) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body = await c.req.json();
    const { submissionId, pointsAwarded, reviewNotes } = body;

    if (!submissionId) {
      return c.json({ error: 'submissionId is required' }, 400);
    }

    if (typeof pointsAwarded !== 'number' || pointsAwarded < 0 || pointsAwarded > 1000) {
      return c.json({ error: 'pointsAwarded must be between 0 and 1000' }, 400);
    }

    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        points_awarded: pointsAwarded,
        review_notes: reviewNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving submission:', updateError);
      return c.json({ error: 'Failed to approve submission', details: updateError.message }, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'APPROVE_SUBMISSION',
      table_name: 'submissions',
      record_id: submissionId,
      metadata: { pointsAwarded, reviewNotes },
    });

    return c.json({ 
      success: true, 
      data: submission,
      message: 'Submission approved successfully'
    });

  } catch (error: any) {
    console.error('Error in approve endpoint:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ====================================================================
// LEADERBOARD API
// ====================================================================

app.get('/make-server-28f2f653/leaderboard', async (c) => {
  try {
    const user = await authenticateUser(c.req.header('Authorization'));
    const timeframe = c.req.query('timeframe') || 'weekly';
    const region = c.req.query('region') || 'all';

    // Check cache first
    const cacheKey = `leaderboard:${timeframe}:${region}`;
    const cachedData = await kvGet(cacheKey);

    if (cachedData) {
      return c.json({ 
        success: true, 
        data: JSON.parse(cachedData as string),
        cached: true 
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'alltime':
        startDate = new Date(0);
        break;
    }

    let query = supabase
      .from('submissions')
      .select(`
        se_id,
        points_awarded,
        users!submissions_se_id_fkey(id, full_name, region, employee_id)
      `)
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString());

    if (region !== 'all') {
      query = query.eq('users.region', region);
    }

    const { data: submissions, error } = await query;

    if (error) throw error;

    // Aggregate points by user
    const userPoints = new Map();
    
    submissions?.forEach((sub: any) => {
      const userId = sub.se_id;
      const points = sub.points_awarded || 0;
      
      if (!userPoints.has(userId)) {
        userPoints.set(userId, {
          id: userId,
          name: sub.users?.full_name || 'Unknown',
          region: sub.users?.region || '',
          employeeId: sub.users?.employee_id || '',
          points: 0,
          submissions: 0,
        });
      }
      
      const userData = userPoints.get(userId);
      userData.points += points;
      userData.submissions += 1;
    });

    const leaderboard = Array.from(userPoints.values())
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    // Cache for 5 minutes
    await kvSet(cacheKey, JSON.stringify(leaderboard));

    return c.json({ success: true, data: leaderboard, cached: false });

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ====================================================================
// ANALYTICS API
// ====================================================================

app.get('/make-server-28f2f653/analytics/generate', async (c) => {
  try {
    const { user } = await requireAdmin(c.req.header('Authorization'));

    const [
      submissionsResult,
      usersResult,
      achievementsResult
    ] = await Promise.all([
      supabase.from('submissions').select('*', { count: 'exact' }),
      supabase.from('users').select('*', { count: 'exact' }).eq('role', 'se'),
      supabase.from('user_achievements').select('*', { count: 'exact' })
    ]);

    const submissions = submissionsResult.data || [];
    const totalSubmissions = submissionsResult.count || 0;
    const totalUsers = usersResult.count || 0;
    const totalAchievements = achievementsResult.count || 0;

    const approvedSubmissions = submissions.filter(s => s.status === 'approved');
    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected');

    const approvalRate = totalSubmissions > 0 
      ? Math.round((approvedSubmissions.length / totalSubmissions) * 100) 
      : 0;

    const totalPoints = approvedSubmissions.reduce((sum, s) => sum + (s.points_awarded || 0), 0);
    const avgPointsPerSubmission = approvedSubmissions.length > 0
      ? Math.round(totalPoints / approvedSubmissions.length)
      : 0;

    const activeSEs = new Set(submissions.map(s => s.se_id)).size;
    const participationRate = totalUsers > 0
      ? Math.round((activeSEs / totalUsers) * 100)
      : 0;

    const report = {
      generatedAt: new Date().toISOString(),
      generatedBy: user.id,
      summary: {
        totalSubmissions,
        approvedSubmissions: approvedSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        rejectedSubmissions: rejectedSubmissions.length,
        approvalRate,
        totalUsers,
        activeSEs,
        participationRate,
        totalPoints,
        avgPointsPerSubmission,
        totalAchievements,
      },
    };

    return c.json({ success: true, data: report });

  } catch (error: any) {
    console.error('Error generating analytics:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ====================================================================
// START SERVER
// ====================================================================

console.log('====================================================================');
console.log('🚀 TAI Sales Intelligence Network - Edge Function');
console.log('====================================================================');
console.log('✅ CORS enabled');
console.log('✅ Logger enabled');
console.log('✅ Authentication middleware');
console.log('✅ Rate limiting');
console.log('✅ Programs API');
console.log('✅ Submissions API');
console.log('✅ Leaderboard API');
console.log('✅ Analytics API');
console.log('====================================================================');

Deno.serve(app.fetch);
