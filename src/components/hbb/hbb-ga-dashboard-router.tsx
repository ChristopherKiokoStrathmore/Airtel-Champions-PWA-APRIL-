// src/components/hbb/hbb-ga-dashboard-router.tsx
// Main router that determines which dashboard to display based on user role

import React, { useState, useEffect } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { HBBDSEGADashboard } from './hbb-dse-ga-dashboard';
import { HBBTeamLeadDashboard } from './hbb-team-lead-dashboard';
import { HBBManagerDashboard } from './hbb-manager-dashboard';
import { getUserRole, logoutUser } from './hbb-ga-api';
import { toast } from 'sonner';

type UserRole = 'dse' | 'team_lead' | 'manager' | 'admin' | null;

interface User {
  phone: string;
  role: UserRole;
  name: string;
}

export function HBBGADashboardRouter() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    setLoading(true);
    try {
      // Try to get from localStorage first (cached)
      const cachedUser = localStorage.getItem('hbb_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
        return;
      }

      // Get from phone in session or prompt for it
      const userPhone = localStorage.getItem('hbb_user_phone') || await promptForPhone();
      
      if (!userPhone) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }

      const role = await getUserRole(userPhone);

      if (!role) {
        setError('Unable to determine your role. Please contact your manager.');
        setLoading(false);
        return;
      }

      const userData: User = {
        phone: userPhone,
        role,
        name: `User ${userPhone.slice(-4)}`, // Placeholder - would be fetched from API
      };

      setUser(userData);
      localStorage.setItem('hbb_user', JSON.stringify(userData));
      localStorage.setItem('hbb_user_phone', userPhone);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load user information';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const promptForPhone = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const phone = prompt('Enter your phone number (MSISDN):');
      resolve(phone);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('hbb_user');
    localStorage.removeItem('hbb_user_phone');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleSwitchUser = async () => {
    localStorage.removeItem('hbb_user_phone');
    await loadUserInfo();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Loading HBB GA Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Cannot Load Dashboard
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {error || 'Unable to load your information. Please try again.'}
          </p>
          <button
            onClick={() => {
              setError(null);
              loadUserInfo();
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">HBB GA Dashboard</h1>
            <p className="text-sm text-gray-600">
              {user.role === 'dse' && 'DSE Performance'}
              {user.role === 'team_lead' && 'Team Management'}
              {user.role === 'manager' && 'Area Management'}
              {user.role === 'admin' && 'System Administration'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.phone}</p>
              <p className="text-xs text-gray-600 capitalize">
                {user.role === 'team_lead' ? 'Team Lead' : 
                 user.role === 'dse' ? 'DSE Agent' :
                 user.role === 'manager' ? 'Area Manager' :
                 'Admin'}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <button
                onClick={handleSwitchUser}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Switch User
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Show appropriate dashboard */}
      {user.role === 'dse' && <HBBDSEGADashboard userPhone={user.phone} />}
      {user.role === 'team_lead' && <HBBTeamLeadDashboard userPhone={user.phone} />}
      {(user.role === 'manager' || user.role === 'admin') && <HBBManagerDashboard userPhone={user.phone} />}
    </div>
  );
}
