// src/components/hbb/hbb-team-lead-dashboard.tsx
// Team Lead GA Dashboard
// Shows: team GAs, team member list, individual performances, targets

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Target, Award, BarChart3, Search } from 'lucide-react';
import { getTeamLeadData, getTeamMembers, getTeamAnalytics } from './hbb-ga-api';
import { toast } from 'sonner';

interface TeamMember {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  incentive_earned: number;
  band_name: string;
  rank: number;
}

interface TeamLeadData {
  team_lead_msisdn: string;
  team_lead_name: string;
  total_team_gas: number;
  team_size: number;
  team_incentive_total: number;
  avg_ga_per_dse: number;
  month_year: string;
}

interface TeamAnalytics {
  top_performer: TeamMember | null;
  low_performer: TeamMember | null;
  avg_ga: number;
  ga_distribution: Array<{ range: string; count: number }>;
}

export function HBBTeamLeadDashboard({ userPhone }: { userPhone: string }) {
  const [teamData, setTeamData] = useState<TeamLeadData | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'team' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [userPhone]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const [teamDataRes, membersRes, analyticsRes] = await Promise.all([
        getTeamLeadData(userPhone, currentMonth),
        getTeamMembers(userPhone),
        getTeamAnalytics(userPhone),
      ]);

      setTeamData(teamDataRes);
      setTeamMembers(membersRes.sort((a, b) => b.ga_count - a.ga_count));
      setAnalytics(analyticsRes);
    } catch (error) {
      toast.error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.dse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.dse_msisdn.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No team data found</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{teamData.team_lead_name}</h1>
          <p className="text-gray-600">Team Lead Dashboard</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'overview'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'team'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Team Members ({teamData.team_size})
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'analytics'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>

        {viewMode === 'overview' && (
          <>
            {/* Team Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Team GAs */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Total Team GAs</p>
                <div className="text-4xl font-bold text-red-600 mb-1">
                  {teamData.total_team_gas}
                </div>
                <p className="text-xs text-gray-600">
                  Avg: {teamData.avg_ga_per_dse.toFixed(1)} per DSE
                </p>
              </div>

              {/* Team Size */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Team Members</p>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {teamData.team_size}
                </div>
                <p className="text-xs text-gray-600">Active DSEs</p>
              </div>

              {/* Total Incentive */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Team Incentive</p>
                <div className="text-4xl font-bold text-green-600 mb-1">
                  {teamData.team_incentive_total > 0 ? `KES ${(teamData.team_incentive_total / 1000).toFixed(0)}K` : '-'}
                </div>
                <p className="text-xs text-gray-600">Total earned</p>
              </div>

              {/* Month */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Month</p>
                <div className="text-4xl font-bold text-purple-600 mb-1">
                  {teamData.month_year}
                </div>
                <p className="text-xs text-gray-600">Reporting period</p>
              </div>
            </div>

            {/* Team Performance Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Team Performance
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Performer */}
                {analytics?.top_performer && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs text-amber-700 font-semibold uppercase mb-2">
                      🏆 Top Performer
                    </p>
                    <p className="font-semibold text-gray-900">{analytics.top_performer.dse_name}</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {analytics.top_performer.ga_count} GAs
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Incentive: KES {analytics.top_performer.incentive_earned.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Average GA */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-2">
                    Average GA per DSE
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics?.avg_ga.toFixed(1) || '-'}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">Team baseline</p>
                </div>

                {/* Low Performer */}
                {analytics?.low_performer && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-xs text-orange-700 font-semibold uppercase mb-2">
                      📊 Needs Support
                    </p>
                    <p className="font-semibold text-gray-900">{analytics.low_performer.dse_name}</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {analytics.low_performer.ga_count} GAs
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Gap: {Math.max(0, analytics.avg_ga - analytics.low_performer.ga_count).toFixed(0)} GAs
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {viewMode === 'team' && (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <div
                  key={member.dse_msisdn}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                        {member.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.dse_name}</p>
                        <p className="text-xs text-gray-500">{member.dse_msisdn}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{member.ga_count}</p>
                      <p className="text-xs text-gray-600">GAs</p>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Band</p>
                      <p className="font-semibold text-gray-900">{member.band_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Incentive</p>
                      <p className="font-semibold text-green-600">
                        KES {member.incentive_earned.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <p className="text-center text-gray-600 py-8">No team members found</p>
              )}
            </div>
          </>
        )}

        {viewMode === 'analytics' && (
          <>
            {/* GA Distribution */}
            {analytics?.ga_distribution && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  GA Distribution
                </h2>

                <div className="space-y-4">
                  {analytics.ga_distribution.map((dist, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{dist.range}</p>
                        <p className="text-sm text-gray-600">{dist.count} DSEs</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full"
                          style={{ width: `${(dist.count / teamData.team_size) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Team Insights</h2>

              <ul className="space-y-3 text-blue-900">
                <li className="flex items-start gap-3">
                  <span className="text-lg">📈</span>
                  <span>
                    <strong>Team Growing:</strong> Average of {teamData.avg_ga_per_dse.toFixed(1)} GAs per DSE
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <span>
                    <strong>Top Performer:</strong> {analytics?.top_performer?.dse_name} leading with {analytics?.top_performer?.ga_count} GAs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">💰</span>
                  <span>
                    <strong>Total Incentive:</strong> KES {teamData.team_incentive_total.toLocaleString()} earned across team
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">👥</span>
                  <span>
                    <strong>Team Size:</strong> {teamData.team_size} active DSEs
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
