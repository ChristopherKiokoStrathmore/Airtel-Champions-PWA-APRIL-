// HBB My Leads — Agent's submitted leads with status tracking
import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Search, Filter, ChevronDown, ChevronRight, MapPin, Phone, Calendar, User, Zap, X, ArrowLeft } from 'lucide-react';
import { getServiceRequests, autoAllocateLead } from './hbb-api';
import { toast } from 'sonner@2.0.3';

const ACCENT = '#E60000';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#3B82F6', bg: '#EFF6FF' },
  assigned: { label: 'Assigned', color: '#F59E0B', bg: '#FFFBEB' },
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
  failed: { label: 'Failed', color: '#EF4444', bg: '#FEF2F2' },
  rescheduled: { label: 'Rescheduled', color: '#8B5CF6', bg: '#F5F3FF' },
  unreachable: { label: 'Unreachable', color: '#6B7280', bg: '#F3F4F6' },
  not_ready: { label: 'Not Ready', color: '#D97706', bg: '#FFF7ED' },
};

interface Props {
  agentPhone: string;
  onRefresh: () => void;
  onBack?: () => void;
}

export function HBBMyLeads({ agentPhone, onRefresh, onBack }: Props) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allocatingId, setAllocatingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const leadsRef = useRef<any[]>([]);

  const PAGE_SIZE = 50;

  const fetchLeads = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const offset = append ? leadsRef.current.length : 0;
      const result = await getServiceRequests({
        agent_phone: agentPhone,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: PAGE_SIZE,
        offset,
      });
      if (append) {
        const merged = [...leadsRef.current, ...result.data];
        leadsRef.current = merged;
        setLeads(merged);
        setHasMore(merged.length < result.count);
      } else {
        leadsRef.current = result.data;
        setLeads(result.data);
        setHasMore(result.data.length < result.count);
      }
      setTotal(result.count);
    } catch (e) {
      console.error('[HBB] Fetch leads error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [agentPhone, statusFilter]);

  useEffect(() => { fetchLeads(); }, [agentPhone, statusFilter]);

  const handleRetryAllocate = async (srId: string) => {
    setAllocatingId(srId);
    try {
      const result = await autoAllocateLead(srId);
      if (result.allocated) {
        toast.success(`Assigned to ${result.installer_name}`);
        fetchLeads();
        onRefresh();
      } else {
        toast.info(result.message || 'No installer available right now');
      }
    } catch (err: any) {
      toast.error(err.message || 'Allocation failed');
    } finally {
      setAllocatingId(null);
    }
  };

  const filtered = leads.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(q) ||
      lead.customer_phone?.includes(q) ||
      lead.sr_number?.toLowerCase().includes(q) ||
      lead.estate_name?.toLowerCase().includes(q)
    );
  });

  const statusCounts = leads.reduce((acc: Record<string, number>, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-1.5 rounded-lg bg-gray-100 active:bg-gray-200 transition-all hover:scale-105"
                title="Back to previous page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
            <h2 className="text-base font-bold text-gray-900">My Leads</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{total} total</span>
            <button onClick={fetchLeads} className="p-1.5 rounded-lg bg-gray-100 active:bg-gray-200">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterPill label="All" count={total} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <FilterPill
              key={key}
              label={cfg.label}
              count={statusCounts[key] || 0}
              active={statusFilter === key}
              color={cfg.color}
              onClick={() => setStatusFilter(key)}
            />
          ))}
        </div>
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading leads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search className="w-8 h-8 mb-3" />
            <p className="text-sm font-medium">No leads found</p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search' : 'Submit your first lead!'}
            </p>
          </div>
        ) : (
          filtered.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              expanded={expandedId === lead.id}
              onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              onRetryAllocate={() => handleRetryAllocate(lead.id)}
              allocating={allocatingId === lead.id}
            />
          ))
        )}
        {hasMore && (
          <button
            onClick={() => fetchLeads(true)}
            disabled={loadingMore}
            className="w-full py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-all"
            style={{ backgroundColor: ACCENT }}
          >
            {loadingMore ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Load More Leads
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── LEAD CARD ──────────────────────────────────────────────────────────────
function LeadCard({ lead, expanded, onToggle, onRetryAllocate, allocating }: {
  lead: any; expanded: boolean; onToggle: () => void;
  onRetryAllocate: () => void; allocating: boolean;
}) {
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.open;
  const townName = lead.town || '—';
  const installerName = lead.installers?.name;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Summary Row */}
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-gray-50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{lead.sr_number ? `SR-${lead.sr_number}` : lead.id?.slice?.(0, 8) || `#${lead.id}`}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">{lead.customer_name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {townName}
            </span>
            {lead.scheduled_date && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(lead.scheduled_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <DetailRow icon={Phone} label="Phone" value={lead.customer_phone} />
          <DetailRow icon={MapPin} label="Town" value={townName} />
          {lead.estate_name && <DetailRow icon={MapPin} label="Estate" value={lead.estate_name} />}
          {lead.package && <DetailRow icon={Zap} label="Package" value={lead.package} />}
          {lead.scheduled_date && (
            <DetailRow icon={Calendar} label="Scheduled Date"
              value={new Date(lead.scheduled_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} />
          )}
          {lead.scheduled_time && <DetailRow icon={Calendar} label="Time Slot" value={lead.scheduled_time} />}
          {installerName && <DetailRow icon={User} label="Installer" value={installerName} />}
          {lead.remarks && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{lead.remarks}</p>
            </div>
          )}
          <div className="text-[10px] text-gray-400">
            Created: {new Date(lead.created_at).toLocaleString('en-KE')}
          </div>

          {/* Retry allocate for open leads */}
          {lead.status === 'open' && (
            <button
              onClick={onRetryAllocate}
              disabled={allocating}
              className="w-full py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-all"
              style={{ backgroundColor: ACCENT }}
            >
              {allocating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Auto-Allocate This Lead
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function FilterPill({ label, count, active, color, onClick }: {
  label: string; count: number; active: boolean; color?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap"
      style={active
        ? { backgroundColor: color || ACCENT, color: '#fff' }
        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
      }
    >
      {label} {count > 0 && <span className="ml-0.5">({count})</span>}
    </button>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}