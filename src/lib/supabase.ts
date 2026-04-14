// Re-export the shared Supabase client
export { supabase } from '../utils/supabase/client';

// Import for internal use
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Debug logging removed for production

// ============================================================================
// API FUNCTIONS - Frontend to Backend Integration
// ============================================================================
// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  return response.json();
};

// ----------------------------------------------------------------------------
// ANALYTICS API
// ----------------------------------------------------------------------------

export async function getAnalytics() {
  try {
    // ✅ FIXED: Use analytics helper function
    const { data, error } = await supabase
      .rpc('get_analytics_summary')
      .single();

    if (error) throw error;

    // Get active SEs (unique submitters in last 7 days)
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('se_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const activeSEs = new Set(recentSubmissions?.map((s: any) => s.se_id)).size;

    return {
      data: {
        totalSubmissions: data?.total_submissions || 0,
        pendingSubmissions: data?.pending_submissions || 0,
        activeSEs,
        totalPoints: data?.total_points_awarded || 0,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return {
      data: null,
      error: error.message || 'Failed to fetch analytics',
    };
  }
}

// ----------------------------------------------------------------------------
// SUBMISSIONS API
// ----------------------------------------------------------------------------

export async function getSubmissions({
  limit = 50,
  offset = 0,
  status,
}: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  try {
    // ✅ FIXED: Use submissions_full view with pre-joined data
    let query = supabase
      .from('submissions_full')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      error: null,
      total: count || 0,
      hasMore: count ? offset + limit < count : false,
    };
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch submissions',
      total: 0,
      hasMore: false,
    };
  }
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'approved' | 'rejected',
  reviewNotes?: string,
  pointsAwarded?: number
) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status,
        review_notes: reviewNotes,
        points_awarded: pointsAwarded,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select();

    if (error) throw error;

    return {
      data,
      error: null,
    };
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return {
      data: null,
      error: error.message || 'Failed to update submission',
    };
  }
}

// ----------------------------------------------------------------------------
// LEADERBOARD API
// ----------------------------------------------------------------------------

export async function getLeaderboard({
  view = 'global',
  region,
  team,
  timeFilter = 'weekly',
}: {
  view?: string;
  region?: string;
  team?: string;
  timeFilter?: string;
}) {
  try {
    // Calculate date range based on time filter
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFilter) {
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Build query with user join
    let query = supabase
      .from('submissions')
      .select(`
        se_id,
        points_awarded,
        created_at,
        sales_executive:users!submissions_se_id_fkey(
          id,
          full_name,
          region,
          team,
          avatar_url
        )
      `)
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString());

    const { data: submissions, error } = await query;
    if (error) throw error;

    // Aggregate points by SE
    const sePoints = new Map<string, any>();
    
    submissions?.forEach((submission: any) => {
      const se = submission.sales_executive;
      if (!se) return;

      // Apply filters
      if (view === 'regional' && region && region !== 'all') {
        if (se.region !== region) return;
      }
      if (view === 'team' && team && team !== 'all') {
        if (se.team !== team) return;
      }

      if (!sePoints.has(se.id)) {
        sePoints.set(se.id, {
          id: se.id,
          name: se.full_name,
          region: se.region || '',
          team: se.team || '',
          avatar: se.avatar_url || '',
          points: 0,
          submissions: 0,
          streak: 0,
        });
      }
      
      const seData = sePoints.get(se.id);
      seData.points += submission.points_awarded || 0;
      seData.submissions += 1;
    });

    // Convert to array and sort by points
    const leaderboard = Array.from(sePoints.values())
      .sort((a, b) => b.points - a.points)
      .map((se, index) => ({
        ...se,
        rank: index + 1,
        change: 0, // TODO: Calculate from previous period
      }));

    return {
      data: leaderboard,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch leaderboard',
    };
  }
}

// ----------------------------------------------------------------------------
// USER API
// ----------------------------------------------------------------------------

