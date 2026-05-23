import { Hono } from "npm:hono@4.7.9";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FRONTEND_SUPABASE_URL = Deno.env.get("FRONTEND_SUPABASE_URL")?.startsWith("https://")
  ? Deno.env.get("FRONTEND_SUPABASE_URL")!
  : "https://xspogpfohjmkykfjadhk.supabase.co";
const FRONTEND_SERVICE_ROLE_KEY = Deno.env.get("FRONTEND_SERVICE_ROLE_KEY") || "";
const FRONTEND_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcG9ncGZvaGpta3lrZmphZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MzcxNjMsImV4cCI6MjA4MTAxMzE2M30.C75SxALoWysJ6tHggNMC1fBvIXjzcQsfAGwAjrugGNg";
const frontendSupabase = createClient(
  FRONTEND_SUPABASE_URL,
  FRONTEND_SERVICE_ROLE_KEY || FRONTEND_ANON_KEY
);

type Role = "se" | "zsm" | "zbm";

interface SalesForceHierarchyRecord {
  full_name: string;
  phone_number: string;
  role: Role;
  territory?: string;
  zone?: string;
  zsm?: string;
  zbm?: string;
  raw_phone_number?: string;
}

interface StageUser {
  id?: string;
  full_name: string;
  phone_number: string;
  employee_id?: string | null;
  email?: string | null;
  role: Role;
  region?: string | null;
  zone?: string | null;
  zsm?: string | null;
  zbm?: string | null;
  job_title?: string | null;
  territory?: string | null;
  raw_phone_number?: string | null;
  is_active: boolean;
  pin: string;
}

function normalizeRole(role: unknown): Role {
  const value = String(role || "").trim().toLowerCase();
  if (value === "zsm" || value === "zbm") return value;
  return "se";
}

function normalizePhone(phone: unknown): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

function buildStagingUsers(records: SalesForceHierarchyRecord[], existingMap: Map<string, any>): StageUser[] {
  return records.map((record) => {
    const role = normalizeRole(record.role);

    return {
      full_name: record.full_name,
      phone_number: record.phone_number,
      role,
      zone: record.zone || null,
      zsm: role === "se" ? (record.zsm || null) : null,
      zbm: role === "se" ? (record.zbm || null) : role === "zsm" ? (record.zbm || null) : null,
      is_active: true,
    };
  });
}

function buildPreviewUsers(records: SalesForceHierarchyRecord[]) {
  return records.map((record) => ({
    full_name: record.full_name,
    phone_number: record.phone_number,
    role: normalizeRole(record.role),
    territory: record.territory,
    region: record.zone,
    zone: record.zone,
    zsm: record.role === "se" ? record.zsm : undefined,
    zbm: record.role === "se" ? record.zbm : undefined,
    raw_phone_number: record.raw_phone_number,
  }));
}

async function recalculateAllPoints() {
  try {
    // Get all users with a single query to minimize database round trips
    const { data: users, error } = await frontendSupabase
      .from("app_users")
      .select("id, phone_number, role, full_name")
      .eq("is_active", true);

    if (error || !users || users.length === 0) return;

    // Fetch all points at once instead of per-user
    const { data: allPoints } = await frontendSupabase
      .from("points_history")
      .select("user_id, points");

    const pointsByUser = new Map<string, number>();
    (allPoints || []).forEach((p: any) => {
      const current = pointsByUser.get(p.user_id) || 0;
      pointsByUser.set(p.user_id, current + (p.points || 0));
    });

    // Batch update all users with calculated points
    const updates = users.map((u: any) => ({
      id: u.id,
      total_points: pointsByUser.get(u.id) || 0,
    }));

    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10);
      for (const update of batch) {
        await frontendSupabase
          .from("app_users")
          .update({ total_points: update.total_points })
          .eq("id", update.id);
      }
    }
  } catch (e) {
    console.error("recalculateAllPoints error:", e);
    // Don't fail go-live if points calculation fails
  }
}

