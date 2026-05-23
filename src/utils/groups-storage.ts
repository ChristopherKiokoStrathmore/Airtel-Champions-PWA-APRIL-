// Supabase storage for Groups feature
// This implementation uses Supabase database for real-time group sharing

import { supabase } from './supabase/client';

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon: string;
  type: 'personal' | 'official';
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
  member_count?: number;
  user_role?: string;
}

export interface GroupMember {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  full_name?: string;
  user_role?: string;
  zone?: string;
  profile_image?: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  message: string | null;
  photos: string[];
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    role: string;
    zone: string;
    profile_image: string | null;
    employee_id: string;
  };
}

// Get all groups for a specific user
export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    console.log('📡 [getUserGroups] Fetching groups for user:', userId);

    // Get groups where user is a member
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (membersError) {
      console.error('❌ Error fetching group memberships:', membersError);
      return [];
    }

    if (!groupMembers || groupMembers.length === 0) {
      console.log('📭 No groups found for user');
      return [];
    }

    const groupIds = groupMembers.map(gm => gm.group_id);

    // Fetch full group details
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (groupsError) {
      console.error('❌ Error fetching groups:', groupsError);
      return [];
    }

    // Get member counts for each group
    const enrichedGroups = await Promise.all(
      (groups || []).map(async (group) => {
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          ...group,
          member_count: count || 0,
        };
      })
    );

    console.log('✅ [getUserGroups] Fetched', enrichedGroups.length, 'groups');
    return enrichedGroups;
  } catch (error) {
    console.error('❌ Error in getUserGroups:', error);
    return [];
  }
}

// Get a specific group with member details
export async function getGroup(groupId: string, userId?: string): Promise<any | null> {
  try {
    console.log('📡 [getGroup] Fetching group:', groupId, 'for user:', userId);

    // Check if user is a member (if userId provided)
    if (userId) {
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        console.log('❌ User is not a member of this group');
        return null;
      }
    }

    // Fetch group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      console.error('❌ Error fetching group:', groupError);
      return null;
    }

    // Fetch members with user details from app_users table
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        joined_at,
        app_users!group_members_user_id_fkey (
          id,
          employee_id,
          full_name,
          role,
          zone
        )
      `)
      .eq('group_id', groupId);

    if (membersError) {
      console.error('❌ Error fetching members:', membersError);
      return null;
    }

    // Transform members to include user details
    const enrichedMembers = (members || []).map(member => ({
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      full_name: member.app_users?.full_name || 'Unknown User',
      user_role: member.app_users?.role || 'sales_executive',
      zone: member.app_users?.zone || '',
      employee_id: member.app_users?.employee_id || '',
    }));

    const userRole = userId ? enrichedMembers.find(m => m.user_id === userId)?.role : undefined;

    console.log('✅ [getGroup] Group fetched with', enrichedMembers.length, 'members');

    return {
      ...group,
      members: enrichedMembers,
      member_count: enrichedMembers.length,
      user_role: userRole,
    };
  } catch (error) {
    console.error('❌ Error in getGroup:', error);
    return null;
  }
}

// Create a new group
export async function createGroup(
  name: string,
  description: string | undefined,
  icon: string,
  type: 'personal' | 'official',
  createdBy: string,
  memberIds: string[],
  currentUserData: any,
  membersData?: any[]
): Promise<Group | null> {
  try {
    console.log('📡 [createGroup] Creating group:', name, 'with', memberIds.length, 'members');

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        icon,
        type,
        created_by: createdBy,
      })
      .select()
      .single();

    if (groupError || !group) {
      console.error('❌ Error creating group:', groupError);
      throw new Error('Failed to create group');
    }

    // Add creator as admin
    const { error: creatorError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: createdBy,
        role: 'admin',
      });

    if (creatorError) {
      console.error('❌ Error adding creator to group:', creatorError);
      throw new Error('Failed to add creator to group');
    }

    // Add other members
    const otherMembers = memberIds
      .filter(id => id !== createdBy)
      .map(user_id => ({
        group_id: group.id,
        user_id,
        role: 'member' as const,
      }));

    if (otherMembers.length > 0) {
      const { error: membersError } = await supabase
        .from('group_members')
        .insert(otherMembers);

      if (membersError) {
        console.error('❌ Error adding members to group:', membersError);
        // Continue anyway, group is created
      }
    }

    console.log('✅ [createGroup] Group created successfully:', group.id);

    return {
      ...group,
      members: [],
      member_count: memberIds.length,
    };
  } catch (error) {
    console.error('❌ Error in createGroup:', error);
    return null;
  }
}

// Get messages for a specific group with pagination
export async function getGroupMessages(
  groupId: string,
  userId: string,
  limit = 50,
  offset = 0
): Promise<GroupMessage[]> {
  try {
    console.log('📡 [getGroupMessages] Fetching messages for group:', groupId);

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      console.log('❌ User is not a member, cannot view messages');
      return [];
    }

    // Fetch messages with user details
    const { data: messages, error } = await supabase
      .from('group_messages')
      .select(`
        id,
        group_id,
        user_id,
        message,
        photos,
        created_at,
        app_users!group_messages_user_id_fkey (
          id,
          employee_id,
          full_name,
          role,
          zone
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }

    // Transform to match expected format
    const formattedMessages: GroupMessage[] = (messages || []).map(msg => ({
      id: msg.id,
      group_id: msg.group_id,
      user_id: msg.user_id,
      message: msg.message,
      photos: msg.photos || [],
      created_at: msg.created_at,
      user: msg.app_users ? {
        id: msg.app_users.id,
        employee_id: msg.app_users.employee_id,
        full_name: msg.app_users.full_name,
        role: msg.app_users.role,
        zone: msg.app_users.zone,
      } : undefined,
    }));

    console.log('✅ [getGroupMessages] Fetched', formattedMessages.length, 'messages');
    return formattedMessages;
  } catch (error) {
    console.error('❌ Error in getGroupMessages:', error);
    return [];
  }
}

