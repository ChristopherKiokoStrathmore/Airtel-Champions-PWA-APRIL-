import React, { useState } from 'react';

interface AnnouncementCardProps {
  announcement: {
    id: string;
    author_name: string;
    author_role: string;
    title?: string;
    message: string;
    priority: 'normal' | 'high' | 'urgent';
    announcement_type?: 'text' | 'video';
    video_url?: string;
    video_duration?: number;
    is_read: boolean;
    created_at: string;
  };
  onMarkAsRead?: (id: string) => void;
}

export function AnnouncementCard({ announcement, onMarkAsRead }: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(announcement.is_read);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityStyles = () => {
    switch (announcement.priority) {
      case 'urgent':
        return {
          border: 'border-red-200',
          bg: 'bg-gradient-to-br from-red-50 to-orange-50',
          icon: announcement.announcement_type === 'video' ? '🎥' : '🔥',
          badge: 'bg-red-600 text-white',
          badgeText: 'URGENT'
        };
      case 'high':
        return {
          border: 'border-orange-200',
          bg: 'bg-gradient-to-br from-orange-50 to-yellow-50',
          icon: announcement.announcement_type === 'video' ? '🎥' : '⚡',
          badge: 'bg-orange-600 text-white',
          badgeText: 'HIGH'
        };
      default:
        return {
          border: 'border-blue-200',
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          icon: announcement.announcement_type === 'video' ? '🎥' : '📢',
          badge: 'bg-blue-600 text-white',
          badgeText: 'INFO'
        };
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'director': 'S & D Director',
      'hq_staff': 'HQ Command Center',
      'hq_command_center': 'HQ Command Center'
    };
    return roleMap[role] || role;
  };

  const styles = getPriorityStyles();

  const handleReadMore = () => {
    setExpanded(!expanded);
    if (!isRead && onMarkAsRead) {
      setIsRead(true);
      onMarkAsRead(announcement.id);
    }
  };

  const handleVideoPlay = () => {
    if (!isRead && onMarkAsRead) {
      setIsRead(true);
      onMarkAsRead(announcement.id);
    }
  };

  const shortMessage = announcement.message.length > 100 
    ? announcement.message.substring(0, 100) + '...'
    : announcement.message;

  const isVideoAnnouncement = announcement.announcement_type === 'video' && announcement.video_url;

  return (
    <div 
      className={`${styles.bg} ${styles.border} border-2 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
        !isRead ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-900 text-sm">
              {isVideoAnnouncement ? 'Video Announcement' : 'Announcement'} from {announcement.author_name}
            </p>
            {!isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            )}
          </div>
          <p className="text-xs text-gray-600">
            {getRoleDisplay(announcement.author_role)}
          </p>
        </div>

        {/* Priority Badge */}
        <div className={`${styles.badge} px-2 py-1 rounded-lg text-xs font-bold`}>
          {styles.badgeText}
        </div>
      </div>

      {/* Title (if exists) */}
      {announcement.title && (
        <h3 className="font-bold text-gray-900 text-base mb-2">
          {announcement.title}
        </h3>
      )}

      {/* Video Player */}
      {isVideoAnnouncement && (
        <div className="mb-3">
          <video
            src={announcement.video_url}
            controls
            onPlay={handleVideoPlay}
            className="w-full rounded-xl bg-gray-900"
            preload="metadata"
          />
          {announcement.video_duration && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <span>⏱️</span>
              Duration: {formatDuration(announcement.video_duration)}
            </p>
          )}
        </div>
      )}

      {/* Text Message (for text announcements or video captions) */}
      {!isVideoAnnouncement && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {expanded ? announcement.message : shortMessage}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          📅 {getTimeAgo(announcement.created_at)}
        </p>

        {!isVideoAnnouncement && announcement.message.length > 100 && (
          <button
            onClick={handleReadMore}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>
                Show less
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Read more
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
