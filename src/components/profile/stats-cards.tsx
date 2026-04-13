import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

interface StatsCardsProps {
  userId: string;
}

export function StatsCards({ userId }: StatsCardsProps) {
  const [stats, setStats] = useState({
    rank: 0,
    points: 0,
    posts: 0,
    followers: 0,
    following: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get user's points
      const { data: userData } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', userId)
        .single();

      const userPoints = userData?.total_points || 0;

      // Calculate rank (count users with more points)
      const { count: higherRankedCount } = await supabase
        .from('app_users')
        .select('id', { count: 'exact', head: true })
        .gt('total_points', userPoints);

      const rank = (higherRankedCount || 0) + 1;

      // Count posts from social_posts table
      const { count: postsCount } = await supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId);

      // For now, followers/following are 0 (will be implemented later)
      // When follows table exists, uncomment:
      // const { count: followersCount } = await supabase
      //   .from('follows')
      //   .select('id', { count: 'exact', head: true })
      //   .eq('following_id', userId);
      
      // const { count: followingCount } = await supabase
      //   .from('follows')
      //   .select('id', { count: 'exact', head: true })
      //   .eq('follower_id', userId);

      setStats({
        rank,
        points: userPoints,
        posts: postsCount || 0,
        followers: 0, // followersCount || 0
        following: 0  // followingCount || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-gray-100 rounded-xl p-3 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Rank', value: `#${stats.rank}`, icon: '🏆', color: 'text-yellow-600' },
    { label: 'Points', value: stats.points, icon: '⭐', color: 'text-blue-600' },
    { label: 'Posts', value: stats.posts, icon: '📝', color: 'text-purple-600' },
    { label: 'Followers', value: stats.followers, icon: '👥', color: 'text-green-600' },
    { label: 'Following', value: stats.following, icon: '🔗', color: 'text-orange-600' }
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
