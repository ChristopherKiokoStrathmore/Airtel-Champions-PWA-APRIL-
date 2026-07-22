// ODU Retrieval — API layer
// Reads go directly through the Supabase client (RLS grants SELECT to anon).
// ALL writes go through SECURITY DEFINER RPCs (see the migration) so a client
// holding the anon key cannot tamper with collection/payment records.
import { supabase } from '../../utils/supabase/client';
import { normalizeKenyanPhone } from '../hbb/hbb-api';
import type {
  OduBatch, OduCustomer, OduRequest, OduDevice, OduWarehouse,
  OduPaymentBatch, OduRequestStatus, CallOutcome, NotRecoveredReason,
} from './odu-types';

// ─── CONFIG ───────────────────────────────────────────────────────────────
export async function getOduConfig(): Promise<Record<string, any>> {
  const { data, error } = await supabase.from('odu_config').select('key, value');
  if (error) { console.error('[ODU] getConfig', error); return {}; }
  const out: Record<string, any> = {};
  (data || []).forEach((r: any) => { out[r.key] = r.value; });
  return out;
}

export async function isProgramEnabled(): Promise<boolean> {
  const cfg = await getOduConfig();
  return cfg.program_enabled === true || cfg.program_enabled === 'true';
}

export async function setOduConfig(key: string, value: any): Promise<void> {
  const { error } = await supabase.rpc('odu_set_config', { p_key: key, p_value: value });
  if (error) throw new Error(error.message);
}

// ─── UPLOAD (HQ) ────────────────────────────────────────────────────────────
export interface OduUploadRow {
  msisdn: string; customer_name: string; account_number?: string;
  town?: string; estate?: string; lat?: number | null; lng?: number | null;
  expected_units?: number; original_imei?: string;
}

/** Create a staged batch, ingest rows in chunks. Returns the batch id + count. */
export async function createOduBatch(
  filename: string, uploadedBy: string, rows: OduUploadRow[],
): Promise<{ batchId: string; ingested: number }> {
  const { data: batchId, error: bErr } = await supabase.rpc('odu_create_batch', {
    p_filename: filename, p_uploaded_by: uploadedBy,
  });
  if (bErr) throw new Error(bErr.message);

  const normalized = rows.map(r => ({
    ...r,
    msisdn: normalizeKenyanPhone(r.msisdn),
  }));

  let ingested = 0;
  const CHUNK = 500; // keep request bodies small for the 19k list
  for (let i = 0; i < normalized.length; i += CHUNK) {
    const slice = normalized.slice(i, i + CHUNK);
    const { data, error } = await supabase.rpc('odu_ingest_customers', {
      p_batch_id: batchId, p_rows: slice,
    });
    if (error) throw new Error(`Ingest failed at row ${i}: ${error.message}`);
    ingested += (data as number) || 0;
  }
  return { batchId: batchId as string, ingested };
}

export async function goLiveOduBatch(batchId: string): Promise<number> {
  const { data, error } = await supabase.rpc('odu_batch_go_live', { p_batch_id: batchId });
  if (error) throw new Error(error.message);
  return (data as number) || 0;
}

export async function rollbackOduBatch(batchId: string, reason: string): Promise<number> {
  const { data, error } = await supabase.rpc('odu_batch_rollback', {
    p_batch_id: batchId, p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return (data as number) || 0;
}

export async function getOduBatches(): Promise<OduBatch[]> {
  const { data, error } = await supabase
    .from('odu_upload_batches').select('*').order('uploaded_at', { ascending: false });
  if (error) { console.error('[ODU] getBatches', error); return []; }
  return data as OduBatch[];
}

// ─── REQUESTS (with joined customer) ─────────────────────────────────────────
const REQUEST_SELECT =
  '*, customer:odu_inactive_customers!odu_requests_customer_id_fkey(*)';

export async function getOduRequests(filters?: {
  status?: OduRequestStatus | 'all';
  town?: string;
  installer_id?: number;
  limit?: number;
}): Promise<OduRequest[]> {
  let q = supabase.from('odu_requests').select(REQUEST_SELECT).order('updated_at', { ascending: false });
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters?.installer_id) q = q.eq('installer_id', filters.installer_id);
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) { console.error('[ODU] getRequests', error); return []; }
  let rows = (data || []) as any as OduRequest[];
  // Town filter is on the joined customer — apply client-side (PostgREST nested filter is finicky)
  if (filters?.town) {
    const t = filters.town.toLowerCase();
    rows = rows.filter(r => (r.customer?.town || '').toLowerCase().includes(t));
  }
  return rows;
}

export async function getOduRequest(id: string): Promise<OduRequest | null> {
  const { data, error } = await supabase
    .from('odu_requests').select(REQUEST_SELECT).eq('id', id).single();
  if (error) { console.error('[ODU] getRequest', error); return null; }
  return data as any as OduRequest;
}

