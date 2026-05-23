// ============================================================================
// PUSH NOTIFICATIONS MODULE
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Handles: FCM notifications, device tokens, notification history
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  failedTokens?: string[];
}

// ============================================================================
// DEVICE TOKEN MANAGEMENT
// ============================================================================

/**
 * Register device token for push notifications
 * POST /v1/devices/register
 */
export async function registerDevice(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<{ success: boolean; error?: string }> {
  console.log(`📱 Registering device for user ${userId} (${platform})`);
  
  try {
    // Upsert device token
    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token,
        platform,
        is_active: true,
        last_used_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Device registered successfully`);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Device registration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Unregister device token
 * POST /v1/devices/unregister
 */
export async function unregisterDevice(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`📱 Unregistering device for user ${userId}`);
  
  try {
    const { error } = await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's active devices
 */
export async function getUserDevices(
  userId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// PUSH NOTIFICATION SENDING (FCM)
// ============================================================================

/**
 * Send push notification to specific user
 * Uses FCM REST API
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<SendNotificationResult> {
  console.log(`🔔 Sending notification to user ${userId}: ${payload.title}`);
  
  try {
    // Get user's active devices
    const { data: devices } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!devices || devices.length === 0) {
      console.log(`⚠️ No active devices found for user ${userId}`);
      return {
        success: false,
        error: 'No active devices'
      };
    }
    
    const tokens = devices.map(d => d.token);
    
    // Send to all user's devices
    const result = await sendNotificationToTokens(tokens, payload);
    
    // Log notification
    await logNotification(userId, payload, result.success);
    
    return result;
  } catch (error: any) {
    console.error('❌ Failed to send notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}> {
  console.log(`🔔 Sending notification to ${userIds.length} users`);
  
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotificationToUser(userId, payload))
  );
  
  const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - sent;
  const errors = results
    .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error);
  
  return {
    success: sent > 0,
    sent,
    failed,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Send notification to specific device tokens
 * This is where actual FCM API call would happen
 */
async function sendNotificationToTokens(
  tokens: string[],
  payload: NotificationPayload
): Promise<SendNotificationResult> {
  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
  
  if (!FCM_SERVER_KEY) {
    console.warn('⚠️ FCM_SERVER_KEY not configured - notification not sent');
    // In development, just log and return success
    console.log(`📬 [DEV] Would send notification: ${payload.title}`);
    return {
      success: true,
      messageId: 'dev-mode'
    };
  }
  
  try {
    // Construct FCM message
    const message = {
      registration_ids: tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.imageUrl,
        sound: payload.sound || 'default',
      },
      data: payload.data || {},
      priority: payload.priority || 'high',
      content_available: true,
    };
    
    // Send to FCM
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FCM error: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Notification sent successfully:`, result);
    
    // Handle failed tokens
    const failedTokens: string[] = [];
    if (result.results) {
      result.results.forEach((res: any, index: number) => {
        if (res.error) {
          failedTokens.push(tokens[index]);
          console.warn(`⚠️ Token failed: ${res.error}`);
        }
      });
    }
    
    // Deactivate failed tokens
    if (failedTokens.length > 0) {
      await deactivateTokens(failedTokens);
    }
    
    return {
      success: result.success > 0,
      messageId: result.multicast_id,
      failedTokens: failedTokens.length > 0 ? failedTokens : undefined
    };
    
  } catch (error: any) {
    console.error('❌ FCM send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Deactivate invalid tokens
 */
async function deactivateTokens(tokens: string[]): Promise<void> {
  try {
    await supabase
      .from('device_tokens')
      .update({ is_active: false })
      .in('token', tokens);
    
    console.log(`🗑️ Deactivated ${tokens.length} invalid tokens`);
  } catch (error) {
    console.error('Failed to deactivate tokens:', error);
  }
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

/**
 * Pre-defined notification templates
 */
export const NotificationTemplates = {
  submissionApproved: (points: number): NotificationPayload => ({
    title: 'Submission Approved! 🎉',
    body: `Great work! You earned ${points} points.`,
    data: {
      type: 'submission_approved',
      points: points.toString()
    },
    priority: 'high'
  }),
  
  submissionRejected: (reason: string): NotificationPayload => ({
    title: 'Submission Needs Revision',
    body: reason,
    data: {
      type: 'submission_rejected'
    },
    priority: 'normal'
  }),
  
  achievementUnlocked: (achievementName: string): NotificationPayload => ({
    title: 'Achievement Unlocked! 🏆',
    body: `You've earned: ${achievementName}`,
    data: {
      type: 'achievement_unlocked',
      achievement: achievementName
    },
    priority: 'high'
  }),
  
  leaderboardRankUp: (newRank: number): NotificationPayload => ({
    title: 'You Moved Up! ⬆️',
    body: `You're now ranked #${newRank} on the leaderboard!`,
    data: {
      type: 'leaderboard_rank_up',
      rank: newRank.toString()
    },
    priority: 'normal'
  }),
  
  challengeReminder: (challengeName: string, daysLeft: number): NotificationPayload => ({
    title: 'Challenge Reminder ⏰',
    body: `${challengeName} ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
    data: {
      type: 'challenge_reminder',
      challenge: challengeName
    },
    priority: 'normal'
  }),
  
  dailyGoalReminder: (): NotificationPayload => ({
    title: 'Daily Goal Reminder 📍',
    body: 'You haven\'t submitted today. Keep your streak going!',
    data: {
      type: 'daily_goal_reminder'
    },
    priority: 'normal'
  }),
  
  weeklyReport: (submissions: number, points: number, rank: number): NotificationPayload => ({
    title: 'Weekly Report 📊',
    body: `This week: ${submissions} submissions, ${points} points, Rank #${rank}`,
    data: {
      type: 'weekly_report',
      submissions: submissions.toString(),
      points: points.toString(),
      rank: rank.toString()
    },
    priority: 'normal'
  })
};

// ============================================================================
// NOTIFICATION HISTORY & LOGGING
// ============================================================================

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  payload: NotificationPayload,
  success: boolean
): Promise<void> {
  try {
    await supabase.from('notification_history').insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      success,
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Get notification history for user
 * GET /v1/notifications/history
 */
export async function getNotificationHistory(
  userId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      data: data || []
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// TOPIC SUBSCRIPTIONS (FOR BROADCAST)
// ============================================================================

/**
 * Subscribe user to topic
 * Topics: 'all_users', 'region_nairobi', 'top_performers', etc.
 */
export async function subscribeToTopic(
  userId: string,
  topic: string
): Promise<{ success: boolean; error?: string }> {
  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
  
  if (!FCM_SERVER_KEY) {
    return { success: false, error: 'FCM not configured' };
  }
  
  try {
    // Get user's tokens
    const { data: devices } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!devices || devices.length === 0) {
      return { success: false, error: 'No active devices' };
    }
    
    // Subscribe each token to topic
    for (const device of devices) {
      await fetch(`https://iid.googleapis.com/iid/v1/${device.token}/rel/topics/${topic}`, {
        method: 'POST',
        headers: {
          'Authorization': `key=${FCM_SERVER_KEY}`,
        },
      });
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notification to topic (broadcast)
 */
export async function sendNotificationToTopic(
  topic: string,
  payload: NotificationPayload
): Promise<SendNotificationResult> {
  const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
  
  if (!FCM_SERVER_KEY) {
    console.warn('⚠️ FCM_SERVER_KEY not configured');
    return { success: false, error: 'FCM not configured' };
  }
  
  try {
    const message = {
      to: `/topics/${topic}`,
      notification: {
        title: payload.title,
        body: payload.body,
        image: payload.imageUrl,
      },
      data: payload.data || {},
      priority: payload.priority || 'high',
    };
    
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    if (!response.ok) {
      throw new Error(`FCM error: ${await response.text()}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      messageId: result.message_id
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// SCHEDULED NOTIFICATIONS
// ============================================================================

/**
 * Schedule notification for later
 * Note: For production, use a job queue like BullMQ
 */
export async function scheduleNotification(
  userId: string,
  payload: NotificationPayload,
  sendAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('scheduled_notifications').insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      send_at: sendAt,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const pushNotifications = {
  // Device management
  registerDevice,
  unregisterDevice,
  getUserDevices,
  
  // Send notifications
  sendNotificationToUser,
  sendNotificationToUsers,
  
  // Templates
  NotificationTemplates,
  
  // History
  getNotificationHistory,
  
  // Topics
  subscribeToTopic,
  sendNotificationToTopic,
  
  // Scheduling
  scheduleNotification,
};
