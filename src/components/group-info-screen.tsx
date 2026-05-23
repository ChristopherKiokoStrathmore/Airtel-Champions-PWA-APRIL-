import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Shield, Settings, LogOut, Trash2, UserPlus, UserMinus, Crown, MoreVertical, Edit2, X, Check } from 'lucide-react';
import { getGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember, promoteToAdmin } from '../utils/groups-storage';
import { getVisibleUsers, type User } from '../lib/users-service';
import { supabase } from '../utils/supabase/client';

interface GroupMember {
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  user_role: string;
  zone: string;
  profile_image: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_by: string;
  created_at: string;
  type: 'personal' | 'official';
  members: GroupMember[];
  member_count: number;
}

interface GroupInfoScreenProps {
  groupId: string;
  currentUser: any;
  onBack: () => void;
  onLeaveGroup: () => void;
}

export function GroupInfoScreen({ groupId, currentUser, onBack, onLeaveGroup }: GroupInfoScreenProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMemberOptions, setShowMemberOptions] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const icons = ['👥', '💼', '🎯', '📊', '🚀', '💡', '⭐', '🔥', '📱', '💬', '🏆', '🎉'];
  const [visibleUsers, setVisibleUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getVisibleUsers(currentUser);
      setVisibleUsers(users);
    };
    loadUsers();
  }, [currentUser]);

  useEffect(() => {
    loadGroupInfo();
  }, []);

  const loadGroupInfo = async () => {
    try {
      const groupData = await getGroup(groupId, currentUser.id);
      
      // Check if groupData exists and has members array
      if (!groupData) {
        setLoading(false);
        return;
      }

      if (!groupData.members || !Array.isArray(groupData.members)) {
        // Initialize with empty members array to prevent crashes
        setGroup({
          ...groupData,
          members: []
        });
        setEditName(groupData.name);
        setEditDescription(groupData.description || '');
        setEditIcon(groupData.icon);
        setLoading(false);
        return;
      }
      
      setGroup(groupData);
      setEditName(groupData.name);
      setEditDescription(groupData.description || '');
      setEditIcon(groupData.icon);
      setLoading(false);
    } catch (error) {
      console.error('Error loading group:', error);
      setLoading(false);
    }
  };

  const isAdmin = group?.members?.find(m => m.user_id === currentUser.id)?.role === 'admin';
  const isCreator = group?.created_by === currentUser.id;

  const handleSaveEdit = async () => {
    if (!group || !editName.trim()) return;

    try {
      await updateGroup(groupId, {
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon
      });
      
      setGroup({
        ...group,
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!group) return;

    try {
      await addGroupMember(groupId, userId, currentUser);
      await loadGroupInfo();
      setShowAddMembers(false);
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!group) return;

    if (!confirm('Remove this member from the group?')) return;

    try {
      await removeGroupMember(groupId, userId);
      await loadGroupInfo();
      setShowMemberOptions(null);
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!group) return;

    try {
      await promoteToAdmin(groupId, userId);
      await loadGroupInfo();
      setShowMemberOptions(null);
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;

    try {
      await removeGroupMember(groupId, currentUser.id);
      onLeaveGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;

    try {
      await deleteGroup(groupId);
      onLeaveGroup();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-700';
      case 'hq_command_center': return 'bg-blue-100 text-blue-700';
      case 'zonal_business_manager': return 'bg-green-100 text-green-700';
      case 'zonal_sales_manager': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Director';
      case 'hq_command_center': return 'HQ';
      case 'zonal_business_manager': return 'ZBM';
      case 'zonal_sales_manager': return 'ZSM';
      default: return 'SE';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const availableUsers = visibleUsers.filter(user => 
    !group?.members.some(m => m.user_id === user.id) &&
    (user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.zone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Group not found</p>
          <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold">Group Info</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Group Header */}
        <div className="bg-white p-6 text-center border-b border-gray-200">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto">
                {icons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditIcon(icon)}
                    className={`p-2 text-2xl rounded-xl border-2 ${
                      editIcon === icon ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center font-bold"
                maxLength={50}
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Group description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
                maxLength={200}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(group.name);
                    setEditDescription(group.description || '');
                    setEditIcon(group.icon);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-5xl">
                {group.icon}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-2xl font-bold">{group.name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {group.description && (
                <p className="text-gray-600 text-sm mb-3">{group.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span className={`px-2 py-1 rounded ${
                  group.type === 'official' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {group.type === 'official' ? '🏢 Official' : '👥 Personal'}
                </span>
                <span>•</span>
                <span>Created {formatDate(group.created_at)}</span>
              </div>
            </>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white mt-4">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold">{group.member_count} Members</h4>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(true)}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-100">
            {group.members.map(member => (
              <div key={member.user_id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white flex-shrink-0">
                  {member.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{member.full_name || 'Unknown User'}</span>
                    {member.role === 'admin' && (
                      <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(member.user_role)}`}>
                      {getRoleLabel(member.user_role)}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{member.zone}</span>
                  </div>
                </div>
                {isAdmin && member.user_id !== currentUser.id && (
                  <button
                    onClick={() => setShowMemberOptions(showMemberOptions === member.user_id ? null : member.user_id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                )}

                {/* Member Options Popup */}
                {showMemberOptions === member.user_id && (
                  <div className="absolute right-4 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => handlePromoteToAdmin(member.user_id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Crown className="w-4 h-4 text-yellow-600" />
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <UserMinus className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group Settings */}
        <div className="bg-white mt-4">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold">Group Permissions</h4>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Send Messages</p>
                  <p className="text-xs text-gray-500">All members can send messages</p>
                </div>
                <span className="text-green-600 text-sm font-medium">Everyone</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Edit Group Info</p>
                  <p className="text-xs text-gray-500">Change name, icon, description</p>
                </div>
                <span className="text-yellow-600 text-sm font-medium">Admins Only</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Add Members</p>
                  <p className="text-xs text-gray-500">Invite new people to group</p>
                </div>
                <span className="text-yellow-600 text-sm font-medium">Admins Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white mt-4 mb-4">
          <button
            onClick={handleLeaveGroup}
            className="w-full px-4 py-3 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 font-medium"
          >
            <LogOut className="w-5 h-5" />
            Exit Group
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteGroup}
              className="w-full px-4 py-3 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 font-medium border-t border-gray-200"
            >
              <Trash2 className="w-5 h-5" />
              Delete Group
            </button>
          )}
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add Members</h3>
              <button onClick={() => setShowAddMembers(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleAddMember(user.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{user.full_name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className="text-xs text-gray-500">{user.zone}</span>
                    </div>
                  </div>
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}