/**
 * useWakeLock — Screen Wake Lock API
 * Prevents the screen from dimming or sleeping — useful during presentations,
 * customer demos, or when viewing the leaderboard in a meeting.
 *
 * Usage:
 *   const { isActive, request, release } = useWakeLock();
 *   <button onClick={isActive ? release : request}>
 *     {isActive ? 'Screen stays on' : 'Keep screen on'}
 *   </button>
 *
 * The lock is automatically released when the component unmounts or the
 * page is hidden (browser handles this), and re-acquired on visibility change.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof navigator !== 'undefined' && 'wakeLock' in navigator
  );
  const wakeLockRef = useRef<any>(null);

  // Re-acquire after the page becomes visible again (e.g. after tab switch)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('[WakeLock] ✅ Re-acquired after visibility change');
        } catch {
          setIsActive(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // Release on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);
      console.log('[WakeLock] ✅ Screen will stay on');
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        console.log('[WakeLock] 🔓 Released');
      });
    } catch (err: any) {
      // Permission denied by policy — mark as unsupported so the button hides
      if (err?.name === 'NotAllowedError') {
        setIsSupported(false);
      }
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setIsActive(false);
      console.log('[WakeLock] 🔓 Released by user');
    }
  }, []);

  return { isActive, isSupported, request, release };
}