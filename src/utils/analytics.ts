/**
 * Analytics Tracking Utility
 * Tracks user sessions, page views, and actions for Airtel Champions
 * Works with new analytics schema: user_sessions, page_views, user_actions
 */

import { getSupabaseClient } from './supabase/client';

/**
 * Track user login - creates a new session
 * Non-blocking: Returns null if tables don't exist or RLS blocks access
 */
export const trackLogin = async (userId: string): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient();
    const sessionId = crypto.randomUUID();
    
    // Store session ID in localStorage for later use
    localStorage.setItem('analytics_session_id', sessionId);
    
    // Detect device type
    const userAgent = navigator.userAgent;
    let deviceType = 'web';
    if (/Android/i.test(userAgent)) {
      deviceType = 'android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = 'ios';
    }
    
    // Log session start in database (non-blocking)
    const { error } = await supabase.from('user_sessions').insert({
      id: sessionId,
      user_id: userId,
      session_start: new Date().toISOString(),
      device_type: deviceType,
      app_version: '1.0.0',
      user_agent: userAgent,
    });
    
    if (error) {
      // Silently fail for ANY database error — table may not exist, wrong schema, or RLS blocks
      console.log('[Analytics] ℹ️ Session tracking unavailable (table not configured)');
      return null;
    }
    
    console.log('[Analytics] ✅ Login tracked:', sessionId);
    return sessionId;
  } catch (error) {
    // Don't block login if analytics fails
    console.log('[Analytics] ℹ️ Session tracking skipped:', error);
    return null;
  }
};

/**
 * Track user logout - ends the current session
 */
export const trackLogout = async (): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) return;
    
    // Update session end time
    const { error } = await supabase
      .from('user_sessions')
      .update({
        session_end: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.warn('[Analytics] Failed to track logout:', error);
      return;
    }
    
    // Remove session ID from localStorage
    localStorage.removeItem('analytics_session_id');
    
    console.log('[Analytics] ✅ Logout tracked');
  } catch (error) {
    console.warn('[Analytics] Error tracking logout:', error);
  }
};

/**
 * Track page view
 */
export const trackPageView = async (
  userId: string,
  sessionId: string,
  pageName: string,
  pageUrl?: string
): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient();
    
    if (!userId) return null;
    
    // ⚠️ TEMPORARILY DISABLED: RLS policy blocking inserts
    // Analytics will be re-enabled after proper RLS policies are configured
    console.log('[Analytics] Page view tracking disabled (RLS policy issue)');
    return null;
    
    /* DISABLED CODE - Re-enable after fixing RLS policies
    const pageViewId = crypto.randomUUID();
    
    const { error } = await supabase.from('page_views').insert({
      id: pageViewId,
      user_id: userId,
      session_id: sessionId,
      page_name: pageName,
      page_url: pageUrl || window.location.pathname,
      viewed_at: new Date().toISOString(),
    });
    
    if (error) {
      console.warn('[Analytics] Failed to track page view:', error);
      return null;
    }
    
    return pageViewId;
    */
  } catch (error) {
    console.warn('[Analytics] Error tracking page view:', error);
    return null;
  }
};

/**
 * Update time spent on a page
 */
export const updatePageTimeSpent = async (
  pageViewId: string,
  timeSpentSeconds: number
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('page_views')
      .update({
        time_spent_seconds: timeSpentSeconds,
      })
      .eq('id', pageViewId);
    
    if (error) {
      console.warn('[Analytics] Failed to update time spent:', error);
    }
  } catch (error) {
    console.warn('[Analytics] Error updating time spent:', error);
  }
};

/**
 * Track user action
 */
export const trackAction = async (
  actionType: string,
  actionDetails?: Record<string, any>
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const userId = getUserId();
    const sessionId = localStorage.getItem('analytics_session_id');
    
    if (!userId) return;
    
    // ⚠️ TEMPORARILY DISABLED: RLS policy blocking inserts
    // Analytics will be re-enabled after proper RLS policies are configured
    console.log('[Analytics] Action tracking disabled (RLS policy issue):', actionType);
    return;
    
    /* DISABLED CODE - Re-enable after fixing RLS policies
    const { error } = await supabase.from('user_actions').insert({
      user_id: userId,
      session_id: sessionId,
      action_type: actionType,
      action_details: actionDetails || null,
      performed_at: new Date().toISOString(),
    });
    
    if (error) {
      console.warn('[Analytics] Failed to track action:', error);
      return;
    }
    
    console.log('[Analytics] ✅ Action tracked:', actionType);
    */
  } catch (error) {
    console.warn('[Analytics] Error tracking action:', error);
  }
};

/**
 * Helper: Get user ID from localStorage
 */
const getUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('tai_user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch (error) {
    return null;
  }
};

// ============================================
// PREDEFINED ACTION TYPES
// Use these constants for consistency
// ============================================

export const ANALYTICS_ACTIONS = {
  // Program actions
  SUBMIT_PROGRAM: 'submit_program',
  VIEW_PROGRAM: 'view_program',
  CREATE_PROGRAM: 'create_program',
  DELETE_PROGRAM: 'delete_program',
  
  // Shop verification
  VERIFY_SHOP: 'verify_shop',
  VIEW_SHOP: 'view_shop',
  
  // Social actions
  CREATE_POST: 'create_post',
  LIKE_POST: 'like_post',
  COMMENT_POST: 'comment_post',
  SHARE_POST: 'share_post',
  VIEW_POST: 'view_post',
  
  // Leaderboard
  VIEW_LEADERBOARD: 'view_leaderboard',
  VIEW_HALL_OF_FAME: 'view_hall_of_fame',
  
  // Groups
  CREATE_GROUP: 'create_group',
  JOIN_GROUP: 'join_group',
  VIEW_GROUP: 'view_group',
  SEND_MESSAGE: 'send_message',
  
  // Calling
  START_CALL: 'start_call',
  END_CALL: 'end_call',
  ANSWER_CALL: 'answer_call',
  DECLINE_CALL: 'decline_call',
  
  // Profile
  UPDATE_PROFILE: 'update_profile',
  VIEW_PROFILE: 'view_profile',
  UPLOAD_PROFILE_PICTURE: 'upload_profile_picture',
  
  // Settings
  CHANGE_PASSWORD: 'change_password',
  UPDATE_SETTINGS: 'update_settings',
  
  // Navigation
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_EXPLORE: 'view_explore',
  VIEW_PROGRAMS: 'view_programs',
  VIEW_SUBMISSIONS: 'view_submissions',
  
  // Announcements
  VIEW_ANNOUNCEMENT: 'view_announcement',
  CREATE_ANNOUNCEMENT: 'create_announcement',
  
  // Director actions
  APPROVE_SUBMISSION: 'approve_submission',
  REJECT_SUBMISSION: 'reject_submission',
  RESET_POINTS: 'reset_points',
  
  // Reporting
  EXPORT_DATA: 'export_data',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

// ============================================
// PAGE NAMES - Use these for consistency
// ============================================

export const ANALYTICS_PAGES = {
  DASHBOARD: 'Dashboard',
  EXPLORE: 'Explore Feed',
  PROGRAMS: 'Programs',
  LEADERBOARD: 'Leaderboard',
  HALL_OF_FAME: 'Hall of Fame',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  GROUPS: 'Groups',
  GROUP_CHAT: 'Group Chat',
  SUBMISSIONS: 'Submissions',
  ANALYTICS: 'Analytics',
  REPORTING: 'Reporting Structure',
  DIRECTOR_LINE: 'Director Line',
  CALLING: 'Calling',
  ANNOUNCEMENTS: 'Announcements',
} as const;