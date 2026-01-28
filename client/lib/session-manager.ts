import { supabase } from './supabase';

class SessionManager {
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every minute
  
  // Start monitoring session
  startSessionMonitoring() {
    // Don't start monitoring on auth pages
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
    
    if (authPages.includes(currentPath)) {
      console.log('On auth page, skipping session monitoring');
      return;
    }
    
    // Clear any existing interval
    this.stopSessionMonitoring();
    
    // Check session immediately
    this.checkSession();
    
    // Set up periodic checks
    this.sessionCheckInterval = setInterval(() => {
      this.checkSession();
    }, this.CHECK_INTERVAL);
  }
  
  // Stop monitoring session
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
  
  // Check if session is still valid
  async checkSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No active session found');
        this.handleSessionExpiry();
        return false;
      }
      
      // Check if session has expired based on 1-hour rule
      const sessionStart = new Date(session.expires_at! * 1000 - this.SESSION_DURATION);
      const now = new Date();
      const sessionAge = now.getTime() - sessionStart.getTime();
      
      if (sessionAge > this.SESSION_DURATION) {
        console.log('Session expired (1 hour limit reached)');
        await this.handleSessionExpiry();
        return false;
      }
      
      // Session is still valid
      const remainingTime = this.SESSION_DURATION - sessionAge;
      const remainingMinutes = Math.floor(remainingTime / 60000);
      
      // Warn user when session is about to expire (5 minutes before)
      if (remainingMinutes <= 5 && remainingMinutes > 0) {
        this.showExpiryWarning(remainingMinutes);
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }
  
  // Handle session expiry
  private async handleSessionExpiry() {
    try {
      // Don't redirect if already on login page or auth-related pages
      const currentPath = window.location.pathname;
      const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
      
      if (authPages.includes(currentPath)) {
        console.log('Already on auth page, skipping redirect');
        return;
      }
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Clear any stored user data
      localStorage.removeItem('squidgy_user_id');
      localStorage.removeItem('supabase.auth.token');
      
      // Show notification
      this.showSessionExpiredNotification();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      console.error('Error handling session expiry:', error);
      // Only force redirect if not already on auth page
      const currentPath = window.location.pathname;
      const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
      
      if (!authPages.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
  }
  
  // Show warning that session is about to expire
  private showExpiryWarning(minutesRemaining: number) {
    // Check if we already showed a warning recently
    const lastWarning = localStorage.getItem('session_expiry_warning');
    const now = Date.now();
    
    if (lastWarning && now - parseInt(lastWarning) < 60000) {
      return; // Don't show warning more than once per minute
    }
    
    localStorage.setItem('session_expiry_warning', now.toString());
    
    // Import toast dynamically to avoid circular dependencies
    import('sonner').then(({ toast }) => {
      toast.warning(`Your session will expire in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`, {
        duration: 5000,
        action: {
          label: 'Stay logged in',
          onClick: () => this.refreshSession()
        }
      });
    });
  }
  
  // Show notification when session has expired
  private showSessionExpiredNotification() {
    // Import toast dynamically
    import('sonner').then(({ toast }) => {
      toast.error('Your session has expired. Please log in again.', {
        duration: 3000
      });
    });
  }
  
  // Refresh the session to extend it
  async refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Failed to refresh session:', error);
        await this.handleSessionExpiry();
        return false;
      }
      
      console.log('Session refreshed successfully');
      
      // Clear warning flag
      localStorage.removeItem('session_expiry_warning');
      
      // Show success notification
      import('sonner').then(({ toast }) => {
        toast.success('Session extended for another hour');
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }
  
  // Get remaining session time in minutes
  async getRemainingSessionTime(): Promise<number | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }
      
      const sessionStart = new Date(session.expires_at! * 1000 - this.SESSION_DURATION);
      const now = new Date();
      const sessionAge = now.getTime() - sessionStart.getTime();
      const remainingTime = this.SESSION_DURATION - sessionAge;
      
      return Math.max(0, Math.floor(remainingTime / 60000));
    } catch (error) {
      console.error('Error getting remaining session time:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
