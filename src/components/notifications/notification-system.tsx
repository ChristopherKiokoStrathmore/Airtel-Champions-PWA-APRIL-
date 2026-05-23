import { useState, useEffect } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import { Bell, X, AlertCircle, CheckCircle, Info, FileText } from 'lucide-react';
import { useBadge } from '../../hooks/useBadge';

interface Notification {
  id: string;
  user_id: string;
  type: 'new_program' | 'program_update' | 'submission_approved' | 'submission_rejected' | 'achievement';
  title: string;
  message: string;
  data?: any; // Can contain program_id, submission_id, etc.
  read: boolean;
  created_at: string;
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationSystem({ onNotificationClick }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { setBadge } = useBadge();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${getCurrentUserId()}`
        },
        (payload) => {
          console.log('[Notifications] New notification received:', payload);
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => {
            const next = prev + 1;
            setBadge(next); // ── PWA Badging API — live badge update ──
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUserId = () => {
    try {
      const storedUser = localStorage.getItem('tai_user');
      if (!storedUser) return null;
      const user = JSON.parse(storedUser);
      return user.id || user.employee_id;
    } catch (err) {
      return null;
    }
  };

  const loadNotifications = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[Notifications] Error loading:', error);
        return;
      }

      setNotifications(data || []);
      const count = data?.filter(n => !n.read).length || 0;
      setUnreadCount(count);
      setBadge(count); // ── PWA Badging API ──
    } catch (err) {
      console.error('[Notifications] Error:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('[Notifications] Error marking as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        setBadge(next); // ── PWA Badging API ──
        return next;
      });
    } catch (err) {
      console.error('[Notifications] Error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('[Notifications] Error marking all as read:', error);
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setBadge(0); // ── PWA Badging API — clear badge when all read ──
    } catch (err) {
      console.error('[Notifications] Error:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_program':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'program_update':
        return <Info className="w-5 h-5 text-purple-600" />;
      case 'submission_approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'submission_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'achievement':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-all ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: now.getFullYear() !== then.getFullYear() ? 'numeric' : undefined
  });
}
