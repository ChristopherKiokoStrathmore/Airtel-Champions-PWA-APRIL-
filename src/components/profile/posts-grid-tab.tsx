import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase/client';

interface PostsGridTabProps {
  userId: string;
  onPostClick?: (postId: string) => void;
}

export function PostsGridTab({ userId, onPostClick }: PostsGridTabProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-gray-600 text-sm">Posts will appear here when shared</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onPostClick?.(post.id)}
          className="aspect-square bg-gray-100 rounded overflow-hidden hover:opacity-90 transition-opacity relative group"
        >
          {post.image_url ? (
            <img 
              src={post.image_url} 
              alt="Post" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="text-center p-3">
                <div className="text-2xl mb-1">
                  {post.category?.includes('Network') ? '🌐' :
                   post.category?.includes('Competition') ? '🔄' :
                   post.category?.includes('Launch') ? '🚀' :
                   post.category?.includes('AMB') ? '👤' : '📝'}
                </div>
                <p className="text-xs text-gray-700 line-clamp-3">{post.content}</p>
              </div>
            </div>
          )}
          
          {/* Overlay with stats */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="text-white text-sm flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span>❤️</span> {post.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <span>💬</span> {post.comments_count || 0}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
