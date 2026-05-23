import { supabase } from './supabase/client';

/**
 * Send notification to specific users
 */
export async function sendNotification(params: {
  userIds: string[];
  type: 'new_program' | 'program_update' | 'submission_approved' | 'submission_rejected' | 'achievement';
  title: string;
  message: string;
  data?: any;
}) {
  const { userIds, type, title, message, data } = params;

  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('[Notifications] Error sending:', error);
      throw error;
    }

    console.log(`[Notifications] ✅ Sent ${notifications.length} notifications`);
  } catch (err) {
    console.error('[Notifications] Failed to send:', err);
    throw err;
  }
}

/**
 * Send notification to all users with specific roles
 */
export async function sendNotificationToRoles(params: {
  roles: string[];
  type: 'new_program' | 'program_update' | 'submission_approved' | 'submission_rejected' | 'achievement';
  title: string;
  message: string;
  data?: any;
}) {
  const { roles, type, title, message, data } = params;

  try {
    // Fetch all users with specified roles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, employee_id')
      .in('role', roles);

    if (usersError) {
      console.error('[Notifications] Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      console.log('[Notifications] No users found for roles:', roles);
      return;
    }

    const userIds = users.map(u => u.id || u.employee_id).filter(Boolean);

    await sendNotification({
      userIds,
      type,
      title,
      message,
      data
    });

    console.log(`[Notifications] ✅ Sent to ${userIds.length} users with roles:`, roles);
  } catch (err) {
    console.error('[Notifications] Failed to send to roles:', err);
    throw err;
  }
}

/**
 * Notify all target users when a new program is created
 */
export async function notifyNewProgram(program: {
  id: string;
  title: string;
  description: string;
  points_value: number;
  target_roles: string[];
}) {
  try {
    await sendNotificationToRoles({
      roles: program.target_roles,
      type: 'new_program',
      title: '🎯 New Program Available!',
      message: `"${program.title}" - Worth ${program.points_value} points. Tap to view details and start submitting.`,
      data: {
        program_id: program.id,
        program_title: program.title,
        points_value: program.points_value
      }
    });

    console.log('[Notifications] ✅ New program announcement sent:', program.title);
  } catch (err) {
    console.error('[Notifications] Failed to announce new program:', err);
  }
}

/**
 * Notify when a program is updated
 */
export async function notifyProgramUpdate(program: {
  id: string;
  title: string;
  target_roles: string[];
}) {
  try {
    await sendNotificationToRoles({
      roles: program.target_roles,
      type: 'program_update',
      title: '📝 Program Updated',
      message: `"${program.title}" has been updated. Tap to view changes.`,
      data: {
        program_id: program.id,
        program_title: program.title
      }
    });

    console.log('[Notifications] ✅ Program update notification sent:', program.title);
  } catch (err) {
    console.error('[Notifications] Failed to send program update:', err);
  }
}

/**
 * Notify user when their submission is reviewed
 */
export async function notifySubmissionReviewed(params: {
  userId: string;
  programTitle: string;
  status: 'approved' | 'rejected';
  points?: number;
  feedback?: string;
}) {
  const { userId, programTitle, status, points, feedback } = params;

  try {
    await sendNotification({
      userIds: [userId],
      type: status === 'approved' ? 'submission_approved' : 'submission_rejected',
      title: status === 'approved' ? '✅ Submission Approved!' : '❌ Submission Needs Review',
      message: status === 'approved'
        ? `Your submission for "${programTitle}" was approved! You earned ${points} points.${feedback ? ' ' + feedback : ''}`
        : `Your submission for "${programTitle}" needs revision.${feedback ? ' Reason: ' + feedback : ''}`,
      data: {
        program_title: programTitle,
        status,
        points,
        feedback
      }
    });

    console.log('[Notifications] ✅ Submission review notification sent to:', userId);
  } catch (err) {
    console.error('[Notifications] Failed to send submission review:', err);
  }
}

/**
 * Notify user of achievement (level up, badge, etc.)
 */
export async function notifyAchievement(params: {
  userId: string;
  title: string;
  message: string;
  data?: any;
}) {
  const { userId, title, message, data } = params;

  try {
    await sendNotification({
      userIds: [userId],
      type: 'achievement',
      title,
      message,
      data
    });

    console.log('[Notifications] ✅ Achievement notification sent to:', userId);
  } catch (err) {
    console.error('[Notifications] Failed to send achievement:', err);
  }
}
