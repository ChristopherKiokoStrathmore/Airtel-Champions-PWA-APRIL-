import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, Truck } from 'lucide-react';

interface VanCalendarStats {
  totalSubmissions: number;
  thisWeekSubmissions: number;
  zonesSubmitted: number;
  totalZones: number;
  vansWithPlans: number;
  totalVans: number;
  pendingZones: string[];
}

export function VanCalendarWidgetHQ({ onViewAll }: { onViewAll: () => void }) {
  const [stats, setStats] = useState<VanCalendarStats>({
    totalSubmissions: 0,
    thisWeekSubmissions: 0,
    zonesSubmitted: 0,
    totalZones: 8,
    vansWithPlans: 0,
    totalVans: 19,
    pendingZones: []
  });
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    loadVanCalendarStats();
  }, []);

  const loadVanCalendarStats = async () => {
    try {
      console.log('[Van Calendar Widget] 🔍 Loading stats for HQ...');
      setLoading(true);

      // Get current week boundaries
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);

      // Fetch all van calendar submissions
      const { data: allSubmissions, error: allError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Fetch this week's submissions
      const { data: thisWeekData, error: weekError } = await supabase
        .from('van_calendar_plans')
        .select('*')
        .gte('week_start_date', startOfWeek.toISOString().split('T')[0])
        .lte('week_start_date', endOfWeek.toISOString().split('T')[0]);

      if (weekError) throw weekError;

      // Calculate stats
      const totalSubmissions = allSubmissions?.length || 0;
      const thisWeekSubmissions = thisWeekData?.length || 0;
      
      // Unique zones that have submitted
      const zonesSubmitted = new Set(
        allSubmissions?.map(sub => sub.zone) || []
      ).size;

      // Unique vans that have plans
      const vansWithPlans = new Set(
        allSubmissions?.map(sub => sub.van_id) || []
      ).size;

      // All zones in the system
      const allZones = ['COAST', 'CENTRAL', 'EASTERN', 'WESTERN', 'NYANZA', 'RIFT VALLEY', 'NORTH EASTERN', 'NAIROBI'];
      
      // Zones that submitted this week
      const zonesThisWeek = new Set(
        thisWeekData?.map(sub => sub.zone) || []
      );

      // Zones that haven't submitted this week
      const pendingZones = allZones.filter(zone => !zonesThisWeek.has(zone));

      // Get 5 most recent submissions
      const recent = allSubmissions?.slice(0, 5) || [];

      setStats({
        totalSubmissions,
        thisWeekSubmissions,
        zonesSubmitted,
        totalZones: allZones.length,
        vansWithPlans,
        totalVans: 19,
        pendingZones
      });

      setRecentSubmissions(recent);

      console.log('[Van Calendar Widget] ✅ Stats loaded:', {
        totalSubmissions,
        thisWeekSubmissions,
        zonesSubmitted,
        vansWithPlans
      });

    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.code === '42P01') {
        console.warn('[Van Calendar Widget] ⚠️ Stats unavailable (backend not ready)');
      } else {
        console.error('[Van Calendar Widget] ❌ Error loading stats:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const complianceRate = stats.totalZones > 0 
    ? Math.round((stats.zonesSubmitted / stats.totalZones) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🚐 Van Calendar System</h3>
              <p className="text-sm text-blue-100">Weekly Route Planning</p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            View All Plans →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-200">
        {/* Total Submissions */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.totalSubmissions}</div>
          <div className="text-xs text-gray-600 mt-1">Total Plans</div>
        </div>

        {/* This Week */}
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats.thisWeekSubmissions}</div>
          <div className="text-xs text-gray-600 mt-1">This Week</div>
        </div>

        {/* Zones */}
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            {stats.zonesSubmitted}/{stats.totalZones}
          </div>
          <div className="text-xs text-gray-600 mt-1">Zones Active</div>
        </div>

        {/* Vans */}
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {stats.vansWithPlans}/{stats.totalVans}
          </div>
          <div className="text-xs text-gray-600 mt-1">Vans Planned</div>
        </div>
      </div>

      {/* Compliance Bar */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Zone Compliance</span>
          <span className="text-sm font-bold text-gray-900">{complianceRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              complianceRate >= 80 ? 'bg-green-500' :
              complianceRate >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${complianceRate}%` }}
          ></div>
        </div>
      </div>

      {/* Pending Zones Alert */}
      {stats.pendingZones.length > 0 && (
        <div className="px-6 py-4 bg-orange-50 border-b border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 mb-1">
                {stats.pendingZones.length} Zone{stats.pendingZones.length > 1 ? 's' : ''} Pending
              </p>
              <p className="text-xs text-orange-700">
                {stats.pendingZones.join(', ')} - No submissions this week
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Recent Submissions</h4>
        {recentSubmissions.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">No submissions yet</p>
        ) : (
          <div className="space-y-2">
            {recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚐</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{sub.van_numberplate}</p>
                    <p className="text-xs text-gray-500">{sub.zone} • {sub.zsm_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">
                    {new Date(sub.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onViewAll}
          className="w-full py-2 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Van Calendar Plans →
        </button>
      </div>
    </div>
  );
}
