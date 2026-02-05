// src/lib/auth-service.ts
import { supabase } from './supabase';
import { Profile } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { profilesApi } from './supabase-api';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  termsAccepted?: boolean;
  aiProcessingConsent?: boolean;
  marketingConsent?: boolean;
  termsViewed?: boolean;
  termsScrolledToBottom?: boolean;
  privacyViewed?: boolean;
  privacyScrolledToBottom?: boolean;
}

interface SignInData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export class AuthService {
  private userCache: { user: any; profile: any | null; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // Email validation helper
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password validation helper
  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Sign up user
  async signUp(userData: SignUpData): Promise<{ user: any; profile?: Profile; needsEmailConfirmation?: boolean; message?: string }> {
    try {
      console.log('🔑 AUTH_SERVICE: signUp started');
      console.log('📧 AUTH_SERVICE: Email provided:', userData.email ? `${userData.email.substring(0, 3)}***@${userData.email.split('@')[1] || '***'}` : 'empty');
      console.log('👤 AUTH_SERVICE: Full name provided:', userData.fullName ? `${userData.fullName.substring(0, 2)}***` : 'empty');
      
      // Check if Supabase is configured
      console.log('🔧 AUTH_SERVICE: Checking Supabase configuration...');
      console.log('🔧 AUTH_SERVICE: VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
      
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co') {
        console.log('❌ AUTH_SERVICE: Supabase configuration check failed');
        throw new Error('Supabase is not configured. Please add your Supabase credentials to the .env file.');
      }
      console.log('✅ AUTH_SERVICE: Supabase configuration check passed');

      // Validate input
      console.log('📝 AUTH_SERVICE: Starting form validation...');
      if (!this.isValidEmail(userData.email)) {
        console.log('❌ AUTH_SERVICE: Email validation failed');
        throw new Error('Please enter a valid email address');
      }
      console.log('✅ AUTH_SERVICE: Email validation passed');

      if (!this.isValidPassword(userData.password)) {
        console.log('❌ AUTH_SERVICE: Password validation failed');
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
      }
      console.log('✅ AUTH_SERVICE: Password validation passed');

      if (!userData.fullName || userData.fullName.trim().length < 2) {
        console.log('❌ AUTH_SERVICE: Full name validation failed');
        throw new Error('Full name must be at least 2 characters');
      }
      console.log('✅ AUTH_SERVICE: Full name validation passed');

      // Check if email already exists in profiles table using direct API call
      // Note: Using direct fetch because Supabase JS client hangs in this environment
      console.log('🔍 AUTH_SERVICE: Checking if email already exists in profiles table...');
      const startEmailCheck = Date.now();
      
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const url = `${supabaseUrl}/rest/v1/profiles?email=eq.${userData.email.toLowerCase()}&select=id`;
        
        console.log('🌐 AUTH_SERVICE: Using direct API call for email check');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        });

        const endEmailCheck = Date.now();
        console.log(`⏱️ AUTH_SERVICE: Email check completed in ${endEmailCheck - startEmailCheck}ms`);

        if (!response.ok) {
          console.error('❌ AUTH_SERVICE: Email check API call failed:', response.status, response.statusText);
          throw new Error('Unable to verify email availability. Please try again.');
        }
        
        const existingProfiles = await response.json();
        console.log('📋 AUTH_SERVICE: Email check result:', existingProfiles);
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log('❌ AUTH_SERVICE: Email already exists in profiles table');
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        console.log('✅ AUTH_SERVICE: Email is available for registration');
        
      } catch (error: any) {
        const endEmailCheck = Date.now();
        console.log(`⏱️ AUTH_SERVICE: Email check failed in ${endEmailCheck - startEmailCheck}ms`);
        
        if (error.message.includes('already exists')) {
          throw error; // Re-throw email exists error
        }
        
        console.error('❌ AUTH_SERVICE: Error checking existing email:', error);
        throw new Error('Unable to verify email availability. Please try again.');
      }

