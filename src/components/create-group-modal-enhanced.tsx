import { useState, useEffect } from 'react';
import { X, Users, Search, Check, ChevronDown, ChevronRight, Zap, Building2, UserCheck } from 'lucide-react';
import { createGroup } from '../utils/groups-storage';
import { getAllUsers, getVisibleUsers, getSECountByZone, getTeamCount, getZones, getZSMs, getSEsByZone, type User } from '../lib/users-service';

interface CreateGroupModalProps {
  currentUser: any;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

export function CreateGroupModalEnhanced({ currentUser, onClose, onGroupCreated }: CreateGroupModalProps) {
  const [step, setStep] = useState<'info' | 'members'>('info');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupIcon, setGroupIcon] = useState('👥');
  const [groupType, setGroupType] = useState<'personal' | 'official'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set([currentUser.id]));
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [zsms, setZSMs] = useState<User[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Available emoji icons
  const icons = ['👥', '💼', '🎯', '📊', '🚀', '💡', '⭐', '🔥', '📱', '💬', '🏆', '🎉'];

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Load users based on current user's role
      const visibleUsers = await getVisibleUsers(currentUser);
      setAllUsers(visibleUsers);
      
      console.log('👥 Loaded visible users:', visibleUsers.length);
      console.log('👥 Sample user IDs from allUsers:', visibleUsers.slice(0, 3).map(u => ({ 
        id: u.id, 
        employee_id: u.employee_id,
        name: u.full_name 
      })));
      console.log('👤 Current user:', { 
        id: currentUser.id, 
        employee_id: currentUser.employee_id,
        name: currentUser.full_name 
      });
      
      // Load zones and ZSMs
      const allZones = await getZones();
      setZones(allZones);
      
      const allZSMs = await getZSMs();
      setZSMs(allZSMs);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => {
    if (user.id === currentUser.id) return false; // Don't show current user in list
    
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const toggleMember = (userId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedMembers(newSelected);
  };

  const handleQuickAddZone = async (zone: string) => {
    // Add all SEs from this zone
    const zoneUsers = await getSEsByZone(zone);
    console.log('🔍 DEBUG Quick Add Zone:', zone, 'Users found:', zoneUsers.length);
    console.log('🔍 DEBUG Zone user IDs:', zoneUsers.map(u => ({ id: u.id, name: u.full_name })));
    
    const newSelected = new Set(selectedMembers);
    zoneUsers.forEach(u => newSelected.add(u.id));
    setSelectedMembers(newSelected);
    setShowQuickAdd(false);
  };

  const handleQuickAddZSM = (zsmId: string) => {
    // Add all SEs under this ZSM
    const zsmUsers = allUsers.filter(u => u.reporting_to === zsmId && (u.role === 'sales_executive' || u.role === 'field_agent'));
    const newSelected = new Set(selectedMembers);
    // Add the ZSM too
    newSelected.add(zsmId);
    // Add all their SEs
    zsmUsers.forEach(u => newSelected.add(u.id));
    setSelectedMembers(newSelected);
    setShowQuickAdd(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.size < 2) {
      alert('Please add at least one other member');
      return;
    }

    setCreating(true);

    try {
      const memberIds = Array.from(selectedMembers);
      
      console.log('🔍 DEBUG: Selected member IDs:', memberIds);
      console.log('🔍 DEBUG: All users count:', allUsers.length);
      console.log('🔍 DEBUG: Sample allUsers IDs:', allUsers.slice(0, 5).map(u => ({ id: u.id, employee_id: u.employee_id, name: u.full_name })));
      
      // Get full user data for all selected members - match by BOTH id and employee_id
      const membersWithData = allUsers.filter(u => 
        memberIds.includes(u.id) || memberIds.includes(u.employee_id)
      );
      
      console.log('🔍 DEBUG: Members with data found:', membersWithData.length);
      console.log('🔍 DEBUG: Members with data:', membersWithData.map(u => ({ id: u.id, employee_id: u.employee_id, name: u.full_name })));
      
      // Find which member IDs don't have data
      const missingIds = memberIds.filter(id => 
        !allUsers.some(u => u.id === id || u.employee_id === id)
      );
      if (missingIds.length > 0) {
        console.error('❌ DEBUG: Missing user data for IDs:', missingIds);
      }
      
      const groupId = createGroup(
        groupName.trim(),
        groupDescription.trim(),
        groupIcon,
        groupType,
        currentUser.id,
        memberIds,
        currentUser,
        membersWithData  // Pass full user data
      );

      onGroupCreated(groupId);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
      setCreating(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
            <p className="text-sm text-gray-500">
              {step === 'info' ? 'Group Information' : `Add Members (${selectedMembers.size - 1} selected)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step === 'info' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'info' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {step === 'info' ? '1' : '✓'}
              </div>
              <span className="text-sm font-medium">Group Info</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
            <div className={`flex items-center gap-2 ${step === 'members' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'members' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Add Members</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'info' ? (
            <div className="space-y-6">
              {/* Group Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGroupType('personal')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      groupType === 'personal'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`w-6 h-6 mb-2 ${groupType === 'personal' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-semibold text-gray-900">Personal</div>
                    <div className="text-xs text-gray-500">Created by you</div>
                  </button>
                  <button
                    onClick={() => setGroupType('official')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      groupType === 'official'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className={`w-6 h-6 mb-2 ${groupType === 'official' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-semibold text-gray-900">Official</div>
                    <div className="text-xs text-gray-500">Management group</div>
                  </button>
                </div>
              </div>

              {/* Group Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setGroupIcon(icon)}
                      className={`p-3 text-2xl rounded-xl border-2 transition-all ${
                        groupIcon === icon
                          ? 'border-blue-600 bg-blue-50 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Nairobi Sales Team"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">{groupName.length}/50 characters</p>
              </div>

              {/* Group Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{groupDescription.length}/200 characters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Add Section */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                <button
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">⚡ Quick Add</div>
                      <div className="text-xs text-gray-600">Add entire zones or ZSM teams instantly</div>
                    </div>
                  </div>
                  {showQuickAdd ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showQuickAdd && (
                  <div className="mt-4 space-y-4">
                    {/* Quick Add by Zone */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Add All SEs by Zone
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {zones.map(zone => {
                          const zoneUserCount = getSECountByZone(zone);
                          return (
                            <button
                              key={zone}
                              onClick={() => handleQuickAddZone(zone)}
                              className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 text-left transition-all"
                            >
                              <div className="text-xs font-semibold text-gray-900 truncate">{zone}</div>
                              <div className="text-xs text-gray-500">{zoneUserCount} SEs</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Add by ZSM */}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Add ZSM + Their Team
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {zsms.map(zsm => {
                          const teamCount = getTeamCount(zsm.id);
                          return (
                            <button
                              key={zsm.id}
                              onClick={() => handleQuickAddZSM(zsm.id)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 text-left flex items-center justify-between transition-all"
                            >
                              <div>
                                <div className="text-xs font-semibold text-gray-900">{zsm.full_name}</div>
                                <div className="text-xs text-gray-500">{zsm.zone} • {teamCount} SEs</div>
                              </div>
                              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                +{teamCount + 1}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or zone..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Selected Count */}
              {selectedMembers.size > 1 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      {selectedMembers.size - 1} member{selectedMembers.size > 2 ? 's' : ''} selected
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedMembers(new Set([currentUser.id]))}
                    className="text-xs text-green-700 hover:text-green-900 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* User List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = selectedMembers.has(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleMember(user.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white flex-shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.full_name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <span className="text-xs text-gray-500 truncate">{user.zone}</span>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            {step === 'members' && (
              <button
                onClick={() => setStep('info')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (step === 'info') {
                  if (!groupName.trim()) {
                    alert('Please enter a group name');
                    return;
                  }
                  setStep('members');
                } else {
                  handleCreateGroup();
                }
              }}
              disabled={creating}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-colors ${
                step === 'info' ? 'flex-1' : 'flex-1'
              } ${
                creating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {creating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : step === 'info' ? (
                'Next: Add Members'
              ) : (
                `Create Group (${selectedMembers.size} members)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}