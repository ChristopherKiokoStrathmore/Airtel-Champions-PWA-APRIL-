import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, MessageCircle, ChevronRight } from 'lucide-react';
import { getEnrichedUserGroups } from '../utils/groups-storage';

interface Group {
  id: string;
  name: string;
  icon: string;
  member_count: number;
  latest_message: string | null;
  latest_message_time: string | null;
  unread_count: number;
  created_at: string;
}

interface GroupsListProps {
  currentUser: any;
  onGroupClick: (groupId: string) => void;
}

export function GroupsList({ currentUser, onGroupClick }: GroupsListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, [currentUser.id]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Use Supabase database
      const userGroups = await getEnrichedUserGroups(currentUser.id);
      
      setGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-gray-900 font-semibold text-lg mb-2">No Groups Yet</p>
          <p className="text-sm text-gray-600 mb-4">
            Create your first private intelligence network or wait to be added to a group.
          </p>
          <p className="text-xs text-gray-500">
            Groups let you share trade secrets, competitor intel, and insights privately with selected members.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {groups.map((group) => (
        <div
          key={group.id}
          onClick={() => onGroupClick(group.id)}
          className="bg-white px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Group Icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl flex-shrink-0">
              {group.icon}
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {group.name}
                </h3>
                {group.latest_message_time && (
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {formatTime(group.latest_message_time)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{group.member_count} members</span>
                </div>
                
                {group.unread_count > 0 && (
                  <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {group.unread_count > 9 ? '9+' : group.unread_count}
                    </span>
                  </div>
                )}
              </div>

              {group.latest_message && (
                <p className="text-xs text-gray-600 truncate mt-1">
                  {group.latest_message}
                </p>
              )}
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}