      // Create auth user with email confirmation
      // Always use production URL for email confirmations to avoid localhost issues
      console.log('🚀 AUTH_SERVICE: Creating Supabase auth user...');
      const redirectUrl = `${import.meta.env.VITE_FRONTEND_URL}/login`;
      console.log('🔗 AUTH_SERVICE: Email redirect URL:', redirectUrl);
      
      const startAuthCreation = Date.now();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.toLowerCase(),
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName.trim(),
          },
          emailRedirectTo: redirectUrl,
          // Uncomment the line below to skip email confirmation (testing only)
          // skipEmailConfirmation: true
        }
      });
      const endAuthCreation = Date.now();
      console.log(`⏱️ AUTH_SERVICE: Supabase auth creation completed in ${endAuthCreation - startAuthCreation}ms`);

      if (authError) {
        console.error('❌ AUTH_SERVICE: Supabase Auth Error:', authError);
        console.error('❌ AUTH_SERVICE: Auth Error Message:', authError.message);
        console.error('❌ AUTH_SERVICE: Auth Error Code:', authError.status);
        
        if (authError.message.includes('rate limit') || 
            authError.message.includes('too many requests') ||
            authError.message.includes('429')) {
          throw new Error('Too many attempts. Please wait 5-10 minutes and try again.');
        }
        if (authError.message.includes('already registered') || 
            authError.message.includes('already been registered') ||
            authError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }
        if (authError.message.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }
        throw new Error(`Signup failed: ${authError.message}`);
      }

      if (!authData.user) {
        console.log('❌ AUTH_SERVICE: No user returned from Supabase auth');
        throw new Error('Failed to create user account');
      }
      
      console.log('✅ AUTH_SERVICE: Supabase auth user created successfully');
      console.log('👤 AUTH_SERVICE: Auth user ID:', authData.user.id);
      console.log('📧 AUTH_SERVICE: Auth user email:', authData.user.email);
      console.log('🔐 AUTH_SERVICE: Session created:', !!authData.session);

      // Create profile immediately after user creation
      console.log('📝 AUTH_SERVICE: Starting profile creation process...');
      try {
        // First check if profile already exists (might be created by trigger)
        // Note: Using direct API call because Supabase JS client hangs in this environment
        console.log('🔍 AUTH_SERVICE: Checking if profile already exists...');
        const startProfileCheck = Date.now();
        
        let existingProfile = null;
        let checkError = null;
        
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}&select=*`;
          
          console.log('🌐 AUTH_SERVICE: Using direct API call for profile check');
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          const endProfileCheck = Date.now();
          console.log(`⏱️ AUTH_SERVICE: Profile check completed in ${endProfileCheck - startProfileCheck}ms`);

          if (response.ok) {
            const profiles = await response.json();
            existingProfile = profiles && profiles.length > 0 ? profiles[0] : null;
            console.log('📋 AUTH_SERVICE: Profile check result:', existingProfile ? 'Found existing profile' : 'No profile found');
          } else {
            console.error('❌ AUTH_SERVICE: Profile check API call failed:', response.status, response.statusText);
            checkError = { code: 'API_ERROR', message: `HTTP ${response.status}` };
          }
        } catch (error: any) {
          const endProfileCheck = Date.now();
          console.log(`⏱️ AUTH_SERVICE: Profile check failed in ${endProfileCheck - startProfileCheck}ms`);
          console.error('❌ AUTH_SERVICE: Error during profile check:', error);
          checkError = { code: 'NETWORK_ERROR', message: error.message };
        }

        let profile = existingProfile;

        // Only create if profile doesn't exist
        if (!existingProfile) {
          console.log('🆕 AUTH_SERVICE: Profile does not exist, creating new profile...');
          const startProfileCreation = Date.now();
          
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const url = `${supabaseUrl}/rest/v1/profiles`;
            
            const profileData = {
              id: authData.user.id,
              user_id: uuidv4(),
              company_id: uuidv4(), // Generate company_id for new user
              email: authData.user.email,
              full_name: userData.fullName.trim(),
              role: 'member',
              terms_accepted: userData.termsAccepted || false,
              ai_processing_consent: userData.aiProcessingConsent || false,
              marketing_consent: userData.marketingConsent || false,
              consent_timestamp: new Date().toISOString(),
              terms_viewed: userData.termsViewed || false,
              terms_scrolled_to_bottom: userData.termsScrolledToBottom || false,
              terms_viewed_timestamp: userData.termsViewed ? new Date().toISOString() : null,
              privacy_viewed: userData.privacyViewed || false,
              privacy_scrolled_to_bottom: userData.privacyScrolledToBottom || false,
              privacy_viewed_timestamp: userData.privacyViewed ? new Date().toISOString() : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            console.log('🌐 AUTH_SERVICE: Using direct API call for profile creation');
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(profileData)
            });

            const endProfileCreation = Date.now();
            console.log(`⏱️ AUTH_SERVICE: Profile creation completed in ${endProfileCreation - startProfileCreation}ms`);

            if (response.ok) {
              const createdProfiles = await response.json();
              profile = createdProfiles && createdProfiles.length > 0 ? createdProfiles[0] : profileData;
              console.log('✅ AUTH_SERVICE: New profile created successfully');
              console.log('🆔 AUTH_SERVICE: Profile ID:', profile.id);
              console.log('👤 AUTH_SERVICE: Profile user_id:', profile.user_id);
            } else {
              const errorText = await response.text();
              console.error('❌ AUTH_SERVICE: Profile creation API call failed:', response.status, errorText);
              throw new Error('Failed to create user profile');
            }
          } catch (error: any) {
            const endProfileCreation = Date.now();
            console.log(`⏱️ AUTH_SERVICE: Profile creation failed in ${endProfileCreation - startProfileCreation}ms`);
            console.error('❌ AUTH_SERVICE: Profile creation error:', error);
            throw new Error('Failed to create user profile');
          }
        } else if (existingProfile) {
          console.log('✅ AUTH_SERVICE: Profile already exists, using existing profile');
          console.log('🆔 AUTH_SERVICE: Existing profile ID:', existingProfile.id);
          
          // Update the existing profile with any missing data
          if (!existingProfile.user_id || !existingProfile.company_id) {
            console.log('🔄 AUTH_SERVICE: Updating existing profile with missing data...');
            
            try {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
              const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}`;
              
              const updateData = {
                user_id: existingProfile.user_id || uuidv4(),
                company_id: existingProfile.company_id || uuidv4(),
                full_name: existingProfile.full_name || userData.fullName.trim(),
                updated_at: new Date().toISOString()
              };
              
              console.log('🌐 AUTH_SERVICE: Using direct API call for profile update');
              
              const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(updateData)
              });
              
              if (response.ok) {
                const updatedProfiles = await response.json();
                if (updatedProfiles && updatedProfiles.length > 0) {
                  profile = updatedProfiles[0];
                  console.log('✅ AUTH_SERVICE: Profile updated successfully');
                } else {
                  // Merge update data with existing profile
                  profile = { ...existingProfile, ...updateData };
                  console.log('✅ AUTH_SERVICE: Profile updated (merged data)');
                }
              } else {
                const errorText = await response.text();
                console.error('⚠️ AUTH_SERVICE: Profile update failed:', response.status, errorText);
              }
            } catch (error: any) {
              console.error('⚠️ AUTH_SERVICE: Profile update error:', error);
            }
          }
        }

        // Profile created successfully - now trigger GHL registration
        if (profile) {
          console.log('✅ AUTH_SERVICE: Profile created successfully, starting GHL registration...');
          console.log('🌐 AUTH_SERVICE: Backend URL:', import.meta.env.VITE_BACKEND_URL);
          
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const ghlPayload = {
              full_name: userData.fullName.trim(),
              email: userData.email.toLowerCase()
            };
            
            console.log('📡 AUTH_SERVICE: Calling GHL registration endpoint...');
            console.log('📦 AUTH_SERVICE: GHL payload:', ghlPayload);
            
            const startGhlCall = Date.now();
            const ghlResponse = await fetch(`${backendUrl}/api/ghl/create-subaccount-and-user-registration`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ghlPayload)
            });
            const endGhlCall = Date.now();
            
            console.log(`⏱️ AUTH_SERVICE: GHL API call completed in ${endGhlCall - startGhlCall}ms`);
            console.log('🌐 AUTH_SERVICE: GHL Response status:', ghlResponse.status);
            console.log('🌐 AUTH_SERVICE: GHL Response ok:', ghlResponse.ok);
            
            const ghlResult = await ghlResponse.json();
            console.log('📊 AUTH_SERVICE: GHL Registration Response:', ghlResult);
            
            if (ghlResponse.ok && ghlResult.status === 'accepted') {
              console.log('🚀 AUTH_SERVICE: GHL account creation started successfully!');
              console.log('📝 AUTH_SERVICE: GHL Record ID:', ghlResult.ghl_record_id);
            } else {
              console.warn('⚠️ AUTH_SERVICE: GHL registration failed:', ghlResult);
              console.warn('⚠️ AUTH_SERVICE: GHL response status:', ghlResponse.status);
              // Don't throw error - user registration was successful
            }
          } catch (ghlError) {
            console.error('❌ AUTH_SERVICE: GHL registration error:', ghlError);
            console.error('❌ AUTH_SERVICE: GHL error stack:', ghlError.stack);
            // Don't throw error - user registration was successful
          }
        }
        
      } catch (profileCreationError) {
        console.error('❌ AUTH_SERVICE: Error creating profile:', profileCreationError);
        throw new Error('Failed to create user profile');
      }
      
      console.log('🎯 AUTH_SERVICE: Preparing final response...');
      const finalResponse = {
        user: authData.user,
        needsEmailConfirmation: !authData.session,
        message: !authData.session 
          ? 'Account created successfully! Please check your email and click the confirmation link to verify your account.'
          : 'Account created and verified successfully!'
      };
      
      console.log('📋 AUTH_SERVICE: Final response:', {
        hasUser: !!finalResponse.user,
        needsEmailConfirmation: finalResponse.needsEmailConfirmation,
        message: finalResponse.message
      });
      
      console.log('✅ AUTH_SERVICE: signUp process completed successfully');
      return finalResponse;

    } catch (error: any) {
      console.error('❌ AUTH_SERVICE: Signup error:', error);
      console.error('❌ AUTH_SERVICE: Error message:', error.message);
      console.error('❌ AUTH_SERVICE: Error stack:', error.stack);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  // Sign in user
  async signIn(credentials: SignInData): Promise<{ user: any; profile?: Profile; needsEmailConfirmation?: boolean }> {
    try {
      // Debug: Log the actual environment values
      console.log('🔍 Auth Service - Environment check:', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
        urlCheck: !import.meta.env.VITE_SUPABASE_URL,
        placeholderCheck: import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'
      });
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co') {
        throw new Error('Supabase is not configured. Please add your Supabase credentials to the .env file.');
      }

      // Validate input
      if (!this.isValidEmail(credentials.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!credentials.password) {
        throw new Error('Password is required');
      }

      // Attempt sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link to verify your account before signing in.');
        }
        if (authError.message.includes('rate limit') || 
            authError.message.includes('too many requests') ||
            authError.message.includes('429')) {
          throw new Error('Too many login attempts. Please wait 5-10 minutes and try again.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to sign in');
      }

      // Get user profile - try multiple lookup methods using direct API
      console.log('🔍 AUTH_SERVICE: Looking up user profile for sign in...');
      let profile = null;
      let profileError = null;
      
      // First try by id (if profiles.id = auth.user.id)
      console.log('🌐 AUTH_SERVICE: Using direct API for profile lookup by id');
      const idResult = await profilesApi.getById(authData.user.id);
      
      if (idResult.data) {
        profile = idResult.data;
        console.log('✅ AUTH_SERVICE: Found profile by id:', profile.id);
      } else {
        // Try by user_id column
        console.log('🌐 AUTH_SERVICE: Using direct API for profile lookup by user_id');
        const userIdResult = await profilesApi.getByUserId(authData.user.id);
        
        if (userIdResult.data) {
          profile = userIdResult.data;
          console.log('✅ AUTH_SERVICE: Found profile by user_id:', profile.id);
        } else if (authData.user.email) {
          // Finally try by email
          console.log('🌐 AUTH_SERVICE: Using direct API for profile lookup by email');
          const emailResult = await profilesApi.getByEmail(authData.user.email);
          
          if (emailResult.data) {
            profile = emailResult.data;
            console.log('✅ AUTH_SERVICE: Found profile by email:', profile.id);
          } else {
            profileError = emailResult.error;
          }
        }
      }

      if (!profile) {
        console.warn('⚠️ AUTH_SERVICE: Failed to load user profile:', profileError);
      }

      return {
        user: authData.user,
        profile: profile || undefined
      };

    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(data: ForgotPasswordData): Promise<{ message: string }> {
    try {
      // Validate email
      if (!this.isValidEmail(data.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Use Supabase Auth's built-in password reset
      // Always use production URL for password reset emails to avoid localhost issues
      const redirectUrl = `${import.meta.env.VITE_FRONTEND_URL}/reset-password`;
      console.log('🔗 Password reset redirect URL:', redirectUrl);
        
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email.toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        console.error('Reset password error:', resetError);
        throw new Error(resetError.message || 'Failed to send password reset email');
      }

      return { message: 'If an account exists with this email, a password reset link has been sent.' };

    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    try {
      // Validate new password
      if (!this.isValidPassword(data.newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
      }

      // When using Supabase's built-in password reset flow,
      // the user should already be authenticated via the magic link
      // Just update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      return { message: 'Password reset successfully' };

    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      // Clear cache first
      this.clearUserCache();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Signout error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Clear user cache (call this on logout)
  clearUserCache() {
    this.userCache = null;
  }

  // Get current user session with caching
  async getCurrentUser(): Promise<{ user: any; profile: Profile | null }> {
    try {
      // Check cache first
      if (this.userCache && (Date.now() - this.userCache.timestamp) < this.CACHE_DURATION) {
        console.log('getCurrentUser: Using cached user data');
        return { user: this.userCache.user, profile: this.userCache.profile };
      }

      console.log('getCurrentUser: Fetching fresh user data');

      // Get user from Supabase (no timeout - let it complete naturally)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }

      if (!user) {
        return { user: null, profile: null };
      }

      // Try to get profile but don't fail if it doesn't exist using direct API
      try {
        console.log('🔍 AUTH_SERVICE: Looking up profile for getCurrentUser...');
        let profile = null;
        
        // First try by id (if profiles.id = auth.user.id)
        console.log('🌐 AUTH_SERVICE: Using direct API for getCurrentUser profile lookup by id');
        const idResult = await profilesApi.getById(user.id);
        
        if (idResult.data) {
          profile = idResult.data;
          console.log('✅ AUTH_SERVICE: getCurrentUser found profile by id:', profile.id);
        } else {
          // Try by user_id column
          console.log('🌐 AUTH_SERVICE: Using direct API for getCurrentUser profile lookup by user_id');
          const userIdResult = await profilesApi.getByUserId(user.id);
          
          if (userIdResult.data) {
            profile = userIdResult.data;
            console.log('✅ AUTH_SERVICE: getCurrentUser found profile by user_id:', profile.id);
          } else if (user.email) {
            // Finally try by email
            console.log('🌐 AUTH_SERVICE: Using direct API for getCurrentUser profile lookup by email');
            const emailResult = await profilesApi.getByEmail(user.email);
            
            if (emailResult.data) {
              profile = emailResult.data;
              console.log('✅ AUTH_SERVICE: getCurrentUser found profile by email:', profile.id);
            }
          }
        }

        // Cache the result
        const result = { user, profile };
        this.userCache = { user, profile, timestamp: Date.now() };
        console.log('✅ AUTH_SERVICE: getCurrentUser cached user data for future calls');

        return result;
      } catch (profileError) {
        console.warn('⚠️ AUTH_SERVICE: Profile fetch failed, continuing with user only:', profileError);
        // Cache even if profile failed - at least we have the user
        const result = { user, profile: null };
        this.userCache = { user, profile: null, timestamp: Date.now() };
        return result;
      }

    } catch (error: any) {
      console.error('Get current user error:', error);
      return { user: null, profile: null };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
