// PostHog Service - Identify users with correct user_id from profiles table

import posthog from 'posthog-js';
import { getPostHogConfig } from './envConfig';

class PostHogService {
  private initialized = false;
  private currentUserId: string | null = null;

  /**
   * Initialize PostHog (if not already initialized by GTM)
   */
  init() {
    if (this.initialized) return;

    // Check if PostHog is already loaded by GTM
    if (typeof window !== 'undefined' && (window as any).posthog) {
      this.initialized = true;
      return;
    }

    // If not loaded by GTM, initialize manually (fallback)
    const config = getPostHogConfig();

    if (config.key) {
      posthog.init(config.key, {
        api_host: config.host,
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,
        capture_exceptions: true,
      });
      this.initialized = true;
    }
  }

  /**
   * Identify user with correct user_id from profiles table
   */
  identifyUser(userId: string, userEmail?: string, userName?: string) {
    if (!this.initialized) {
      this.init();
    }

    // Don't re-identify if it's the same user
    if (this.currentUserId === userId) {
      return;
    }

    try {
      // Use PostHog from window if loaded by GTM, otherwise use imported instance
      const ph = (window as any).posthog || posthog;
      
      if (ph) {
        // Identify with profile.user_id (not auth user ID)
        ph.identify(userId, {
          email: userEmail,
          name: userName,
        });
        
        this.currentUserId = userId;
      }
    } catch (error) {
      console.error('PostHog: Error identifying user:', error);
    }
  }

  /**
   * Reset user identity (on logout)
   */
  reset() {
    try {
      const ph = (window as any).posthog || posthog;
      
      if (ph) {
        ph.reset();
        this.currentUserId = null;
      }
    } catch (error) {
      console.error('PostHog: Error resetting user:', error);
    }
  }

  /**
   * Capture custom event
   */
  captureEvent(eventName: string, properties?: Record<string, any>) {
    try {
      const ph = (window as any).posthog || posthog;
      
      if (ph) {
        ph.capture(eventName, properties);
      }
    } catch (error) {
      console.error('❌ PostHog: Error capturing event:', error);
    }
  }

  /**
   * Capture page view
   */
  capturePageView() {
    try {
      const ph = (window as any).posthog || posthog;
      
      if (ph) {
        ph.capture('$pageview');
      }
    } catch (error) {
      console.error('❌ PostHog: Error capturing pageview:', error);
    }
  }
}

// Export singleton instance
export const posthogService = new PostHogService();
