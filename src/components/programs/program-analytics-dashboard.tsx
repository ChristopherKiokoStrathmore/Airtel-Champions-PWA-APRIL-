import { useState, useEffect } from 'react';
import { X, TrendingUp, Users, Award, Calendar, ChevronDown, ChevronUp, Target, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getSupabaseClient } from '../../utils/supabase/client';

interface ProgramAnalyticsDashboardProps {
  program: {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    points_value: number;
    folder_id?: string;
  };
  onClose: () => void;
}

interface Analytics {
  total_submissions: number;
  unique_users: number;
  total_points_awarded: number;
  avg_points_per_submission: number;
  first_submission: string | null;
  last_submission: string | null;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  submissions_last_7_days: number;
  submissions_last_30_days: number;
}

interface DailyTrend {
  submission_date: string;
  submissions_count: number;
  unique_users: number;
  total_points: number;
}

interface TopPerformer {
  user_id: string;
  submission_count: number;
  total_points: number;
  last_submission: string;
  user_name?: string;
}

export function ProgramAnalyticsDashboard({ program, onClose }: ProgramAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performers'>('overview');
  const [showAllTrends, setShowAllTrends] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [program.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Load main analytics
      const { data: analyticsData } = await supabase
        .from('program_analytics')
        .select('*')
        .eq('program_id', program.id)
        .single();

      if (analyticsData) {
        setAnalytics(analyticsData);
      }

      // Load daily trends
      const { data: trendsData } = await supabase
        .from('program_daily_trends')
        .select('*')
        .eq('program_id', program.id)
        .order('submission_date', { ascending: false })
        .limit(30);

      if (trendsData) {
        setDailyTrends(trendsData);
      }

      // Load top performers
      const { data: performersData } = await supabase
        .from('program_top_performers')
        .select('*')
        .eq('program_id', program.id)
        .limit(10);

      if (performersData) {
        // Fetch user names
        const userIds = performersData.map(p => p.user_id);
        const { data: usersData } = await supabase
          .from('app_users')
          .select('id, full_name')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u.full_name]) || []);
        
        const performersWithNames = performersData.map(p => ({
          ...p,
          user_name: usersMap.get(p.user_id) || p.user_id
        }));

        setTopPerformers(performersWithNames);
      }
    } catch (err) {
      console.error('[ProgramAnalytics] Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: any = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700',
      pink: 'bg-pink-50 border-pink-200 text-pink-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 border-red-200 text-red-700',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatNumber = (num: number | null) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const trendsToShow = showAllTrends ? dailyTrends : dailyTrends.slice(0, 7);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className={`${getColorClasses(program.color)} border-b-2 p-6 rounded-t-xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{program.icon}</div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{program.title}</h2>
                <p className="text-sm opacity-80">{program.description}</p>
                <div className="mt-2 inline-flex items-center gap-2 bg-white/30 px-3 py-1 rounded-full text-sm font-semibold">
                  <Award className="w-4 h-4" />
                  {program.points_value} points per submission
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'trends'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Trends
            </div>
          </button>
          <button
            onClick={() => setActiveTab('performers')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'performers'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              Top Performers
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && analytics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {formatNumber(analytics.total_submissions)}
                      </div>
                      <div className="text-xs text-blue-700">Total Submissions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {formatNumber(analytics.unique_users)}
                      </div>
                      <div className="text-xs text-green-700">Unique Participants</div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-900">
                        {formatNumber(analytics.total_points_awarded)}
                      </div>
                      <div className="text-xs text-purple-700">Total Points Awarded</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-900">
                        {formatNumber(Math.round(analytics.avg_points_per_submission || 0))}
                      </div>
                      <div className="text-xs text-orange-700">Avg Points/Submission</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                  Submission Status
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-yellow-900">
                      {formatNumber(analytics.pending_count)}
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">Pending Review</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-green-900">
                      {formatNumber(analytics.approved_count)}
                    </div>
                    <div className="text-sm text-green-700 mt-1">Approved</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-red-900">
                      {formatNumber(analytics.rejected_count)}
                    </div>
                    <div className="text-sm text-red-700 mt-1">Rejected</div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  Activity Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">First Submission</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDate(analytics.first_submission)}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Last Submission</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDate(analytics.last_submission)}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Last 7 Days</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatNumber(analytics.submissions_last_7_days)} submissions
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Last 30 Days</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatNumber(analytics.submissions_last_30_days)} submissions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Daily Submission Trends</h3>
                {dailyTrends.length > 7 && (
                  <button
                    onClick={() => setShowAllTrends(!showAllTrends)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-semibold"
                  >
                    {showAllTrends ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show All ({dailyTrends.length} days)
                      </>
                    )}
                  </button>
                )}
              </div>

              {trendsToShow.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No submission data available yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trendsToShow.map((trend, index) => (
                    <div
                      key={trend.submission_date}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-900">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {new Date(trend.submission_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              {trend.unique_users} unique user{trend.unique_users !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {trend.submissions_count}
                          </div>
                          <div className="text-xs text-gray-600">submissions</div>
                          <div className="text-sm text-purple-600 font-semibold mt-1">
                            {formatNumber(trend.total_points)} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top Performers Tab */}
          {activeTab === 'performers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Top Performers (Last 30 Days)
              </h3>

              {topPerformers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No submission data available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <div
                      key={performer.user_id}
                      className={`border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                        index === 0
                          ? 'bg-yellow-50 border-yellow-300'
                          : index === 1
                          ? 'bg-gray-50 border-gray-300'
                          : index === 2
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                              index === 0
                                ? 'bg-yellow-500'
                                : index === 1
                                ? 'bg-gray-500'
                                : index === 2
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                            }`}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{performer.user_name}</div>
                            <div className="text-sm text-gray-600">
                              Last submission: {formatDate(performer.last_submission)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {performer.submission_count}
                          </div>
                          <div className="text-xs text-gray-600">submissions</div>
                          <div className="text-sm text-purple-600 font-semibold mt-1">
                            {formatNumber(performer.total_points)} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}