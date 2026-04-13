interface UrgentAnnouncementCardProps {
  id: string;
  title: string;
  message: string;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  onDismiss: (id: string) => void;
}

export function UrgentAnnouncementCard({
  id,
  title,
  message,
  created_by_name,
  created_by_role,
  created_at,
  onDismiss,
}: UrgentAnnouncementCardProps) {
  const getAuthorInitials = (name: string) => {
    if (!name || name === 'Unknown') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative bg-white border-l-4 border-red-600 rounded-lg shadow-md p-4 mb-4">
      {/* URGENT Badge */}
      <div className="absolute top-4 right-4">
        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
          🔥 URGENT
        </span>
      </div>

      {/* Author Info */}
      <div className="flex items-start mb-3 pr-24">
        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3 border-2 border-white shadow-md flex-shrink-0">
          {getAuthorInitials(created_by_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{created_by_name}</p>
          <p className="text-xs text-gray-600">{getRoleDisplayName(created_by_role)}</p>
        </div>
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-base font-bold text-gray-900 mb-2">
          {title}
        </h3>
      )}

      {/* Message */}
      <p className="text-sm text-gray-800 leading-relaxed mb-3">
        {message}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{formatDate(created_at)}</p>
        <button
          onClick={() => onDismiss(id)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Dismiss
        </button>
      </div>
    </div>
  );
}
