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
import { X, Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, RotateCw } from 'lucide-react';

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

export function AMVideoPlayer({ video, agentId, onClose }: Props) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const sessionIdRef  = useRef<string | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchSecsRef  = useRef(0);      // seconds actively watched this session
  const maxPosRef     = useRef(0);      // furthest point reached ever (across all sessions)
  const resumePosRef  = useRef(0);      // where to resume from
  const lastTickRef   = useRef<number | null>(null); // for computing watch time
  const isPlayingRef  = useRef(false);

  const [isLoading,  setIsLoading]  = useState(true);
  const [isMuted,    setIsMuted]    = useState(false);
  const [isPaused,   setIsPaused]   = useState(true);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec,   setTotalSec]   = useState(video.duration_seconds || 0);
  const [error,      setError]      = useState('');
  const [isLandscape, setIsLandscape] = useState(false);

  // ── Fetch last session to get resume position ────────────────────────────
  useEffect(() => {
    getLatestSession(agentId, video.id).then(session => {
      if (session && session.max_position_secs > 0) {
        resumePosRef.current = session.max_position_secs;
        maxPosRef.current    = session.max_position_secs;
      }
    });

    return () => {
      stopSampling();
      closeSession();
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

      // Update max position
      if (positionSecs > maxPosRef.current) maxPosRef.current = positionSecs;

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
  };

  const handlePause = () => {
    stopSampling();
    isPlayingRef.current = false;
    setIsPaused(true);
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const pos = Math.floor(vid.currentTime);
    setCurrentSec(pos);
    if (pos > maxPosRef.current) maxPosRef.current = pos;
  };

  const handleEnded = async () => {
    stopSampling();
    isPlayingRef.current = false;
    setIsPaused(true);
    const duration = videoRef.current?.duration || video.duration_seconds || 1;
    maxPosRef.current = Math.floor(duration);
    await closeSession();
  };

  const handleError = () => {
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

  const skipForward = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
  };

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
    vid.currentTime = Number(e.target.value);
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
            src={video.video_url}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
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

            <div className="flex items-center gap-5">
              <button onClick={skipBackward} className="text-white/70 hover:text-white transition-colors" title="Skip 10 seconds back">
                <SkipBack className="w-4 h-4" />
              </button>
              <button onClick={togglePlay} className="text-white">
                {isPaused
                  ? <Play  className="w-5 h-5 fill-white" />
                  : <Pause className="w-5 h-5 fill-white" />}
              </button>
              <button onClick={skipForward} className="text-white/70 hover:text-white transition-colors" title="Skip 10 seconds forward">
                <SkipForward className="w-4 h-4" />
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
