// src/lib/auth-service.ts
import { supabase } from './supabase';
import { Profile } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { profilesApi } from './supabase-api';
import ReferralService from '../services/referralService';
import { getSupabaseConfig, getBackendUrl, getFrontendUrl } from './envConfig';

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
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
    // Allow ANY characters (including all special chars from password managers)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  // Sign up user
  async signUp(userData: SignUpData): Promise<{ user: any; profile?: Profile; needsEmailConfirmation?: boolean; message?: string }> {
    try {
      // Check if Supabase is configured
      if (!getSupabaseConfig().url || getSupabaseConfig().url === 'https://your-project.supabase.co') {
        throw new Error('Supabase is not configured. Please add your Supabase credentials to the .env file.');
      }

      // Validate input
      if (!this.isValidEmail(userData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!this.isValidPassword(userData.password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
      }

      if (!userData.fullName || userData.fullName.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters');
      }

      // Check if email already exists in profiles table using direct API call
      // Note: Using direct fetch because Supabase JS client hangs in this environment
      try {
        const supabaseUrl = getSupabaseConfig().url;
        const supabaseKey = getSupabaseConfig().anonKey;
        const emailLower = userData.email.toLowerCase();
        const encodedEmail = encodeURIComponent(emailLower);
        const url = `${supabaseUrl}/rest/v1/profiles?email=eq.${encodedEmail}&select=id,email`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('❌ AUTH_SERVICE: Email check API call failed:', response.status, response.statusText);
          throw new Error('Unable to verify email availability. Please try again.');
        }

        const existingProfiles = await response.json();

        if (existingProfiles && existingProfiles.length > 0) {
          throw new Error('An account with this email already exists. Please try logging in instead.');
        }

      } catch (error: any) {
        if (error.message.includes('already exists')) {
          throw error; // Re-throw email exists error
        }

        console.error('❌ AUTH_SERVICE: Error checking existing email:', error);
        throw new Error('Unable to verify email availability. Please try again.');
      }

      // Create auth user with email confirmation
      // Always use production URL for email confirmations to avoid localhost issues
      const redirectUrl = `${getFrontendUrl()}/login`;

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
        throw new Error('Failed to create user account');
      }

      // Check if user already exists - Supabase returns empty identities array for existing users
      // This is a security feature to prevent email enumeration
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }
      
      // Also check if identities is undefined or null (another indicator of existing user)
      if (!authData.user.identities) {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }

      // Create profile immediately after user creation
      try {
        // First check if profile already exists (by id OR email to prevent duplicates)
        // Note: Using direct API call because Supabase JS client hangs in this environment
        let existingProfile = null;
        let checkError = null;

        try {
          const supabaseUrl = getSupabaseConfig().url;
          const supabaseKey = getSupabaseConfig().anonKey;
          
          // Check by id first (trigger might create with auth user id)
          let url = `${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}&select=*`;
          let response = await fetch(url, {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          });

          if (response.ok) {
            const profiles = await response.json();
            existingProfile = profiles && profiles.length > 0 ? profiles[0] : null;
          }
          
          // If not found by id, check by email to prevent duplicates
          if (!existingProfile) {
            url = `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(authData.user.email?.toLowerCase() || '')}&select=*`;
            response = await fetch(url, {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              }
            });

            if (response.ok) {
              const profiles = await response.json();
              existingProfile = profiles && profiles.length > 0 ? profiles[0] : null;
              
              // If found by email but with different id, update the id to match auth user
              if (existingProfile && existingProfile.id !== authData.user.id) {
                console.log('⚠️ AUTH_SERVICE: Found profile by email with different id, updating to match auth user');
                const updateUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${existingProfile.id}`;
                const updateResponse = await fetch(updateUrl, {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify({ id: authData.user.id, updated_at: new Date().toISOString() })
                });
                
                if (updateResponse.ok) {
                  const updatedProfiles = await updateResponse.json();
                  existingProfile = updatedProfiles && updatedProfiles.length > 0 ? updatedProfiles[0] : existingProfile;
                }
              }
            }
          }
        } catch (error: any) {
          console.error('❌ AUTH_SERVICE: Error during profile check:', error);
          checkError = { code: 'NETWORK_ERROR', message: error.message };
        }

        let profile = existingProfile;

        // Only create if profile doesn't exist
        if (!existingProfile) {
          try {
            const supabaseUrl = getSupabaseConfig().url;
            const supabaseKey = getSupabaseConfig().anonKey;
            const url = `${supabaseUrl}/rest/v1/profiles`;

            const userId = uuidv4();

            const profileData = {
              id: authData.user.id,
              user_id: userId,
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

            if (response.ok) {
              const createdProfiles = await response.json();
              profile = createdProfiles && createdProfiles.length > 0 ? createdProfiles[0] : profileData;

              // Mark referral code as used (one-time use)
              if (userData.referralCode && userId) {
                try {
                  const referralService = ReferralService.getInstance();
                  await referralService.markCodeAsUsed(userData.referralCode, userId);
                  console.log('✅ AUTH_SERVICE: Referral code marked as used:', userData.referralCode, 'by user:', userId);
                } catch (error) {
                  console.error('⚠️ AUTH_SERVICE: Failed to mark referral code as used:', error);
                  // Don't fail signup if code marking fails
                }
              }
            } else {
              const errorText = await response.text();
              console.error('❌ AUTH_SERVICE: Profile creation API call failed:', response.status, errorText);
              throw new Error('Failed to create user profile');
            }
          } catch (error: any) {
            console.error('❌ AUTH_SERVICE: Profile creation error:', error);
            throw new Error('Failed to create user profile');
          }

          // Auto-create business_settings for new users
          if (profile && profile.user_id) {
            try {
              const supabaseUrl = getSupabaseConfig().url;
              const supabaseKey = getSupabaseConfig().anonKey;
              const businessSettingsUrl = `${supabaseUrl}/rest/v1/business_settings`;

              const businessSettingsData = {
                user_id: profile.user_id,
                company_name: null, // User will fill this later
                industry: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const businessResponse = await fetch(businessSettingsUrl, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(businessSettingsData)
              });

              if (businessResponse.ok) {
                const createdBusinessSettings = await businessResponse.json();
                console.log('✅ AUTH_SERVICE: Auto-created business_settings:', createdBusinessSettings);
              } else {
                const errorText = await businessResponse.text();
                console.warn('⚠️ AUTH_SERVICE: business_settings creation failed (non-critical):', businessResponse.status, errorText);
                // Don't throw - this is non-critical, user can complete later
              }
            } catch (error: any) {
              console.warn('⚠️ AUTH_SERVICE: business_settings creation error (non-critical):', error);
              // Don't throw - this is non-critical, user can complete later
            }
          }
        } else if (existingProfile) {
          // Update the existing profile with any missing data
          if (!existingProfile.user_id || !existingProfile.company_id) {
            try {
              const supabaseUrl = getSupabaseConfig().url;
              const supabaseKey = getSupabaseConfig().anonKey;
              const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}`;

              const updateData = {
                user_id: existingProfile.user_id || uuidv4(),
                company_id: existingProfile.company_id || uuidv4(),
                full_name: existingProfile.full_name || userData.fullName.trim(),
                updated_at: new Date().toISOString()
              };

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
                } else {
                  // Merge update data with existing profile
                  profile = { ...existingProfile, ...updateData };
                }
              } else {
                const errorText = await response.text();
                console.error('⚠️ AUTH_SERVICE: Profile update failed:', response.status, errorText);
              }
            } catch (error: any) {
              console.error('⚠️ AUTH_SERVICE: Profile update error:', error);
            }
          }

          // Auto-create business_settings for existing users if missing
          if (existingProfile && existingProfile.user_id) {
            try {
              const supabaseUrl = getSupabaseConfig().url;
              const supabaseKey = getSupabaseConfig().anonKey;

              // Check if business_settings already exists
              const checkUrl = `${supabaseUrl}/rest/v1/business_settings?user_id=eq.${existingProfile.user_id}&select=id`;
              const checkResponse = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                }
              });

              if (checkResponse.ok) {
                const existingBusinessSettings = await checkResponse.json();

                // Only create if doesn't exist
                if (!existingBusinessSettings || existingBusinessSettings.length === 0) {
                  const businessSettingsUrl = `${supabaseUrl}/rest/v1/business_settings`;
                  const businessSettingsData = {
                    user_id: existingProfile.user_id,
                    company_name: null,
                    industry: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

                  const businessResponse = await fetch(businessSettingsUrl, {
                    method: 'POST',
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(businessSettingsData)
                  });

                  if (businessResponse.ok) {
                    console.log('✅ AUTH_SERVICE: Auto-created business_settings for existing user');
                  }
                }
              }
            } catch (error: any) {
              console.warn('⚠️ AUTH_SERVICE: business_settings check/creation error (non-critical):', error);
            }
          }
        }

        // Profile created successfully - now trigger GHL registration
        if (profile) {
          try {
            const backendUrl = getBackendUrl();
            const ghlPayload = {
              full_name: userData.fullName.trim(),
              email: userData.email.toLowerCase()
            };

            const ghlResponse = await fetch(`${backendUrl}/api/ghl/create-subaccount-and-user-registration`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ghlPayload)
            });

            const ghlResult = await ghlResponse.json();

            if (!ghlResponse.ok || ghlResult.status !== 'accepted') {
              // Don't throw error - user registration was successful
            }
          } catch (ghlError) {
            console.error('❌ AUTH_SERVICE: GHL registration error:', ghlError);
            // Don't throw error - user registration was successful
          }
        }
        
      } catch (profileCreationError) {
        console.error('❌ AUTH_SERVICE: Error creating profile:', profileCreationError);
        throw new Error('Failed to create user profile');
      }

      const finalResponse = {
        user: authData.user,
        needsEmailConfirmation: !authData.session,
        message: !authData.session
          ? 'Account created successfully! Please check your email and click the confirmation link to verify your account.'
          : 'Account created and verified successfully!'
      };

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
      // Check if Supabase is configured
      if (!getSupabaseConfig().url || getSupabaseConfig().url === 'https://your-project.supabase.co') {
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
          // Return needsEmailConfirmation flag instead of throwing error
          // This allows Login.tsx to show a helpful verification panel
          return {
            user: null,
            needsEmailConfirmation: true
          };
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
      let profile = null;
      let profileError = null;

      // First try by id (if profiles.id = auth.user.id)
      const idResult = await profilesApi.getById(authData.user.id);

      if (idResult.data) {
        profile = idResult.data;
      } else {
        // Try by user_id column
        const userIdResult = await profilesApi.getByUserId(authData.user.id);

        if (userIdResult.data) {
          profile = userIdResult.data;
        } else if (authData.user.email) {
          // Finally try by email
          const emailResult = await profilesApi.getByEmail(authData.user.email);

          if (emailResult.data) {
            profile = emailResult.data;
          } else {
            profileError = emailResult.error;
          }
        }
      }

      // If no profile found, create one automatically (handles manually registered users)
      if (!profile && authData.user) {
        console.log('⚠️ AUTH_SERVICE: No profile found for user, creating automatically...');
        try {
          const supabaseUrl = getSupabaseConfig().url;
          const supabaseKey = getSupabaseConfig().anonKey;
          const url = `${supabaseUrl}/rest/v1/profiles`;

          const userId = uuidv4();
          const fullName = authData.user.user_metadata?.full_name || 
                          authData.user.email?.split('@')[0] || 
                          'User';

          const profileData = {
            id: authData.user.id,
            user_id: userId,
            company_id: uuidv4(),
            email: authData.user.email,
            full_name: fullName,
            role: 'member',
            terms_accepted: false,
            ai_processing_consent: false,
            marketing_consent: false,
            consent_timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

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

          if (response.ok) {
            const createdProfiles = await response.json();
            profile = createdProfiles && createdProfiles.length > 0 ? createdProfiles[0] : profileData;
            console.log('✅ AUTH_SERVICE: Profile created automatically for user:', authData.user.id);

            // Auto-create business_settings for the new profile
            if (profile && profile.user_id) {
              try {
                const businessSettingsUrl = `${supabaseUrl}/rest/v1/business_settings`;
                const businessSettingsData = {
                  user_id: profile.user_id,
                  company_name: null,
                  industry: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                const businessResponse = await fetch(businessSettingsUrl, {
                  method: 'POST',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify(businessSettingsData)
                });

                if (businessResponse.ok) {
                  console.log('✅ AUTH_SERVICE: Auto-created business_settings for new profile');
                } else {
                  console.warn('⚠️ AUTH_SERVICE: business_settings creation failed (non-critical)');
                }
              } catch (error: any) {
                console.warn('⚠️ AUTH_SERVICE: business_settings creation error (non-critical):', error);
              }
            }

            // Trigger GHL registration for manually registered users
            try {
              const backendUrl = getBackendUrl();
              const ghlPayload = {
                full_name: fullName,
                email: authData.user.email?.toLowerCase()
              };

              console.log('🔄 AUTH_SERVICE: Triggering GHL registration for manually registered user...');
              const ghlResponse = await fetch(`${backendUrl}/api/ghl/create-subaccount-and-user-registration`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(ghlPayload)
              });

              const ghlResult = await ghlResponse.json();

              if (ghlResponse.ok && ghlResult.status === 'accepted') {
                console.log('✅ AUTH_SERVICE: GHL registration triggered successfully');
              } else {
                console.warn('⚠️ AUTH_SERVICE: GHL registration failed (non-critical):', ghlResult);
              }
            } catch (ghlError) {
              console.error('❌ AUTH_SERVICE: GHL registration error (non-critical):', ghlError);
              // Don't throw - this is non-critical, user can still use the app
            }
          } else {
            const errorText = await response.text();
            console.error('❌ AUTH_SERVICE: Auto profile creation failed:', response.status, errorText);
          }
        } catch (error: any) {
          console.error('❌ AUTH_SERVICE: Error auto-creating profile:', error);
        }
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
      const redirectUrl = `${getFrontendUrl()}/reset-password`;

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
        return { user: this.userCache.user, profile: this.userCache.profile };
      }

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
        let profile = null;

        // First try by id (if profiles.id = auth.user.id)
        const idResult = await profilesApi.getById(user.id);

        if (idResult.data) {
          profile = idResult.data;
        } else {
          // Try by user_id column
          const userIdResult = await profilesApi.getByUserId(user.id);

          if (userIdResult.data) {
            profile = userIdResult.data;
          } else if (user.email) {
            // Finally try by email
            const emailResult = await profilesApi.getByEmail(user.email);

            if (emailResult.data) {
              profile = emailResult.data;
            }
          }
        }

        // Cache the result
        const result = { user, profile };
        this.userCache = { user, profile, timestamp: Date.now() };

        return result;
      } catch (profileError) {
        // Cache even if profile failed - at least we have the user
        const result = { user, profile: null };
        this.userCache = { user, profile: null, timestamp: Date.now() };
        return result;
      }

    } catch (error: any) {
      // Don't log AuthSessionMissingError as it's expected when not logged in
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Get current user error:', error);
      }
      return { user: null, profile: null };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
