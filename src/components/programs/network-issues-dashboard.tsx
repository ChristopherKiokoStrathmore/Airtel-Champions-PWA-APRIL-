import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase/client';
import {
  LogOut,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  ChevronLeft,
  RefreshCw,
  Star,
  MapPin,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../ui/utils';
import {
  SectionLabel,
  DashCard,
  InitialsAvatar,
  makeInitials,
  EmptyState,
  IconButton,
  SkeletonIssueCard,
  PAGE_BG,
} from '../ui/dash-primitives';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

type IssueStatus = 'open' | 'acknowledged' | 'resolved';

interface Issue {
  id: string;
  program_id: string;
  user_id: string;
  responses: Record<string, any>;
  network_issue_status: IssueStatus | null;
  created_at: string;
  updated_at: string;
  gps_location: any;
  program_title: string;
  reporter_name: string;
  reporter_role: string;
  reporter_zone: string;
  reporter_phone: string;
}

interface Thread {
  id: string;
  submission_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
}

const STATUS_DB_MAP: Record<string, IssueStatus> = {
  open: 'open',
  in_progress: 'acknowledged',
  resolved: 'resolved',
};

function getIssueStatus(status: IssueStatus | null): 'open' | 'in_progress' | 'resolved' {
  if (!status || status === 'open') return 'open';
  if (status === 'acknowledged') return 'in_progress';
  return 'resolved';
}

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    icon: AlertCircle,
    bar: 'bg-red-400',
    badge: 'bg-red-50 text-red-700 border-red-100',
    step: 'bg-red-50 text-red-700',
    dimText: 'text-red-600',
    statNum: 'text-red-600',
    statBg: 'bg-red-50',
    actionBorder: 'border-amber-200',
    actionBg: 'bg-amber-50',
    actionText: 'text-amber-700',
    actionHover: 'hover:bg-amber-100',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    bar: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    step: 'bg-amber-50 text-amber-700',
    dimText: 'text-amber-600',
    statNum: 'text-amber-500',
    statBg: 'bg-amber-50',
    actionBorder: 'border-amber-200',
    actionBg: 'bg-amber-50',
    actionText: 'text-amber-700',
    actionHover: 'hover:bg-amber-100',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    step: 'bg-emerald-50 text-emerald-700',
    dimText: 'text-emerald-600',
    statNum: 'text-emerald-600',
    statBg: 'bg-emerald-50',
    actionBorder: 'border-emerald-200',
    actionBg: 'bg-emerald-50',
    actionText: 'text-emerald-700',
    actionHover: 'hover:bg-emerald-100',
  },
} as const;

function StatusBadge({ status }: { status: IssueStatus | null }) {
  const s = getIssueStatus(status);
  const cfg = STATUS_CONFIG[s];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold tracking-wide',
        cfg.badge,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

function getSiteNameFromResponses(responses: Record<string, any>): string | null {
  const v = responses?.site_name;
  if (!v) return null;
  if (typeof v === 'object' && v !== null) return v.display || v.value || JSON.stringify(v);
  return String(v);
}

function getNetworkFeedback(responses: Record<string, any>): string | null {
  for (const key of Object.keys(responses || {})) {
    if (key.toLowerCase().includes('feedback') || key.toLowerCase().includes('network_feedback')) {
      return String(responses[key]);
    }
  }
  return null;
}

function getRating(responses: Record<string, any>): number | null {
  for (const key of Object.keys(responses || {})) {
    if (key.toLowerCase().includes('rating') || key.toLowerCase().includes('network')) {
      const val = responses[key];
      if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) {
        return Number(val);
      }
    }
  }
  return null;
}

// ── Sub-components ────────────────────────────────────────────

