import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================================
// ROOT & HEALTH CHECK
// ============================================================================

// Root endpoint (helpful for testing)
app.get("/", (c) => {
  console.log('[Root] Root endpoint called');
  return c.json({ 
    status: "online",
    service: "TAI - Sales Intelligence Network API",
    version: "1.0.0",
    endpoints: {
      health: "/make-server-28f2f653/health",
      programs: "/make-server-28f2f653/programs",
    },
    message: "Function is running! Use /make-server-28f2f653/health for health check"
  });
});

app.get("/make-server-28f2f653/health", (c) => {
  console.log('[Health] Health check called');
  return c.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "TAI - Sales Intelligence Network API"
  });
});

// ============================================================================
// PROGRAMS API
// ============================================================================

// GET /make-server-28f2f653/programs - List all active programs
app.get('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[Programs GET] === NEW REQUEST ===');
    
    // Support both auth token and query parameters (for TAI's custom auth)
    let userRole = 'sales_executive';
    let userId = '';

    // Try getting role and user_id from query params first (TAI custom auth)
    const roleParam = c.req.query('role');
    const userIdParam = c.req.query('user_id');

    if (roleParam && userIdParam) {
      userRole = roleParam;
      userId = userIdParam;
      console.log('[Programs GET] Using query params - role:', userRole, 'userId:', userId);
    }

    // Fetch all active programs that target this role
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .contains('target_roles', [userRole])
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Programs GET] Error fetching programs:', error);
      return c.json({ error: 'Failed to fetch programs', details: error.message }, 500);
    }

    console.log(`[Programs GET] ✅ Found ${programs?.length || 0} programs for role: ${userRole}`);
    return c.json({ success: true, programs: programs || [] });

  } catch (err: any) {
    console.error('[Programs GET] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// POST /make-server-28f2f653/programs - Create new program
app.post('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[Programs POST] === CREATE PROGRAM REQUEST ===');
    
    // Get user info from query params (TAI authentication)
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs POST] User:', userId, 'Role:', userRole);

    // Verify user has permission (Director or HQ only)
    const allowedRoles = ['director', 'hq_command_center'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('[Programs POST] ❌ Unauthorized role:', userRole);
      return c.json({ 
        error: 'Only Directors and HQ Command Center can create programs',
        requiredRoles: allowedRoles,
        yourRole: userRole 
      }, 403);
    }

    // Parse request body
    const body = await c.req.json();
    console.log('[Programs POST] Request body:', JSON.stringify(body, null, 2));

    const { 
      title, 
      description, 
      category, 
      icon, 
      color,
      points_value, 
      target_roles, 
      start_date, 
      end_date, 
      fields 
    } = body;

    // Validate required fields
    if (!title || !fields || fields.length === 0) {
      console.log('[Programs POST] ❌ Missing required fields');
      return c.json({ 
        error: 'Missing required fields',
        required: ['title', 'fields (at least one)']
      }, 400);
    }

    // Create program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        title,
        description: description || null,
        category: category || 'General',
        icon: icon || '📋',
        color: color || '#EF4444',
        points_value: points_value || 50,
        target_roles: target_roles || ['sales_executive'],
        start_date: start_date || null,
        end_date: end_date || null,
        status: 'active',
        created_by: userId,
      })
      .select()
      .single();

    if (programError) {
      console.error('[Programs POST] ❌ Error creating program:', programError);
      return c.json({ 
        error: 'Failed to create program', 
        details: programError.message,
        hint: programError.hint,
        code: programError.code
      }, 500);
    }

    console.log('[Programs POST] ✅ Program created:', program.id);

    // Create program fields
    const fieldsWithProgramId = fields.map((field: any) => ({
      program_id: program.id,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required || false,
      placeholder: field.placeholder || null,
      help_text: field.help_text || null,
      options: field.options || null,
      validation: field.validation || null,
      conditional_logic: field.conditional_logic || null,
      order_index: field.order_index || 0,
      section_id: field.section_id || null,
      section_title: field.section_title || null,
      section_index: field.section_index || 0,
    }));

    const { data: createdFields, error: fieldsError } = await supabase
      .from('program_fields')
      .insert(fieldsWithProgramId)
      .select();

    if (fieldsError) {
      console.error('[Programs POST] ⚠️ Error creating fields:', fieldsError);
      // Don't fail the entire request if fields fail
      // The program is already created
    }

    console.log('[Programs POST] ✅ Created ${createdFields?.length || 0} fields');

    return c.json({
      success: true,
      program: {
        ...program,
        fields: createdFields || []
      },
      message: 'Program created successfully'
    });

  } catch (err: any) {
    console.error('[Programs POST] Exception:', err);
    return c.json({ 
      error: 'Internal server error', 
      details: err.message,
      stack: err.stack
    }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id - Get program details
app.get('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.get('id') || c.req.param('id');
    console.log('[Programs GET/:id] Fetching program:', programId);

    // Fetch program with fields
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      console.error('[Programs GET/:id] Error:', programError);
      return c.json({ error: 'Program not found' }, 404);
    }

    // Fetch fields
    const { data: fields, error: fieldsError } = await supabase
      .from('program_fields')
      .select('*')
      .eq('program_id', programId)
      .order('section_index', { ascending: true })
      .order('order_index', { ascending: true });

    if (fieldsError) {
      console.error('[Programs GET/:id] Error fetching fields:', fieldsError);
    }

    return c.json({
      success: true,
      program: {
        ...program,
        fields: fields || []
      }
    });

  } catch (err: any) {
    console.error('[Programs GET/:id] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// DELETE /make-server-28f2f653/programs/:id - Delete program
app.delete('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.get('id') || c.req.param('id');
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs DELETE] Deleting program:', programId, 'by user:', userId);

    // Verify permission
    const allowedRoles = ['director', 'hq_command_center'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Delete program (cascade will delete fields)
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('[Programs DELETE] Error:', error);
      return c.json({ error: 'Failed to delete program', details: error.message }, 500);
    }

    console.log('[Programs DELETE] ✅ Program deleted:', programId);
    return c.json({ success: true, message: 'Program deleted successfully' });

  } catch (err: any) {
    console.error('[Programs DELETE] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// POST /make-server-28f2f653/programs/:id/submit - Submit program response
app.post('/make-server-28f2f653/programs/:id/submit', async (c) => {
  try {
    const programId = c.get('id') || c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    console.log('[Programs SUBMIT] Submitting to program:', programId);

    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Invalid authentication' }, 401);
    }

    const body = await c.req.json();
    const { responses } = body;

    if (!responses || typeof responses !== 'object') {
      return c.json({ error: 'Invalid submission format' }, 400);
    }

    // Create submission
    const { data: submission, error: submitError } = await supabase
      .from('program_submissions')
      .insert({
        program_id: programId,
        user_id: user.id,
        responses: responses,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submitError) {
      console.error('[Programs SUBMIT] Error:', submitError);
      return c.json({ error: 'Failed to submit', details: submitError.message }, 500);
    }

    console.log('[Programs SUBMIT] ✅ Submission created:', submission.id);
    return c.json({ success: true, submission });

  } catch (err: any) {
    console.error('[Programs SUBMIT] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/submissions - Get program submissions
app.get('/make-server-28f2f653/programs/:id/submissions', async (c) => {
  try {
    const programId = c.get('id') || c.req.param('id');
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs Submissions] Fetching submissions for program:', programId);

    // Verify permission
    const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Fetch submissions with user details
    const { data: submissions, error } = await supabase
      .from('program_submissions')
      .select(`
        *,
        app_users!program_submissions_user_id_fkey (
          id,
          full_name,
          employee_id,
          role,
          region,
          zone
        )
      `)
      .eq('program_id', programId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('[Programs Submissions] Error:', error);
      return c.json({ error: 'Failed to fetch submissions', details: error.message }, 500);
    }

    console.log(`[Programs Submissions] ✅ Found ${submissions?.length || 0} submissions`);
    return c.json({ success: true, submissions: submissions || [] });

  } catch (err: any) {
    console.error('[Programs Submissions] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/approve - Approve submission
app.put('/make-server-28f2f653/submissions/:id/approve', async (c) => {
  try {
    const submissionId = c.get('id') || c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    console.log('[Submissions APPROVE] Approving submission:', submissionId);

    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Invalid authentication' }, 401);
    }

    const body = await c.req.json();
    const { points_awarded, review_notes } = body;

    // Update submission
    const { data: submission, error: updateError } = await supabase
      .from('program_submissions')
      .update({
        status: 'approved',
        points_awarded: points_awarded || 0,
        review_notes: review_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('[Submissions APPROVE] Error:', updateError);
      return c.json({ error: 'Failed to approve', details: updateError.message }, 500);
    }

    console.log('[Submissions APPROVE] ✅ Approved:', submissionId);
    return c.json({ success: true, submission });

  } catch (err: any) {
    console.error('[Submissions APPROVE] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// PUT /make-server-28f2f653/submissions/:id/reject - Reject submission
app.put('/make-server-28f2f653/submissions/:id/reject', async (c) => {
  try {
    const submissionId = c.get('id') || c.req.param('id');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    console.log('[Submissions REJECT] Rejecting submission:', submissionId);

    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Invalid authentication' }, 401);
    }

    const body = await c.req.json();
    const { review_notes } = body;

    // Update submission
    const { data: submission, error: updateError } = await supabase
      .from('program_submissions')
      .update({
        status: 'rejected',
        points_awarded: 0,
        review_notes: review_notes || 'Rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('[Submissions REJECT] Error:', updateError);
      return c.json({ error: 'Failed to reject', details: updateError.message }, 500);
    }

    console.log('[Submissions REJECT] ✅ Rejected:', submissionId);
    return c.json({ success: true, submission });

  } catch (err: any) {
    console.error('[Submissions REJECT] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/analytics - Get program analytics
app.get('/make-server-28f2f653/programs/:id/analytics', async (c) => {
  try {
    const programId = c.get('id') || c.req.param('id');
    const userId = c.req.query('user_id');
    const userRole = c.req.query('role');

    console.log('[Programs Analytics] Fetching analytics for program:', programId);

    // Verify permission
    const allowedRoles = ['director', 'hq_command_center', 'zonal_business_manager', 'zonal_sales_manager'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Fetch all submissions for this program
    const { data: submissions, error } = await supabase
      .from('program_submissions')
      .select('*')
      .eq('program_id', programId);

    if (error) {
      console.error('[Programs Analytics] Error:', error);
      return c.json({ error: 'Failed to fetch analytics', details: error.message }, 500);
    }

    // Calculate analytics
    const total = submissions?.length || 0;
    const pending = submissions?.filter(s => s.status === 'pending').length || 0;
    const approved = submissions?.filter(s => s.status === 'approved').length || 0;
    const rejected = submissions?.filter(s => s.status === 'rejected').length || 0;

    const analytics = {
      total_submissions: total,
      pending_submissions: pending,
      approved_submissions: approved,
      rejected_submissions: rejected,
      approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };

    console.log('[Programs Analytics] ✅ Analytics generated:', analytics);
    return c.json({ success: true, analytics });

  } catch (err: any) {
    console.error('[Programs Analytics] Exception:', err);
    return c.json({ error: 'Internal server error', details: err.message }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

Deno.serve(app.fetch);