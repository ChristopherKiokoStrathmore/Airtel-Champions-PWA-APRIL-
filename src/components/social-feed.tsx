import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Toast } from './toast';
import { UserProfileModal } from './user-profile-modal';
import { GroupsList } from './groups-list';
import { GroupChat } from './group-chat';
import { GroupCreator } from './group-creator';
import { logPWAAction, ACTION_TYPES } from '../lib/activity-tracker';

// Hashtag Utilities
const HASHTAG_REGEX = /#[a-zA-Z0-9_]+/g;

function extractHashtags(text: string | null | undefined): string[] {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(HASHTAG_REGEX);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
}

function renderTextWithHashtags(text: string | null | undefined, onHashtagClick?: (tag: string) => void): JSX.Element {
  if (!text || typeof text !== 'string') return <></>;
  
  const parts = text.split(HASHTAG_REGEX);
  const hashtags = text.match(HASHTAG_REGEX) || [];
  
  return (
    <>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < hashtags.length && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onHashtagClick) {
                  onHashtagClick(hashtags[index].substring(1).toLowerCase());
                }
              }}
              className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700 hover:underline"
            >
              {hashtags[index]}
            </span>
          )}
        </span>
      ))}
    </>
  );
}

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_zone: string;
  content: string;
  image_url?: string;
  video_url?: string;
  likes: number;
  liked_by: string[];
  comments: Comment[];
  created_at: string;
  hashtags: string[];
  hall_of_fame: boolean;
  likes_count: number;
  comments_count: number;
  is_published: boolean;
}

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

