// useAdmin hook - Check and manage admin status
// Uses profile from useUser to avoid duplicate API calls

import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import { profilesApi } from '../lib/supabase-api';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  checkAdminStatus: () => Promise<void>;
}

export const useAdmin = (): UseAdminReturn => {
  const { userId, isAuthenticated, isReady, profile } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // First check if profile from useUser has is_super_admin
      if (profile && typeof profile.is_super_admin !== 'undefined') {
        setIsAdmin(profile.is_super_admin === true);
        setIsLoading(false);
        return;
      }
      
      // Fallback: fetch profile using profilesApi if not available from useUser
      const { data, error: apiError } = await profilesApi.getByUserId(userId);
      
      if (apiError) {
        console.error('Error checking admin status:', apiError);
        setError(apiError.message);
        setIsAdmin(false);
      } else if (data) {
        setIsAdmin(data.is_super_admin === true);
      } else {
        // No profile found
        setIsAdmin(false);
      }
    } catch (err: any) {
      console.error('Error checking admin status:', err);
      setError(err.message || 'Failed to check admin status');
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated, profile]);

  // React to profile changes from useUser - this is the key fix
  // When profile loads with is_super_admin, update admin status immediately
  useEffect(() => {
    if (profile && typeof profile.is_super_admin !== 'undefined') {
      setIsAdmin(profile.is_super_admin === true);
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (isReady && isAuthenticated && userId) {
      // Only fetch if profile doesn't have is_super_admin yet
      if (!profile || typeof profile.is_super_admin === 'undefined') {
        checkAdminStatus();
      }
    } else if (isReady && !isAuthenticated) {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isReady, isAuthenticated, userId, profile, checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    error,
    checkAdminStatus,
  };
};

export default useAdmin;
