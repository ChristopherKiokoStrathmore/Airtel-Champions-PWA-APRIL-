// am-hq-dashboard.tsx — Airtel Money HQ admin dashboard (full-width, laptop-optimized).
//
// Tabs:
//  • Overview  — summary stats
//  • Videos    — upload, manage, view analytics per video
//  • Agents    — all agents + watch progress
//  • Complaints — all tickets, respond, update status

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3, Video, Users, AlertCircle, LogOut, RefreshCw,
  Upload, Trash2, Eye, ChevronDown, ChevronUp, Send, CheckCircle2,
  Clock, Star, X, PlayCircle, TrendingUp, MessageSquare, Filter,
} from 'lucide-react';
import {
  AMVideo, AMComplaint, AMVideoAnalytics,
  getAllVideos, createVideo, updateVideo, deleteVideo, uploadVideoFile, setVideoTargets,
  getAllComplaints, respondToComplaint,
  getAllAgentsWithProgress, getVideoAnalytics,
} from './am-api';

const ACCENT = '#E60000';

type Tab = 'overview' | 'videos' | 'agents' | 'complaints';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

export function AMHQDashboard({ user, userData, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  // id is bigint from DB (comes back as number in JS)
  const adminId   = Number(userData?.id || user?.id);
  const adminName = userData?.full_name || user?.full_name || 'Admin';

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'overview',    label: 'Overview',    Icon: BarChart3    },
    { id: 'videos',      label: 'Videos',      Icon: Video        },
    { id: 'agents',      label: 'Agents',      Icon: Users        },
    { id: 'complaints',  label: 'Complaints',  Icon: AlertCircle  },
  ];

  return (
    <>
      <style>{`
        /* Lock portrait orientation on mobile */
        @media (max-width: 768px) {
          body, html {
            orientation: portrait !important;
          }
        }
      `}</style>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* ── Top bar (fixed) ────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                 style={{ background: 'linear-gradient(135deg, #E60000, #FF4444)' }}>
              AM
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Airtel Money HQ</p>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium hidden sm:inline">{adminName}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Tab nav (fixed, scrollable) ────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-1 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
                style={{
                  color:       active ? ACCENT : '#6b7280',
                  borderColor: active ? ACCENT : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Content (scrollable) ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview'   && <OverviewTab adminId={adminId} />}
          {activeTab === 'videos'     && <VideosTab   adminId={adminId} />}
          {activeTab === 'agents'     && <AgentsTab   />}
          {activeTab === 'complaints' && <ComplaintsTab adminId={adminId} />}
        </div>
      </div>
    </>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({ adminId }: { adminId: number }) {
  const [stats, setStats] = useState({
    totalAgents: 0, activeAgents: 0,
    totalVideos: 0, totalComplaints: 0,
    openComplaints: 0, resolvedComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllAgentsWithProgress(),
      getAllVideos(),
      getAllComplaints(),
    ]).then(([agents, videos, complaints]) => {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      setStats({
        totalAgents:       agents.length,
        activeAgents:      agents.filter(a => a.last_active && now - new Date(a.last_active).getTime() < sevenDays).length,
        totalVideos:       videos.filter(v => v.status === 'published').length,
        totalComplaints:   complaints.length,
        openComplaints:    complaints.filter(c => c.status === 'open').length,
        resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Agents',    value: stats.totalAgents,        sub: `${stats.activeAgents} active this week`, color: '#6366F1' },
    { label: 'Training Videos', value: stats.totalVideos,        sub: 'Published',                               color: '#0EA5E9' },
    { label: 'Open Tickets',    value: stats.openComplaints,     sub: 'Awaiting response',                       color: ACCENT   },
    { label: 'Resolved',        value: stats.resolvedComplaints, sub: `of ${stats.totalComplaints} total`,       color: '#10B981' },
  ];

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
            <p className="text-3xl font-black" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Videos tab ───────────────────────────────────────────────────────────────

const VIDEO_CATEGORIES = ['General', 'Cash In/Out', 'Compliance', 'Customer Service', 'Products', 'Security'];

function VideosTab({ adminId }: { adminId: number }) {
  const [videos,       setVideos]       = useState<AMVideo[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showUpload,   setShowUpload]   = useState(false);
  const [analytics,    setAnalytics]    = useState<AMVideoAnalytics | null>(null);
  const [analyticsVid, setAnalyticsVid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setVideos(await getAllVideos()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (v: AMVideo) => {
    if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
    await deleteVideo(v.id, v.video_url);
    load();
  };

  const handleToggleStatus = async (v: AMVideo) => {
    await updateVideo(v.id, { status: v.status === 'published' ? 'draft' : 'published' });
    load();
  };

  const handleViewAnalytics = async (videoId: string) => {
    setAnalyticsVid(videoId);
    setAnalytics(null);
    const data = await getVideoAnalytics(videoId);
    setAnalytics(data);
  };

  const fmt = (s?: number) => {
    if (!s) return '—';
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (showUpload) {
    return <VideoUploadForm adminId={adminId} onBack={() => setShowUpload(false)} onUploaded={() => { setShowUpload(false); load(); }} />;
  }

  if (analyticsVid) {
    const vid = videos.find(v => v.id === analyticsVid);
    return (
      <VideoAnalyticsPanel
        videoTitle={vid?.title || ''}
        analytics={analytics}
        onClose={() => { setAnalyticsVid(null); setAnalytics(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Training Videos</h2>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: ACCENT }}
          >
            <Upload className="w-4 h-4" /> Upload Video
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Title', 'Category', 'Duration', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {videos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No videos yet. Upload your first training video.</td></tr>
              ) : videos.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{v.title}</p>
                    {v.description && <p className="text-xs text-gray-400 truncate max-w-xs">{v.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{v.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">{fmt(v.duration_seconds)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(v)}
                            className="px-2 py-0.5 rounded-full text-xs font-semibold transition-colors"
                            style={v.status === 'published'
                              ? { background: '#F0FDF4', color: '#16A34A' }
                              : { background: '#F9FAFB', color: '#9CA3AF' }}>
                      {v.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewAnalytics(v.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50 transition-colors">
                        <TrendingUp className="w-3 h-3" /> Analytics
                      </button>
                      <button onClick={() => handleDelete(v)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Video upload form ────────────────────────────────────────────────────────

function VideoUploadForm({ adminId, onBack, onUploaded }: { adminId: number; onBack: () => void; onUploaded: () => void }) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('General');
  const [status,      setStatus]      = useState<'published' | 'draft'>('published');
  const [videoFile,   setVideoFile]   = useState<File | null>(null);
  const [thumbFile,   setThumbFile]   = useState<File | null>(null);
  const [thumbPreview,setThumbPreview]= useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [error,       setError]       = useState('');
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!videoFile)    { setError('Please select a video file.'); return; }
    setError('');
    setUploading(true);
    setProgress(10);

    try {
      // Upload video with real-time progress tracking
      const video_url = await uploadVideoFile(videoFile, setProgress);

      // Upload thumbnail if provided
      let thumbnail_url: string | undefined;
      if (thumbFile) {
        const { data } = await import('../../utils/supabase/client').then(m => ({ data: m.supabase }));
        const ext  = thumbFile.name.split('.').pop() || 'jpg';
        const path = `thumbs/${Date.now()}.${ext}`;
        await data.storage.from('am-videos').upload(path, thumbFile, { upsert: false, contentType: thumbFile.type });
        thumbnail_url = data.storage.from('am-videos').getPublicUrl(path).data.publicUrl;
      }

      // Get video duration from the file
      let duration_seconds: number | undefined;
      try {
        duration_seconds = await getVideoDuration(videoFile);
      } catch { /* optional */ }

      await createVideo({ title: title.trim(), description, category, status, video_url, thumbnail_url, duration_seconds, created_by: adminId });
      setProgress(100);
      setTimeout(() => onUploaded(), 500); // Brief delay to show 100%
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setTimeout(() => setUploading(false), 500);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">Upload Training Video</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
                 className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50"
                 placeholder="e.g. Cash In Process Training" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 resize-none bg-gray-50"
                    placeholder="Brief description of the video content…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50">
              {VIDEO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Video file */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Video File *</label>
          {videoFile ? (
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <PlayCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{videoFile.name}</span>
              <button type="button" onClick={() => { setVideoFile(null); if (videoRef.current) videoRef.current.value = ''; }}
                      className="text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => videoRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 transition-colors">
              <Upload className="w-6 h-6" />
              <span className="text-xs">Click to select video (MP4, MOV, AVI)</span>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
                 onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} />
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Thumbnail (optional)</label>
          {thumbPreview ? (
            <div className="relative">
              <img src={thumbPreview} alt="Thumbnail" className="w-full h-32 object-cover rounded-xl" />
              <button type="button" onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => thumbRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 text-xs transition-colors">
              <Upload className="w-4 h-4" /> Upload thumbnail image
            </button>
          )}
          <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
        </div>

        {uploading && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: ACCENT }} />
            </div>
          </div>
        )}

        <button type="submit" disabled={uploading}
                className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: ACCENT }}>
          {uploading ? 'Uploading…' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
}

// ─── Video analytics panel ────────────────────────────────────────────────────

function VideoAnalyticsPanel({ videoTitle, analytics, onClose }: { videoTitle: string; analytics: AMVideoAnalytics | null; onClose: () => void }) {
  const fmtSecs = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold text-gray-900 truncate">{videoTitle} — Analytics</h2>
      </div>

      {!analytics ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Views',       value: analytics.total_views    },
              { label: 'Unique Agents',     value: analytics.unique_agents  },
              { label: '% Completed',       value: `${analytics.avg_completion_pct}%` },
              { label: 'Total Watch Time',  value: fmtSecs(analytics.total_watch_secs) },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-2xl font-black text-gray-900">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Drop-off points */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Top Drop-off Points</h3>
            {analytics.drop_off_points.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.drop_off_points.map(d => (
                  <div key={d.position_secs} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 shrink-0 tabular-nums">{fmtSecs(d.position_secs)}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                           style={{ width: `${Math.min(100, (d.drop_count / analytics.total_views) * 100)}%`, background: ACCENT }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right tabular-nums">{d.drop_count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-agent progress */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Agent Progress</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Agent', 'Furthest Point', 'Completed', 'Sessions', 'Last Watched'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.agent_progress.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No agent views yet</td></tr>
                ) : analytics.agent_progress.map(a => (
                  <tr key={a.agent_id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.agent_name}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-600">{fmtSecs(a.max_position_secs)}</td>
                    <td className="px-4 py-3">
                      {a.completed
                        ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="text-gray-400 text-xs">No</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600">{a.session_count}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(a.last_watched).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agents tab ───────────────────────────────────────────────────────────────

function AgentsTab() {
  const [agents,  setAgents]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { 
      console.log('[AgentsTab] Loading agents with progress...');
      const agentsData = await getAllAgentsWithProgress();
      console.log('[AgentsTab] Loaded agents:', agentsData);
      setAgents(agentsData); 
    }
    catch (err: any) {
      const msg = err?.message || String(err);
      console.error('[AgentsTab] Error loading agents:', msg);
      setError(msg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = agents.filter(a =>
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_code?.toLowerCase().includes(search.toLowerCase()) ||
    a.zone?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtSecs = (s: number) => {
    if (!s) return '0m';
    const m = Math.floor(s / 60);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  // DEBUG: Log what we're rendering
  if (filtered.length > 0) {
    console.log('[AgentsTab] First agent data:', filtered[0]);
    console.log('[AgentsTab] Videos watched:', filtered[0].videos_watched, 'Videos completed:', filtered[0].videos_completed, 'Total secs:', filtered[0].total_watch_secs);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Agents ({agents.length})</h2>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
                 className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-gray-50 w-52"
                 placeholder="Search name, code, zone…" />
          <button onClick={load} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-red-700 text-sm">
          <p className="font-semibold">Error loading agents:</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Agent Code', 'Super Agent No.', 'Zone', 'SE / ZSM', 'Videos Watched', 'Completed', 'Watch Time', 'Last Active', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">No agents found</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{a.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{a.agent_code}</td>
                  <td className="px-4 py-3 text-gray-600">{a.super_agent_number}</td>
                  <td className="px-4 py-3 text-gray-600">{a.zone}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{a.se}<br /><span className="text-gray-400">{a.zsm}</span></td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{a.videos_watched}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{a.videos_completed}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{fmtSecs(a.total_watch_secs)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {a.last_active
                      ? new Date(a.last_active).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Complaints tab ───────────────────────────────────────────────────────────

function ComplaintsTab({ adminId }: { adminId: number }) {
  const [complaints,  setComplaints]  = useState<AMComplaint[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState<Record<string, string>>({});
  const [newStatus,   setNewStatus]   = useState<Record<string, string>>({});
  const [sending,     setSending]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setComplaints(await getAllComplaints(statusFilter)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (complaintId: string) => {
    const msg = (replyText[complaintId] || '').trim();
    if (!msg) return;
    setSending(complaintId);
    try {
      await respondToComplaint({
        complaint_id: complaintId,
        responder_id: adminId,
        message:      msg,
        new_status:   (newStatus[complaintId] as any) || undefined,
      });
      setReplyText(p  => ({ ...p, [complaintId]: '' }));
      setNewStatus(p  => ({ ...p, [complaintId]: '' }));
      await load();
    } finally {
      setSending(null);
    }
  };

  const fmt = (iso?: string | null) => iso
    ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

  const STATUS_OPTS = [
    { value: 'all',        label: 'All' },
    { value: 'open',       label: 'Open' },
    { value: 'in_progress',label: 'In Progress' },
    { value: 'resolved',   label: 'Resolved' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Complaints</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
            {STATUS_OPTS.map(o => (
              <button key={o.value} onClick={() => setStatusFilter(o.value)}
                      className="px-3 py-1.5 text-xs font-medium transition-colors"
                      style={statusFilter === o.value ? { background: ACCENT, color: '#fff' } : { color: '#6b7280' }}>
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No complaints found
            </div>
          ) : complaints.map(c => {
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Summary row */}
                <button className="w-full text-left px-5 py-4" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ComplaintStatusBadge status={c.status} />
                        <span className="text-xs text-gray-500">{c.category}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs font-medium text-gray-700">{(c.agent as any)?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">({(c.agent as any)?.agent_code})</span>
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{c.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{fmt(c.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(c.responses?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-blue-500">
                          <MessageSquare className="w-3 h-3" /> {c.responses!.length}
                        </span>
                      )}
                      {c.rating && (
                        <span className="flex items-center gap-1 text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-yellow-400" /> {c.rating.rating}/5
                        </span>
                      )}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50/50">
                    {/* Photo */}
                    {c.photo_url && (
                      <img src={c.photo_url} alt="Attachment" className="rounded-xl max-h-48 object-cover" />
                    )}

                    {/* Timeline */}
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span><span className="font-medium">Submitted:</span> {fmt(c.created_at)}</span>
                      <span><span className="font-medium">Picked up:</span> {fmt(c.picked_up_at)}</span>
                      <span><span className="font-medium">Resolved:</span>  {fmt(c.resolved_at)}</span>
                    </div>

                    {/* Existing responses */}
                    {(c.responses?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        {c.responses!.map(r => (
                          <div key={r.id} className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold text-blue-700 mb-0.5">HQ Response</p>
                            <p className="text-sm text-gray-800">{r.message}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{fmt(r.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agent rating */}
                    {c.rating && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">Agent Rating</p>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4" fill={s <= c.rating!.rating ? '#F59E0B' : 'none'} style={{ color: s <= c.rating!.rating ? '#F59E0B' : '#D1D5DB' }} />)}
                          <span className="text-xs text-gray-500 ml-1">{c.rating.rating}/5</span>
                        </div>
                        {c.rating.comment && <p className="text-xs text-gray-600 italic mt-1">"{c.rating.comment}"</p>}
                      </div>
                    )}

                    {/* Reply box */}
                    {c.status !== 'resolved' && (
                      <div className="space-y-2">
                        <textarea
                          value={replyText[c.id] || ''}
                          onChange={e => setReplyText(p => ({ ...p, [c.id]: e.target.value }))}
                          rows={2}
                          placeholder="Type a response to the agent…"
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 resize-none bg-white"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={newStatus[c.id] || ''}
                            onChange={e => setNewStatus(p => ({ ...p, [c.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                          >
                            <option value="">Keep current status</option>
                            <option value="in_progress">Mark as In Progress</option>
                            <option value="resolved">Mark as Resolved</option>
                          </select>
                          <button
                            onClick={() => handleSend(c.id)}
                            disabled={sending === c.id || !(replyText[c.id] || '').trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                            style={{ background: ACCENT }}
                          >
                            {sending === c.id
                              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <><Send className="w-3.5 h-3.5" /> Send</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ComplaintStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    open:        { label: 'Open',        bg: '#FEF3C7', color: '#D97706' },
    in_progress: { label: 'In Progress', bg: '#EFF6FF', color: '#2563EB' },
    resolved:    { label: 'Resolved',    bg: '#F0FDF4', color: '#16A34A' },
  };
  const s = map[status] || map.open;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };
    video.onerror = reject;
    video.src = URL.createObjectURL(file);
  });
}
