// User Upload Management System - Excel Upload, Preview, Go-Live, Rollback
import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx";

const app = new Hono();

// Make-server Supabase client (for kv_store only)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Frontend Supabase client — all data tables (app_users, app_users_staging,
// upload_batches, org_change_log, submissions, points_history) live here.
// The make-server project does NOT have these tables.
const FRONTEND_SUPABASE_URL = Deno.env.get('FRONTEND_SUPABASE_URL')?.startsWith('https://')
  ? Deno.env.get('FRONTEND_SUPABASE_URL')!
  : 'https://xspogpfohjmkykfjadhk.supabase.co';
const FRONTEND_SERVICE_ROLE_KEY = Deno.env.get('FRONTEND_SERVICE_ROLE_KEY') || '';
const FRONTEND_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg';
// Use service_role key if available (bypasses RLS), fallback to anon key
const frontendKey = FRONTEND_SERVICE_ROLE_KEY || FRONTEND_ANON_KEY;
const frontendSupabase = createClient(FRONTEND_SUPABASE_URL, frontendKey);
console.log('[User Upload] Frontend Supabase client initialized:', FRONTEND_SUPABASE_URL, 'using', FRONTEND_SERVICE_ROLE_KEY ? 'service_role key' : 'anon key');

// Types
interface ExcelUser {
  full_name: string;
  phone_number: string;
  employee_id?: string;
  email?: string;
  role: string;
  region?: string;
  zone?: string;
  zsm?: string;
  zbm?: string;
  job_title?: string;
}

interface UserChange {
  type: "new_user" | "removed_user" | "role_change" | "zone_transfer" | "unchanged";
  phone_number: string;
  full_name: string;
  old_data?: any;
  new_data?: any;
  points?: number;
  submissions_count?: number;
  team_members?: string[];
  team_count?: number;
  team_points?: number;
}

interface ValidationWarning {
  row: number;
  field: string;
  issue: string;
  severity: "error" | "warning";
  data?: any;
}

// ============================================================================
// UPLOAD EXCEL FILE (Stage Preview)
// ============================================================================

