import { useState, useEffect } from 'react';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import {
  getNetworkIssueAnalytics,
  exportIssuesToCSV,
  formatRelativeTime,
  getIssueDate,
  NetworkIssue,
  NetworkIssueStatus,
} from '../lib/network-issues-api';

const STATUS_CONFIG = {
  open: { label: 'Open', bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-500' },
  acknowledged: { label: 'Acknowledged', bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  resolved: { label: 'Resolved', bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
};

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

function ZoneBar({ zone, count, max }: { zone: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{zone}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</p>
    </div>
  );
}

function IssueRow({ issue }: { issue: NetworkIssue }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[issue.network_issue_status || 'open'];
  const responses = issue.responses || {};
  const preview = Object.values(responses)[0];

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-3 px-4">
          <p className="text-sm font-medium text-gray-900">{issue.reporter_name}</p>
          <p className="text-xs text-gray-500">{issue.reporter_zone}</p>
        </td>
        <td className="py-3 px-4 hidden sm:table-cell">
          <p className="text-sm text-gray-700 line-clamp-1">{String(preview || '—')}</p>
        </td>
        <td className="py-3 px-4">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        </td>
        <td className="py-3 px-4 text-xs text-gray-500 text-right">
          {formatRelativeTime(getIssueDate(issue))}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={4} className="px-4 py-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {Object.entries(responses).map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs font-medium text-gray-500 capitalize">
                    {k.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-800">{String(v)}</p>
                </div>
              ))}
              {issue.reporter_phone && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Phone</p>
                  <a
                    href={`tel:${issue.reporter_phone}`}
                    className="text-sm text-blue-600 underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {issue.reporter_phone}
                  </a>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function NetworkIssuesHQView() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<{
    total: number;
    open: number;
    acknowledged: number;
    resolved: number;
    byZone: Record<string, number>;
    issues: NetworkIssue[];
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<NetworkIssueStatus | 'all'>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const data = await getNetworkIssueAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error('[NetworkIssuesHQ] Failed to load:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    if (!analytics) return;
    try {
      setExporting(true);
      const toExport =
        statusFilter === 'all'
          ? analytics.issues
          : analytics.issues.filter(i => (i.network_issue_status || 'open') === statusFilter);
      exportIssuesToCSV(toExport);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Unable to load network issues data.</p>
        <button
          onClick={() => loadAnalytics()}
          className="mt-3 text-sm text-red-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const maxZoneCount = Math.max(...Object.values(analytics.byZone), 1);
  const filteredIssues =
    statusFilter === 'all'
      ? analytics.issues
      : analytics.issues.filter(i => (i.network_issue_status || 'open') === statusFilter);

  const resolutionRate =
    analytics.total > 0
      ? Math.round((analytics.resolved / analytics.total) * 100)
      : 0;

  return (
    <div className="pb-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Network Issues</h2>
          <p className="text-xs text-gray-500">{analytics.total} total reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || analytics.total === 0}
            className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <StatCard
          label="Open Issues"
          value={analytics.open}
          sub="Awaiting action"
          color="bg-red-50 border-red-200 text-red-800"
        />
        <StatCard
          label="Acknowledged"
          value={analytics.acknowledged}
          sub="In progress"
          color="bg-yellow-50 border-yellow-200 text-yellow-800"
        />
        <StatCard
          label="Resolved"
          value={analytics.resolved}
          sub="Completed"
          color="bg-green-50 border-green-200 text-green-800"
        />
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4">
          <div className="flex items-end gap-1">
            <p className="text-2xl font-bold">{resolutionRate}%</p>
            <TrendingUp className="w-4 h-4 mb-1 opacity-70" />
          </div>
          <p className="text-sm font-medium mt-0.5">Resolution Rate</p>
          <p className="text-xs opacity-70 mt-0.5">of all issues</p>
        </div>
      </div>

      {/* Issues by Zone */}
      {Object.keys(analytics.byZone).length > 0 && (
        <div className="bg-white mx-4 rounded-xl border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Issues by Zone</h3>
          <div className="space-y-2.5">
            {Object.entries(analytics.byZone)
              .sort(([, a], [, b]) => b - a)
              .map(([zone, count]) => (
                <ZoneBar key={zone} zone={zone} count={count} max={maxZoneCount} />
              ))}
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="bg-white mx-4 rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header with filter */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700">
            All Reports ({filteredIssues.length})
          </h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {filteredIssues.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No issues match this filter</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Reporter</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500 hidden sm:table-cell">Issue</th>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">When</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map(issue => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
