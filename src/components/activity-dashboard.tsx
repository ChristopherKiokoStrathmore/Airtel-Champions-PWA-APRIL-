// Activity Dashboard - Real-time PWA activity monitoring
import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Users, Clock, TrendingUp, Filter, RefreshCw, 
  Eye, Smartphone, Monitor, Tablet, ChevronDown, ChevronUp,
  Zap, MousePointer, Camera, Send, Heart, MessageCircle,
  LogIn, LogOut, Bell, MapPin, Search, Download, Trash2
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

// Action type display config
const ACTION_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  page_view: { icon: Eye, label: 'Page View', color: 'text-blue-500 bg-blue-50' },
  tab_switch: { icon: MousePointer, label: 'Tab Switch', color: 'text-indigo-500 bg-indigo-50' },
  login: { icon: LogIn, label: 'Login', color: 'text-green-600 bg-green-50' },
  logout: { icon: LogOut, label: 'Logout', color: 'text-red-500 bg-red-50' },
  session_start: { icon: LogIn, label: 'Session Start', color: 'text-green-500 bg-green-50' },
  session_end: { icon: LogOut, label: 'Session End', color: 'text-gray-500 bg-gray-50' },
  session_resume: { icon: RefreshCw, label: 'Session Resume', color: 'text-teal-500 bg-teal-50' },
  submission_create: { icon: Send, label: 'New Submission', color: 'text-purple-600 bg-purple-50' },
  submission_view: { icon: Eye, label: 'View Submission', color: 'text-purple-400 bg-purple-50' },
  program_view: { icon: Eye, label: 'View Program', color: 'text-blue-600 bg-blue-50' },
  program_open: { icon: Zap, label: 'Open Program', color: 'text-blue-500 bg-blue-50' },
  post_create: { icon: Send, label: 'New Post', color: 'text-pink-500 bg-pink-50' },
  post_like: { icon: Heart, label: 'Liked Post', color: 'text-red-400 bg-red-50' },
  post_comment: { icon: MessageCircle, label: 'Comment', color: 'text-orange-500 bg-orange-50' },
  photo_upload: { icon: Camera, label: 'Photo Upload', color: 'text-cyan-500 bg-cyan-50' },
  photo_capture: { icon: Camera, label: 'Photo Capture', color: 'text-cyan-600 bg-cyan-50' },
  leaderboard_view: { icon: TrendingUp, label: 'Leaderboard', color: 'text-yellow-600 bg-yellow-50' },
  profile_view: { icon: Users, label: 'Profile View', color: 'text-gray-600 bg-gray-50' },
  checkin: { icon: MapPin, label: 'Check In', color: 'text-green-600 bg-green-50' },
  checkout: { icon: MapPin, label: 'Check Out', color: 'text-red-500 bg-red-50' },
  announcement_view: { icon: Bell, label: 'Announcement', color: 'text-amber-500 bg-amber-50' },
  theme_change: { icon: Eye, label: 'Theme Change', color: 'text-violet-500 bg-violet-50' },
  pwa_install: { icon: Download, label: 'PWA Install', color: 'text-green-600 bg-green-50' },
  heartbeat: { icon: Activity, label: 'Heartbeat', color: 'text-gray-400 bg-gray-50' },
  error: { icon: Zap, label: 'Error', color: 'text-red-600 bg-red-50' },
  api_error: { icon: Zap, label: 'API Error', color: 'text-red-600 bg-red-50' },
};

function getActionConfig(actionType: string) {
  return ACTION_CONFIG[actionType] || { 
    icon: Activity, 
    label: actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    color: 'text-gray-500 bg-gray-50'
  };
}

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    sales_executive: 'SE',
    zonal_sales_manager: 'ZSM',
    zonal_business_manager: 'ZBM',
    hq_command_center: 'HQ',
    director: 'DIR',
    developer: 'DEV',
  };
  return roleMap[role] || role?.toUpperCase() || '?';
}

function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    sales_executive: 'bg-green-100 text-green-700',
    zonal_sales_manager: 'bg-blue-100 text-blue-700',
    zonal_business_manager: 'bg-purple-100 text-purple-700',
    hq_command_center: 'bg-orange-100 text-orange-700',
    director: 'bg-red-100 text-red-700',
    developer: 'bg-gray-100 text-gray-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-600';
}

