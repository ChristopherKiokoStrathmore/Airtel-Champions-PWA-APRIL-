// HBB Notifications — Real-time polling notification system
import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle, UserPlus, AlertTriangle, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { getNotifications, markNotificationsRead } from './hbb-api';

const ACCENT = '#E60000';
const POLL_INTERVAL = 15000; // 15 seconds

export interface HBBNotification {
  id: string;
  type: 'allocated' | 'status_change' | 'new_lead' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  sr_number?: string;
  meta?: Record<string, any>;
}

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  allocated: { icon: UserPlus, color: '#10B981', bg: '#ECFDF5' },
  status_change: { icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  new_lead: { icon: CheckCircle, color: '#3B82F6', bg: '#EFF6FF' },
  system: { icon: AlertTriangle, color: '#6B7280', bg: '#F3F4F6' },
};

// ─── NOTIFICATION BELL (top bar) ────────────────────────────────────────────
export function NotificationBell({ userPhone, role }: { userPhone: string; role: 'agent' | 'installer' }) {
  const [notifications, setNotifications] = useState<HBBNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getNotifications(userPhone, role);
      if (Array.isArray(result)) {
        setNotifications(result);
      }
    } catch (err) {
      // Silently fail on poll errors
    }
  }, [userPhone, role]);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  const handleOpen = () => {
    setShowPanel(true);
  };

  const handleClose = async () => {
    setShowPanel(false);
    // Mark all as read
    if (unreadCount > 0) {
      try {
        await markNotificationsRead(userPhone, role);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        // Silently fail
      }
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    handleClose();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 transition-colors"
      >
        <Bell className="w-4 h-4 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: '#EF4444' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />
          <div className="fixed inset-x-0 top-0 z-50 max-h-[85vh] flex flex-col bg-white rounded-b-3xl shadow-2xl"
            style={{ animation: 'hbb-notif-slide-down 0.25s ease-out' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
                  <Bell className="w-4 h-4" style={{ color: ACCENT }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Notifications</h3>
                  <p className="text-[11px] text-gray-500">{unreadCount} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
                    <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
                <button onClick={handleClose} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No notifications right now</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(notif => {
                    const cfg = NOTIF_ICONS[notif.type] || NOTIF_ICONS.system;
                    const Icon = cfg.icon;
                    const timeAgo = getTimeAgo(notif.timestamp);

                    return (
                      <div key={notif.id}
                        className={`px-4 py-3 flex items-start gap-3 transition-colors ${!notif.read ? 'bg-red-50/40' : ''}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cfg.bg }}>
                          <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT }} />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {notif.sr_number && (
                              <span className="text-[10px] font-mono text-gray-400">{notif.sr_number}</span>
                            )}
                            <span className="text-[10px] text-gray-400">{timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes hbb-notif-slide-down {
              from { transform: translateY(-100%); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </>
      )}
    </>
  );
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}
