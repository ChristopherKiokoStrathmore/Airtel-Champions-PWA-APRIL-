// am-video-player.tsx — HTML5 video player with granular progress tracking.
//
// Tracking behaviour:
//  • On play: start/resume a session in am_video_sessions.
//  • Every 5 s: append a {t, p} position sample + update max_position_secs.
//  • On pause / unload: end the session with final stats.
//  • On load: fetch last session to resume from max_position_secs.
//  • Completion threshold: 90% of video duration.

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  startWatchSession,
  endWatchSession,
  appendPositionSample,
  getLatestSession,
} from './am-api';
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, RotateCw } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface Props {
  video: {
    id: string;
    title: string;
    video_url: string;
    duration_seconds?: number;
  };
  agentId: number;
  onClose: () => void;
}

const ACCENT = '#E60000';
const SAMPLE_INTERVAL_MS = 5000;
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AMVideoPlayer({ video, agentId, onClose }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const sessionIdRef  = useRef<string | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchSecsRef  = useRef(0);      // seconds actively watched this session
  const maxPosRef     = useRef(0);      // furthest point reached ever (across all sessions)
  const resumePosRef  = useRef(0);      // where to resume from
  const lastTickRef   = useRef<number | null>(null); // for computing watch time
  const lastTrustedProgressAtRef = useRef<number | null>(null);
  const isPlayingRef  = useRef(false);
  const retriedWithSignedUrlRef = useRef(false);

  const [isLoading,  setIsLoading]  = useState(true);
  const [isMuted,    setIsMuted]    = useState(false);
  const [isPaused,   setIsPaused]   = useState(true);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec,   setTotalSec]   = useState(video.duration_seconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error,      setError]      = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState(video.video_url);

  const extractStoragePath = useCallback((rawUrlOrPath: string): string | null => {
    const input = (rawUrlOrPath || '').trim();
    if (!input) return null;

    // Already a relative storage path in DB (e.g. videos/foo.mp4)
    if (!/^https?:\/\//i.test(input)) {
      return input.replace(/^\/+/, '');
    }

    try {
      const u = new URL(input);
      const path = decodeURIComponent(u.pathname);
      const markers = [
        '/storage/v1/object/public/am-videos/',
        '/storage/v1/object/sign/am-videos/',
        '/storage/v1/object/authenticated/am-videos/',
      ];

      for (const marker of markers) {
        const idx = path.indexOf(marker);
        if (idx >= 0) {
          return path.substring(idx + marker.length);
        }
      }
    } catch {
      return null;
    }

    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initPlaybackUrl = async () => {
      const raw = (video.video_url || '').trim();
      retriedWithSignedUrlRef.current = false;
      setError('');
      setIsLoading(true);

      if (!raw) {
        setError('Video URL is missing.');
        setIsLoading(false);
        return;
      }

      // If DB stores only storage path, prefer signed URL (works for private buckets),
      // then fall back to public URL.
      if (!/^https?:\/\//i.test(raw)) {
        const storagePath = raw.replace(/^\/+/, '');
        try {
          const { data, error: signErr } = await supabase
            .storage
            .from('am-videos')
            .createSignedUrl(storagePath, 60 * 60);

          if (!signErr && data?.signedUrl) {
            if (!cancelled) {
              setPlaybackUrl(data.signedUrl);
              console.log('[AMVideoPlayer] Resolved relative storage path to signed URL:', storagePath);
            }
            return;
          }

          console.warn('[AMVideoPlayer] Could not create signed URL for relative path, falling back to public URL:', signErr);
        } catch (e) {
          console.warn('[AMVideoPlayer] Signed URL resolution threw, falling back to public URL:', e);
        }

        const publicUrl = supabase.storage.from('am-videos').getPublicUrl(storagePath).data.publicUrl;
        if (!cancelled) {
          setPlaybackUrl(publicUrl);
          console.log('[AMVideoPlayer] Resolved relative storage path to public URL:', publicUrl);
        }
        return;
      }

      if (!cancelled) {
        setPlaybackUrl(raw);
      }
    };

    initPlaybackUrl();
    return () => { cancelled = true; };
  }, [video.video_url]);

  // ── Fetch last session to get resume position ────────────────────────────
  useEffect(() => {
    getLatestSession(agentId, video.id).then(session => {
      if (session && session.max_position_secs > 0) {
        resumePosRef.current = session.max_position_secs;
        maxPosRef.current    = session.max_position_secs;
      }
    });

    const blockedForwardKeys = new Set(['ArrowRight', 'End', 'PageDown']);
    const onKeyDown = (e: KeyboardEvent) => {
      if (blockedForwardKeys.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      stopSampling();
      closeSession();
      window.removeEventListener('keydown', onKeyDown, true);
      // Clean up orientation lock on unmount
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session management ───────────────────────────────────────────────────

  const openSession = useCallback(async () => {
    if (sessionIdRef.current) return; // already open
    try {
      const id = await startWatchSession(agentId, video.id);
      sessionIdRef.current = id;
    } catch (e) {
      console.warn('[AMVideoPlayer] Could not start session:', e);
    }
  }, [agentId, video.id]);

  const closeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    const duration = video.duration_seconds || videoRef.current?.duration || 1;
    const completed = maxPosRef.current / duration >= 0.9;
    try {
      await endWatchSession(sessionIdRef.current, maxPosRef.current, watchSecsRef.current, completed);
    } catch { /* non-critical */ }
    sessionIdRef.current = null;
  }, [video.duration_seconds]);

  // ── Sampling ─────────────────────────────────────────────────────────────

  const startSampling = useCallback(() => {
    if (intervalRef.current) return;
    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(async () => {
      const vid = videoRef.current;
      if (!vid || vid.paused) return;

      const positionSecs = Math.floor(vid.currentTime);

      // Accumulate watch time
      const now = Date.now();
      const elapsed = (now - (lastTickRef.current ?? now)) / 1000;
      watchSecsRef.current += Math.min(elapsed, SAMPLE_INTERVAL_MS / 1000 + 1);
      lastTickRef.current = now;

      if (sessionIdRef.current) {
        appendPositionSample(
          sessionIdRef.current,
          { t: Date.now(), p: positionSecs },
          maxPosRef.current,
          Math.floor(watchSecsRef.current),
        ).catch(() => {});
      }
    }, SAMPLE_INTERVAL_MS);
  }, []);

  const stopSampling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Video event handlers ─────────────────────────────────────────────────

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setTotalSec(Math.floor(vid.duration));
    setIsLoading(false);

    // Seek to resume position
    if (resumePosRef.current > 0 && resumePosRef.current < vid.duration - 5) {
      vid.currentTime = resumePosRef.current;
    }
  };

  const handlePlay = async () => {
    await openSession();
    startSampling();
    isPlayingRef.current = true;
    setIsPaused(false);
    lastTickRef.current = Date.now();
    lastTrustedProgressAtRef.current = Date.now();
  };

  const handlePause = () => {
    stopSampling();
    isPlayingRef.current = false;
    setIsPaused(true);
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;

    const now = Date.now();
    const pos = Math.floor(vid.currentTime);
    const maxAllowed = Math.floor(getMaxAllowedSeek());
    setCurrentSec(Math.min(pos, maxAllowed));

    // Never count progress while user is actively scrubbing/seeking.
    // This prevents forward drags from being treated as genuine watch progress.
    if (vid.seeking) return;

    // Block non-natural jumps (keyboard/programmatic seek) from being treated as watched.
    // Allowed growth is bounded by elapsed wall-clock time * playback rate (+ tolerance).
    const lastTrustedAt = lastTrustedProgressAtRef.current ?? now;
    const elapsedSecs = Math.max(0, (now - lastTrustedAt) / 1000);
    const rate = Math.max(0.5, Math.min(2, vid.playbackRate || 1));
    const naturalAdvanceLimit = maxPosRef.current + Math.ceil(elapsedSecs * rate) + 1;

    if (pos > naturalAdvanceLimit) {
      vid.currentTime = maxPosRef.current;
      setCurrentSec(Math.floor(maxPosRef.current));
      return;
    }

    if (pos > maxPosRef.current) maxPosRef.current = pos;
    lastTrustedProgressAtRef.current = now;
  };

  const handleEnded = async () => {
    stopSampling();
    isPlayingRef.current = false;
    setIsPaused(true);
    const duration = videoRef.current?.duration || video.duration_seconds || 1;
    maxPosRef.current = Math.floor(duration);
    await closeSession();
  };

  const handleError = async () => {
    const source = (playbackUrl || video.video_url || '').trim();
    const storagePath = extractStoragePath(source);
    const mediaErr = videoRef.current?.error;
    console.error('[AMVideoPlayer] Video element error:', {
      source,
      storagePath,
      mediaErrorCode: mediaErr?.code,
      mediaErrorMessage: mediaErr?.message,
    });

    // One retry path: if bucket/private/CORS blocks direct URL, use signed URL.
    if (!retriedWithSignedUrlRef.current && storagePath) {
      retriedWithSignedUrlRef.current = true;
      try {
        const { data, error: signErr } = await supabase
          .storage
          .from('am-videos')
          .createSignedUrl(storagePath, 60 * 60);

        if (!signErr && data?.signedUrl) {
          console.warn('[AMVideoPlayer] Retrying playback with signed URL fallback');
          setPlaybackUrl(data.signedUrl);
          setIsLoading(true);
          setError('');
          return;
        }

        console.error('[AMVideoPlayer] Signed URL fallback failed:', signErr);
      } catch (e) {
        console.error('[AMVideoPlayer] Signed URL fallback exception:', e);
      }
    }

    setError('Could not load video. Please try again later.');
    setIsLoading(false);
  };

  // ── Handle close ─────────────────────────────────────────────────────────

  const handleClose = async () => {
    stopSampling();
    videoRef.current?.pause();
    await closeSession();
    // Clean up orientation lock on close
    if (window.screen?.orientation?.unlock) {
      window.screen.orientation.unlock();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  // ── Controls ─────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play();
    else vid.pause();
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const toggleFullscreen = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else vid.requestFullscreen?.();
  };

  const skipBackward = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, vid.currentTime - 10);
  };

  const getMaxAllowedSeek = () => maxPosRef.current;

  const toggleLandscape = () => {
    const vid = videoRef.current;
    if (!vid) return;
    
    setIsLandscape(!isLandscape);
    
    // Request landscape orientation on mobile devices
    if (window.screen?.orientation?.lock) {
      if (!isLandscape) {
        window.screen.orientation.lock('landscape').catch(() => {
          // Fallback if orientation lock fails
          console.warn('Could not lock to landscape orientation');
        });
      } else {
        window.screen.orientation.unlock();
      }
    }
    
    // Also enter fullscreen for better landscape experience
    if (!isLandscape && !document.fullscreenElement) {
      vid.requestFullscreen?.().catch(() => {
        console.warn('Fullscreen request denied');
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (!vid) return;
    const requested = Number(e.target.value);
    vid.currentTime = Math.min(requested, getMaxAllowedSeek());
  };

  const handleSeeking = () => {
    const vid = videoRef.current;
    if (!vid) return;

    const maxAllowed = getMaxAllowedSeek();
    if (vid.currentTime > maxAllowed + 0.25) {
      vid.currentTime = maxAllowed;
      setCurrentSec(Math.floor(maxAllowed));
    }
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vid = videoRef.current;
    const nextRate = Number(e.target.value);
    setPlaybackRate(nextRate);
    if (vid) vid.playbackRate = nextRate;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPct = totalSec > 0 ? (currentSec / totalSec) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80">
        <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <p className="text-white text-sm font-semibold flex-1 truncate">{video.title}</p>
        {resumePosRef.current > 0 && currentSec < 5 && (
          <span className="text-xs text-yellow-400 font-medium">Resumed</span>
        )}
      </div>

      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error ? (
          <p className="text-white/60 text-sm px-8 text-center">{error}</p>
        ) : (
          <video
            ref={videoRef}
            src={playbackUrl}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            onEnded={handleEnded}
            onError={handleError}
            onClick={togglePlay}
          />
        )}

        {/* Play/Pause overlay tap */}
        {!isLoading && !error && isPaused && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div className="bg-black/90 px-4 pt-3 pb-5 space-y-2">
          <p className="text-[11px] text-white/50">Forward seeking is disabled for training compliance. You can pause, rewind, or change speed.</p>
          {/* Seek bar */}
          <div className="relative h-1.5 rounded-full bg-white/20">
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: ACCENT }}
            />
            <input
              type="range"
              min={0}
              max={totalSec || 100}
              value={currentSec}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Time + buttons */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs tabular-nums">
              {fmt(currentSec)} / {fmt(totalSec)}
            </span>

            <div className="flex items-center gap-4">
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="bg-white/10 text-white text-xs rounded-md px-2 py-1 border border-white/20 focus:outline-none"
                title="Playback speed"
              >
                {PLAYBACK_SPEEDS.map(speed => (
                  <option key={speed} value={speed} className="text-black">
                    {speed}x
                  </option>
                ))}
              </select>
              <button onClick={skipBackward} className="text-white/70 hover:text-white transition-colors" title="Skip 10 seconds back">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={togglePlay} className="text-white">
                {isPaused
                  ? <Play  className="w-5 h-5 fill-white" />
                  : <Pause className="w-5 h-5 fill-white" />}
              </button>
              <button onClick={toggleMute} className="text-white/70 hover:text-white">
                {isMuted
                  ? <VolumeX className="w-4 h-4" />
                  : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={toggleLandscape} className="text-white/70 hover:text-white" title="Toggle landscape">
                <RotateCw className="w-4 h-4" />
              </button>
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
