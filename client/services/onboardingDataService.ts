// ===========================================
// ONBOARDING DATA SERVICE
// ===========================================
// Comprehensive service for managing onboarding data in the database
// Handles all 4 steps of the onboarding flow with proper error handling

import { supabaseApi, profilesApi } from '../lib/supabase-api';

// ===== TYPES =====
export interface OnboardingProgress {
  user_id: string;
  is_completed: boolean;
  current_step: number;
  completed_steps: number[];
  business_type?: string;
  selected_departments?: string[];
  selected_assistants?: string[];
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  last_updated?: string;
}

export interface AssistantPersonalization {
  user_id: string;
  assistant_id: string;
  custom_name?: string;
  avatar_style: 'professional' | 'friendly' | 'corporate' | 'creative';
  communication_tone: 'professional' | 'friendly' | 'casual' | 'formal';
  custom_instructions?: string;
  is_enabled: boolean;
}

export interface CompanyDetails {
  user_id: string;
  company_name: string;
  company_email: string;
  company_phone?: string;
  website_url?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  city?: string;
  state?: string;
  time_zone?: string;
  primary_goals?: string[];
  ai_experience_level?: string;
  preferred_working_hours?: string;
}

export interface OnboardingSession {
  user_id: string;
  session_id: string;
  started_at?: string;
  completed_at?: string;
  abandoned_at_step?: number;
  user_agent?: string;
  is_completed: boolean;
  completion_time_minutes?: number;
}

// ===== ONBOARDING DATA SERVICE CLASS =====
class OnboardingDataService {
  private static instance: OnboardingDataService;

  private constructor() {}

  static getInstance(): OnboardingDataService {
    if (!OnboardingDataService.instance) {
      OnboardingDataService.instance = new OnboardingDataService();
    }
    return OnboardingDataService.instance;
  }

  // ===== MAIN ONBOARDING PROGRESS =====
  
  /**
   * Check if user has completed onboarding
   */
  async isOnboardingCompleted(userId: string): Promise<boolean> {
    try {
      console.log('🔍 OnboardingDataService: Checking completion status for user:', userId);
      
      const { data, error } = await supabaseApi.select(
        'user_onboarding',
        'is_completed',
        { user_id: userId },
        { single: true }
      );

      if (error && !error.message?.includes('No rows found')) {
        console.error('❌ OnboardingDataService: Error checking completion:', error);
        return false;
      }

      const isCompleted = data?.is_completed || false;
      console.log('✅ OnboardingDataService: Completion status:', isCompleted);
      return isCompleted;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Get user's complete onboarding progress
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      console.log('🔍 OnboardingDataService: Getting progress for user:', userId);

      const { data, error } = await supabaseApi.select(
        'user_onboarding',
        '*',
        { user_id: userId },
        { single: true }
      );

      if (error) {
        if (error.message?.includes('No rows found')) {
          console.log('ℹ️ OnboardingDataService: No onboarding record found for user');
          return null;
        }
        console.error('❌ OnboardingDataService: Error getting progress:', error);
        return null;
      }

      console.log('✅ OnboardingDataService: Found progress data');
      return data;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error getting onboarding progress:', error);
      return null;
    }
  }

