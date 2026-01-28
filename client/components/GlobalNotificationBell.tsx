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
      console.log('⚠️ GlobalNotificationBell: No authenticated user');
      if (isConnectedRef.current) {
        console.log('🔌 GLOBAL: Disconnecting due to no user');
        notificationsService.disconnectWebSocket();
        isConnectedRef.current = false;
      }
      return;
    }

    // Skip if already connected to same user
    if (isConnectedRef.current && lastUserIdRef.current === userId) {
      console.log('🔌 GLOBAL: Already connected for user:', userId);
      return;
    }

    console.log('🌍 GLOBAL NOTIFICATION BELL SETUP:');
    console.log('   User ID:', userId);
    console.log('   Authenticated:', isAuthenticated);
    console.log('   Previous User ID:', lastUserIdRef.current);

    // Connect to WebSocket for real-time notifications
    console.log('🔌 GLOBAL: Connecting WebSocket for user:', userId);
    notificationsService.connectWebSocket(userId);
    isConnectedRef.current = true;
    lastUserIdRef.current = userId;

    // Listen for new notifications (global handler)
    const unsubscribe = notificationsService.onNotification((notification) => {
      console.log('🎉 GLOBAL NOTIFICATION: New notification received!');
      console.log('   From:', notification.sender_name);
      console.log('   Message:', notification.message_content);
      console.log('   Location:', notification.ghl_location_id);
      console.log('   Contact:', notification.ghl_contact_id);
      
      // Play notification sound globally
      console.log('🔊 GLOBAL: Playing notification sound...');
      notificationsService.playNotificationSound();
      
      // Show toast notification globally
      console.log('🍞 GLOBAL: Showing toast notification...');
      toast.success(`New message from ${notification.sender_name || 'Unknown'}`, {
        description: notification.message_content.slice(0, 100) + (notification.message_content.length > 100 ? '...' : ''),
        duration: 5000,
      });
      
      console.log('🔔 Global notification processed');
    });

    // Request notification permission
    notificationsService.requestNotificationPermission();
    
    // Handle page visibility changes to maintain connection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, checking WebSocket connection');
        // Reconnect if connection was lost while tab was hidden
        if (!isConnectedRef.current && userId) {
          console.log('🔄 Reconnecting due to visibility change');
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
      console.log('🌍 GlobalNotificationBell: Cleaning up...');
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
