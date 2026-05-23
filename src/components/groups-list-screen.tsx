import { useState, useEffect } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { getEnrichedUserGroups, type Group } from '../utils/groups-storage';

interface GroupsListScreenProps {
  currentUser: any;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export function GroupsListScreen({ currentUser, onSelectGroup, onCreateGroup }: GroupsListScreenProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGroups();
  }, [currentUser]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await getEnrichedUserGroups(currentUser.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white px-4 py-6">
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-red-100 text-sm">Connect with your team</p>
        </div>

        {/* Loading */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-red-100 text-sm">Connect with your team</p>
          </div>
          <button
            onClick={onCreateGroup}
            className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create a group to start collaborating with your team'}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateGroup}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 bg-white">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                {/* Group Icon */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-2xl flex-shrink-0">
                  {group.icon}
                </div>

                {/* Group Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {group.name}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(group.updated_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                    {group.type === 'official' && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Official
                        </span>
                      </>
                    )}
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}