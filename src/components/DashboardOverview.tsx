import { useEffect, useState } from 'react';
import { getAnalytics, getSubmissions } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load analytics
      const { data: analyticsData, error: analyticsError } = await getAnalytics();
      if (analyticsError) throw new Error(analyticsError);

      // Load recent submissions
      const { data: submissionsData, error: submissionsError } = await getSubmissions({ 
        limit: 5,
        status: 'all'
      });
      if (submissionsError) throw new Error(submissionsError);

      setStats(analyticsData);
      setSubmissions(submissionsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const statsDisplay = [
    { 
      label: 'Total Submissions', 
      value: stats?.totalSubmissions?.toString() || '0', 
      change: '+12%', 
      trend: 'up' 
    },
    { 
      label: 'Pending Review', 
      value: stats?.pendingSubmissions?.toString() || '0', 
      change: '-5%', 
      trend: 'down' 
    },
    { 
      label: 'Active SEs', 
      value: stats?.activeSEs?.toString() || '0', 
      change: '70%', 
      trend: 'neutral' 
    },
    { 
      label: 'Total Points', 
      value: stats?.totalPoints?.toLocaleString() || '0', 
      change: '+18%', 
      trend: 'up' 
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Real-time intelligence network monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <span className={`text-xs px-2 py-1 rounded ${
                stat.trend === 'up' ? 'bg-green-100 text-green-700' :
                stat.trend === 'down' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Submissions</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No submissions yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Executive</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{submission.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {submission.se?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {submission.mission_type?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.points_awarded || 0} pts
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {submission.status === 'pending' ? '⏳ Pending' :
                           submission.status === 'approved' ? '✅ Approved' :
                           '❌ Rejected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAgo(submission.submitted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-[#E60000] hover:text-[#CC0000] font-medium">
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button className="text-sm text-[#E60000] hover:text-[#CC0000] font-medium">
                View All Submissions →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">Pending Reviews</h3>
          <p className="text-white/80 mb-4">
            {stats?.pendingSubmissions || 0} submissions need your attention
          </p>
          <button className="bg-white text-[#E60000] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Review Now
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-xl p-6 text-white">
          <h3 className="text-lg font-bold mb-2">Post Announcement</h3>
          <p className="text-white/80 mb-4">Communicate with all field teams</p>
          <button className="bg-white text-[#0066CC] px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Create Announcement
          </button>
        </div>
      </div>
    </div>
  );
}