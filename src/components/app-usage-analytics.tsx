import { useState, useEffect } from 'react';

interface UserSession {
  userId: string;
  userName: string;
  userRole: string;
  loginTime: number;
  lastActivity: number;
  sessionDuration: number; // in milliseconds
  isOnline: boolean;
}

export function AppUsageAnalytics() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    currentlyOnline: 0,
    avgSessionDuration: 0,
    totalSessionTime: 0
  });

  useEffect(() => {
    loadSessionData();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadSessionData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessionData = () => {
    try {
      // Get all session data from localStorage
      const allSessions: UserSession[] = [];
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      keys.forEach(key => {
        if (key.startsWith('user_session_')) {
          try {
            const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
            const lastActivity = sessionData.lastActivity || sessionData.loginTime || now;
            const sessionDuration = lastActivity - sessionData.loginTime;
            const isOnline = (now - lastActivity) < ONLINE_THRESHOLD;

            allSessions.push({
              userId: sessionData.userId,
              userName: sessionData.userName || 'Unknown User',
              userRole: sessionData.userRole || 'Unknown',
              loginTime: sessionData.loginTime || now,
              lastActivity: lastActivity,
              sessionDuration: sessionDuration,
              isOnline: isOnline
            });
          } catch (e) {
            // Skip invalid sessions
          }
        }
      });

      // Sort by last activity (most recent first)
      allSessions.sort((a, b) => b.lastActivity - a.lastActivity);

      // Calculate stats
      const onlineCount = allSessions.filter(s => s.isOnline).length;
      const totalSessionTime = allSessions.reduce((sum, s) => sum + s.sessionDuration, 0);
      const avgSessionDuration = allSessions.length > 0 ? totalSessionTime / allSessions.length : 0;

      setSessions(allSessions);
      setStats({
        totalSessions: allSessions.length,
        currentlyOnline: onlineCount,
        avgSessionDuration: avgSessionDuration,
        totalSessionTime: totalSessionTime
      });
    } catch (error) {
      console.error('[AppUsageAnalytics] Error loading session data:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'sales_executive': return 'bg-green-100 text-green-700 border-green-300';
      case 'zonal_sales_manager': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'zonal_business_manager': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'hq_staff': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'director': return 'bg-red-100 text-red-700 border-red-300';
      case 'developer': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatRoleName = (role: string) => {
    return role?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🟢</span>
            <p className="text-xs font-semibold text-green-700">Currently Online</p>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.currentlyOnline}</p>
          <p className="text-xs text-green-600 mt-1">Active users</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <p className="text-xs font-semibold text-blue-700">Total Sessions</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.totalSessions}</p>
          <p className="text-xs text-blue-600 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏱️</span>
            <p className="text-xs font-semibold text-purple-700">Avg Session</p>
          </div>
          <p className="text-2xl font-bold text-purple-700">{formatDuration(stats.avgSessionDuration)}</p>
          <p className="text-xs text-purple-600 mt-1">Per user</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🕐</span>
            <p className="text-xs font-semibold text-orange-700">Total Time</p>
          </div>
          <p className="text-2xl font-bold text-orange-700">{formatDuration(stats.totalSessionTime)}</p>
          <p className="text-xs text-orange-600 mt-1">All users</p>
        </div>
      </div>

      {/* User Sessions List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">👥</span>
            Recent Sessions ({sessions.length})
          </h3>
          <p className="text-xs text-gray-600 mt-1">Live activity tracking</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-600 font-semibold">No sessions tracked yet</p>
              <p className="text-sm text-gray-500 mt-1">Users will appear here when they log in</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((session, index) => (
                <div 
                  key={`${session.userId}-${session.loginTime}`}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    session.isOnline ? 'bg-green-50 bg-opacity-30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                      session.userRole === 'sales_executive' ? 'bg-green-600' :
                      session.userRole === 'zonal_sales_manager' ? 'bg-blue-600' :
                      session.userRole === 'zonal_business_manager' ? 'bg-purple-600' :
                      session.userRole === 'hq_staff' ? 'bg-yellow-600' :
                      session.userRole === 'developer' ? 'bg-indigo-600' :
                      'bg-red-600'
                    }`}>
                      {session.userName?.substring(0, 1) || '?'}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {session.userName}
                        </p>
                        {session.isOnline && (
                          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(session.userRole)}`}>
                          {formatRoleName(session.userRole)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          session.isOnline 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}>
                          {session.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          <p className="text-gray-500">Logged in:</p>
                          <p className="font-semibold text-gray-700">{formatTime(session.loginTime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last active:</p>
                          <p className="font-semibold text-gray-700">{formatTime(session.lastActivity)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Session duration:</p>
                          <p className="font-semibold text-indigo-600">{formatDuration(session.sessionDuration)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <span className="text-xl flex-shrink-0">ℹ️</span>
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">How Session Tracking Works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Users are marked <strong>online</strong> if active within last 5 minutes</li>
              <li>Session duration tracked from login to last activity</li>
              <li>Data refreshes every 5 seconds automatically</li>
              <li>Sessions persist across page reloads in localStorage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
