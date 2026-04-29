// src/components/hbb/hbb-ga-api.ts
// HBB GA API - Upload, validation, aggregation, and retrieval

import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { normalizePhone, GAReportRecord, getCurrentMonthYear } from './hbb-ga-utilities';

const BASE = `https://${projectId}.supabase.co/functions/v1`;

// ═════════════════════════════════════════════════════════════════════════════
// FALLBACK QUERY HELPER
// Tries new lowercase tables first, falls back to old uppercase tables if RLS issues occur
// ═════════════════════════════════════════════════════════════════════════════

async function tryQueryInstallerMonthly(msisdn: string, monthYear: string) {
  try {
    // Try new lowercase table first
    const { data, error } = await supabase
      .from('hbb_installer_ga_monthly')
      .select('*')
      .eq('installer_msisdn', msisdn)
      .eq('month_year', monthYear)
      .single();
    
    if (!error) return { data, error };
    
    // If error, try old uppercase table (which definitely has the data)
    console.warn(`[GA API] New table query failed (${error?.code}), trying old table...`);
    const { data: oldData, error: oldError } = await supabase
      .from('HBB_INSTALLER_GA_MONTHLY')
      .select('*')
      .eq('installer_msisdn', msisdn)
      .eq('month_year', monthYear)
      .single();
    
    return { data: oldData, error: oldError };
  } catch (err) {
    console.error('[GA API] Query error:', err);
    return { data: null, error: err };
  }
}

async function tryQueryInstallerMonthlyByName(namePrefix: string, monthYear: string) {
  try {
    // Try new lowercase table first
    const { data, error } = await supabase
      .from('hbb_installer_ga_monthly')
      .select('*')
      .ilike('installer_name', `%${namePrefix}%`)
      .eq('month_year', monthYear)
      .limit(1)
      .single();
    
    if (!error) return { data, error };
    
    // Fallback to old table
    console.warn(`[GA API] New table name query failed (${error?.code}), trying old table...`);
    const { data: oldData, error: oldError } = await supabase
      .from('HBB_INSTALLER_GA_MONTHLY')
      .select('*')
      .ilike('installer_name', `%${namePrefix}%`)
      .eq('month_year', monthYear)
      .limit(1)
      .single();
    
    return { data: oldData, error: oldError };
  } catch (err) {
    console.error('[GA API] Name query error:', err);
    return { data: null, error: err };
  }
}

async function tryQueryInstallerHistory(msisdn: string) {
  try {
    // Try new lowercase table first
    const { data, error } = await supabase
      .from('hbb_installer_ga_monthly')
      .select('*')
      .eq('installer_msisdn', msisdn)
      .order('month_year', { ascending: false });

    // Only return new table result if it has data — fall back if empty (data may still be in old table)
    if (!error && data && data.length > 0) return { data, error: null };

    if (error) {
      console.warn(`[GA API] New history query failed (${error?.code}), trying old table...`);
    } else {
      console.log('[GA API] New history table empty, checking old table...');
    }

    const { data: oldData, error: oldError } = await supabase
      .from('HBB_INSTALLER_GA_MONTHLY')
      .select('*')
      .eq('installer_msisdn', msisdn)
      .order('month_year', { ascending: false });

    return { data: oldData, error: oldError };
  } catch (err) {
    console.error('[GA API] History query error:', err);
    return { data: [], error: err };
  }
}

/**
 * Get current-month GA record for an installer.
 * Uses .maybeSingle() (no 406 on empty) and falls back: new table → old table, MSISDN → name.
 */
