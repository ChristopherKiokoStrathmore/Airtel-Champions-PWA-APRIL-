import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { initializeStorageBucket, uploadPhoto } from './storage-setup.tsx';

const app = new Hono();

// ============================================
// DIRECT DATABASE CLIENT (bypasses kv_store.tsx)
// ============================================
const getSupabaseClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  });
};

// KV store operations using direct Supabase client
const kvStore = {
  async get(key: string): Promise<any> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('kv_store_28f2f653')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      console.error('[KVStore] GET error:', error);
      throw new Error(error.message);
    }
    
    return { value: data?.value };
  },
  
  async set(key: string, value: any): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('kv_store_28f2f653')
      .upsert({ key, value });
    
    if (error) {
      console.error('[KVStore] SET error:', error);
      throw new Error(error.message);
    }
  },
  
  async getByPrefix(prefix: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('kv_store_28f2f653')
      .select('key, value')
      .like('key', `${prefix}%`);
    
    if (error) {
      console.error('[KVStore] GETBYPREFIX error:', error);
      throw new Error(error.message);
    }
    
    return data ?? [];
  }
};

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey'], // Added apikey for Supabase Edge Functions
}));

// Initialize storage bucket on startup (non-blocking, with error resilience)
initializeStorageBucket().then(result => {
  if (result.success) {
    console.log('[ProgramsKV] Storage bucket ready');
  } else {
    console.warn('[ProgramsKV] Storage bucket initialization had issues (non-fatal):', result);
  }
}).catch(err => {
  console.warn('[ProgramsKV] Storage init error (non-fatal):', err.message);
});

// ============================================
// KV STORE KEYS
// ============================================
const PROGRAMS_PREFIX = 'programs:';
const PROGRAM_FIELDS_PREFIX = 'program_fields:';
const SUBMISSIONS_PREFIX = 'submissions:';

