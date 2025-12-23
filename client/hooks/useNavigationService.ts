import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigationService } from '../services/navigationService';

/**
 * Hook to integrate navigation service with React Router
 * Call this in your app's root component
 */
export function useNavigationService() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up React Router navigation globally
    window.__REACT_ROUTER_NAVIGATE__ = (url: string, options?: any) => {
      navigate(url, options);
    };

    // Cleanup on unmount
    return () => {
      delete window.__REACT_ROUTER_NAVIGATE__;
    };
  }, [navigate]);

  return navigationService;
}