// Send a message to a group
export async function sendGroupMessage(
  groupId: string,
  userId: string,
  message: string | null,
  photos: string[],
  userData: any
): Promise<GroupMessage | null> {
  try {
    console.log('📡 [sendGroupMessage] Sending message to group:', groupId);

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      console.log('❌ User is not a member, cannot send message');
      return null;
    }

    // Insert message
    const { data: newMessage, error: messageError } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: userId,
        message,
        photos: photos || [],
      })
      .select()
      .single();

    if (messageError || !newMessage) {
      console.error('❌ Error sending message:', messageError);
      return null;
    }

    // Update group's updated_at timestamp
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    console.log('✅ [sendGroupMessage] Message sent successfully');

    return {
      ...newMessage,
      photos: newMessage.photos || [],
      user: {
        id: userData.id,
        employee_id: userData.employee_id,
        full_name: userData.full_name || 'Unknown',
        role: userData.role || 'sales_executive',
        zone: userData.zone || '',
        profile_image: userData.profile_image || null,
      },
    };
  } catch (error) {
    console.error('❌ Error in sendGroupMessage:', error);
    return null;
  }
}

// Get enriched groups with latest message info
export async function getEnrichedUserGroups(userId: string): Promise<any[]> {
  try {
    const groups = await getUserGroups(userId);

    const enrichedGroups = await Promise.all(
      groups.map(async (group) => {
        const messages = await getGroupMessages(group.id, userId, 1, 0);
        const latestMessage = messages[messages.length - 1];

        return {
          ...group,
          latest_message: latestMessage?.message || null,
          latest_message_time: latestMessage?.created_at || null,
          unread_count: 0, // TODO: Implement unread tracking
        };
      })
    );

    return enrichedGroups;
  } catch (error) {
    console.error('❌ Error in getEnrichedUserGroups:', error);
    return [];
  }
}

// Update group info
export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'icon'>>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId);

    if (error) {
      console.error('❌ Error updating group:', error);
      throw new Error('Failed to update group');
    }

    console.log('✅ Group updated successfully');
  } catch (error) {
    console.error('❌ Error in updateGroup:', error);
    throw error;
  }
}

// Delete a group
export async function deleteGroup(groupId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('❌ Error deleting group:', error);
      throw new Error('Failed to delete group');
    }

    console.log('✅ Group deleted successfully');
  } catch (error) {
    console.error('❌ Error in deleteGroup:', error);
    throw error;
  }
}

// Add member to group
export async function addGroupMember(
  groupId: string,
  userId: string,
  currentUserData: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      });

    if (error) {
      console.error('❌ Error adding member:', error);
      throw new Error('Failed to add member');
    }

    // Update group's updated_at timestamp
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    console.log('✅ Member added successfully');
  } catch (error) {
    console.error('❌ Error in addGroupMember:', error);
    throw error;
  }
}

// Remove member from group
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error removing member:', error);
      throw new Error('Failed to remove member');
    }

    // Update group's updated_at timestamp
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    console.log('✅ Member removed successfully');
  } catch (error) {
    console.error('❌ Error in removeGroupMember:', error);
    throw error;
  }
}

// Promote member to admin
export async function promoteToAdmin(groupId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error promoting member:', error);
      throw new Error('Failed to promote member');
    }

    // Update group's updated_at timestamp
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    console.log('✅ Member promoted successfully');
  } catch (error) {
    console.error('❌ Error in promoteToAdmin:', error);
    throw error;
  }
}