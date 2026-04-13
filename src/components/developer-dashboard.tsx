import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { ExploreFeed } from './explore-feed-local';

export function DeveloperDashboard({ user, userData, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [analytics, setAnalytics] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    onLeaveUsers: 0,
    totalSubmissions: 0,
    clickEvents: []
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load all users
      const { data: users } = await supabase
        .from('app_users')
        .select('*')
        .order('total_points', { ascending: false });

      if (users) {
        setAllUsers(users);
        
        // Calculate analytics
        const onLeave = users.filter((u: any) => {
          const leaveStatus = localStorage.getItem(`leave_status_${u.id}`);
          return leaveStatus === 'true';
        }).length;

        setAnalytics({
          totalUsers: users.length,
          activeUsers: users.length - onLeave,
          onLeaveUsers: onLeave,
          byRole: {
            se: users.filter((u: any) => u.role === 'sales_executive').length,
            zsm: users.filter((u: any) => u.role === 'zonal_sales_manager').length,
            zbm: users.filter((u: any) => u.role === 'zonal_business_manager').length,
            hq: users.filter((u: any) => u.role === 'hq_command_center').length,
            director: users.filter((u: any) => u.role === 'director').length,
          }
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Analytics load error:', error);
      setLoading(false);
    }
  };

  const BottomNav = ({ activeTab, setActiveTab }: any) => {
    const navItems = [
      { id: 'home', icon: '📊', label: 'Analytics' },
      { id: 'users', icon: '👥', label: 'Users' },
      { id: 'events', icon: '🎯', label: 'Events' },
      { id: 'system', icon: '⚙️', label: 'System' }
    ];

    return (
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-around">
          {navItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-2 transition-colors ${
                activeTab === item.id ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Home/Analytics Tab
  if (activeTab === 'home') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-white">
                Developer Dashboard 💻
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-purple-800 bg-opacity-50 border border-purple-500 rounded-full shadow-sm">
                <span className="text-sm text-purple-100">Christopher • Full System Access</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-purple-400 transition-colors"
            >
              {userData?.full_name?.substring(0, 1) || 'C'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6 space-y-6">
          {/* Real-time Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{analytics.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">All roles</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Active Now</p>
              <p className="text-3xl font-bold text-green-600">{analytics.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Available</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">On Leave</p>
              <p className="text-3xl font-bold text-orange-600">{analytics.onLeaveUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Out of office</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Roles</p>
              <p className="text-3xl font-bold text-purple-600">5</p>
              <p className="text-xs text-gray-500 mt-1">SE/ZSM/ZBM/HQ/Dir</p>
            </div>
          </div>

          {/* Role Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">👥 User Distribution by Role</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                    SE
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sales Executives</p>
                    <p className="text-xs text-gray-600">Field team</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{analytics.byRole?.se || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    ZSM
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Zonal Sales Managers</p>
                    <p className="text-xs text-gray-600">Team leaders</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{analytics.byRole?.zsm || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                    ZBM
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Zonal Business Managers</p>
                    <p className="text-xs text-gray-600">Zone leaders</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{analytics.byRole?.zbm || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm">
                    HQ
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">HQ Command Center</p>
                    <p className="text-xs text-gray-600">Central operations</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{analytics.byRole?.hq || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm">
                    DIR
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Directors</p>
                    <p className="text-xs text-gray-600">Executive leadership</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{analytics.byRole?.director || 0}</span>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">⚡ System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Database</span>
                <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">✓ Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Authentication</span>
                <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">✓ Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Real-time Sync</span>
                <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">✓ Connected</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">🚀 Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl transition-colors">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-xs font-semibold">Export Data</p>
              </button>
              <button className="p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-colors">
                <p className="text-2xl mb-2">🔄</p>
                <p className="text-xs font-semibold">Sync All</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-colors">
                <p className="text-2xl mb-2">📢</p>
                <p className="text-xs font-semibold">Broadcast</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl transition-colors">
                <p className="text-2xl mb-2">🛠️</p>
                <p className="text-xs font-semibold">Settings</p>
              </button>
            </div>
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Users Tab
  if (activeTab === 'users') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl">👥 All Users</h2>
          <p className="text-sm text-gray-600 mt-1">{allUsers.length} total users</p>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="space-y-3">
            {allUsers.map((user: any) => (
              <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm ${
                    user.role === 'sales_executive' ? 'bg-green-600' :
                    user.role === 'zonal_sales_manager' ? 'bg-blue-600' :
                    user.role === 'zonal_business_manager' ? 'bg-purple-600' :
                    user.role === 'hq_command_center' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}>
                    {user.full_name?.substring(0, 1)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-600">
                      {user.role?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      {user.employee_id && ` • ID: ${user.employee_id}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {user.total_points || 0} points • Zone: {user.zone || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      localStorage.getItem(`leave_status_${user.id}`) === 'true'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {localStorage.getItem(`leave_status_${user.id}`) === 'true' ? '🏖️ Leave' : '✅ Active'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Events Tab
  if (activeTab === 'events') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl">🎯 Click Events & Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time user interactions</p>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-lg font-semibold mb-2">Click Analytics Coming Soon</p>
            <p className="text-sm text-gray-600">User interaction tracking will appear here</p>
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-700">
                💡 Track: Profile views, manager contacts, submissions, badge unlocks, and more
              </p>
            </div>
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // System Tab
  if (activeTab === 'system') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl">⚙️ System Settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6 space-y-6">
          {/* Developer Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">👨‍💻 Developer Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold">{userData?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold">Developer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Access Level:</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Full Access</span>
              </div>
              {userData?.employee_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Employee ID:</span>
                  <span className="font-semibold">{userData.employee_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Version Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">📦 Version Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">App Version:</span>
                <span className="font-semibold">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build:</span>
                <span className="font-semibold">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-semibold">Jan 1, 2026</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-200">
            <h3 className="font-semibold mb-4 text-red-600">⚠️ Danger Zone</h3>
            <button className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border-2 border-red-200 transition-colors">
              Clear All Local Data
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors shadow-lg"
          >
            🚪 Sign Out
          </button>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return null;
}