export async function getInstallerGACurrentMonth(
  msisdn: string,
  monthYear: string,
  namePrefix?: string
): Promise<any | null> {
  const { data: byMsisdn } = await supabase
    .from('hbb_installer_ga_monthly')
    .select('*')
    .eq('installer_msisdn', msisdn)
    .eq('month_year', monthYear)
    .maybeSingle();
  if (byMsisdn) return byMsisdn;

  if (namePrefix) {
    const { data: byName } = await supabase
      .from('hbb_installer_ga_monthly')
      .select('*')
      .ilike('installer_name', `%${namePrefix}%`)
      .eq('month_year', monthYear)
      .limit(1)
      .maybeSingle();
    if (byName) return byName;
  }

  const { data: oldByMsisdn } = await supabase
    .from('HBB_INSTALLER_GA_MONTHLY')
    .select('*')
    .eq('installer_msisdn', msisdn)
    .eq('month_year', monthYear)
    .maybeSingle();
  if (oldByMsisdn) return oldByMsisdn;

  if (namePrefix) {
    const { data: oldByName } = await supabase
      .from('HBB_INSTALLER_GA_MONTHLY')
      .select('*')
      .ilike('installer_name', `%${namePrefix}%`)
      .eq('month_year', monthYear)
      .limit(1)
      .maybeSingle();
    if (oldByName) return oldByName;
  }

  return null;
}

/**
 * Fetch all installers under a supervisor for the given month, ranked by GA count.
 * Queries hbb_installer_ga_monthly filtered by team_lead_msisdn.
 */
export async function getInstallersByTeamLead(
  teamLeadMsisdn: string,
  monthYear: string
): Promise<InstallerLeaderboardEntry[]> {
  const normalized = normalizePhone(teamLeadMsisdn);

  const { data, error } = await supabase
    .from('hbb_installer_ga_monthly')
    .select('installer_msisdn, installer_name, town, ga_count, incentive_earned')
    .eq('team_lead_msisdn', normalized)
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false });

  if (error) throw error;

  return (data || []).map((d, idx) => ({
    msisdn: d.installer_msisdn,
    name: d.installer_name,
    town: d.town || '',
    gaCount: d.ga_count || 0,
    incentiveEarned: d.incentive_earned || 0,
    position: idx + 1,
  }));
}

/**
 * Count completed service_requests per installer for all installers under a supervisor.
 * period='month' filters to the current calendar month; 'all' counts all time.
 */
export async function getInstallerJobsLeaderboard(
  teamLeadMsisdn: string,
  period: 'month' | 'all',
  monthYear: string = getCurrentMonthYear()
): Promise<InstallerJobsEntry[]> {
  const normalized = normalizePhone(teamLeadMsisdn);

  // Step 1: get all installer MSISDNs under this supervisor
  const { data: gaRows, error: gaErr } = await supabase
    .from('hbb_installer_ga_monthly')
    .select('installer_msisdn, installer_name, town')
    .eq('team_lead_msisdn', normalized)
    .eq('month_year', monthYear);

  if (gaErr) throw gaErr;
  if (!gaRows || gaRows.length === 0) return [];

  // Step 2: generate phone variants for each MSISDN and look up installer IDs
  const allVariants: string[] = [];
  gaRows.forEach(inst => {
    const base = inst.installer_msisdn.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
    allVariants.push(base, '0' + base, '254' + base, '+254' + base);
  });

  const { data: installerRows, error: idErr } = await supabase
    .from('installers')
    .select('id, phone')
    .in('phone', [...new Set(allVariants)]);

  if (idErr) throw idErr;

  // Build phone → installer id map (try all variant formats)
  const phoneToId = new Map<string, number>();
  (installerRows || []).forEach(row => {
    const base = row.phone.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
    [base, '0' + base, '254' + base, '+254' + base].forEach(v => {
      if (!phoneToId.has(v)) phoneToId.set(v, row.id);
    });
  });

  const installerIds = [...new Set(Array.from(phoneToId.values()))];

  // Step 3: count completed service_requests per installer_id
  const jobCounts = new Map<number, number>();
  if (installerIds.length > 0) {
    let query = supabase
      .from('service_requests')
      .select('installer_id')
      .eq('status', 'completed')
      .in('installer_id', installerIds);

    if (period === 'month') {
      const [year, month] = monthYear.split('-');
      const nextMonth = Number(month) + 1;
      const nextYear = nextMonth > 12 ? Number(year) + 1 : Number(year);
      const nextMonthStr = (nextMonth > 12 ? 1 : nextMonth).toString().padStart(2, '0');
      const nextYearStr = nextYear.toString();
      query = query
        .gte('completed_at', `${year}-${month}-01`)
        .lt('completed_at', `${nextYearStr}-${nextMonthStr}-01`);
    }

    const { data: jobs, error: jobErr } = await query;
    if (jobErr) console.warn('[GA API] Jobs leaderboard query failed:', jobErr.message);
    if (!jobErr) {
      (jobs || []).forEach(j => {
        const id = j.installer_id as number;
        jobCounts.set(id, (jobCounts.get(id) || 0) + 1);
      });
    }
  }

  // Step 4: merge and rank (keep all installers, even those with 0 jobs)
  return gaRows
    .map(inst => {
      const base = inst.installer_msisdn.replace(/[\s\-\(\)\+]/g, '').replace(/^254/, '').replace(/^0/, '');
      const instId = phoneToId.get(base) ?? phoneToId.get('0' + base) ?? null;
      return {
        msisdn: inst.installer_msisdn,
        name: inst.installer_name,
        town: inst.town || '',
        jobsCompleted: instId ? (jobCounts.get(instId) || 0) : 0,
        position: 0,
      };
    })
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
    .map((e, idx) => ({ ...e, position: idx + 1 }));
}

