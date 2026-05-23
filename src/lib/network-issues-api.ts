import { supabase } from '../utils/supabase/client';

export type NetworkIssueStatus = 'open' | 'acknowledged' | 'resolved';

export interface NetworkIssue {
  id: string;
  program_id: string;
  user_id: string;
  responses: Record<string, any>;
  network_issue_status: NetworkIssueStatus;
  // submissions schema uses created_at; submitted_at may exist on some deployments
  submitted_at?: string;
  created_at: string;
  photos: string[];
  gps_location: any;
  status: string;
  // Enriched from joins
  program_title: string;
  reporter_name: string;
  reporter_phone: string;
  reporter_zone: string;
  reporter_employee_id: string;
}

export interface ThreadMessage {
  id: string;
  submission_id: string;
  user_id: string;
  message: string;
  created_at: string;
  author_name: string;
  author_role: string;
}

export async function getNetworkIssuePrograms() {
  const { data, error } = await supabase
    .from('programs')
    .select('id, title, description, icon, color, points_value')
    .eq('program_type', 'network_issues')
    .eq('status', 'active');
  if (error) throw error;
  return data || [];
}

export async function getNetworkIssues(statusFilter?: NetworkIssueStatus): Promise<NetworkIssue[]> {
  const programs = await getNetworkIssuePrograms();
  if (programs.length === 0) return [];

  const programIds = programs.map((p: any) => p.id);

  let query = supabase
    .from('submissions')
    .select('*')
    .in('program_id', programIds)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('network_issue_status', statusFilter);
  }

  const { data: submissions, error } = await query;
  if (error) throw error;
  if (!submissions || submissions.length === 0) return [];

  const userIds = [...new Set(submissions.map((s: any) => s.user_id))];
  const { data: users } = await supabase
    .from('app_users')
    .select('id, full_name, phone_number, zone, employee_id, role')
    .in('id', userIds);

  const userMap = (users || []).reduce((acc: Record<string, any>, u: any) => {
    acc[u.id] = u;
    return acc;
  }, {});

  const programMap = programs.reduce((acc: Record<string, any>, p: any) => {
    acc[p.id] = p;
    return acc;
  }, {});

  return submissions.map((sub: any) => ({
    ...sub,
    program_title: programMap[sub.program_id]?.title || 'Network Issues',
    reporter_name: userMap[sub.user_id]?.full_name || 'Unknown',
    reporter_phone: userMap[sub.user_id]?.phone_number || '',
    reporter_zone: userMap[sub.user_id]?.zone || '',
    reporter_employee_id: userMap[sub.user_id]?.employee_id || '',
  }));
}

export async function getMyNetworkIssues(userId: string): Promise<NetworkIssue[]> {
  const programs = await getNetworkIssuePrograms();
  if (programs.length === 0) return [];

  const programIds = programs.map((p: any) => p.id);

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .in('program_id', programIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const programMap = programs.reduce((acc: Record<string, any>, p: any) => {
    acc[p.id] = p;
    return acc;
  }, {});

  return data.map((sub: any) => ({
    ...sub,
    program_title: programMap[sub.program_id]?.title || 'Network Issues',
    reporter_name: '',
    reporter_phone: '',
    reporter_zone: '',
    reporter_employee_id: '',
  }));
}

export async function updateNetworkIssueStatus(submissionId: string, status: NetworkIssueStatus) {
  const { error } = await supabase
    .from('submissions')
    .update({ network_issue_status: status })
    .eq('id', submissionId);
  if (error) throw error;
}

export async function getSubmissionThread(submissionId: string): Promise<ThreadMessage[]> {
  const { data: messages, error } = await supabase
    .from('submission_threads')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!messages || messages.length === 0) return [];

  const userIds = [...new Set(messages.map((m: any) => m.user_id))];
  const { data: users } = await supabase
    .from('app_users')
    .select('id, full_name, role')
    .in('id', userIds);

  const userMap = (users || []).reduce((acc: Record<string, any>, u: any) => {
    acc[u.id] = u;
    return acc;
  }, {});

  return messages.map((msg: any) => ({
    ...msg,
    author_name: userMap[msg.user_id]?.full_name || 'Unknown',
    author_role: userMap[msg.user_id]?.role || '',
  }));
}

export async function addThreadMessage(submissionId: string, userId: string, message: string) {
  const { data, error } = await supabase
    .from('submission_threads')
    .insert({ submission_id: submissionId, user_id: userId, message })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNetworkIssueAnalytics() {
  const issues = await getNetworkIssues();

  const total = issues.length;
  const open = issues.filter(i => i.network_issue_status === 'open').length;
  const acknowledged = issues.filter(i => i.network_issue_status === 'acknowledged').length;
  const resolved = issues.filter(i => i.network_issue_status === 'resolved').length;

  const byZone: Record<string, number> = {};
  for (const issue of issues) {
    const zone = issue.reporter_zone || 'Unknown';
    byZone[zone] = (byZone[zone] || 0) + 1;
  }

  const byStatus = { open, acknowledged, resolved };

  return { total, open, acknowledged, resolved, byZone, byStatus, issues };
}

export function exportIssuesToCSV(issues: NetworkIssue[]) {
  const headers = [
    'Date Reported', 'Reporter', 'Phone', 'Zone',
    'Employee ID', 'Status', 'Program', 'Issue Details',
  ];

  const rows = issues.map(issue => {
    const responses = issue.responses || {};
    const details = Object.entries(responses)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    return [
      new Date(issue.submitted_at || issue.created_at).toLocaleDateString('en-KE'),
      issue.reporter_name,
      issue.reporter_phone,
      issue.reporter_zone,
      issue.reporter_employee_id,
      issue.network_issue_status || 'open',
      issue.program_title,
      `"${details.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `network-issues-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getIssueDate(issue: NetworkIssue): string {
  return issue.submitted_at || issue.created_at;
}

export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    sales_executive: 'SE',
    zonal_sales_manager: 'ZSM',
    zonal_business_manager: 'ZBM',
    hq_command_center: 'HQ',
    hq_staff: 'HQ',
    director: 'Director',
    network_team: 'Networks',
    developer: 'Dev',
  };
  return labels[role] || role;
}
