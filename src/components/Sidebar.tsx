// Import Airtel Champions logo
import airtelChampionsLogo from '../assets/LOGO.png';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
  adminUser: {
    name: string;
    role: string;
  } | null;
  onLogout: () => void;
}

export function Sidebar({ currentScreen, onNavigate, adminUser, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'submissions', label: 'Review Submissions', icon: '✅' },
    { id: 'leaderboard', label: 'Leaderboards', icon: '🏆' },
    { id: 'achievements', label: 'Achievements', icon: '🎖️' },
    { id: 'challenges', label: 'Daily Challenges', icon: '🎯' },
    { id: 'battlemap', label: 'Battle Map', icon: '🗺️' },
    { id: 'profiles', label: 'SE Profiles', icon: '👤' },
    { id: 'points', label: 'Point Configuration', icon: '⚙️' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src={airtelChampionsLogo} 
              alt="Airtel Champions" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            data-testid={item.id === 'submissions' ? 'manage-users-btn' : `admin-${item.id}-btn`}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              currentScreen === item.id
                ? 'bg-[#FFE6E6] text-[#E60000] font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{adminUser?.name}</p>
            <p className="text-xs text-gray-500 truncate">{adminUser?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}