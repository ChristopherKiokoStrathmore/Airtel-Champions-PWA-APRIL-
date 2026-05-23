import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

interface ActivityTabProps {
  userId: string;
}

interface Activity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'achievement' | 'rank';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export function ActivityTab({ userId }: ActivityTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const allActivities: Activity[] = [];

      // Get posts
      const { data: posts } = await supabase
        .from('social_posts')
        .select('id, content, created_at, category')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (posts) {
        posts.forEach(post => {
          allActivities.push({
            id: `post-${post.id}`,
            type: 'post',
            title: 'Posted a new insight',
            description: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            timestamp: post.created_at,
            icon: '📝'
          });
        });
      }

      // Get comments
      const { data: comments } = await supabase
        .from('social_comments')
        .select('id, content, created_at, post_id')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (comments) {
        comments.forEach(comment => {
          allActivities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            title: 'Commented on a post',
            description: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
            timestamp: comment.created_at,
            icon: '💬'
          });
        });
      }

      // Get likes
      const { data: likes } = await supabase
        .from('social_likes')
        .select('id, created_at, post_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (likes) {
        // Group likes by day
        const likesByDay: Record<string, number> = {};
        likes.forEach(like => {
          const day = new Date(like.created_at).toDateString();
          likesByDay[day] = (likesByDay[day] || 0) + 1;
        });

        Object.entries(likesByDay).forEach(([day, count]) => {
          allActivities.push({
            id: `likes-${day}`,
            type: 'like',
            title: `Liked ${count} post${count > 1 ? 's' : ''}`,
            description: '',
            timestamp: new Date(day).toISOString(),
            icon: '❤️'
          });
        });
      }

      // Sort all activities by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activities:', error);
      setLoading(false);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
        <p className="text-gray-600 text-sm">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
              {activity.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">{getRelativeTime(activity.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
