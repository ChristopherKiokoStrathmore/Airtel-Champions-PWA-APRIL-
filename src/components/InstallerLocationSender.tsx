import { useEffect, useRef } from 'react';
import { upsertInstallerLiveLocation } from '../lib/supabase';

interface InstallerLocationSenderProps {
  installerId: number;
}

export function InstallerLocationSender({ installerId }: InstallerLocationSenderProps) {
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!installerId || !('geolocation' in navigator)) return;

    function handlePosition(position: GeolocationPosition) {
      const { latitude, longitude } = position.coords;
      upsertInstallerLiveLocation(installerId, latitude, longitude);
    }

    function handleError(error: GeolocationPositionError) {
      // Optionally handle error (e.g., show notification)
      // console.error('Geolocation error:', error);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [installerId]);

  return null; // No UI
}
