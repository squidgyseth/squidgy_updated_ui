import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, X, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { notificationsService, Notification } from '../lib/notifications-api';
import { useUser } from '../hooks/useUser';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { userId } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Setup notification listeners and load initial notifications
  useEffect(() => {
    if (!userId) {
      return;
    }


    // Load initial notifications
    loadNotifications();

    // Listen for new notifications (WebSocket managed by GlobalNotificationBell)
    const unsubscribe = notificationsService.onNotification((notification) => {
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only latest 50
      setUnreadCount(prev => prev + 1);
      setHasNewNotification(true);
      
      // Reset animation after a short delay
      setTimeout(() => setHasNewNotification(false), 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await notificationsService.getNotifications(userId, {
        limit: 50,
        offset: 0,
      });
      
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read_status: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      await notificationsService.markAllAsRead(userId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_status: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'facebook':
        return <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center">f</div>;
      case 'instagram':
        return <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded text-white text-xs flex items-center justify-center">i</div>;
      case 'whatsapp':
        return <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center">W</div>;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false); // Reset animation when opening
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        ref={bellRef}
        onClick={toggleDropdown}
        className={`
          relative p-2 rounded-lg transition-all duration-200 
          hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-squidgy-purple
          ${hasNewNotification ? 'animate-pulse' : ''}
          ${isOpen ? 'bg-gray-100' : ''}
        `}
      >
        {hasNewNotification ? (
          <BellRing className="w-5 h-5 text-squidgy-purple" />
        ) : (
          <Bell className="w-5 h-5 text-text-primary" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-squidgy-purple hover:text-squidgy-purple/80 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-text-secondary">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-text-secondary">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  You'll receive notifications here when customers message you
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer
                    ${!notification.read_status ? 'bg-blue-50/50 border-l-2 border-l-squidgy-purple' : ''}
                  `}
                  onClick={() => !notification.read_status && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Message Type Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getMessageTypeIcon(notification.message_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-text-primary text-sm truncate">
                          {notification.sender_name || 'Unknown Sender'}
                        </p>
                        {!notification.read_status && (
                          <div className="w-2 h-2 bg-squidgy-purple rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-text-secondary text-xs mb-1 capitalize">
                        {notification.message_type} • {notification.sender_phone}
                      </p>
                      
                      <p className="text-text-primary text-sm leading-tight overflow-hidden" 
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical'
                         }}>
                        {notification.message_content}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {notification.read_status && (
                          <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  // TODO: Navigate to full notifications page
                  setIsOpen(false);
                }}
                className="text-sm text-squidgy-purple hover:text-squidgy-purple/80 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
