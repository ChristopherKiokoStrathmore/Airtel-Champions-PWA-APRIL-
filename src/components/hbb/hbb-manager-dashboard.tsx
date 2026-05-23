// src/components/hbb/hbb-manager-dashboard.tsx
// HBB Manager GA Dashboard
// Shows: multiple teams, all DSEs, regional performance, area KPIs

import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, Target, MapPin, Filter } from 'lucide-react';
import { getManagerAreaData, getAllDSEsByArea, getAreaAnalytics, getTeamLeadsByArea } from './hbb-ga-api';
import { toast } from 'sonner';

interface AreaData {
  area_code: string;
  area_name: string;
  total_gas: number;
  total_dses: number;
  total_team_leads: number;
  total_incentive: number;
  avg_ga_per_dse: number;
  month_year: string;
}

interface TeamLeadSummary {
  team_lead_msisdn: string;
  team_lead_name: string;
  team_size: number;
  team_gas: number;
  team_incentive: number;
  top_dse_ga_count: number;
}

interface DSESummary {
  dse_msisdn: string;
  dse_name: string;
  ga_count: number;
  band_name: string;
  team_lead_msisdn: string;
  rank: number;
}

interface AreaAnalytics {
  top_team_lead: TeamLeadSummary | null;
  top_dse: DSESummary | null;
  underperforming_teams: TeamLeadSummary[];
}

