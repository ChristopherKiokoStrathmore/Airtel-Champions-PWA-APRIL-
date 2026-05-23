import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Verify user has permission to create/manage programs (Director or HQ only)
async function verifyProgramCreator(accessToken: string) {
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { authorized: false, userId: null, role: null };
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['director', 'hq_command_center'];
  const authorized = allowedRoles.includes(userData?.role);

  return { authorized, userId: user.id, role: userData?.role };
}

// Verify user is logged in
async function verifyUser(accessToken: string) {
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { authorized: false, userId: null };
  }
  return { authorized: true, userId: user.id };
}

// Check if user can view analytics/submissions (Director, HQ, or Managers)
async function canViewProgramData(accessToken: string) {
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { authorized: false, userId: null, role: null, region: null, zone: null };
  }

  const { data: userData } = await supabase
    .from('app_users')
    .select('role, region, zone')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
  const authorized = allowedRoles.includes(userData?.role);

  return { 
    authorized, 
    userId: user.id, 
    role: userData?.role, 
    region: userData?.region, 
    zone: userData?.zone 
  };
}

// ============================================
// PROGRAMS ROUTES
// ============================================

// GET /make-server-28f2f653/programs - List all active programs for user's role
app.get('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[Programs] === NEW REQUEST ===');
    
    // Support both auth token and query parameters (for TAI's custom auth)
    let userRole = 'sales_executive';
    let userId = '';

    // Try getting role and user_id from query params first (TAI custom auth)
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');

    if (roleParam && userIdParam) {
      // Using query parameters (TAI custom auth)
      userRole = roleParam;
      userId = userIdParam;
      console.log('[Programs] Using query params - role:', userRole, 'userId:', userId);
    } else {
      // Fallback to auth token (Supabase auth)
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const { authorized, userId: authUserId } = await verifyUser(accessToken);

      if (!authorized) {
        console.log('[Programs] Not authorized via token');
        return c.json({ error: 'Unauthorized' }, 401);
      }

      userId = authUserId;

      // Get user's role from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', userId)
        .single();

      userRole = userData?.role || 'sales_executive';
      console.log('[Programs] Using auth token - role:', userRole, 'userId:', userId);
    }

    console.log('[Programs] Querying programs for role:', userRole);

    // Get active programs for user's role
    // Note: Using overlap operator (&&) instead of contains for array matching
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Programs] Database error details:', JSON.stringify(error, null, 2));
      console.error('[Programs] Error code:', error.code);
      console.error('[Programs] Error message:', error.message);
      
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.error('[Programs] ❌ CRITICAL: programs table does not exist!');
        console.error('[Programs] 📋 Please run the SQL schema in /database/programs-schema.sql');
        return c.json({ 
          error: 'Database tables not set up. Please run the programs schema SQL in Supabase Dashboard.',
          hint: 'Check /database/programs-schema.sql file and run it in Supabase SQL Editor',
          code: 'TABLE_NOT_FOUND'
        }, 500);
      }
      
      throw error;
    }

    console.log('[Programs] Found programs:', programs?.length || 0);
    if (programs && programs.length > 0) {
      console.log('[Programs] First program:', programs[0].title);
    }

    // Get submission count and user's submission status for each program
    const programsWithStatus = await Promise.all(
      (programs || []).map(async (program) => {
        try {
          // Total submissions count
          const { count: totalSubmissions } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', program.id);

          // User's submissions for this program
          const { data: userSubmissions, count: userSubmissionCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact' })
            .eq('program_id', program.id)
            .eq('user_id', userId);

          // Check if user submitted today
          const today = new Date().toISOString().split('T')[0];
          const submittedToday = userSubmissions?.some(sub => 
            sub.submitted_at.startsWith(today)
          ) || false;

          return {
            ...program,
            total_submissions: totalSubmissions || 0,
            user_submission_count: userSubmissionCount || 0,
            submitted_today: submittedToday,
          };
        } catch (err) {
          console.error('[Programs] Error processing program:', program.id, err);
          return {
            ...program,
            total_submissions: 0,
            user_submission_count: 0,
            submitted_today: false,
          };
        }
      })
    );

    console.log('[Programs] Returning programs with status:', programsWithStatus.length);

    return c.json({ programs: programsWithStatus });
  } catch (error) {
    console.error('[Programs] ERROR fetching programs:', error);
    console.error('[Programs] Error stack:', error?.stack);
    console.error('[Programs] Error message:', error?.message);
    return c.json({ error: 'Failed to fetch programs', details: error?.message }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id - Get program details with fields
app.get('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { authorized, userId } = await verifyUser(accessToken);

    if (!authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const programId = c.req.param('id');

    // Get program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError) throw programError;

    // Get program fields
    const { data: fields, error: fieldsError } = await supabase
      .from('program_fields')
      .select('*')
      .eq('program_id', programId)
      .order('order_index');

    if (fieldsError) throw fieldsError;

    return c.json({ program: { ...program, fields } });
  } catch (error) {
    console.error('[Programs] Error fetching program details:', error);
    return c.json({ error: 'Failed to fetch program details' }, 500);
  }
});

// POST /make-server-28f2f653/programs - Create program
app.post('/make-server-28f2f653/programs', async (c) => {
  try {
    // Get user info from query params (TAI authentication)
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs] ========================================');
    console.log('[Programs] CREATE PROGRAM REQUEST');
    console.log('[Programs] ========================================');
    console.log('[Programs] User ID:', userId);
    console.log('[Programs] User Role:', userRole);

    const body = await c.req.json();
    const { title, description, category, icon, color, points_value = 10, target_roles, start_date, end_date, fields } = body;

    console.log('[Programs] Title:', title);
    console.log('[Programs] Target Roles:', target_roles);
    console.log('[Programs] Fields count:', fields?.length);

    // Validate required fields
    if (!title || !target_roles || !Array.isArray(target_roles) || target_roles.length === 0) {
      console.log('[Programs] ❌ Validation failed - missing required fields');
      return c.json({ error: 'Missing required fields: title, target_roles' }, 400);
    }

    console.log('[Programs] ✅ Validation passed');
    console.log('[Programs] Attempting database insert...');

    // Direct insert without RPC
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
      console.error('[Programs] Error hint:', insertError.hint);
      console.error('[Programs] Full error object:', JSON.stringify(insertError, null, 2));
      
      return c.json({ 
        error: insertError.message || 'Database insert failed',
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, 500);
    }

    console.log('[Programs] ✅ Program inserted! ID:', program.id);

    // Create program fields
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToInsert = fields.map((field, index) => ({
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
        throw fieldsError;
      }
    }

    console.log(`[Programs] Created program: ${title} by user ${userId}`);
    return c.json({ program, message: 'Program created successfully' });
  } catch (error: any) {
    console.error('[Programs] Error creating program:', error);
    console.error('[Programs] Error details:', error.message, error.code, error.details);
    return c.json({ 
      error: error.message || 'Failed to create program',
      details: error.details || null,
      code: error.code || null 
    }, 500);
  }
});

// PUT /make-server-28f2f653/programs/:id - Update program
app.put('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { authorized, userId } = await verifyProgramCreator(accessToken);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can update programs' }, 403);
    }

    const programId = c.req.param('id');
    const body = await c.req.json();
    const { title, description, points_value, target_roles, start_date, end_date, status } = body;

    const { data: program, error } = await supabase
      .from('programs')
      .update({
        title,
        description,
        points_value,
        target_roles,
        start_date,
        end_date,
        status,
      })
      .eq('id', programId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[Programs] Updated program: ${programId} by user ${userId}`);
    return c.json({ program, message: 'Program updated successfully' });
  } catch (error) {
    console.error('[Programs] Error updating program:', error);
    return c.json({ error: 'Failed to update program' }, 500);
  }
});

// DELETE /make-server-28f2f653/programs/:id - Delete program
app.delete('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userId = '';
    let userRole = '';
    
    const userIdParam = c.req.query('user_id');
    const roleParam = c.req.query('role');
    
    if (userIdParam && roleParam) {
      // TAI custom auth
      userId = userIdParam;
      userRole = roleParam;
      console.log('[Programs] DELETE using TAI auth - userId:', userId, 'role:', userRole);
    } else {
      // Supabase auth
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      const authResult = await verifyProgramCreator(accessToken);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director and HQ Team can delete programs' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
    }
    
    // Verify user has permission
    const allowedRoles = ['director', 'hq_command_center'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can delete programs' }, 403);
    }

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;

    console.log(`[Programs] Deleted program: ${programId} by user ${userId}`);
    return c.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('[Programs] Error deleting program:', error);
    return c.json({ error: 'Failed to delete program' }, 500);
  }
});

// ============================================
// SUBMISSIONS ROUTES
// ============================================

// POST /make-server-28f2f653/programs/:id/submit - Submit program response
app.post('/make-server-28f2f653/programs/:id/submit', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { authorized, userId } = await verifyUser(accessToken);

    if (!authorized) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const programId = c.req.param('id');
    const body = await c.req.json();
    const { responses, photos, location } = body;

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('points_value')
      .eq('id', programId)
      .single();

    if (programError) throw programError;

    const pointsAwarded = program.points_value ?? 10;

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        program_id: programId,
        user_id: userId,
        responses,
        photos,
        location,
        status: 'approved', // Auto-approve by default
        points_awarded: pointsAwarded,
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Award points to user
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      user_id: userId,
      points_to_add: pointsAwarded,
    });

    if (pointsError) {
      console.error('[Programs] Error awarding points:', pointsError);
      // Continue even if points award fails - we can manually fix later
    }

    console.log(`[Programs] Submission created: ${submission.id} by user ${userId}, awarded ${pointsAwarded} points`);
    return c.json({ submission, points_awarded: pointsAwarded, message: 'Submission successful' });
  } catch (error) {
    console.error('[Programs] Error creating submission:', error);
    return c.json({ error: 'Failed to submit program' }, 500);
  }
});

// GET /make-server-28f2f653/van-calendar/submissions - Get van calendar submissions
app.get('/make-server-28f2f653/van-calendar/submissions', async (c) => {
  try {
    console.log('[Programs] Fetching van calendar submissions from van_calendar_plans table');
    
    // Query van_calendar_plans table directly
    const { data: plans, error } = await supabase
      .from('van_calendar_plans')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('[Programs] Error querying van_calendar_plans:', error);
      throw error;
    }
    
    console.log('[Programs] Found', plans?.length || 0, 'van calendar plans');
    
    return c.json({ 
      success: true,
      submissions: plans || [],
      count: plans?.length || 0
    });
  } catch (error: any) {
    console.error('[Programs] Error fetching van calendar submissions:', error);
    return c.json({ error: error.message || 'Failed to fetch submissions' }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/kv-submissions - Get submissions from KV store (no auth required)
app.get('/make-server-28f2f653/programs/:id/kv-submissions', async (c) => {
  try {
    const programId = c.req.param('id');
    console.log('[Programs] Fetching KV submissions for program:', programId);
    
    // Query KV store directly
    const { data: kvData, error: kvError } = await supabase
      .from('kv_store_28f2f653')
      .select('key, value')
      .like('key', `submissions:${programId}:%`);
    
    if (kvError) {
      console.error('[Programs] KV query error:', kvError);
      throw kvError;
    }
    
    console.log('[Programs] Found', kvData?.length || 0, 'KV submissions');
    
    // Parse the JSON values
    const submissions = (kvData || []).map(item => {
      try {
        return JSON.parse(item.value as string);
      } catch (e) {
        console.error('[Programs] Failed to parse submission:', e);
        return null;
      }
    }).filter(s => s !== null);
    
    return c.json({ 
      success: true,
      submissions,
      count: submissions.length 
    });
  } catch (error: any) {
    console.error('[Programs] Error fetching KV submissions:', error);
    return c.json({ error: error.message || 'Failed to fetch submissions' }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/submissions - Get all submissions for a program
app.get('/make-server-28f2f653/programs/:id/submissions', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userRole = '';
    let userId = '';
    let region = null;
    let zone = null;
    
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');
    
    if (roleParam && userIdParam) {
      // TAI custom auth via query params
      userRole = roleParam;
      userId = userIdParam;
      
      // Get user's region/zone from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('region, zone')
        .eq('id', userId)
        .single();
      
      region = userData?.region;
      zone = userData?.zone;
      
      console.log('[Programs] Using TAI auth - role:', userRole, 'userId:', userId);
    } else {
      // Supabase auth via token
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Missing authorization token or query params' }, 401);
      }
      
      const authResult = await canViewProgramData(accessToken);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view submissions' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
      region = authResult.region;
      zone = authResult.zone;
    }
    
    // Verify role has permission to view submissions
    const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view submissions' }, 403);
    }

    // Build query based on role
    let query = supabase
      .from('submissions')
      .select(`
        *,
        user:app_users(id, full_name, phone_number, region, zone, zsm, zbm)
      `)
      .eq('program_id', programId);

    // Filter by region/zone for managers
    if (userRole === 'zonal_business_manager' && region) {
      const { data: regionUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('region', region);
      const userIds = regionUsers?.map(u => u.id) || [];
      query = query.in('user_id', userIds);
    } else if (userRole === 'zonal_sales_manager' && zone) {
      const { data: zoneUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('zone', zone);
      const userIds = zoneUsers?.map(u => u.id) || [];
      query = query.in('user_id', userIds);
    }

    query = query.order('submitted_at', { ascending: false });

    const { data: submissions, error } = await query;

    if (error) throw error;

    return c.json({ submissions: submissions || [] });
  } catch (error) {
    console.error('[Programs] Error fetching submissions:', error);
    return c.json({ error: 'Failed to fetch submissions' }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/approve - Approve submission
app.put('/make-server-28f2f653/submissions/:id/approve', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { authorized, userId } = await verifyProgramCreator(accessToken);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can approve submissions' }, 403);
    }

    const submissionId = c.req.param('id');

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;

    console.log(`[Programs] Approved submission: ${submissionId} by user ${userId}`);
    return c.json({ submission, message: 'Submission approved' });
  } catch (error) {
    console.error('[Programs] Error approving submission:', error);
    return c.json({ error: 'Failed to approve submission' }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/reject - Reject submission
app.put('/make-server-28f2f653/submissions/:id/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { authorized, userId } = await verifyProgramCreator(accessToken);

    if (!authorized) {
      return c.json({ error: 'Unauthorized - Only Director and HQ Team can reject submissions' }, 403);
    }

    const submissionId = c.req.param('id');

    // Get submission to deduct points
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('user_id, points_awarded')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Deduct points from user
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      user_id: submission.user_id,
      points_to_add: -submission.points_awarded,
    });

    if (pointsError) {
      console.error('[Programs] Error deducting points:', pointsError);
    }

    console.log(`[Programs] Rejected submission: ${submissionId} by user ${userId}, deducted ${submission.points_awarded} points`);
    return c.json({ message: 'Submission rejected', points_deducted: submission.points_awarded });
  } catch (error) {
    console.error('[Programs] Error rejecting submission:', error);
    return c.json({ error: 'Failed to reject submission' }, 500);
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

// GET /make-server-28f2f653/programs/:id/analytics - Get program analytics
app.get('/make-server-28f2f653/programs/:id/analytics', async (c) => {
  try {
    const programId = c.req.param('id');
    
    // Support both TAI query params and Supabase auth
    let userRole = '';
    let userId = '';
    let region = null;
    let zone = null;
    
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');
    const filterView = c.req.query('view') || 'scoped'; // 'scoped', 'national', 'zone', 'zsm'
    
    if (roleParam && userIdParam) {
      // TAI custom auth via query params
      userRole = roleParam;
      userId = userIdParam;
      
      // Get user's region/zone from database
      const { data: userData } = await supabase
        .from('app_users')
        .select('region, zone')
        .eq('id', userId)
        .single();
      
      region = userData?.region;
      zone = userData?.zone;
      
      console.log('[Programs Analytics] Using TAI auth - role:', userRole, 'userId:', userId, 'view:', filterView);
    } else {
      // Supabase auth via token
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      
      if (!accessToken) {
        return c.json({ error: 'Missing authorization token or query params' }, 401);
      }
      
      const authResult = await canViewProgramData(accessToken);
      
      if (!authResult.authorized) {
        return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view analytics' }, 403);
      }
      
      userId = authResult.userId;
      userRole = authResult.role;
      region = authResult.region;
      zone = authResult.zone;
    }
    
    // Verify role has permission to view analytics
    const allowedRoles = ['director', 'hq_command_center', 'hq_staff', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized - Only Director, HQ Team, and Managers can view analytics' }, 403);
    }

    // Determine scope based on role and filter view
    let scopeInfo = {
      type: 'national', // 'national', 'region', 'zone'
      value: null,
      label: 'Nationwide'
    };

    // Build user filter based on view and role
    let userIds: string[] = [];
    
    if (filterView === 'national') {
      // Show national data (no filtering)
      scopeInfo = { type: 'national', value: null, label: 'Nationwide' };
    } else if (filterView === 'zone' && zone) {
      // Show zone-level data
      const { data: zoneUsers } = await supabase
        .from('app_users')
        .select('id, zone')
        .eq('zone', zone);
      userIds = zoneUsers?.map(u => u.id) || [];
      scopeInfo = { type: 'zone', value: zone, label: `${zone} Zone` };
    } else if (filterView === 'zsm' && zone) {
      // Show only SEs under specific ZSM
      const { data: zsmUsers } = await supabase
        .from('app_users')
        .select('id')
        .eq('zone', zone)
        .eq('role', 'sales_executive');
      userIds = zsmUsers?.map(u => u.id) || [];
      scopeInfo = { type: 'zsm', value: zone, label: `My Team (${zone})` };
    } else {
      // Default scoped view based on role
      if (userRole === 'zonal_business_manager' && region) {
        const { data: regionUsers } = await supabase
          .from('app_users')
          .select('id, region')
          .eq('region', region);
        userIds = regionUsers?.map(u => u.id) || [];
        scopeInfo = { type: 'region', value: region, label: `${region} Region` };
      } else if (userRole === 'zonal_sales_manager' && zone) {
        const { data: zoneUsers } = await supabase
          .from('app_users')
          .select('id')
          .eq('zone', zone)
          .eq('role', 'sales_executive');
        userIds = zoneUsers?.map(u => u.id) || [];
        scopeInfo = { type: 'zone', value: zone, label: `${zone} Zone` };
      }
    }

    // =============================================
    // SCOPED ANALYTICS (filtered by view)
    // =============================================
    
    let submissionsQuery = supabase
      .from('submissions')
      .select('*')
      .eq('program_id', programId);

    if (userIds.length > 0) {
      submissionsQuery = submissionsQuery.in('user_id', userIds);
    }

    const { count: totalSubmissions } = await submissionsQuery;

    // Today's submissions
    const today = new Date().toISOString().split('T')[0];
    let todayQuery = supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .gte('submitted_at', today);
    
    if (userIds.length > 0) {
      todayQuery = todayQuery.in('user_id', userIds);
    }
    
    const { count: todaySubmissions } = await todayQuery;

    // Unique participants
    const { data: allSubmissions } = await submissionsQuery;
    const uniqueParticipants = new Set(allSubmissions?.map(p => p.user_id)).size;

    // Get program target roles to calculate participation rate
    const { data: program } = await supabase
      .from('programs')
      .select('target_roles')
      .eq('id', programId)
      .single();

    let totalTargetUsers = 0;
    if (program?.target_roles) {
      let usersQuery = supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .in('role', program.target_roles);
      
      if (userIds.length > 0) {
        usersQuery = usersQuery.in('id', userIds);
      }
      
      const { count } = await usersQuery;
      totalTargetUsers = count || 0;
    }

    const participationRate = totalTargetUsers > 0 
      ? Math.round((uniqueParticipants / totalTargetUsers) * 100) 
      : 0;

    // =============================================
    // NATIONAL COMPARISON DATA (for benchmarking)
    // =============================================
    
    let nationalComparison = null;
    
    if (scopeInfo.type !== 'national') {
      // Get national stats for comparison
      const { count: nationalTotal } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programId);

      const { data: nationalSubs } = await supabase
        .from('submissions')
        .select('user_id')
        .eq('program_id', programId);
      
      const nationalParticipants = new Set(nationalSubs?.map(p => p.user_id)).size;

      let nationalTargetUsers = 0;
      if (program?.target_roles) {
        const { count } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .in('role', program.target_roles);
        nationalTargetUsers = count || 0;
      }

      const nationalParticipationRate = nationalTargetUsers > 0
        ? Math.round((nationalParticipants / nationalTargetUsers) * 100)
        : 0;

      nationalComparison = {
        total_submissions: nationalTotal || 0,
        unique_participants: nationalParticipants,
        participation_rate: nationalParticipationRate,
        your_percentage: nationalTotal > 0 ? Math.round(((totalSubmissions || 0) / nationalTotal) * 100) : 0
      };
    }

    // =============================================
    // TOP PERFORMERS (scoped to current view)
    // =============================================
    
    let topPerformersQuery = supabase
      .from('submissions')
      .select(`
        user_id,
        user:app_users(full_name, zone)
      `)
      .eq('program_id', programId);
    
    if (userIds.length > 0) {
      topPerformersQuery = topPerformersQuery.in('user_id', userIds);
    }
    
    const { data: topPerformers } = await topPerformersQuery;

    const submissionCounts = {};
    topPerformers?.forEach(sub => {
      const userId = sub.user_id;
      submissionCounts[userId] = (submissionCounts[userId] || 0) + 1;
    });

    const topPerformersList = Object.entries(submissionCounts)
      .map(([userId, count]) => {
        const performer = topPerformers.find(p => p.user_id === userId);
        return {
          user_id: userId,
          submission_count: count,
          user_name: performer?.user?.full_name || 'Unknown',
          zone: performer?.user?.zone || 'Unknown'
        };
      })
      .sort((a, b) => b.submission_count - a.submission_count)
      .slice(0, 10);

    // =============================================
    // ZONE BREAKDOWN (always show all zones)
    // =============================================
    
    const { data: allZoneData } = await supabase
      .from('submissions')
      .select(`
        user_id,
        user:app_users(zone)
      `)
      .eq('program_id', programId);

    const zoneBreakdown = {};
    allZoneData?.forEach(sub => {
      const zoneValue = sub.user?.zone || 'Unknown';
      zoneBreakdown[zoneValue] = (zoneBreakdown[zoneValue] || 0) + 1;
    });

    const zoneBreakdownList = Object.entries(zoneBreakdown)
      .map(([zone, count]) => ({ 
        zone, 
        submissions: count,
        is_current: zone === scopeInfo.value
      }))
      .sort((a, b) => b.submissions - a.submissions);

    // =============================================
    // ZSM BREAKDOWN (for ZBM viewing their region)
    // =============================================
    
    let zsmBreakdown = [];
    
    if (userRole === 'zonal_business_manager' && region && filterView !== 'national') {
      // Get all ZSMs in the region
      const { data: zsmsInRegion } = await supabase
        .from('app_users')
        .select('id, full_name, zone')
        .eq('region', region)
        .eq('role', 'zonal_sales_manager');

      for (const zsm of zsmsInRegion || []) {
        // Get SEs under this ZSM
        const { data: sesUnderZsm } = await supabase
          .from('app_users')
          .select('id')
          .eq('zone', zsm.zone)
          .eq('role', 'sales_executive');
        
        const seIds = sesUnderZsm?.map(se => se.id) || [];
        
        // Count submissions from these SEs
        const { count: zsmSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', programId)
          .in('user_id', seIds);

        zsmBreakdown.push({
          zsm_id: zsm.id,
          zsm_name: zsm.full_name,
          zone: zsm.zone,
          submissions: zsmSubmissions || 0,
          team_size: seIds.length
        });
      }

      zsmBreakdown.sort((a, b) => b.submissions - a.submissions);
    }

    return c.json({
      analytics: {
        scope: scopeInfo,
        total_submissions: totalSubmissions || 0,
        today_submissions: todaySubmissions || 0,
        unique_participants: uniqueParticipants,
        total_target_users: totalTargetUsers,
        participation_rate: participationRate,
        top_performers: topPerformersList,
        zone_breakdown: zoneBreakdownList,
        zsm_breakdown: zsmBreakdown,
        national_comparison: nationalComparison
      },
    });
  } catch (error) {
    console.error('[Programs] Error fetching analytics:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

export default app;