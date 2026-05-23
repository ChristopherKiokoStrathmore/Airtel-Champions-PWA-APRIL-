import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface RoleCheckerProps {
  onClose: () => void;
  onEditUser?: (user: any) => void;
  onDeleteUser?: (user: any) => void;
  onCreateUser?: () => void;
}

export function RoleChecker({ onClose, onEditUser, onDeleteUser, onCreateUser }: RoleCheckerProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedUsers, setGroupedUsers] = useState<any>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      if (data) {
        setUsers(data);
        
        // Group users by role
        const grouped = data.reduce((acc: any, user: any) => {
          const role = user.role || 'unknown';
          if (!acc[role]) {
            acc[role] = [];
          }
          acc[role].push(user);
          return acc;
        }, {});
        
        setGroupedUsers(grouped);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: any = {
      'director': 'Director (DIR)',
      'hq_staff': 'HQ Command Center (HQ)',
      'zonal_business_manager': 'Zonal Business Manager (ZBM)',
      'zonal_sales_manager': 'Zonal Sales Manager (ZSM)',
      'sales_executive': 'Sales Executive (SE)',
      'developer': 'Developer (DEV)'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: any = {
      'director': 'from-orange-500 to-red-600',
      'hq_staff': 'from-yellow-500 to-yellow-600',
      'zonal_business_manager': 'from-purple-500 to-purple-600',
      'zonal_sales_manager': 'from-blue-500 to-blue-600',
      'sales_executive': 'from-green-500 to-green-600',
      'developer': 'from-gray-400 to-gray-500'
    };
    return colors[role] || 'from-gray-400 to-gray-500';
  };

  const getRoleIcon = (role: string) => {
    const icons: any = {
      'director': '👑',
      'hq_staff': '🏢',
      'zonal_business_manager': '👔',
      'zonal_sales_manager': '⭐',
      'sales_executive': '👤',
      'developer': '💻'
    };
    return icons[role] || '👤';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white font-semibold">Database Role Check</h2>
            <p className="text-sm text-red-100">Total Users: {users.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 flex-1">
              {Object.keys(groupedUsers).map((role) => (
                <div key={role} className="text-center">
                  <div className="text-2xl mb-1">{getRoleIcon(role)}</div>
                  <div className="text-2xl font-bold text-gray-800">{groupedUsers[role].length}</div>
                  <div className="text-xs text-gray-600">{getRoleLabel(role).split('(')[0].trim()}</div>
                </div>
              ))}
            </div>
            {onCreateUser && (
              <button
                onClick={() => {
                  onCreateUser();
                  onClose();
                }}
                className="ml-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg transition-colors flex items-center gap-2"
              >
                <span className="text-xl">➕</span>
                <span>Add New User</span>
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Director */}
            {groupedUsers['director'] && groupedUsers['director'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👑</span>
                  <span>Director ({groupedUsers['director'].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedUsers['director'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor('director')} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{user.full_name}</div>
                          <div className="text-sm text-gray-600">{user.job_title || 'No job title set'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.phone_number} • {user.email || 'No email'}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">User ID</div>
                          <div className="text-sm font-mono text-gray-700">{user.id}</div>
                        </div>
                        {(onEditUser || onDeleteUser) && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {onEditUser && (
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HQ Command Center */}
            {groupedUsers['hq_staff'] && groupedUsers['hq_staff'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🏢</span>
                  <span>HQ Command Center ({groupedUsers['hq_staff'].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedUsers['hq_staff'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor('hq_staff')} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{user.full_name}</div>
                          <div className="text-sm text-gray-600">{user.job_title || 'No job title set'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.phone_number} • {user.email || 'No email'}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">User ID</div>
                          <div className="text-sm font-mono text-gray-700">{user.id}</div>
                        </div>
                        {(onEditUser || onDeleteUser) && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {onEditUser && (
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ZBM */}
            {groupedUsers['zonal_business_manager'] && groupedUsers['zonal_business_manager'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👔</span>
                  <span>Zonal Business Manager - ZBM ({groupedUsers['zonal_business_manager'].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedUsers['zonal_business_manager'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor('zonal_business_manager')} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{user.full_name}</div>
                          <div className="text-sm text-gray-600">Zone: {user.zone || 'Not assigned'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.phone_number} • {user.email || 'No email'}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">Points</div>
                          <div className="text-lg font-bold text-purple-600">{user.total_points || 0}</div>
                        </div>
                        {(onEditUser || onDeleteUser) && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {onEditUser && (
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ZSM */}
            {groupedUsers['zonal_sales_manager'] && groupedUsers['zonal_sales_manager'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>⭐</span>
                  <span>Zonal Sales Manager - ZSM ({groupedUsers['zonal_sales_manager'].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedUsers['zonal_sales_manager'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor('zonal_sales_manager')} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{user.full_name}</div>
                          <div className="text-sm text-gray-600">Zone: {user.zone || 'Not assigned'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {user.phone_number} • {user.email || 'No email'}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-500">Points</div>
                          <div className="text-lg font-bold text-blue-600">{user.total_points || 0}</div>
                        </div>
                        {(onEditUser || onDeleteUser) && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {onEditUser && (
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SE */}
            {groupedUsers['sales_executive'] && groupedUsers['sales_executive'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👤</span>
                  <span>Sales Executive - SE ({groupedUsers['sales_executive'].length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {groupedUsers['sales_executive'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor('sales_executive')} rounded-full flex items-center justify-center text-white text-sm font-bold shadow`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-800 truncate">{user.full_name}</div>
                          <div className="text-xs text-gray-600">{user.zone || 'No zone'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">{user.total_points || 0}</div>
                          <div className="text-xs text-gray-500">pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer */}
            {groupedUsers['developer'] && groupedUsers['developer'].length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💻</span>
                  <span>Developer ({groupedUsers['developer'].length})</span>
                </h3>
                <div className="space-y-2">
                  {groupedUsers['developer'].map((user: any) => (
                    <div key={user.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor('developer')} rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0`}>
                          {user.full_name?.substring(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{user.full_name}</div>
                          <div className="text-sm text-gray-600">{user.phone_number}</div>
                        </div>
                        {(onEditUser || onDeleteUser) && (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {onEditUser && (
                              <button
                                onClick={() => {
                                  onEditUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                ✏️ Edit
                              </button>
                            )}
                            {onDeleteUser && (
                              <button
                                onClick={() => {
                                  onDeleteUser(user);
                                  onClose();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleString()}
            </div>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}