export async function updateUserLocation(userId: string, lat: number, lng: number, userDetails?: any) {
  // Location tracking is non-critical — all errors are swallowed silently so
  // they never surface to the user or pollute the console with red noise.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || publicAnonKey;

    const payload = JSON.stringify({ userId, lat, lng, userDetails });

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/locations/update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(new TextEncoder().encode(payload).byteLength),
          'Authorization': `Bearer ${token}`,
        },
        body: payload,
      }
    );

    // Non-2xx → log quietly at debug level only, never throw
    if (!response.ok) {
      console.debug(`[Location Update] ${response.status} — non-critical, continuing`);
      return { error: response.status };
    }

    return await response.json();
  } catch {
    // Network errors (offline, CORS, gateway timeout) are expected in the field —
    // swallow completely so location tracking never breaks the main app.
    return { error: 'network' };
  }
}

export async function getActiveLocations() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || publicAnonKey;
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/locations/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    
    const result = await response.json();
    return { data: result.locations || [], error: null };
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return { data: [], error: error.message };
  }
}

export async function getLocationHistory(userId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || publicAnonKey;
    
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/locations/history/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }
    
    const result = await response.json();
    return { data: result.history || [], error: null };
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return { data: [], error: error.message };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    // ✅ FIXED: Don't throw error if no session - this is normal for admin dashboard
    if (error || !user) {
      console.log('No active auth session (this is normal for admin dashboard)');
      return {
        data: null,
        error: null, // Return null error instead of throwing
      };
    }

    return {
      data: user,
      error: null,
    };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return {
      data: null,
      error: null, // Return null error - auth is optional for admin dashboard
    };
  }
}

// ----------------------------------------------------------------------------
// MISSION TYPES API
// ----------------------------------------------------------------------------

export async function getMissionTypes() {
  try {
    const { data, error } = await supabase
      .from('mission_types')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching mission types:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch mission types',
    };
  }
}

export async function updateMissionPoints(missionId: string, points: number) {
  try {
    const { data, error } = await supabase
      .from('mission_types')
      .update({ points })
      .eq('id', missionId)
      .select();

    if (error) throw error;

    return {
      data,
      error: null,
    };
  } catch (error: any) {
    console.error('Error updating mission points:', error);
    return {
      data: null,
      error: error.message || 'Failed to update mission points',
    };
  }
}

// ----------------------------------------------------------------------------
// ANNOUNCEMENTS API
// Routes through the server API (KV-backed) — the `announcements` Supabase
// table does not exist; all persistence is in the KV store via the server.
// ----------------------------------------------------------------------------

import { localCache, CACHE_TTL } from './local-cache';

export async function getAnnouncements(userRole?: string, userId?: string) {
  try {
    const cacheKey = `announcements_${userRole || 'all'}_${userId || 'none'}`;
    
    // Try localStorage cache first (5 min TTL)
    const cached = localCache.get<any[]>(cacheKey);
    if (cached) {
      // Stale-while-revalidate: return cached data, refresh in background
      fetchAnnouncementsFromServer(userRole, userId, cacheKey).catch(() => {});
      return { data: cached, error: null };
    }
    
    return await fetchAnnouncementsFromServer(userRole, userId, cacheKey);
  } catch (err: any) {
    const cached = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
    return { data: cached, error: null };
  }
}

async function fetchAnnouncementsFromServer(userRole?: string, userId?: string, cacheKey?: string) {
  const params = new URLSearchParams();
  if (userRole) params.set('user_role', userRole);
  if (userId)   params.set('user_id', userId);

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/announcements?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.warn('[getAnnouncements] Server responded', response.status);
    const cached = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
    return { data: cached, error: null };
  }

  const result = await response.json();
  const announcements = result.announcements || [];

  // Cache in both localStorage (legacy) and localCache (TTL-aware)
  localStorage.setItem('tai_announcements', JSON.stringify(announcements));
  if (cacheKey) {
    localCache.set(cacheKey, announcements, CACHE_TTL.ANNOUNCEMENTS);
  }

  return { data: announcements, error: null };
}

