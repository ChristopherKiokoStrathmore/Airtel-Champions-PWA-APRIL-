// src/components/promoter-team-lead/promoter-tl-api.ts
// All Supabase interactions for the Promoter Team Lead feature.
// Uses the anon key client — no Supabase Auth required.

import { supabase } from '../../utils/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TLUser {
  id: string;
  full_name: string;
  msisdn: string;
  zone: string;
  se_cluster: string;
  is_active: boolean;
  created_at: string;
}

export interface PromoterMember {
  id: string;
  team_lead_id: string;
  promoter_name: string;
  msisdn: string;
  is_active: boolean;
  added_at: string;
  dropped_at: string | null;
}

export interface DailyReport {
  id: string;
  team_lead_id: string;
  report_date: string;      // 'YYYY-MM-DD'
  total_gas: number;
  is_locked: boolean;
  submitted_at: string | null;
}

export interface GasEntry {
  id: string;
  report_id: string;
  team_lead_id: string;
  promoter_msisdn: string;
  promoter_name: string;
  ga_count: number;
  created_at: string;
}

export interface DailyReportWithEntries extends DailyReport {
  entries: GasEntry[];
}

// ── Session helpers ───────────────────────────────────────────────────────────

const SESSION_KEY = 'tai_tl_user';

export function saveTLSession(user: TLUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getTLSession(): TLUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TLUser;
  } catch {
    return null;
  }
}

export function clearTLSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function tlSignup(
  fullName: string,
  msisdn: string,
  zone: string,
  seCluster: string,
  password: string,
): Promise<{ user: TLUser | null; error: string | null }> {
  const { data, error } = await supabase.rpc('tl_signup', {
    p_full_name:  fullName,
    p_msisdn:     msisdn,
    p_zone:       zone,
    p_se_cluster: seCluster,
    p_password:   password,
  });

  if (error) {
    if (error.message.includes('PIN_FORMAT_INVALID')) {
      return { user: null, error: 'PIN must be exactly 4 digits.' };
    }
    if (error.message.includes('MSISDN_EXISTS')) {
      return { user: null, error: 'An account with this phone number already exists.' };
    }
    return { user: null, error: 'Sign up failed. Please try again.' };
  }

  return { user: data as TLUser, error: null };
}

export async function tlLogin(
  msisdn: string,
  password: string,
): Promise<{ user: TLUser | null; error: string | null }> {
  const { data, error } = await supabase.rpc('tl_login', {
    p_msisdn:   msisdn,
    p_password: password,
  });

  if (error) {
    return { user: null, error: 'Login failed. Please try again.' };
  }

  if (!data) {
    return { user: null, error: 'Incorrect phone number or password.' };
  }

  return { user: data as TLUser, error: null };
}

// ── Promoter management ───────────────────────────────────────────────────────

export async function getActivePromoters(teamLeadId: string): Promise<PromoterMember[]> {
  const { data, error } = await supabase
    .from('promoter_members')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('is_active', true)
    .order('added_at', { ascending: true });

  if (error || !data) return [];
  return data as PromoterMember[];
}

export async function addPromoter(
  teamLeadId: string,
  promoterName: string,
  msisdn: string,
): Promise<{ member: PromoterMember | null; error: string | null }> {
  const { data, error } = await supabase
    .from('promoter_members')
    .insert({ team_lead_id: teamLeadId, promoter_name: promoterName, msisdn })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { member: null, error: 'This promoter is already assigned to another Team Lead.' };
    }
    return { member: null, error: 'Could not add promoter. Please try again.' };
  }

  return { member: data as PromoterMember, error: null };
}

export async function dropPromoter(memberId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_members')
    .update({ is_active: false, dropped_at: new Date().toISOString() })
    .eq('id', memberId);

  if (error) return { error: 'Could not drop promoter. Please try again.' };
  return { error: null };
}

// ── Daily reports ─────────────────────────────────────────────────────────────

/** Returns today's date as 'YYYY-MM-DD' in local time. */
export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getOrCreateTodayReport(teamLeadId: string): Promise<DailyReport | null> {
  const today = todayDateString();

  const { data: existing } = await supabase
    .from('promoter_daily_reports')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('report_date', today)
    .maybeSingle();

  if (existing) return existing as DailyReport;

  const { data: created, error } = await supabase
    .from('promoter_daily_reports')
    .insert({ team_lead_id: teamLeadId, report_date: today })
    .select()
    .single();

  if (error || !created) return null;
  return created as DailyReport;
}

export async function getGasEntriesForReport(reportId: string): Promise<GasEntry[]> {
  const { data, error } = await supabase
    .from('promoter_gas_entries')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as GasEntry[];
}

/** Upsert a single promoter's GA count for the open report. */
export async function upsertGasEntry(
  reportId: string,
  teamLeadId: string,
  promoterMsisdn: string,
  promoterName: string,
  gaCount: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_gas_entries')
    .upsert(
      {
        report_id:       reportId,
        team_lead_id:    teamLeadId,
        promoter_msisdn: promoterMsisdn,
        promoter_name:   promoterName,
        ga_count:        gaCount,
      },
      { onConflict: 'report_id,promoter_msisdn' },
    );

  if (error) {
    if (error.message.includes('locked report')) {
      return { error: 'This report has already been submitted and is locked.' };
    }
    return { error: 'Could not save GA count. Please try again.' };
  }
  return { error: null };
}

/** Lock the report and record total_gas + submitted_at. */
export async function submitReport(
  reportId: string,
  totalGas: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('promoter_daily_reports')
    .update({ is_locked: true, total_gas: totalGas, submitted_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('is_locked', false);

  if (error) return { error: 'Could not submit report. Please try again.' };
  return { error: null };
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getReportHistory(
  teamLeadId: string,
  page = 0,
  pageSize = 20,
): Promise<DailyReportWithEntries[]> {
  const { data: reports, error } = await supabase
    .from('promoter_daily_reports')
    .select('*')
    .eq('team_lead_id', teamLeadId)
    .eq('is_locked', true)
    .order('report_date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error || !reports || reports.length === 0) return [];

  const reportIds = (reports as DailyReport[]).map(r => r.id);
  const { data: entries } = await supabase
    .from('promoter_gas_entries')
    .select('*')
    .in('report_id', reportIds)
    .order('promoter_name', { ascending: true });

  const entriesByReport: Record<string, GasEntry[]> = {};
  (entries ?? []).forEach((e: GasEntry) => {
    if (!entriesByReport[e.report_id]) entriesByReport[e.report_id] = [];
    entriesByReport[e.report_id].push(e);
  });

  return (reports as DailyReport[]).map(r => ({
    ...r,
    entries: entriesByReport[r.id] ?? [],
  }));
}

/** Total GAs for the TL in the current calendar month. */
export async function getMonthTotalGas(teamLeadId: string): Promise<number> {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('promoter_daily_reports')
    .select('total_gas')
    .eq('team_lead_id', teamLeadId)
    .gte('report_date', monthStart);

  if (error || !data) return 0;
  return (data as { total_gas: number }[]).reduce((sum, r) => sum + (r.total_gas ?? 0), 0);
}
