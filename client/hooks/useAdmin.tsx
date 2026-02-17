// useAdmin hook - Check and manage admin status

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
  const { userId, isAuthenticated, isReady } = useUser();
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
      
      // Check admin status using profilesApi to avoid 406 errors from .single()
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
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (isReady && isAuthenticated && userId) {
      checkAdminStatus();
    } else if (isReady && !isAuthenticated) {
      setIsAdmin(false);
      setIsLoading(false);
    }
  }, [isReady, isAuthenticated, userId, checkAdminStatus]);

  return {
    isAdmin,
    isLoading,
    error,
    checkAdminStatus,
  };
};

export default useAdmin;