export async function createAnnouncement(announcement: {
  title: string;
  message: string;
  priority: string;
  target_audience?: string;
  created_by?: string;
  created_by_name?: string;
  created_by_role?: string;
}) {
  try {
    const payload = {
      author_id:   announcement.created_by      || 'system',
      author_name: announcement.created_by_name || 'Admin',
      author_role: announcement.created_by_role || 'hq_staff',
      title:        announcement.title   || null,
      message:      announcement.message,
      priority:     announcement.priority || 'normal',
      target_roles: announcement.target_audience
        ? [announcement.target_audience]
        : ['sales_executive'],
    };

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/announcements`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[createAnnouncement] Server error:', response.status, text);
      return { data: null, error: `Server error ${response.status}: ${text}` };
    }

    const result = await response.json();
    console.log('[createAnnouncement] ✅ Created via server KV:', result.announcement?.id);
    
    // Invalidate announcements cache so next load shows the new one
    localCache.deleteByPrefix('announcements_');
    
    return { data: [result.announcement], error: null };
  } catch (err: any) {
    console.error('[createAnnouncement] ❌ Network error:', err.message);
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// ACHIEVEMENTS API
// ----------------------------------------------------------------------------

export async function getAchievements() {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points_required', { ascending: true });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch achievements',
    };
  }
}

// ----------------------------------------------------------------------------
// DAILY CHALLENGES API
// ----------------------------------------------------------------------------

export async function getChallenges() {
  try {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch challenges',
    };
  }
}

export async function createChallenge(challenge: {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  target_value: number;
  reward_points: number;
}) {
  try {
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert([challenge])
      .select();

    if (error) throw error;

    return {
      data,
      error: null,
    };
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    return {
      data: null,
      error: error.message || 'Failed to create challenge',
    };
  }
}

// ----------------------------------------------------------------------------
// SE PROFILE API
// ----------------------------------------------------------------------------

export async function getSEProfile(seId: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        submissions(
          id,
          mission_type_id,
          status,
          points_awarded,
          created_at,
          location_name,
          mission_types(name)
        ),
        user_achievements(
          id,
          unlocked_at,
          achievements(code, name, icon, tier)
        )
      `)
      .eq('id', seId)
      .single();

    if (userError) throw userError;

    // Fetch team info separately if team_id exists
    let teamName = user?.team || 'No Team'; // Fallback to team column
    if (user?.team_id) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', user.team_id)
        .single();
      if (teamData) teamName = teamData.name;
    }

    // Calculate stats
    const submissions = user?.submissions || [];
    const approvedSubmissions = submissions.filter((s: any) => s.status === 'approved');
    const totalPoints = approvedSubmissions.reduce((sum: number, s: any) => sum + (s.points_awarded || 0), 0);
    const approvalRate = submissions.length > 0 
      ? Math.round((approvedSubmissions.length / submissions.length) * 100) 
      : 0;
    const avgPoints = approvedSubmissions.length > 0
      ? Math.round(totalPoints / approvedSubmissions.length)
      : 0;

    // Calculate streaks (simplified - would need more complex logic in production)
    const currentStreak = 0; // TODO: Calculate from submission dates
    const longestStreak = 0; // TODO: Calculate from submission dates

    const profileData = {
      ...user,
      teamName,
      stats: {
        totalPoints,
        totalSubmissions: submissions.length,
        approvedSubmissions: approvedSubmissions.length,
        rejectedSubmissions: submissions.filter((s: any) => s.status === 'rejected').length,
        pendingSubmissions: submissions.filter((s: any) => s.status === 'pending').length,
        approvalRate,
        avgPointsPerSubmission: avgPoints,
        currentStreak,
        longestStreak,
        badgesUnlocked: user?.user_achievements?.length || 0
      },
      recentSubmissions: submissions.slice(0, 10),
      badges: user?.user_achievements || []
    };

    return {
      data: profileData,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching SE profile:', error);
    return {
      data: null,
      error: error.message || 'Failed to fetch SE profile',
    };
  }
}

