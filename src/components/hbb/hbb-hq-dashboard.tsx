// HBB HQ Dashboard — Full-width, laptop-optimized management view
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  List,
  LogOut,
  RefreshCw,
  Wifi,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  TrendingUp,
  MapPin,
  User,
} from 'lucide-react';
import { getServiceRequests, getDashboardStats, getAnalytics } from './hbb-api';
import { NotificationBell } from './hbb-notifications';

const ACCENT = '#E60000';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

type Tab = 'overview' | 'leads' | 'analytics';

export const HBBHQDashboard = React.memo(function HBBHQDashboard({ user, userData, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState({ open: 0, assigned: 0, completed: 0, failed: 0, total: 0, todayInstallations: 0 });
  const [leads, setLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const hqName = userData?.full_name || user?.full_name || 'HQ Manager';
  const hqPhone = userData?.phone_number || user?.phone_number || '';
  const isAdmin = userData?.role === 'hbb_hq_admin' || user?.role === 'hbb_hq_admin';

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getDashboardStats(); // no phone = all agents
      setStats(s);
    } catch (e) {
      console.error('[HBBHQDashboard] Stats error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      const data = await getServiceRequests(filters);
      setLeads(data || []);
    } catch (e) {
      console.error('[HBBHQDashboard] Leads error:', e);
    } finally {
      setLeadsLoading(false);
    }
  }, [statusFilter]);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await getAnalytics('30d');
      setAnalytics(data);
    } catch (e) {
      console.error('[HBBHQDashboard] Analytics error:', e);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (activeTab === 'leads') loadLeads(); }, [activeTab, loadLeads]);
  useEffect(() => { if (activeTab === 'analytics') loadAnalytics(); }, [activeTab, loadAnalytics]);

  const filteredLeads = useMemo(() => leads.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(q) ||
      lead.customer_phone?.toLowerCase().includes(q) ||
      lead.estate_name?.toLowerCase().includes(q) ||
      lead.town?.toLowerCase().includes(q) ||
      lead.job_id?.toLowerCase().includes(q)
    );
  }), [leads, searchQuery]);

  const statCards = [
    { label: 'Open Leads', value: stats.open, color: '#3B82F6', bg: '#EFF6FF', icon: Clock },
    { label: 'Assigned', value: stats.assigned, color: '#F59E0B', bg: '#FFFBEB', icon: Users },
    { label: 'Completed', value: stats.completed, color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
    { label: 'Failed', value: stats.failed, color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
  ];

  const navTabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'leads', label: 'All Leads', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="flex-shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #CC0000 100%)` }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-wide">HBB Command Centre</h1>
              <p className="text-white/70 text-[11px]">{isAdmin ? 'HQ Admin' : 'HQ Manager'} · Home Broadband</p>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right side: notifications + avatar */}
          <div className="flex items-center gap-3">
            <NotificationBell userPhone={hqPhone} role="agent" />
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                  {hqName.charAt(0)}
                </div>
                <span className="text-white text-sm font-medium">{hqName.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm">{hqName}</p>
                      <p className="text-xs text-gray-500">{hqPhone}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: ACCENT }}>
                        {isAdmin ? 'HQ Admin' : 'HQ Manager'}
                      </span>
                    </div>
                    <button
                      onClick={() => { setShowProfileMenu(false); onLogout(); }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600">Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} statCards={statCards} loading={loading} onRefresh={loadStats} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab
            leads={filteredLeads}
            loading={leadsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onRefresh={loadLeads}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} stats={stats} />
        )}
      </main>
    </div>
  );
});

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────
function OverviewTab({ stats, statCards, loading, onRefresh }: {
  stats: any; statCards: any[]; loading: boolean; onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time summary across all agents and regions</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold" style={{ color: card.color }}>
                  {loading ? '—' : card.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Today's Performance</h3>
          <div className="space-y-3">
            <MetricRow label="Installations Today" value={loading ? '—' : String(stats.todayInstallations)} accent />
            <MetricRow label="Total Leads" value={loading ? '—' : String(stats.total)} />
            <MetricRow
              label="Success Rate"
              value={loading || stats.total === 0 ? '—' : `${Math.round((stats.completed / stats.total) * 100)}%`}
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Status Distribution</h3>
          {loading ? (
            <div className="flex items-center justify-center h-24 text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Open', value: stats.open, color: '#3B82F6', total: stats.total },
                { label: 'Assigned', value: stats.assigned, color: '#F59E0B', total: stats.total },
                { label: 'Completed', value: stats.completed, color: '#10B981', total: stats.total },
                { label: 'Failed', value: stats.failed, color: '#EF4444', total: stats.total },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: item.total > 0 ? `${Math.round((item.value / item.total) * 100)}%` : '0%',
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LEADS TAB ───────────────────────────────────────────────────────────────
function LeadsTab({ leads, loading, searchQuery, onSearchChange, statusFilter, onStatusFilterChange, onRefresh }: {
  leads: any[]; loading: boolean; searchQuery: string; onSearchChange: (v: string) => void;
  statusFilter: string; onStatusFilterChange: (v: string) => void; onRefresh: () => void;
}) {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const statusColor: Record<string, string> = {
    open: '#3B82F6',
    assigned: '#F59E0B',
    completed: '#10B981',
    failed: '#EF4444',
    cancelled: '#9CA3AF',
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Leads</h2>
          <p className="text-sm text-gray-500">{leads.length} result{leads.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-200 w-56"
            />
          </div>
          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-200 appearance-none"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <List className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Installer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => (
                  <tr key={lead.job_id || lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{lead.job_id || lead.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.customer_name || '—'}</div>
                      <div className="text-xs text-gray-500">{lead.customer_phone || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs">{lead.estate_name || lead.town || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                        style={{
                          color: statusColor[lead.status] || '#6B7280',
                          backgroundColor: (statusColor[lead.status] || '#6B7280') + '18',
                        }}
                      >
                        {lead.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.installer_name ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs">{lead.installer_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.requested_at ? new Date(lead.requested_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ───────────────────────────────────────────────────────────
function AnalyticsTab({ analytics, stats }: { analytics: any; stats: any }) {
  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 mt-0.5">30-day performance summary</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            Key Metrics
          </h3>
          <div className="space-y-3">
            <MetricRow label="Total Leads" value={String(stats.total)} />
            <MetricRow label="Completed" value={String(stats.completed)} accent />
            <MetricRow label="Success Rate" value={`${successRate}%`} accent />
            <MetricRow label="Today's Installs" value={String(stats.todayInstallations)} />
            <MetricRow label="Currently Open" value={String(stats.open)} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            Lead Outcomes
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Completed', value: stats.completed, color: '#10B981' },
              { label: 'Open', value: stats.open, color: '#3B82F6' },
              { label: 'Assigned', value: stats.assigned, color: '#F59E0B' },
              { label: 'Failed', value: stats.failed, color: '#EF4444' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: stats.total > 0 ? `${Math.round((item.value / stats.total) * 100)}%` : '0%',
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {analytics && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Extended analytics data loaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-bold" style={{ color: accent ? ACCENT : '#111827' }}>{value}</span>
    </div>
  );
}