// Get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || publicAnonKey;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// UPLOAD MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

export interface UploadBatch {
  id: string;
  filename: string;
  reportType: 'dse_ga' | 'installer_ga';
  status: 'staged' | 'live' | 'rolled_back';
  tableSource: string;
  totalRecords: number;
  warningsCount: number;
  validationErrors: any[];
  uploadedAt: string;
  wentLiveAt?: string;
  rolledBackAt?: string;
}

/**
 * Upload GA report (Excel) and get preview
 */
export async function uploadGAReport(
  file: File,
  reportType: 'dse_ga' | 'installer_ga',
  tableSource: string = 'HBB_DSE_APRIL'
): Promise<{
  batchId: string;
  preview: GAReportRecord[];
  warnings: any[];
  totalRecords: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('report_type', reportType);
  formData.append('table_source', tableSource);
  
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-upload`, {
    method: 'POST',
    headers: { 'Authorization': headers['Authorization'] },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Validate GA report with warnings
 */
export async function validateGAReport(
  batchId: string
): Promise<{
  isValid: boolean;
  warnings: any[];
  errorCount: number;
  warningCount: number;
}> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-validate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ batch_id: batchId }),
  });
  
  if (!response.ok) {
    throw new Error(`Validation failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Resolve a warning (mark as resolved)
 */
export async function resolveWarning(
  warningId: string,
  resolutionNotes: string
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-resolve-warning`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ warning_id: warningId, resolution_notes: resolutionNotes }),
  });
  
  if (!response.ok) {
    throw new Error(`Resolution failed: ${response.statusText}`);
  }
}

/**
 * Go live with GA report (apply to database)
 */
export async function goLiveGAReport(batchId: string): Promise<{
  success: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  message: string;
}> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-go-live`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ batch_id: batchId }),
  });
  
  if (!response.ok) {
    throw new Error(`Go-live failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Rollback GA report
 */
export async function rollbackGAReport(
  batchId: string,
  reason: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-rollback`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ batch_id: batchId, reason }),
  });
  
  if (!response.ok) {
    throw new Error(`Rollback failed: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get upload history
 */
export async function getUploadHistory(
  reportType?: 'dse_ga' | 'installer_ga',
  limit: number = 20
): Promise<UploadBatch[]> {
  let query = supabase
    .from('hbb_ga_upload_batches')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  
  if (reportType) {
    query = query.eq('report_type', reportType);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

// ═════════════════════════════════════════════════════════════════════════════
// GA DATA RETRIEVAL
// ═════════════════════════════════════════════════════════════════════════════

export interface PersonGAData {
  msisdn: string;
  name: string;
  town: string;
  gaCount: number;
  currentBandMin: number;
  currentBandMax: number;
  incentiveEarned: number;
  lastUpdated: string;
  position?: number;
}

export interface InstallerDailyHistoryEntry {
  installer_msisdn: string;
  installer_name: string;
  town: string;
  ga_date: string;
  total_ga: number;
  report_batch_id?: string | null;
  month_year?: string | null;
}

export interface InstallerLeaderboardEntry {
  msisdn: string;
  name: string;
  town: string;
  gaCount: number;
  incentiveEarned: number;
  position: number;
}

export interface InstallerJobsEntry {
  msisdn: string;
  name: string;
  town: string;
  jobsCompleted: number;
  position: number;
}

export interface TeamLeadData {
  msisdn: string;
  name: string;
  totalGas: number;
  teamMemberCount: number;
  currentBandName: string;
  incentiveEarned: number;
  teamMembers: PersonGAData[];
}

/**
 * Fetch uploaded records by report_batch_id for previewing in the UI.
 * Returns both DSE and Installer records (arrays) and an error if any.
 */
export async function fetchUploadedData(uploadId: string): Promise<{ dse_records: any[]; installer_records: any[]; error?: any }> {
  if (!uploadId) return { dse_records: [], installer_records: [], error: 'report_batch_id required' };

  try {
    // Fetch from new lowercase tables first
    let dseAttempt = supabase
      .from('hbb_dse_ga_monthly')
      .select('*')
      .eq('report_batch_id', uploadId)
      .order('id', { ascending: true })
      .limit(5000);
    
    let installerAttempt = supabase
      .from('hbb_installer_ga_monthly')
      .select('*')
      .eq('report_batch_id', uploadId)
      .order('id', { ascending: true })
      .limit(5000);

    const [{ data: dse_records, error: dseError }, { data: installer_records, error: installerError }] = await Promise.all([
      dseAttempt,
      installerAttempt,
    ]);

    // If new tables error, try old uppercase tables
    let finalDseRecords = dse_records || [];
    let finalInstallerRecords = installer_records || [];
    let finalError = dseError || installerError;

    if (dseError) {
      console.warn(`[GA API] DSE query failed (${dseError?.code}), trying old table...`);
      const { data: oldDse, error: oldDseErr } = await supabase
        .from('HBB_DSE_GA_MONTHLY')
        .select('*')
        .eq('report_batch_id', uploadId)
        .order('id', { ascending: true })
        .limit(5000);
      finalDseRecords = oldDse || [];
      if (oldDseErr) finalError = oldDseErr;
    }

    if (installerError) {
      console.warn(`[GA API] Installer query failed (${installerError?.code}), trying old table...`);
      const { data: oldInstaller, error: oldInstallerErr } = await supabase
        .from('HBB_INSTALLER_GA_MONTHLY')
        .select('*')
        .eq('report_batch_id', uploadId)
        .order('id', { ascending: true })
        .limit(5000);
      finalInstallerRecords = oldInstaller || [];
      if (oldInstallerErr) finalError = oldInstallerErr;
    }

    return { dse_records: finalDseRecords, installer_records: finalInstallerRecords, error: finalError };
  } catch (err) {
    return { dse_records: [], installer_records: [], error: err };
  }
}

/**
 * Get GA data for DSE
 */
export async function getDSEGAData(
  dseMsisdn: string,
  monthYear: string = getCurrentMonthYear()
): Promise<PersonGAData | null> {
  const { data, error } = await supabase
    .from('hbb_dse_ga_monthly')
    .select('*')
    .eq('dse_msisdn', normalizePhone(dseMsisdn))
    .eq('month_year', monthYear)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data;
}

/**
 * Get GA data for Team Lead (cumulative from all DSEs)
 */
export async function getDSETeamLeadData(
  teamLeadMsisdn: string,
  monthYear: string = getCurrentMonthYear()
): Promise<TeamLeadData | null> {
  const normalized = normalizePhone(teamLeadMsisdn);
  
  // Get all DSEs under this team lead
  const { data, error } = await supabase
    .from('hbb_dse_ga_monthly')
    .select('*')
    .eq('team_lead_msisdn', normalized)
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false });
  
  if (error) throw error;
  
  if (!data || data.length === 0) {
    return null;
  }
  
  // Calculate cumulative
  const totalGas = data.reduce((sum, d) => sum + (d.ga_count || 0), 0);
  const teamMembers: PersonGAData[] = data.map((d, idx) => ({
    msisdn: d.dse_msisdn,
    name: d.dse_name,
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
    position: idx + 1,
  }));
  
  return {
    msisdn: normalized,
    name: '', // Should be fetched from HBB_TEAM_LEAD
    totalGas,
    teamMemberCount: data.length,
    currentBandName: '', // Should be calculated
    incentiveEarned: 0, // Should be calculated
    teamMembers,
  };
}

/**
 * Get top 3 DSEs
 */
export async function getTop3DSEs(
  town?: string,
  monthYear: string = getCurrentMonthYear()
): Promise<PersonGAData[]> {
  let query = supabase
    .from('hbb_dse_ga_monthly')
    .select('*')
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false })
    .limit(3);
  
  if (town) {
    query = query.eq('town', town);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map((d, idx) => ({
    msisdn: d.dse_msisdn,
    name: d.dse_name,
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
    position: idx + 1,
  }));
}

/**
 * Get top 3 Installers
 */
export async function getTop3Installers(
  town?: string,
  monthYear: string = getCurrentMonthYear()
): Promise<PersonGAData[]> {
  let query = supabase
    .from('hbb_installer_ga_monthly')
    .select('*')
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false })
    .limit(3);
  
  if (town) {
    query = query.eq('town', town);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map((d, idx) => ({
    msisdn: d.installer_msisdn,
    name: d.installer_name,
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
    position: idx + 1,
  }));
}

/**
 * Get GA leaderboard
 */
export async function getGALeaderboard(
  reportType: 'dse' | 'installer',
  monthYear: string = getCurrentMonthYear(),
  town?: string,
  limit: number = 100
): Promise<PersonGAData[]> {
  const table = reportType === 'dse' ? 'hbb_dse_ga_monthly' : 'hbb_installer_ga_monthly';
  
  let query = supabase
    .from(table)
    .select('*')
    .eq('month_year', monthYear)
    .order('ga_count', { ascending: false })
    .limit(limit);
  
  if (town) {
    query = query.eq('town', town);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const fieldName = reportType === 'dse' ? 'dse_msisdn' : 'installer_msisdn';
  const nameField = reportType === 'dse' ? 'dse_name' : 'installer_name';
  
  return (data || []).map((d, idx) => ({
    msisdn: d[fieldName],
    name: d[nameField],
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
    position: idx + 1,
  }));
}

/**
 * Get GA history for a person across months
 */
export async function getPersonGAHistory(
  msisdn: string,
  reportType: 'dse' | 'installer'
): Promise<PersonGAData[]> {
  const normalized = normalizePhone(msisdn);
  
  // Use fallback helper for installers, direct query for DSEs
  if (reportType === 'installer') {
    const { data, error } = await tryQueryInstallerHistory(normalized);
    if (error) throw error;
    
    return (data || []).map(d => ({
      msisdn: d.installer_msisdn,
      name: d.installer_name,
      town: d.town,
      gaCount: d.ga_count,
      currentBandMin: d.current_band_min,
      currentBandMax: d.current_band_max,
      incentiveEarned: d.incentive_earned,
      lastUpdated: d.last_updated,
      reportBatchId: d.report_batch_id || null,
      monthYear: d.month_year,
      uploadDate: d.upload_date || d.created_at || null,
    }));
  }
  
  // DSE history (use new table)
  const table = 'hbb_dse_ga_monthly';
  const field = 'dse_msisdn';
  
  let query = supabase.from(table).select('*').eq(field, normalized);
  
  const { data, error } = await query.order('month_year', { ascending: false });
  
  if (error) throw error;
  
  const nameField = 'dse_name';
  
  return (data || []).map(d => ({
    msisdn: d[field],
    name: d[nameField],
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
    reportBatchId: d.report_batch_id || null,
    monthYear: d.month_year,
    uploadDate: d.upload_date || d.created_at || null,
  }));
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN/CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Switch table source (e.g., from HBB_DSE_APRIL to HBB_DSE_MAY)
 */
export async function switchTableSource(newTableName: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-switch-table`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ table_name: newTableName }),
  });
  
  if (!response.ok) {
    throw new Error(`Table switch failed: ${response.statusText}`);
  }
}

