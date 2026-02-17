import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../lib/auth-service';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/session-manager';
import { profilesApi } from '../lib/supabase-api';

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
        
        // Check if we're in development mode
        const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                             !import.meta.env.VITE_SUPABASE_URL || 
                             import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';
        
        
        if (isDevelopment) {
          // Development mode - create or use existing dev user
          let devUserId = localStorage.getItem('dev_user_id') || import.meta.env.VITE_DEV_USER_ID;
          let devUserEmail = localStorage.getItem('dev_user_email') || import.meta.env.VITE_DEV_USER_EMAIL || 'dmacproject123@gmail.com';
          
          
          if (!devUserId) {
            devUserId = generateUserId();
            localStorage.setItem('dev_user_id', devUserId);
          }
          
          // Try to fetch profile from Supabase first using direct API
          let profileData = null;
          try {
            
            // First try by user ID
            let result = await profilesApi.getById(devUserId);
            profileData = result.data;
              
            if (!profileData) {
              // If not found by ID, try by email
              result = await profilesApi.getByEmail(devUserEmail);
              profileData = result.data;
            }
            
          } catch (error) {
          }
          
          
          // ALWAYS use user_id from profiles table in development mode
          let finalUserId = profileData?.user_id;
          
          if (!finalUserId) {
            try {
              // Try to get the correct user_id by email lookup using direct API
              const emailLookupResult = await profilesApi.getByEmail(devUserEmail);
              
              if (emailLookupResult.data?.user_id) {
                finalUserId = emailLookupResult.data.user_id;
              } else {
                finalUserId = devUserId;
              }
            } catch (error) {
              console.error('❌ USER_PROVIDER Dev: Email lookup failed:', error);
              finalUserId = devUserId;
            }
          }
          
          
          setIsAuthenticated(true);
          setUser({ id: devUserId, email: devUserEmail });
          setProfile(profileData || { 
            id: devUserId,
            user_id: finalUserId, 
            email: devUserEmail,
            full_name: 'Development User',
            profile_avatar_url: ''
          });
          setUserIdState(finalUserId);
          setSessionIdState(`session_${finalUserId}`);
          setAgentIdState(`agent_${finalUserId}`);
          localStorage.setItem('squidgy_user_id', finalUserId);
          
          // Start session monitoring even in dev mode
          sessionManager.startSessionMonitoring();
          
          setIsReady(true);
          return;
        }
        
        // Production mode - check Supabase authentication with retry logic
        
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
          setProfile(authResult.profile);
          
          // Get the correct user_id from profiles table using email
          let currentUserId = authResult.profile?.user_id;
          
          // ALWAYS do email lookup to get correct user_id from profiles table using direct API
          if (authResult.user.email) {
            try {
              const profileResult = await profilesApi.getByEmail(authResult.user.email);
              
              
              if (profileResult.data?.user_id) {
                currentUserId = profileResult.data.user_id;
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
          
          setUserIdState(currentUserId);
          localStorage.setItem('squidgy_user_id', currentUserId);
          
          const currentAgentId = `agent_${currentUserId}`;
          setAgentIdState(currentAgentId);
          
          // Start session monitoring
          sessionManager.startSessionMonitoring();
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
        
        // In production, don't fallback to dev mode - set as unauthenticated
        const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                             !import.meta.env.VITE_SUPABASE_URL || 
                             import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';
        
        if (isDevelopment) {
          // Fallback to development mode only in dev environment
          let devUserId = localStorage.getItem('dev_user_id') || import.meta.env.VITE_DEV_USER_ID;
          let devUserEmail = localStorage.getItem('dev_user_email') || import.meta.env.VITE_DEV_USER_EMAIL || 'dmacproject123@gmail.com';
          
          if (!devUserId) {
            devUserId = generateUserId();
            localStorage.setItem('dev_user_id', devUserId);
          }
          
          setIsAuthenticated(true);
          setUser({ id: devUserId, email: devUserEmail });
          setProfile({ user_id: devUserId, full_name: 'Development User' });
          setUserIdState(devUserId);
          localStorage.setItem('squidgy_user_id', devUserId);
          
          const currentAgentId = `agent_${devUserId}`;
          setAgentIdState(currentAgentId);
        } else {
          // Production - set as unauthenticated
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
        
        setIsReady(true);
      }
    };

    initializeUser();

    // Listen for auth state changes only in production mode
    let subscription: any = null;
    
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                         !import.meta.env.VITE_SUPABASE_URL || 
                         import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';
        if (!isDevelopment) {
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
              setProfile(userProfile);
              
              // ALWAYS do email lookup to get correct user_id 
              let currentUserId = userProfile?.user_id;
              
              if (authUser?.email) {
                try {
                  const { data: profileData } = await profilesApi.getByEmail(authUser.email);
                  
                  if (profileData?.user_id) {
                    currentUserId = profileData.user_id;
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
              
              setUserIdState(currentUserId);
              localStorage.setItem('squidgy_user_id', currentUserId);
              
              const currentAgentId = `agent_${currentUserId}`;
              setAgentIdState(currentAgentId);
              
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
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const setUserId = (newUserId: string) => {
    console.trace('🚨 Call stack for setUserId:');
    
    // Don't update if it's the same user ID to prevent unnecessary re-renders
    if (newUserId === userId) {
      return;
    }
    
    // Log the setUserId call for debugging
    
    setUserIdState(newUserId);
    localStorage.setItem('squidgy_user_id', newUserId);
    
    const newAgentId = `agent_${newUserId}`;
    setAgentIdState(newAgentId);
    
    // Update authentication state for development users
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                         !import.meta.env.VITE_SUPABASE_URL || 
                         import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';
    
    if (isDevelopment && newUserId) {
      const devUserEmail = localStorage.getItem('dev_user_email') || import.meta.env.VITE_DEV_USER_EMAIL || 'dmacproject123@gmail.com';
      const devUserName = localStorage.getItem('dev_user_name') || import.meta.env.VITE_DEV_USER_NAME || 'Development User';
      const devUserAvatar = localStorage.getItem('dev_user_avatar') || '';
      setIsAuthenticated(true);
      setUser({ id: newUserId, email: devUserEmail });
      setProfile({ 
        user_id: newUserId, 
        full_name: devUserName,
        profile_avatar_url: devUserAvatar
      });
    }
  };

  const clearUser = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    // Stop session monitoring
    sessionManager.stopSessionMonitoring();
    
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
        
      if (!data) {
        // If not found by ID, try by email
        const userEmail = user?.email || localStorage.getItem('dev_user_email');
        if (userEmail) {
          const result = await profilesApi.getByEmail(userEmail);
          data = result.data;
        }
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
