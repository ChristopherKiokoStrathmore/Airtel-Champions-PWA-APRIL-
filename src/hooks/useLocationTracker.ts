import { useEffect, useRef } from 'react';
import { updateUserLocation } from '../lib/supabase';

interface LocationTrackerProps {
  userId: string;
  userDetails?: any;
  enabled?: boolean;
}

// Detect if running inside an iframe (Figma preview, embedded app, etc.)
// Geolocation is blocked by Permissions-Policy in iframes, so skip straight to mock.
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe — definitely in an iframe
    return true;
  }
}

export function useLocationTracker({ userId, userDetails, enabled = true }: LocationTrackerProps) {
  const lastUpdateRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const mockIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mockIntervalRef.current !== null) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    };

    cleanup();

    if (!enabled || !userId) {
      return;
    }

    const handlePositionUpdate = async (latitude: number, longitude: number) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < 2000) return;

      try {
        await updateUserLocation(userId, latitude, longitude, userDetails);
        lastUpdateRef.current = now;
      } catch {
        // Silently ignore location update errors — non-critical feature
      }
    };

    const startMockLocation = () => {
      if (mockIntervalRef.current) return; // Already running

      // Nairobi coordinates as base, randomized per user for spread on map
      let lat = -1.2921;
      let lng = 36.8219;
      const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      lat += Math.sin(seed + 1) * 0.02;
      lng += Math.sin(seed + 2) * 0.02;

      mockIntervalRef.current = window.setInterval(() => {
        lat += (Math.random() - 0.5) * 0.0005;
        lng += (Math.random() - 0.5) * 0.0005;
        handlePositionUpdate(lat, lng);
      }, 3000);
    };

    // Skip real geolocation entirely when inside an iframe (Figma preview, etc.)
    // It will always be blocked by Permissions-Policy and produces noisy console errors.
    if (isInIframe() || !navigator.geolocation) {
      startMockLocation();
      return cleanup;
    }

    // Real geolocation: quick permission probe, then watch if granted.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Permission granted — start watching
        handlePositionUpdate(position.coords.latitude, position.coords.longitude);
        try {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => handlePositionUpdate(pos.coords.latitude, pos.coords.longitude),
            () => startMockLocation(),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } catch {
          startMockLocation();
        }
      },
      () => {
        // Permission denied or unavailable — silently use mock
        startMockLocation();
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );

    return cleanup;
  }, [userId, enabled, JSON.stringify(userDetails)]);
}
