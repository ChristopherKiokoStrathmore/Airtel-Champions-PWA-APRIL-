import { useState, useEffect } from 'react';
import { X, Users, Check, ChevronRight, Search, MapPin, Award, Building2, UserCircle } from 'lucide-react';
import { createGroup } from '../utils/groups-storage';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface User {
  id: string;
  full_name: string;
  role: string;
  zone: string;
  region: string;
  zsm?: string; // Added for filtering SEs under specific ZSM
  profile_image?: string;
}

interface GroupCreatorProps {
  currentUser: any;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
}

interface HierarchyData {
  hierarchy: {
    directors: User[];
    hq: User[];
    zbms: User[];
    zsms: User[];
    ses: User[];
  };
  byZone: Record<string, {
    zbms: User[];
    zsms: User[];
    ses: User[];
  }>;
  currentUser: User;
  zones: string[];
  regions: string[];
}

export function GroupCreator({ currentUser, onClose, onGroupCreated }: GroupCreatorProps) {
  const [step, setStep] = useState<'name' | 'members'>('name');
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('💬');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<'quick' | 'individual'>('quick');
  
  // For Director/HQ advanced filters
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('');
  const [selectedZSMFilter, setSelectedZSMFilter] = useState<string>('');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showZSMDropdown, setShowZSMDropdown] = useState(false);

  const groupIcons = ['💬', '🔥', '⚡', '🎯', '🏆', '💡', '📊', '🌟', '🚀', '💼'];

  useEffect(() => {
    if (step === 'members') {
      fetchHierarchyData();
    }
  }, [step]);

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      // Fetch ALL users directly from app_users table (same as leaderboard does)
      // Only select columns that actually exist in the table
      const { data: dbUsers, error: dbError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, role, zone, region, zsm')
        .order('full_name', { ascending: true });

      if (dbError) {
        console.error('Database error:', dbError.message);
        throw new Error(`Database error: ${dbError.message}`);
      }

      if (!dbUsers || dbUsers.length === 0) {
        throw new Error('No users found in database');
      }
      
      // Map users with UUID as primary identifier (needed for database operations)
      const allUsers = dbUsers.map(user => ({
        id: user.id, // Use UUID for database operations
        employee_id: user.employee_id,
        full_name: user.full_name,
        role: user.role,
        zone: user.zone || '',
        region: user.region || '',
        zsm: user.zsm || '', // Include ZSM for filtering SEs
        profile_image: '', // No profile_image column in database
      }));

      // Get unique zones and regions for filters
      const zones = [...new Set(allUsers.map(u => u.zone).filter(Boolean))].sort();
      const regions = [...new Set(allUsers.map(u => u.region).filter(Boolean))].sort();

      // Organize users by hierarchy
      const hierarchy = {
        directors: allUsers.filter(u => u.role === 'director'),
        hq: allUsers.filter(u => u.role === 'hq_command_center'),
        zbms: allUsers.filter(u => u.role === 'zonal_business_manager'),
        zsms: allUsers.filter(u => u.role === 'zonal_sales_manager'),
        ses: allUsers.filter(u => u.role === 'sales_executive'),
      };

      // Organize users by zone
      const byZone: Record<string, any> = {};
      zones.forEach(zone => {
        byZone[zone] = {
          zbms: allUsers.filter(u => u.zone === zone && u.role === 'zonal_business_manager'),
          zsms: allUsers.filter(u => u.zone === zone && u.role === 'zonal_sales_manager'),
          ses: allUsers.filter(u => u.zone === zone && u.role === 'sales_executive'),
        };
      });

      // Find current user
      const currentUserData = allUsers.find(u => u.id === currentUser.employee_id || u.id === currentUser.id);

      const data = {
        success: true,
        dataSource: 'database',
        hierarchy,
        byZone,
        currentUser: currentUserData,
        zones,
        regions,
      };
      
      setHierarchyData(data);
      
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      alert(`Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelection = (type: string, zoneParam?: string, zsmParam?: string) => {
    if (!hierarchyData) return;

    const newSelection = new Set(selectedMembers);
    const userRole = currentUser.role;

    switch (type) {
      case 'my_zone_ses':
        // For ZBMs: Add only SEs in their zone
        if (currentUser.zone && hierarchyData.byZone[currentUser.zone]) {
          hierarchyData.byZone[currentUser.zone].ses.forEach(se => newSelection.add(se.id));
        }
        break;

      case 'my_zone_zsms':
        // For ZBMs: Add only ZSMs in their zone
        if (currentUser.zone && hierarchyData.byZone[currentUser.zone]) {
          hierarchyData.byZone[currentUser.zone].zsms.forEach(zsm => newSelection.add(zsm.id));
        }
        break;

      case 'my_ses':
        // For ZSMs: Add SEs under them (matched by ZSM name)
        if (currentUser.full_name) {
          hierarchyData.hierarchy.ses
            .filter(se => se.zsm === currentUser.full_name)
            .forEach(se => newSelection.add(se.id));
        }
        break;

      case 'my_zone':
        // Role-based "My Zone" button
        if (userRole === 'sales_executive') {
          // SEs can only add fellow SEs in their zone
          if (currentUser.zone && hierarchyData.byZone[currentUser.zone]) {
            hierarchyData.byZone[currentUser.zone].ses.forEach(se => {
              // Don't add yourself
              if (se.id !== currentUser.id) {
                newSelection.add(se.id);
              }
            });
          }
        } else if (userRole === 'zonal_sales_manager') {
          // ZSMs can only add fellow ZSMs in their zone
          if (currentUser.zone && hierarchyData.byZone[currentUser.zone]) {
            hierarchyData.byZone[currentUser.zone].zsms.forEach(zsm => {
              // Don't add yourself
              if (zsm.id !== currentUser.id) {
                newSelection.add(zsm.id);
              }
            });
          }
        } else if (userRole === 'zonal_business_manager') {
          // ZBMs add everyone in their zone (handled separately by my_zone_ses and my_zone_zsms buttons)
          if (currentUser.zone && hierarchyData.byZone[currentUser.zone]) {
            const zoneUsers = hierarchyData.byZone[currentUser.zone];
            zoneUsers.zbms.forEach(u => {
              if (u.id !== currentUser.id) newSelection.add(u.id);
            });
            zoneUsers.zsms.forEach(u => {
              if (u.id !== currentUser.id) newSelection.add(u.id);
            });
            zoneUsers.ses.forEach(u => {
              if (u.id !== currentUser.id) newSelection.add(u.id);
            });
          }
        }
        break;

      case 'all_zsms':
        // Add all ZSMs across all zones
        hierarchyData.hierarchy.zsms.forEach(zsm => {
          if (zsm.id !== currentUser.id) newSelection.add(zsm.id);
        });
        break;

      case 'all_zbms':
        // Add all ZBMs
        hierarchyData.hierarchy.zbms.forEach(zbm => {
          if (zbm.id !== currentUser.id) newSelection.add(zbm.id);
        });
        break;

      case 'all_ses':
        // For Directors/HQ: Add all SEs
        hierarchyData.hierarchy.ses.forEach(se => newSelection.add(se.id));
        break;

      case 'zsms_in_zone':
        // For Directors/HQ: Add ZSMs in a specific zone
        if (zoneParam && hierarchyData.byZone[zoneParam]) {
          hierarchyData.byZone[zoneParam].zsms.forEach(zsm => newSelection.add(zsm.id));
        }
        setShowZoneDropdown(false);
        break;

      case 'ses_in_zone':
        // For Directors/HQ: Add SEs in a specific zone
        if (zoneParam && hierarchyData.byZone[zoneParam]) {
          hierarchyData.byZone[zoneParam].ses.forEach(se => newSelection.add(se.id));
        }
        setShowZoneDropdown(false);
        break;

      case 'ses_under_zsm':
        // For Directors/HQ: Add all SEs under a specific ZSM
        if (zsmParam) {
          hierarchyData.hierarchy.ses
            .filter(se => se.zsm === zsmParam)
            .forEach(se => newSelection.add(se.id));
        }
        setShowZSMDropdown(false);
        break;

      case 'hq_only':
        // Add all HQ staff
        hierarchyData.hierarchy.hq.forEach(hq => newSelection.add(hq.id));
        break;

      case 'leadership':
        // Add directors, HQ, and ZBMs
        hierarchyData.hierarchy.directors.forEach(d => newSelection.add(d.id));
        hierarchyData.hierarchy.hq.forEach(h => newSelection.add(h.id));
        hierarchyData.hierarchy.zbms.forEach(z => newSelection.add(z.id));
        break;

      default:
        break;
    }

    setSelectedMembers(newSelection);
    
    // Show visual feedback - switch to individual tab to show selected members
    setTimeout(() => {
      setSelectionMode('individual');
    }, 300);
  };

  const toggleMember = (userId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedMembers(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedMembers.size === 0) {
      alert('Please select at least one member');
      return;
    }

    setCreating(true);

    try {
      const group = await createGroup(
        groupName,
        undefined, // description
        groupIcon,
        'personal', // type
        currentUser.id,
        Array.from(selectedMembers),
        currentUser
      );
      
      if (!group) {
        throw new Error('Failed to create group');
      }
      
      alert(`Group "${groupName}" created successfully!`);
      onGroupCreated(group.id);
      onClose();
    } catch (error) {
      console.error('❌ Error in createGroup:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-500 text-white';
      case 'hq_command_center': return 'bg-blue-500 text-white';
      case 'zonal_business_manager': return 'bg-green-500 text-white';
      case 'zonal_sales_manager': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
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

  const getAllUsers = (): User[] => {
    if (!hierarchyData) return [];
    
    return [
      ...hierarchyData.hierarchy.directors,
      ...hierarchyData.hierarchy.hq,
      ...hierarchyData.hierarchy.zbms,
      ...hierarchyData.hierarchy.zsms,
      ...hierarchyData.hierarchy.ses,
    ];
  };

  const filteredUsers = getAllUsers().filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDirectorOrHQ = ['director', 'hq_command_center'].includes(currentUser.role);
  const isZBM = currentUser.role === 'zonal_business_manager';
  const isZSM = currentUser.role === 'zonal_sales_manager';
  const isSE = currentUser.role === 'sales_executive';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold">
              {step === 'name' ? 'Create Group' : `Add Members (${selectedMembers.size})`}
            </h2>
          </div>
          {step === 'name' ? (
            <button
              onClick={() => setStep('members')}
              disabled={!groupName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateGroup}
              disabled={selectedMembers.size === 0 || creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'name' ? (
            /* STEP 1: Name & Icon */
            <div className="p-6 space-y-6">
              {/* Group Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Choose Icon
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {groupIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setGroupIcon(icon)}
                      className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                        groupIcon === icon
                          ? 'bg-blue-600 scale-110 shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200'
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
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Nairobi Zone Intel, Top Performers Club"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                  maxLength={50}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {groupName.length}/50
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm text-blue-900 font-semibold mb-2">💡 Group Tips</div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Use clear, descriptive names (e.g., "Mombasa ZSM Team")</li>
                  <li>• Groups are private - only members can see messages</li>
                  <li>• You'll be the admin and can manage members later</li>
                  <li>• Perfect for sharing trade secrets and zone-specific intel</li>
                </ul>
              </div>
            </div>
          ) : (
            /* STEP 2: Members */
            <div className="flex flex-col h-full">
              {/* Selection Mode Toggle */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectionMode('quick')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      selectionMode === 'quick'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    ⚡ Quick Select
                  </button>
                  <button
                    onClick={() => setSelectionMode('individual')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                      selectionMode === 'individual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300'
                    }`}
                  >
                    👤 Individual
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : selectionMode === 'quick' ? (
                /* QUICK SELECTION */
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Smart Selections
                  </div>

                  {/* SE: Only "My Zone" button (fellow SEs) */}
                  {isSE && (
                    <button
                      onClick={() => handleQuickSelection('my_zone')}
                      className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white">
                            🌍
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">My Zone</div>
                            <div className="text-xs text-gray-500">
                              Fellow SEs in {currentUser.zone}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  )}

                  {/* ZSM: "My Zone" (fellow ZSMs) + "My SEs" + "All ZSMs" */}
                  {isZSM && (
                    <>
                      <button
                        onClick={() => handleQuickSelection('my_zone')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white">
                              🌍
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">My Zone</div>
                              <div className="text-xs text-gray-500">
                                Fellow ZSMs in {currentUser.zone}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSelection('my_ses')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white">
                              👥
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">My SEs</div>
                              <div className="text-xs text-gray-500">
                                Sales Executives under me
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSelection('all_zsms')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-full flex items-center justify-center text-white">
                              ⭐
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">All ZSMs</div>
                              <div className="text-xs text-gray-500">
                                {hierarchyData?.hierarchy.zsms.length || 0} Zonal Sales Managers
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    </>
                  )}

                  {/* ZBM: "My Zone SEs" + "My Zone ZSMs" + "All ZBMs" */}
                  {isZBM && (
                    <>
                      <button
                        onClick={() => handleQuickSelection('my_zone_ses')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white">
                              👥
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">My Zone SEs</div>
                              <div className="text-xs text-gray-500">
                                Sales Executives in {currentUser.zone}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSelection('my_zone_zsms')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white">
                              🌍
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">My Zone ZSMs</div>
                              <div className="text-xs text-gray-500">
                                Zonal Sales Managers in {currentUser.zone}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>

                      <button
                        onClick={() => handleQuickSelection('all_zbms')}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white">
                              💼
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">All ZBMs</div>
                              <div className="text-xs text-gray-500">
                                {hierarchyData?.hierarchy.zbms.length || 0} Zonal Business Managers
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    </>
                  )}

                  {/* Directors/HQ: Steve Jobs Minimal Design */}
                  {isDirectorOrHQ && (
                    <>
                      {/* Quick Singles */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleQuickSelection('all_zsms')}
                          className="w-full p-4 bg-white border-2 border-yellow-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Award className="w-6 h-6 text-yellow-600" />
                              <div>
                                <div className="font-semibold text-gray-900">All ZSMs</div>
                                <div className="text-xs text-gray-500">
                                  {hierarchyData?.hierarchy.zsms.length || 0} managers
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleQuickSelection('all_zbms')}
                          className="w-full p-4 bg-white border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-6 h-6 text-green-600" />
                              <div>
                                <div className="font-semibold text-gray-900">All ZBMs</div>
                                <div className="text-xs text-gray-500">
                                  {hierarchyData?.hierarchy.zbms.length || 0} business managers
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleQuickSelection('all_ses')}
                          className="w-full p-4 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <UserCircle className="w-6 h-6 text-blue-600" />
                              <div>
                                <div className="font-semibold text-gray-900">All SEs</div>
                                <div className="text-xs text-gray-500">
                                  {hierarchyData?.hierarchy.ses.length || 0} sales executives
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Zone-based Selections */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          By Zone
                        </div>
                        
                        {/* ZSMs in Zone */}
                        <button
                          onClick={() => setShowZoneDropdown(!showZoneDropdown)}
                          className="w-full p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl hover:border-yellow-400 transition-all text-left mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-6 h-6 text-yellow-600" />
                              <div>
                                <div className="font-semibold text-gray-900">ZSMs in Zone</div>
                                <div className="text-xs text-gray-500">Select zone</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showZoneDropdown ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {showZoneDropdown && (
                          <div className="mb-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200 space-y-1 max-h-48 overflow-y-auto">
                            {hierarchyData?.zones.map(zone => (
                              <button
                                key={zone}
                                onClick={() => {
                                  handleQuickSelection('zsms_in_zone', zone);
                                  setSelectedZoneFilter(zone);
                                }}
                                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-yellow-100 transition-colors"
                              >
                                {zone}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* SEs in Zone */}
                        <button
                          onClick={() => setShowZSMDropdown(!showZSMDropdown)}
                          className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-6 h-6 text-blue-600" />
                              <div>
                                <div className="font-semibold text-gray-900">SEs in Zone</div>
                                <div className="text-xs text-gray-500">Select zone</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showZSMDropdown ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {showZSMDropdown && (
                          <div className="mt-2 bg-blue-50 rounded-lg p-3 border border-blue-200 space-y-1 max-h-48 overflow-y-auto">
                            {hierarchyData?.zones.map(zone => (
                              <button
                                key={zone}
                                onClick={() => {
                                  handleQuickSelection('ses_in_zone', zone);
                                }}
                                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {zone}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* By ZSM */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          By Manager
                        </div>
                        
                        <button
                          onClick={() => {
                            const currentState = showZSMDropdown;
                            setShowZSMDropdown(!currentState);
                            setShowZoneDropdown(false);
                          }}
                          className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Award className="w-6 h-6 text-purple-600" />
                              <div>
                                <div className="font-semibold text-gray-900">SEs under ZSM</div>
                                <div className="text-xs text-gray-500">Select manager</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showZSMDropdown ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {showZSMDropdown && (
                          <div className="mt-2 bg-purple-50 rounded-lg p-3 border border-purple-200 space-y-1 max-h-48 overflow-y-auto">
                            {hierarchyData?.hierarchy.zsms.map(zsm => (
                              <button
                                key={zsm.id}
                                onClick={() => {
                                  handleQuickSelection('ses_under_zsm', undefined, zsm.full_name);
                                  setSelectedZSMFilter(zsm.full_name);
                                }}
                                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-purple-100 transition-colors"
                              >
                                <div className="font-medium">{zsm.full_name}</div>
                                <div className="text-xs text-gray-500">{zsm.zone}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {selectedMembers.size > 0 && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-900">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">
                          {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedMembers(new Set())}
                        className="text-sm text-green-700 hover:underline mt-2"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* INDIVIDUAL SELECTION */
                <div className="flex-1 flex flex-col">
                  {/* Search */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or zone..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Users List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleMember(user.id)}
                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedMembers.has(user.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {selectedMembers.has(user.id) && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white flex-shrink-0">
                            {user.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">
                                {user.full_name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getRoleBadgeColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{user.zone}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}