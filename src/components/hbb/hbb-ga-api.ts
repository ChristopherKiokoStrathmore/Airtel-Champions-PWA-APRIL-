// src/components/hbb/hbb-ga-api.ts
// HBB GA API - Upload, validation, aggregation, and retrieval

import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { normalizePhone, GAReportRecord, getCurrentMonthYear } from './hbb-ga-utilities';

const BASE = `https://${projectId}.supabase.co/functions/v1`;

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
 * Get GA data for DSE
 */
export async function getDSEGAData(
  dseMsisdn: string,
  monthYear: string = getCurrentMonthYear()
): Promise<PersonGAData | null> {
  const { data, error } = await supabase
    .from('HBB_DSE_GA_MONTHLY')
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
    .from('HBB_DSE_GA_MONTHLY')
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
    .from('HBB_DSE_GA_MONTHLY')
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
    .from('HBB_INSTALLER_GA_MONTHLY')
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
  const table = reportType === 'dse' ? 'HBB_DSE_GA_MONTHLY' : 'HBB_INSTALLER_GA_MONTHLY';
  
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
  const table = reportType === 'dse' ? 'HBB_DSE_GA_MONTHLY' : 'HBB_INSTALLER_GA_MONTHLY';
  const field = reportType === 'dse' ? 'dse_msisdn' : 'installer_msisdn';
  
  let query = supabase.from(table).select('*').eq(field, normalized);
  
  const { data, error } = await query.order('month_year', { ascending: false });
  
  if (error) throw error;
  
  const nameField = reportType === 'dse' ? 'dse_name' : 'installer_name';
  
  return (data || []).map(d => ({
    msisdn: d[field],
    name: d[nameField],
    town: d.town,
    gaCount: d.ga_count,
    currentBandMin: d.current_band_min,
    currentBandMax: d.current_band_max,
    incentiveEarned: d.incentive_earned,
    lastUpdated: d.last_updated,
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
    const { data: dseData } = await supabase
      .from('HBB_DSE_GA_MONTHLY')
      .select('dse_msisdn')
      .eq('dse_msisdn', normalizePhone(msisdn))
      .limit(1);

    if (dseData && dseData.length > 0) {
      return 'dse';
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
      .from('HBB_DSE_GA_MONTHLY')
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
      .from('HBB_DSE_GA_MONTHLY')
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
