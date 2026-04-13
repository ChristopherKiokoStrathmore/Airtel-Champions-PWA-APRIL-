import { useState, useEffect } from 'react';
import { Search, Phone, Video, User, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface UserDirectoryUser {
  id: string;
  full_name: string;
  employee_id: string;
  role: string;
  status?: 'online' | 'offline' | 'busy' | 'in_call';
}

interface UserDirectoryProps {
  currentUserId: string;
  onClose: () => void;
  onCallUser: (userId: string, userName: string, callType: 'audio' | 'video') => void;
}

export function UserDirectory({ currentUserId, onClose, onCallUser }: UserDirectoryProps) {
  const [users, setUsers] = useState<UserDirectoryUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDirectoryUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online'>('all'); // 🔥 Changed default to 'all'

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Load all users except current user
      const { data: usersData, error: usersError } = await supabase
        .from('app_users')
        .select('id, full_name, employee_id, role')
        .neq('id', currentUserId)
        .order('full_name');

      if (usersError) throw usersError;

      // Load user statuses
      const { data: statusData, error: statusError } = await supabase
        .from('user_call_status')
        .select('user_id, status');

      if (statusError) throw statusError;

      // Merge users with their status
      const statusMap = new Map(statusData?.map(s => [s.user_id, s.status]) || []);
      const usersWithStatus = usersData?.map(user => ({
        ...user,
        status: statusMap.get(user.id) || 'offline',
      })) || [];

      setUsers(usersWithStatus);
      console.log('[UserDirectory] Loaded', usersWithStatus.length, 'users');
    } catch (err) {
      console.error('[UserDirectory] Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by online status
    if (selectedFilter === 'online') {
      filtered = filtered.filter(u => u.status === 'online');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(query) ||
        u.employee_id.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'in_call': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'busy': return 'Busy';
      case 'in_call': return 'In Call';
      default: return 'Offline';
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'director': return '👔';
      case 'hq_staff': return '🏢';
      case 'zone_commander': return '⚡';
      case 'zone_business_lead': return '💼';
      case 'sales_executive': return '🦅';
      default: return '👤';
    }
  };

  // 🔥 REMOVED: Online status check - allow calling all users
  // const canCall = (user: UserDirectoryUser) => {
  //   return user.status === 'online';
  // };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">📞 Call Directory</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setSelectedFilter('online')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                selectedFilter === 'online'
                  ? 'bg-white text-blue-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Online ({users.filter(u => u.status === 'online').length})
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl p-4 h-20 animate-pulse"></div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-semibold text-gray-800 mb-2">No Users Found</div>
              <p className="text-gray-600">
                {searchQuery ? 'Try a different search term' : 'No users are currently online'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                        {getRoleEmoji(user.role)}
                      </div>
                      {/* Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${getStatusColor(user.status)} rounded-full border-2 border-white`}></div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {user.full_name}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>ID: {user.employee_id}</span>
                        <span>•</span>
                        <span className="capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'online' ? 'bg-green-100 text-green-800' :
                          user.status === 'in_call' ? 'bg-red-100 text-red-800' :
                          user.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(user.status)}
                        </span>
                      </div>
                    </div>

                    {/* Call Buttons */}
                    <div className="flex gap-2">
                      {/* Audio Call */}
                      <button
                        onClick={() => onCallUser(user.id, user.full_name, 'audio')}
                        className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                        title="Audio Call"
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </button>

                      {/* Video Call */}
                      <button
                        onClick={() => onCallUser(user.id, user.full_name, 'video')}
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
                        title="Video Call"
                      >
                        <Video className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}