import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Send, X, Flag, Trash2, Award } from 'lucide-react';
import { usePageTracking } from '../hooks/usePageTracking';
import { trackAction, ANALYTICS_PAGES, ANALYTICS_ACTIONS } from '../utils/analytics';

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  location: string | null;
  program_name: string | null;
  likes_count: number;
  comments_count: number;
  reshares_count: number;
  shares_count: number;
  is_hall_of_fame: boolean;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
    zone: string;
    region: string;
    profile_image: string | null;
  };
  score?: number;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    role: string;
    zone: string;
    profile_image: string | null;
  } | null;
}

// Mock data generator
const generateMockPosts = (currentUser: any): Post[] => {
  const mockUsers = [
    { id: '1', full_name: 'JOHN KAMAU', role: 'sales_executive', zone: 'Nairobi Central', region: 'Nairobi' },
    { id: '2', full_name: 'MARY WANJIRU', role: 'sales_executive', zone: 'Mombasa North', region: 'Coast' },
    { id: '3', full_name: 'PETER OMONDI', role: 'zonal_sales_manager', zone: 'Kisumu East', region: 'Western' },
    { id: '4', full_name: 'JANE AKINYI', role: 'sales_executive', zone: currentUser.zone, region: currentUser.region },
    { id: '5', full_name: 'DAVID MWANGI', role: 'zonal_business_manager', zone: 'Nakuru West', region: 'Rift Valley' },
  ];

  return [
    {
      id: 'post-1',
      user_id: '1',
      content: '🎯 MAJOR COMPETITOR INTEL: Just spotted Safaricom offering free data bundles (1GB) to new customers in Westlands CBD. Promotion running till Friday. We need to respond ASAP with our bundle offers!\n\nDetails:\n✅ Free 1GB on first recharge\n✅ Valid for 24 hours  \n✅ Heavy marketing at supermarkets\n\n#CompetitorIntel #NetworkQuality',
      image_url: null,
      location: 'Westlands, Nairobi',
      program_name: 'Competitor Intelligence',
      likes_count: 24,
      comments_count: 5,
      reshares_count: 3,
      shares_count: 1,
      is_hall_of_fame: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { ...mockUsers[0], profile_image: null },
      score: 98
    },
    {
      id: 'post-2',
      user_id: '2',
      content: '📡 NETWORK QUALITY WIN! Our 4G signal strength in Nyali area is EXCELLENT! \n\nJust completed 20 speed tests:\n⚡ Avg Download: 25 Mbps\n⚡ Avg Upload: 12 Mbps  \n⚡ Latency: <50ms\n\n3 customers switched from Safaricom today! They love the consistent speeds. #NetworkQuality #CustomerWin',
      image_url: null,
      location: 'Nyali, Mombasa',
      program_name: 'Network Quality',
      likes_count: 18,
      comments_count: 3,
      reshares_count: 2,
      shares_count: 0,
      is_hall_of_fame: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      user: { ...mockUsers[1], profile_image: null },
      score: 76
    },
    {
      id: 'post-3',
      user_id: '3',
      content: '🏆 TEAM MILESTONE ACHIEVED!\n\nMy team hit 150% of monthly target with 5 days to spare!\n\nWinning Strategy:\n1️⃣ Focus on youth market (18-25 age group)\n2️⃣ Bundle data + social media packages\n3️⃣ Weekend activations at colleges\n4️⃣ Referral bonuses\n\nTotal new activations: 347 this month\nLet\'s keep this momentum! 💪\n\n#SalesWin #TeamWork #Leadership',
      image_url: null,
      location: 'Kisumu',
      program_name: 'Sales Achievement',
      likes_count: 42,
      comments_count: 8,
      reshares_count: 5,
      shares_count: 2,
      is_hall_of_fame: true,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      user: { ...mockUsers[2], profile_image: null },
      score: 120
    },
    {
      id: 'post-4',
      user_id: '4',
      content: `💡 Customer feedback: They love our 4G speeds but want more affordable night bundles. Opportunity here! #CustomerFeedback`,
      image_url: null,
      location: currentUser.zone,
      program_name: 'Customer Intelligence',
      likes_count: 15,
      comments_count: 4,
      reshares_count: 1,
      shares_count: 0,
      is_hall_of_fame: false,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      user: { ...mockUsers[3], profile_image: null },
      score: 64
    },
    {
      id: 'post-5',
      user_id: '5',
      content: '📊 Regional analysis: 65% of customers prefer weekly bundles over monthly. Let\'s adjust our pitch strategy. #DataInsights #Strategy',
      image_url: null,
      location: 'Nakuru',
      program_name: 'Market Intelligence',
      likes_count: 31,
      comments_count: 6,
      reshares_count: 4,
      shares_count: 1,
      is_hall_of_fame: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user: { ...mockUsers[4], profile_image: null },
      score: 88
    },
  ];
};

