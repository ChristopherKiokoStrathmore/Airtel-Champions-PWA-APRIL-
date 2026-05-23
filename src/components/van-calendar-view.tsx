import { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Loader } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

interface DailyPlan {
  day: string;
  date: string;
  sites: Array<{
    site_id: string;
    site_name: string;
  }>;
}

interface VanCalendarPlan {
  id: string;
  week_start_date: string;
  week_end_date: string;
  van_id: string;
  van_numberplate: string;
  zsm_id: string;
  zsm_name: string;
  zsm_phone: string;
  zsm_zone: string;
  rest_day: string;
  daily_plans: DailyPlan[];
  total_sites_planned: number;
  zones_covered: string[];
  status: string;
  submitted_at: string;
}

interface VanCalendarViewProps {
  onClose: () => void;
  programId?: string;
}

export default function VanCalendarView({ onClose }: VanCalendarViewProps) {
  const [plans, setPlans] = useState<VanCalendarPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedVan, setSelectedVan] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[Van Calendar View] Fetching from van_calendar_plans table');

      const { data, error: fetchError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (fetchError) {
        console.error('[Van Calendar View] Error:', fetchError);
        throw fetchError;
      }

      console.log('[Van Calendar View] ✅ Loaded', data?.length || 0, 'plans');
      
      // Log first plan for debugging
      if (data && data.length > 0) {
        console.log('[Van Calendar View] Sample plan data:', {
          rest_day: data[0].rest_day,
          rest_day_type: typeof data[0].rest_day,
          van: data[0].van_numberplate,
          daily_plans_count: data[0].daily_plans?.length
        });
      }
      
      setPlans(data || []);
    } catch (err: any) {
      console.error('[Van Calendar View] ❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueVans = Array.from(new Set(plans.map(p => p.van_numberplate))).sort();
  const uniqueWeeks = Array.from(new Set(plans.map(p => p.week_start_date))).sort().reverse();
  const uniqueZones = Array.from(new Set(plans.map(p => p.zsm_zone).filter(Boolean))).sort();

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    if (selectedVan !== 'all' && plan.van_numberplate !== selectedVan) return false;
    if (selectedWeek !== 'all' && plan.week_start_date !== selectedWeek) return false;
    if (selectedZone !== 'all' && plan.zsm_zone !== selectedZone) return false;
    return true;
  });

  // Group by week and van
  const groupedPlans: { [week: string]: { [van: string]: VanCalendarPlan } } = {};
  filteredPlans.forEach(plan => {
    const week = plan.week_start_date;
    const van = plan.van_numberplate;
    
    if (!groupedPlans[week]) {
      groupedPlans[week] = {};
    }
    groupedPlans[week][van] = plan;
  });

  const sortedWeeks = Object.keys(groupedPlans).sort().reverse();

  // Export to CSV
  const exportToCSV = () => {
    const rows: string[][] = [
      ['Week Start', 'Week End', 'Van Number', 'ZSM Name', 'Zone', 'Day', 'Date', 'Sites', 'Total Sites', 'Status', 'Submitted At']
    ];

    filteredPlans.forEach(plan => {
      plan.daily_plans.forEach(day => {
        rows.push([
          plan.week_start_date,
          plan.week_end_date,
          plan.van_numberplate,
          plan.zsm_name,
          plan.zsm_zone,
          day.day,
          day.date,
          day.sites.map(s => s.site_name).join('; '),
          plan.total_sites_planned.toString(),
          plan.status,
          new Date(plan.submitted_at).toLocaleString()
        ]);
      });
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `van-schedules-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Van Weekly Schedules</h2>
              <p className="text-red-100 text-sm">View all submitted van calendars</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredPlans.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap gap-4">
              {/* Van Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Van</label>
                <select
                  value={selectedVan}
                  onChange={(e) => setSelectedVan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Vans ({uniqueVans.length})</option>
                  {uniqueVans.map(van => (
                    <option key={van} value={van}>{van}</option>
                  ))}
                </select>
              </div>

              {/* Week Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Week</label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Weeks ({uniqueWeeks.length})</option>
                  {uniqueWeeks.map(week => (
                    <option key={week} value={week}>
                      Week of {formatDate(week)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone Filter */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Zone</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Zones ({uniqueZones.length})</option>
                  {uniqueZones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(selectedVan !== 'all' || selectedWeek !== 'all' || selectedZone !== 'all') && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedVan('all');
                      setSelectedWeek('all');
                      setSelectedZone('all');
                    }}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-12 h-12 text-red-600 animate-spin mb-4" />
              <p className="text-gray-500">Loading schedules...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-medium mb-2">Error Loading Schedules</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchPlans}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Retry
              </button>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No van schedules found</p>
              <p className="text-gray-400 text-sm mt-2">
                {plans.length === 0 
                  ? 'No schedules have been submitted yet' 
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Plans</p>
                  <p className="text-3xl font-bold text-blue-900">{filteredPlans.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-green-600 text-sm font-medium">Unique Vans</p>
                  <p className="text-3xl font-bold text-green-900">
                    {new Set(filteredPlans.map(p => p.van_numberplate)).size}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-purple-600 text-sm font-medium">Weeks Covered</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(filteredPlans.map(p => p.week_start_date)).size}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-orange-600 text-sm font-medium">Total Sites</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {filteredPlans.reduce((sum, p) => sum + p.total_sites_planned, 0)}
                  </p>
                </div>
              </div>

              {/* Weekly Schedule Cards */}
              {sortedWeeks.map(weekStart => {
                const weekPlans = groupedPlans[weekStart];
                const vanNumbers = Object.keys(weekPlans).sort();

                return (
                  <div key={weekStart} className="border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Week Header */}
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Week of {formatDate(weekStart)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(weekStart)} - {formatDate(weekPlans[vanNumbers[0]].week_end_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{vanNumbers.length}</p>
                          <p className="text-sm text-gray-600">van{vanNumbers.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Van Plans */}
                    <div className="divide-y divide-gray-200">
                      {vanNumbers.map(vanNumber => {
                        const plan = weekPlans[vanNumber];

                        return (
                          <div key={`${weekStart}-${vanNumber}`} className="p-6 hover:bg-gray-50 transition-all">
                            {/* Van Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-lg">🚐</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{vanNumber}</h4>
                                  <p className="text-xs text-gray-500">
                                    ZSM: {plan.zsm_name} • Zone: {plan.zsm_zone}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Submitted {new Date(plan.submitted_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  plan.status === 'active' 
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                                }`}>
                                  {plan.status}
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  {plan.total_sites_planned} sites planned
                                </p>
                              </div>
                            </div>

                            {/* Daily Schedule Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
                              {plan.daily_plans.map(day => {
                                // Safely check if this is a rest day
                                const dayName = day.day || '';
                                const restDayName = plan.rest_day || '';
                                const isRestDay = dayName.toLowerCase() === restDayName.toLowerCase();

                                return (
                                  <div 
                                    key={day.day} 
                                    className={`border rounded-lg p-3 ${
                                      isRestDay 
                                        ? 'bg-gray-100 border-gray-300' 
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <p className="text-xs font-bold text-gray-700 mb-1">
                                      {day.day}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {formatDate(day.date)}
                                    </p>
                                    {isRestDay ? (
                                      <p className="text-xs text-gray-500 italic">Rest Day</p>
                                    ) : day.sites.length > 0 ? (
                                      <div className="space-y-1">
                                        {day.sites.map((site, idx) => (
                                          <div
                                            key={idx}
                                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                            title={site.site_id}
                                          >
                                            {site.site_name}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-400 italic">No sites</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredPlans.length} of {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
