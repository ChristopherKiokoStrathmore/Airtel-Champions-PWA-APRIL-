import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { UrgentAnnouncementCard } from './urgent-announcement-card';
import { getAnnouncements } from '../lib/supabase';
import { ResetPointsModal } from './reset-points-modal';
import { DeploymentAnalysisPanel } from './deployment-analysis-panel';
import { ProfileDropdown } from './developer-profile-dropdown';
import { LeaderboardWidget, LeaderboardEnhancedUnified } from './leaderboard-enhanced-unified';
import { UserProfileModal } from './user-profile-modal';
import { UserEditModal, UserCreateModal, UserDeleteConfirmModal } from './developer-user-management';
import { BulkUpdateModal } from './bulk-update-modal';
import { RoleChecker } from './role-checker';
import { RoleUsersModal } from './role-users-modal';
import { ProgramsWidgetHome } from './programs/programs-widget-home';
import { ProgramsDashboard } from './programs/programs-dashboard';
import { ExploreFeed } from './explore-feed';
import { AppUsageAnalytics } from './app-usage-analytics';
import { SessionAnalytics } from './session-analytics';
import { getLayoutMode } from '../lib/platform';
import { DesktopLayout } from './desktop-layout';
import { DeveloperToggle } from './developer-toggle';
import { UserUploadManager } from './user-upload-manager';
import { HQDirectorsManager } from './hq-directors-manager';
import { ActivityDashboard } from './activity-dashboard';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Layout mode detection
  const [layoutMode, setLayoutModeState] = useState<'mobile' | 'desktop'>(getLayoutMode());
  const isDesktopMode = layoutMode === 'desktop';
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showRoleChecker, setShowRoleChecker] = useState(false);
  const [showRoleUsersModal, setShowRoleUsersModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [showResetPointsModal, setShowResetPointsModal] = useState(false);
  const [showDeploymentAnalysis, setShowDeploymentAnalysis] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadAnnouncements();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
    try {
      if (!userData) return;
      
      const { data, error } = await getAnnouncements();
      if (error) {
        console.error('[Developer Dashboard] Error loading announcements:', error);
        return;
      }

      const filteredAnnouncements = data?.filter((ann: any) => 
        ann.target_roles?.includes(userData.role) || 
        ann.target_roles?.includes('all')
      ) || [];

      const announcementsWithReadStatus = filteredAnnouncements.map((announcement: any) => ({
        ...announcement,
        is_read: announcement.read_by?.includes(userData.id) || false
      }));

      setAnnouncements(announcementsWithReadStatus);
      setUnreadAnnouncementsCount(announcementsWithReadStatus.filter((a: any) => !a.is_read).length);
    } catch (error) {
      console.error('[Developer Dashboard] Error loading announcements:', error);
    }
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      if (!userData) return;

      const allAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
      
      const updatedAnnouncements = allAnnouncements.map((ann: any) => {
        if (ann.id === announcementId) {
          const readBy = ann.read_by || [];
          if (!readBy.includes(userData.id)) {
            readBy.push(userData.id);
          }
          return { ...ann, read_by: readBy };
        }
        return ann;
      });

      localStorage.setItem('tai_announcements', JSON.stringify(updatedAnnouncements));

      setAnnouncements(announcements.map((a: any) => 
        a.id === announcementId ? { ...a, is_read: true } : a
      ));
      setUnreadAnnouncementsCount((prev: number) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Developer Dashboard] Error marking announcement as read:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Load all users from app_users table
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
            hq: users.filter((u: any) => u.role === 'hq_staff').length,
            director: users.filter((u: any) => u.role === 'director').length,
            developer: users.filter((u: any) => u.role === 'developer').length,
          }
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Analytics load error:', error);
      setLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone_number?.includes(searchQuery) ||
    u.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BottomNav = ({ activeTab, setActiveTab }: any) => {
    const navItems = [
      { id: 'home', icon: '🏠' },
      { id: 'explore', icon: '🔍' },
      { id: 'sessions', icon: '⏱️' },
      { id: 'programs', icon: '📊' },
      { id: 'users', icon: '👥' }
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
              <span className="text-2xl">{item.icon}</span>
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
        {/* Developer Toggle - Only visible to Christopher (DEV001) */}
        <DeveloperToggle userData={userData} />
        
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-white">
                Developer Dashboard 💻
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-purple-800 bg-opacity-50 border border-purple-500 rounded-full shadow-sm">
                <span className="text-sm text-purple-100">{userData?.full_name} • Full System Access</span>
              </div>
            </div>
            
            {/* Profile Dropdown */}
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
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
              <p className="text-3xl font-bold text-purple-600">6</p>
              <p className="text-xs text-gray-500 mt-1">SE to Developer</p>
            </div>
          </div>

          {/* Top Performers Widget */}
          <LeaderboardWidget 
            currentUserId={userData?.id} 
            onViewAll={() => setActiveTab('users')} 
          />

          {/* Urgent Announcements Section - Only show urgent priority */}
          {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
            <div className="space-y-3">
              {announcements
                .filter(ann => ann.priority === 'urgent' && !ann.is_read)
                .map((ann) => (
                  <UrgentAnnouncementCard
                    key={ann.id}
                    id={ann.id}
                    title={ann.title}
                    message={ann.message}
                    created_by_name={ann.created_by_name || (ann as any).author_name || 'Unknown'}
                    created_by_role={ann.created_by_role || (ann as any).author_role || 'Staff'}
                    created_at={ann.created_at}
                    onDismiss={(id) => markAnnouncementAsRead(id)}
                  />
                ))}
            </div>
          )}

          {/* Role Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">👥 User Distribution by Role</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'sales_executive',
                    label: 'Sales Executives',
                    icon: 'SE',
                    color: 'from-green-500 to-green-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                    SE
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Sales Executives</p>
                    <p className="text-xs text-gray-600">Field team</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{analytics.byRole?.se || 0}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'zonal_sales_manager',
                    label: 'Zonal Sales Managers',
                    icon: 'ZSM',
                    color: 'from-blue-500 to-blue-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    ZSM
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Zonal Sales Managers</p>
                    <p className="text-xs text-gray-600">Team leaders</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{analytics.byRole?.zsm || 0}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'zonal_business_manager',
                    label: 'Zonal Business Managers',
                    icon: 'ZBM',
                    color: 'from-purple-500 to-purple-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                    ZBM
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Zonal Business Managers</p>
                    <p className="text-xs text-gray-600">Zone leaders</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{analytics.byRole?.zbm || 0}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'hq_staff',
                    label: 'HQ Command Center',
                    icon: 'HQ',
                    color: 'from-yellow-500 to-yellow-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-all cursor-pointer border-2 border-transparent hover:border-yellow-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm">
                    HQ
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">HQ Command Center</p>
                    <p className="text-xs text-gray-600">Central operations</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{analytics.byRole?.hq || 0}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'director',
                    label: 'Directors',
                    icon: 'DIR',
                    color: 'from-orange-500 to-red-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-all cursor-pointer border-2 border-transparent hover:border-red-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm">
                    DIR
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Directors</p>
                    <p className="text-xs text-gray-600">Executive leadership</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{analytics.byRole?.director || 0}</span>
              </button>

              <button 
                onClick={() => {
                  setSelectedRole({
                    role: 'developer',
                    label: 'Developers',
                    icon: '💻',
                    color: 'from-indigo-500 to-indigo-600'
                  });
                  setShowRoleUsersModal(true);
                }}
                className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer border-2 border-indigo-200 hover:border-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                    💻
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Developers</p>
                    <p className="text-xs text-gray-600">System admins</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-indigo-600">{analytics.byRole?.developer || 0}</span>
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">⚡ System Health</h3>
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

          {/* Programs Widget */}
          <ProgramsWidgetHome onViewAll={() => setActiveTab('programs')} />

          {/* App Usage Analytics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📈</span>
              App Usage Analytics
            </h3>
            <AppUsageAnalytics />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setActiveTab('users')}
                className="p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">👥</p>
                <p className="text-xs font-semibold">Manage Users</p>
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className="p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">📤</p>
                <p className="text-xs font-semibold">User Upload</p>
              </button>
              <button 
                onClick={() => setActiveTab('hq')}
                className="p-4 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">👔</p>
                <p className="text-xs font-semibold">HQ/Directors</p>
              </button>
              <button 
                onClick={() => setShowRoleChecker(true)}
                className="p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-xs font-semibold">Role Checker</p>
              </button>
              <button 
                onClick={() => setActiveTab('activity')}
                className="p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">📊</p>
                <p className="text-xs font-semibold">Activity</p>
              </button>
              <button 
                onClick={loadAnalytics}
                className="p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">🔄</p>
                <p className="text-xs font-semibold">Refresh</p>
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl transition-colors"
              >
                <p className="text-2xl mb-2">⚙️</p>
                <p className="text-xs font-semibold">Settings</p>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm border-2 border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-red-700">Danger Zone</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Critical system operations that cannot be undone. Use with extreme caution.
            </p>
            <button
              onClick={() => setShowResetPointsModal(true)}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg">🔄</span>
              <span>Reset All Points to Zero</span>
            </button>
            <p className="text-xs text-gray-600 mt-2 text-center">
              This will reset ALL users' points and submissions counts
            </p>
          </div>
        </div>

        {/* Modals */}
        {showProfileEdit && (
          <UserProfileModal
            userId={userData?.id}
            currentUser={userData}
            isOwnProfile={true}
            onClose={() => setShowProfileEdit(false)}
          />
        )}

        {showEditModal && selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              console.log('[Dashboard] Closing EditModal');
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={() => {
              console.log('[Dashboard] User saved, refreshing analytics');
              loadAnalytics();
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {showCreateModal && (
          <UserCreateModal
            onClose={() => setShowCreateModal(false)}
            onSave={() => {
              loadAnalytics();
              setShowCreateModal(false);
            }}
          />
        )}

        {showDeleteModal && selectedUser && (
          <UserDeleteConfirmModal
            user={selectedUser}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={() => {
              loadAnalytics();
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {showRoleChecker && (
          <RoleChecker 
            onClose={() => setShowRoleChecker(false)} 
            onEditUser={(user) => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
            onDeleteUser={(user) => {
              setSelectedUser(user);
              setShowDeleteModal(true);
            }}
            onCreateUser={handleCreateUser}
          />
        )}

        {showRoleUsersModal && selectedRole && (
          <RoleUsersModal
            role={selectedRole.role}
            roleLabel={selectedRole.label}
            roleColor={selectedRole.color}
            roleIcon={selectedRole.icon}
            onClose={() => {
              console.log('[Dashboard] Closing RoleUsersModal');
              setShowRoleUsersModal(false);
              setSelectedRole(null);
            }}
            onEditUser={(user) => {
              console.log('[Dashboard] onEditUser called with:', user);
              setSelectedUser(user);
              console.log('[Dashboard] Closing RoleUsersModal');
              setShowRoleUsersModal(false);
              setSelectedRole(null);
              console.log('[Dashboard] Opening EditModal');
              setShowEditModal(true);
            }}
          />
        )}

        {showResetPointsModal && (
          <ResetPointsModal
            onClose={() => setShowResetPointsModal(false)}
            onSuccess={() => {
              loadAnalytics();
              setShowResetPointsModal(false);
            }}
          />
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Users Tab
  if (activeTab === 'users') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl">👥 User Management</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredUsers.length} users {searchQuery && `(filtered from ${allUsers.length})`}</p>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, ID, or zone..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg"
            >
              <span className="text-lg">📋</span>
              <span>Bulk Update</span>
            </button>
            <button
              onClick={handleCreateUser}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold flex items-center gap-2 shadow-lg"
            >
              <span className="text-lg">➕</span>
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <div className="space-y-3">
            {filteredUsers.map((user: any) => (
              <div key={user.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-purple-300 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
                    user.role === 'sales_executive' ? 'bg-green-600' :
                    user.role === 'zonal_sales_manager' ? 'bg-blue-600' :
                    user.role === 'zonal_business_manager' ? 'bg-purple-600' :
                    user.role === 'hq_staff' ? 'bg-yellow-600' :
                    user.role === 'developer' ? 'bg-indigo-600' :
                    'bg-red-600'
                  }`}>
                    {user.full_name?.substring(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {user.role?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      {user.employee_id && ` • ID: ${user.employee_id}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      📞 {user.phone_number} • Zone: {user.zone || 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-gray-600">No users found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showEditModal && selectedUser && (
          <UserEditModal
            user={selectedUser}
            onClose={() => {
              console.log('[Dashboard] Closing EditModal');
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            onSave={() => {
              console.log('[Dashboard] User saved, refreshing analytics');
              loadAnalytics();
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {showCreateModal && (
          <UserCreateModal
            onClose={() => setShowCreateModal(false)}
            onSave={() => {
              loadAnalytics();
              setShowCreateModal(false);
            }}
          />
        )}

        {showDeleteModal && selectedUser && (
          <UserDeleteConfirmModal
            user={selectedUser}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
            onConfirm={() => {
              loadAnalytics();
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          />
        )}

        {showBulkUpdateModal && (
          <BulkUpdateModal
            users={allUsers}
            onClose={() => setShowBulkUpdateModal(false)}
            onSave={() => {
              loadAnalytics();
              setShowBulkUpdateModal(false);
            }}
          />
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('home')}
                className="text-white hover:text-purple-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl text-white">🏆 Full Rankings</h2>
                <p className="text-sm text-purple-100 mt-1">Complete SE leaderboard</p>
              </div>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <LeaderboardEnhancedUnified 
            currentUserId={userData?.id}
            currentUserData={userData}
            showBackButton={false}
            standalone={true}
          />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Programs Tab
  if (activeTab === 'programs') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ProgramsDashboard onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ExploreFeed currentUser={userData} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Sessions Analytics Tab
  if (activeTab === 'sessions') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-white">⏱️ Session Analytics</h2>
              <p className="text-sm text-purple-100 mt-1">User login tracking & app usage</p>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <SessionAnalytics />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // User Upload Tab
  if (activeTab === 'upload') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-white">📤 User Upload</h2>
              <p className="text-sm text-purple-100 mt-1">Excel upload with preview & rollback</p>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <UserUploadManager />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // HQ/Directors Management Tab
  if (activeTab === 'hq') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-white">👔 HQ & Directors</h2>
              <p className="text-sm text-purple-100 mt-1">Permanent staff management</p>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <HQDirectorsManager />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  // Activity Dashboard Tab
  if (activeTab === 'activity') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl text-white">📊 Activity Dashboard</h2>
              <p className="text-sm text-purple-100 mt-1">User activity tracking & insights</p>
            </div>
            <ProfileDropdown
              userData={userData}
              onLogout={onLogout}
              onEditProfile={() => setShowProfileEdit(true)}
              onViewSettings={() => setShowSettings(true)}
              onViewHelp={() => setShowHelp(true)}
              onViewAbout={() => setShowAbout(true)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20">
          <ActivityDashboard />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return null;
}