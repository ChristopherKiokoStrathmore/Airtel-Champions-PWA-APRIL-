/**
 * useBadge — PWA App Badging API
 * Sets the badge count on the installed app icon (home screen / taskbar).
 * Works on Android Chrome 81+, desktop Chrome/Edge 81+, iOS 16.4+.
 * Silently no-ops on unsupported browsers.
 *
 * Usage:
 *   const { setBadge, clearBadge } = useBadge();
 *   setBadge(unreadCount);   // Shows number on icon
 *   clearBadge();            // Removes the badge
 */

import { useCallback } from 'react';

const isSupported = (): boolean =>
  'setAppBadge' in navigator && 'clearAppBadge' in navigator;

export function useBadge() {
  const setBadge = useCallback((count: number) => {
    if (!isSupported()) return;
    if (count <= 0) {
      (navigator as any).clearAppBadge().catch(() => {});
    } else {
      (navigator as any).setAppBadge(count).catch(() => {});
    }
  }, []);

  const clearBadge = useCallback(() => {
    if (!isSupported()) return;
    (navigator as any).clearAppBadge().catch(() => {});
  }, []);

  return { setBadge, clearBadge, isSupported: isSupported() };
}
