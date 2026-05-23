import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StatsTabProps {
  userId: string;
}

export function StatsTab({ userId }: StatsTabProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalEngagement: 0,
    avgLikesPerPost: 0,
    hallOfFamePosts: 0,
    activeDays: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get last 30 days of submissions for points
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: submissions } = await supabase
        .from('submissions')
        .select('points_earned, created_at, status')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'approved');

      // Group by day
      const pointsByDay: Record<string, number> = {};
      const last30Days: string[] = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(dateStr);
        pointsByDay[dateStr] = 0;
      }

      submissions?.forEach(sub => {
        const dateStr = new Date(sub.created_at).toISOString().split('T')[0];
        if (pointsByDay.hasOwnProperty(dateStr)) {
          pointsByDay[dateStr] += sub.points_earned || 0;
        }
      });

      // Create chart data
      const data = last30Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: pointsByDay[date] || 0
      }));

      setChartData(data);

      // Calculate summary stats
      const { data: posts } = await supabase
        .from('social_posts')
        .select('id, likes_count, hall_of_fame')
        .eq('author_id', userId);

      const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
      const totalPosts = posts?.length || 0;
      const hallOfFamePosts = posts?.filter(post => post.hall_of_fame).length || 0;

      const { data: comments } = await supabase
        .from('social_comments')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId);

      const totalComments = comments || 0;
      const totalEngagement = totalLikes + totalComments;
      
      // Count active days (days with points > 0)
      const activeDays = Object.values(pointsByDay).filter(p => p > 0).length;

      setSummary({
        totalEngagement,
        avgLikesPerPost: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
        hallOfFamePosts,
        activeDays
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 30-Day Points Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4">30-Day Points Trend</h3>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              />
              <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{summary.totalEngagement}</div>
            <div className="text-sm text-blue-800 mt-1">Total Engagement</div>
            <div className="text-xs text-blue-600 mt-1">Likes + Comments</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{summary.avgLikesPerPost}</div>
            <div className="text-sm text-purple-800 mt-1">Avg Likes/Post</div>
            <div className="text-xs text-purple-600 mt-1">Per post average</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600">{summary.hallOfFamePosts}</div>
            <div className="text-sm text-yellow-800 mt-1">Hall of Fame</div>
            <div className="text-xs text-yellow-600 mt-1">Featured posts</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-600">{summary.activeDays}</div>
            <div className="text-sm text-green-800 mt-1">Active Days</div>
            <div className="text-xs text-green-600 mt-1">Last 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
