// Submissions API - Approval, Rejection, Bulk Operations
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Submissions] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Submissions] KV set("${key}") failed: ${err.message}.`);
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

  const adminRoles = ['admin', 'zsm', 'asm', 'rsm'];
  if (!adminRoles.includes(userData.role)) {
    throw new Error('Insufficient permissions - admin access required');
  }

  return { user, role: userData.role };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  
  const { value: requestsData } = await safeKvGet(`ratelimit:${key}`);
  const requests: number[] = requestsData ? JSON.parse(requestsData as string) : [];
  
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  await safeKvSet(`ratelimit:${key}`, JSON.stringify(recentRequests));
  
  return true;
}

// ============================================================================
// SUBMISSIONS ROUTES
// ============================================================================

// Approve submission with validation
app.post("/make-server-28f2f653/submissions/approve", async (c) => {
  try {
    const { user, role } = await requireAdmin(c.req);

    const rateLimitKey = `approve:${user.id}`;
    const allowed = await checkRateLimit(rateLimitKey, 100, 60);
    if (!allowed) {
      return c.json({ error: 'Rate limit exceeded. Please try again later.' }, 429);
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

    if (submission && submission.se_id) {
      try {
        const { data: userData } = await supabase
          .from('app_users')
          .select('total_points')
          .eq('employee_id', submission.se_id)
          .single();
        
        const currentPoints = userData?.total_points || 0;
        const newTotal = currentPoints + pointsAwarded;
        
        await supabase
          .from('app_users')
          .update({ total_points: newTotal })
          .eq('employee_id', submission.se_id);
        
        console.log(`✅ Updated user ${submission.se_id} points: ${currentPoints} → ${newTotal}`);
      } catch (pointsError) {
        console.error('⚠️ Failed to update user points:', pointsError);
      }
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
    return c.json({ error: error.message || 'Internal server error' }, error.message.includes('permissions') ? 403 : 500);
  }
});

// Reject submission
app.post("/make-server-28f2f653/submissions/reject", async (c) => {
  try {
    const { user, role } = await requireAdmin(c.req);

    const rateLimitKey = `reject:${user.id}`;
    const allowed = await checkRateLimit(rateLimitKey, 100, 60);
    if (!allowed) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body = await c.req.json();
    const { submissionId, reviewNotes } = body;

    if (!submissionId) {
      return c.json({ error: 'submissionId is required' }, 400);
    }

    if (!reviewNotes || reviewNotes.trim().length < 10) {
      return c.json({ error: 'Rejection reason must be at least 10 characters' }, 400);
    }

    const { data: submission, error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        points_awarded: 0,
        review_notes: reviewNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting submission:', updateError);
      return c.json({ error: 'Failed to reject submission', details: updateError.message }, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'REJECT_SUBMISSION',
      table_name: 'submissions',
      record_id: submissionId,
      metadata: { reviewNotes },
    });

    return c.json({ 
      success: true, 
      data: submission,
      message: 'Submission rejected'
    });

  } catch (error: any) {
    console.error('Error in reject endpoint:', error);
    return c.json({ error: error.message || 'Internal server error' }, error.message.includes('permissions') ? 403 : 500);
  }
});

// Bulk approve submissions
app.post("/make-server-28f2f653/submissions/bulk-approve", async (c) => {
  try {
    const { user, role } = await requireAdmin(c.req);

    const body = await c.req.json();
    const { submissionIds, pointsAwarded } = body;

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return c.json({ error: 'submissionIds must be a non-empty array' }, 400);
    }

    if (submissionIds.length > 50) {
      return c.json({ error: 'Cannot approve more than 50 submissions at once' }, 400);
    }

    const { data: submissions, error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        points_awarded: pointsAwarded,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .in('id', submissionIds)
      .select();

    if (updateError) {
      console.error('Error bulk approving:', updateError);
      return c.json({ error: 'Failed to approve submissions', details: updateError.message }, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'BULK_APPROVE_SUBMISSIONS',
      table_name: 'submissions',
      metadata: { count: submissionIds.length, submissionIds },
    });

    return c.json({ 
      success: true, 
      data: submissions,
      count: submissions?.length || 0,
      message: `${submissions?.length || 0} submissions approved`
    });

  } catch (error: any) {
    console.error('Error in bulk approve:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;