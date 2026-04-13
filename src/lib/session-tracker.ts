/**
 * Session Tracking Utility
 * Tracks user login/logout, session duration, and online status
 */

import { supabase } from '../utils/supabase/client';

export interface UserSession {
  userId: string;
  userName: string;
  userRole: string;
  loginTime: number;
  lastActivity: number;
  sessionId?: string; // Database session ID
}

/**
 * Track user login - creates a new session in database
 * Non-blocking: Won't prevent login if database tables don't exist
 */
export async function trackUserLogin(userId: string, userName: string, userRole: string) {
  try {
    const now = Date.now();
    const sessionData: UserSession = {
      userId,
      userName,
      userRole,
      loginTime: now,
      lastActivity: now
    };

    // Get employee ID from localStorage
    const storedUser = localStorage.getItem('tai_user');
    let employeeId = 'UNKNOWN';
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      employeeId = userData.employee_id || userData.employeeId || 'UNKNOWN';
    }

    // Detect device type from User Agent
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    if (/Mobi|Android/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      deviceType = 'Tablet';
    }

    // Try to store in database (non-blocking - will fail silently if table doesn't exist)
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          employee_id: employeeId,
          login_time: new Date().toISOString(),
          is_active: true,
          device_type: deviceType,
        })
        .select()
        .single();

      if (error) {
        // Silently handle ALL database errors — table may not exist, have wrong columns, or RLS blocks
        console.log('[SessionTracker] ℹ️ Database tracking unavailable (table not configured)');
      } else if (data) {
        sessionData.sessionId = data.id;
        console.log('[SessionTracker] ✅ Session created in database:', data.id);
      }
    } catch (dbError) {
      // Database errors shouldn't block login
      console.log('[SessionTracker] ℹ️ Database tracking skipped');
    }

    // Store session in localStorage (for backward compatibility)
    localStorage.setItem(`user_session_${userId}`, JSON.stringify(sessionData));
    console.log(`[SessionTracker] ✅ Tracked login for ${userName} (${userRole})`);
    
    return sessionData.sessionId;
  } catch (error) {
    console.error('[SessionTracker] Error tracking login:', error);
    return null;
  }
}

/**
 * Update user's last activity timestamp
 */
export function updateUserActivity(userId: string) {
  try {
    const sessionKey = `user_session_${userId}`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData);
      session.lastActivity = Date.now();
      localStorage.setItem(sessionKey, JSON.stringify(session));
    }
  } catch (error) {
    console.error('[SessionTracker] Error updating activity:', error);
  }
}

/**
 * Track user logout - marks session as ended in database
 */
export async function trackUserLogout(userId: string, removeSession: boolean = false) {
  try {
    const sessionKey = `user_session_${userId}`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (sessionData) {
      const session: UserSession = JSON.parse(sessionData);
      
      // Update database session
      if (session.sessionId) {
        const loginTime = new Date(session.loginTime);
        const logoutTime = new Date();
        const durationMinutes = Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60));
        
        const { error } = await supabase
          .from('user_sessions')
          .update({
            logout_time: logoutTime.toISOString(),
            is_active: false,
            session_duration_minutes: durationMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.sessionId);
        
        if (error) {
          console.error('[SessionTracker] Error updating logout in database:', error);
        } else {
          console.log(`[SessionTracker] ✅ Session ended in database (${durationMinutes} minutes)`);
        }
      }
      
      session.lastActivity = Date.now();
      localStorage.setItem(sessionKey, JSON.stringify(session));
      console.log(`[SessionTracker] ✅ Updated logout time for user ${userId}`);
    }
    
    if (removeSession) {
      // Remove session from localStorage
      localStorage.removeItem(sessionKey);
      console.log(`[SessionTracker] ✅ Removed session from localStorage for user ${userId}`);
    }
  } catch (error) {
    console.error('[SessionTracker] Error tracking logout:', error);
  }
}

/**
 * Get all active sessions
 */
export function getAllSessions(): UserSession[] {
  try {
    const sessions: UserSession[] = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('user_session_')) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            sessions.push(JSON.parse(sessionData));
          }
        } catch (e) {
          // Skip invalid sessions
        }
      }
    });
    
    return sessions;
  } catch (error) {
    console.error('[SessionTracker] Error getting all sessions:', error);
    return [];
  }
}

/**
 * Clean up old sessions (older than 24 hours of inactivity)
 */
export function cleanupOldSessions() {
  try {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const keys = Object.keys(localStorage);
    let cleaned = 0;
    
    keys.forEach(key => {
      if (key.startsWith('user_session_')) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session: UserSession = JSON.parse(sessionData);
            if (now - session.lastActivity > maxAge) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch (e) {
          // Remove corrupted sessions
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`[SessionTracker] ✅ Cleaned up ${cleaned} old sessions`);
    }
  } catch (error) {
    console.error('[SessionTracker] Error cleaning up sessions:', error);
  }
}

/**
 * Initialize session tracker - call on app start
 */
export function initSessionTracker() {
  // Clean up old sessions on init
  cleanupOldSessions();
  
  // Set up periodic cleanup (every hour)
  setInterval(cleanupOldSessions, 60 * 60 * 1000);
  
  console.log('[SessionTracker] ✅ Initialized');
}