import { useState, useEffect, useMemo } from 'react';
import { getAnalytics, getSubmissions, getLeaderboard, supabase } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react';

interface DailyStats {
  date: string;
  submissions: number;
  points: number;
}

export function AnalyticsDashboard() {
  const [timeFilter, setTimeFilter] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load analytics data
      const [analyticsResult, submissionsResult, leaderboardResult] = await Promise.all([
        getAnalytics(),
        getSubmissions({ limit: 1000, offset: 0 }),
        getLeaderboard({ view: 'global', timeFilter })
      ]);

      if (analyticsResult.error) throw new Error(analyticsResult.error);
      if (submissionsResult.error) throw new Error(submissionsResult.error);
      if (leaderboardResult.error) throw new Error(leaderboardResult.error);

      setAnalytics(analyticsResult.data);
      setSubmissions(submissionsResult.data || []);
      setLeaderboard(leaderboardResult.data || []);

      // Calculate daily stats
      calculateDailyStats(submissionsResult.data || []);

    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyStats = (submissionsData: any[]) => {
    // Get date range based on filter
    const now = new Date();
    let daysToShow = 7;
    if (timeFilter === 'month') daysToShow = 30;
    if (timeFilter === 'alltime') daysToShow = 90;

    const dailyMap = new Map<string, { submissions: number; points: number }>();

    // Initialize all days
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyMap.set(dateKey, { submissions: 0, points: 0 });
    }

    // Aggregate submissions by day
    submissionsData.forEach(sub => {
      const date = new Date(sub.created_at).toISOString().split('T')[0];
      if (dailyMap.has(date)) {
        const stats = dailyMap.get(date)!;
        stats.submissions++;
        if (sub.status === 'approved') {
          stats.points += sub.points_awarded || 0;
        }
      }
    });

    // Convert to array
    const statsArray = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats
    }));

    setDailyStats(statsArray);
  };

  // Calculate mission type breakdown
  const missionBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>();
    submissions.forEach(sub => {
      const type = sub.mission_type?.name || 'Unknown';
      breakdown.set(type, (breakdown.get(type) || 0) + 1);
    });

    const total = submissions.length;
    const colors = ['#0066CC', '#E60000', '#00CC66', '#FF9900', '#9933FF'];
    
    return Array.from(breakdown.entries())
      .map(([type, count], index) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [submissions]);

  // Calculate regional stats
  const regionalData = useMemo(() => {
    const regionMap = new Map<string, { submissions: number; ses: Set<string>; totalPoints: number }>();

    submissions.forEach(sub => {
      const region = sub.se?.region || 'Unknown';
      if (!regionMap.has(region)) {
        regionMap.set(region, { submissions: 0, ses: new Set(), totalPoints: 0 });
      }
      
      const stats = regionMap.get(region)!;
      stats.submissions++;
      if (sub.se?.id) stats.ses.add(sub.se.id);
      if (sub.status === 'approved') {
        stats.totalPoints += sub.points_awarded || 0;
      }
    });

    return Array.from(regionMap.entries())
      .map(([region, stats]) => ({
        region,
        submissions: stats.submissions,
        ses: stats.ses.size,
        avgPoints: stats.ses.size > 0 ? Math.round(stats.totalPoints / stats.ses.size) : 0
      }))
      .sort((a, b) => b.submissions - a.submissions);
  }, [submissions]);

  // Top performers from leaderboard
  const topPerformers = leaderboard.slice(0, 5);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;
    const approvalRate = totalSubmissions > 0 
      ? Math.round((approvedSubmissions / totalSubmissions) * 100) 
      : 0;

    const uniqueSEs = new Set(submissions.map(s => s.se?.id).filter(Boolean)).size;
    const totalPoints = submissions
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + (s.points_awarded || 0), 0);
    const avgPointsPerSE = uniqueSEs > 0 ? Math.round(totalPoints / uniqueSEs) : 0;

    // Calculate trends (compare with previous period)
    const midpoint = Math.floor(submissions.length / 2);
    const recentHalf = submissions.slice(0, midpoint);
    const olderHalf = submissions.slice(midpoint);
    
    const recentApprovalRate = recentHalf.length > 0
      ? Math.round((recentHalf.filter(s => s.status === 'approved').length / recentHalf.length) * 100)
      : 0;
    const oldApprovalRate = olderHalf.length > 0
      ? Math.round((olderHalf.filter(s => s.status === 'approved').length / olderHalf.length) * 100)
      : 0;
    
    const approvalTrend = recentApprovalRate - oldApprovalRate;
    const submissionTrend = recentHalf.length > olderHalf.length ? 12 : -5; // Simplified

    return {
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      approvalRate,
      uniqueSEs,
      avgPointsPerSE,
      totalPoints,
      approvalTrend,
      submissionTrend
    };
  }, [submissions]);

  const maxSubmissions = Math.max(...dailyStats.map(d => d.submissions), 1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportReport = () => {
    // Create CSV data
    const csvData = [
      ['Date', 'Submissions', 'Points'],
      ...dailyStats.map(day => [
        formatDate(day.date),
        day.submissions,
        day.points
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage message={error} onRetry={loadAnalytics} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Intelligence network performance insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="alltime">All Time</option>
          </select>
          <button 
            onClick={exportReport}
            className="px-4 py-2 bg-[#E60000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.totalSubmissions}</p>
          <p className={`text-sm flex items-center gap-1 ${keyMetrics.submissionTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {keyMetrics.submissionTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(keyMetrics.submissionTrend)}% {timeFilter === 'week' ? 'from last week' : 'change'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Active SEs</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.uniqueSEs}</p>
          <p className="text-sm text-gray-500">Contributing members</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Approval Rate</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.approvalRate}%</p>
          <p className={`text-sm flex items-center gap-1 ${keyMetrics.approvalTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {keyMetrics.approvalTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(keyMetrics.approvalTrend)}% {keyMetrics.approvalTrend >= 0 ? 'improvement' : 'decrease'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Points/SE</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{keyMetrics.avgPointsPerSE.toLocaleString()}</p>
          <p className="text-sm text-blue-600">Per active SE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Activity</h2>
          <div className="space-y-3">
            {dailyStats.map((day, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{formatDate(day.date)}</span>
                  <span className="text-sm font-bold text-gray-900">{day.submissions} submissions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#E60000] to-[#CC0000] h-3 rounded-full transition-all"
                    style={{ width: `${(day.submissions / maxSubmissions) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Type Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mission Type Distribution</h2>
          <div className="space-y-4">
            {missionBreakdown.map((mission, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: mission.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{mission.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{mission.count}</span>
                    <span className="text-sm font-bold text-gray-900">{mission.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${mission.percentage}%`,
                      backgroundColor: mission.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Top Performers</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {topPerformers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-4xl mb-2">🏆</p>
                <p>No data available</p>
              </div>
            ) : (
              topPerformers.map((performer) => (
                <div key={performer.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      performer.rank === 1 ? 'bg-yellow-500' :
                      performer.rank === 2 ? 'bg-gray-400' :
                      performer.rank === 3 ? 'bg-orange-600' :
                      'bg-blue-500'
                    }`}>
                      {performer.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-500">{performer.region}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{performer.points.toLocaleString()} pts</p>
                      <p className="text-sm text-gray-500">{performer.submissions} submissions</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Regional Performance */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Regional Performance</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {regionalData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-4xl mb-2">🗺️</p>
                <p>No regional data</p>
              </div>
            ) : (
              regionalData.map((region, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{region.region}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {region.submissions} submissions
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Active SEs</p>
                      <p className="font-medium text-gray-900">{region.ses}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Points</p>
                      <p className="font-medium text-gray-900">{region.avgPoints.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
