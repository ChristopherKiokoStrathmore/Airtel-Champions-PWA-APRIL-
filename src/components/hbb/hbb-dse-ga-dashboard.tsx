// src/components/hbb/hbb-dse-ga-dashboard.tsx
// DSE GA (Gross Add) Dashboard
// Shows: GA count, band progress, incentive earned, team lead, history

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, ChevronRight } from 'lucide-react';
import { getDSEGAData, getPersonGAHistory } from './hbb-ga-api';
import { getIncentiveBand, calculateProgressToNextBand } from './hbb-ga-utilities';
import { toast } from 'sonner';

interface DSEGAData {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  team_lead_msisdn: string;
  month_year: string;
}

interface HistoryEntry {
  month_year: string;
  ga_count: number;
  incentive_earned: number;
  band_name: string;
}

export function HBBDSEGADashboard({ userPhone }: { userPhone: string }) {
  const [gaData, setGaData] = useState<DSEGAData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [userPhone]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current month's data
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const data = await getDSEGAData(userPhone, currentMonth);
      setGaData(data);
      setSelectedMonth(currentMonth);

      // Get history
      const historyData = await getPersonGAHistory(userPhone, 'dse');
      setHistory(historyData);
    } catch (error) {
      toast.error(`Failed to load GA data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading GA data...</p>
        </div>
      </div>
    );
  }

  if (!gaData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No GA data found for this period</p>
      </div>
    );
  }

  const bandInfo = getIncentiveBand(gaData.ga_count, 'dse');
  const progress = calculateProgressToNextBand(gaData.ga_count, 'dse');

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{gaData.dse_name}</h1>
          <p className="text-gray-600">DSE GA Dashboard</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('current')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              viewMode === 'current'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              viewMode === 'history'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            History
          </button>
        </div>

        {viewMode === 'current' && (
          <>
            {/* GA Count Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Gross Adds (GA)</h2>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-5xl font-bold text-red-600 mb-2">{gaData.ga_count}</div>
              <p className="text-gray-600 text-sm">GAs this month ({gaData.month_year})</p>
            </div>

            {/* Band & Progress Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Band Progress
              </h2>

              {/* Current Band */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Current Band</p>
                <div className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-semibold">
                  {bandInfo?.bandName || 'Band 1'}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Target: {bandInfo?.gaRangeMin} - {bandInfo?.gaRangeMax} GAs
                </p>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">Progress to Next Band</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {progress?.percent}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress?.percent || 0, 100)}%` }}
                  />
                </div>
                {progress && progress.gasNeeded > 0 ? (
                  <p className="text-xs text-gray-500 mt-2">
                    {progress.gasNeeded} more GAs to reach next band
                  </p>
                ) : (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Next band reached!
                  </p>
                )}
              </div>
            </div>

            {/* Incentive & Team Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Incentive Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Incentive Earned</p>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {gaData.incentive_earned > 0 ? `KES ${gaData.incentive_earned.toLocaleString()}` : '-'}
                </div>
                <p className="text-xs text-gray-600">This month</p>
              </div>

              {/* Team Lead Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Team Lead</p>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {gaData.team_lead_msisdn ? (
                    <span>{gaData.team_lead_msisdn.slice(-4)}</span>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {gaData.team_lead_msisdn ? 'Assigned' : 'No team'}
                </p>
              </div>
            </div>

            {/* Incentive Breakdown (if applicable) */}
            {bandInfo && gaData.incentive_earned > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">Incentive Breakdown</h3>
                <div className="space-y-2 text-sm text-blue-900">
                  <p>
                    <span>Split %:</span>{' '}
                    <span className="font-semibold">N/A</span>
                  </p>
                  <p>
                    <span>Bonus:</span>{' '}
                    <span className="font-semibold">KES {bandInfo.totalBonus || 0}</span>
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              GA History
            </h2>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{entry.month_year}</p>
                      <p className="text-sm text-gray-600">
                        {entry.ga_count} GAs • Band {idx + 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        KES {entry.incentive_earned.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No history available</p>
            )}
          </div>
        )}

        {/* Top 3 Performers Widget */}
        {viewMode === 'current' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Top 3 This Month
            </h2>

            <div className="space-y-2">
              {top3.map((performer, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    performer.dse_msisdn === userPhone
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-amber-400' :
                      idx === 1 ? 'bg-gray-400' :
                      'bg-amber-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{performer.dse_name}</p>
                      <p className="text-xs text-gray-600">{performer.ga_count} GAs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      KES {performer.incentive_earned.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
