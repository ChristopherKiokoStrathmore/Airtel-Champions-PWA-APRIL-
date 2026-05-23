import { memo, useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Send, Flag, Trash2, Award } from 'lucide-react';

interface PostCardProps {
  post: {
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
  };
  currentUser: any;
  onLike: (postId: string) => void;
  onComment: (post: any) => void;
  onReshare: (post: any) => void;
  onDelete: (postId: string) => void;
  onEscalate: (postId: string) => void;
  onViewProfile: (userId: string) => void;
  onImageClick: (post: any) => void;
}

// Memoized helper functions
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

export const OptimizedPostCard = memo(function PostCard({
  post,
  currentUser,
  onLike,
  onComment,
  onReshare,
  onDelete,
  onEscalate,
  onViewProfile,
  onImageClick
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const canDelete = post.user_id === currentUser.id || 
                    ['director', 'hq_staff', 'zonal_business_manager', 'zonal_sales_manager'].includes(currentUser.role);
  const canEscalate = ['director', 'hq_staff'].includes(currentUser.role) && !post.is_hall_of_fame;

  const handleLikeClick = useCallback(() => {
    onLike(post.id);
  }, [onLike, post.id]);

  const handleCommentClick = useCallback(() => {
    onComment(post);
  }, [onComment, post]);

  const handleReshareClick = useCallback(() => {
    onReshare(post);
  }, [onReshare, post]);

  const handleDeleteClick = useCallback(() => {
    setShowMenu(false);
    onDelete(post.id);
  }, [onDelete, post.id]);

  const handleEscalateClick = useCallback(() => {
    setShowMenu(false);
    onEscalate(post.id);
  }, [onEscalate, post.id]);

  const handleProfileClick = useCallback(() => {
    onViewProfile(post.user.id);
  }, [onViewProfile, post.user.id]);

  const handleImageClick = useCallback(() => {
    onImageClick(post);
  }, [onImageClick, post]);

  return (
    <div className="bg-white border-b border-gray-200">
      {/* User Info Bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={handleProfileClick}>
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
                  onClick={handleEscalateClick}
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
                  onClick={handleDeleteClick}
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
          onClick={handleImageClick}
          loading="lazy"
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
            onClick={handleLikeClick}
            className="flex items-center gap-1 text-gray-600 hover:text-red-600"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm">{post.likes_count}</span>
          </button>
          <button 
            onClick={handleCommentClick}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments_count}</span>
          </button>
          <button 
            onClick={handleReshareClick}
            className="flex items-center gap-1 text-gray-600 hover:text-green-600"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm">{post.reshares_count}</span>
          </button>
        </div>
        <button className="text-gray-600 hover:text-gray-800">
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Timestamp */}
      <div className="px-4 pb-3 text-xs text-gray-400">
        {new Date(post.created_at).toLocaleString()}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.reshares_count === nextProps.post.reshares_count &&
    prevProps.post.is_hall_of_fame === nextProps.post.is_hall_of_fame
  );
});
