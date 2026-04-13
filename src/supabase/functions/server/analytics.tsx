// Analytics API - Leaderboards, Reports, Achievements, Challenges
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Analytics] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Analytics] KV set("${key}") failed: ${err.message}.`);
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
// ACHIEVEMENTS API
// ============================================================================

app.post("/make-server-28f2f653/achievements/award", async (c) => {
  try {
    const { user, role } = await requireAdmin(c.req);

    const body = await c.req.json();
    const { userId, achievementId } = body;

    if (!userId || !achievementId) {
      return c.json({ error: 'userId and achievementId are required' }, 400);
    }

    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (existing) {
      return c.json({ error: 'Achievement already awarded to this user' }, 400);
    }

    const { data: userAchievement, error: insertError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error awarding achievement:', insertError);
      return c.json({ error: 'Failed to award achievement', details: insertError.message }, 500);
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'AWARD_ACHIEVEMENT',
      table_name: 'user_achievements',
      record_id: userAchievement.id,
      metadata: { userId, achievementId },
    });

    return c.json({ 
      success: true, 
      data: userAchievement,
      message: 'Achievement awarded successfully'
    });

  } catch (error: any) {
    console.error('Error in award achievement:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================================================
// ANALYTICS API
// ============================================================================

app.get("/make-server-28f2f653/analytics/generate", async (c) => {
  try {
    const { user } = await requireAdmin(c.req);

    const [
      submissionsResult,
      usersResult,
      achievementsResult,
      leaderboardResult
    ] = await Promise.all([
      supabase.from('submissions').select('*', { count: 'exact' }),
      supabase.from('app_users').select('*', { count: 'exact' }).eq('role', 'se'),
      supabase.from('user_achievements').select('*', { count: 'exact' }),
      supabase.rpc('get_leaderboard', { p_timeframe: 'weekly' })
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
      topPerformers: leaderboardResult.data?.slice(0, 10) || [],
    };

    return c.json({ success: true, data: report });

  } catch (error: any) {
    console.error('Error generating analytics:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================================================
// LEADERBOARD API
// ============================================================================

app.get("/make-server-28f2f653/leaderboard", async (c) => {
  try {
    const user = await authenticateUser(c.req);

    const timeframe = c.req.query('timeframe') || 'weekly';
    const region = c.req.query('region') || 'all';

    const cacheKey = `leaderboard:${timeframe}:${region}`;
    const { value: cachedData } = await safeKvGet(cacheKey);

    if (cachedData) {
      return c.json({ 
        success: true, 
        data: JSON.parse(cachedData as string),
        cached: true 
      });
    }

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

    if (error) {
      throw error;
    }

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

    await safeKvSet(cacheKey, JSON.stringify(leaderboard));

    return c.json({ success: true, data: leaderboard, cached: false });

  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================================================
// CHALLENGES API
// ============================================================================

app.post("/make-server-28f2f653/challenges/check", async (c) => {
  try {
    const user = await authenticateUser(c.req);

    const body = await c.req.json();
    const { userId, challengeId } = body;

    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return c.json({ error: 'Challenge not found' }, 404);
    }

    const { count, error: countError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('se_id', userId)
      .eq('status', 'approved')
      .gte('created_at', challenge.start_date)
      .lte('created_at', challenge.end_date);

    if (countError) {
      throw countError;
    }

    const completed = (count || 0) >= challenge.target_value;

    return c.json({ 
      success: true, 
      data: {
        challengeId,
        userId,
        progress: count || 0,
        target: challenge.target_value,
        completed,
        rewardPoints: completed ? challenge.reward_points : 0,
      }
    });

  } catch (error: any) {
    console.error('Error checking challenge:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;