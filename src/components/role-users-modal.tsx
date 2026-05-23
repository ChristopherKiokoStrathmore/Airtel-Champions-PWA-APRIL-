import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface RoleUsersModalProps {
  role: string;
  roleLabel: string;
  roleColor: string;
  roleIcon: string;
  onClose: () => void;
  onEditUser?: (user: any) => void;
}

export function RoleUsersModal({ 
  role, 
  roleLabel, 
  roleColor, 
  roleIcon, 
  onClose,
  onEditUser 
}: RoleUsersModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [role]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', role)
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone_number?.includes(searchQuery) ||
    u.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBgColor = () => {
    const colorMap: any = {
      'sales_executive': 'from-green-500 to-green-600',
      'zonal_sales_manager': 'from-blue-500 to-blue-600',
      'zonal_business_manager': 'from-purple-500 to-purple-600',
      'hq_command_center': 'from-yellow-500 to-yellow-600',
      'director': 'from-orange-500 to-red-600',
      'developer': 'from-indigo-500 to-indigo-600'
    };
    return colorMap[role] || 'from-gray-400 to-gray-500';
  };

  const getCardBgColor = () => {
    const colorMap: any = {
      'sales_executive': 'from-green-50 to-emerald-50 border-green-200',
      'zonal_sales_manager': 'from-blue-50 to-cyan-50 border-blue-200',
      'zonal_business_manager': 'from-purple-50 to-indigo-50 border-purple-200',
      'hq_command_center': 'from-yellow-50 to-amber-50 border-yellow-200',
      'director': 'from-orange-50 to-red-50 border-orange-200',
      'developer': 'from-indigo-50 to-violet-50 border-indigo-200'
    };
    return colorMap[role] || 'from-gray-50 to-slate-50 border-gray-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getRoleBgColor()} px-6 py-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{roleIcon}</div>
            <div>
              <h2 className="text-2xl text-white font-semibold">{roleLabel}</h2>
              <p className="text-sm text-white opacity-90">{users.length} {users.length === 1 ? 'user' : 'users'} in this role</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        {users.length > 5 && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="relative">
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
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600">No users found</p>
              {searchQuery && <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user: any, index: number) => (
                <div 
                  key={user.id} 
                  className={`bg-gradient-to-r ${getCardBgColor()} border rounded-xl p-4 hover:shadow-md transition-all`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge (for SE/ZSM/ZBM with points) */}
                    {(role === 'sales_executive' || role === 'zonal_sales_manager' || role === 'zonal_business_manager') && (
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>
                    )}

                    {/* User Avatar */}
                    <div className={`w-14 h-14 bg-gradient-to-br ${getRoleBgColor()} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                      {user.full_name?.substring(0, 1)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{user.full_name}</h3>
                        {index < 3 && (role === 'sales_executive' || role === 'zonal_sales_manager' || role === 'zonal_business_manager') && (
                          <span className="text-lg">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1">
                        {user.job_title && (role === 'director' || role === 'hq_command_center') && (
                          <div className="font-medium">{user.job_title}</div>
                        )}
                        {user.employee_id && (
                          <div>ID: {user.employee_id}</div>
                        )}
                        {user.zone && (
                          <div>Zone: {user.zone}</div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>📞 {user.phone_number}</span>
                        {user.email && <span>✉️ {user.email}</span>}
                      </div>
                    </div>

                    {/* Points (for roles with points) */}
                    {(role === 'sales_executive' || role === 'zonal_sales_manager' || role === 'zonal_business_manager') && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-800">{user.total_points || 0}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    )}

                    {/* Actions */}
                    {onEditUser && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('[RoleUsersModal] Edit button clicked for user:', user.full_name, user);
                            onEditUser(user);
                          }}
                          className="px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {searchQuery ? `Showing ${filteredUsers.length} of ${users.length} users` : `${users.length} total users`}
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}