export function ExploreFeed({ currentUser, onUserClick }: { currentUser: any; onUserClick?: (user: any) => void }) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.EXPLORE);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [hallOfFamePosts, setHallOfFamePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'trending' | 'my_zone'>('recent');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ExploreFeed] 🔄 USING LOCAL MODE - NO SERVER CALLS');
    
    // 🔄 FORCE REFRESH: Clear old cached posts to get updated user names
    // This ensures that if user data changes in the database, it reflects in the UI
    const lastRefresh = localStorage.getItem('tai_posts_last_refresh');
    const now = Date.now();
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    if (!lastRefresh || (now - parseInt(lastRefresh)) > REFRESH_INTERVAL) {
      console.log('[ExploreFeed] ♻️ Clearing cached posts (auto-refresh)');
      localStorage.removeItem('tai_explore_posts');
      localStorage.setItem('tai_posts_last_refresh', now.toString());
    }
    
    fetchPosts();
    fetchHallOfFame();
  }, [filter]);

  const fetchPosts = () => {
    console.log('[ExploreFeed] 📦 Loading mock posts from localStorage');
    setLoading(true);
    
    // Get posts from localStorage or generate mock data
    const storedPosts = localStorage.getItem('tai_explore_posts');
    let allPosts: Post[];
    
    if (storedPosts) {
      allPosts = JSON.parse(storedPosts);
    } else {
      allPosts = generateMockPosts(currentUser);
      localStorage.setItem('tai_explore_posts', JSON.stringify(allPosts));
    }

    // Filter posts based on selection
    let filteredPosts = [...allPosts];
    
    if (filter === 'my_zone') {
      filteredPosts = allPosts.filter(post => post.user.zone === currentUser.zone);
    } else if (filter === 'trending') {
      filteredPosts = allPosts.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
      // Recent - sort by created_at
      filteredPosts = allPosts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    console.log(`[ExploreFeed] ✅ Loaded ${filteredPosts.length} posts (filter: ${filter})`);
    setPosts(filteredPosts);
    setLoading(false);
  };

  const fetchHallOfFame = () => {
    const storedPosts = localStorage.getItem('tai_explore_posts');
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      const hofPosts = allPosts.filter(post => post.is_hall_of_fame);
      setHallOfFamePosts(hofPosts);
      console.log(`[ExploreFeed] 🏆 Loaded ${hofPosts.length} Hall of Fame posts`);
    }
  };

  const handleLike = (postId: string) => {
    console.log('[ExploreFeed] ❤️ Like post:', postId);
    
    // Update posts
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, likes_count: post.likes_count + 1 }
        : post
    );
    setPosts(updatedPosts);
    
    // Update localStorage
    const storedPosts = localStorage.getItem('tai_explore_posts');
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      const updated = allPosts.map(post =>
        post.id === postId
          ? { ...post, likes_count: post.likes_count + 1 }
          : post
      );
      localStorage.setItem('tai_explore_posts', JSON.stringify(updated));
    }
  };

  const handleReshare = (postId: string) => {
    console.log('[ExploreFeed] 🔄 Reshare post:', postId);
    
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, reshares_count: post.reshares_count + 1 }
        : post
    );
    setPosts(updatedPosts);
    
    const storedPosts = localStorage.getItem('tai_explore_posts');
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      const updated = allPosts.map(post =>
        post.id === postId
          ? { ...post, reshares_count: post.reshares_count + 1 }
          : post
      );
      localStorage.setItem('tai_explore_posts', JSON.stringify(updated));
    }
    
    alert('Post reshared! 🎉');
  };

  const handleShare = (postId: string) => {
    console.log('[ExploreFeed] 📤 Share post:', postId);
    setShowShareSheet(true);
    setTimeout(() => setShowShareSheet(false), 2000);
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    
    // Load comments from localStorage
    const storedComments = localStorage.getItem(`tai_comments_${post.id}`);
    if (storedComments) {
      setComments(JSON.parse(storedComments));
    } else {
      setComments([]);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      post_id: selectedPost.id,
      user_id: currentUser.id,
      comment_text: newComment,
      created_at: new Date().toISOString(),
      user: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        role: currentUser.role,
        zone: currentUser.zone,
        profile_image: null
      }
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    
    // Save to localStorage
    localStorage.setItem(`tai_comments_${selectedPost.id}`, JSON.stringify(updatedComments));
    
    // Update comment count
    const updatedPosts = posts.map(post =>
      post.id === selectedPost.id
        ? { ...post, comments_count: post.comments_count + 1 }
        : post
    );
    setPosts(updatedPosts);
    
    setNewComment('');
    console.log('[ExploreFeed] 💬 Comment added');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!selectedPost) return;
    
    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);
    localStorage.setItem(`tai_comments_${selectedPost.id}`, JSON.stringify(updatedComments));
    console.log('[ExploreFeed] 🗑️ Comment deleted');
  };

  const handleEscalateToHallOfFame = (postId: string) => {
    console.log('[ExploreFeed] 🏆 Escalate to Hall of Fame:', postId);
    
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, is_hall_of_fame: true }
        : post
    );
    setPosts(updatedPosts);
    
    const storedPosts = localStorage.getItem('tai_explore_posts');
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      const updated = allPosts.map(post =>
        post.id === postId
          ? { ...post, is_hall_of_fame: true }
          : post
      );
      localStorage.setItem('tai_explore_posts', JSON.stringify(updated));
    }
    
    fetchHallOfFame();
    alert('Post added to Hall of Fame! 🏆');
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    
    const storedPosts = localStorage.getItem('tai_explore_posts');
    if (storedPosts) {
      const allPosts: Post[] = JSON.parse(storedPosts);
      const updated = allPosts.filter(post => post.id !== postId);
      localStorage.setItem('tai_explore_posts', JSON.stringify(updated));
    }
    
    console.log('[ExploreFeed] 🗑️ Post deleted');
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: currentUser.id,
      content: newPostContent,
      image_url: newPostImage,
      location: currentUser.zone,
      program_name: 'General Intelligence',
      likes_count: 0,
      comments_count: 0,
      reshares_count: 0,
      shares_count: 0,
      is_hall_of_fame: false,
      created_at: new Date().toISOString(),
      user: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        role: currentUser.role,
        zone: currentUser.zone,
        region: currentUser.region,
        profile_image: null
      },
      score: 50
    };

    const storedPosts = localStorage.getItem('tai_explore_posts');
    const allPosts: Post[] = storedPosts ? JSON.parse(storedPosts) : [];
    const updated = [newPost, ...allPosts];
    localStorage.setItem('tai_explore_posts', JSON.stringify(updated));

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setNewPostImage(null);
    setShowCreatePost(false);
    
    console.log('[ExploreFeed] ✨ Post created');
    alert('Post created! 🎉 +10 points');
  };

  const viewProfile = (userId: string) => {
    console.log('[ExploreFeed] 👤 View profile:', userId);
    if (onUserClick) {
      // Find the post user and create a user object with proper structure
      const post = posts.find(p => p.user.id === userId);
      if (post) {
        const userProfile = {
          id: post.user.id,
          full_name: post.user.full_name,
          role: post.user.role,
          zone: post.user.zone,
          region: post.user.region,
          employee_id: post.user.id, // Fallback if employee_id not available
        };
        onUserClick(userProfile);
      }
    } else {
      alert('Profile view feature - coming soon!');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'director': return 'bg-purple-500 text-white';
      case 'hq_staff': return 'bg-blue-500 text-white';
      case 'zonal_business_manager': return 'bg-green-500 text-white';
      case 'zonal_sales_manager': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Director';
      case 'hq_staff': return 'HQ';
      case 'zonal_business_manager': return 'ZBM';
      case 'zonal_sales_manager': return 'ZSM';
      default: return 'SE';
    }
  };

  const PostCard = ({ post }: { post: Post }) => {
    const [showMenu, setShowMenu] = useState(false);
    const canDelete = post.user_id === currentUser.id || 
                      ['director', 'hq_staff', 'zonal_business_manager', 'zonal_sales_manager'].includes(currentUser.role);
    const canEscalate = ['director', 'hq_staff'].includes(currentUser.role) && !post.is_hall_of_fame;

    return (
      <div className="bg-white border-b border-gray-200">
        {/* User Info Bar */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1" onClick={() => viewProfile(post.user.id)}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white">
              {post.user.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{post.user.full_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(post.user.role)}`}>
                  {getRoleLabel(post.user.role)}
                </span>
                {post.is_hall_of_fame && (
                  <Award className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="text-xs text-gray-500">{post.user.zone} • {post.user.region}</div>
            </div>
          </div>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 relative"
          >
            <MoreVertical className="w-5 h-5" />
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-10">
                {canEscalate && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleEscalateToHallOfFame(post.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>Hall of Fame</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    alert('Report feature coming soon');
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report</span>
                </button>
                {canDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleDeletePost(post.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </button>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.location && (
            <div className="text-xs text-gray-500 mt-2">📍 {post.location}</div>
          )}
          {post.program_name && (
            <div className="text-xs text-blue-600 mt-1">#{post.program_name}</div>
          )}
        </div>

        {/* Post Image */}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full max-h-96 object-cover"
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <button 
            onClick={() => handleLike(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm">{post.likes_count}</span>
          </button>
          <button 
            onClick={() => openComments(post)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </button>
          <button 
            onClick={() => handleReshare(post.id)}
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm">{post.reshares_count}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">🌟 Explore</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                localStorage.removeItem('tai_explore_posts');
                localStorage.removeItem('tai_posts_last_refresh');
                fetchPosts();
                fetchHallOfFame();
              }}
              className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm hover:bg-opacity-30 transition-colors"
            >
              🔄 Refresh
            </button>
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
              LOCAL MODE
            </div>
          </div>
        </div>
      </div>

      {/* Hall of Fame Carousel */}
      {hallOfFamePosts.length > 0 && (
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" />
            Hall of Fame
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {hallOfFamePosts.map(post => (
              <div 
                key={post.id}
                onClick={() => {
                  const postInFeed = posts.find(p => p.id === post.id);
                  if (postInFeed) openComments(postInFeed);
                }}
                className="flex-shrink-0 w-32 cursor-pointer"
              >
                <div className="bg-white rounded-lg border-2 border-yellow-400 overflow-hidden">
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Hall of Fame" 
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-2">
                    <div className="text-xs font-medium truncate">{post.user.full_name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes_count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            filter === 'recent' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setFilter('trending')}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            filter === 'trending' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Trending 🔥
        </button>
        <button
          onClick={() => setFilter('my_zone')}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            filter === 'my_zone' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          My Zone
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <p className="text-gray-500 mb-2">No posts in this view</p>
            <p className="text-sm text-gray-400">Try a different filter or create a post!</p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Comments Bottom Sheet */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">💬 Comments ({comments.length})</h3>
              <button onClick={() => setSelectedPost(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-sm flex-shrink-0">
                      {comment.user?.full_name.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-2xl px-4 py-2">
                        <div className="text-sm font-medium">{comment.user?.full_name || 'Unknown'}</div>
                        <p className="text-sm mt-1">{comment.comment_text}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-2">
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleTimeString()}
                        </span>
                        {comment.user_id === currentUser.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Sheet */}
      {showShareSheet && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50">
          Link copied to clipboard! 📋
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button onClick={() => setShowCreatePost(false)}>
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-semibold">✨ Create Post</h3>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>

            {/* Post Form */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-lg">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{currentUser.full_name}</div>
                  <div className="text-xs text-gray-500">{currentUser.zone}</div>
                </div>
              </div>

              {/* Content Input */}
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's happening in the field? Share your insights... #CompetitorIntel #SalesWin"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                rows={6}
                maxLength={280}
                style={{ fontSize: '16px' }}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {newPostContent.length}/280
              </div>

              {/* Tips */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm text-blue-900 font-medium mb-2">💡 Tips for great posts:</div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Use hashtags to categorize (#CompetitorIntel, #NetworkQuality)</li>
                  <li>• Share specific insights from the field</li>
                  <li>• Keep it professional and actionable</li>
                  <li>• Max 5 hashtags per post</li>
                </ul>
              </div>

              {/* Points Indicator */}
              <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-900 font-medium">🎯 Points Earnings</div>
                    <div className="text-xs text-green-700 mt-1">Base post: +10 points</div>
                  </div>
                  <div className="text-2xl">💎</div>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  + Likes, comments, reshares earn more points!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-40"
      >
        <span className="text-2xl">✨</span>
      </button>
    </div>
  );
}