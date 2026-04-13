// ============================================================================
// MOBILE API ENDPOINTS
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Endpoints specifically designed for Flutter mobile app
// ============================================================================

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// HELPERS
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

function parsePagination(limit?: string, offset?: string) {
  const parsedLimit = Math.min(parseInt(limit || '50'), 100); // Max 100
  const parsedOffset = parseInt(offset || '0');
  return { limit: parsedLimit, offset: parsedOffset };
}

function isLocationInKenya(latitude: number, longitude: number): boolean {
  const KENYA_BOUNDS = {
    minLat: -4.7,
    maxLat: 5.5,
    minLon: 33.9,
    maxLon: 41.9,
  };
  
  return (
    latitude >= KENYA_BOUNDS.minLat &&
    latitude <= KENYA_BOUNDS.maxLat &&
    longitude >= KENYA_BOUNDS.minLon &&
    longitude <= KENYA_BOUNDS.maxLon
  );
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Request OTP code
 * POST /v1/auth/request-otp
 */
export async function requestOTP(phone: string): Promise<{success: boolean; message?: string; error?: string}> {
  try {
    // Validate phone format
    const phoneRegex = /^\+254[17]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return { success: false, error: 'Invalid phone number format. Use +254XXXXXXXXX' };
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('app_users')
      .select('id, is_active')
      .eq('phone_number', phone)
      .single();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is inactive. Contact support.' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('Failed to save OTP:', insertError);
      return { success: false, error: 'Failed to generate OTP' };
    }

    // TODO: Send SMS via Africa's Talking
    // For now, just log (in production, integrate SMS service)
    console.log(`OTP for ${phone}: ${code}`);

    return {
      success: true,
      message: 'OTP sent successfully. Valid for 10 minutes.'
    };
  } catch (error: any) {
    console.error('OTP request error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Verify OTP code
 * POST /v1/auth/verify-otp
 */
export async function verifyOTP(phone: string, code: string): Promise<any> {
  try {
    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return { success: false, error: 'Invalid or expired OTP' };
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, phone_number, full_name, email, role, region, employee_id')
      .eq('phone_number', phone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Create auth session (temporary implementation)
    // In production, use proper Supabase auth
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      phone: user.phone_number,
      role: user.role,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    })).toString('base64');

    return {
      success: true,
      data: {
        accessToken: sessionToken,
        refreshToken: sessionToken, // Simplified for now
        user: {
          id: user.id,
          phone: user.phone_number,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          region: user.region,
          employeeId: user.employee_id
        }
      }
    };
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Login with PIN
 * POST /v1/auth/login-pin
 */
export async function loginWithPIN(phone: string, pin: string): Promise<any> {
  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('id, phone_number, full_name, email, role, region, employee_id, pin_hash, is_active')
      .eq('phone_number', phone)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is inactive' };
    }

    // TODO: Verify PIN hash with bcrypt
    // For now, simplified check (MUST be replaced with bcrypt in production)
    // const validPin = await bcrypt.compare(pin, user.pin_hash);
    // if (!validPin) return { success: false, error: 'Invalid credentials' };

    // Create session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: user.id,
      phone: user.phone_number,
      role: user.role,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000)
    })).toString('base64');

    return {
      success: true,
      data: {
        accessToken: sessionToken,
        refreshToken: sessionToken,
        user: {
          id: user.id,
          phone: user.phone_number,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          region: user.region,
          employeeId: user.employee_id
        }
      }
    };
  } catch (error: any) {
    console.error('PIN login error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// PHOTO UPLOAD
// ============================================================================

/**
 * Upload photo to storage
 * POST /v1/photos/upload
 */
export async function uploadPhoto(file: File, userId: string): Promise<any> {
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Only JPEG and PNG images are allowed' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('submissions-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: 'Failed to upload photo' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions-photos')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        url: publicUrl,
        fileName,
        uploadedAt: new Date().toISOString()
      }
    };
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * Create submission
 * POST /v1/submissions
 */
export async function createSubmission(data: any, userId: string): Promise<any> {
  try {
    const {
      missionTypeId,
      photoUrl,
      location,
      locationName,
      notes,
      clientId
    } = data;

    // Validate required fields
    if (!missionTypeId || !location) {
      return { success: false, error: 'Mission type and location are required' };
    }

    // Validate location is in Kenya
    if (!isLocationInKenya(location.latitude, location.longitude)) {
      return { success: false, error: 'Location must be within Kenya' };
    }

    // Create submission
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        se_id: userId,  // ✅ FIXED: Changed from user_id to se_id
        mission_type_id: missionTypeId,
        photo_url: photoUrl,
        location: `POINT(${location.longitude} ${location.latitude})`,
        location_name: locationName || 'Unknown',
        notes,
        client_id: clientId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        mission_type_id,
        status,
        photo_url,
        location_name,
        notes,
        created_at
      `)
      .single();

    if (error) {
      console.error('Submission creation error:', error);
      return { success: false, error: 'Failed to create submission' };
    }

    return {
      success: true,
      data: submission,
      message: 'Submission created successfully'
    };
  } catch (error: any) {
    console.error('Create submission error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get user's submissions
 * GET /v1/submissions/my
 */
export async function getMySubmissions(userId: string, params: any): Promise<any> {
  try {
    const { limit, offset } = parsePagination(params.limit, params.offset);
    const status = params.status;

    // Build query
    let query = supabase
      .from('submissions')
      .select(`
        id,
        mission_type_id,
        mission_types!inner(name, base_points),
        status,
        photo_url,
        location_name,
        notes,
        points_awarded,
        created_at,
        reviewed_at
      `, { count: 'exact' })
      .eq('se_id', userId)  // ✅ FIXED: Changed from user_id to se_id
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch submissions error:', error);
      return { success: false, error: 'Failed to fetch submissions' };
    }

    return {
      success: true,
      data,
      meta: {
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: offset + limit < (count || 0)
        }
      }
    };
  } catch (error: any) {
    console.error('Get submissions error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * Get current user profile
 * GET /v1/users/me
 */
export async function getCurrentUser(userId: string): Promise<any> {
  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select(`
        id,
        phone_number,
        full_name,
        email,
        role,
        region,
        employee_id,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return { success: false, error: 'User not found' };
    }

    // Get user stats
    const { data: statsData } = await supabase
      .from('submissions')
      .select('status, points_awarded')
      .eq('se_id', userId);  // ✅ FIXED: Changed from user_id to se_id

    const stats = {
      totalSubmissions: statsData?.length || 0,
      approvedSubmissions: statsData?.filter(s => s.status === 'approved').length || 0,
      pendingSubmissions: statsData?.filter(s => s.status === 'pending').length || 0,
      rejectedSubmissions: statsData?.filter(s => s.status === 'rejected').length || 0,
      totalPoints: statsData
        ?.filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0
    };

    // Get achievements count
    const { count: achievementsCount } = await supabase
      .from('user_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      success: true,
      data: {
        ...user,
        stats: {
          ...stats,
          achievementsUnlocked: achievementsCount || 0
        }
      }
    };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Get leaderboard
 * GET /v1/leaderboard
 */
export async function getLeaderboard(params: any): Promise<any> {
  try {
    const { limit, offset } = parsePagination(params.limit, params.offset);
    const timeframe = params.timeframe || 'weekly';
    const region = params.region;

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

    // Build query
    let query = supabase
      .from('submissions')
      .select(`
        se_id,
        points_awarded,
        users!submissions_se_id_fkey(id, full_name, region, employee_id)
      `, { count: 'exact' })
      .eq('status', 'approved')
      .gte('created_at', startDate.toISOString());

    if (region) {
      query = query.eq('users.region', region);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Leaderboard query error:', error);
      return { success: false, error: 'Failed to fetch leaderboard' };
    }

    // Aggregate by user
    const userMap = new Map();
    submissions?.forEach((sub: any) => {
      const userId = sub.se_id;  // ✅ FIXED: Changed from user_id to se_id
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          name: sub.users?.full_name || 'Unknown',
          region: sub.users?.region || '',
          employeeId: sub.users?.employee_id || '',
          points: 0,
          submissions: 0
        });
      }
      const userData = userMap.get(userId);
      userData.points += sub.points_awarded || 0;
      userData.submissions += 1;
    });

    // Convert to array and sort
    let leaderboard = Array.from(userMap.values())
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    // Paginate
    const total = leaderboard.length;
    leaderboard = leaderboard.slice(offset, offset + limit);

    return {
      success: true,
      data: leaderboard,
      meta: {
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        timeframe,
        region: region || 'all'
      }
    };
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// MISSION TYPES
// ============================================================================

/**
 * Get available mission types
 * GET /v1/missions/available
 */
export async function getAvailableMissions(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('mission_types')
      .select('id, code, name, description, category, base_points, requires_photo, requires_location')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Fetch missions error:', error);
      return { success: false, error: 'Failed to fetch missions' };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Get missions error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

/**
 * Get user's achievements
 * GET /v1/achievements/my
 */
export async function getMyAchievements(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlocked_at,
        achievements!inner(
          id,
          code,
          name,
          description,
          icon,
          category,
          tier,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Fetch achievements error:', error);
      return { success: false, error: 'Failed to fetch achievements' };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Get achievements error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// CHALLENGES
// ============================================================================

/**
 * Get active challenges
 * GET /v1/challenges/active
 */
export async function getActiveChallenges(): Promise<any> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('daily_challenges')
      .select('id, title, description, start_date, end_date, target_value, reward_points')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('end_date');

    if (error) {
      console.error('Fetch challenges error:', error);
      return { success: false, error: 'Failed to fetch challenges' };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Get challenges error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const mobileAPI = {
  // Auth
  requestOTP,
  verifyOTP,
  loginWithPIN,
  
  // Photos
  uploadPhoto,
  
  // Submissions
  createSubmission,
  getMySubmissions,
  
  // User
  getCurrentUser,
  
  // Leaderboard
  getLeaderboard,
  
  // Missions
  getAvailableMissions,
  
  // Achievements
  getMyAchievements,
  
  // Challenges
  getActiveChallenges
};