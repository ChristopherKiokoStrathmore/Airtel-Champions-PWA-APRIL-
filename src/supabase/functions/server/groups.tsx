import { Hono } from 'npm:hono';
import * as kv from './kv_store.tsx';

const app = new Hono();

// ── KV helper: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGetByPrefix(prefix: string): Promise<any[]> {
  try {
    return await kv.getByPrefix(prefix);
  } catch (err: any) {
    console.warn(`[Groups] KV getByPrefix("${prefix}") failed: ${err.message}. Returning [].`);
    return [];
  }
}

async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Groups] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Groups] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

async function safeKvMget(keys: string[]): Promise<any[]> {
  try {
    return await kv.mget(keys);
  } catch (err: any) {
    console.warn(`[Groups] KV mget failed: ${err.message}. Returning [].`);
    return [];
  }
}

// Helper to generate UUID
function generateId() {
  return crypto.randomUUID();
}

// Health check for groups service
app.get('/groups/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'Groups API',
    timestamp: new Date().toISOString() 
  });
});

// GET /groups - List user's groups
app.get('/groups', async (c) => {
  try {
    const userId = c.req.query('user_id');
    
    console.log('📥 GET /groups request - userId:', userId);
    
    if (!userId) {
      console.error('❌ Missing user_id parameter');
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get all groups from KV store
    console.log('🔍 Fetching all groups from KV store...');
    const allGroupsData = await safeKvGetByPrefix('group:');
    console.log(`✅ Found ${allGroupsData.length} total groups in KV store`);
    const allGroups = allGroupsData.map(item => item.value);

    // Filter groups where user is a member
    const userGroups = allGroups.filter(group => {
      return group.members && group.members.some((m: any) => m.user_id === userId);
    });

    console.log(`✅ User is member of ${userGroups.length} groups`);

    // Sort by updated_at
    userGroups.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Get latest message for each group
    const enrichedGroups = await Promise.all(
      userGroups.map(async (group) => {
        // Get messages for this group
        const messagesData = await safeKvGetByPrefix(`group_msg:${group.id}:`);
        const messages = messagesData.map(item => item.value);
        
        // Sort messages by created_at
        messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        const latestMessage = messages[0];

        return {
          ...group,
          member_count: group.members?.length || 0,
          latest_message: latestMessage?.message || null,
          latest_message_time: latestMessage?.created_at || null,
          unread_count: 0
        };
      })
    );

    console.log(`✅ Returning ${enrichedGroups.length} enriched groups`);
    return c.json({ groups: enrichedGroups });
  } catch (error) {
    console.error('❌ Error in GET /groups:', error);
    return c.json({ error: 'Internal server error', details: String(error) }, 500);
  }
});

// POST /groups - Create a new group
app.post('/groups', async (c) => {
  try {
    const body = await c.req.json();
    const { name, icon, created_by, member_ids } = body;

    if (!name || !created_by) {
      return c.json({ error: 'name and created_by are required' }, 400);
    }

    const groupId = generateId();
    const now = new Date().toISOString();

    // Build members list
    const members = [
      { user_id: created_by, role: 'admin', joined_at: now }
    ];

    if (member_ids && Array.isArray(member_ids)) {
      member_ids
        .filter(id => id !== created_by)
        .forEach(id => {
          members.push({ user_id: id, role: 'member', joined_at: now });
        });
    }

    const group = {
      id: groupId,
      name,
      icon: icon || '💬',
      created_by,
      created_at: now,
      updated_at: now,
      members
    };

    // Save to KV store
    const saved = await safeKvSet(`group:${groupId}`, group);
    if (!saved) {
      return c.json({ error: 'Database temporarily unavailable — please try again later', kvPermissionError: true }, 503);
    }

    return c.json({ 
      group: { 
        ...group, 
        member_count: members.length 
      } 
    }, 201);
  } catch (error) {
    console.error('Error in POST /groups:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /groups/:id - Get group details
app.get('/groups/:id', async (c) => {
  try {
    const groupId = c.req.param('id');
    const userId = c.req.query('user_id');

    if (!userId) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get group from KV store
    const groupData = await safeKvGet(`group:${groupId}`);
    const group = groupData?.value;

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is a member
    const membership = group.members?.find((m: any) => m.user_id === userId);

    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get user details from KV store
    const userIds = group.members?.map((m: any) => m.user_id) || [];
    const usersData = await safeKvMget(userIds.map(id => `user:${id}`));
    
    const membersWithDetails = group.members?.map((member: any) => {
      const userData = usersData.find((u: any) => u && u.id === member.user_id);
      return {
        ...member,
        full_name: userData?.full_name || 'Unknown',
        user_role: userData?.role || 'sales_executive',
        zone: userData?.zone || '',
        profile_image: userData?.profile_image || null
      };
    });

    return c.json({
      group: {
        ...group,
        members: membersWithDetails,
        member_count: membersWithDetails?.length || 0,
        user_role: membership.role
      }
    });
  } catch (error) {
    console.error('Error in GET /groups/:id:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /groups/:id/messages - Get group messages
app.get('/groups/:id/messages', async (c) => {
  try {
    const groupId = c.req.param('id');
    const userId = c.req.query('user_id');
    const limit = parseInt(c.req.query('limit') || '50');

    if (!userId) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Check if user is a member
    const groupData = await safeKvGet(`group:${groupId}`);
    const group = groupData?.value;
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    const membership = group.members?.find((m: any) => m.user_id === userId);
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Get messages for this group
    const messagesData = await safeKvGetByPrefix(`group_msg:${groupId}:`);
    let messages = messagesData.map(item => item.value);

    // Sort by created_at (oldest first for display)
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Limit messages
    if (messages.length > limit) {
      messages = messages.slice(-limit);
    }

    // Get user details for message senders
    const userIds = [...new Set(messages.map((m: any) => m.user_id))];
    const usersData = await safeKvMget(userIds.map(id => `user:${id}`));

    const enrichedMessages = messages.map((message: any) => {
      const userData = usersData.find((u: any) => u && u.id === message.user_id);
      return {
        ...message,
        user: {
          id: userData?.id || message.user_id,
          full_name: userData?.full_name || 'Unknown',
          role: userData?.role || 'sales_executive',
          zone: userData?.zone || '',
          profile_image: userData?.profile_image || null
        }
      };
    });

    return c.json({ messages: enrichedMessages });
  } catch (error) {
    console.error('Error in GET /groups/:id/messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /groups/:id/messages - Send a message
app.post('/groups/:id/messages', async (c) => {
  try {
    const groupId = c.req.param('id');
    const body = await c.req.json();
    const { user_id, message, photos } = body;

    if (!user_id || (!message && (!photos || photos.length === 0))) {
      return c.json({ error: 'user_id and (message or photos) are required' }, 400);
    }

    // Check if user is a member
    const groupData = await safeKvGet(`group:${groupId}`);
    const group = groupData?.value;
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    const membership = group.members?.find((m: any) => m.user_id === user_id);
    if (!membership) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const messageId = generateId();
    const now = new Date().toISOString();

    const newMessage = {
      id: messageId,
      group_id: groupId,
      user_id,
      message: message || null,
      photos: photos || [],
      created_at: now
    };

    // Save message to KV store
    const msgSaved = await safeKvSet(`group_msg:${groupId}:${messageId}`, newMessage);
    if (!msgSaved) {
      return c.json({ error: 'Database temporarily unavailable — please try again later', kvPermissionError: true }, 503);
    }

    // Update group's updated_at timestamp
    group.updated_at = now;
    await safeKvSet(`group:${groupId}`, group);

    // Get user details
    const userDataResult = await safeKvGet(`user:${user_id}`);
    const userData = userDataResult?.value;

    return c.json({
      message: {
        ...newMessage,
        user: userData || { 
          id: user_id, 
          full_name: 'Unknown', 
          role: 'sales_executive', 
          zone: '' 
        }
      }
    }, 201);
  } catch (error) {
    console.error('Error in POST /groups/:id/messages:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /groups/users/hierarchy - Get users organized by hierarchy for member selection
app.get('/groups/users/hierarchy', async (c) => {
  try {
    const currentUserId = c.req.query('user_id');
    
    console.log('📥 GET /groups/users/hierarchy request - userId:', currentUserId);
    
    if (!currentUserId) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get current user's info
    const currentUserData = await safeKvGet(`user:${currentUserId}`);
    const currentUser = currentUserData?.value;

    console.log('🔍 Current user found:', currentUser ? 'YES' : 'NO');

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Get all users from KV store
    console.log('🔍 Fetching all users from KV store...');
    const allUsersData = await safeKvGetByPrefix('user:');
    console.log(`✅ Found ${allUsersData.length} total users in KV store`);
    const allUsers = allUsersData.map(item => item.value);

    // Organize by role
    const hierarchy = {
      directors: allUsers.filter(u => u.role === 'director'),
      hq: allUsers.filter(u => u.role === 'hq_staff'),
      zbms: allUsers.filter(u => u.role === 'zonal_business_manager'),
      zsms: allUsers.filter(u => u.role === 'zonal_sales_manager'),
      ses: allUsers.filter(u => u.role === 'sales_executive')
    };

    console.log(`✅ Hierarchy organized - Directors: ${hierarchy.directors.length}, HQ: ${hierarchy.hq.length}, ZBMs: ${hierarchy.zbms.length}, ZSMs: ${hierarchy.zsms.length}, SEs: ${hierarchy.ses.length}`);

    // Group by zone for easier selection
    const byZone: Record<string, any> = {};
    allUsers.forEach(user => {
      if (!user.zone) return;
      if (!byZone[user.zone]) {
        byZone[user.zone] = {
          zbms: [],
          zsms: [],
          ses: []
        };
      }
      
      if (user.role === 'zonal_business_manager') {
        byZone[user.zone].zbms.push(user);
      } else if (user.role === 'zonal_sales_manager') {
        byZone[user.zone].zsms.push(user);
      } else if (user.role === 'sales_executive') {
        byZone[user.zone].ses.push(user);
      }
    });

    console.log(`✅ Users grouped by ${Object.keys(byZone).length} zones`);

    return c.json({ hierarchy, byZone, currentUser });
  } catch (error) {
    console.error('❌ Error in GET /groups/users/hierarchy:', error);
    return c.json({ error: 'Internal server error', details: String(error) }, 500);
  }
});

export default app;