// HBB Analytics Dashboard — Charts, conversion funnel, and performance metrics
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, TrendingUp, Target, RefreshCw, Calendar, ChevronDown, Filter, Users, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { getAnalytics } from './hbb-api';

const ACCENT = '#E60000';

const STATUS_COLORS: Record<string, string> = {
  open: '#3B82F6',
  assigned: '#F59E0B',
  completed: '#10B981',
  failed: '#EF4444',
  rescheduled: '#8B5CF6',
  unreachable: '#6B7280',
  not_ready: '#D97706',
};

interface Props {
  agentPhone?: string;
  isAdmin?: boolean;
}

export function HBBAnalytics({ agentPhone, isAdmin }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAnalytics(period, agentPhone);
      setData(result);
    } catch (err) {
      console.error('[HBB Analytics] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, agentPhone]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const {
    statusBreakdown = {},
    weeklyTrend = [],
    conversionRate = 0,
    avgTimeToAssign = 0,
    avgTimeToComplete = 0,
    totalLeads = 0,
    todayLeads = 0,
    thisWeekLeads = 0,
    topTowns = [],
    topPackages = [],
  } = data;

  // Build funnel data
  const total = totalLeads || 1;
  const funnelData = [
    { stage: 'Submitted', count: totalLeads, pct: 100, color: '#3B82F6' },
    { stage: 'Assigned', count: (statusBreakdown.assigned || 0) + (statusBreakdown.completed || 0) + (statusBreakdown.failed || 0), pct: 0, color: '#F59E0B' },
    { stage: 'Completed', count: statusBreakdown.completed || 0, pct: 0, color: '#10B981' },
  ];
  funnelData[1].pct = Math.round((funnelData[1].count / total) * 100);
  funnelData[2].pct = Math.round((funnelData[2].count / total) * 100);

  // Status pie data
  const pieData = Object.entries(statusBreakdown)
    .filter(([key, v]) => (v as number) > 0 && key != null)
    .map(([key, value]) => ({
      name: (key || 'unknown').charAt(0).toUpperCase() + (key || 'unknown').slice(1).replace('_', ' '),
      value: value as number,
      color: STATUS_COLORS[key] || '#9CA3AF',
    }));

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
            <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Analytics</h2>
            <p className="text-[11px] text-gray-500">HBB performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnalytics} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={period === p
              ? { backgroundColor: ACCENT, color: '#fff' }
              : { backgroundColor: '#F3F4F6', color: '#6B7280' }
            }
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard label="Total Leads" value={totalLeads} icon={Target} color="#3B82F6" />
        <KPICard label="Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="#10B981" />
        <KPICard label="Today" value={todayLeads} icon={Zap} color={ACCENT} />
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversion Funnel</h3>
        <div className="space-y-3">
          {funnelData.map((stage, i) => (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: stage.color }}>{stage.count}</span>
                  <span className="text-[10px] text-gray-400">({stage.pct}%)</span>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${stage.pct}%`,
                    backgroundColor: stage.color,
                    minWidth: stage.count > 0 ? '8px' : '0px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend Chart */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Lead Volume Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hbbColorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(d: string) => {
                  try { return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }); }
                  catch { return d; }
                }} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E5E7EB' }}
                  labelFormatter={(d: string) => {
                    try { return new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long' }); }
                    catch { return d; }
                  }}
                />
                <Area type="monotone" dataKey="total" name="Total" stroke={ACCENT} fill="url(#hbbColorLeads)" strokeWidth={2} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <LegendDot color={ACCENT} label="Total Leads" />
            <LegendDot color="#10B981" label="Completed" dashed />
          </div>
        </div>
      )}

      {/* Status Breakdown Pie */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={`pie-cell-${entry.name}-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">{d.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Towns */}
      {topTowns.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Towns</h3>
          <div className="space-y-2">
            {topTowns.slice(0, 5).map((town: any, i: number) => (
              <div key={`town-${town.name || i}`} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ backgroundColor: i === 0 ? ACCENT : i === 1 ? '#F59E0B' : '#9CA3AF' }}>
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 flex-1">{town.name}</span>
                <span className="text-sm font-semibold text-gray-900">{town.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Packages */}
      {topPackages.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Packages</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPackages.map((p: any, i: number) => ({ ...p, name: p.name || `Package ${i + 1}` }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={0} angle={-15} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Timing Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {avgTimeToAssign > 0 ? `${avgTimeToAssign}m` : '—'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Avg. Time to Assign</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {avgTimeToComplete > 0 ? `${avgTimeToComplete}h` : '—'}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Avg. Time to Complete</p>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
      <div className="w-8 h-8 rounded-xl mx-auto mb-1.5 flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      )}
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}