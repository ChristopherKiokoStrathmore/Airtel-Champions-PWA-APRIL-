import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Clock, Users, Calendar, TrendingUp, Filter, Download, RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';

interface SessionRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  employee_id: string;
  login_time: string;
  logout_time: string | null;
  session_duration_minutes: number | null;
  is_active: boolean;
  device_type?: string; // New field
  created_at: string;
  updated_at: string;
}

interface UserWithSession extends SessionRecord {
  region?: string;
  zone?: string;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export function SessionAnalytics() {
  const [sessions, setSessions] = useState<UserWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0, // Now based on < 30 mins
    avgSessionMinutes: 0,
    uniqueUsers: 0,
  });

  useEffect(() => {
    loadSessions();
    // Refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [timeFilter, roleFilter]);

  const getDateRangeFromFilter = (filter: TimeFilter) => {
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return startDate.toISOString();
  };

  const isSessionLive = (session: SessionRecord) => {
    if (session.logout_time) return false; // Explicitly logged out
    const now = new Date().getTime();
    const login = new Date(session.login_time).getTime();
    const diffMinutes = (now - login) / (1000 * 60);
    return diffMinutes < 30; // Live if started < 30 mins ago
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      // console.log('[SessionAnalytics] Loading sessions...');

      const startDate = getDateRangeFromFilter(timeFilter);

      // Build query
      // Try to join with app_users directly if possible, otherwise fallback to manual merge
      let query = supabase
        .from('user_sessions')
        .select('*')
        .gte('login_time', startDate)
        .order('login_time', { ascending: false });

      // Apply role filter
      if (roleFilter !== 'all') {
        query = query.eq('user_role', roleFilter);
      }

      const { data: sessionsData, error } = await query;

      if (error) {
        console.error('[SessionAnalytics] Error loading sessions:', error);
        return;
      }

      // console.log('[SessionAnalytics] ✅ Loaded sessions:', sessionsData?.length || 0);

      // Get unique user IDs to fetch additional user details
      const userIds = [...new Set(sessionsData?.map(s => s.user_id) || [])];
      
      if (userIds.length > 0) {
        // Fetch user details manually (reliable fallback if FK missing)
        const { data: usersData, error: usersError } = await supabase
          .from('app_users')
          .select('id, region, zone')
          .in('id', userIds);

        if (!usersError && usersData) {
          // Create user map
          const userMap = new Map(usersData.map(u => [u.id, u]));
          
          // Merge user data with sessions
          const enrichedSessions = sessionsData?.map(session => ({
            ...session,
            region: userMap.get(session.user_id)?.region,
            zone: userMap.get(session.user_id)?.zone,
          })) || [];

          setSessions(enrichedSessions);
          calculateStats(enrichedSessions);
        } else {
          setSessions(sessionsData || []);
          calculateStats(sessionsData || []);
        }
      } else {
        setSessions(sessionsData || []);
        calculateStats(sessionsData || []);
      }
    } catch (err) {
      console.error('[SessionAnalytics] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionsData: SessionRecord[]) => {
    const totalSessions = sessionsData.length;
    
    // Live sessions: started < 30 mins ago AND not logged out
    const activeSessions = sessionsData.filter(s => isSessionLive(s)).length;
    
    const uniqueUsers = new Set(sessionsData.map(s => s.user_id)).size;
    
    // Calculate average session duration (only for completed sessions)
    const completedSessions = sessionsData.filter(s => s.session_duration_minutes !== null);
    const avgSessionMinutes = completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + (s.session_duration_minutes || 0), 0) / completedSessions.length
        )
      : 0;

    setStats({
      totalSessions,
      activeSessions,
      avgSessionMinutes,
      uniqueUsers,
    });
  };

  const formatDuration = (minutes: number | null, loginTime: string) => {
    if (minutes === null) {
      // Calculate elapsed time for live sessions
      const now = new Date().getTime();
      const login = new Date(loginTime).getTime();
      const diffMinutes = Math.floor((now - login) / (1000 * 60));
      return `${diffMinutes}m (Current)`;
    }
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getDeviceIcon = (deviceType?: string) => {
    const type = deviceType?.toLowerCase() || 'desktop';
    if (type.includes('mobile')) return <Smartphone className="w-4 h-4 text-gray-500" />;
    if (type.includes('tablet')) return <Tablet className="w-4 h-4 text-gray-500" />;
    return <Monitor className="w-4 h-4 text-gray-500" />;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Employee ID', 'Role', 'Region', 'Zone', 'Device', 'Login Time', 'Logout Time', 'Duration (min)', 'Status'];
    const rows = filteredSessions.map(s => [
      s.user_name,
      s.employee_id,
      s.user_role,
      s.region || 'N/A',
      s.zone || 'N/A',
      s.device_type || 'Desktop',
      new Date(s.login_time).toLocaleString(),
      s.logout_time ? new Date(s.logout_time).toLocaleString() : 'Still Active',
      s.session_duration_minutes || 'N/A',
      isSessionLive(s) ? 'Live' : 'Ended',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_analytics_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.user_name.toLowerCase().includes(query) ||
      session.employee_id.toLowerCase().includes(query) ||
      session.user_role.toLowerCase().includes(query) ||
      session.region?.toLowerCase().includes(query) ||
      session.zone?.toLowerCase().includes(query)
    );
  });

  const roles = ['all', 'sales_executive', 'zonal_sales_manager', 'zonal_business_manager', 'hq_staff', 'director', 'developer'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Session Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Track user logins and app usage</p>
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.totalSessions}</div>
          <div className="text-sm opacity-90 mt-1">Total Sessions</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.activeSessions}</div>
          <div className="text-sm opacity-90 mt-1">Live Now (&lt;30m)</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.avgSessionMinutes}</div>
          <div className="text-sm opacity-90 mt-1">Avg Minutes</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
          <div className="text-sm opacity-90 mt-1">Unique Users</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <div className="flex gap-2">
              {(['today', 'week', 'month', 'all'] as TimeFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    timeFilter === filter
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'today' && 'Today'}
                  {filter === 'week' && 'This Week'}
                  {filter === 'month' && 'This Month'}
                  {filter === 'all' && 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Name, Employee ID, Region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={exportToCSV}
            disabled={filteredSessions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV ({filteredSessions.length} sessions)
          </button>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No sessions found for the selected filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Login Time</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSessions.map((session, index) => {
                  const isLive = isSessionLive(session);
                  return (
                    <tr key={session.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{session.user_name}</div>
                        {session.region && <div className="text-xs text-gray-500">{session.region}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.employee_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {session.user_role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(session.device_type)}
                          {session.device_type || 'Desktop'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(session.login_time).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${isLive ? 'text-green-600' : 'text-gray-600'}`}>
                          {formatDuration(session.session_duration_minutes, session.login_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
