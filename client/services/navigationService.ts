/**
 * Navigation Service
 * Centralized navigation logic for the application
 */

interface NavigationOptions {
  newTab?: boolean;
  replace?: boolean;
  state?: any;
}

class NavigationService {
  private static instance: NavigationService;

  private constructor() {}

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Navigate to agent settings
   */
  navigateToAgentSettings(agentId: string, options: NavigationOptions = {}) {
    const url = `/agent-settings/${agentId}`;
    this.navigate(url, options);
  }

  /**
   * Navigate to personalisation settings with specific agent selected
   */
  navigateToPersonalisationSettings(agentId?: string, options: NavigationOptions = {}) {
    let url = '/personalisation-settings';
    
    // If agentId is provided, add it to the URL or state
    if (agentId) {
      // Pass the agent ID as state to auto-select in personalisation settings
      options.state = { 
        ...options.state, 
        selectedAgent: agentId,
        openSection: 'ai-assistant-customization' 
      };
    }
    
    this.navigate(url, options);
  }

  /**
   * Navigate to a specific settings section
   */
  navigateToSettings(section: 'account' | 'business' | 'team' | 'personalisation' | 'billing', options: NavigationOptions = {}) {
    const urlMap = {
      'account': '/account-settings',
      'business': '/business-settings', 
      'team': '/team-settings',
      'personalisation': '/personalisation-settings',
      'billing': '/billing-settings'
    };
    
    const url = urlMap[section];
    this.navigate(url, options);
  }

  /**
   * Navigate to chat with specific agent
   */
  navigateToChat(agentId: string, options: NavigationOptions = {}) {
    const url = `/chat/${agentId}`;
    this.navigate(url, options);
  }

  /**
   * Navigate to dashboard
   */
  navigateToDashboard(options: NavigationOptions = {}) {
    this.navigate('/dashboard', options);
  }

  /**
   * Core navigation method
   */
  private navigate(url: string, options: NavigationOptions = {}) {
    if (options.newTab) {
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      // Fallback if popup is blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        this.navigateInSameTab(url, options);
      }
    } else {
      this.navigateInSameTab(url, options);
    }
  }

  /**
   * Navigate in the same tab
   */
  private navigateInSameTab(url: string, options: NavigationOptions = {}) {
    if (options.replace) {
      window.location.replace(url);
    } else {
      // If we have React Router available, use it
      if (window.__REACT_ROUTER_NAVIGATE__) {
        window.__REACT_ROUTER_NAVIGATE__(url, { state: options.state });
      } else {
        // Fallback to standard navigation
        window.location.href = url;
      }
    }
  }

  /**
   * Navigate back in history
   */
  goBack() {
    window.history.back();
  }

  /**
   * Get current path
   */
  getCurrentPath(): string {
    return window.location.pathname;
  }

  /**
   * Check if on specific route
   */
  isOnRoute(route: string): boolean {
    return this.getCurrentPath() === route;
  }

  /**
   * Check if path includes a pattern
   */
  pathIncludes(pattern: string): boolean {
    return this.getCurrentPath().includes(pattern);
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();

// Type exports
export type { NavigationOptions };

// Add global type for React Router navigate function
declare global {
  interface Window {
    __REACT_ROUTER_NAVIGATE__?: (url: string, options?: any) => void;
  }
}