  /**
   * Initialize or update onboarding progress
   */
  async saveOnboardingProgress(progress: Partial<OnboardingProgress>): Promise<boolean> {
    try {
      console.log('💾 OnboardingDataService: Saving progress:', progress);

      // Check if record exists
      const existing = await this.getOnboardingProgress(progress.user_id!);

      if (existing) {
        // Update existing record
        const { data, error } = await supabaseApi.update(
          'user_onboarding',
          progress,
          { user_id: progress.user_id }
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error updating progress:', error);
          return false;
        }
      } else {
        // Create new record
        const { data, error } = await supabaseApi.insert(
          'user_onboarding',
          {
            user_id: progress.user_id,
            current_step: 1,
            completed_steps: [],
            ...progress
          }
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error creating progress:', error);
          return false;
        }
      }

      console.log('✅ OnboardingDataService: Progress saved successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error saving onboarding progress:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingCompleted(userId: string): Promise<boolean> {
    try {
      console.log('🎉 OnboardingDataService: Marking onboarding completed for user:', userId);

      const { data, error } = await supabaseApi.update(
        'user_onboarding',
        {
          is_completed: true,
          current_step: 6,
          completed_steps: [1, 2, 3, 4, 5, 6],
          onboarding_completed_at: new Date().toISOString()
        },
        { user_id: userId }
      );

      if (error) {
        console.error('❌ OnboardingDataService: Error marking completed:', error);
        return false;
      }

      console.log('✅ OnboardingDataService: Onboarding marked as completed');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error marking onboarding completed:', error);
      return false;
    }
  }

  // ===== ASSISTANT PERSONALIZATIONS =====

  /**
   * Get user's assistant personalizations
   */
  async getAssistantPersonalizations(userId: string): Promise<AssistantPersonalization[]> {
    try {
      console.log('🔍 OnboardingDataService: Getting personalizations for user:', userId);

      const { data, error } = await supabaseApi.select(
        'assistant_personalizations',
        '*',
        { user_id: userId }
      );

      if (error) {
        console.error('❌ OnboardingDataService: Error getting personalizations:', error);
        return [];
      }

      console.log('✅ OnboardingDataService: Found', data?.length || 0, 'personalizations');
      return data || [];

    } catch (error) {
      console.error('❌ OnboardingDataService: Error getting personalizations:', error);
      return [];
    }
  }

  /**
   * Save assistant personalization
   */
  async saveAssistantPersonalization(personalization: AssistantPersonalization): Promise<boolean> {
    try {
      console.log('💾 OnboardingDataService: Saving personalization:', personalization);

      // Check if personalization exists
      const { data: existing } = await supabaseApi.select(
        'assistant_personalizations',
        '*',
        {
          user_id: personalization.user_id,
          assistant_id: personalization.assistant_id
        },
        { single: true }
      );

      if (existing) {
        // Update existing
        const { data, error } = await supabaseApi.update(
          'assistant_personalizations',
          personalization,
          {
            user_id: personalization.user_id,
            assistant_id: personalization.assistant_id
          }
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error updating personalization:', error);
          return false;
        }
      } else {
        // Create new
        const { data, error } = await supabaseApi.insert(
          'assistant_personalizations',
          personalization
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error creating personalization:', error);
          return false;
        }
      }

      console.log('✅ OnboardingDataService: Personalization saved successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error saving personalization:', error);
      return false;
    }
  }

  /**
   * Save multiple assistant personalizations
   */
  async saveMultiplePersonalizations(personalizations: AssistantPersonalization[]): Promise<boolean> {
    try {
      console.log('💾 OnboardingDataService: Saving', personalizations.length, 'personalizations');

      // Save each personalization
      for (const personalization of personalizations) {
        const success = await this.saveAssistantPersonalization(personalization);
        if (!success) {
          console.error('❌ OnboardingDataService: Failed to save personalization for:', personalization.assistant_id);
          return false;
        }
      }

      console.log('✅ OnboardingDataService: All personalizations saved successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error saving multiple personalizations:', error);
      return false;
    }
  }

  // ===== COMPANY DETAILS =====

  /**
   * Get user's company details
   */
  async getCompanyDetails(userId: string): Promise<CompanyDetails | null> {
    try {
      console.log('🔍 OnboardingDataService: Getting company details for user:', userId);

      const { data, error } = await supabaseApi.select(
        'onboarding_company_details',
        '*',
        { user_id: userId },
        { single: true }
      );

      if (error) {
        if (error.message?.includes('No rows found')) {
          console.log('ℹ️ OnboardingDataService: No company details found for user');
          return null;
        }
        console.error('❌ OnboardingDataService: Error getting company details:', error);
        return null;
      }

      console.log('✅ OnboardingDataService: Found company details');
      return data;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error getting company details:', error);
      return null;
    }
  }

  /**
   * Save company details
   */
  async saveCompanyDetails(details: CompanyDetails): Promise<boolean> {
    try {
      console.log('💾 OnboardingDataService: Saving company details:', details);

      // Check if record exists
      const existing = await this.getCompanyDetails(details.user_id);

      if (existing) {
        // Update existing record
        const { data, error } = await supabaseApi.update(
          'onboarding_company_details',
          details,
          { user_id: details.user_id }
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error updating company details:', error);
          return false;
        }
      } else {
        // Create new record
        const { data, error } = await supabaseApi.insert(
          'onboarding_company_details',
          details
        );

        if (error) {
          console.error('❌ OnboardingDataService: Error creating company details:', error);
          return false;
        }
      }

      console.log('✅ OnboardingDataService: Company details saved successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error saving company details:', error);
      return false;
    }
  }

  // ===== SESSION TRACKING =====

  /**
   * Start onboarding session
   */
  async startOnboardingSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      console.log('🚀 OnboardingDataService: Starting session for user:', userId);

      const sessionData: Partial<OnboardingSession> = {
        user_id: userId,
        session_id: sessionId,
        started_at: new Date().toISOString(),
        is_completed: false,
        user_agent: navigator.userAgent
      };

      const { data, error } = await supabaseApi.insert(
        'onboarding_sessions',
        sessionData
      );

      if (error) {
        console.error('❌ OnboardingDataService: Error starting session:', error);
        return false;
      }

      console.log('✅ OnboardingDataService: Session started successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error starting session:', error);
      return false;
    }
  }

  /**
   * Complete onboarding session
   */
  async completeOnboardingSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      console.log('🎉 OnboardingDataService: Completing session for user:', userId);

      const { data, error } = await supabaseApi.update(
        'onboarding_sessions',
        {
          completed_at: new Date().toISOString(),
          is_completed: true
        },
        {
          user_id: userId,
          session_id: sessionId
        }
      );

      if (error) {
        console.error('❌ OnboardingDataService: Error completing session:', error);
        return false;
      }

      console.log('✅ OnboardingDataService: Session completed successfully');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error completing session:', error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get user ID from email (helper method)
   */
  async getUserIdFromEmail(email: string): Promise<string | null> {
    try {
      const { data: profile, error } = await profilesApi.getByEmail(email);
      
      if (error || !profile?.user_id) {
        console.error('❌ OnboardingDataService: No profile found for email:', email);
        return null;
      }

      return profile.user_id;
    } catch (error) {
      console.error('❌ OnboardingDataService: Error getting user ID from email:', error);
      return null;
    }
  }

  /**
   * Clear all onboarding data for user (for testing/reset)
   */
  async clearOnboardingData(userId: string): Promise<boolean> {
    try {
      console.log('🧹 OnboardingDataService: Clearing onboarding data for user:', userId);

      // Delete in reverse dependency order
      await supabaseApi.delete('onboarding_sessions', { user_id: userId });
      await supabaseApi.delete('onboarding_company_details', { user_id: userId });
      await supabaseApi.delete('assistant_personalizations', { user_id: userId });
      await supabaseApi.delete('user_onboarding', { user_id: userId });

      console.log('✅ OnboardingDataService: All onboarding data cleared');
      return true;

    } catch (error) {
      console.error('❌ OnboardingDataService: Error clearing onboarding data:', error);
      return false;
    }
  }
}

// ===== EXPORT SINGLETON INSTANCE =====
export const onboardingDataService = OnboardingDataService.getInstance();
export default onboardingDataService;