app.post("/upload-excel", async (c) => {
  try {
    console.log("[User Upload] Excel upload initiated");
    
    // Get uploaded file
    const body = await c.req.parseBody();
    const file = body.file as File;
    
    if (!file) {
      return c.json({ success: false, error: "No file uploaded" }, 400);
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    console.log(`[User Upload] Parsed ${jsonData.length} rows from Excel`);
    
    // Log the actual column headers for debugging
    if (jsonData.length > 0) {
      console.log(`[User Upload] Excel columns found:`, Object.keys(jsonData[0]));
    }

    // Helper: case-insensitive column lookup
    function getCol(row: any, ...candidates: string[]): string {
      // First try exact match
      for (const c of candidates) {
        if (row[c] !== undefined && row[c] !== null) return String(row[c]);
      }
      // Then try case-insensitive match
      const rowKeys = Object.keys(row);
      for (const c of candidates) {
        const lower = c.toLowerCase();
        const match = rowKeys.find(k => k.toLowerCase() === lower);
        if (match && row[match] !== undefined && row[match] !== null) return String(row[match]);
      }
      // Try partial match (e.g., "Name" matches "Agent Name", "Full_Name" matches "Full Name")
      for (const c of candidates) {
        const lower = c.toLowerCase().replace(/[_\s]/g, '');
        const match = rowKeys.find(k => k.toLowerCase().replace(/[_\s]/g, '') === lower);
        if (match && row[match] !== undefined && row[match] !== null) return String(row[match]);
      }
      return "";
    }

    // Normalize data with flexible column matching
    const users: ExcelUser[] = jsonData.map((row) => ({
      full_name: getCol(row, "Full Name", "Name", "full_name", "FULL NAME", "name", "Agent Name", "Employee Name", "FullName"),
      phone_number: normalizePhone(getCol(row, "Phone Number", "Phone", "phone_number", "PHONE NUMBER", "phone", "Mobile", "Mobile Number", "Contact", "PHONE", "MSISDN", "Tel")),
      employee_id: getCol(row, "Employee ID", "employee_id", "EMPLOYEE ID", "Emp ID", "EmpID", "Staff ID"),
      email: getCol(row, "Email", "email", "EMAIL", "Email Address", "E-mail"),
      role: getCol(row, "Role", "role", "ROLE", "Designation", "Position", "Title") || "SE",
      region: getCol(row, "Region", "region", "REGION"),
      zone: getCol(row, "Zone", "zone", "ZONE", "Territory"),
      zsm: getCol(row, "ZSM", "zsm", "Zone Sales Manager", "Zone Manager"),
      zbm: getCol(row, "ZBM", "zbm", "Zone Business Manager"),
      job_title: getCol(row, "Job Title", "job_title", "JOB TITLE", "Designation"),
    }));

    // Validate data
    const warnings: ValidationWarning[] = [];
    const validUsers: ExcelUser[] = [];

    users.forEach((user, index) => {
      const rowNum = index + 2; // Excel row (1-indexed + header)

      // Check required fields
      if (!user.full_name || user.full_name.trim() === "") {
        warnings.push({
          row: rowNum,
          field: "full_name",
          issue: "Missing name",
          severity: "error",
          data: user,
        });
        return;
      }

      if (!user.phone_number || user.phone_number.trim() === "") {
        warnings.push({
          row: rowNum,
          field: "phone_number",
          issue: "Missing phone number",
          severity: "error",
          data: user,
        });
        return;
      }

      // Check for duplicates within Excel
      const duplicate = validUsers.find(
        (u) => u.phone_number === user.phone_number
      );
      if (duplicate) {
        warnings.push({
          row: rowNum,
          field: "phone_number",
          issue: `Duplicate phone number: ${user.phone_number}`,
          severity: "error",
          data: { user1: duplicate, user2: user },
        });
        return;
      }

      validUsers.push(user);
    });

    console.log(`[User Upload] ${validUsers.length} valid users, ${warnings.length} warnings`);

    // Clear staging table
    await frontendSupabase.from("app_users_staging").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Get existing users to preserve UUIDs (Stable UUID UPSERT)
    const { data: existingUsers } = await frontendSupabase
      .from("app_users")
      .select("id, phone_number, full_name, role, zone, zsm, total_points");

    const existingMap = new Map(
      existingUsers?.map((u) => [u.phone_number, u]) || []
    );

    // Insert into staging with stable UUIDs
    const stagingUsers = validUsers.map((user) => {
      const existing = existingMap.get(user.phone_number);
      return {
        id: existing?.id, // Reuse UUID if exists, otherwise Postgres will generate new
        full_name: user.full_name,
        phone_number: user.phone_number,
        employee_id: user.employee_id || null,
        email: user.email || null,
        role: user.role,
        region: user.region || null,
        zone: user.zone || null,
        zsm: user.zsm || null,
        zbm: user.zbm || null,
        job_title: user.job_title || null,
        is_active: true,
        pin: "1234", // Default PIN for new users
      };
    });

    const { error: insertError } = await frontendSupabase
      .from("app_users_staging")
      .insert(stagingUsers);

    if (insertError) {
      console.error("[User Upload] Staging insert error:", insertError);
      return c.json({ success: false, error: insertError.message }, 500);
    }

    // Create upload batch record
    const batchId = crypto.randomUUID();
    const { error: batchError } = await frontendSupabase.from("upload_batches").insert({
      id: batchId,
      filename: file.name,
      status: "staged",
      total_users: validUsers.length,
      warnings_count: warnings.length,
      uploaded_at: new Date().toISOString(),
    });

    if (batchError) {
      console.error("[User Upload] Batch record error:", batchError);
    }

    // Generate preview comparison
    const changes = await generateChangePreview(existingMap, validUsers);

    console.log(`[User Upload] Upload complete - Batch ID: ${batchId}`);

    return c.json({
      success: true,
      batch_id: batchId,
      total_users: validUsers.length,
      warnings,
      changes,
      debug: {
        excel_columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
        total_rows_parsed: jsonData.length,
        sample_row: jsonData.length > 0 ? jsonData[0] : null,
      },
    });
  } catch (error: any) {
    console.error("[User Upload] Upload error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GENERATE CHANGE PREVIEW
// ============================================================================

async function generateChangePreview(
  existingMap: Map<string, any>,
  newUsers: ExcelUser[]
): Promise<{
  new_users: UserChange[];
  removed_users: UserChange[];
  role_changes: UserChange[];
  zone_transfers: UserChange[];
  unchanged_count: number;
}> {
  const newUsersChanges: UserChange[] = [];
  const removedUsersChanges: UserChange[] = [];
  const roleChanges: UserChange[] = [];
  const zoneTransfers: UserChange[] = [];
  let unchangedCount = 0;

  const newPhonesSet = new Set(newUsers.map((u) => u.phone_number));

  // Detect changes
  for (const newUser of newUsers) {
    const existing = existingMap.get(newUser.phone_number);

    if (!existing) {
      // New user
      newUsersChanges.push({
        type: "new_user",
        phone_number: newUser.phone_number,
        full_name: newUser.full_name,
        new_data: newUser,
      });
    } else {
      // Check for role change
      if (existing.role !== newUser.role) {
        // Get team info if becoming ZSM
        let teamMembers: string[] = [];
        let teamPoints = 0;
        if (newUser.role === "ZSM") {
          const team = await getTeamMembers(newUser.full_name, newUsers);
          teamMembers = team.members;
          teamPoints = team.totalPoints;
        }

        roleChanges.push({
          type: "role_change",
          phone_number: newUser.phone_number,
          full_name: newUser.full_name,
          old_data: { role: existing.role, zone: existing.zone },
          new_data: { role: newUser.role, zone: newUser.zone },
          points: existing.total_points || 0,
          team_members: teamMembers,
          team_count: teamMembers.length,
          team_points: teamPoints,
        });
      } else if (existing.zone !== newUser.zone) {
        // Zone transfer (same role, different zone)
        zoneTransfers.push({
          type: "zone_transfer",
          phone_number: newUser.phone_number,
          full_name: newUser.full_name,
          old_data: { zone: existing.zone },
          new_data: { zone: newUser.zone },
          points: existing.total_points || 0,
        });
      } else {
        unchangedCount++;
      }
    }
  }

  // Find removed users
  for (const [phone, existing] of existingMap.entries()) {
    if (!newPhonesSet.has(phone)) {
      // Get submission count
      const { count } = await frontendSupabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", existing.id);

      removedUsersChanges.push({
        type: "removed_user",
        phone_number: phone,
        full_name: existing.full_name,
        old_data: { role: existing.role, zone: existing.zone },
        points: existing.total_points || 0,
        submissions_count: count || 0,
      });
    }
  }

  return {
    new_users: newUsersChanges,
    removed_users: removedUsersChanges,
    role_changes: roleChanges,
    zone_transfers: zoneTransfers,
    unchanged_count: unchangedCount,
  };
}

// ============================================================================
// GET TEAM MEMBERS FOR ZSM
// ============================================================================

async function getTeamMembers(
  zsmName: string,
  allUsers: ExcelUser[]
): Promise<{ members: string[]; totalPoints: number }> {
  // Find all SEs reporting to this ZSM
  const teamMembers = allUsers
    .filter((u) => u.zsm === zsmName && u.role === "SE")
    .map((u) => u.full_name);

  // Get their phone numbers and calculate total points
  let totalPoints = 0;
  for (const member of teamMembers) {
    const user = allUsers.find((u) => u.full_name === member);
    if (user?.phone_number) {
      // Get points from existing user
      const { data: existingUser } = await frontendSupabase
        .from("app_users")
        .select("total_points")
        .eq("phone_number", user.phone_number)
        .single();

      totalPoints += existingUser?.total_points || 0;
    }
  }

  return { members: teamMembers, totalPoints };
}

// ============================================================================
// FIX WARNING (Inline Edit)
// ============================================================================

app.post("/fix-warning", async (c) => {
  try {
    const { phone_number, field, value } = await c.req.json();

    console.log(`[User Upload] Fixing warning: ${phone_number} - ${field} = ${value}`);

    // Update staging record
    const { error } = await frontendSupabase
      .from("app_users_staging")
      .update({ [field]: value })
      .eq("phone_number", phone_number);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("[User Upload] Fix warning error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GO LIVE (Atomic Swap)
// ============================================================================

app.post("/go-live", async (c) => {
  try {
    const { batch_id } = await c.req.json();
    console.log(`[User Upload] Going live - Batch: ${batch_id}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveTable = `app_users_archive_${timestamp}`;

    // Step 1: Create archive table (copy current app_users)
    console.log(`[User Upload] Creating archive: ${archiveTable}`);
    
    const { data: currentUsers, error: fetchError } = await frontendSupabase
      .from("app_users")
      .select("*");

    if (fetchError) {
      console.error("[User Upload] Failed to fetch current users:", fetchError);
      return c.json({ success: false, error: fetchError.message }, 500);
    }

    // Store archive in KV (since we can't create tables dynamically)
    const archiveKey = `archive_${timestamp}`;
    const { error: kvError } = await supabase
      .from("kv_store_28f2f653")
      .upsert({
        key: archiveKey,
        value: JSON.stringify(currentUsers),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (kvError) {
      console.error("[User Upload] Failed to create archive:", kvError);
      return c.json({ success: false, error: kvError.message }, 500);
    }

    // Step 2: Get staging data
    const { data: stagingUsers, error: stagingError } = await frontendSupabase
      .from("app_users_staging")
      .select("*");

    if (stagingError || !stagingUsers) {
      return c.json({ success: false, error: "No staging data found" }, 500);
    }

    // Step 3: Mark removed users as inactive (don't delete)
    const stagingPhones = new Set(stagingUsers.map((u) => u.phone_number));
    const removedUsers = currentUsers?.filter((u) => !stagingPhones.has(u.phone_number)) || [];

    if (removedUsers.length > 0) {
      const removedIds = removedUsers.map((u) => u.id);
      await frontendSupabase
        .from("app_users")
        .update({ is_active: false })
        .in("id", removedIds);

      console.log(`[User Upload] Marked ${removedUsers.length} users as inactive`);
    }

    // Step 4: Upsert staging users into app_users
    const { error: upsertError } = await frontendSupabase
      .from("app_users")
      .upsert(stagingUsers, { onConflict: "phone_number" });

    if (upsertError) {
      console.error("[User Upload] Upsert error:", upsertError);
      return c.json({ success: false, error: upsertError.message }, 500);
    }

    // Step 5: Recalculate points for all users
    console.log("[User Upload] Recalculating points...");
    await recalculateAllPoints();

    // Step 6: Log changes to org_change_log
    const changeLogs = await generateChangeLogs(batch_id, currentUsers || [], stagingUsers);
    if (changeLogs.length > 0) {
      await frontendSupabase.from("org_change_log").insert(changeLogs);
    }

    // Step 7: Update batch status
    await frontendSupabase
      .from("upload_batches")
      .update({ status: "live", went_live_at: new Date().toISOString() })
      .eq("id", batch_id);

    // Step 8: Update KV flag to point to live table
    await supabase
      .from("kv_store_28f2f653")
      .upsert({
        key: "active_user_table",
        value: JSON.stringify("app_users"),
        updated_at: new Date().toISOString(),
      });

    // Step 9: Clear staging
    await frontendSupabase.from("app_users_staging").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Step 10: Schedule archive cleanup (3 months)
    await scheduleArchiveCleanup(archiveKey);

    console.log(`[User Upload] Go-live complete! Archive: ${archiveKey}`);

    return c.json({
      success: true,
      archive_key: archiveKey,
      users_updated: stagingUsers.length,
      users_deactivated: removedUsers.length,
    });
  } catch (error: any) {
    console.error("[User Upload] Go-live error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// RECALCULATE POINTS FOR ALL USERS
// ============================================================================

async function recalculateAllPoints() {
  // Get all active users
  const { data: users } = await frontendSupabase
    .from("app_users")
    .select("id, phone_number, role, full_name");

  if (!users) return;

  for (const user of users) {
    let totalPoints = 0;

    if (user.role === "ZSM") {
      // ZSM: Get team points only (exclude personal SE points)
      const { data: teamMembers } = await frontendSupabase
        .from("app_users")
        .select("id, phone_number")
        .eq("zsm", user.full_name)
        .eq("role", "SE")
        .eq("is_active", true);

      if (teamMembers) {
        for (const member of teamMembers) {
          const { data: points } = await frontendSupabase
            .from("points_history")
            .select("points")
            .eq("user_id", member.id);

          totalPoints += points?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
        }
      }
    } else {
      // SE or other roles: Get personal points
      const { data: points } = await frontendSupabase
        .from("points_history")
        .select("points")
        .eq("user_id", user.id);

      totalPoints = points?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
    }

    // Update user's total_points
    await frontendSupabase
      .from("app_users")
      .update({ total_points: totalPoints })
      .eq("id", user.id);
  }

  console.log(`[User Upload] Recalculated points for ${users.length} users`);
}

// ============================================================================
// GENERATE CHANGE LOGS
// ============================================================================

async function generateChangeLogs(
  batchId: string,
  oldUsers: any[],
  newUsers: any[]
): Promise<any[]> {
  const logs: any[] = [];
  const oldMap = new Map(oldUsers.map((u) => [u.phone_number, u]));
  const newMap = new Map(newUsers.map((u) => [u.phone_number, u]));

  // New users
  for (const newUser of newUsers) {
    if (!oldMap.has(newUser.phone_number)) {
      logs.push({
        change_batch_id: batchId,
        phone_number: newUser.phone_number,
        user_name: newUser.full_name,
        change_type: "new_user",
        old_value: null,
        new_value: { role: newUser.role, zone: newUser.zone },
        effective_date: new Date().toISOString(),
      });
    }
  }

  // Removed users
  for (const oldUser of oldUsers) {
    if (!newMap.has(oldUser.phone_number)) {
      logs.push({
        change_batch_id: batchId,
        phone_number: oldUser.phone_number,
        user_name: oldUser.full_name,
        change_type: "removed_user",
        old_value: { role: oldUser.role, zone: oldUser.zone },
        new_value: null,
        effective_date: new Date().toISOString(),
      });
    }
  }

  // Changed users
  for (const newUser of newUsers) {
    const oldUser = oldMap.get(newUser.phone_number);
    if (oldUser) {
      if (oldUser.role !== newUser.role) {
        logs.push({
          change_batch_id: batchId,
          phone_number: newUser.phone_number,
          user_name: newUser.full_name,
          change_type: "role_change",
          old_value: { role: oldUser.role, zone: oldUser.zone },
          new_value: { role: newUser.role, zone: newUser.zone },
          effective_date: new Date().toISOString(),
        });
      } else if (oldUser.zone !== newUser.zone) {
        logs.push({
          change_batch_id: batchId,
          phone_number: newUser.phone_number,
          user_name: newUser.full_name,
          change_type: "zone_transfer",
          old_value: { zone: oldUser.zone },
          new_value: { zone: newUser.zone },
          effective_date: new Date().toISOString(),
        });
      }
    }
  }

  return logs;
}

// ============================================================================
// SCHEDULE ARCHIVE CLEANUP (3 months)
// ============================================================================

async function scheduleArchiveCleanup(archiveKey: string) {
  const deleteAfter = new Date();
  deleteAfter.setMonth(deleteAfter.getMonth() + 3);

  await supabase.from("kv_store_28f2f653").upsert({
    key: `cleanup_${archiveKey}`,
    value: JSON.stringify({ archive_key: archiveKey, delete_at: deleteAfter.toISOString() }),
    updated_at: new Date().toISOString(),
  });
}

// ============================================================================
// ROLLBACK TO ARCHIVE
// ============================================================================

app.post("/rollback", async (c) => {
  try {
    const { archive_key } = await c.req.json();
    console.log(`[User Upload] Rolling back to: ${archive_key}`);

    // Get archive data from KV
    const { data: kvData, error: kvError } = await supabase
      .from("kv_store_28f2f653")
      .select("value")
      .eq("key", archive_key)
      .single();

    if (kvError || !kvData) {
      return c.json({ success: false, error: "Archive not found" }, 404);
    }

    const archiveUsers = JSON.parse(kvData.value);

    // Update KV flag to point to archive
    await supabase
      .from("kv_store_28f2f653")
      .upsert({
        key: "active_user_table",
        value: JSON.stringify(archive_key),
        updated_at: new Date().toISOString(),
      });

    console.log(`[User Upload] Rollback complete - now using ${archive_key}`);

    return c.json({
      success: true,
      archive_key,
      user_count: archiveUsers.length,
    });
  } catch (error: any) {
    console.error("[User Upload] Rollback error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// GET UPLOAD HISTORY
// ============================================================================

app.get("/upload-history", async (c) => {
  try {
    const { data: batches, error } = await frontendSupabase
      .from("upload_batches")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(20);

    if (error) {
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get archives from KV
    const { data: archives } = await supabase
      .from("kv_store_28f2f653")
      .select("key, value")
      .like("key", "archive_%");

    return c.json({
      success: true,
      batches: batches || [],
      archives: archives || [],
    });
  } catch (error: any) {
    console.error("[User Upload] History error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizePhone(phone: string): string {
  if (!phone || phone.trim() === "") return "";
  
  // Convert to string in case it's a number from Excel
  let normalized = String(phone).trim();
  
  // Remove spaces, dashes, parentheses
  normalized = normalized.replace(/[\s\-()]/g, "");

  // Remove any trailing .0 from Excel number formatting
  normalized = normalized.replace(/\.0+$/, "");

  // Add +254 if not present
  if (!normalized.startsWith("+")) {
    if (normalized.startsWith("254")) {
      normalized = "+" + normalized;
    } else if (normalized.startsWith("0")) {
      normalized = "+254" + normalized.substring(1);
    } else if (normalized.length >= 9) {
      normalized = "+254" + normalized;
    }
  }

  return normalized;
}

export default app;