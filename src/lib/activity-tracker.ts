// PWA Activity Tracker - Lightweight fire-and-forget action logger
// Tracks user actions, page views, and engagement in the Airtel Champions PWA

import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1`;

// ============================================================================
// ACTION TYPES - Standardized action type constants
// ============================================================================

export const ACTION_TYPES = {
  // Navigation
  PAGE_VIEW: 'page_view',
  TAB_SWITCH: 'tab_switch',
  
  // Auth / Session
  LOGIN: 'login',
  LOGOUT: 'logout',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  SESSION_RESUME: 'session_resume',
  
  // Programs & Submissions
  SUBMISSION_CREATE: 'submission_create',
  SUBMISSION_EDIT: 'submission_edit',
  SUBMISSION_VIEW: 'submission_view',
  PROGRAM_VIEW: 'program_view',
  PROGRAM_OPEN: 'program_open',
  
  // Social Feed
  POST_CREATE: 'post_create',
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  POST_VIEW: 'post_view',
  
  // Media
  PHOTO_UPLOAD: 'photo_upload',
  PHOTO_CAPTURE: 'photo_capture',
  
  // Leaderboard
  LEADERBOARD_VIEW: 'leaderboard_view',
  
  // Profile
  PROFILE_VIEW: 'profile_view',
  PROFILE_EDIT: 'profile_edit',
  PASSWORD_CHANGE: 'password_change',
  
  // Settings
  THEME_CHANGE: 'theme_change',
  SETTINGS_VIEW: 'settings_view',
  
  // Announcements
  ANNOUNCEMENT_VIEW: 'announcement_view',
  ANNOUNCEMENT_CREATE: 'announcement_create',
  
  // Check-in
  CHECKIN: 'checkin',
  CHECKOUT: 'checkout',
  
  // Notifications
  PUSH_SUBSCRIBE: 'push_subscribe',
  PUSH_UNSUBSCRIBE: 'push_unsubscribe',
  NOTIFICATION_CLICK: 'notification_click',
  
  // PWA
  PWA_INSTALL: 'pwa_install',
  APP_UPDATE: 'app_update',
  OFFLINE_ACTION: 'offline_action',
  
  // Van Calendar
  VAN_SCHEDULE_VIEW: 'van_schedule_view',
  VAN_SCHEDULE_CREATE: 'van_schedule_create',
  
  // Admin
  USER_CREATE: 'user_create',
  USER_EDIT: 'user_edit',
  USER_DELETE: 'user_delete',
  BULK_UPLOAD: 'bulk_upload',
  
  // Errors
  ERROR: 'error',
  API_ERROR: 'api_error',
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

// ============================================================================
// DEVICE INFO
// ============================================================================

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';

  return {
    deviceType,
    platform: navigator.platform || 'unknown',
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    language: navigator.language,
    online: navigator.onLine,
    standalone: (window.matchMedia?.('(display-mode: standalone)').matches) || 
                ((navigator as any).standalone === true),
    userAgent: ua.substring(0, 150),
  };
}

// ============================================================================
// SESSION ID (persistent for current session)
// ============================================================================

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  _sessionId = sessionStorage.getItem('pwa_activity_session_id');
  if (!_sessionId) {
    _sessionId = crypto.randomUUID();
    sessionStorage.setItem('pwa_activity_session_id', _sessionId);
  }
  return _sessionId;
}

// ============================================================================
// OFFLINE QUEUE (logs actions when offline, syncs when back online)
// ============================================================================

const QUEUE_KEY = 'pwa_activity_queue';

function getOfflineQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: any[]) {
  try {
    const trimmed = queue.slice(-500);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full
  }
}

async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  try {
    const response = await fetch(`${SERVER_BASE}/activity-batch`, { // ✅ FIXED
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ actions: queue }),
    });

    if (response.ok) {
      localStorage.removeItem(QUEUE_KEY);
      console.log(`[ActivityTracker] Flushed ${queue.length} queued actions`);
    }
  } catch {
    // Still offline, keep the queue
  }
}

// ============================================================================
// CORE LOG FUNCTION
// ============================================================================

let _currentUser: { id: string; name: string; role: string } | null = null;

/**
 * Set the current user context. Call this after login.
 */
export function setActivityUser(userId: string, userName: string, userRole: string) {
  _currentUser = { id: userId, name: userName, role: userRole };
}

/**
 * Clear user context. Call on logout.
 */
export function clearActivityUser() {
  _currentUser = null;
}

/**
 * Log a PWA action. Fire and forget - never throws.
 *
 * @param actionType - The type of action (use ACTION_TYPES constants)
 * @param details - Optional details object
 * @param userId - Override user ID (defaults to current user)
 */
export function logPWAAction(
  actionType: string,
  details: Record<string, any> = {},
  userId?: string
) {
  const now = new Date().toISOString();
  const user = _currentUser;

  const action = {
    userId: userId || user?.id || 'anonymous',
    userName: user?.name || 'Unknown',
    userRole: user?.role || 'unknown',
    actionType,
    actionDetails: {
      ...details,
      url: window.location.href,
      tab: new URLSearchParams(window.location.search).get('tab') || 'home',
    },
    sessionId: getSessionId(),
    deviceInfo: getDeviceInfo(),
    timestamp: now,
  };

  // If offline, queue it
  if (!navigator.onLine) {
    const queue = getOfflineQueue();
    queue.push(action);
    saveOfflineQueue(queue);
    return;
  }

  // Fire and forget
  fetch(`${SERVER_BASE}/activity-log`, { // ✅ FIXED
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(action),
  }).then((res) => {
    if (res.ok) {
      console.log(`[ActivityTracker] ✅ Logged: ${actionType}`, Object.keys(details).length > 0 ? details : '');
    } else {
      console.warn(`[ActivityTracker] ⚠️ Server returned ${res.status} for ${actionType}`);
      const queue = getOfflineQueue();
      queue.push(action);
      saveOfflineQueue(queue);
    }
  }).catch(() => {
    const queue = getOfflineQueue();
    queue.push(action);
    saveOfflineQueue(queue);
    console.log(`[ActivityTracker] 📦 Queued offline: ${actionType}`);
  });
}

// ============================================================================
// AUTO-TRACKING SETUP
// ============================================================================

let _autoTrackingInitialized = false;

/**
 * Initialize automatic activity tracking.
 * Call this once after login with the user's info.
 */
export function initActivityTracking(userId: string, userName: string, userRole: string) {
  setActivityUser(userId, userName, userRole);

  if (_autoTrackingInitialized) return;
  _autoTrackingInitialized = true;

  // Log session start
  logPWAAction(ACTION_TYPES.SESSION_START);

  // Flush any offline queue
  flushOfflineQueue();

  // Listen for online events to flush queue
  window.addEventListener('online', () => {
    flushOfflineQueue();
    logPWAAction(ACTION_TYPES.SESSION_RESUME, { reason: 'network_restored' });
  });

  // Track visibility changes (app backgrounded/foregrounded)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      logPWAAction(ACTION_TYPES.SESSION_RESUME, { reason: 'visibility_visible' });
    }
  });

  // Track page unload
  window.addEventListener('beforeunload', () => {
    logPWAAction(ACTION_TYPES.SESSION_END);
  });

  // Track PWA install
  window.addEventListener('appinstalled', () => {
    logPWAAction(ACTION_TYPES.PWA_INSTALL);
  });

  // Periodic heartbeat (every 5 minutes) to track active time
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      logPWAAction('heartbeat', { type: 'active_ping' });
    }
  }, 5 * 60 * 1000);

  console.log('[ActivityTracker] Initialized for', userName, `(${userRole})`);
}

/**
 * Convenience: Track a tab switch
 */
export function trackTabSwitch(fromTab: string, toTab: string) {
  logPWAAction(ACTION_TYPES.TAB_SWITCH, { from: fromTab, to: toTab });
}

/**
 * Convenience: Track a page/screen view
 */
export function trackPageView(pageName: string, extra?: Record<string, any>) {
  logPWAAction(ACTION_TYPES.PAGE_VIEW, { page: pageName, ...extra });
}

/**
 * Convenience: Track an error
 */
export function trackError(errorMessage: string, context?: string) {
  logPWAAction(ACTION_TYPES.ERROR, { error: errorMessage, context });
}