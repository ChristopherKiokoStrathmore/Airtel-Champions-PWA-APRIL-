// PWA Activity Tracking - Logs user actions, page views, and engagement metrics
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// KV store on make-server project (activity logs stored here)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Frontend Supabase (for user lookups)
const FRONTEND_SUPABASE_URL = Deno.env.get('FRONTEND_SUPABASE_URL')?.startsWith('https://')
  ? Deno.env.get('FRONTEND_SUPABASE_URL')!
  : 'https://xspogpfohjmkykfjadhk.supabase.co';
const FRONTEND_SERVICE_ROLE_KEY = Deno.env.get('FRONTEND_SERVICE_ROLE_KEY') || '';
const FRONTEND_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';
const frontendSupabase = createClient(FRONTEND_SUPABASE_URL, FRONTEND_SERVICE_ROLE_KEY || FRONTEND_ANON_KEY);

// ============================================================================
// LOG A PWA ACTION (Fire & Forget - optimized for speed)
// ============================================================================

app.post("/activity/log", async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      userName,
      userRole,
      actionType,
      actionDetails = {},
      sessionId,
      deviceInfo,
      timestamp,
    } = body;

    if (!userId || !actionType) {
      return c.json({ success: false, error: "userId and actionType required" }, 400);
    }

    const now = timestamp || new Date().toISOString();
    const entryId = crypto.randomUUID();
    
    // Create a time-sortable key: activity:<date>:<timestamp>:<uuid>
    const dateStr = now.substring(0, 10); // YYYY-MM-DD
    const key = `activity:${dateStr}:${now}:${entryId}`;

    const activityEntry = {
      id: entryId,
      userId,
      userName: userName || "Unknown",
      userRole: userRole || "unknown",
      actionType,
      actionDetails,
      sessionId: sessionId || null,
      deviceInfo: deviceInfo || null,
      timestamp: now,
      date: dateStr,
    };

    await supabase
      .from("kv_store_28f2f653")
      .upsert({
        key,
        value: JSON.stringify(activityEntry),
        created_at: now,
        updated_at: now,
      });

    return c.json({ success: true, id: entryId });
  } catch (error: any) {
    console.error("[Activity] Log error:", error);
    // Still return 200 to not break fire-and-forget callers
    return c.json({ success: false, error: error.message }, 200);
  }
});

// ============================================================================
// BATCH LOG (Multiple actions in one request - for offline sync)
// ============================================================================

app.post("/activity/batch", async (c) => {
  try {
    const { actions } = await c.req.json();

    if (!Array.isArray(actions) || actions.length === 0) {
      return c.json({ success: false, error: "actions array required" }, 400);
    }

    const entries = actions.map((action: any) => {
      const now = action.timestamp || new Date().toISOString();
      const entryId = crypto.randomUUID();
      const dateStr = now.substring(0, 10);
      
      return {
        key: `activity:${dateStr}:${now}:${entryId}`,
        value: JSON.stringify({
          id: entryId,
          userId: action.userId,
          userName: action.userName || "Unknown",
          userRole: action.userRole || "unknown",
          actionType: action.actionType,
          actionDetails: action.actionDetails || {},
          sessionId: action.sessionId || null,
          deviceInfo: action.deviceInfo || null,
          timestamp: now,
          date: dateStr,
        }),
        created_at: now,
        updated_at: now,
      };
    });

    // Batch insert (chunks of 50)
    for (let i = 0; i < entries.length; i += 50) {
      const chunk = entries.slice(i, i + 50);
      await supabase.from("kv_store_28f2f653").upsert(chunk);
    }

    console.log(`[Activity] Batch logged ${actions.length} actions`);
    return c.json({ success: true, count: actions.length });
  } catch (error: any) {
    console.error("[Activity] Batch error:", error);
    return c.json({ success: false, error: error.message }, 200);
  }
});

// ============================================================================
// GET ACTIVITY FEED (Recent actions, with filters)
// ============================================================================

