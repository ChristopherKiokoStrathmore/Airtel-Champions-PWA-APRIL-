import React, { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  author_name: string;
  author_role: string;
  title?: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  target_roles: string[];
  is_active: boolean;
  read_by: string[];
  created_at: string;
}

interface AnnouncementsFeedProps {
  userData: any;
}

export function AnnouncementsFeed({ userData }: AnnouncementsFeedProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, [userData?.role, userData?.id]);

  const loadAnnouncements = () => {
    if (!userData?.role) return;

    try {
      setLoading(true);
      
      // Load all announcements from localStorage
      const allAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
      
      // Filter announcements for current user's role
      const filteredAnnouncements = allAnnouncements.filter((ann: Announcement) => {
        // Skip inactive announcements
        if (!ann.is_active) return false;
        
        // Check if announcement is targeted to user's role
        if (!ann.target_roles || !ann.target_roles.includes(userData.role)) {
          return false;
        }
        
        return true;
      });
      
      // Sort by created_at (newest first)
      filteredAnnouncements.sort((a: Announcement, b: Announcement) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setAnnouncements(filteredAnnouncements);
    } catch (err: any) {
      console.error('[Announcements] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (announcementId: string) => {
    try {
      // Load all announcements
      const allAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
      
      // Find and update the announcement
      const updatedAnnouncements = allAnnouncements.map((ann: Announcement) => {
        if (ann.id === announcementId) {
          if (!ann.read_by) ann.read_by = [];
          if (!ann.read_by.includes(userData.id)) {
            ann.read_by.push(userData.id);
          }
        }
        return ann;
      });
      
      // Save back to localStorage
      localStorage.setItem('tai_announcements', JSON.stringify(updatedAnnouncements));
      
      // Update local state
      setAnnouncements(prev =>
        prev.map(a => {
          if (a.id === announcementId) {
            const updatedReadBy = [...(a.read_by || [])];
            if (!updatedReadBy.includes(userData.id)) {
              updatedReadBy.push(userData.id);
            }
            return { ...a, read_by: updatedReadBy };
          }
          return a;
        })
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const isRead = (announcement: Announcement) => {
    return announcement.read_by && announcement.read_by.includes(userData?.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-500 text-red-900';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-900';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔥';
      case 'high': return '⚡';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📢</div>
        <p className="text-sm">No announcements at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => {
        const read = isRead(announcement);
        return (
          <div
            key={announcement.id}
            className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
              read ? 'opacity-60' : ''
            } ${getPriorityColor(announcement.priority)}`}
            onClick={() => !read && markAsRead(announcement.id)}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{getPriorityIcon(announcement.priority)}</div>
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {announcement.author_name}
                    </span>
                    {!read && (
                      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                    )}
                  </div>
                  <span className="text-xs opacity-70">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                {announcement.title && (
                  <h4 className="font-bold text-base mb-1">{announcement.title}</h4>
                )}

                {/* Message */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {announcement.message}
                </p>

                {/* Priority Badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    announcement.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                    announcement.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {announcement.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