/** Aggregate counts per status for the HQ funnel. */
export async function getOduFunnel(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('odu_requests').select('status');
  if (error) { console.error('[ODU] funnel', error); return {}; }
  const out: Record<string, number> = {};
  (data || []).forEach((r: any) => { out[r.status] = (out[r.status] || 0) + 1; });
  return out;
}

// ─── CX ──────────────────────────────────────────────────────────────────────
export async function cxLogCall(
  requestId: string, cxPhone: string, outcome: CallOutcome,
  opts?: { declineReason?: NotRecoveredReason; notes?: string; callbackAt?: string },
): Promise<void> {
  const { error } = await supabase.rpc('odu_cx_log_call', {
    p_request: requestId,
    p_cx_phone: normalizeKenyanPhone(cxPhone),
    p_outcome: outcome,
    p_decline_reason: opts?.declineReason ?? null,
    p_notes: opts?.notes ?? null,
    p_callback: opts?.callbackAt ?? null,
  });
  if (error) throw translateRpcError(error.message);
}

export async function cxConfirm(
  requestId: string, cxPhone: string,
  details: { estate?: string; house?: string; date?: string; lat?: number; lng?: number; notes?: string },
): Promise<void> {
  const { error } = await supabase.rpc('odu_cx_confirm', {
    p_request: requestId,
    p_cx_phone: normalizeKenyanPhone(cxPhone),
    p_estate: details.estate ?? null,
    p_house: details.house ?? null,
    p_date: details.date ?? null,
    p_lat: details.lat ?? null,
    p_lng: details.lng ?? null,
    p_notes: details.notes ?? null,
  });
  if (error) throw translateRpcError(error.message);
}

// ─── INSTALLER ────────────────────────────────────────────────────────────────
export async function installerAccept(requestId: string, installerId: number): Promise<void> {
  const { error } = await supabase.rpc('odu_installer_accept', {
    p_request: requestId, p_installer_id: installerId,
  });
  if (error) throw translateRpcError(error.message);
}

export async function installerReject(requestId: string, installerId: number, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('odu_installer_reject', {
    p_request: requestId, p_installer_id: installerId, p_reason: reason ?? null,
  });
  if (error) throw translateRpcError(error.message);
}

export async function captureDevice(
  requestId: string, installerId: number,
  device: { imei: string; mac?: string; method: 'scan' | 'manual'; photoUrl?: string },
): Promise<string> {
  const { data, error } = await supabase.rpc('odu_capture_device', {
    p_request: requestId, p_installer_id: installerId,
    p_imei: device.imei, p_mac: device.mac ?? null,
    p_method: device.method, p_photo_url: device.photoUrl ?? null,
  });
  if (error) throw translateRpcError(error.message);
  return data as string;
}

export async function markCollected(
  requestId: string, installerId: number, consentUrl: string, lat: number, lng: number,
): Promise<void> {
  const { error } = await supabase.rpc('odu_mark_collected', {
    p_request: requestId, p_installer_id: installerId,
    p_consent_url: consentUrl, p_lat: lat, p_lng: lng,
  });
  if (error) throw translateRpcError(error.message);
}

export async function doorRefusal(requestId: string, installerId: number, notes?: string): Promise<void> {
  const { error } = await supabase.rpc('odu_door_refusal', {
    p_request: requestId, p_installer_id: installerId, p_notes: notes ?? null,
  });
  if (error) throw translateRpcError(error.message);
}

export async function getRequestDevices(requestId: string): Promise<OduDevice[]> {
  const { data, error } = await supabase
    .from('odu_devices').select('*').eq('request_id', requestId).order('created_at');
  if (error) { console.error('[ODU] devices', error); return []; }
  return data as OduDevice[];
}

/** Toggle an installer's ODU opt-in flag. */
export async function setInstallerOptIn(installerId: number, optIn: boolean): Promise<void> {
  const { error } = await supabase.from('installers').update({ odu_opt_in: optIn }).eq('id', installerId);
  if (error) throw new Error(error.message);
}

// ─── WAREHOUSE ────────────────────────────────────────────────────────────────
export async function getWarehouses(): Promise<OduWarehouse[]> {
  const { data, error } = await supabase.from('odu_warehouses').select('*').eq('is_active', true);
  if (error) { console.error('[ODU] warehouses', error); return []; }
  return data as OduWarehouse[];
}

