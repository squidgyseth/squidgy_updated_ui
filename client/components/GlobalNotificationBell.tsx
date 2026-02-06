import { useEffect, useRef } from 'react';
import { useUser } from '../hooks/useUser';
import { notificationsService } from '../lib/notifications-api';
import { toast } from 'sonner';

/**
 * Global NotificationBell component that works on all pages
 * Only handles WebSocket connection and background notifications
 * No UI - just the connection logic
 */
export default function GlobalNotificationBell() {
  const { userId, isAuthenticated } = useUser();
  const isConnectedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId || !isAuthenticated) {
      if (isConnectedRef.current) {
        notificationsService.disconnectWebSocket();
        isConnectedRef.current = false;
      }
      return;
    }

    // Skip if already connected to same user
    if (isConnectedRef.current && lastUserIdRef.current === userId) {
      return;
    }


    // Connect to WebSocket for real-time notifications
    notificationsService.connectWebSocket(userId);
    isConnectedRef.current = true;
    lastUserIdRef.current = userId;

    // Listen for new notifications (global handler)
    const unsubscribe = notificationsService.onNotification((notification) => {
      
      // Play notification sound globally
      notificationsService.playNotificationSound();
      
      // Show toast notification globally
      toast.success(`New message from ${notification.sender_name || 'Unknown'}`, {
        description: notification.message_content.slice(0, 100) + (notification.message_content.length > 100 ? '...' : ''),
        duration: 5000,
      });
      
    });

    // Request notification permission
    notificationsService.requestNotificationPermission();
    
    // Handle page visibility changes to maintain connection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconnect if connection was lost while tab was hidden
        if (!isConnectedRef.current && userId) {
          notificationsService.connectWebSocket(userId);
          isConnectedRef.current = true;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityListenerRef.current = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    return () => {
      unsubscribe();
      notificationsService.disconnectWebSocket();
      isConnectedRef.current = false;
      lastUserIdRef.current = null;
      
      // Clean up visibility listener
      if (visibilityListenerRef.current) {
        visibilityListenerRef.current();
        visibilityListenerRef.current = null;
      }
    };
  }, [userId, isAuthenticated]);

  // This component has no visual output
  return null;
}
