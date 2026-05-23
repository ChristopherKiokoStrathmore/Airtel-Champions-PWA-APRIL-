// src/components/hbb/hbb-installer-supervisor-dashboard.tsx
// Supervisor dashboard: shows a ranked leaderboard of installers under this supervisor.
// Two tabs — GA Count (current month) and Jobs Completed (current month / all time).

import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, RefreshCw, TrendingUp, Briefcase, User, Users } from 'lucide-react';
import {
  getInstallersByTeamLead,
  getInstallerJobsLeaderboard,
  InstallerLeaderboardEntry,
  InstallerJobsEntry,
} from './hbb-ga-api';
import { getCurrentMonthYear, normalizePhone, formatCurrency } from './hbb-ga-utilities';
import { toast } from 'sonner';

const ACCENT = '#E60000';
const ACCENT_DARK = '#CC0000';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

export const HBBInstallerSupervisorDashboard = React.memo(function HBBInstallerSupervisorDashboard({ user, userData, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<'ga' | 'jobs'>('ga');
  const [jobsPeriod, setJobsPeriod] = useState<'month' | 'all'>('month');
  const [gaList, setGaList] = useState<InstallerLeaderboardEntry[]>([]);
  const [jobsList, setJobsList] = useState<InstallerJobsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const supervisorPhone = useMemo(
    () => normalizePhone(userData?.phone_number || user?.phone_number || ''),
    [userData?.phone_number, user?.phone_number]
  );
  const supervisorName  = userData?.full_name || user?.full_name || 'Supervisor';
  const monthYear = useMemo(() => getCurrentMonthYear(), []);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getInstallersByTeamLead(supervisorPhone, monthYear),
      getInstallerJobsLeaderboard(supervisorPhone, jobsPeriod),
    ]).then(([gaData, jobsData]) => {
      if (cancelled) return;
      setGaList(gaData);
      setJobsList(jobsData);
    }).catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // refreshKey bumped by the refresh button to force a re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorPhone, monthYear, jobsPeriod, refreshKey]);

  const totalGAs  = gaList.reduce((s, e) => s + e.gaCount, 0);
  const totalJobs = jobsList.reduce((s, e) => s + e.jobsCompleted, 0);
  const teamSize  = gaList.length;

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)' }}
    >
      {/* Top Bar */}
      <div
        className="flex-shrink-0 px-4 pb-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(155deg, ${ACCENT} 0%, ${ACCENT_DARK} 80%, #A80C23 100%)`,
          paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 14px)',
          boxShadow: '0 10px 24px rgba(168,12,35,0.24)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/18 border border-white/15">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] tracking-wide leading-tight">{supervisorName}</h1>
            <p className="text-white/72 text-[10px]">Installer Supervisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            aria-label="Refresh leaderboard"
            className="p-2 rounded-xl bg-white/20 active:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="p-2 rounded-xl bg-white/20 active:bg-white/30 transition-colors"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex-shrink-0 px-4 pt-4 grid grid-cols-3 gap-2.5">
        <SummaryCard label="Installers" value={teamSize} icon={User} />
        <SummaryCard label="Team GAs" value={totalGAs} icon={TrendingUp} />
        <SummaryCard label={activeTab === 'ga' ? 'Month' : 'Jobs'} value={activeTab === 'ga' ? totalGAs : totalJobs} icon={Briefcase} />
      </div>

      {/* Tab toggle */}
      <div className="flex-shrink-0 px-4 pt-4 flex gap-2">
        <button
          onClick={() => setActiveTab('ga')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'ga' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
          style={activeTab === 'ga' ? { backgroundColor: ACCENT } : undefined}
        >
          GA Count
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'jobs' ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
          style={activeTab === 'jobs' ? { backgroundColor: ACCENT } : undefined}
        >
          Jobs Completed
        </button>
      </div>

      {/* Jobs period toggle (only in jobs tab) */}
      {activeTab === 'jobs' && (
        <div className="flex-shrink-0 px-4 pt-2 flex gap-1.5">
          {(['month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setJobsPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                jobsPeriod === p ? 'text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}
              style={jobsPeriod === p ? { backgroundColor: ACCENT_DARK } : undefined}
            >
              {p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-8 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'ga' ? (
          gaList.length === 0 ? (
            <EmptyState message="No GA data found for this month" />
          ) : (
            gaList.map(entry => (
              <GALeaderboardRow key={entry.msisdn} entry={entry} />
            ))
          )
        ) : (
          jobsList.length === 0 ? (
            <EmptyState message="No installers found under your supervision" />
          ) : (
            jobsList.map(entry => (
              <JobsLeaderboardRow key={entry.msisdn} entry={entry} />
            ))
          )
        )}
      </div>
    </div>
  );
});

// ─── SUMMARY CARD ───────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: ACCENT }} />
      <p className="text-xl font-bold" style={{ color: ACCENT_DARK }}>{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── MEDAL HELPER ────────────────────────────────────────────────────────────
function MedalBadge({ position }: { position: number }) {
  const medals: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: '#FEF3C7', text: '#D97706', label: '🥇' },
    2: { bg: '#F3F4F6', text: '#6B7280', label: '🥈' },
    3: { bg: '#FEF2F2', text: '#B45309', label: '🥉' },
  };
  const m = medals[position];
  if (m) {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: m.bg, color: m.text }}>
        {m.label}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 flex-shrink-0">
      {position}
    </div>
  );
}

// ─── GA LEADERBOARD ROW ──────────────────────────────────────────────────────
function GALeaderboardRow({ entry }: { entry: InstallerLeaderboardEntry }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
      <MedalBadge position={entry.position} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
        <p className="text-[11px] text-gray-500">{entry.town || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold" style={{ color: ACCENT }}>{entry.gaCount}</p>
        <p className="text-[9px] text-gray-400">GAs</p>
        {entry.incentiveEarned > 0 && (
          <p className="text-[10px] font-medium text-green-600">{formatCurrency(entry.incentiveEarned)}</p>
        )}
      </div>
    </div>
  );
}

// ─── JOBS LEADERBOARD ROW ────────────────────────────────────────────────────
function JobsLeaderboardRow({ entry }: { entry: InstallerJobsEntry }) {
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
      <MedalBadge position={entry.position} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
        <p className="text-[11px] text-gray-500">{entry.town || '—'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold" style={{ color: '#10B981' }}>{entry.jobsCompleted}</p>
        <p className="text-[9px] text-gray-400">jobs</p>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