/**
 * Get daily GA history for an installer from the calendar-backed history view.
 * The view should return one row per date, including zero-count days.
 */
export async function getInstallerDailyHistory(
  msisdn: string,
  startDate?: string,
  endDate?: string
): Promise<InstallerDailyHistoryEntry[]> {
  const normalized = normalizePhone(msisdn);

  const normalizeRow = (row: any): InstallerDailyHistoryEntry => ({
    installer_msisdn: row.installer_msisdn,
    installer_name: row.installer_name,
    town: row.town,
    ga_date: row.ga_date,
    total_ga: row.total_ga ?? row.ga_count ?? 0,
    report_batch_id: row.report_batch_id || null,
    month_year: row.month_year || null,
  });

  const buildContinuousHistory = (rows: InstallerDailyHistoryEntry[]) => {
    if (rows.length === 0) return rows;

    const byDate = new Map<string, InstallerDailyHistoryEntry>();
    rows.forEach(row => byDate.set(row.ga_date, row));

    const sortedDates = rows.map(row => row.ga_date).sort();
    const first = startDate || sortedDates[0];
    const last = endDate || sortedDates[sortedDates.length - 1];

    const current = new Date(`${first}T00:00:00`);
    const final = new Date(`${last}T00:00:00`);
    const filled: InstallerDailyHistoryEntry[] = [];

    while (current <= final) {
      const day = current.toISOString().slice(0, 10);
      const existing = byDate.get(day);
      if (existing) {
        filled.push(existing);
      } else {
        filled.push({
          installer_msisdn: rows[0].installer_msisdn,
          installer_name: rows[0].installer_name,
          town: rows[0].town,
          ga_date: day,
          total_ga: 0,
          report_batch_id: null,
          month_year: day.slice(0, 7),
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return filled;
  };

  const queryHistory = async (tableName: string) => {
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('installer_msisdn', normalized)
      .order('ga_date', { ascending: true });

    if (startDate) query = query.gte('ga_date', startDate);
    if (endDate) query = query.lte('ga_date', endDate);

    const { data, error } = await query;
    return { data: data || [], error };
  };

  const viewResult = await queryHistory('hbb_ga_daily_history_view');
  if (!viewResult.error) {
    return viewResult.data.map(normalizeRow);
  }

  console.warn(`[GA API] Daily history view unavailable (${viewResult.error?.code || 'unknown'}), falling back to raw daily table...`);

  const dailyResult = await queryHistory('hbb_installer_ga_daily');
  if (dailyResult.error) {
    throw new Error(`Failed to fetch daily GA history: ${dailyResult.error.message || 'Unknown error'}`);
  }

  return buildContinuousHistory(dailyResult.data.map(normalizeRow));
}

/**
 * Get available table sources
 */
export async function getTableSources(): Promise<string[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-table-sources`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch table sources: ${response.statusText}`);
  }
  
  const { tables } = await response.json();
  return tables || [];
}

/**
 * Update incentive bands
 */
export async function updateIncentiveBands(
  roleType: 'dse' | 'dse_tl' | 'installer' | 'installer_tl',
  bands: any[]
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${BASE}/hbb-ga-update-bands`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ role_type: roleType, bands }),
  });
  
  if (!response.ok) {
    throw new Error(`Band update failed: ${response.statusText}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD API FUNCTIONS (Role-based Dashboards)
// ═════════════════════════════════════════════════════════════════════════════

export type UserRole = 'dse' | 'team_lead' | 'manager' | 'admin' | null;

export interface DashboardDSEGAData {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  team_lead_msisdn: string;
  month_year: string;
}

export interface DashboardHistoryEntry {
  month_year: string;
  ga_count: number;
  incentive_earned: number;
  band_name: string;
}

export interface DashboardTopPerformer {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  incentive_earned: number;
  rank: number;
}

export interface DashboardTeamMember {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  incentive_earned: number;
  band_name: string;
  rank: number;
}

export interface DashboardTeamLeadData {
  team_lead_msisdn: string;
  team_lead_name: string;
  total_team_gas: number;
  team_size: number;
  team_incentive_total: number;
  avg_ga_per_dse: number;
  month_year: string;
}

export interface DashboardTeamAnalytics {
  top_performer: DashboardTeamMember | null;
  low_performer: DashboardTeamMember | null;
  avg_ga: number;
  ga_distribution: Array<{ range: string; count: number }>;
}

/**
 * Get user role/access level
 */
export async function getUserRole(msisdn: string): Promise<UserRole> {
  try {
    // Check if user exists in appropriate tables
    const { data: dseData, error: dseError } = await supabase
      .from('hbb_dse_ga_monthly')
      .select('dse_msisdn')
      .eq('dse_msisdn', normalizePhone(msisdn))
      .limit(1);

    if (dseData && dseData.length > 0) {
      return 'dse';
    }

    // Fallback to old table if new table fails
    if (dseError) {
      const { data: oldDseData } = await supabase
        .from('HBB_DSE_GA_MONTHLY')
        .select('dse_msisdn')
        .eq('dse_msisdn', normalizePhone(msisdn))
        .limit(1);
      if (oldDseData && oldDseData.length > 0) {
        return 'dse';
      }
    }

    // Could also check for team_lead role in future with appropriate table
    return null;
  } catch {
    return null;
  }
}

/**
 * Get GA data for a DSE agent (Dashboard version)
 */
export async function getDashboardDSEGAData(
  msisdn: string,
  monthYear: string = getCurrentMonthYear()
): Promise<DashboardDSEGAData> {
  try {
    const normalized = normalizePhone(msisdn);
    
    const { data, error } = await supabase
      .from('hbb_dse_ga_monthly')
      .select('*')
      .eq('dse_msisdn', normalized)
      .eq('month_year', monthYear)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return {
        dse_msisdn: normalized,
        dse_name: `User ${msisdn.slice(-4)}`,
        ga_count: 0,
        current_band_min: 0,
        current_band_max: 4,
        incentive_earned: 0,
        team_lead_msisdn: '',
        month_year: monthYear,
      };
    }

    return {
      dse_msisdn: data.dse_msisdn,
      dse_name: data.dse_name,
      ga_count: data.ga_count || 0,
      current_band_min: data.current_band_min || 0,
      current_band_max: data.current_band_max || 4,
      incentive_earned: data.incentive_earned || 0,
      team_lead_msisdn: data.team_lead_msisdn || '',
      month_year: data.month_year,
    };
  } catch (error) {
    throw new Error(`Failed to fetch DSE GA data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get GA history for a DSE agent
 */
export async function getDashboardPersonGAHistory(
  msisdn: string,
  role: string = 'dse'
): Promise<DashboardHistoryEntry[]> {
  try {
    const normalized = normalizePhone(msisdn);
    
    const { data, error } = await supabase
      .from('hbb_dse_ga_monthly')
      .select('*')
      .eq('dse_msisdn', normalized)
      .order('month_year', { ascending: false })
      .limit(12);

    if (error) throw error;

    return (data || []).map(item => ({
      month_year: item.month_year,
      ga_count: item.ga_count || 0,
      incentive_earned: item.incentive_earned || 0,
      band_name: getBandForGAs(item.ga_count || 0, role),
    }));
  } catch (error) {
    throw new Error(`Failed to fetch GA history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper: Get band name from GA count
 */
function getBandForGAs(gaCount: number, role: string): string {
  if (role === 'dse') {
    if (gaCount >= 20) return 'Band 5';
    if (gaCount >= 15) return 'Band 4';
    if (gaCount >= 10) return 'Band 3';
    if (gaCount >= 5) return 'Band 2';
    return 'Band 1';
  }
  return 'Band 1';
}