export function SocialFeed({ user, userData, onBack }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [feedMode, setFeedMode] = useState<'public' | 'groups' | 'top'>('public'); // NEW: 3-segment toggle
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // NEW: Selected group
  const [showCreateGroup, setShowCreateGroup] = useState(false); // NEW: Create group modal
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null); // NEW: For hashtag filtering

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPosts = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('id, author_id, author_name, author_role, author_zone, content, image_url, video_url, likes, liked_by, comments, created_at, hashtags, hall_of_fame, likes_count, comments_count, is_published')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading posts:', error);
        // On error, try to load from cache
        const cached = localStorage.getItem('social_posts_cache');
        if (cached && posts.length === 0) {
          try {
            setPosts(JSON.parse(cached));
          } catch (e) { /* ignore parse errors */ }
        }
        setLoading(false);
        return;
      }

      // Validate and normalize data
      if (Array.isArray(data)) {
        const validatedPosts = data.map(post => ({
          ...post,
          comments: Array.isArray(post.comments) ? post.comments : [],
          liked_by: Array.isArray(post.liked_by) ? post.liked_by : [],
        }));
        setPosts(validatedPosts);
        // Cache for offline/error fallback
        try {
          localStorage.setItem('social_posts_cache', JSON.stringify(validatedPosts));
        } catch (e) { /* ignore storage quota errors */ }
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading posts:', error?.message || error);
      // Retry up to 2 times on network failures (TypeError: Failed to fetch)
      if (retryCount < 2 && error?.message?.includes('Failed to fetch')) {
        console.log(`[SocialFeed] Retrying loadPosts (attempt ${retryCount + 2}/3)...`);
        setTimeout(() => loadPosts(retryCount + 1), 1500 * (retryCount + 1));
        return;
      }
      // Fall back to cached data
      const cached = localStorage.getItem('social_posts_cache');
      if (cached && posts.length === 0) {
        try {
          setPosts(JSON.parse(cached));
        } catch (e) { /* ignore parse errors */ }
      }
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: number, likedBy: string[]) => {
    const alreadyLiked = likedBy.includes(userData?.id);
    const newLikes = alreadyLiked ? currentLikes - 1 : currentLikes + 1;
    const newLikedBy = alreadyLiked
      ? likedBy.filter(id => id !== userData?.id)
      : [...likedBy, userData?.id];

    // Optimistic update
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, likes: newLikes, liked_by: newLikedBy }
        : p
    ));

    // Update selected post if viewing detail
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, likes: newLikes, liked_by: newLikedBy });
    }

    try {
      await supabase
        .from('social_posts')
        .update({ likes: newLikes, liked_by: newLikedBy })
        .eq('id', postId);

      console.log(`[Analytics] Post ${alreadyLiked ? 'Unliked' : 'Liked'} by ${userData?.full_name}`);
      logPWAAction(ACTION_TYPES.POST_LIKE, { postId, liked: !alreadyLiked });
    } catch (error) {
      console.error('Error updating like:', error);
      loadPosts();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isDirector = (role: string) => {
    return role === 'director' || role === 'developer';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            title="Back to Home"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold">🌟 Champions Feed</h2>
        </div>
        
        {/* Add Post Button - Top Right */}
        <button
          onClick={() => setShowCreatePost(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg"
        >
          <span className="text-lg">+</span>
          <span>New</span>
        </button>
      </div>

      {/* Hashtag Filter Banner */}
      {selectedHashtag && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">#️⃣</span>
            <div>
              <span className="text-blue-900 font-semibold">#{selectedHashtag}</span>
              <span className="text-blue-700 ml-2">
                ({posts.filter(p => p.content && extractHashtags(p.content).includes(selectedHashtag)).length} posts)
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedHashtag(null)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 3-Segment Toggle - Add Groups Tab */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2 items-center justify-center">
          {/* Public/Groups Tabs */}
          <button
            onClick={() => setFeedMode('public')}
            className={`py-2 px-6 rounded-lg text-sm font-semibold transition-all ${
              feedMode === 'public'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🌍 Public
          </button>
          <button
            onClick={() => setFeedMode('groups')}
            className={`py-2 px-6 rounded-lg text-sm font-semibold transition-all ${
              feedMode === 'groups'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💬 Groups
          </button>
          
          {/* View Toggle - Only show when NOT in Groups mode */}
          {feedMode !== 'groups' && (
            <div className="flex bg-gray-100 rounded-lg p-1 ml-2">
              <button
                onClick={() => setViewMode('feed')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'feed' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Create Group Button - Only show when on Groups tab */}
        {feedMode === 'groups' && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
            >
              <span className="text-lg">+</span>
              <span>Create Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {feedMode === 'groups' ? (
          /* GROUPS MODE - Show Groups or Group Chat */
          selectedGroupId ? (
            <GroupChat 
              groupId={selectedGroupId}
              currentUser={userData}
              onBack={() => {
                console.log('🔙 [SocialFeed] Navigating back to groups list');
                setSelectedGroupId(null);
              }}
            />
          ) : (
            <GroupsList 
              currentUser={userData} 
              onGroupClick={(groupId) => setSelectedGroupId(groupId)}
            />
          )
        ) : feedMode === 'top' ? (
          /* TOP MODE - Show top 10% performers' posts */
          viewMode === 'feed' ? (
            <FeedView 
              posts={posts.filter(p => {
                // Filter for top performers - you can adjust this logic
                const meetsTopCriteria = p.likes >= 10 || p.comments?.length >= 5;
                // Also filter by hashtag if one is selected
                if (selectedHashtag && p.content) {
                  const postHashtags = extractHashtags(p.content);
                  return meetsTopCriteria && postHashtags.includes(selectedHashtag);
                }
                return meetsTopCriteria;
              })} 
              userData={userData}
              onLike={handleLike}
              onPostClick={setSelectedPost}
              onUserClick={setSelectedUserId}
              onHashtagClick={setSelectedHashtag}
              formatTimeAgo={formatTimeAgo}
              isDirector={isDirector}
            />
          ) : (
            <GridView 
              posts={posts.filter(p => {
                const meetsTopCriteria = p.likes >= 10 || p.comments?.length >= 5;
                if (selectedHashtag && p.content) {
                  const postHashtags = extractHashtags(p.content);
                  return meetsTopCriteria && postHashtags.includes(selectedHashtag);
                }
                return meetsTopCriteria;
              })}
              onPostClick={setSelectedPost}
            />
          )
        ) : (
          /* PUBLIC MODE - Show all posts */
          viewMode === 'feed' ? (
            <FeedView 
              posts={selectedHashtag 
                ? posts.filter(p => p.content && extractHashtags(p.content).includes(selectedHashtag))
                : posts
              } 
              userData={userData}
              onLike={handleLike}
              onPostClick={setSelectedPost}
              onUserClick={setSelectedUserId}
              onHashtagClick={setSelectedHashtag}
              formatTimeAgo={formatTimeAgo}
              isDirector={isDirector}
            />
          ) : (
            <GridView 
              posts={selectedHashtag 
                ? posts.filter(p => p.content && extractHashtags(p.content).includes(selectedHashtag))
                : posts
              }
              onPostClick={setSelectedPost}
            />
          )
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          userData={userData}
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            loadPosts();
          }}
          onShowToast={(message: string, type: 'success' | 'error' | 'info') => setToast({ message, type })}
        />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          userData={userData}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          formatTimeAgo={formatTimeAgo}
          isDirector={isDirector}
        />
      )}

      {/* Animations */}
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(1); }
          25% { transform: scale(0.8); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-heartPop {
          animation: heartPop 0.3s ease-in-out;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          currentUser={userData}
          isOwnProfile={selectedUserId === userData?.id}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Group Creator Modal */}
      {showCreateGroup && (
        <GroupCreator
          currentUser={userData}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(groupId) => {
            setShowCreateGroup(false);
            setSelectedGroupId(groupId);
          }}
        />
      )}
    </div>
  );
}

// Feed View Component
function FeedView({ posts, userData, onLike, onPostClick, onUserClick, onHashtagClick, formatTimeAgo, isDirector }: any) {
  const HeartButton = ({ post }: { post: Post }) => {
    const liked = post.liked_by?.includes(userData?.id);
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLike(post.id, post.likes, post.liked_by || []);
        }}
        className="flex items-center gap-2 group relative"
      >
        <div className={`relative transition-transform ${liked ? 'animate-heartPop' : ''}`}>
          {liked ? (
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </div>
        <span className={`text-sm font-semibold ${liked ? 'text-red-600' : 'text-gray-600'}`}>
          {post.likes}
        </span>
      </button>
    );
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {posts.map((post: Post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onPostClick(post)}
          >
            {/* Photo */}
            {post.image_url && (
              <div className="w-full aspect-square bg-gray-100">
                <img
                  src={post.image_url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {/* Author Info */}
              <button 
                onClick={() => onUserClick(post.author_id)}
                className="flex items-center gap-3 mb-4 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {post.author_name?.substring(0, 1) || 'A'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{post.author_name}</p>
                  <p className="text-sm text-gray-600">{post.author_zone} • {formatTimeAgo(post.created_at)}</p>
                </div>
              </button>

              {/* Post Text */}
              <div className="text-gray-900 mb-4 line-clamp-3">
                {renderTextWithHashtags(post.content, onHashtagClick)}
              </div>

              {/* Engagement */}
              <div className="flex items-center gap-6 py-4 border-t border-gray-100">
                <HeartButton post={post} />
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
                </button>
              </div>

              {/* First Comment Preview */}
              {post.comments && post.comments.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-2 items-start">
                    {isDirector(post.comments[0].author_role) && (
                      <span className="text-xl">👑</span>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{post.comments[0].author_name}</span>{' '}
                        <span className="text-gray-700">{post.comments[0].content}</span>
                      </p>
                    </div>
                  </div>
                  {post.comments.length > 1 && (
                    <p className="text-sm text-gray-500 mt-2">
                      View all {post.comments.length} comments
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Instagram-Style Grid View
function GridView({ posts, onPostClick }: any) {
  return (
    <div className="p-2 bg-gray-50">
      <div className="grid grid-cols-3 gap-1 max-w-4xl mx-auto">
        {posts.map((post: Post) => {
          const hasImage = post.image_url;
          
          return (
            <button
              key={post.id}
              onClick={() => onPostClick(post)}
              className="aspect-square overflow-hidden relative group bg-white"
            >
              {hasImage ? (
                <>
                  {/* Image */}
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover Overlay - ONLY ON HOVER */}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex gap-6 text-white">
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                  <p className="text-gray-700 text-sm text-center line-clamp-4 font-medium">{post.content}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Post Detail Modal (Instagram-style)
function PostDetailModal({ post, userData, onClose, onLike, formatTimeAgo, isDirector }: any) {
  const [newComment, setNewComment] = useState('');
  const liked = post.liked_by?.includes(userData?.id);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // Determine author name - provide fallback
    const authorName = userData?.full_name || userData?.name || 'Anonymous';

    const comment = {
      id: Date.now().toString(),
      author_id: userData?.id,
      author_name: authorName, // ✅ Fixed: Always has a value
      author_role: userData?.role,
      content: newComment.trim(),
      created_at: new Date().toISOString()
    };

    const updatedComments = [...(post.comments || []), comment];

    try {
      await supabase
        .from('social_posts')
        .update({ comments: updatedComments })
        .eq('id', post.id);

      post.comments = updatedComments;
      setNewComment('');
      console.log(`[Analytics] Comment added by ${authorName}`);
      logPWAAction(ACTION_TYPES.POST_COMMENT, { postId: post.id });
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-0 md:p-4">
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Left Side - Image */}
        {post.image_url && (
          <div className="md:w-1/2 bg-black flex items-center justify-center">
            <img
              src={post.image_url}
              alt="Post"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Right Side - Details */}
        <div className={`flex flex-col ${post.image_url ? 'md:w-1/2' : 'w-full'}`}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                {post.author_name?.substring(0, 1) || 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.author_name}</p>
                <p className="text-sm text-gray-600">{post.author_zone}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Post Content & Comments */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Original Post */}
            <div className="mb-6">
              <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
              <p className="text-sm text-gray-500 mt-2">{formatTimeAgo(post.created_at)}</p>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Comments ({post.comments?.length || 0})</h4>
              {Array.isArray(post.comments) && post.comments.length > 0 ? (
                post.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    {isDirector(comment.author_role) && (
                      <div className="text-2xl">👑</div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        {comment.author_name}
                        {isDirector(comment.author_role) && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                            Director
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(comment.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No comments yet. Be the first!</p>
              )}
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <button
                onClick={() => onLike(post.id, post.likes, post.liked_by || [])}
                className="flex items-center gap-2"
              >
                {liked ? (
                  <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-gray-600 hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900 mt-3">{post.likes} likes</p>
          </div>

          {/* Add Comment */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Instagram Style */}
      <div className="md:hidden bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {post.author_name?.substring(0, 1) || 'A'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.author_name}</p>
              <p className="text-xs text-gray-600">{post.author_zone}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compact Image */}
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full object-cover flex-shrink-0"
            style={{ height: '250px' }}
          />
        )}

        {/* Interaction Bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-5">
            <button
              onClick={() => onLike(post.id, post.likes, post.liked_by || [])}
              className="flex items-center gap-1.5 text-gray-700 hover:text-red-600 transition-colors"
            >
              {liked ? (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{post.likes}</span>
            </button>
            <div className="flex items-center gap-1.5 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{post.comments?.length || 0}</span>
            </div>
            <button className="text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Caption */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-2">
            <span className="font-semibold text-sm">{post.author_name}</span>
            <div className="text-sm flex-1">
              {renderTextWithHashtags(post.content, () => {})}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(post.created_at)}</p>
        </div>

        {/* Comments Section - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {Array.isArray(post.comments) && post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  {isDirector(comment.author_role) && (
                    <div className="text-lg flex-shrink-0">👑</div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-sm">{comment.author_name}</span>
                      <p className="text-sm flex-1">{comment.content}</p>
                    </div>
                    {isDirector(comment.author_role) && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full inline-block mt-1">
                        Director
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-6 text-sm">No comments yet. Be the first!</p>
          )}
        </div>

        {/* Comment Input - Fixed at bottom */}
        <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {userData?.full_name?.substring(0, 1) || userData?.name?.substring(0, 1) || 'U'}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Post Modal
function CreatePostModal({ userData, onClose, onSuccess, onShowToast }: any) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !imagePreview) {
      onShowToast('Please add a photo or write something!', 'error');
      return;
    }

    // Optional reminder (not blocking) if posting photo without consent checked
    if (imageFile && !hasConsent) {
      const proceed = confirm(
        '📸 Photo Privacy Reminder:\n\n' +
        'If your photo includes customers, please ensure you have their permission.\n\n' +
        'Post anyway?'
      );
      if (!proceed) return;
    }

    setIsPosting(true);

    try {
      // Determine author name - provide fallback for Directors or other roles
      const authorName = userData?.full_name || userData?.name || 'Anonymous';
      const isDirector = userData?.role === 'director';

      const postData = {
        author_id: userData?.id,
        author_name: authorName, // ✅ Fixed: Always has a value
        author_role: userData?.role,
        author_zone: userData?.zone || (isDirector ? 'HQ' : 'Unknown'),
        content: content.trim() || '📸',
        image_url: imagePreview || null,
        likes: 0,
        liked_by: [],
        comments: [],
        created_at: new Date().toISOString(),
        hashtags: extractHashtags(content),
        hall_of_fame: false,
        likes_count: 0,
        comments_count: 0,
        is_published: true
      };

      const { error } = await supabase
        .from('social_posts')
        .insert([postData]);

      if (error) throw error;

      console.log(`[Analytics] Post Created by ${authorName} (${userData?.role})`);
      logPWAAction(ACTION_TYPES.POST_CREATE, { hasImage: !!imagePreview, hasHashtags: extractHashtags(content).length > 0 });
      
      // Directors don't earn points - just motivation message
      if (isDirector) {
        onShowToast('Your motivational post is shared! Keep inspiring the team! 🦅', 'success');
      } else {
        onShowToast('Post shared! Your win is now inspiring others!', 'success');
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating post:', error);
      onShowToast(`Error posting: ${error.message}`, 'error');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Share Your Win 🎯</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
              {userData?.full_name?.substring(0, 1) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userData?.full_name}</p>
              <p className="text-sm text-gray-600">{userData?.zone}</p>
            </div>
          </div>

          {/* Image Upload - PROMINENT */}
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-xl aspect-square object-cover"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-red-300 rounded-xl p-16 text-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors bg-gradient-to-br from-red-50 to-orange-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="text-6xl mb-4">📸</div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Add Photo</p>
              <p className="text-sm text-gray-600">Tap to upload from gallery or camera</p>
            </label>
          )}

          {/* Text Input with Hashtag Highlighting */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Caption (Optional)
            </label>
            <div className="relative">
              {/* Background layer showing highlighted hashtags */}
              <div 
                className="absolute inset-0 px-4 py-3 border-2 border-gray-300 rounded-xl overflow-hidden pointer-events-none whitespace-pre-wrap break-words"
                style={{ 
                  color: 'transparent',
                  lineHeight: '1.5rem'
                }}
              >
                {renderTextWithHashtags(content || '\u00A0', () => {})}
              </div>
              {/* Actual textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a caption... Share your win, tip, or story! 🎯 Use #hashtags!"
                className="relative w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24 bg-transparent"
                style={{ lineHeight: '1.5rem' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">💡 Use #hashtags to categorize your post (e.g., #saleswin #marketvisit)</p>
          </div>

          {/* Consent */}
          {imageFile && (
            <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <input
                type="checkbox"
                id="consent"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-1 w-5 h-5 text-red-600"
              />
              <label htmlFor="consent" className="flex-1 text-sm text-gray-700">
                <span className="font-semibold">Customer gave permission for photo</span>
                <p className="text-gray-600 mt-1">Required when posting photos with customers</p>
              </label>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Post Tips:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Photos get 3x more engagement!</li>
              <li>• Share your wins, tips & techniques</li>
              <li>• Be positive and helpful</li>
              <li>• Respect customer privacy</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={isPosting || (!content.trim() && !imagePreview)}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg font-semibold"
          >
            {isPosting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Posting...
              </>
            ) : (
              '🚀 Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}