import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Send, X, Flag, Trash2, Award, Camera, Image as ImageIcon } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAuthHeaders } from '../utils/api-helper';
import { UserProfileModalEnhanced } from './user-profile-modal-enhanced';
import { GroupsListScreen } from './groups-list-screen';
import { GroupChat } from './group-chat';
import { CreateGroupModalEnhanced } from './create-group-modal-enhanced';
import { fetchWithTimeout } from '../utils/network';

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

export function ExploreFeed({ currentUser }: { currentUser: any }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hallOfFamePosts, setHallOfFamePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'trending' | 'my_zone'>('recent');
  const [viewMode, setViewMode] = useState<'public' | 'groups' | 'top'>('public'); // NEW: Main toggle
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false); // NEW: Create group modal
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // NEW: Selected group
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [isUploadingPost, setIsUploadingPost] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    fetchHallOfFame();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const zone = filter === 'my_zone' ? currentUser.zone : undefined;
      const queryParams = new URLSearchParams({
        filter: filter === 'my_zone' ? 'recent' : filter,
        ...(zone && { zone }),
        limit: '20',
        offset: '0'
      });

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts?${queryParams}`;

      const response = await fetchWithTimeout(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }, 30000); // 30 second timeout

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error fetching posts:', errorData);
        
        // Check if this is a permission error - temporary until Edge Function restarts
        if (errorData.error?.includes('permission denied')) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        throw new Error('Failed to fetch posts: ' + errorData.error);
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHallOfFame = async () => {
    try {
      const response = await fetchWithTimeout(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/hall-of-fame`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        },
        30000 // 30 second timeout
      );

      if (!response.ok) throw new Error('Failed to fetch hall of fame');

      const data = await response.json();
      setHallOfFamePosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching hall of fame:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${postId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: currentUser.id }),
        }
      );

      if (!response.ok) throw new Error('Failed to like post');

      const data = await response.json();
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes_count: data.likes_count }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${post.id}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch comments');

      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${selectedPost.id}/comment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            user_id: currentUser.id,
            comment_text: newComment
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add comment');

      const data = await response.json();
      
      // Update local state
      setComments([...comments, data.comment]);
      setNewComment('');
      
      // Update comment count
      setPosts(posts.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: data.comments_count }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setNewPostImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPostImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      alert('Please write something');
      return;
    }

    if (newPostContent.length > 280) {
      alert('Post must be 280 characters or less');
      return;
    }

    setIsUploadingPost(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (newPostImageFile) {
        const formData = new FormData();
        formData.append('file', newPostImageFile);
        formData.append('user_id', currentUser.id);
        formData.append('bucket_type', 'postImages');

        const uploadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/upload-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      // Create post
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            content: newPostContent,
            image_url: imageUrl,
            location: currentUser.zone || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create post' }));
        console.error('Create post error:', errorData);
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = await response.json();
      alert(`Post created successfully! +${data.points_earned} points earned!`);
      
      // Reset form
      setNewPostContent('');
      setNewPostImage(null);
      setNewPostImageFile(null);
      setShowCreatePost(false);
      
      // Refresh feed
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post');
    } finally {
      setIsUploadingPost(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${selectedPost.id}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: currentUser.id }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete comment');

      const data = await response.json();
      
      // Update local state
      setComments(comments.filter(c => c.id !== commentId));
      
      // Update comment count
      setPosts(posts.map(post => 
        post.id === selectedPost.id 
          ? { ...post, comments_count: data.comments_count }
          : post
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReshare = async (post: Post) => {
    const caption = prompt('Add a caption for your reshare (optional):');
    if (caption === null) return; // User cancelled

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${post.id}/reshare`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            user_id: currentUser.id,
            caption: caption || undefined
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reshare');

      alert('Post reshared successfully! +10 points');
      fetchPosts(); // Refresh feed
    } catch (error) {
      console.error('Error resharing post:', error);
      alert('Failed to reshare post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            user_id: currentUser.id,
            role: currentUser.role
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete post');

      alert('Post deleted successfully');
      fetchPosts(); // Refresh feed
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleEscalateToHallOfFame = async (postId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts/${postId}/escalate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            user_id: currentUser.id,
            role: currentUser.role
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to escalate to Hall of Fame');

      const data = await response.json();
      alert(`Post added to Hall of Fame! Post owner earned +${data.bonus_points} bonus points!`);
      fetchPosts();
      fetchHallOfFame();
    } catch (error) {
      console.error('Error escalating post:', error);
      alert('Failed to escalate post to Hall of Fame');
    }
  };

  const viewProfile = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/users/${userId}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setSelectedUserId(userId);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
                <span className="text-sm">{post.user.full_name}</span>
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

        {/* Image */}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full object-cover cursor-pointer"
            style={{ aspectRatio: '4/3' }}
            onClick={() => {
              setSelectedImage(post);
              setShowImageModal(true);
            }}
          />
        )}

        {/* Caption */}
        <div className="p-4">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          {post.location && (
            <div className="text-xs text-gray-500 mt-2">📍 {post.location}</div>
          )}
          {post.program_name && (
            <div className="text-xs text-blue-600 mt-1">📊 Program: {post.program_name}</div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleLike(post.id)}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600"
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">{post.likes_count}</span>
            </button>
            <button 
              onClick={() => openComments(post)}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments_count}</span>
            </button>
            <button 
              onClick={() => handleReshare(post)}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">{post.reshares_count}</span>
            </button>
          </div>
          <button 
            onClick={() => setShowShareSheet(true)}
            className="text-gray-600 hover:text-gray-800"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Timestamp */}
        <div className="px-4 pb-3 text-xs text-gray-400">
          {new Date(post.created_at).toLocaleString()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header with Create Group Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl">🔍 Explore</h1>
          <p className="text-xs text-gray-500">Intelligence Network</p>
        </div>
        {viewMode === 'groups' && (
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
          >
            <span className="text-xl">+</span>
          </button>
        )}
      </div>

      {/* 3-Segment Toggle */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('public')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'public'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🌍 Public
          </button>
          <button
            onClick={() => setViewMode('groups')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'groups'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💬 Groups
          </button>
          <button
            onClick={() => setViewMode('top')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'top'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⭐ TOP
          </button>
        </div>
      </div>

      {/* Hall of Fame Carousel */}
      {hallOfFamePosts.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-white" />
            <span className="text-white">🏆 HALL OF FAME</span>
          </div>
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
                    <div className="text-xs truncate">{post.user.full_name}</div>
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

      {/* Content Area - Conditional based on viewMode */}
      {viewMode === 'public' ? (
        /* PUBLIC FEED */
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-900 font-semibold text-lg mb-2">No Posts Yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  {filter === 'my_zone' 
                    ? `No posts from ${currentUser.zone} zone yet. Be the first to share intelligence!`
                    : 'No posts in the feed yet. Check back soon or try a different filter.'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Posts appear here when Sales Executives share competitor intel, market insights, and field reports.
                </p>
                <button
                  onClick={() => fetchPosts()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh Feed
                </button>
              </div>
            </div>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} />)
          )}
        </div>
      ) : viewMode === 'groups' ? (
        /* GROUPS LIST OR GROUP CHAT */
        selectedGroupId ? (
          <GroupChat 
            groupId={selectedGroupId}
            currentUser={currentUser}
            onBack={() => {
              console.log('🔙 [ExploreFeed] Navigating back to groups list');
              setSelectedGroupId(null);
            }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <GroupsListScreen 
              currentUser={currentUser} 
              onSelectGroup={(groupId) => {
                setSelectedGroupId(groupId);
              }}
              onCreateGroup={() => setShowCreateGroup(true)}
            />
          </div>
        )
      ) : (
        /* TOP PERFORMERS FEED */
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-4">
                <div className="text-center">
                  <div className="text-4xl mb-3">⭐</div>
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">Top 10% Performers</h3>
                  <p className="text-sm text-yellow-700">Learn from the best Sales Executives</p>
                </div>
              </div>
              {posts.filter((post, index) => index < Math.ceil(posts.length * 0.1)).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No top performer posts yet</p>
                </div>
              ) : (
                posts
                  .filter((post, index) => index < Math.ceil(posts.length * 0.1))
                  .map(post => <PostCard key={post.id} post={post} />)
              )}
            </div>
          )}
        </div>
      )}

      {/* Comments Bottom Sheet */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg">💬 Comments ({comments.length})</h3>
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs flex-shrink-0">
                      {comment.user?.full_name.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{comment.user?.full_name || 'Unknown'}</span>
                        {comment.user && (
                          <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(comment.user.role)}`}>
                            {getRoleLabel(comment.user.role)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment_text}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                        {(comment.user_id === currentUser.id || selectedPost.user_id === currentUser.id) && (
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

      {/* Profile Modal */}
      {showProfileModal && selectedUserId && (
        <UserProfileModalEnhanced
          userId={selectedUserId}
          currentUser={currentUser}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
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
              <h3 className="text-lg">✨ Create Post</h3>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || isUploadingPost}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isUploadingPost ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
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

              {/* Photo Upload */}
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {newPostImage ? (
                  <div className="relative">
                    <img
                      src={newPostImage}
                      alt="Post preview"
                      className="w-full rounded-xl object-cover max-h-64"
                    />
                    <button
                      onClick={() => {
                        setNewPostImage(null);
                        setNewPostImageFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="font-semibold">Add Photo</span>
                  </button>
                )}
              </div>

              {/* Tips */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-sm text-blue-900 mb-2">💡 Tips for great posts:</div>
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
                    <div className="text-sm text-green-900">🎯 Points Earnings</div>
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

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end">
          <div className="bg-white rounded-t-3xl w-full h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-sm">
                  {selectedImage.user.full_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{selectedImage.user.full_name}</div>
                  <div className="text-xs text-gray-500">{selectedImage.user.zone}</div>
                </div>
              </div>
              <button onClick={() => setShowImageModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image - Compact */}
            {selectedImage.image_url && (
              <img 
                src={selectedImage.image_url} 
                alt="Post" 
                className="w-full object-cover flex-shrink-0"
                style={{ height: '240px' }}
              />
            )}

            {/* Interaction Bar - Right below image */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => handleLike(selectedImage.id)}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <Heart className="w-6 h-6" />
                  <span className="text-sm font-medium">{selectedImage.likes_count}</span>
                </button>
                <button 
                  className="flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{selectedImage.comments_count}</span>
                </button>
                <button 
                  onClick={() => handleReshare(selectedImage)}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                  <span className="text-sm font-medium">{selectedImage.reshares_count}</span>
                </button>
              </div>
              <button 
                onClick={() => setShowShareSheet(true)}
                className="text-gray-700 hover:text-gray-900"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>

            {/* Caption */}
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-sm">{selectedImage.user.full_name}</span>
                <p className="text-sm flex-1">{selectedImage.content}</p>
              </div>
              {selectedImage.location && (
                <div className="text-xs text-gray-500 mt-2">📍 {selectedImage.location}</div>
              )}
              {selectedImage.program_name && (
                <div className="text-xs text-blue-600 mt-1">📊 Program: {selectedImage.program_name}</div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {new Date(selectedImage.created_at).toLocaleString()}
              </div>
            </div>

            {/* Comments Section - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {comments.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs flex-shrink-0">
                        {comment.user?.full_name.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-sm">{comment.user?.full_name || 'Unknown'}</span>
                          <p className="text-sm flex-1">{comment.comment_text}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                          {(comment.user_id === currentUser.id || selectedImage.user_id === currentUser.id) && (
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
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input - Fixed at bottom */}
            <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs flex-shrink-0">
                  {currentUser.full_name.charAt(0)}
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
      )}

      {/* Group Creator Modal */}
      {showCreateGroup && (
        <CreateGroupModalEnhanced
          currentUser={currentUser}
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