// ============================================
// INITIALIZE SAMPLE DATA
// ============================================
async function ensureSampleProgram() {
  try {
    console.log('[ProgramsKV] Checking for existing program...');
    // Check if sample program exists
    const { value: existingProgram } = await kvStore.get(`${PROGRAMS_PREFIX}competitor-intel`);
    
    if (!existingProgram) {
      console.log('[ProgramsKV] No existing program found. Creating sample program...');
      
      // Create sample program
      const sampleProgram = {
        id: 'competitor-intel',
        title: 'Competitor Intel',
        description: 'Report competitor activity in your zone',
        icon: '🎯',
        color: '#EF4444',
        points_value: 100,
        target_roles: ['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'],
        category: 'Network Experience',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await kvStore.set(`${PROGRAMS_PREFIX}competitor-intel`, JSON.stringify(sampleProgram));
      
      // Create sample fields
      const sampleFields = [
        {
          id: 'field-1',
          program_id: 'competitor-intel',
          field_name: 'competitor_name',
          field_label: 'Competitor Name',
          field_type: 'text',
          is_required: true,
          placeholder: 'e.g., Safaricom',
          order_index: 0,
        },
        {
          id: 'field-2',
          program_id: 'competitor-intel',
          field_name: 'activity_type',
          field_label: 'Activity Type',
          field_type: 'select',
          is_required: true,
          options: JSON.stringify(['Promotion', 'New Product', 'Price Change', 'Store Opening', 'Other']),
          order_index: 1,
        },
        {
          id: 'field-3',
          program_id: 'competitor-intel',
          field_name: 'description',
          field_label: 'Description',
          field_type: 'textarea',
          is_required: true,
          placeholder: 'Describe what you observed...',
          order_index: 2,
        },
        {
          id: 'field-4',
          program_id: 'competitor-intel',
          field_name: 'photo',
          field_label: 'Photo Evidence',
          field_type: 'photo',
          is_required: false,
          help_text: 'Take a photo of the competitor activity',
          order_index: 3,
        },
      ];
      
      for (const field of sampleFields) {
        await kvStore.set(`${PROGRAM_FIELDS_PREFIX}${field.id}`, JSON.stringify(field));
      }
      
      console.log('[ProgramsKV] ✅ Sample program created!');
    }
  } catch (error: any) {
    console.error('[ProgramsKV] Error creating sample program:', error);
  }
}

// ============================================
// PROGRAMS ROUTES
// ============================================

// GET /make-server-28f2f653/programs - List all active programs for user's role
app.get('/make-server-28f2f653/programs', async (c) => {
  try {
    console.log('[ProgramsKV] === NEW REQUEST ===');
    console.log('[ProgramsKV] Testing database connection...');
    
    // 🔧 DIAGNOSTIC: Test the kv_store connection
    try {
      const testResult = await kvStore.get('test:setup');
      console.log('[ProgramsKV] ✅ KV Store test successful:', testResult);
    } catch (kvError: any) {
      console.error('[ProgramsKV] ❌ KV Store test FAILED:', kvError);
      console.error('[ProgramsKV] Error details:', kvError.message);
      
      // Return detailed error for debugging
      return c.json({
        error: 'KV Store connection failed',
        message: kvError.message,
        instructions: [
          '1. Check that the kv_store_28f2f653 table exists in your database',
          '2. Check that RLS is disabled on the table',
          '3. Run this SQL in Supabase dashboard:',
          'ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;',
        ],
        sqlToRun: 'ALTER TABLE kv_store_28f2f653 DISABLE ROW LEVEL SECURITY;',
      }, 500);
    }
    
    // Ensure sample program exists
    await ensureSampleProgram();
    
    // Get role from query params (TAI uses custom auth)
    const userRole = c.req.query('role') || 'sales_executive';
    const userId = c.req.query('user_id') || '';
    
    console.log('[ProgramsKV] Fetching programs for role:', userRole);
    
    // Get all programs from KV store
    const programKeys = await kvStore.getByPrefix(PROGRAMS_PREFIX);
    console.log('[ProgramsKV] Program keys returned:', programKeys);
    const programs = programKeys.map(item => JSON.parse(item.value as string));
    
    console.log('[ProgramsKV] Found programs:', programs.length);
    
    // Filter active programs that target this role
    const activePrograms = programs.filter(p => 
      p.status === 'active' && 
      p.target_roles?.includes(userRole)
    );
    
    console.log('[ProgramsKV] Active programs for role:', activePrograms.length);
    
    // Get submission counts for each program
    const programsWithStatus = await Promise.all(
      activePrograms.map(async (program) => {
        const submissionKeys = await kvStore.getByPrefix(`${SUBMISSIONS_PREFIX}${program.id}:`);
        const submissions = submissionKeys.map(item => JSON.parse(item.value as string));
        
        const totalSubmissions = submissions.length;
        const userSubmissions = submissions.filter(s => s.user_id === userId);
        
        const today = new Date().toISOString().split('T')[0];
        const submittedToday = userSubmissions.some(s => 
          s.submitted_at?.startsWith(today)
        );
        
        return {
          ...program,
          totalSubmissions,
          userSubmissionCount: userSubmissions.length,
          submittedToday,
          canSubmit: !submittedToday,
        };
      })
    );
    
    return c.json({ 
      success: true,
      programs: programsWithStatus,
      count: programsWithStatus.length,
    });
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error:', error);
    
    // Better error message for permission issues
    if (error.message?.includes('permission denied')) {
      return c.json({ 
        error: 'Database permission error. Please run the SQL in /database/CREATE-KV-TABLE-AND-FIX-PERMISSIONS.sql',
        details: error.message,
        instructions: 'Open https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new and run the SQL file',
        code: 'PERMISSION_DENIED'
      }, 500);
    }
    
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return c.json({ 
        error: 'KV Store table does not exist. Please run the SQL in /database/CREATE-KV-TABLE-AND-FIX-PERMISSIONS.sql',
        details: error.message,
        instructions: 'Open https://supabase.com/dashboard/project/mcbbtrrhqweypfnlzwht/sql/new and run the SQL file',
        code: 'TABLE_NOT_FOUND'
      }, 500);
    }
    
    return c.json({ 
      error: error.message || 'Failed to fetch programs',
      code: 'FETCH_ERROR'
    }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id - Get single program with fields
app.get('/make-server-28f2f653/programs/:id', async (c) => {
  try {
    const programId = c.req.param('id');
    console.log('[ProgramsKV] Fetching program:', programId);
    
    // Get program
    const { value: programData } = await kvStore.get(`${PROGRAMS_PREFIX}${programId}`);
    
    if (!programData) {
      return c.json({ error: 'Program not found' }, 404);
    }
    
    const program = JSON.parse(programData as string);
    
    // Get fields for this program
    const allFields = await kvStore.getByPrefix(PROGRAM_FIELDS_PREFIX);
    const programFields = allFields
      .map(item => JSON.parse(item.value as string))
      .filter(field => field.program_id === programId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    return c.json({
      success: true,
      program: {
        ...program,
        fields: programFields,
      },
    });
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-28f2f653/programs - Create new program
app.post('/make-server-28f2f653/programs', async (c) => {
  try {
    const body = await c.req.json();
    console.log('[ProgramsKV] Creating program:', body.title);
    
    const programId = `program-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const program = {
      id: programId,
      title: body.title,
      description: body.description || '',
      icon: body.icon || '📊',
      color: body.color || '#EF4444',
      points_value: body.points_value || 50,
      target_roles: body.target_roles || ['sales_executive'],
      category: body.category || 'Network Experience',
      status: 'active',
      created_by: body.created_by || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kvStore.set(`${PROGRAMS_PREFIX}${programId}`, JSON.stringify(program));
    
    // Create fields
    if (body.fields && Array.isArray(body.fields)) {
      for (let i = 0; i < body.fields.length; i++) {
        const field = body.fields[i];
        const fieldId = `field-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
        const fieldData = {
          id: fieldId,
          program_id: programId,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required || false,
          placeholder: field.placeholder || '',
          help_text: field.help_text || '',
          options: field.options ? JSON.stringify(field.options) : null,
          order_index: i,
        };
        
        await kvStore.set(`${PROGRAM_FIELDS_PREFIX}${fieldId}`, JSON.stringify(fieldData));
      }
    }
    
    console.log('[ProgramsKV] ✅ Program created:', programId);
    
    return c.json({
      success: true,
      program,
    }, 201);
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error creating program:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-28f2f653/programs/:id/submit - Submit response to program
app.post('/make-server-28f2f653/programs/:id/submit', async (c) => {
  try {
    const programId = c.req.param('id');
    const body = await c.req.json();
    
    console.log('[ProgramsKV] Submitting to program:', programId);
    
    // Get program to validate
    const { value: programData } = await kvStore.get(`${PROGRAMS_PREFIX}${programId}`);
    
    if (!programData) {
      return c.json({ error: 'Program not found' }, 404);
    }
    
    const program = JSON.parse(programData as string);
    
    // Create submission
    const submissionId = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const submission = {
      id: submissionId,
      program_id: programId,
      user_id: body.user_id || '',
      responses: body.responses || {},
      status: 'pending',
      gps_location: body.gps_location || null,
      photos: body.photos || [],
      points_awarded: 0,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    await kvStore.set(`${SUBMISSIONS_PREFIX}${programId}:${submissionId}`, JSON.stringify(submission));
    
    console.log('[ProgramsKV] ✅ Submission created:', submissionId);
    
    return c.json({
      success: true,
      submission,
      points_pending: program.points_value,
    }, 201);
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error submitting:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /make-server-28f2f653/programs/:id/submissions - Get submissions for a program
app.get('/make-server-28f2f653/programs/:id/submissions', async (c) => {
  try {
    const programId = c.req.param('id');
    const status = c.req.query('status'); // optional filter
    
    console.log('[ProgramsKV] Fetching submissions for program:', programId);
    
    const submissionKeys = await kvStore.getByPrefix(`${SUBMISSIONS_PREFIX}${programId}:`);
    let submissions = submissionKeys.map(item => JSON.parse(item.value as string));
    
    if (status) {
      submissions = submissions.filter(s => s.status === status);
    }
    
    return c.json({
      success: true,
      submissions,
      count: submissions.length,
    });
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error fetching submissions:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /make-server-28f2f653/programs/upload-photo - Upload photo via server (bypasses RLS)
app.post('/make-server-28f2f653/programs/upload-photo', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('photo') as File;
    const userId = formData.get('user_id') as string;
    const programId = formData.get('program_id') as string;
    
    if (!file || !userId || !programId) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: photo, user_id, program_id' 
      }, 400);
    }
    
    console.log('[ProgramsKV] Uploading photo for user:', userId, 'program:', programId);
    
    const result = await uploadPhoto(file, userId, programId);
    
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 500);
    }
    
    return c.json({
      success: true,
      path: result.path,
      url: result.url,
    });
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error uploading photo:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /make-server-28f2f653/programs/get-signed-urls - Get signed URLs for photo paths
app.post('/make-server-28f2f653/programs/get-signed-urls', async (c) => {
  try {
    const body = await c.req.json();
    const { paths } = body;
    
    if (!Array.isArray(paths)) {
      return c.json({ 
        success: false, 
        error: 'paths must be an array of photo paths' 
      }, 400);
    }
    
    console.log('[ProgramsKV] Generating signed URLs for', paths.length, 'photos');
    
    // Import getSignedUrl from storage-setup
    const { getSignedUrl } = await import('./storage-setup.tsx');
    
    const signedUrls = await Promise.all(
      paths.map(async (path) => {
        const result = await getSignedUrl(path, 3600); // 1 hour expiry
        return {
          path,
          signedUrl: result.success ? result.signedUrl : null,
          error: result.error || null,
        };
      })
    );
    
    return c.json({
      success: true,
      urls: signedUrls,
    });
    
  } catch (error: any) {
    console.error('[ProgramsKV] Error generating signed URLs:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;