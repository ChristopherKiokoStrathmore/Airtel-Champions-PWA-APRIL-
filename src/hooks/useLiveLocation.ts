// useLiveLocation.ts — watch device GPS and stream position to location_tracking table.
import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

interface UseLiveLocationOptions {
  jobId: string | null;
  installerId: string | null;
  /** Only start watching when true */
  active: boolean;
}

/**
 * When active, watches the device GPS position and inserts rows into
 * `location_tracking` at most once every 10 seconds (throttled).
 * Automatically cleans up on unmount or when `active` turns false.
 */
export function useLiveLocation({ jobId, installerId, active }: UseLiveLocationOptions) {
  const watchIdRef   = useRef<number | null>(null);
  const lastInsertAt = useRef<number>(0);

  useEffect(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!active || !jobId || !installerId || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastInsertAt.current < 10_000) return; // throttle to 10 s
        lastInsertAt.current = now;

        try {
          await supabase.from('location_tracking').insert({
            installer_id: installerId,
            job_id:       jobId,
            lat:          position.coords.latitude,
            lng:          position.coords.longitude,
            recorded_at:  new Date().toISOString(),
          });
        } catch (err) {
          console.error('[useLiveLocation] insert error:', err);
        }
      },
      (error) => console.error('[useLiveLocation] geolocation error:', error.message),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, jobId, installerId]);
}
