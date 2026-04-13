// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// Sales Intelligence Network - Airtel Kenya
// ============================================================================
// Real-time updates using Supabase Realtime
// ============================================================================

import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface RealtimeSubmission {
  id: string;
  user_id: string;
  mission_type_id: string;
  status: SubmissionStatus;
  points_awarded: number | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface RealtimeAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
}

export interface RealtimeLeaderboardEntry {
  user_id: string;
  full_name: string;
  total_points: number;
  rank: number;
}

// ============================================================================
// SUBSCRIPTION HANDLERS
// ============================================================================

/**
 * Subscribe to new submissions
 * Fires when a new submission is created
 */
export function subscribeToSubmissions(
  callback: (payload: RealtimeSubmission) => void
): RealtimeChannel {
  const channel = supabase
    .channel('submissions-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
      },
      (payload) => {
        console.log('🆕 New submission:', payload.new);
        callback(payload.new as RealtimeSubmission);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to submission status changes
 * Fires when submission status changes (pending → approved/rejected)
 */
export function subscribeToSubmissionUpdates(
  callback: (payload: {
    old: RealtimeSubmission;
    new: RealtimeSubmission;
  }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('submission-updates-channel')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'submissions',
      },
      (payload) => {
        console.log('📝 Submission updated:', payload.new);
        callback({
          old: payload.old as RealtimeSubmission,
          new: payload.new as RealtimeSubmission,
        });
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to pending submissions only
 * Optimized for admin dashboard - only notify on new pending items
 */
export function subscribeToPendingSubmissions(
  callback: (payload: RealtimeSubmission) => void
): RealtimeChannel {
  const channel = supabase
    .channel('pending-submissions-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'submissions',
        filter: 'status=eq.pending',
      },
      (payload) => {
        console.log('⏳ New pending submission:', payload.new);
        callback(payload.new as RealtimeSubmission);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to new announcements
 * Fires when admin creates a new announcement
 */
export function subscribeToAnnouncements(
  callback: (payload: RealtimeAnnouncement) => void
): RealtimeChannel {
  const channel = supabase
    .channel('announcements-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'announcements',
      },
      (payload) => {
        console.log('📢 New announcement:', payload.new);
        callback(payload.new as RealtimeAnnouncement);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to leaderboard changes
 * Fires when user achievements unlock or points change
 */
export function subscribeToLeaderboard(
  callback: () => void
): RealtimeChannel {
  const channel = supabase
    .channel('leaderboard-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: 'status=eq.approved',
      },
      () => {
        console.log('🏆 Leaderboard changed');
        callback();
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to achievement unlocks
 * Fires when user unlocks a new achievement
 */
export function subscribeToAchievements(
  userId: string,
  callback: (achievementId: string) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`achievements-${userId}-channel`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_achievements',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log('🎉 Achievement unlocked:', payload.new);
        callback(payload.new.achievement_id);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to specific user's submissions
 * For SE mobile app - get updates on own submissions
 */
export function subscribeToUserSubmissions(
  userId: string,
  callback: (payload: RealtimeSubmission) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user-submissions-${userId}-channel`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'submissions',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📬 Your submission updated:', payload.new);
        callback(payload.new as RealtimeSubmission);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to daily challenges
 * Fires when new challenge is created or updated
 */
export function subscribeToChallenges(
  callback: () => void
): RealtimeChannel {
  const channel = supabase
    .channel('challenges-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_challenges',
      },
      () => {
        console.log('🎯 Challenge updated');
        callback();
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to competitor sightings
 * Real-time intelligence updates for battle map
 */
export function subscribeToCompetitorSightings(
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel('competitor-sightings-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'competitor_sightings',
      },
      (payload) => {
        console.log('🚨 New competitor sighting:', payload.new);
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

// ============================================================================
// PRESENCE (ONLINE USERS)
// ============================================================================

/**
 * Track online users
 * Shows which SEs/admins are currently active
 */
export function trackOnlinePresence(
  userId: string,
  userName: string,
  role: string
): RealtimeChannel {
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('👥 Online users:', Object.keys(state).length);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('✅ User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('❌ User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          role,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

/**
 * Get current online users
 */
export function getOnlineUsers(channel: RealtimeChannel): any[] {
  const state = channel.presenceState();
  return Object.values(state).flat();
}

// ============================================================================
// BROADCAST (CUSTOM EVENTS)
// ============================================================================

/**
 * Broadcast custom event to all connected clients
 * Example: Admin broadcasts "refresh leaderboard" to all SEs
 */
export function broadcastEvent(
  event: string,
  payload: any,
  channel?: RealtimeChannel
): Promise<'ok' | 'timed out' | 'rate limited'> {
  const broadcastChannel = channel || supabase.channel('broadcast-channel');
  
  return broadcastChannel
    .subscribe()
    .then(() => broadcastChannel.send({
      type: 'broadcast',
      event,
      payload,
    }));
}

/**
 * Listen to broadcast events
 */
export function listenToBroadcast(
  event: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel('broadcast-channel')
    .on('broadcast', { event }, (payload) => {
      console.log(`📡 Received broadcast event "${event}":`, payload);
      callback(payload);
    })
    .subscribe();

  return channel;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Unsubscribe from channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
  console.log('🔌 Unsubscribed from channel');
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels();
  console.log('🔌 Unsubscribed from all channels');
}

/**
 * Check channel status
 */
export function getChannelStatus(channel: RealtimeChannel): string {
  return channel.state;
}

/**
 * React Hook: useRealtimeSubmissions
 * Auto-subscribe/unsubscribe with React lifecycle
 */
export function useRealtimeSubmissions(
  callback: (payload: RealtimeSubmission) => void
) {
  const [channel, setChannel] = React.useState<RealtimeChannel | null>(null);

  React.useEffect(() => {
    const sub = subscribeToSubmissions(callback);
    setChannel(sub);

    return () => {
      if (sub) {
        unsubscribe(sub);
      }
    };
  }, [callback]);

  return channel;
}

// Fix: Import React for hooks
import * as React from 'react';

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// In a React component:

import { 
  subscribeToSubmissions, 
  subscribeToAnnouncements,
  unsubscribe 
} from './lib/realtime';

function MyComponent() {
  useEffect(() => {
    // Subscribe to new submissions
    const submissionsChannel = subscribeToSubmissions((submission) => {
      console.log('New submission:', submission);
      // Update UI, show notification, etc.
    });

    // Subscribe to announcements
    const announcementsChannel = subscribeToAnnouncements((announcement) => {
      toast(`New announcement: ${announcement.title}`);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe(submissionsChannel);
      unsubscribe(announcementsChannel);
    };
  }, []);

  return <div>My Component</div>;
}
*/

// ============================================================================
// END OF REAL-TIME SUBSCRIPTIONS
// ============================================================================
