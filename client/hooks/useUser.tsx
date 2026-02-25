import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/auth-service';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/session-manager';
import { profilesApi } from '../lib/supabase-api';
import { posthogService } from '../lib/posthog-service';
import { checkAndTriggerGhlOnboarding } from '../lib/api';

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate a UUID v4 compatible user ID
const generateUserId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// User context interface
interface UserContextType {
  userId: string;
  sessionId: string;
  agentId: string;
  setUserId: (userId: string) => void;
  clearUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isReady: boolean;
  isAuthenticated: boolean;
  user: any;
  profile: any;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userId, setUserIdState] = useState<string>('');
  const [sessionId, setSessionIdState] = useState<string>('');
  const [agentId, setAgentIdState] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Initialize user data on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        
        // Quick check for existing session to prevent unnecessary redirects
        const startSessionCheck = Date.now();
        const { data: { session } } = await supabase.auth.getSession();
        const endSessionCheck = Date.now();
        
        // Check Supabase authentication with retry logic (same for dev and production)
        
        // If we already found a session, set authenticated immediately to prevent redirect
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
        }
        
        let retryCount = 0;
        const maxRetries = 3;
        let authResult = null;
        
        while (retryCount < maxRetries && !authResult) {
          try {
            const startAuthCheck = Date.now();
            
            const { user: authUser, profile: userProfile } = await authService.getCurrentUser();
            
            const endAuthCheck = Date.now();
            
            if (authUser) {
              // Wait for profile if user exists but profile is missing
              if (!userProfile) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try to get profile again
                const { profile: retryProfile } = await authService.getCurrentUser();
                authResult = { user: authUser, profile: retryProfile };
              } else {
                authResult = { user: authUser, profile: userProfile };
              }
            }
            break;
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (authResult?.user) {
          
          setIsAuthenticated(true);
          setUser(authResult.user);
          
          // Get the correct user_id from profiles table using email
          let currentUserId = authResult.profile?.user_id;
          let finalProfile = authResult.profile;
          
          // ALWAYS do email lookup to get correct user_id and full profile from profiles table
          if (authResult.user.email) {
            try {
              const profileResult = await profilesApi.getByEmail(authResult.user.email);
              
              
              if (profileResult.data) {
                currentUserId = profileResult.data.user_id || authResult.user.id;
                // Use the fresh profile data which includes is_super_admin
                finalProfile = profileResult.data;
              } else {
                currentUserId = authResult.user.id;
              }
            } catch (error) {
              console.error('❌ USER_PROVIDER Prod: Error in email lookup:', error);
              currentUserId = authResult.user.id;
            }
          } else {
            currentUserId = currentUserId || authResult.user.id;
          }
          
          // Set profile with fresh data that includes is_super_admin
          setProfile(finalProfile);
          setUserIdState(currentUserId);
          localStorage.setItem('squidgy_user_id', currentUserId);
          
          const currentAgentId = `agent_${currentUserId}`;
          setAgentIdState(currentAgentId);
          
          // Identify user in PostHog with correct profile.user_id
          posthogService.identifyUser(
            currentUserId,
            authResult.user.email,
            finalProfile?.full_name
          );
          
          // Start session monitoring
          sessionManager.startSessionMonitoring();
          
          // Check GHL pit_token and trigger onboarding if missing
          checkAndTriggerGhlOnboarding(currentUserId).catch(err => {
            console.error('[GHL CHECK] Failed to check GHL onboarding:', err);
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
          
          // Stop session monitoring if no user
          sessionManager.stopSessionMonitoring();
        }
        
        // Generate session ID
        let currentSessionId = localStorage.getItem('squidgy_session_id');
        if (!currentSessionId) {
          currentSessionId = generateSessionId();
          localStorage.setItem('squidgy_session_id', currentSessionId);
        }
        setSessionIdState(currentSessionId);

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        // Set as unauthenticated on error
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
        setIsReady(true);
      }
    };

    initializeUser();

    // Listen for auth state changes
    let subscription: any = null;
    
    try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              
              // Use the session user directly instead of calling getCurrentUser
              const authUser = session.user;
              
              // Check if this is an email confirmation
              const urlParams = new URLSearchParams(window.location.search);
              const isEmailConfirmation = urlParams.get('type') === 'signup' || 
                                        urlParams.get('type') === 'email_confirmation';
              
              
              // Only get profile data, don't call getCurrentUser - using direct API
              let userProfile = null;
              try {
                const profileResult = await profilesApi.getById(authUser.id);
                userProfile = profileResult.data;
                
                if (!userProfile && authUser.email) {
                  // Fallback to email lookup
                  const emailResult = await profilesApi.getByEmail(authUser.email);
                  userProfile = emailResult.data;
                }
              } catch (profileError) {
              }
              
              setIsAuthenticated(true);
              setUser(authUser);
              
              // ALWAYS do email lookup to get correct user_id and full profile with is_super_admin
              let currentUserId = userProfile?.user_id;
              let finalProfile = userProfile;
              
              if (authUser?.email) {
                try {
                  const { data: profileData } = await profilesApi.getByEmail(authUser.email);
                  
                  if (profileData) {
                    currentUserId = profileData.user_id || authUser.id;
                    // Use the fresh profile data which includes is_super_admin
                    finalProfile = profileData;
                  } else {
                    currentUserId = authUser.id;
                  }
                } catch (error) {
                  console.error('❌ UserProvider AuthListener: Email lookup failed:', error);
                  currentUserId = authUser.id;
                }
              } else {
                currentUserId = currentUserId || authUser.id;
              }
              
              // Set profile with fresh data that includes is_super_admin
              setProfile(finalProfile);
              setUserIdState(currentUserId);
              localStorage.setItem('squidgy_user_id', currentUserId);
              
              const currentAgentId = `agent_${currentUserId}`;
              setAgentIdState(currentAgentId);
              
              // Identify user in PostHog with correct profile.user_id
              posthogService.identifyUser(
                currentUserId,
                authUser.email,
                finalProfile?.full_name
              );
              
              // Check GHL pit_token and trigger onboarding if missing
              checkAndTriggerGhlOnboarding(currentUserId).catch(err => {
                console.error('[GHL CHECK] Failed to check GHL onboarding:', err);
              });
              
            } catch (error) {
              console.error('Error handling auth state change:', error);
            }
          } else if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setUser(null);
            setProfile(null);
            setUserIdState('');
            setAgentIdState('');
            localStorage.removeItem('squidgy_user_id');
            
            // Reset PostHog identity on logout
            posthogService.reset();
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const setUserId = (newUserId: string) => {
    // Don't update if it's the same user ID to prevent unnecessary re-renders
    if (newUserId === userId) {
      return;
    }
    
    setUserIdState(newUserId);
    localStorage.setItem('squidgy_user_id', newUserId);
    
    const newAgentId = `agent_${newUserId}`;
    setAgentIdState(newAgentId);
  };

  const clearUser = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    // Stop session monitoring
    sessionManager.stopSessionMonitoring();
    
    // Reset PostHog identity
    posthogService.reset();
    
    setUserIdState('');
    setSessionIdState('');
    setAgentIdState('');
    setIsAuthenticated(false);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('squidgy_user_id');
    localStorage.removeItem('squidgy_session_id');
    localStorage.removeItem('dev_user_id');
    localStorage.removeItem('dev_user_email');
    localStorage.removeItem('session_expiry_warning');
    localStorage.removeItem('onboarding_completed');
    localStorage.removeItem('onboarding_state');
    setIsReady(true); // Keep ready state true to prevent re-initialization
  };

  // Add refresh function to reload profile from database
  const refreshProfile = async () => {
    if (!userId) return;
    
    try {
      // Try to fetch updated profile from database
      let { data } = await profilesApi.getById(userId);
        
      if (!data && user?.email) {
        // If not found by ID, try by email
        const result = await profilesApi.getByEmail(user.email);
        data = result.data;
      }
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('UserProvider: Failed to refresh profile:', error);
    }
  };

  const value = {
    isAuthenticated,
    isReady,
    user,
    profile,
    userId,
    sessionId,
    agentId,
    setUserId,
    clearUser,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