export function HBBManagerDashboard({ userPhone }: { userPhone: string }) {
  const [areaData, setAreaData] = useState<AreaData | null>(null);
  const [teamLeads, setTeamLeads] = useState<TeamLeadSummary[]>([]);
  const [dseList, setDseList] = useState<DSESummary[]>([]);
  const [analytics, setAnalytics] = useState<AreaAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'area' | 'teams' | 'dses'>('area');
  const [selectedTeamLead, setSelectedTeamLead] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userPhone]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const [areaDataRes, teamLeadsRes, dseListRes, analyticsRes] = await Promise.all([
        getManagerAreaData(userPhone, currentMonth),
        getTeamLeadsByArea(userPhone),
        getAllDSEsByArea(userPhone),
        getAreaAnalytics(userPhone),
      ]);

      setAreaData(areaDataRes);
      setTeamLeads(teamLeadsRes.sort((a, b) => b.team_gas - a.team_gas));
      setDseList(dseListRes.sort((a, b) => b.ga_count - a.ga_count));
      setAnalytics(analyticsRes);
    } catch (error) {
      toast.error(`Failed to load area data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredDSEs = selectedTeamLead
    ? dseList.filter(d => d.team_lead_msisdn === selectedTeamLead)
    : dseList;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading area data...</p>
        </div>
      </div>
    );
  }

  if (!areaData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No area data found</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <MapPin className="w-8 h-8 text-red-600" />
            {areaData.area_name}
          </h1>
          <p className="text-gray-600">HBB Manager Dashboard</p>
          <p className="text-sm text-gray-500 mt-2">Area {areaData.area_code}</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setViewMode('area')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'area'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Area Overview
          </button>
          <button
            onClick={() => {
              setViewMode('teams');
              setSelectedTeamLead(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'teams'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            Team Leads ({teamLeads.length})
          </button>
          <button
            onClick={() => setViewMode('dses')}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              viewMode === 'dses'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            All DSEs ({dseList.length})
          </button>
        </div>

        {viewMode === 'area' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Total GAs */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Total GAs</p>
                <div className="text-4xl font-bold text-red-600 mb-1">
                  {areaData.total_gas}
                </div>
                <p className="text-xs text-gray-600">This month</p>
              </div>

              {/* Total DSEs */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Total DSEs</p>
                <div className="text-4xl font-bold text-blue-600 mb-1">
                  {areaData.total_dses}
                </div>
                <p className="text-xs text-gray-600">Active agents</p>
              </div>

              {/* Team Leads */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Team Leads</p>
                <div className="text-4xl font-bold text-green-600 mb-1">
                  {areaData.total_team_leads}
                </div>
                <p className="text-xs text-gray-600">Managing teams</p>
              </div>

              {/* Total Incentive */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Total Incentive</p>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {areaData.total_incentive > 0 ? `KES ${(areaData.total_incentive / 1000).toFixed(0)}K` : '-'}
                </div>
                <p className="text-xs text-gray-600">Area total</p>
              </div>

              {/* Avg GA */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-xs text-gray-500 uppercase mb-2">Avg GA/DSE</p>
                <div className="text-4xl font-bold text-purple-600 mb-1">
                  {areaData.avg_ga_per_dse.toFixed(1)}
                </div>
                <p className="text-xs text-gray-600">Performance metric</p>
              </div>
            </div>

            {/* Area Performance Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Team Lead */}
              {analytics?.top_team_lead && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-amber-900 uppercase mb-3">
                    🏆 Top Team Lead
                  </h3>
                  <p className="text-lg font-bold text-gray-900 mb-4">
                    {analytics.top_team_lead.team_lead_name}
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span>Team Size:</span> <span className="font-semibold">{analytics.top_team_lead.team_size} DSEs</span>
                    </p>
                    <p>
                      <span>Team GAs:</span> <span className="font-semibold text-orange-600">{analytics.top_team_lead.team_gas}</span>
                    </p>
                    <p>
                      <span>Incentive:</span> <span className="font-semibold text-green-600">KES {analytics.top_team_lead.team_incentive.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Top DSE */}
              {analytics?.top_dse && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-blue-900 uppercase mb-3">
                    ⭐ Top DSE
                  </h3>
                  <p className="text-lg font-bold text-gray-900 mb-4">
                    {analytics.top_dse.dse_name}
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span>GAs:</span> <span className="font-semibold text-red-600">{analytics.top_dse.ga_count}</span>
                    </p>
                    <p>
                      <span>Band:</span> <span className="font-semibold">{analytics.top_dse.band_name}</span>
                    </p>
                    <p>
                      <span>Performance:</span> <span className="font-semibold">Rank {analytics.top_dse.rank}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Area Health */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-green-900 uppercase mb-3">
                  📊 Area Health
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-700 mb-1">Overall Performance</p>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-4">
                    Area is performing <strong>well above</strong> baseline targets
                  </p>
                </div>
              </div>
            </div>

            {/* Underperforming Teams Alert */}
            {analytics?.underperforming_teams && analytics.underperforming_teams.length > 0 && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">
                  ⚠️ Teams Needing Support
                </h3>
                <div className="space-y-2">
                  {analytics.underperforming_teams.map((team) => (
                    <p key={team.team_lead_msisdn} className="text-orange-900">
                      <span className="font-semibold">{team.team_lead_name}</span>
                      {' '}- {team.team_gas} GAs ({team.team_size} DSEs)
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'teams' && (
          <div className="space-y-4">
            {teamLeads.map((team) => (
              <div
                key={team.team_lead_msisdn}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-lg text-gray-900">{team.team_lead_name}</p>
                    <p className="text-sm text-gray-600">{team.team_lead_msisdn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-red-600">{team.team_gas}</p>
                    <p className="text-xs text-gray-600">Team GAs</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Team Size</p>
                    <p className="text-xl font-bold text-blue-600">{team.team_size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Avg GA/DSE</p>
                    <p className="text-xl font-bold text-purple-600">
                      {(team.team_gas / team.team_size).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Top DSE</p>
                    <p className="text-xl font-bold text-green-600">{team.top_dse_ga_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Incentive</p>
                    <p className="text-lg font-bold text-green-700">
                      KES {(team.team_incentive / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setViewMode('dses');
                    setSelectedTeamLead(team.team_lead_msisdn);
                  }}
                  className="mt-4 text-red-600 hover:text-red-700 font-semibold text-sm"
                >
                  View Team Members →
                </button>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'dses' && (
          <>
            {selectedTeamLead && (
              <div className="mb-4">
                <button
                  onClick={() => setSelectedTeamLead(null)}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm"
                >
                  ← View All DSEs
                </button>
              </div>
            )}

            <div className="space-y-3">
              {filteredDSEs.map((dse) => (
                <div
                  key={dse.dse_msisdn}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-600">
                        {dse.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{dse.dse_name}</p>
                        <p className="text-xs text-gray-500">{dse.dse_msisdn}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{dse.ga_count}</p>
                      <p className="text-xs text-gray-600">GAs</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Band</p>
                      <p className="font-semibold text-gray-900">{dse.band_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Team Lead</p>
                      <p className="font-semibold text-gray-700">
                        {teamLeads.find(t => t.team_lead_msisdn === dse.team_lead_msisdn)?.team_lead_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDSEs.length === 0 && (
                <p className="text-center text-gray-600 py-8">No DSEs found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
