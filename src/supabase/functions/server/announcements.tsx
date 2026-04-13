import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── KV helpers: wraps kv calls so permission-denied (42501) never crashes routes ──
async function safeKvGet(key: string): Promise<{ value: any }> {
  try {
    return await kv.get(key);
  } catch (err: any) {
    console.warn(`[Announcements] KV get("${key}") failed: ${err.message}. Returning null.`);
    return { value: null };
  }
}

async function safeKvSet(key: string, value: any): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[Announcements] KV set("${key}") failed: ${err.message}.`);
    return false;
  }
}

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ============================================================================
// CREATE ANNOUNCEMENT (HQ/Director Only)
// ============================================================================

app.post("/announcements", async (c) => {
  try {
    const body = await c.req.json();
    const { author_id, author_name, author_role, title, message, priority, target_roles } = body;

    // Validate required fields
    if (!author_id || !author_name || !message) {
      return c.json({ error: 'author_id, author_name, and message are required' }, 400);
    }

    // Validate author role (only HQ and Director can create announcements)
    if (author_role !== 'director' && author_role !== 'hq_staff' && author_role !== 'hq_command_center') {
      return c.json({ error: 'Only Directors and HQ Team can create announcements' }, 403);
    }

    // Create announcement
    const announcementId = `announcement_${Date.now()}_${author_id}`;
    const announcement = {
      id: announcementId,
      author_id,
      author_name,
      author_role,
      title: title || null,
      message,
      priority: priority || 'normal', // normal, high, urgent
      target_roles: target_roles || ['sales_executive'], // Default to SEs
      is_active: true,
      read_by: [], // Array of user IDs who have read this
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await kv.set(announcementId, JSON.stringify(announcement));
    } catch (kvErr: any) {
      if (kvErr.message?.includes('permission denied')) {
        console.warn('[Announcements] KV permission denied on write. Run: GRANT ALL ON TABLE kv_store_28f2f653 TO service_role, authenticated, anon;');
        return c.json({ error: 'Database permission error — KV table needs GRANT permissions. See server logs.', kvPermissionError: true }, 503);
      }
      throw kvErr;
    }

    console.log(`[Announcements] New announcement created: ${announcementId} by ${author_name}`);

    return c.json({ 
      success: true, 
      announcement,
      message: 'Announcement created successfully'
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return c.json({ error: error.message || 'Failed to create announcement' }, 500);
  }
});

// ============================================================================
// GET ANNOUNCEMENTS (With Role Filtering)
// ============================================================================

app.get("/announcements", async (c) => {
  try {
    const user_role = c.req.query('user_role');
    const user_id = c.req.query('user_id');
    const unread_only = c.req.query('unread_only') === 'true';

    console.log(`[Announcements] GET request - user_role: ${user_role}, user_id: ${user_id}, unread_only: ${unread_only}`);

    // Get all announcements from KV store — wrapped in resilient try-catch
    // so that ANY KV error (permission denied, missing table, network, etc.)
    // returns an empty list instead of crashing with 500.
    let allAnnouncementsKeys: any[] = [];
    try {
      allAnnouncementsKeys = await kv.getByPrefix('announcement_');
    } catch (kvErr: any) {
      console.warn(`[Announcements] KV read failed (${kvErr.message || kvErr}). Returning empty list.`);
      console.warn('[Announcements] If "permission denied", run in Supabase SQL Editor: GRANT ALL ON TABLE kv_store_28f2f653 TO service_role, authenticated, anon;');
      return c.json({ success: true, announcements: [], total: 0, kvError: kvErr.message || String(kvErr) });
    }
    console.log(`[Announcements] Found ${allAnnouncementsKeys.length} announcement keys`);

    let announcements: any[] = [];

    for (const item of allAnnouncementsKeys) {
      try {
        const announcement = JSON.parse(item.value as string);

        // Skip inactive announcements
        if (!announcement.is_active) continue;

        // Filter by target roles only when user_role is provided
        if (user_role && announcement.target_roles && !announcement.target_roles.includes(user_role)) {
          continue;
        }

        // Filter unread if requested
        if (unread_only && user_id) {
          if (announcement.read_by && announcement.read_by.includes(user_id)) {
            continue;
          }
        }

        // Annotate whether the current user has read this
        announcement.is_read = user_id && announcement.read_by
          ? announcement.read_by.includes(user_id)
          : false;

        announcements.push(announcement);
      } catch (err) {
        console.error('[Announcements] Error parsing announcement:', err);
        continue;
      }
    }

    // Sort by created_at (newest first)
    announcements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`[Announcements] Returning ${announcements.length} announcements`);
    return c.json({
      success: true,
      announcements,
      total: announcements.length
    });
  } catch (error: any) {
    console.error('[Announcements] ERROR in GET /announcements:', error);
    // Even the outer catch returns a 200 with empty data so the frontend never sees 500
    return c.json({ success: true, announcements: [], total: 0, error: error.message || 'Failed to fetch announcements' });
  }
});

// ============================================================================
// MARK ANNOUNCEMENT AS READ
// ============================================================================

app.post("/announcements/:id/read", async (c) => {
  try {
    const announcementId = c.req.param('id');
    const { user_id } = await c.req.json();

    if (!user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    // Get announcement
    const { value: announcementValue } = await safeKvGet(announcementId);
    if (!announcementValue) {
      return c.json({ error: 'Announcement not found (or KV unavailable)' }, 404);
    }

    const announcement = JSON.parse(announcementValue as string);

    // Add user to read_by array if not already present
    if (!announcement.read_by) {
      announcement.read_by = [];
    }

    if (!announcement.read_by.includes(user_id)) {
      announcement.read_by.push(user_id);
      announcement.updated_at = new Date().toISOString();
      const saved = await safeKvSet(announcementId, JSON.stringify(announcement));
      if (!saved) {
        return c.json({ success: false, error: 'Database temporarily unavailable', kvPermissionError: true }, 503);
      }
    }

    return c.json({ 
      success: true, 
      message: 'Announcement marked as read'
    });
  } catch (error: any) {
    console.error('Error marking announcement as read:', error);
    return c.json({ error: error.message || 'Failed to mark as read' }, 500);
  }
});

// ============================================================================
// DELETE/DEACTIVATE ANNOUNCEMENT (HQ/Director Only)
// ============================================================================

app.delete("/announcements/:id", async (c) => {
  try {
    const announcementId = c.req.param('id');
    const { user_role } = await c.req.json();

    // Validate role
    if (user_role !== 'director' && user_role !== 'hq_staff' && user_role !== 'hq_command_center') {
      return c.json({ error: 'Only Directors and HQ Team can delete announcements' }, 403);
    }

    // Get announcement
    const { value: announcementValue } = await safeKvGet(announcementId);
    if (!announcementValue) {
      return c.json({ error: 'Announcement not found (or KV unavailable)' }, 404);
    }

    const announcement = JSON.parse(announcementValue as string);

    // Soft delete (deactivate)
    announcement.is_active = false;
    announcement.updated_at = new Date().toISOString();
    const saved = await safeKvSet(announcementId, JSON.stringify(announcement));
    if (!saved) {
      return c.json({ success: false, error: 'Database temporarily unavailable', kvPermissionError: true }, 503);
    }

    return c.json({ 
      success: true, 
      message: 'Announcement deactivated successfully'
    });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return c.json({ error: error.message || 'Failed to delete announcement' }, 500);
  }
});

// ============================================================================
// GET UNREAD COUNT
// ============================================================================

app.get("/announcements/unread-count", async (c) => {
  try {
    const user_role = c.req.query('user_role');
    const user_id = c.req.query('user_id');

    if (!user_role || !user_id) {
      return c.json({ error: 'user_role and user_id are required' }, 400);
    }

    // Get all active announcements for this role — silently return 0 on any KV error
    let allAnnouncementsKeys: any[] = [];
    try {
      allAnnouncementsKeys = await kv.getByPrefix('announcement_');
    } catch (kvErr: any) {
      console.warn(`[Announcements] KV unread-count failed (${kvErr.message}). Returning 0.`);
      return c.json({ success: true, unread_count: 0, kvPermissionError: true });
    }
    let unreadCount = 0;

    for (const item of allAnnouncementsKeys) {
      try {
        const announcement = JSON.parse(item.value as string);
        
        // Skip inactive announcements
        if (!announcement.is_active) continue;

        // Check if announcement is for this role
        if (announcement.target_roles && !announcement.target_roles.includes(user_role)) {
          continue;
        }

        // Check if user has read this
        const hasRead = announcement.read_by && announcement.read_by.includes(user_id);
        if (!hasRead) {
          unreadCount++;
        }
      } catch (err) {
        console.error('Error parsing announcement:', err);
        continue;
      }
    }

    return c.json({ 
      success: true, 
      unread_count: unreadCount
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return c.json({ error: error.message || 'Failed to fetch unread count' }, 500);
  }
});

export default app;