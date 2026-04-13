interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'urgent' | 'high' | 'normal';
  created_by: string;
  created_by_name: string;
  created_by_role: string;
  target_roles: string[];
  created_at: string;
  is_read?: boolean;
  read_by?: string[];
}

interface AnnouncementsModalProps {
  onClose: () => void;
  announcements: Announcement[];
  onMarkAsRead: (id: string) => void;
}

export function AnnouncementsModal({ onClose, announcements, onMarkAsRead }: AnnouncementsModalProps) {
  const unreadCount = announcements.filter(a => !a.is_read).length;

  // Debug: Log announcements to see what we're getting
  console.log('[AnnouncementsModal] 🔍 Announcements received:', announcements);

  const markAllAsRead = () => {
    announcements.forEach(a => {
      if (!a.is_read) {
        onMarkAsRead(a.id);
      }
    });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          borderColor: 'border-red-600',
          bgColor: 'bg-red-50',
          badgeColor: 'bg-red-600',
          badgeText: 'URGENT',
        };
      case 'high':
        return {
          borderColor: 'border-yellow-600',
          bgColor: 'bg-yellow-50',
          badgeColor: 'bg-yellow-600',
          badgeText: 'IMPORTANT',
        };
      case 'normal':
        return {
          borderColor: 'border-blue-600',
          bgColor: 'bg-blue-50',
          badgeColor: 'bg-blue-600',
          badgeText: 'INFO',
        };
      default:
        return {
          borderColor: 'border-gray-600',
          bgColor: 'bg-gray-50',
          badgeColor: 'bg-gray-600',
          badgeText: 'NOTICE',
        };
    }
  };

  const getAuthorInitial = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'sales_executive': 'Sales Executive',
      'zonal_sales_manager': 'Zone Sales Manager',
      'zonal_business_manager': 'Zonal Business Manager',
      'hq_staff': 'HQ Command Center',
      'hq_command_center': 'HQ Command Center',
      'director': 'Director',
      'developer': 'Developer'
    };
    return roleMap[role] || role;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in" 
        onClick={onClose}
      ></div>
      
      {/* Modal - slides up from bottom */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              📢 Announcements
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 ? (
                <span className="text-red-600 font-medium">{unreadCount} unread</span>
              ) : (
                <span className="text-green-600">All caught up!</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all read
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
              <p className="text-sm text-gray-600">You don't have any announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => {
                const styles = getPriorityStyles(announcement.priority);
                
                // Support both old and new property names for backward compatibility
                const authorName = announcement.created_by_name || (announcement as any).author_name || 'Unknown';
                const authorRole = announcement.created_by_role || (announcement as any).author_role || 'Staff';
                
                return (
                  <div
                    key={announcement.id}
                    className={`relative border-l-4 ${styles.borderColor} ${styles.bgColor} rounded-lg p-4 shadow-sm ${
                      !announcement.is_read ? 'ring-2 ring-blue-300' : ''
                    }`}
                  >
                    {/* Priority Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`${styles.badgeColor} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {styles.badgeText}
                      </span>
                    </div>

                    {/* Author Info */}
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 border-2 border-white shadow-md">
                        {getAuthorInitial(authorName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{authorName}</p>
                        <p className="text-xs text-gray-600">{getRoleDisplayName(authorRole)}</p>
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(announcement.created_at)}</p>
                    </div>

                    {/* Title */}
                    {announcement.title && (
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        {announcement.title}
                      </h3>
                    )}

                    {/* Message */}
                    <p className="text-sm text-gray-800 leading-relaxed mb-4">
                      {announcement.message}
                    </p>

                    {/* Actions */}
                    {!announcement.is_read && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onMarkAsRead(announcement.id)}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark as Read
                        </button>
                      </div>
                    )}

                    {announcement.is_read && (
                      <div className="flex items-center text-green-600 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Read</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}