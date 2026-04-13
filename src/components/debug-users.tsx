import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

export function DebugUsersPanel({ onSelectUser }: { onSelectUser: (phone: string, name: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get sample users from each role
      const { data, error } = await supabase
        .from('app_users')
        .select('phone_number, full_name, role, zone')
        .order('role', { ascending: false })
        .limit(20);

      if (data) {
        setUsers(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  };

  const createDemoUsers = async () => {
    setCreatingDemo(true);
    try {
      // Demo users for each role
      const demoUsers = [
        { phone_number: '+254700000001', full_name: 'John Director', role: 'director', zone: null, pin: '1234' },
        { phone_number: '+254700000002', full_name: 'Sarah HQ Staff', role: 'hq_command_center', zone: null, pin: '1234' },
        { phone_number: '+254710000001', full_name: 'Michael ZBM', role: 'zonal_business_manager', zone: 'Central', pin: '1234' },
        { phone_number: '+254710000002', full_name: 'Grace ZSM', role: 'zonal_sales_manager', zone: 'Central', pin: '1234' },
        { phone_number: '+254720000001', full_name: 'David SE', role: 'sales_executive', zone: 'Central', pin: '1234' },
        { phone_number: '+254720000002', full_name: 'Mary SE', role: 'sales_executive', zone: 'Central', pin: '1234' },
      ];

      const { error } = await supabase
        .from('app_users')
        .upsert(demoUsers, { onConflict: 'phone_number' });

      if (error) {
        console.error('Error creating demo users:', error);
        alert('❌ Failed to create demo users: ' + error.message);
      } else {
        alert('✅ Demo users created successfully!');
        await loadUsers(); // Reload the list
      }
    } catch (error: any) {
      console.error('Error creating demo users:', error);
      alert('❌ Failed to create demo users: ' + error.message);
    } finally {
      setCreatingDemo(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm z-50"
      >
        🧪 Show Test Users
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-xl">🧪 Test Users</h3>
          <button onClick={() => setShow(false)} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <p className="text-sm text-blue-800">
            <strong>📱 Click any user to auto-fill login form</strong>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Default PIN: <strong>1234</strong>
          </p>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">❌ No users found in database</p>
              <p className="text-sm text-gray-500 mb-4">
                Create demo users to test the app with different roles.
              </p>
              <button
                onClick={createDemoUsers}
                disabled={creatingDemo}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingDemo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Demo Users...
                  </div>
                ) : (
                  '✨ Create Demo Users'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelectUser(user.phone_number, user.full_name);
                    setShow(false);
                  }}
                  className="w-full bg-gray-50 hover:bg-blue-50 border border-gray-300 hover:border-blue-400 rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg mr-3 ${
                      user.role === 'director' ? 'bg-yellow-600' :
                      user.role === 'hq_command_center' ? 'bg-green-600' :
                      user.role === 'zonal_business_manager' ? 'bg-purple-600' :
                      user.role === 'zonal_sales_manager' ? 'bg-blue-600' :
                      'bg-red-600'
                    }`}>
                      {user.full_name.substring(0, 1)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{user.full_name}</h4>
                      <p className="text-xs text-gray-600 mb-1">📱 {user.phone_number}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'director' ? 'bg-yellow-100 text-yellow-800' :
                          user.role === 'hq_command_center' ? 'bg-green-100 text-green-800' :
                          user.role === 'zonal_business_manager' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'zonal_sales_manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.role === 'director' ? '👑 Director' :
                           user.role === 'hq_command_center' ? '🏢 HQ Staff' :
                           user.role === 'zonal_business_manager' ? '👔 ZBM' :
                           user.role === 'zonal_sales_manager' ? '👔 ZSM' :
                           '🦅 SE'}
                        </span>
                        {user.zone && (
                          <span className="text-xs text-gray-600">📍 {user.zone}</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <p className="text-xs text-gray-600">
            💡 Tip: All test accounts use PIN <strong>1234</strong>
          </p>
        </div>
      </div>
    </div>
  );
}