import { useState, useEffect, useRef } from 'react';

interface ProfileDropdownProps {
  userData: any;
  onLogout: () => void;
  onEditProfile: () => void;
  onViewSettings: () => void;
  onViewHelp: () => void;
  onViewAbout: () => void;
}

export function ProfileDropdown({ 
  userData, 
  onLogout, 
  onEditProfile, 
  onViewSettings,
  onViewHelp,
  onViewAbout
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      icon: '👤',
      label: 'My Profile',
      description: 'View and edit your details',
      onClick: () => {
        onEditProfile();
        setIsOpen(false);
      },
      color: 'text-blue-600'
    },
    {
      icon: '⚙️',
      label: 'Settings',
      description: 'App preferences & configuration',
      onClick: () => {
        onViewSettings();
        setIsOpen(false);
      },
      color: 'text-gray-600'
    },
    {
      icon: '📊',
      label: 'System Stats',
      description: 'View detailed analytics',
      onClick: () => {
        alert('System Stats:\n\n- Uptime: 99.9%\n- Response Time: 245ms\n- Active Sessions: 42\n- Database Size: 1.2GB');
        setIsOpen(false);
      },
      color: 'text-purple-600'
    },
    {
      icon: '🔔',
      label: 'Notifications',
      description: 'Manage alerts & updates',
      onClick: () => {
        alert('Notifications:\n\n✓ New user registered\n✓ 5 submissions pending review\n✓ System backup completed');
        setIsOpen(false);
      },
      color: 'text-yellow-600'
    },
    {
      icon: '❓',
      label: 'Help & Support',
      description: 'Documentation & guides',
      onClick: () => {
        onViewHelp();
        setIsOpen(false);
      },
      color: 'text-green-600'
    },
    {
      icon: 'ℹ️',
      label: 'About TAI',
      description: 'Version & information',
      onClick: () => {
        onViewAbout();
        setIsOpen(false);
      },
      color: 'text-indigo-600'
    },
    {
      icon: '🚪',
      label: 'Sign Out',
      description: 'Logout from developer dashboard',
      onClick: () => {
        if (confirm('Are you sure you want to sign out?')) {
          onLogout();
        }
        setIsOpen(false);
      },
      color: 'text-red-600',
      isDanger: true
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-purple-400 transition-all relative"
      >
        {userData?.full_name?.substring(0, 1) || 'C'}
        
        {/* Green online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-purple-400 rounded-full flex items-center justify-center text-2xl shadow-md">
                {userData?.full_name?.substring(0, 1) || 'C'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{userData?.full_name || 'Developer'}</p>
                <p className="text-sm text-purple-100">💻 Full System Access</p>
                {userData?.email && (
                  <p className="text-xs text-purple-200 mt-1">{userData.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2 max-h-[70vh] overflow-y-auto">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.isDanger && <div className="border-t border-gray-200 my-2"></div>}
                <button
                  onClick={item.onClick}
                  className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 group ${
                    item.isDanger ? 'hover:bg-red-50' : ''
                  }`}
                >
                  <span className={`text-2xl ${item.color}`}>{item.icon}</span>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${item.isDanger ? 'text-red-600' : 'text-gray-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              TAI v1.0.0 • Developer Edition
            </p>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