app.get("/activity/feed", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "100");
    const date = c.req.query("date"); // YYYY-MM-DD
    const userId = c.req.query("userId");
    const actionType = c.req.query("actionType");

    let prefix = "activity:";
    if (date) {
      prefix = `activity:${date}:`;
    }

    // Fetch from KV with prefix
    const { data: entries, error } = await supabase
      .from("kv_store_28f2f653")
      .select("key, value, created_at")
      .like("key", `${prefix}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Activity] Feed fetch error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    let activities = (entries || []).map((entry: any) => {
      try {
        return JSON.parse(entry.value);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Apply filters
    if (userId) {
      activities = activities.filter((a: any) => a.userId === userId);
    }
    if (actionType) {
      activities = activities.filter((a: any) => a.actionType === actionType);
    }

    return c.json({
      success: true,
      activities,
      total: activities.length,
    });
  } catch (error: any) {
    console.error("[Activity] Feed error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET ACTIVITY STATS (Aggregated analytics)
// ============================================================================

app.get("/activity/stats", async (c) => {
  try {
    const days = parseInt(c.req.query("days") || "7");
    const now = new Date();
    
    // Build date range
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().substring(0, 10));
    }

    // Fetch all activities for the date range
    const allActivities: any[] = [];
    
    for (const date of dates) {
      const { data: entries } = await supabase
        .from("kv_store_28f2f653")
        .select("value")
        .like("key", `activity:${date}:%`);

      if (entries) {
        for (const entry of entries) {
          try {
            allActivities.push(JSON.parse(entry.value));
          } catch {}
        }
      }
    }

    // Aggregate stats
    const uniqueUsers = new Set(allActivities.map((a) => a.userId));
    const actionCounts: Record<string, number> = {};
    const userActionCounts: Record<string, { name: string; role: string; count: number }> = {};
    const hourlyDistribution: Record<number, number> = {};
    const dailyCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};

    for (const activity of allActivities) {
      // Action type counts
      actionCounts[activity.actionType] = (actionCounts[activity.actionType] || 0) + 1;

      // User activity counts
      if (!userActionCounts[activity.userId]) {
        userActionCounts[activity.userId] = {
          name: activity.userName,
          role: activity.userRole,
          count: 0,
        };
      }
      userActionCounts[activity.userId].count++;

      // Hourly distribution
      const hour = new Date(activity.timestamp).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

      // Daily counts
      const dateKey = activity.date || activity.timestamp?.substring(0, 10);
      if (dateKey) {
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }

      // Role counts
      if (activity.userRole) {
        roleCounts[activity.userRole] = (roleCounts[activity.userRole] || 0) + 1;
      }
    }

    // Top users by activity
    const topUsers = Object.entries(userActionCounts)
      .map(([id, data]) => ({ userId: id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Action type breakdown sorted
    const actionBreakdown = Object.entries(actionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Daily trend
    const dailyTrend = dates.map((date) => ({
      date,
      count: dailyCounts[date] || 0,
    })).reverse();

    // Hourly heatmap
    const hourlyHeatmap = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourlyDistribution[h] || 0,
    }));

    return c.json({
      success: true,
      stats: {
        totalActions: allActivities.length,
        uniqueUsers: uniqueUsers.size,
        periodDays: days,
        avgActionsPerDay: Math.round(allActivities.length / days),
        avgActionsPerUser: uniqueUsers.size > 0
          ? Math.round(allActivities.length / uniqueUsers.size)
          : 0,
        topUsers,
        actionBreakdown,
        dailyTrend,
        hourlyHeatmap,
        roleBreakdown: Object.entries(roleCounts).map(([role, count]) => ({ role, count })),
      },
    });
  } catch (error: any) {
    console.error("[Activity] Stats error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET USER ACTIVITY (Activity for a specific user)
// ============================================================================

app.get("/activity/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const limit = parseInt(c.req.query("limit") || "50");

    // Get last 7 days of activity
    const activities: any[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);

      const { data: entries } = await supabase
        .from("kv_store_28f2f653")
        .select("value")
        .like("key", `activity:${dateStr}:%`);

      if (entries) {
        for (const entry of entries) {
          try {
            const parsed = JSON.parse(entry.value);
            if (parsed.userId === userId) {
              activities.push(parsed);
            }
          } catch {}
        }
      }
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({
      success: true,
      activities: activities.slice(0, limit),
      total: activities.length,
    });
  } catch (error: any) {
    console.error("[Activity] User activity error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// CLEANUP OLD ACTIVITY LOGS (> 30 days)
// ============================================================================

app.post("/activity/cleanup", async (c) => {
  try {
    const daysToKeep = parseInt(c.req.query("days") || "30");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().substring(0, 10);

    console.log(`[Activity] Cleaning up activities older than ${cutoffStr}`);

    // Delete old entries
    const { data: oldEntries } = await supabase
      .from("kv_store_28f2f653")
      .select("key")
      .like("key", "activity:%")
      .lt("created_at", cutoffDate.toISOString());

    if (oldEntries && oldEntries.length > 0) {
      const keys = oldEntries.map((e: any) => e.key);
      // Delete in chunks
      for (let i = 0; i < keys.length; i += 100) {
        const chunk = keys.slice(i, i + 100);
        await supabase
          .from("kv_store_28f2f653")
          .delete()
          .in("key", chunk);
      }
      console.log(`[Activity] Cleaned up ${oldEntries.length} old entries`);
      return c.json({ success: true, deleted: oldEntries.length });
    }

    return c.json({ success: true, deleted: 0, message: "No old entries to clean up" });
  } catch (error: any) {
    console.error("[Activity] Cleanup error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;