app.post("/upload-sales-force-contacts", async (c) => {
  try {
    const body = await c.req.json();
    const filename = String(body?.filename || "sales-force-contacts");
    const records = Array.isArray(body?.records) ? (body.records as SalesForceHierarchyRecord[]) : [];

    if (records.length === 0) {
      return c.json({ success: false, error: "No parsed records supplied" }, 400);
    }

    const normalizedRecords = records
      .map((record) => ({
        ...record,
        full_name: String(record.full_name || "").trim(),
        phone_number: normalizePhone(record.phone_number),
        role: normalizeRole(record.role),
        territory: String(record.territory || "").trim() || undefined,
        zone: String(record.zone || "").trim() || undefined,
        zsm: String(record.zsm || "").trim() || undefined,
        zbm: String(record.zbm || "").trim() || undefined,
        raw_phone_number: String(record.raw_phone_number || "").trim() || undefined,
      }))
      .filter((record) => record.full_name && record.phone_number);

    const warnings: Array<{ row: number; field: string; issue: string; severity: string; data?: unknown }> = [];
    const validRecords: SalesForceHierarchyRecord[] = [];
    const seen = new Set<string>();

    normalizedRecords.forEach((record, index) => {
      const rowNum = index + 2;
      if (record.full_name.toUpperCase().includes("VACANT")) {
        warnings.push({
          row: rowNum,
          field: "full_name",
          issue: `Skipping vacant ${record.role.toUpperCase()}: ${record.full_name}`,
          severity: "warning",
          data: record,
        });
        return;
      }

      const key = `${record.role}:${record.phone_number}`;
      if (seen.has(key)) {
        warnings.push({
          row: rowNum,
          field: "phone_number",
          issue: `Duplicate ${record.role.toUpperCase()} phone number: ${record.phone_number}`,
          severity: "error",
          data: record,
        });
        return;
      }

      seen.add(key);
      validRecords.push(record);
    });

    if (validRecords.length === 0) {
      return c.json({ success: false, error: "No valid records found after validation", warnings }, 400);
    }

    await frontendSupabase.from("app_users_staging").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { data: existingUsers } = await frontendSupabase
      .from("app_users")
      .select("id, phone_number, full_name, role, zone, zsm, zbm, employee_id, email, job_title");

    const existingMap = new Map<string, any>((existingUsers || []).map((user: any) => [user.phone_number, user]));
    const stagingUsers = buildStagingUsers(validRecords, existingMap);
    const previewUsers = buildPreviewUsers(validRecords);

    const { error: insertError } = await frontendSupabase.from("app_users_staging").insert(stagingUsers);
    if (insertError) {
      return c.json({ success: false, error: insertError.message }, 500);
    }

    const batchId = crypto.randomUUID();
    await frontendSupabase.from("upload_batches").insert({
      id: batchId,
      filename,
      status: "staged",
      total_users: stagingUsers.length,
      warnings_count: warnings.length,
      uploaded_at: new Date().toISOString(),
    });

    return c.json({
      success: true,
      batch_id: batchId,
      total_users: stagingUsers.length,
      warnings,
      changes: {
        new_users: previewUsers,
        removed_users: [],
        role_changes: [],
        zone_transfers: [],
        unchanged_count: 0,
      },
      debug: {
        filename,
        source_rows: normalizedRecords.length,
        valid_records: validRecords.length,
        roles: {
          se: validRecords.filter((record) => record.role === "se").length,
          zsm: validRecords.filter((record) => record.role === "zsm").length,
          zbm: validRecords.filter((record) => record.role === "zbm").length,
        },
      },
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

app.post("/fix-warning", async (c) => {
  try {
    const { phone_number, field, value } = await c.req.json();
    const { error } = await frontendSupabase
      .from("app_users_staging")
      .update({ [field]: value })
      .eq("phone_number", phone_number);

    if (error) return c.json({ success: false, error: error.message }, 500);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

app.post("/go-live", async (c) => {
  try {
    const { batch_id } = await c.req.json();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveKey = `archive_${timestamp}`;

    const { data: currentUsers, error: fetchError } = await frontendSupabase.from("app_users").select("*");
    if (fetchError) return c.json({ success: false, error: fetchError.message }, 500);

    const { error: kvError } = await supabase.from("kv_store_28f2f653").upsert({
      key: archiveKey,
      value: JSON.stringify(currentUsers || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (kvError) return c.json({ success: false, error: kvError.message }, 500);

    const { data: stagingUsers, error: stagingError } = await frontendSupabase.from("app_users_staging").select("*");
    if (stagingError || !stagingUsers) return c.json({ success: false, error: "No staging data found" }, 500);

    const stagingUsersList = stagingUsers as Array<{ phone_number: string; id: string }>;
    const currentUsersList = (currentUsers || []) as Array<{ phone_number: string; id: string }>;
    const stagingPhones = new Set<string>(stagingUsersList.map((u) => u.phone_number));
    const removedUsers = currentUsersList.filter((u) => !stagingPhones.has(u.phone_number));

    if (removedUsers.length > 0) {
      await frontendSupabase.from("app_users").update({ is_active: false }).in("id", removedUsers.map((u) => u.id));
    }

    const stagingPhonesForUpsert = new Set(stagingUsersList.map((u) => u.phone_number));
    const stagingPhonesList = Array.from(stagingPhonesForUpsert);

    const { error: deleteError } = await frontendSupabase.from("app_users").delete().in("phone_number", stagingPhonesList);
    if (deleteError) return c.json({ success: false, error: `Delete failed: ${deleteError.message}` }, 500);

    const { error: insertError } = await frontendSupabase.from("app_users").insert(stagingUsers);
    if (insertError) return c.json({ success: false, error: `Insert failed: ${insertError.message}` }, 500);

    await recalculateAllPoints();

    await frontendSupabase.from("upload_batches").update({ status: "live", went_live_at: new Date().toISOString() }).eq("id", batch_id);

    await supabase.from("kv_store_28f2f653").upsert({
      key: "active_user_table",
      value: JSON.stringify("app_users"),
      updated_at: new Date().toISOString(),
    });

    await frontendSupabase.from("app_users_staging").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    return c.json({
      success: true,
      archive_key: archiveKey,
      users_updated: stagingUsers.length,
      users_deactivated: removedUsers.length,
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

app.get("/upload-history", async (c) => {
  const { data, error } = await frontendSupabase
    .from("upload_batches")
    .select("*")
    .order("uploaded_at", { ascending: false })
    .limit(50);

  if (error) return c.json({ success: false, error: error.message }, 500);
  return c.json({ success: true, batches: data || [] });
});

// ============================================================================
// SITEWISE MAPPING UPDATE — patch zsm/zbm/zone without full user replace
// ============================================================================

function getCol(row: any, ...candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && String(row[c]).trim()) return String(row[c]).trim();
  }
  const rowKeys = Object.keys(row);
  for (const c of candidates) {
    const needle = c.toLowerCase().replace(/[_\s/]/g, "");
    const match = rowKeys.find((k) => {
      const norm = k.toLowerCase().replace(/[_\s/]/g, "");
      return norm === needle || norm.includes(needle) || needle.includes(norm);
    });
    if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim()) {
      return String(row[match]).trim();
    }
  }
  return "";
}

function detectContactSheet(workbook: any): { rows: any[]; sheetName: string } {
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];
    if (rows.length === 0) continue;
    const cols = Object.keys(rows[0] || {})
      .map((k) => k.toLowerCase().replace(/[_\s/]/g, ""));
    const hasSE = cols.some((c) => c.includes("msisdn") || (c.includes("se") && c.includes("phone")));
    const hasMgmt = cols.some((c) => c.includes("zsm") || c.includes("zbm"));
    if (hasSE && hasMgmt) return { rows, sheetName };
  }
  // fallback: first sheet
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
  return { rows, sheetName };
}

app.post("/upload-sitewise-mapping", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File;
    if (!file) return c.json({ success: false, error: "No file uploaded" }, 400);
    if (file.size > 20 * 1024 * 1024) return c.json({ success: false, error: "File too large (max 20 MB)" }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const magic = new Uint8Array(arrayBuffer.slice(0, 4));
    const isPKZip = magic[0] === 0x50 && magic[1] === 0x4b;  // xlsx
    const isCFB = magic[0] === 0xd0 && magic[1] === 0xcf && magic[2] === 0x11 && magic[3] === 0xe0; // xlsb/xls
    if (!isPKZip && !isCFB) {
      return c.json({ success: false, error: "File must be .xlsx or .xlsb format" }, 400);
    }

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const { rows: contactRows, sheetName } = detectContactSheet(workbook);

    if (contactRows.length === 0) {
      return c.json({ success: false, error: `Sheet "${sheetName}" has no rows` }, 400);
    }

    const sampleCols = Object.keys(contactRows[0] || {});

    interface MappingRow {
      se_phone: string;
      se_name: string;
      zsm_name: string;
      zbm_name: string;
      zone: string;
    }

    const mappingRows: MappingRow[] = [];
    const seen = new Set<string>();

    for (const row of contactRows) {
      const sePhone = normalizePhone(
        getCol(row, "SE MSISDNS", "SE MSISDN", "SE Phone", "SE MSISDN(S)", "MSISDN", "Phone")
      );
      const seName = getCol(row, "SE NAME", "TSESE NAME", "TSE/SE NAME", "SE Name", "Name");
      const zsmName = getCol(row, "ZSM NAME", "ZSM");
      const zbmName = getCol(row, "ZBM NAME", "ZBM");
      const zone = getCol(row, "ZONE", "Zone", "REGION");

      if (!sePhone || !seName) continue;
      if (seName.toUpperCase().includes("VACANT")) continue;
      if (seen.has(sePhone)) continue;
      seen.add(sePhone);

      mappingRows.push({ se_phone: sePhone, se_name: seName, zsm_name: zsmName, zbm_name: zbmName, zone });
    }

    if (mappingRows.length === 0) {
      return c.json({
        success: false,
        error: `No SE records found in sheet "${sheetName}". Detected columns: ${sampleCols.join(", ")}`,
      }, 400);
    }

    // Compare with existing app_users
    const { data: existingUsers } = await frontendSupabase
      .from("app_users")
      .select("id, phone_number, full_name, role, zsm, zbm, zone")
      .in("phone_number", mappingRows.map((r) => r.se_phone));

    const existingMap = new Map<string, any>(
      (existingUsers || []).map((u: any) => [u.phone_number, u])
    );

    const updates: any[] = [];
    const noMatch: any[] = [];

    for (const record of mappingRows) {
      const existing = existingMap.get(record.se_phone);
      if (!existing) {
        noMatch.push({ phone: record.se_phone, name: record.se_name });
        continue;
      }
      const changed =
        existing.zsm !== (record.zsm_name || null) ||
        existing.zbm !== (record.zbm_name || null) ||
        (record.zone && existing.zone !== record.zone);

      updates.push({
        user_id: existing.id,
        phone_number: record.se_phone,
        full_name: existing.full_name,
        role: existing.role,
        old_zsm: existing.zsm,
        new_zsm: record.zsm_name || null,
        old_zbm: existing.zbm,
        new_zbm: record.zbm_name || null,
        old_zone: existing.zone,
        new_zone: record.zone || existing.zone,
        changed,
      });
    }

    const batchId = crypto.randomUUID();
    await supabase.from("kv_store_28f2f653").upsert({
      key: `mapping_batch_${batchId}`,
      value: JSON.stringify({ updates, filename: file.name, created_at: new Date().toISOString() }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return c.json({
      success: true,
      batch_id: batchId,
      sheet_used: sheetName,
      total_se_in_file: mappingRows.length,
      updates,
      no_match: noMatch,
      changes_count: updates.filter((u) => u.changed).length,
      unchanged_count: updates.filter((u) => !u.changed).length,
      debug: { sheets: workbook.SheetNames, columns: sampleCols, sample: contactRows[0] || null },
    });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

app.post("/apply-sitewise-mapping", async (c) => {
  try {
    const { batch_id } = await c.req.json();

    const { data: kvData, error: kvError } = await supabase
      .from("kv_store_28f2f653")
      .select("value")
      .eq("key", `mapping_batch_${batch_id}`)
      .single();

    if (kvError || !kvData) {
      return c.json({ success: false, error: "Batch not found — it may have expired" }, 404);
    }

    const { updates } = JSON.parse(kvData.value as string);
    const changedUpdates = (updates as any[]).filter((u) => u.changed);

    let successCount = 0;
    const errors: string[] = [];

    for (const update of changedUpdates) {
      const { error } = await frontendSupabase
        .from("app_users")
        .update({
          zsm: update.new_zsm,
          zbm: update.new_zbm,
          zone: update.new_zone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.user_id);

      if (error) {
        errors.push(`${update.phone_number}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    // Clean up KV staging
    await supabase.from("kv_store_28f2f653").delete().eq("key", `mapping_batch_${batch_id}`);

    return c.json({ success: true, updated: successCount, errors, total_changed: changedUpdates.length });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

export default app;
