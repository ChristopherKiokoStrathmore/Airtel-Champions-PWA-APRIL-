import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { TrendingUp, Users, Award, MapPin, X, Filter, Globe, MapPinned, UserCheck } from 'lucide-react';

interface Analytics {
  scope: {
    type: 'national' | 'region' | 'zone' | 'zsm';
    value: string | null;
    label: string;
  };
  total_submissions: number;
  today_submissions: number;
  unique_participants: number;
  total_target_users: number;
  participation_rate: number;
  top_performers: Array<{
    user_id: string;
    user_name: string;
    zone: string;
    submission_count: number;
  }>;
  zone_breakdown: Array<{
    zone: string;
    submissions: number;
    is_current: boolean;
  }>;
  zsm_breakdown?: Array<{
    zsm_id: string;
    zsm_name: string;
    zone: string;
    submissions: number;
    team_size: number;
  }>;
  national_comparison?: {
    total_submissions: number;
    unique_participants: number;
    participation_rate: number;
    your_percentage: number;
  } | null;
}

interface ProgramAnalyticsProps {
  programId: string;
  programTitle: string;
  onClose: () => void;
}

export function ProgramAnalytics({ programId, programTitle, onClose }: ProgramAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'scoped' | 'national' | 'zone' | 'zsm'>('scoped');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('tai_user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserRole(userData.role || '');
    }
    loadAnalytics('scoped');
  }, [programId]);

  const loadAnalytics = async (view: string) => {
    try {
      setLoading(true);
      // TAI uses localStorage authentication, not Supabase Auth
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) {
        throw new Error('Not authenticated');
      }

      const userData = JSON.parse(storedUser);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/programs/${programId}/analytics?user_id=${userData.id}&role=${userData.role}&view=${view}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load analytics');
      }

      setAnalytics(data.analytics);
    } catch (err: any) {
      console.error('[Programs] Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view: 'scoped' | 'national' | 'zone' | 'zsm') => {
    setCurrentView(view);
    loadAnalytics(view);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">📊 Analytics</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Failed to load analytics: {error}</p>
            <button
              onClick={() => loadAnalytics('scoped')}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 {programTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">Performance Analytics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Scope Header & Filter Buttons */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-1">
                  📊 Analytics for: {analytics.scope.label}
                </h3>
                <p className="text-sm text-indigo-700">
                  {analytics.scope.type === 'national' && '🌍 Showing nationwide data'}
                  {analytics.scope.type === 'region' && '🗺️ Showing your region data'}
                  {analytics.scope.type === 'zone' && '📍 Showing your zone data'}
                  {analytics.scope.type === 'zsm' && '👥 Showing your team data'}
                </p>
              </div>
            </div>

            {/* Filter Buttons - Only show for ZBM and ZSM */}
            {(userRole === 'zonal_business_manager' || userRole === 'zonal_sales_manager') && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleViewChange('national')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentView === 'national'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-semibold">Nationwide</span>
                </button>

                {userRole === 'zonal_business_manager' && (
                  <button
                    onClick={() => handleViewChange('scoped')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      currentView === 'scoped'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-semibold">My Region</span>
                  </button>
                )}

                {userRole === 'zonal_sales_manager' && (
                  <>
                    <button
                      onClick={() => handleViewChange('zone')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        currentView === 'zone'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <MapPinned className="w-4 h-4" />
                      <span className="text-sm font-semibold">My Zone</span>
                    </button>

                    <button
                      onClick={() => handleViewChange('zsm')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        currentView === 'zsm'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-sm font-semibold">My Team</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* National Comparison (for ZBM/ZSM viewing scoped data) */}
          {analytics.national_comparison && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
              <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                🌍 National Comparison
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-amber-700 mb-1">Your Contribution</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {analytics.national_comparison.your_percentage}%
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    of {analytics.national_comparison.total_submissions} national submissions
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-700 mb-1">Your Participation</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {analytics.participation_rate}%
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    vs {analytics.national_comparison.participation_rate}% nationwide
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-700 mb-1">Performance</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {analytics.participation_rate >= analytics.national_comparison.participation_rate ? '📈' : '📉'}
                    {' '}
                    {analytics.participation_rate >= analytics.national_comparison.participation_rate
                      ? `+${analytics.participation_rate - analytics.national_comparison.participation_rate}%`
                      : `${analytics.participation_rate - analytics.national_comparison.participation_rate}%`
                    }
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {analytics.participation_rate >= analytics.national_comparison.participation_rate
                      ? 'Above average'
                      : 'Below average'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-700 mb-1">Ranking</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {analytics.participation_rate >= analytics.national_comparison.participation_rate ? '🏆' : '💪'}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {analytics.participation_rate >= analytics.national_comparison.participation_rate
                      ? 'Top performer'
                      : 'Keep improving'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Total Submissions</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{analytics.total_submissions}</div>
              <div className="text-xs text-blue-700 mt-1">
                {analytics.today_submissions} today
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Active SEs</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{analytics.unique_participants}</div>
              <div className="text-xs text-green-700 mt-1">
                of {analytics.total_target_users} total
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Participation</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{analytics.participation_rate}%</div>
              <div className="text-xs text-purple-700 mt-1">of target audience</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Zones Active</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{analytics.zone_breakdown.length}</div>
              <div className="text-xs text-orange-700 mt-1">zones participating</div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏆 Top Performers
            </h3>
            {analytics.top_performers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.top_performers.slice(0, 10).map((performer, index) => (
                  <div
                    key={performer.user_id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-amber-700'
                          : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{performer.user_name}</div>
                      <div className="text-sm text-gray-600">
                        {performer.submission_count} submission{performer.submission_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {index < 3 && (
                      <div className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zone Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📍 Zone Breakdown
            </h3>
            {analytics.zone_breakdown.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No zone data available</p>
            ) : (
              <div className="space-y-4">
                {analytics.zone_breakdown
                  .sort((a, b) => b.submissions - a.submissions)
                  .map((zone) => {
                    const percentage = analytics.total_submissions > 0
                      ? Math.round((zone.submissions / analytics.total_submissions) * 100)
                      : 0;

                    return (
                      <div key={zone.zone}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{zone.zone}</span>
                          <span className="text-sm text-gray-600">
                            {zone.submissions} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ZSM Breakdown (for ZBMs viewing their region) */}
          {analytics.zsm_breakdown && analytics.zsm_breakdown.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                👔 ZSM Performance
              </h3>
              <div className="space-y-3">
                {analytics.zsm_breakdown.map((zsm, index) => {
                  const avgSubmissionsPerSE = zsm.team_size > 0
                    ? (zsm.submissions / zsm.team_size).toFixed(1)
                    : '0.0';

                  return (
                    <div
                      key={zsm.zsm_id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{zsm.zsm_name}</div>
                        <div className="text-sm text-gray-600">
                          {zsm.zone} • {zsm.team_size} SEs • Avg: {avgSubmissionsPerSE} submissions/SE
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{zsm.submissions}</div>
                        <div className="text-xs text-gray-500">submissions</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              💡 Insights
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              {analytics.participation_rate < 50 && (
                <p>
                  📉 Participation is at {analytics.participation_rate}%. Consider sending reminders
                  or increasing point rewards.
                </p>
              )}
              {analytics.participation_rate >= 80 && (
                <p>
                  🎉 Excellent! {analytics.participation_rate}% participation rate shows strong
                  engagement.
                </p>
              )}
              {analytics.today_submissions > 0 && (
                <p>
                  ✅ {analytics.today_submissions} submission
                  {analytics.today_submissions !== 1 ? 's' : ''} received today.
                </p>
              )}
              {analytics.zone_breakdown.length > 0 && (
                <p>
                  🏆 {analytics.zone_breakdown[0].zone} is leading with{' '}
                  {analytics.zone_breakdown[0].submissions} submissions.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}