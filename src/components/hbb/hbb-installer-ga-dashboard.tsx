// src/components/hbb/hbb-installer-ga-dashboard.tsx
// Installer GA (Gross Add) Dashboard
// Shows: GA count, band progress, incentive earned, history

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar } from 'lucide-react';
import {
  getInstallerDailyHistory,
  getInstallerGACurrentMonth,
  getInstallersByTeamLead,
  InstallerLeaderboardEntry,
} from './hbb-ga-api';
import { getIncentiveBand, calculateProgressToNextBand, getCurrentMonthYear, normalizePhone, formatCurrency } from './hbb-ga-utilities';
import { toast } from 'sonner';

interface InstallerGAData {
  installer_msisdn: string;
  installer_name: string;
  ga_count: number;
  current_band_min: number;
  current_band_max: number;
  incentive_earned: number;
  month_year: string;
  team_lead_msisdn?: string | null;
}

interface HistoryEntry {
  ga_date: string;
  total_ga: number;
  installer_name?: string;
  town?: string;
  report_batch_id?: string | null;
  month_year?: string | null;
}

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString('en-KE', {
    month: 'short',
    year: 'numeric',
  });
};

export function HBBInstallerGADashboard({ userPhone, userName }: { userPhone: string; userName: string }) {
  const [gaData, setGaData] = useState<InstallerGAData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [leaderboard, setLeaderboard] = useState<InstallerLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const normalizedPhone = normalizePhone(userPhone);

  const hasRealName = userName && userName.length > 3 && userName !== 'Installer';

  useEffect(() => {
    loadData();
  // Re-run when phone changes or when real name first becomes available after async lookup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPhone, hasRealName]);

  useEffect(() => {
    if (!gaData?.team_lead_msisdn) return;
    let cancelled = false;
    setLeaderboardLoading(true);
    getInstallersByTeamLead(gaData.team_lead_msisdn, gaData.month_year)
      .then(data => { if (!cancelled) setLeaderboard(data); })
      .catch(() => {/* silent — leaderboard is best-effort */})
      .finally(() => { if (!cancelled) setLeaderboardLoading(false); });
    return () => { cancelled = true; };
  }, [gaData?.team_lead_msisdn, gaData?.month_year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentMonth = getCurrentMonthYear();
      const msisdnToQuery = normalizedPhone || userPhone;

      // Try MSISDN first, then name fallback, then old uppercase table — no .single() to avoid 406
      const data = await getInstallerGACurrentMonth(
        msisdnToQuery,
        currentMonth,
        hasRealName ? userName.split(' ')[0] : undefined
      );

      if (data) {
        setGaData({
          installer_msisdn: data.installer_msisdn,
          installer_name: data.installer_name,
          ga_count: data.ga_count || 0,
          current_band_min: data.current_band_min || 0,
          current_band_max: data.current_band_max || 20,
          incentive_earned: data.incentive_earned || 0,
          month_year: data.month_year,
          team_lead_msisdn: data.team_lead_msisdn || null,
        });
      } else {
        setGaData({
          installer_msisdn: msisdnToQuery,
          installer_name: userName || `Installer ${msisdnToQuery.slice(-4)}`,
          ga_count: 0,
          current_band_min: 0,
          current_band_max: 20,
          incentive_earned: 0,
          month_year: currentMonth,
        });
      }

      // History: read from the calendar-backed daily history view
      const historyMsisdn = data?.installer_msisdn || msisdnToQuery;
      const historyData = await getInstallerDailyHistory(historyMsisdn);
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

  const bandInfo = getIncentiveBand(gaData.ga_count, 'installer');
  const progress = calculateProgressToNextBand(gaData.ga_count, 'installer');
  const availableMonths = Array.from(
    new Set(history.map(entry => (entry.month_year || entry.ga_date.slice(0, 7))))
  ).sort((a, b) => b.localeCompare(a));
  const filteredHistory = history
    .filter(entry => {
    const monthKey = entry.month_year || entry.ga_date.slice(0, 7);
    if (selectedMonth !== 'all' && monthKey !== selectedMonth) return false;
    if (startDateFilter && entry.ga_date < startDateFilter) return false;
    if (endDateFilter && entry.ga_date > endDateFilter) return false;
    return true;
  })
    .sort((a, b) => b.ga_date.localeCompare(a.ga_date));

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{gaData.installer_name}</h1>
          <p className="text-gray-600">Installer GA Dashboard</p>
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

            {/* Incentive Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500 uppercase mb-2">Incentive Earned</p>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {(() => {
                  const monthBand = getIncentiveBand(gaData.ga_count, 'installer');
                  const perGa = monthBand?.totalBonus || 0;
                  const earned = gaData.incentive_earned || (gaData.ga_count * perGa) || 0;
                  return earned > 0 ? formatCurrency(earned) : '-';
                })()}
              </div>
              <p className="text-xs text-gray-600">This month</p>
            </div>

            {/* Incentive Breakdown (if applicable) */}
            {bandInfo && gaData.incentive_earned > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
                <h3 className="font-semibold text-blue-900 mb-3">Incentive Breakdown</h3>
                <div className="space-y-2 text-sm text-blue-900">
                  <p>
                    <span>Bonus:</span>{' '}
                    <span className="font-semibold">KES {bandInfo.totalBonus || 0}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Team Leaderboard */}
            {(leaderboard.length > 0 || leaderboardLoading) && gaData.team_lead_msisdn && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Team Leaderboard</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Your position among installers under your supervisor ({gaData.month_year})
                </p>

                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {(() => {
                      const myEntry = leaderboard.find(e => e.msisdn === gaData.installer_msisdn);
                      if (!myEntry) return null;
                      return (
                        <div
                          className="rounded-xl px-4 py-2 mb-4 text-center text-sm font-semibold text-white"
                          style={{ backgroundColor: '#E60000' }}
                        >
                          You are #{myEntry.position} of {leaderboard.length} installers
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      {leaderboard.map(entry => {
                        const isMe = entry.msisdn === gaData.installer_msisdn;
                        return (
                          <div
                            key={entry.msisdn}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 border"
                            style={{
                              backgroundColor: isMe ? '#FEF2F2' : '#F9FAFB',
                              borderColor: isMe ? '#FECACA' : '#E5E7EB',
                            }}
                          >
                            <span
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: entry.position <= 3 ? '#E60000' : '#E5E7EB',
                                color: entry.position <= 3 ? 'white' : '#6B7280',
                              }}
                            >
                              {entry.position}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${isMe ? 'font-bold text-red-700' : 'font-medium text-gray-800'}`}>
                                {entry.name}{isMe ? ' (You)' : ''}
                              </p>
                              {entry.town && (
                                <p className="text-[10px] text-gray-500">{entry.town}</p>
                              )}
                            </div>
                            <span
                              className={`text-sm font-bold flex-shrink-0 ${isMe ? 'text-red-600' : 'text-gray-700'}`}
                            >
                              {entry.gaCount} GAs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {viewMode === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Daily GA History
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Month</span>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All months</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {formatMonthLabel(month)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">From</span>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={e => setStartDateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 uppercase mb-1 block">To</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={e => setEndDateFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
                />
              </label>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                Showing {filteredHistory.length} day{filteredHistory.length === 1 ? '' : 's'}
              </p>
              <button
                onClick={() => {
                  setSelectedMonth('all');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Clear filters
              </button>
            </div>

            {filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((entry, idx) => {
                  const dayTotal = entry.total_ga ?? 0;
                  const band = getIncentiveBand(dayTotal, 'installer');

                  return (
                    <div key={`${entry.ga_date}-${idx}`} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(entry.ga_date + 'T00:00:00').toLocaleDateString('en-KE', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {dayTotal} GAs • {band?.bandName || 'Band 1'}
                          </p>
                          {entry.town ? (
                            <p className="text-xs text-gray-500 mt-1">{entry.town}</p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{dayTotal}</p>
                          <p className="text-xs text-gray-500">Daily total</p>
                        </div>
                      </div>

                      {entry.report_batch_id ? (
                        <p className="text-[11px] text-gray-400 mt-3 break-all">
                          Batch ID: {entry.report_batch_id}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                  </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No history available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
