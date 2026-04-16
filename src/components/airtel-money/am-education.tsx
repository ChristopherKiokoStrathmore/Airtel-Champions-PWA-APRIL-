// am-education.tsx — Agent video library with progress indicators and category filter.

import React, { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle, Clock, BookOpen, RefreshCw } from 'lucide-react';
import { AMVideo, AMVideoSession, getVideosForAgent, getLatestSession } from './am-api';
import { AMVideoPlayer } from './am-video-player';
import { supabase } from '../../utils/supabase/client';

interface Props {
  agentId: number;
}

const ACCENT = '#E60000';

const CATEGORIES = ['All', 'General', 'Cash In/Out', 'Compliance', 'Customer Service', 'Products', 'Security'];

interface VideoWithProgress extends AMVideo {
  lastSession?: AMVideoSession | null;
  progressPct: number;
  completed: boolean;
}

export function AMEducation({ agentId }: Props) {
  const [videos,        setVideos]        = useState<VideoWithProgress[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [category,      setCategory]      = useState('All');
  const [playingVideo,  setPlayingVideo]  = useState<AMVideo | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getVideosForAgent(agentId);

      // Fetch last session per video for progress display
      const withProgress: VideoWithProgress[] = await Promise.all(
        list.map(async v => {
          const session = await getLatestSession(agentId, v.id);
          const duration = v.duration_seconds || 1;
          const progressPct = session
            ? Math.min(100, Math.round((session.max_position_secs / duration) * 100))
            : 0;
          return { ...v, lastSession: session, progressPct, completed: session?.completed || false };
        })
      );
      setVideos(withProgress);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const filtered = category === 'All'
    ? videos
    : videos.filter(v => v.category === category);

  const fmt = (s?: number) => {
    if (!s) return '';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (playingVideo) {
    return (
      <AMVideoPlayer
        video={playingVideo}
        agentId={agentId}
        onClose={() => { setPlayingVideo(null); loadVideos(); }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-900">Training Videos</h2>
          <button onClick={loadVideos} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {videos.filter(v => v.completed).length}/{videos.length} completed
        </p>
      </div>

      {/* Overall progress bar */}
      {videos.length > 0 && (
        <div className="px-4 mb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((videos.filter(v => v.completed).length / videos.length) * 100)}%`,
                background: ACCENT,
              }}
            />
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={
              category === cat
                ? { background: ACCENT, color: '#fff' }
                : { background: '#f3f4f6', color: '#6b7280' }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No videos yet</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon for training content</p>
          </div>
        ) : (
          filtered.map(v => (
            <button
              key={v.id}
              onClick={() => setPlayingVideo(v)}
              className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <Play className="w-10 h-10 text-white/30" />
                  </div>
                )}

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Completion badge */}
                {v.completed && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Duration */}
                {v.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/70 rounded-md px-1.5 py-0.5 text-white text-[11px] tabular-nums">
                    {fmt(v.duration_seconds)}
                  </div>
                )}

                {/* Progress bar at bottom of thumbnail */}
                {v.progressPct > 0 && !v.completed && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full"
                      style={{ width: `${v.progressPct}%`, background: ACCENT }}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{v.title}</p>
                    {v.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{v.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                    {v.category}
                  </span>
                </div>

                {/* Progress row */}
                <div className="flex items-center gap-2 mt-2">
                  {v.completed ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  ) : v.progressPct > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" /> {v.progressPct}% watched — tap to resume
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not started</span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
