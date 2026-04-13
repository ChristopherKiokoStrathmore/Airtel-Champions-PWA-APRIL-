// Van Calendar Grid - HQ Dashboard View
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAuthHeaders } from '../utils/api-helper';
import { ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react';
import VanCalendarZSMChecklist from './van-calendar-zsm-checklist';

interface VanPlan {
  id: string;
  van_numberplate: string;
  zsm_name: string;
  zsm_zone: string;
  rest_day: number;
  daily_plans: any[];
  total_sites_planned: number;
  compliance_data: any;
  status: string;
}

export default function VanCalendarGrid() {
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [plans, setPlans] = useState<VanPlan[]>([]);

  useEffect(() => {
    loadNextSunday();
  }, []);

  useEffect(() => {
    if (weekStart) {
      loadPlans();
    }
  }, [weekStart]);

  // Load next Sunday
  async function loadNextSunday() {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/next-sunday`,
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        }
      );

      const result = await response.json();
      if (result.success) {
        setWeekStart(result.data.week_start);
        setWeekEnd(result.data.week_end);
      }
    } catch (error) {
      console.error('Error loading next Sunday:', error);
    }
  }

  // Load plans for week
  async function loadPlans() {
    setLoading(true);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/week/${weekStart}`,
        {
          headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        }
      );

      const result = await response.json();
      if (result.success) {
        setPlans(result.data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }

  // Navigate weeks
  function previousWeek() {
    const date = new Date(weekStart);
    date.setDate(date.getDate() - 7);
    const newStart = date.toISOString().split('T')[0];
    
    const endDate = new Date(newStart);
    endDate.setDate(endDate.getDate() + 6);
    const newEnd = endDate.toISOString().split('T')[0];
    
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  }

  function nextWeek() {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 7);
    const newStart = date.toISOString().split('T')[0];
    
    const endDate = new Date(newStart);
    endDate.setDate(endDate.getDate() + 6);
    const newEnd = endDate.toISOString().split('T')[0];
    
    setWeekStart(newStart);
    setWeekEnd(newEnd);
  }

  // Export to Excel
  function exportToExcel() {
    // Create CSV content
    let csv = 'Van,ZSM,Zone,SUN,MON,TUE,WED,THU,FRI,SAT,Compliance\n';
    
    plans.forEach(plan => {
      const row = [
        plan.van_numberplate,
        plan.zsm_name,
        plan.zsm_zone,
        ...plan.daily_plans.map(day => {
          if (day.is_rest_day) return 'REST';
          if (day.sites.length === 0) return 'No sites';
          return day.sites.map((s: any) => s.site_name).join('; ');
        }),
        plan.compliance_data?.compliance_rate 
          ? `${plan.compliance_data.compliance_rate}%` 
          : 'Pending'
      ];
      
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `van-calendar-${weekStart}.csv`;
    a.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🚐 Van Calendar - Week Overview
            </h1>
            <p className="text-gray-600">
              Week of {weekStart} to {weekEnd}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={previousWeek}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Week
            </button>
            
            <button
              onClick={nextWeek}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-600"
            >
              Next Week
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="border border-red-700 p-3 text-left font-bold w-32">Van</th>
                <th className="border border-red-700 p-3 text-left font-bold w-40">ZSM</th>
                <th className="border border-red-700 p-3 text-center font-bold">SUN</th>
                <th className="border border-red-700 p-3 text-center font-bold">MON</th>
                <th className="border border-red-700 p-3 text-center font-bold">TUE</th>
                <th className="border border-red-700 p-3 text-center font-bold">WED</th>
                <th className="border border-red-700 p-3 text-center font-bold">THU</th>
                <th className="border border-red-700 p-3 text-center font-bold">FRI</th>
                <th className="border border-red-700 p-3 text-center font-bold">SAT</th>
                <th className="border border-red-700 p-3 text-center font-bold w-24">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border p-6 text-center text-gray-500">
                    No plans submitted for this week yet
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    {/* Van */}
                    <td className="border p-3">
                      <div className="font-bold text-gray-900">{plan.van_numberplate}</div>
                    </td>

                    {/* ZSM */}
                    <td className="border p-3">
                      <div className="text-sm">
                        <div className="font-semibold">{plan.zsm_name}</div>
                        <div className="text-gray-600 text-xs">{plan.zsm_zone}</div>
                      </div>
                    </td>

                    {/* Days */}
                    {plan.daily_plans.map((day, idx) => (
                      <td
                        key={idx}
                        className={`border p-2 text-xs ${
                          day.is_rest_day
                            ? 'bg-gray-200 text-center'
                            : day.sites.length === 0
                            ? 'bg-yellow-50 text-center'
                            : 'bg-white'
                        }`}
                      >
                        {day.is_rest_day ? (
                          <div className="text-gray-600 font-semibold">🛏️ Rest</div>
                        ) : day.sites.length === 0 ? (
                          <div className="text-gray-400">No sites</div>
                        ) : (
                          <div className="space-y-1">
                            {day.sites.map((site: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="p-1 bg-blue-50 rounded text-blue-900"
                              >
                                <div className="font-semibold truncate">
                                  📍 {site.site_name}
                                </div>
                                {site.time_slot && site.time_slot !== 'Full Day' && (
                                  <div className="text-gray-600">
                                    ⏰ {site.time_slot}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    ))}

                    {/* Compliance */}
                    <td className="border p-3 text-center">
                      {plan.compliance_data ? (
                        <div>
                          <div
                            className={`text-lg font-bold ${
                              plan.compliance_data.compliance_rate >= 80
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {plan.compliance_data.compliance_rate}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {plan.compliance_data.actual_visits}/{plan.compliance_data.planned_sites}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs">Week ongoing</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="text-4xl font-bold text-blue-600">{plans.length}</div>
            <div className="text-gray-700 mt-2">Vans Planned</div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="text-4xl font-bold text-green-600">
              {plans.reduce((sum, p) => sum + p.total_sites_planned, 0)}
            </div>
            <div className="text-gray-700 mt-2">Total Sites</div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="text-4xl font-bold text-purple-600">
              {new Set(plans.map(p => p.zsm_zone)).size}
            </div>
            <div className="text-gray-700 mt-2">Zones Covered</div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="text-4xl font-bold text-orange-600">
              {Math.round(
                plans.reduce((sum, p) => sum + p.total_sites_planned, 0) / plans.length
              )}
            </div>
            <div className="text-gray-700 mt-2">Avg Sites/Van</div>
          </div>
        </div>
      )}

      {/* ZSM Checklist */}
      <VanCalendarZSMChecklist weekStart={weekStart} />
    </div>
  );
}