/** Devices awaiting warehouse receipt (their request is collected/delivered). */
export async function getIncomingDevices(): Promise<(OduDevice & { request: OduRequest })[]> {
  const { data, error } = await supabase
    .from('odu_devices')
    .select('*, request:odu_requests!odu_devices_request_id_fkey(*, customer:odu_inactive_customers!odu_requests_customer_id_fkey(*))')
    .eq('match_status', 'pending');
  if (error) { console.error('[ODU] incoming', error); return []; }
  return (data || []).filter((d: any) => ['collected', 'delivered'].includes(d.request?.status)) as any;
}

export async function warehouseReceive(
  deviceId: string, whImei: string, whMac: string, method: 'scan' | 'manual',
  warehouseId: string, operator: string,
): Promise<'matched' | 'mismatch' | 'duplicate'> {
  const { data, error } = await supabase.rpc('odu_warehouse_receive', {
    p_device: deviceId, p_wh_imei: whImei, p_wh_mac: whMac,
    p_method: method, p_warehouse: warehouseId, p_operator: operator,
  });
  if (error) throw translateRpcError(error.message);
  return data as any;
}

export async function resolveFlag(deviceId: string, resolution: 'accept' | 'reject', notes?: string): Promise<void> {
  const { error } = await supabase.rpc('odu_resolve_flag', {
    p_device: deviceId, p_resolution: resolution, p_notes: notes ?? null,
  });
  if (error) throw translateRpcError(error.message);
}

// ─── PAYMENT / RECON (HQ) ─────────────────────────────────────────────────────
export async function generatePaymentBatch(monthYear: string, generatedBy: string): Promise<string> {
  const { data, error } = await supabase.rpc('odu_generate_payment_batch', {
    p_month: monthYear, p_generated_by: generatedBy,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function markBatchPaid(batchId: string): Promise<void> {
  const { error } = await supabase.rpc('odu_mark_batch_paid', { p_batch: batchId });
  if (error) throw new Error(error.message);
}

export async function getPaymentBatches(): Promise<OduPaymentBatch[]> {
  const { data, error } = await supabase
    .from('odu_payment_batches').select('*').order('generated_at', { ascending: false });
  if (error) { console.error('[ODU] payBatches', error); return []; }
  return data as OduPaymentBatch[];
}

/** Payable requests grouped by installer, for reconciliation display + export. */
export async function getPayableRequests(): Promise<OduRequest[]> {
  const { data, error } = await supabase
    .from('odu_requests').select(REQUEST_SELECT).in('status', ['payable']).order('installer_name');
  if (error) { console.error('[ODU] payable', error); return []; }
  return data as any as OduRequest[];
}

// ─── STORAGE (consent docs + label photos) ────────────────────────────────────
export async function uploadOduDocument(file: File | Blob, pathPrefix: string): Promise<string> {
  const ext = (file as File).name?.split('.').pop() || 'jpg';
  const path = `${pathPrefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('odu_documents').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('odu_documents').getPublicUrl(path);
  return data.publicUrl;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
/** Map RPC error codes to friendly messages. */
function translateRpcError(msg: string): Error {
  const map: Record<string, string> = {
    ODU_REQUEST_NOT_FOUND: 'This request no longer exists.',
    ODU_NOT_IN_INTAKE: 'This request has moved past the intake stage.',
    ODU_NOT_ALLOCATED: 'This request is no longer awaiting your acceptance.',
    ODU_NOT_YOUR_JOB: 'This request is not assigned to you.',
    ODU_ACCEPT_WINDOW_EXPIRED: 'The 48-hour acceptance window has expired — it will be reassigned.',
    ODU_NOT_ACCEPTED: 'Accept the job before capturing devices.',
    ODU_NOT_REJECTABLE: 'This request can no longer be rejected.',
    ODU_IMEI_INVALID: 'That IMEI is not valid (must be 15 digits, Luhn-checked).',
    ODU_IMEI_ALREADY_COLLECTED: 'This IMEI has already been collected — possible duplicate/reuse.',
    ODU_CONSENT_DOC_REQUIRED: 'Attach the signed consent document first.',
    ODU_UNITS_INCOMPLETE: 'Capture all expected ODUs before marking collected.',
    ODU_DEVICE_NOT_FOUND: 'Device record not found.',
    ODU_DEVICE_ALREADY_RECEIVED: 'This device was already received at the warehouse.',
  };
  for (const code in map) if (msg.includes(code)) return new Error(map[code]);
  return new Error(msg);
}

/** Luhn IMEI check, mirrors the SQL odu_is_valid_imei — used for instant client feedback. */
export function isValidImei(imei: string): boolean {
  const s = (imei || '').replace(/\D/g, '');
  if (s.length !== 15) return false;
  let sum = 0, dbl = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let d = parseInt(s[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Basic MAC sanity: 12 hex chars, optional separators. */
export function isValidMac(mac: string): boolean {
  const s = (mac || '').replace(/[^0-9a-fA-F]/g, '');
  return s.length === 12;
}