function StatusStepper({ status }: { status: IssueStatus | null }) {
  const uiStatus = getIssueStatus(status);
  const stepIndex = uiStatus === 'open' ? 0 : uiStatus === 'in_progress' ? 1 : 2;
  return (
    <div className="flex items-center gap-1.5">
      {(['open', 'in_progress', 'resolved'] as const).map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const isCurrent = i === stepIndex;
        const isPast = i < stepIndex;
        const Icon = cfg.icon;
        return (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-extrabold transition-all',
                isCurrent ? cfg.step : isPast ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-300',
              )}
            >
              <Icon className="h-2.5 w-2.5 shrink-0" />
              <span>{cfg.label}</span>
            </div>
            {i < 2 && (
              <div
                className={cn('h-0.5 w-3 shrink-0 rounded', isPast ? 'bg-slate-300' : 'bg-slate-100')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            className={cn(
              'h-3.5 w-3.5',
              s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200',
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-500">{rating}/5</span>
    </div>
  );
}

// ── Detail panel content (shared between mobile full-screen and desktop sidebar) ──

function DetailContent({
  selected,
  thread,
  threadLoading,
  reply,
  setReply,
  sending,
  updating,
  user,
  onSendReply,
  onUpdateStatus,
  threadEndRef,
}: {
  selected: Issue;
  thread: Thread[];
  threadLoading: boolean;
  reply: string;
  setReply: (v: string) => void;
  sending: boolean;
  updating: boolean;
  user: any;
  onSendReply: () => void;
  onUpdateStatus: (s: 'in_progress' | 'resolved') => void;
  threadEndRef: React.RefObject<HTMLDivElement>;
}) {
  const uiStatus = getIssueStatus(selected.network_issue_status);
  const siteName = getSiteNameFromResponses(selected.responses);
  const feedback = getNetworkFeedback(selected.responses);
  const rating = getRating(selected.responses);
  const otherResponses = Object.entries(selected.responses || {}).filter(
    ([k]) =>
      k !== 'site_name' &&
      !k.toLowerCase().includes('feedback') &&
      !k.toLowerCase().includes('rating') &&
      !k.toLowerCase().includes('network'),
  );

  return (
    <>
      {/* Scrollable content */}
      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-4"
        style={{ background: PAGE_BG }}
      >
        {/* Status stepper */}
        <DashCard className="p-4">
          <SectionLabel className="mb-3">Progress</SectionLabel>
          <StatusStepper status={selected.network_issue_status} />
        </DashCard>

        {/* Reporter */}
        <DashCard className="p-4">
          <SectionLabel className="mb-3">Reported By</SectionLabel>
          <div className="flex items-center gap-3">
            <InitialsAvatar name={selected.reporter_name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-950">{selected.reporter_name}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {selected.reporter_role.replace(/_/g, ' ') || 'Field Agent'}
                {selected.reporter_zone ? ` · ${selected.reporter_zone}` : ''}
              </p>
              {selected.reporter_phone && (
                <p className="text-xs text-slate-400">{selected.reporter_phone}</p>
              )}
            </div>
          </div>
        </DashCard>

        {/* Issue details */}
        {(siteName || feedback || rating !== null || otherResponses.length > 0) && (
          <DashCard className="space-y-3.5 p-4">
            <SectionLabel>Issue Details</SectionLabel>

            {siteName && (
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Site</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{siteName}</p>
                </div>
              </div>
            )}

            {feedback && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-400">Network Feedback</p>
                <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-700">
                  {feedback}
                </p>
              </div>
            )}

            {rating !== null && (
              <div className="flex items-center gap-2.5">
                <p className="text-[11px] font-medium text-slate-400">Signal Rating</p>
                <StarRating rating={rating} />
              </div>
            )}

            {otherResponses.map(([k, v]) => (
              <div key={k}>
                <p className="text-[11px] font-medium capitalize text-slate-400">
                  {k.replace(/_/g, ' ')}
                </p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </p>
              </div>
            ))}
          </DashCard>
        )}

        {/* Response thread */}
        <DashCard className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-950">Responses</p>
            <span className="ml-auto text-[11px] font-semibold text-slate-400">
              {thread.length} {thread.length === 1 ? 'message' : 'messages'}
            </span>
          </div>

          <div className="max-h-72 space-y-3.5 overflow-y-auto p-4">
            {threadLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading thread…</span>
              </div>
            ) : thread.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm font-medium text-slate-400">No responses yet</p>
                <p className="mt-1 text-xs text-slate-300">Be first to respond below.</p>
              </div>
            ) : (
              thread.map(msg => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div key={msg.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black',
                        isMe ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {makeInitials(msg.user_name || '?')}
                    </div>
                    <div className={cn('flex max-w-[76%] flex-col', isMe ? 'items-end' : 'items-start')}>
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                          isMe
                            ? 'rounded-tr-sm bg-slate-950 text-white'
                            : 'rounded-tl-sm bg-slate-100 text-slate-800',
                        )}
                      >
                        {msg.message}
                      </div>
                      <p className="mt-1 px-1 text-[10px] text-slate-400">
                        {isMe ? 'You' : msg.user_name} ·{' '}
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={threadEndRef} />
          </div>
        </DashCard>
      </div>

      {/* Bottom action bar — sits naturally at bottom of flex column, no fixed needed */}
      <div className="shrink-0 space-y-2.5 border-t border-slate-100 bg-white p-3">
        {/* Reply input */}
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a response…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendReply();
              }
            }}
          />
          <button
            onClick={onSendReply}
            disabled={!reply.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* Status actions */}
        {uiStatus !== 'resolved' && (
          <div className="flex gap-2">
            {uiStatus === 'open' && (
              <button
                onClick={() => onUpdateStatus('in_progress')}
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 active:scale-[0.97] disabled:opacity-50"
              >
                {updating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                Mark In Progress
              </button>
            )}
            <button
              onClick={() => onUpdateStatus('resolved')}
              disabled={updating}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.97] disabled:opacity-50"
            >
              {updating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Mark Resolved
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────

export function NetworksTeamDashboard({ user, userData, onLogout }: Props) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selected, setSelected] = useState<Issue | null>(null);
  const [thread, setThread] = useState<Thread[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const userName = userData?.full_name || user?.full_name || 'Networks Team';

  useEffect(() => { loadIssues(); }, []);
  useEffect(() => { if (selected) loadThread(selected.id); }, [selected]);
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, title')
        .eq('program_type', 'network_issues');

      if (!programs || programs.length === 0) { setIssues([]); return; }

      const programIds = programs.map((p: any) => p.id);
      const programMap: Record<string, string> = {};
      programs.forEach((p: any) => { programMap[p.id] = p.title; });

      const { data: subs } = await supabase
        .from('submissions')
        .select('id, program_id, user_id, responses, network_issue_status, created_at, updated_at, gps_location')
        .in('program_id', programIds)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!subs || subs.length === 0) { setIssues([]); return; }

      const userIds = [...new Set(subs.map((s: any) => s.user_id))];
      const { data: users } = await supabase
        .from('app_users')
        .select('id, full_name, role, zone, phone_number')
        .in('id', userIds);

      const userMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { userMap[u.id] = u; });

      setIssues(
        subs.map((s: any) => {
          const reporter = userMap[s.user_id] || {};
          return {
            ...s,
            program_title: programMap[s.program_id] || 'Unknown Program',
            reporter_name: reporter.full_name || 'Unknown',
            reporter_role: reporter.role || '',
            reporter_zone: reporter.zone || '',
            reporter_phone: reporter.phone_number || '',
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadThread = async (submissionId: string) => {
    setThreadLoading(true);
    try {
      const { data } = await supabase
        .from('submission_threads')
        .select('id, submission_id, user_id, message, created_at')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (!data || data.length === 0) { setThread([]); return; }

      const uids = [...new Set(data.map((m: any) => m.user_id))];
      const { data: msgUsers } = await supabase
        .from('app_users')
        .select('id, full_name')
        .in('id', uids);

      const nameMap: Record<string, string> = {};
      (msgUsers || []).forEach((u: any) => { nameMap[u.id] = u.full_name; });

      setThread(data.map((m: any) => ({ ...m, user_name: nameMap[m.user_id] || 'Unknown' })));
    } finally {
      setThreadLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected || !user?.id) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('submission_threads')
        .insert({ submission_id: selected.id, user_id: user.id, message: reply.trim() })
        .select()
        .single();
      if (error) throw error;
      setThread(prev => [...prev, { ...data, user_name: userName }]);
      setReply('');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (newUiStatus: 'in_progress' | 'resolved') => {
    if (!selected) return;
    setUpdating(true);
    const dbStatus = STATUS_DB_MAP[newUiStatus];
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ network_issue_status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', selected.id);
      if (error) throw error;
      const updated = { ...selected, network_issue_status: dbStatus };
      setSelected(updated);
      setIssues(prev => prev.map(i => (i.id === selected.id ? updated : i)));
      if (newUiStatus === 'resolved') await notifyResolved(selected);
    } finally {
      setUpdating(false);
    }
  };

  const notifyResolved = async (issue: Issue) => {
    if (!issue.user_id) return;
    await supabase.from('notifications').insert({
      user_id: issue.user_id,
      type: 'network_issue_resolved',
      title: 'Network Issue Resolved',
      message: `Your report for ${issue.program_title} has been resolved by the Networks Team.`,
      data: { submission_id: issue.id, program_title: issue.program_title },
    });
  };

  const counts = {
    all: issues.length,
    open: issues.filter(i => getIssueStatus(i.network_issue_status) === 'open').length,
    in_progress: issues.filter(i => getIssueStatus(i.network_issue_status) === 'in_progress').length,
    resolved: issues.filter(i => getIssueStatus(i.network_issue_status) === 'resolved').length,
  };

  const filteredIssues = issues.filter(i =>
    filter === 'all' || getIssueStatus(i.network_issue_status) === filter,
  );

  const filterTabs: { key: 'all' | 'open' | 'in_progress' | 'resolved'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  // ── Shared list panel ─────────────────────────────────────

  const listPanel = (
    <div className="flex flex-col" style={{ background: PAGE_BG }}>
      {/* App bar */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
              <Wifi className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black leading-tight text-slate-950">Network Issues</p>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconButton onClick={loadIssues} title="Refresh">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </IconButton>
            <IconButton onClick={onLogout} title="Logout" danger>
              <LogOut className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        {/* Clickable KPI strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
          {(['open', 'in_progress', 'resolved'] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(isActive ? 'all' : s)}
                className={cn(
                  'px-3 py-3 text-center transition-colors',
                  isActive ? cfg.statBg : 'hover:bg-slate-50',
                )}
              >
                <p className={cn('text-[24px] font-black leading-none', cfg.statNum)}>
                  {counts[s]}
                </p>
                <p className="mt-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  {cfg.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95',
                filter === tab.key
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {tab.label}
              <span className="text-[10px] font-extrabold text-slate-400">{counts[tab.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Issue list */}
      <div className="space-y-2.5 px-4 py-4">
        {loading &&
          [0, 1, 2, 3].map(i => <SkeletonIssueCard key={i} />)}

        {!loading && filteredIssues.length === 0 && (
          <EmptyState
            icon={WifiOff}
            title={filter === 'all' ? 'No issues yet' : `No ${filter.replace('_', ' ')} issues`}
            description={
              filter === 'all'
                ? 'Network issue reports will appear here once programs are active.'
                : 'Try a different filter to see other issues.'
            }
            action={
              filter !== 'all' ? { label: 'View all issues', onClick: () => setFilter('all') } : undefined
            }
          />
        )}

        {!loading &&
          filteredIssues.map(issue => {
            const uiStatus = getIssueStatus(issue.network_issue_status);
            const cfg = STATUS_CONFIG[uiStatus];
            const siteName = getSiteNameFromResponses(issue.responses);
            const feedback = getNetworkFeedback(issue.responses);
            const rating = getRating(issue.responses);
            const isSelectedDesktop = selected?.id === issue.id;

            return (
              <button
                key={issue.id}
                onClick={() => setSelected(issue)}
                className={cn(
                  'w-full overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_8px_rgba(15,23,42,0.04)] transition',
                  isSelectedDesktop
                    ? 'ring-2 ring-slate-950 ring-offset-1'
                    : 'hover:shadow-[0_4px_20px_rgba(15,23,42,0.09)] active:scale-[0.99]',
                )}
              >
                <div className="flex items-stretch">
                  <div className={cn('w-1 shrink-0', cfg.bar)} />
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn('mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em]', cfg.dimText)}>
                          {issue.program_title}
                        </p>
                        <p className="truncate text-sm font-bold text-slate-950">
                          {siteName || `Issue #${issue.id.slice(-6).toUpperCase()}`}
                        </p>
                      </div>
                      <StatusBadge status={issue.network_issue_status} />
                    </div>

                    {feedback && (
                      <p className="mb-2.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
                        {feedback}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span className="max-w-[100px] truncate">{issue.reporter_name}</span>
                      {issue.reporter_zone && (
                        <>
                          <span>·</span>
                          <span className="max-w-[80px] truncate">{issue.reporter_zone}</span>
                        </>
                      )}
                      {rating !== null && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {rating}/5
                          </span>
                        </>
                      )}
                      <span className="ml-auto shrink-0">{relativeTime(issue.created_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );

  // ── Desktop placeholder (no issue selected) ───────────────

  const desktopPlaceholder = (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center"
      style={{ background: PAGE_BG }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
        <SlidersHorizontal className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-400">Select an issue</p>
      <p className="mt-1 max-w-[160px] text-xs text-slate-300">
        Choose a report from the list to review and respond.
      </p>
    </div>
  );

  // ── Layout ────────────────────────────────────────────────
  //
  // Mobile:   list or detail (full screen, one at a time)
  // Desktop:  side-by-side master-detail (lg: two columns, full viewport height)

  return (
    <div
      className="lg:flex lg:h-screen lg:overflow-hidden"
      style={{ minHeight: '100dvh', background: PAGE_BG }}
    >
      {/* ── Left: issue list ─── */}
      <div
        className={cn(
          // Mobile: full-width column; hide when detail is open
          'flex flex-col',
          selected ? 'hidden lg:flex' : 'flex',
          // Desktop: fixed-width sidebar, full height, scroll inside
          'lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-slate-200',
        )}
      >
        {listPanel}
      </div>

      {/* ── Right: detail panel ─── */}
      <div
        className={cn(
          // Mobile: full-height flex column; hide when list is showing
          selected ? 'flex' : 'hidden lg:flex',
          'flex-1 flex-col',
          // Desktop: always visible, full height, scroll inside
          'lg:flex lg:overflow-hidden',
        )}
        style={{ minHeight: selected ? '100dvh' : undefined }}
      >
        {selected ? (
          <>
            {/* Detail header */}
            <div className="shrink-0 border-b border-slate-100 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3 px-4 py-3">
                <IconButton
                  onClick={() => setSelected(null)}
                  className="lg:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </IconButton>
                {/* On desktop show a back-like deselect icon too */}
                <IconButton
                  onClick={() => setSelected(null)}
                  className="hidden lg:flex"
                  title="Close"
                >
                  <ChevronLeft className="h-5 w-5" />
                </IconButton>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold leading-tight text-slate-950">
                    {getSiteNameFromResponses(selected.responses) || selected.program_title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {relativeTime(selected.created_at)}
                  </p>
                </div>
                <StatusBadge status={selected.network_issue_status} />
              </div>
            </div>

            {/* Detail content + bottom bar — all in flex column, no fixed positioning */}
            <DetailContent
              selected={selected}
              thread={thread}
              threadLoading={threadLoading}
              reply={reply}
              setReply={setReply}
              sending={sending}
              updating={updating}
              user={user}
              onSendReply={sendReply}
              onUpdateStatus={updateStatus}
              threadEndRef={threadEndRef as React.RefObject<HTMLDivElement>}
            />
          </>
        ) : (
          desktopPlaceholder
        )}
      </div>
    </div>
  );
}