export function ActivityDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [view, setView] = useState<'feed' | 'stats'>('feed');
  const [filter, setFilter] = useState({ actionType: '', userId: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [hideHeartbeats, setHideHeartbeats] = useState(true);
  const [statsDays, setStatsDays] = useState(7);

  const loadFeed = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (selectedDate) params.set('date', selectedDate);
      if (filter.actionType) params.set('actionType', filter.actionType);
      if (filter.userId) params.set('userId', filter.userId);

      const response = await fetch(`${SERVER_BASE}/activity/feed?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('[ActivityDashboard] Feed load error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filter.actionType, filter.userId]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`${SERVER_BASE}/activity/stats?days=${statsDays}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('[ActivityDashboard] Stats load error:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [statsDays]);

  useEffect(() => {
    loadFeed();
    loadStats();
  }, [loadFeed, loadStats]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadFeed();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadFeed]);

  const handleCleanup = async () => {
    if (!window.confirm('Delete activity logs older than 30 days?')) return;
    try {
      const response = await fetch(`${SERVER_BASE}/activity/cleanup?days=30`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await response.json();
      if (data.success) {
        alert(`Cleaned up ${data.deleted} old entries`);
        loadFeed();
        loadStats();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  // Filter activities
  let filteredActivities = activities;
  if (hideHeartbeats) {
    filteredActivities = filteredActivities.filter(a => a.actionType !== 'heartbeat');
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    filteredActivities = filteredActivities.filter(a =>
      a.userName?.toLowerCase().includes(q) ||
      a.actionType?.toLowerCase().includes(q) ||
      JSON.stringify(a.actionDetails)?.toLowerCase().includes(q)
    );
  }

  // Unique action types for filter dropdown
  const uniqueActionTypes = [...new Set(activities.map(a => a.actionType))].sort();

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            Activity Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time PWA user activity monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView(view === 'feed' ? 'stats' : 'feed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'stats' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {view === 'feed' ? 'Show Stats' : 'Show Feed'}
          </button>
          <button
            onClick={() => { setAutoRefresh(!autoRefresh); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => { loadFeed(); loadStats(); }}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 font-medium">Total Actions</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalActions.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{stats.periodDays}d period</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500 font-medium">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.uniqueUsers}</p>
            <p className="text-xs text-gray-400">Unique users</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500 font-medium">Avg/Day</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.avgActionsPerDay}</p>
            <p className="text-xs text-gray-400">Actions per day</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 font-medium">Avg/User</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.avgActionsPerUser}</p>
            <p className="text-xs text-gray-400">Actions per user</p>
          </div>
        </div>
      )}

      {/* Stats View */}
      {view === 'stats' && stats && (
        <div className="space-y-4">
          {/* Period selector */}
          <div className="flex gap-2">
            {[3, 7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setStatsDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statsDays === d ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Daily Trend */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Daily Activity Trend
            </h3>
            <div className="flex items-end gap-1 h-32">
              {stats.dailyTrend?.map((day: any, i: number) => {
                const max = Math.max(...stats.dailyTrend.map((d: any) => d.count), 1);
                const height = (day.count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">{day.count}</span>
                    <div
                      className="w-full bg-purple-500 rounded-t-md min-h-[2px] transition-all"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.count} actions`}
                    />
                    <span className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                      {new Date(day.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Top Actions
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.actionBreakdown?.slice(0, 15).map((action: any, i: number) => {
                  const config = getActionConfig(action.type);
                  const Icon = config.icon;
                  const max = stats.actionBreakdown[0]?.count || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 truncate">{config.label}</span>
                          <span className="text-sm text-gray-500 ml-2">{action.count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-purple-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(action.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Most Active Users
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.topUsers?.slice(0, 10).map((user: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                        <span className="text-xs text-gray-400">{user.count} actions</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setFilter({ ...filter, userId: user.userId }); setView('feed'); }}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Heatmap */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Peak Hours
              </h3>
              <div className="grid grid-cols-12 gap-1">
                {stats.hourlyHeatmap?.map((h: any) => {
                  const max = Math.max(...stats.hourlyHeatmap.map((x: any) => x.count), 1);
                  const intensity = h.count / max;
                  return (
                    <div key={h.hour} className="text-center">
                      <div
                        className="w-full aspect-square rounded-md transition-colors"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(147, 51, 234, ${Math.max(intensity, 0.1)})`
                            : '#f3f4f6',
                        }}
                        title={`${h.hour}:00 - ${h.count} actions`}
                      />
                      <span className="text-[8px] text-gray-400">{h.hour}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Hour of day (0-23)</p>
            </div>

            {/* Role Breakdown */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Activity by Role
              </h3>
              <div className="space-y-3">
                {stats.roleBreakdown?.map((role: any, i: number) => {
                  const total = stats.totalActions || 1;
                  const pct = Math.round((role.count / total) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(role.role)}`}>
                          {formatRole(role.role)}
                        </span>
                        <span className="text-sm text-gray-600">{role.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed View */}
      {view === 'feed' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {(filter.actionType || filter.userId || filter.search || selectedDate) && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
              {showFilters ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showFilters && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={filter.search}
                      onChange={e => setFilter({ ...filter, search: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>

                  {/* Action Type */}
                  <select
                    value={filter.actionType}
                    onChange={e => setFilter({ ...filter, actionType: e.target.value })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">All Actions</option>
                    {uniqueActionTypes.map(type => (
                      <option key={type} value={type}>
                        {getActionConfig(type).label}
                      </option>
                    ))}
                  </select>

                  {/* Date */}
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />

                  {/* Clear */}
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={hideHeartbeats}
                        onChange={e => setHideHeartbeats(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600"
                      />
                      Hide heartbeats
                    </label>
                    <button
                      onClick={() => { setFilter({ actionType: '', userId: '', search: '' }); setSelectedDate(''); }}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Count + Cleanup */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {filteredActivities.length} activities
              {filter.userId && <span className="text-purple-600 ml-1">(filtered by user)</span>}
            </p>
            <button
              onClick={handleCleanup}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Cleanup old logs
            </button>
          </div>

          {/* Activity Feed */}
          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading activity feed...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No activity recorded yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Actions will appear here as users interact with the PWA
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity: any) => {
                const config = getActionConfig(activity.actionType);
                const Icon = config.icon;
                const isExpanded = expandedEntry === activity.id;
                const deviceType = activity.deviceInfo?.deviceType;
                const DeviceIcon = deviceType === 'mobile' ? Smartphone : deviceType === 'tablet' ? Tablet : Monitor;

                return (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : activity.id)}
                      className="w-full flex items-center gap-3 p-3 sm:p-4 text-left"
                    >
                      {/* Icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-800 truncate max-w-[140px]">
                            {activity.userName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(activity.userRole)}`}>
                            {formatRole(activity.userRole)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {config.label}
                          {activity.actionDetails?.tab && (
                            <span className="text-gray-400"> on {activity.actionDetails.tab}</span>
                          )}
                        </p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DeviceIcon className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(activity.timestamp)}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-300" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-300" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                          <div>
                            <span className="text-gray-400 block mb-0.5">Timestamp</span>
                            <span className="text-gray-700">{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Session</span>
                            <span className="text-gray-700 font-mono text-[10px]">{activity.sessionId?.substring(0, 8) || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Device</span>
                            <span className="text-gray-700">
                              {activity.deviceInfo?.deviceType || 'unknown'}
                              {activity.deviceInfo?.standalone ? ' (PWA)' : ' (Browser)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Screen</span>
                            <span className="text-gray-700">
                              {activity.deviceInfo?.screenWidth}x{activity.deviceInfo?.screenHeight}
                            </span>
                          </div>
                        </div>
                        {activity.actionDetails && Object.keys(activity.actionDetails).length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs text-gray-400 block mb-1">Details</span>
                            <pre className="text-[11px] bg-gray-50 p-3 rounded-lg overflow-x-auto text-gray-600 max-h-32">
                              {JSON.stringify(activity.actionDetails, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
