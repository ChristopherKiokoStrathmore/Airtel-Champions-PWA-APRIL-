/**
 * PushNotificationBell
 * ─────────────────────
 * A compact bell-icon button that lets the user toggle Web Push notifications.
 *
 * States:
 *   • default / not subscribed  → outlined bell, "Enable Alerts" tooltip
 *   • subscribed (granted)      → solid red bell with animated dot
 *   • denied                    → crossed-out bell (read-only, guides user)
 *   • loading                   → spinner
 *   • unsupported browser       → renders nothing
 *
 * Usage:
 *   <PushNotificationBell userId={user.id} />
 */

import { usePushNotifications } from '../hooks/usePushNotifications';

interface PushNotificationBellProps {
  userId?: string | null;
  className?: string;
  /** Show a visible label next to the icon */
  showLabel?: boolean;
}

export function PushNotificationBell({ userId, className = '', showLabel = false }: PushNotificationBellProps) {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe, sendTestNotification } =
    usePushNotifications({ userId });

  // Don't render on unsupported browsers
  if (!isSupported) return null;

  const handleClick = async () => {
    if (isLoading) return;
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
      // Fire a test notification after ~1 s so user immediately sees it working
      if (permission !== 'denied') {
        setTimeout(() => sendTestNotification(), 1000);
      }
    }
  };

  // ── Denied state ──────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <button
        disabled
        title="Notifications blocked — open browser settings to re-enable"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed ${className}`}
      >
        {/* crossed bell */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.172 9.172a4 4 0 015.656 5.656M3 3l18 18M10.05 4.575A7 7 0 0119 11v1l1 4H4l1-4v-1c0-.638.085-1.257.244-1.844M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {showLabel && <span>Blocked</span>}
      </button>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 ${className}`}
      >
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        {showLabel && <span>Setting up…</span>}
      </button>
    );
  }

  // ── Subscribed (active) ───────────────────────────────────────────────────
  if (isSubscribed) {
    return (
      <button
        onClick={handleClick}
        title="Push alerts ON — tap to disable"
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-300 shadow-inner hover:bg-red-100 transition-all ${className}`}
      >
        {/* Active dot */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />

        {/* Solid bell */}
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {showLabel && <span>Alerts On</span>}
      </button>
    );
  }

  // ── Default / not subscribed ──────────────────────────────────────────────
  return (
    <button
      onClick={handleClick}
      title="Enable push notifications for approvals, rankings & challenges"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all ${className}`}
    >
      {/* Outline bell */}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {showLabel && <span>Enable Alerts</span>}
    </button>
  );
}
