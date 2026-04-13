// Van Calendar Compliance Dashboard - Compare planned vs actual
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAuthHeaders } from '../utils/api-helper';
import { TrendingUp, TrendingDown, Calendar, RefreshCw } from 'lucide-react';

interface ComplianceData {
  van: string;
  zsm: string;
  zone: string;
  compliance_rate: number;
  planned: number;
  actual: number;
  missed_sites: any[];
  unplanned_visits: any[];
}

export default function VanCalendarCompliance() {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    loadLastWeek();
  }, []);

  useEffect(() => {
    if (weekStart) {
      loadCompletedPlans();
    }
  }, [weekStart]);

  // Load last week (completed week)
  function loadLastWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Get last Sunday
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek - 7);
    
    // Get last Saturday
    const lastSaturday = new Date(lastSunday);
    lastSaturday.setDate(lastSunday.getDate() + 6);
    
    setWeekStart(lastSunday.toISOString().split('T')[0]);
    setWeekEnd(lastSaturday.toISOString().split('T')[0]);
  }

  // Load completed plans
  async function loadCompletedPlans() {
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

  // Calculate compliance
  async function calculateCompliance() {
    setCalculating(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-calendar/calculate-compliance/${weekStart}`,
        {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setComplianceData(result.data);
        alert('Compliance calculated successfully!');
        loadCompletedPlans(); // Reload to get updated data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error calculating compliance:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setCalculating(false);
    }
  }

  // Calculate overall stats
  const totalPlanned = plans.reduce((sum, p) => 
    sum + (p.compliance_data?.planned_sites || 0), 0
  );
  const totalActual = plans.reduce((sum, p) => 
    sum + (p.compliance_data?.matched_visits || 0), 0
  );
  const overallCompliance = totalPlanned > 0
    ? Math.round((totalActual / totalPlanned) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Compliance Report
            </h1>
            <p className="text-gray-600">
              Week of {weekStart} to {weekEnd}
            </p>
          </div>

          <button
            onClick={calculateCompliance}
            disabled={calculating || plans.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <RefreshCw className={`w-5 h-5 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculating...' : 'Calculate Compliance'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">
          Loading plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-semibold">
            No plans found for this week
          </p>
          <p className="text-yellow-700 text-sm mt-2">
            Plans must be submitted before compliance can be calculated
          </p>
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">{totalPlanned}</div>
              <div className="text-gray-700 mt-2">Sites Planned</div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-green-600">{totalActual}</div>
              <div className="text-gray-700 mt-2">Sites Visited</div>
            </div>

            <div className={`p-6 rounded-lg ${
              overallCompliance >= 80 ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <div className={`text-4xl font-bold ${
                overallCompliance >= 80 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {overallCompliance}%
              </div>
              <div className="text-gray-700 mt-2">Compliance Rate</div>
            </div>

            <div className="bg-red-50 p-6 rounded-lg">
              <div className="text-4xl font-bold text-red-600">
                {totalPlanned - totalActual}
              </div>
              <div className="text-gray-700 mt-2">Missed Sites</div>
            </div>
          </div>

          {/* Per-Van Breakdown */}
          <div className="space-y-6">
            {plans.map((plan) => {
              const hasCompliance = plan.compliance_data && plan.compliance_data.planned_sites > 0;

              return (
                <div key={plan.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        🚐 {plan.van_numberplate}
                      </h3>
                      <div className="text-gray-600">
                        ZSM: {plan.zsm_name} - {plan.zsm_zone}
                      </div>
                    </div>

                    {hasCompliance && (
                      <div className={`text-4xl font-bold ${
                        plan.compliance_data.compliance_rate >= 80
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {plan.compliance_data.compliance_rate}%
                      </div>
                    )}
                  </div>

                  {!hasCompliance ? (
                    <div className="text-gray-500 italic">
                      Compliance not yet calculated for this van
                    </div>
                  ) : (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Planned Sites</div>
                          <div className="text-3xl font-bold text-blue-600">
                            {plan.compliance_data.planned_sites}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600">Actual Visits</div>
                          <div className="text-3xl font-bold text-green-600">
                            {plan.compliance_data.matched_visits}
                          </div>
                        </div>
                      </div>

                      {/* Missed Sites */}
                      {plan.compliance_data.missed_sites && plan.compliance_data.missed_sites.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 font-semibold text-red-800 mb-3">
                            <TrendingDown className="w-5 h-5" />
                            ❌ Missed Sites ({plan.compliance_data.missed_sites.length})
                          </div>
                          <ul className="space-y-1">
                            {plan.compliance_data.missed_sites.map((missed: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700">
                                • {missed.day}, {missed.date}: <strong>{missed.site}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Unplanned Visits */}
                      {plan.compliance_data.unplanned_visits && plan.compliance_data.unplanned_visits.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 font-semibold text-blue-800 mb-3">
                            <TrendingUp className="w-5 h-5" />
                            ➕ Bonus Visits ({plan.compliance_data.unplanned_visits.length})
                          </div>
                          <ul className="space-y-1">
                            {plan.compliance_data.unplanned_visits.map((extra: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700">
                                • {extra.day}, {extra.date}: <strong>{extra.site}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Perfect Compliance */}
                      {plan.compliance_data.compliance_rate === 100 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2 text-green-800 font-bold">
                            <span className="text-2xl">🎉</span>
                            Perfect Compliance - All planned sites visited!
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}