export async function searchSEs(query: string) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        phone,
        email,
        region,
        role,
        employee_id,
        is_active,
        team,
        team_id,
        submissions(count)
      `)
      .eq('role', 'se')
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(20);

    if (error) throw error;

    // Fetch team names for users with team_id
    const usersWithTeams = await Promise.all(
      (users || []).map(async (user: any) => {
        let teamName = user.team || 'No Team';
        if (user.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', user.team_id)
            .single();
          if (teamData) teamName = teamData.name;
        }
        return { ...user, teamName };
      })
    );

    return {
      data: usersWithTeams,
      error: null,
    };
  } catch (error: any) {
    console.error('Error searching SEs:', error);
    return {
      data: [],
      error: error.message || 'Failed to search SEs',
    };
  }
}

export async function getAllSEs({ region, team }: { region?: string; team?: string } = {}) {
  try {
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        phone,
        email,
        region,
        employee_id,
        created_at,
        team,
        team_id,
        submissions!submissions_se_id_fkey!left(
          id,
          status,
          points_awarded
        )
      `)
      .eq('role', 'se')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    // Apply region filter
    if (region && region !== 'all') {
      query = query.eq('region', region);
    }
    
    // Apply team filter (filter by team name, not team_id)
    if (team && team !== 'all') {
      query = query.eq('team', team);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Fetch team names for users with team_id and calculate stats
    const sesWithStats = await Promise.all(
      (users || []).map(async (se: any) => {
        // Get team name
        let teamName = se.team || 'No Team';
        let teamId = null;
        if (se.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('name, id')
            .eq('id', se.team_id)
            .single();
          if (teamData) {
            teamName = teamData.name;
            teamId = teamData.id;
          }
        }

        // Calculate stats
        const submissions = se.submissions || [];
        const approvedSubmissions = submissions.filter((s: any) => s.status === 'approved');
        const totalPoints = approvedSubmissions.reduce((sum: number, s: any) => sum + (s.points_awarded || 0), 0);
        const approvalRate = submissions.length > 0
          ? Math.round((approvedSubmissions.length / submissions.length) * 100)
          : 0;

        return {
          id: se.id,
          name: se.full_name,
          phone: se.phone,
          email: se.email || 'N/A',
          region: se.region,
          team: teamName,
          teamId,
          employeeId: se.employee_id,
          joinDate: se.created_at,
          totalPoints,
          totalSubmissions: submissions.length,
          approvalRate,
        };
      })
    );

    return {
      data: sesWithStats,
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching all SEs:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch SEs',
    };
  }
}

// ----------------------------------------------------------------------------
// HOTSPOTS / BATTLE MAP API
// ----------------------------------------------------------------------------

export async function getHotspots() {
  try {
    const { data, error } = await supabase
      .from('competitor_sightings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching hotspots:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch hotspots',
    };
  }
}

export async function getCompetitorActivity() {
  try {
    const { data, error } = await supabase
      .from('competitor_sightings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      data: data || [],
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching competitor activity:', error);
    return {
      data: [],
      error: error.message || 'Failed to fetch competitor activity',
    };
  }
}

// ----------------------------------------------------------------------------
// INSTALLER LIVE LOCATION API
// ----------------------------------------------------------------------------

/**
 * Upsert the installer's live location in the installer_live_locations table.
 * @param installerId - The installer's ID (from INHOUSE_INSTALLER_6TOWNS_MARCH)
 * @param latitude - Latitude
 * @param longitude - Longitude
 */
export async function upsertInstallerLiveLocation(installerId: number, latitude: number, longitude: number) {
  try {
    const { data, error } = await supabase
      .from('installer_live_locations')
      .upsert([
        {
          installer_id: installerId,
          latitude,
          longitude,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: ['installer_id'] });
    return { data, error };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Fetch all installer live locations (with join to installer details).
 */
export async function getInstallerLiveLocations() {
  try {
    const { data, error } = await supabase
      .from('installer_live_locations')
      .select(`
        id,
        installer_id,
        latitude,
        longitude,
        updated_at,
        installer:INHOUSE_INSTALLER_6TOWNS_MARCH!installer_id(ID, "Installer name", "Installer contact", "Supervisor", "Supervisor number", "Zone", "Town")
      `);
    return { data, error };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}