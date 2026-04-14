// DSE Dashboard - Direct Sales Executive Dashboard for HBB Lead Generation
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Capacitor } from '@capacitor/core';
// Loaded dynamically — static import crashes on web when Capacitor runtime is absent
let CapacitorApp: any = null;
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  import('@capacitor/app').then(mod => { CapacitorApp = mod.App; }).catch(() => {});
}
import {
  Plus,
  List,
  User,
  LogOut,
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Search,
  ArrowLeft,
  Home,
  Wifi,
  Package,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { HBBNewLeadForm } from './hbb-new-lead-form';
import { hbb } from './hbb-design-system';
import { LoadingSpinner } from './hbb-loading-states';

interface DSELead {
  job_id: string;
  customer_name: string;
  customer_phone: string;
  estate_name: string;
  town: string;
  status: string;
  status_description: string;
  requested_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  installer_name: string | null;
  package: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
}

interface DSEDashboardProps {
  user: any;
  userData: any;
  onLogout: () => void;
  onBackToMainMenu?: () => void;
}

type TabType = 'home' | 'new-lead' | 'my-leads' | 'profile';

// ─── Lead journey stages ──────────────────────────────────────────────────────
const LEAD_STAGES = [
  { key: 'pending',   label: 'Submitted', icon: Clock },
  { key: 'assigned',  label: 'Assigned',  icon: User },
  { key: 'on_way',    label: 'En Route',  icon: MapPin },
  { key: 'arrived',   label: 'On Site',   icon: Wifi },
  { key: 'completed', label: 'Installed', icon: CheckCircle },
];

const getStageIndex = (status: string) => {
  const map: Record<string, number> = {
    pending: 0, assigned: 1, on_way: 2, arrived: 3, completed: 4,
  };
  return map[status] ?? -1;
};

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  assigned:  { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  on_way:    { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  arrived:   { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  completed: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  cancelled: { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: 'bg-gray-400'   },
};
const getStatusCfg = (s: string) => STATUS_CONFIG[s] ?? STATUS_CONFIG.cancelled;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Lead Detail Modal ────────────────────────────────────────────────────────
function LeadDetailModal({ lead, onClose }: { lead: DSELead; onClose: () => void }) {
  const stageIdx = getStageIndex(lead.status);
  const isCancelled = lead.status === 'cancelled';
  const cfg = getStatusCfg(lead.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white overflow-y-auto"
        style={{
          borderRadius: '24px 24px 0 0',
          maxHeight: '88vh',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-5">
          {/* Customer name + status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{lead.customer_name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{lead.estate_name}, {lead.town}</p>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {lead.status_description}
            </span>
          </div>

          {/* Progress stepper */}
          {!isCancelled && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Installation Progress</p>
              <div className="relative flex items-center justify-between">
                {/* connecting line */}
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-100 mx-8" />
                <div
                  className="absolute left-0 top-4 h-0.5 bg-red-500 mx-8 transition-all duration-500"
                  style={{ width: stageIdx > 0 ? `${(stageIdx / (LEAD_STAGES.length - 1)) * 100}%` : '0%' }}
                />
                {LEAD_STAGES.map((stage, i) => {
                  const StageIcon = stage.icon;
                  const done = i < stageIdx;
                  const active = i === stageIdx;
                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-1.5 z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: done ? '#E60000' : active ? '#fff' : '#f3f4f6',
                          border: active ? '2px solid #E60000' : done ? 'none' : '2px solid #e5e7eb',
                          boxShadow: active ? '0 0 0 4px rgba(230,0,0,0.12)' : 'none',
                        }}
                      >
                        <StageIcon
                          className="w-4 h-4"
                          style={{ color: done ? '#fff' : active ? '#E60000' : '#9ca3af' }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-medium text-center leading-tight"
                        style={{ color: active ? '#E60000' : done ? '#374151' : '#9ca3af', maxWidth: 48 }}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">This lead was cancelled.</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Phone,    label: 'Phone',     value: lead.customer_phone },
              { icon: MapPin,   label: 'Location',  value: `${lead.estate_name}, ${lead.town}` },
              { icon: Package,  label: 'Package',   value: lead.package || 'Not specified' },
              { icon: Calendar, label: 'Submitted', value: fmt(lead.requested_at) },
              ...(lead.scheduled_date ? [{ icon: Calendar, label: 'Scheduled', value: `${lead.scheduled_date}${lead.scheduled_time ? ' · ' + lead.scheduled_time : ''}` }] : []),
              ...(lead.installer_name ? [{ icon: User, label: 'Installer', value: lead.installer_name }] : []),
              ...(lead.completed_at ? [{ icon: CheckCircle, label: 'Completed', value: fmt(lead.completed_at) }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3 h-3 text-gray-400" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                </div>
                <p className="text-sm font-medium text-gray-800 leading-snug">{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #CC0000 0%, #E60000 100%)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DSEDashboard({ user, userData, onLogout, onBackToMainMenu }: DSEDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [leads, setLeads] = useState<DSELead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<DSELead | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, completed: 0 });

  const dseId = user?.id;
  const dseName = user?.full_name || userData?.full_name || 'DSE';
  const dsePhone = user?.phone_number || userData?.phone_number || '';
  const dseRegion = user?.town || userData?.town || '';
  const initials = dseName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Smart back: sub-tab → home, home → main menu
  const handleBackPress = useCallback(() => {
    if (selectedLead) {
      setSelectedLead(null);
    } else if (activeTab !== 'home') {
      setActiveTab('home');
    } else if (onBackToMainMenu) {
      onBackToMainMenu();
    } else {
      onLogout();
    }
  }, [selectedLead, activeTab, onBackToMainMenu, onLogout]);

  // Android back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    CapacitorApp?.addListener('backButton', handleBackPress);
    return () => { CapacitorApp?.removeAllListeners(); };
  }, [handleBackPress]);

  // Browser back button
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      handleBackPress();
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [handleBackPress]);

  // Fetch leads
  const fetchLeads = useCallback(async (silent = false) => {
    if (!dseId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data, error } = await supabase.rpc('get_dse_leads', { dse_id: dseId });
      if (error) throw error;
      const rows: DSELead[] = data || [];
      setLeads(rows);
      setStats({
        total: rows.length,
        pending: rows.filter(l => l.status === 'pending').length,
        assigned: rows.filter(l => ['assigned', 'on_way', 'arrived'].includes(l.status)).length,
        completed: rows.filter(l => l.status === 'completed').length,
      });
    } catch (err) {
      console.error('[DSE] Error fetching leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dseId]);

  useEffect(() => {
    fetchLeads();
    const sub = supabase
      .channel(`dse-leads-${dseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `source_id=eq.${dseId}` }, () => fetchLeads(true))
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [dseId, fetchLeads]);

  const filteredLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      lead.customer_name?.toLowerCase().includes(q) ||
      lead.customer_phone?.includes(q) ||
      lead.estate_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Home Tab ──────────────────────────────────────────────────────────────
  const HomeTab = () => (
    <div className="p-3 sm:p-4 space-y-4 pb-4 max-w-md mx-auto w-full">
      {/* Hero card */}
      <div
        className="p-5 text-white relative overflow-hidden shadow-xl"
        style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #E60000 0%, #CC0000 100%)',
          boxShadow: '0 8px 32px rgba(204,0,0,0.22)',
        }}
      >
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-2 w-20 h-20 rounded-full bg-white/10" />

        <div className="relative z-10">
          <p className="text-white/80 text-base font-medium tracking-tight mb-0.5">{getGreeting()},</p>
          <h1 className="text-3xl font-black leading-tight mb-0.5 drop-shadow-sm">{dseName.split(' ')[0]}</h1>
          <p className="text-white/70 text-xs mb-2">DSE · HBB Lead Portal</p>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Active', value: stats.assigned },
              { label: 'Done', value: stats.completed },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="text-center py-2 px-1"
                style={{ background: 'rgba(255,255,255,0.13)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.18)' }}
              >
                <p className="text-xl font-bold tracking-tight">{value}</p>
                <p className="text-[11px] text-white/80 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          data-testid="new-lead-btn"
          onClick={() => setActiveTab('new-lead')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 shadow-lg rounded-2xl active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50">
            <Plus className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-gray-900">New Lead</p>
            <p className="text-xs text-gray-400">Submit an order</p>
          </div>
        </button>

        <button
          data-testid="my-leads-tab"
          onClick={() => setActiveTab('my-leads')}
          className="flex items-center gap-3 p-4 bg-white border border-gray-100 shadow-lg rounded-2xl active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
            <List className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-gray-900">My Leads</p>
            <p className="text-xs text-gray-400">{stats.total} total</p>
          </div>
        </button>
      </div>

      {/* Recent leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-900">Recent Leads</p>
          {leads.length > 3 && (
            <button
              onClick={() => setActiveTab('my-leads')}
              className="text-xs font-semibold text-red-600 active:opacity-70"
            >
              See all →
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" color="primary" />
          </div>
        ) : leads.length === 0 ? (
          <div
            className="flex flex-col items-center py-10 px-6 text-center bg-white rounded-3xl border border-gray-100"
          >
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No leads yet</p>
            <p className="text-xs text-gray-400 mt-1">Start by submitting your first lead</p>
            <button
              onClick={() => setActiveTab('new-lead')}
              className="mt-4 px-5 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #CC0000, #E60000)' }}
            >
              Add Lead
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.slice(0, 3).map(lead => (
              <LeadCard key={lead.job_id} lead={lead} onClick={() => setSelectedLead(lead)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── My Leads Tab ──────────────────────────────────────────────────────────
  const MyLeadsTab = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 flex-shrink-0">
        <p className="text-lg font-bold text-gray-900">My Leads</p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, estate…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'pending', 'assigned', 'on_way', 'arrived', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: statusFilter === s ? '#E60000' : '#f3f4f6',
                color: statusFilter === s ? '#fff' : '#6b7280',
              }}
            >
              {s === 'all' ? 'All' : s === 'on_way' ? 'En Route' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" color="primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Search className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No leads match your filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeads.map(lead => (
              <LeadCard key={lead.job_id} lead={lead} onClick={() => setSelectedLead(lead)} detailed />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Profile Tab ───────────────────────────────────────────────────────────
  const ProfileTab = () => (
    <div className="p-4 space-y-4 pb-8">
      {/* Avatar card */}
      <div
        className="p-5 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #CC0000, #E60000)', borderRadius: 24 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}
        >
          <span className="text-white text-xl font-bold">{initials}</span>
        </div>
        <div>
          <p className="text-white text-base font-bold">{dseName}</p>
          <p className="text-white/70 text-xs mt-0.5">Direct Sales Executive</p>
          {dseRegion && <p className="text-white/60 text-xs mt-0.5">{dseRegion}</p>}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
        {[
          { label: 'Phone',  value: dsePhone  || 'Not set', icon: Phone },
          { label: 'Region', value: dseRegion || 'Not set', icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Performance</p>
        <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
          {[
            { label: 'Total Leads',  value: stats.total,     color: 'text-gray-900' },
            { label: 'Pending',      value: stats.pending,   color: 'text-amber-600' },
            { label: 'Active',       value: stats.assigned,  color: 'text-blue-600'  },
            { label: 'Completed',    value: stats.completed, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-red-600 bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );

  // ── Bottom nav items ──────────────────────────────────────────────────────
  const NAV_ITEMS: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'home',     icon: Home,  label: 'Home'    },
    { id: 'my-leads', icon: List,  label: 'Leads'   },
    { id: 'new-lead', icon: Plus,  label: 'New'     },
    { id: 'profile',  icon: User,  label: 'Profile' },
  ];

  return (
    <div data-testid="hbb-dashboard" className="flex flex-col flex-1 min-h-0 bg-gray-50 overflow-hidden font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #CC0000 0%, #E60000 100%)',
          boxShadow: '0 2px 16px rgba(204,0,0,0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          {activeTab !== 'home' ? (
            <button
              onClick={() => setActiveTab('home')}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          )}
          <div>
            <p className="text-white text-sm font-bold leading-tight">HBB DSE Portal</p>
            <p className="text-white/60 text-[11px]">{dseName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {refreshing && <RefreshCw className="w-4 h-4 text-white/60 animate-spin" />}
          <button
            onClick={() => fetchLeads(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onLogout}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {activeTab === 'home'     && <HomeTab />}
        {activeTab === 'my-leads' && <MyLeadsTab />}
        {activeTab === 'profile'  && <ProfileTab />}
        {activeTab === 'new-lead' && (
          <div className="flex-1 overflow-y-auto">
            <HBBNewLeadForm
              agentName={dseName}
              agentPhone={user?.phone_number}
              agentRegion={user?.town}
              sourceType="dse"
              sourceId={dseId}
              sourceName={dseName}
              onSuccess={() => { setActiveTab('my-leads'); fetchLeads(); }}
            />
          </div>
        )}
      </main>

      {/* ── Bottom navigation ──────────────────────────────────────────────── */}
      <nav
        className="flex-shrink-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 shadow-lg"
        style={{
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          paddingTop: '4px',
          minHeight: '60px',
        }}
      >
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          const isNew = id === 'new-lead';
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 transition-all active:scale-95 ${active ? 'font-bold' : ''}`}
              style={{ minWidth: 64 }}
            >
              {isNew ? (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-5 shadow-xl border-4 border-white"
                  style={{ background: 'linear-gradient(135deg, #E60000, #CC0000)', boxShadow: '0 6px 24px rgba(230,0,0,0.18)' }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: active ? 'rgba(230,0,0,0.10)' : 'transparent',
                    transform: active ? 'scale(1.10)' : 'scale(1)',
                  }}
                >
                  <Icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: active ? '#E60000' : '#9ca3af' }}
                  />
                </div>
              )}
              <span
                className="text-[11px] font-semibold transition-colors"
                style={{ color: active ? '#E60000' : '#9ca3af', letterSpacing: 0.5 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Lead detail modal ───────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}

// ─── Shared lead card ─────────────────────────────────────────────────────────
function LeadCard({ lead, onClick, detailed = false }: { lead: DSELead; onClick: () => void; detailed?: boolean }) {
  const cfg = getStatusCfg(lead.status);
  const stageIdx = getStageIndex(lead.status);
  const isCancelled = lead.status === 'cancelled';
  const progressPct = isCancelled ? 0 : Math.round((stageIdx / (LEAD_STAGES.length - 1)) * 100);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{lead.customer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.estate_name}, {lead.town}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {lead.status_description}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          </div>
        </div>

        {detailed && (
          <div className="flex items-center gap-3 mt-2.5">
            <Phone className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-400">{lead.customer_phone}</span>
            {lead.package && (
              <>
                <span className="text-gray-200">·</span>
                <Package className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">{lead.package}</span>
              </>
            )}
          </div>
        )}

        {/* Mini progress bar */}
        {!isCancelled && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">Progress</span>
              <span className="text-[10px] font-semibold text-gray-500">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                    : 'linear-gradient(90deg, #CC0000, #E60000)',
                }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {LEAD_STAGES[stageIdx]?.label ?? 'Processing'}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
