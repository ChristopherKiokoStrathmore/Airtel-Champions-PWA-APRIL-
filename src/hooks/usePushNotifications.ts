/**
 * usePushNotifications — PWA Web Push (VAPID)
 * ─────────────────────────────────────────────
 * Handles the full browser-side push-notification lifecycle:
 *   1. Check support & current permission
 *   2. Subscribe via pushManager (using the server's VAPID public key)
 *   3. Send the PushSubscription object to the server for storage
 *   4. Expose subscribe / unsubscribe helpers to the UI
 *
 * Works on: Chrome/Edge 50+, Firefox 44+, Safari 16+ (desktop & iOS)
 * Silently no-ops on unsupported browsers.
 *
 * Usage:
 *   const push = usePushNotifications({ userId: user.id });
 *   <button onClick={push.subscribe}>Enable Notifications</button>
 */

import { useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

// The VAPID public key — safe to embed in the client
const VAPID_PUBLIC_KEY =
  'BH12_xOWot8YPv2pY1tkFCp7WUfsOS7wPz0sutPDV-FSgQTpWvEuJZzE4usw19X4Jl1JcFdlI1f_Xd8SdnvkUpU';

// ── helpers ─────────────────────────────────────────────────────────────────

/** Convert a base64url string to a Uint8Array (required for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ── types ────────────────────────────────────────────────────────────────────

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsOptions {
  userId?: string | null;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications({ userId }: UsePushNotificationsOptions): UsePushNotificationsReturn {
  const supported = isSupported();

  const [permission, setPermission]     = useState<PushPermission>(supported ? (Notification.permission as PushPermission) : 'unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  // ── Check existing subscription on mount ──────────────────────────────────
  useEffect(() => {
    if (!supported || !userId) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    }).catch(() => {});

    setPermission(Notification.permission as PushPermission);
  }, [supported, userId]);

  // ── POST subscription to server ───────────────────────────────────────────
  const saveSubscriptionToServer = useCallback(async (subscription: PushSubscription) => {
    if (!userId) return;
    const res = await fetch(`${SERVER_BASE}/push/subscribe`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to save subscription: ${err}`);
    }
  }, [userId]);

  // ── DELETE subscription from server ──────────────────────────────────────
  const removeSubscriptionFromServer = useCallback(async () => {
    if (!userId) return;
    await fetch(`${SERVER_BASE}/push/unsubscribe`, {
      method:  'DELETE',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ userId }),
    }).catch((e) => console.warn('[Push] Could not remove server subscription:', e));
  }, [userId]);

  // ── subscribe ─────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!supported || !userId) return;
    setIsLoading(true);

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);

      if (perm !== 'granted') {
        console.log('[Push] Permission denied by user');
        setIsLoading(false);
        return;
      }

      // 2. Get SW registration
      const reg = await navigator.serviceWorker.ready;

      // 3. Subscribe via PushManager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[Push] ✅ Subscribed:', subscription.endpoint.slice(0, 60) + '...');

      // 4. Persist subscription to server
      await saveSubscriptionToServer(subscription);
      setIsSubscribed(true);

    } catch (err: any) {
      console.error('[Push] Subscribe failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supported, userId, saveSubscriptionToServer]);

  // ── unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        console.log('[Push] 🗑️ Unsubscribed from push');
      }

      await removeSubscriptionFromServer();
      setIsSubscribed(false);
      setPermission('default');

    } catch (err: any) {
      console.error('[Push] Unsubscribe failed:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supported, removeSubscriptionFromServer]);

  // ── sendTestNotification ──────────────────────────────────────────────────
  const sendTestNotification = useCallback(async () => {
    if (!userId) return;
    try {
      await fetch(`${SERVER_BASE}/push/send`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId,
          title: '🏆 Airtel Champions',
          body:  'Push notifications are working! You\'ll be notified about approvals, rankings & challenges.',
          url:   '/?tab=leaderboard',
          tag:   'test-push',
        }),
      });
      console.log('[Push] Test notification sent');
    } catch (err: any) {
      console.error('[Push] Test notification failed:', err.message);
    }
  }, [userId]);

  return {
    isSupported: supported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
