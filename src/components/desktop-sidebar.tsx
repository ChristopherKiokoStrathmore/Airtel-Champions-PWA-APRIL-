import { Home, Users, BarChart3, Timer, Compass, LogOut, Settings, HelpCircle, User, Activity } from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userData: any;
  onLogout: () => void;
  unreadAnnouncementsCount?: number;
}

export function DesktopSidebar({ 
  activeTab, 
  onTabChange, 
  userData,
  onLogout,
  unreadAnnouncementsCount = 0 
}: DesktopSidebarProps) {
  
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, badge: null },
    { id: 'users', label: 'Users', icon: Users, badge: null },
    { id: 'sessions', label: 'Sessions', icon: Timer, badge: null },
    { id: 'activity', label: 'Activity', icon: Activity, badge: null },
    { id: 'programs', label: 'Programs', icon: BarChart3, badge: null },
    { id: 'explore', label: 'Explore', icon: Compass, badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : null },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white flex flex-col h-screen shadow-xl">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-purple-700">
        <h1 className="text-2xl font-bold">Airtel Champions</h1>
        <p className="text-xs text-purple-200 mt-1">Sales Intelligence Network</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-purple-700 bg-purple-800 bg-opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
            {userData?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{userData?.full_name || 'User'}</p>
            <p className="text-xs text-purple-200 truncate">
              {userData?.role?.replace(/_/g, ' ').toUpperCase() || 'Role'}
            </p>
            <p className="text-xs text-purple-300 truncate">{userData?.employee_id || 'ID'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-6 py-3 transition-all relative
                ${isActive 
                  ? 'bg-purple-700 text-white border-l-4 border-white' 
                  : 'text-purple-200 hover:bg-purple-700 hover:text-white border-l-4 border-transparent'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-purple-700 p-4 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-purple-200 hover:bg-red-600 hover:text-white rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* Version Info */}
      <div className="px-6 py-3 text-xs text-purple-300 text-center border-t border-purple-700">
        v2.0.0 • Web Dashboard
      </div>
    </div>
  );
}