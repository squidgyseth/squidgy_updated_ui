// useAdmin hook - Check and manage admin status

import { useState, useEffect, useCallback } from 'react';
import { useUser } from './useUser';
import { supabase } from '../lib/supabase';

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
      
      // Check admin status directly from Supabase profiles table
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', userId)
        .single();
      
      if (supabaseError) {
        console.error('Error checking admin status:', supabaseError);
        setError(supabaseError.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_super_admin === true);
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
