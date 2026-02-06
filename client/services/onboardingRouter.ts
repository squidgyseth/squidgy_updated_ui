// ===========================================
// ONBOARDING ROUTER SERVICE
// ===========================================
// Smart routing service that determines where to send users based on their onboarding status
// Handles new vs returning users, completion checking, and proper navigation

import { onboardingDataService } from './onboardingDataService';

export interface OnboardingRouteDecision {
  shouldShowOnboarding: boolean;
  redirectPath: string;
  reason: string;
  isNewUser: boolean;
  isReturningUser: boolean;
  currentStep?: number;
}

class OnboardingRouter {
  private static instance: OnboardingRouter;

  private constructor() {}

  static getInstance(): OnboardingRouter {
    if (!OnboardingRouter.instance) {
      OnboardingRouter.instance = new OnboardingRouter();
    }
    return OnboardingRouter.instance;
  }

  /**
   * Determine where to route the user after login
   */
  async determineLoginRoute(userId: string, userEmail?: string): Promise<OnboardingRouteDecision> {
    try {

      // Check if user has completed onboarding
      const isCompleted = await onboardingDataService.isOnboardingCompleted(userId);

      if (isCompleted) {
        // Existing user - go to dashboard
        return {
          shouldShowOnboarding: false,
          redirectPath: '/dashboard',
          reason: 'User has completed onboarding',
          isNewUser: false,
          isReturningUser: true
        };
      }

      // Check if user has any onboarding progress
      const progress = await onboardingDataService.getOnboardingProgress(userId);
      
      if (progress) {
        // User has started onboarding - resume from current step
        const currentStep = progress.current_step || 1;
        const stepPath = this.getStepPath(currentStep);
        
        return {
          shouldShowOnboarding: true,
          redirectPath: stepPath,
          reason: `User has partial progress, resuming from step ${currentStep}`,
          isNewUser: false,
          isReturningUser: true,
          currentStep
        };
      }

      // New user - redirect to dashboard with onboarding modal
      return {
        shouldShowOnboarding: true,
        redirectPath: '/dashboard?onboarding=true',
        reason: 'New user, starting fresh onboarding',
        isNewUser: true,
        isReturningUser: false,
        currentStep: 1
      };

    } catch (error) {
      console.error('❌ OnboardingRouter: Error determining route:', error);
      
      // Default to dashboard with onboarding on error to be safe
      return {
        shouldShowOnboarding: true,
        redirectPath: '/dashboard?onboarding=true',
        reason: 'Error checking status, defaulting to onboarding',
        isNewUser: true,
        isReturningUser: false,
        currentStep: 1
      };
    }
  }

  /**
   * Handle onboarding icon click from sidebar
   */
  async handleOnboardingIconClick(userId: string): Promise<OnboardingRouteDecision> {
    try {

      // Get current onboarding progress
      const progress = await onboardingDataService.getOnboardingProgress(userId);
      
      if (progress) {
        // User has data - show onboarding modal on dashboard
        return {
          shouldShowOnboarding: true,
          redirectPath: '/dashboard?onboarding=true',
          reason: 'User wants to modify existing onboarding data',
          isNewUser: false,
          isReturningUser: true,
          currentStep: 1 // Always start from step 1 for editing
        };
      }

      // No progress data - start fresh
      return {
        shouldShowOnboarding: true,
        redirectPath: '/dashboard?onboarding=true',
        reason: 'User starting onboarding for first time via sidebar',
        isNewUser: true,
        isReturningUser: false,
        currentStep: 1
      };

    } catch (error) {
      console.error('❌ OnboardingRouter: Error handling icon click:', error);
      
      return {
        shouldShowOnboarding: true,
        redirectPath: '/dashboard?onboarding=true',
        reason: 'Error checking data, starting fresh',
        isNewUser: true,
        isReturningUser: false,
        currentStep: 1
      };
    }
  }

  /**
   * Get the correct path for a given step number
   */
  private getStepPath(stepNumber: number): string {
    const stepPaths: Record<number, string> = {
      1: '/ai-onboarding/business-type',
      2: '/ai-onboarding/support-areas',
      3: '/ai-onboarding/choose-assistants',
      4: '/ai-onboarding/personalize',
      5: '/ai-onboarding/company-details',
      6: '/ai-onboarding/welcome'
    };

    return stepPaths[stepNumber] || '/ai-onboarding/business-type';
  }

  /**
   * Get step number from path
   */
  getStepFromPath(path: string): number {
    const pathToStep: Record<string, number> = {
      '/ai-onboarding/business-type': 1,
      '/ai-onboarding/support-areas': 2,
      '/ai-onboarding/choose-assistants': 3,
      '/ai-onboarding/personalize': 4,
      '/ai-onboarding/company-details': 5,
      '/ai-onboarding/welcome': 6
    };

    return pathToStep[path] || 1;
  }

  /**
   * Save current onboarding step progress
   */
  async saveStepProgress(userId: string, stepNumber: number, stepData: any): Promise<boolean> {
    try {

      // Get current progress
      const currentProgress = await onboardingDataService.getOnboardingProgress(userId);
      
      // Build updated progress based on step
      const updatedProgress: any = {
        user_id: userId,
        current_step: stepNumber,
        completed_steps: currentProgress?.completed_steps || [],
        ...currentProgress
      };

      // Add current step to completed steps if not already there
      if (!updatedProgress.completed_steps.includes(stepNumber)) {
        updatedProgress.completed_steps.push(stepNumber);
      }

      // Update specific step data
      switch (stepNumber) {
        case 1: // Business Type Selection
          updatedProgress.business_type = stepData.businessType;
          break;
        
        case 2: // Support Areas Selection
          updatedProgress.selected_departments = stepData.selectedDepartments;
          break;
        
        case 3: // Assistant Selection
          updatedProgress.selected_assistants = stepData.selectedAssistants;
          break;
        
        case 4: // Personalization
          // This is handled separately in assistant_personalizations table
          break;
        
        case 5: // Company Details
          // This is handled separately in onboarding_company_details table
          break;
        
        case 6: // Welcome (completion)
          updatedProgress.is_completed = true;
          updatedProgress.onboarding_completed_at = new Date().toISOString();
          break;
      }

      // Save the progress
      const success = await onboardingDataService.saveOnboardingProgress(updatedProgress);
      
      if (success) {
      } else {
        console.error(`❌ OnboardingRouter: Failed to save step ${stepNumber} progress`);
      }

      return success;

    } catch (error) {
      console.error(`❌ OnboardingRouter: Error saving step ${stepNumber} progress:`, error);
      return false;
    }
  }

  /**
   * Load onboarding data for pre-filling forms
   */
  async loadOnboardingDataForStep(userId: string, stepNumber: number): Promise<any> {
    try {

      const progress = await onboardingDataService.getOnboardingProgress(userId);
      
      if (!progress) {
        return null;
      }

      // Return data based on step
      switch (stepNumber) {
        case 1: // Business Type Selection
          return {
            businessType: progress.business_type,
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
        
        case 2: // Support Areas Selection
          return {
            businessType: progress.business_type,
            selectedDepartments: progress.selected_departments || [],
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
        
        case 3: // Assistant Selection
          return {
            selectedDepartments: progress.selected_departments || [],
            selectedAssistants: progress.selected_assistants || [],
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
        
        case 4: // Personalization
          const personalizations = await onboardingDataService.getAssistantPersonalizations(userId);
          return {
            selectedDepartments: progress.selected_departments || [],
            selectedAssistants: progress.selected_assistants || [],
            personalizations,
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
        
        case 5: // Company Details
          const companyDetails = await onboardingDataService.getCompanyDetails(userId);
          return {
            companyDetails,
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
        
        default:
          return {
            currentStep: progress.current_step,
            completedSteps: progress.completed_steps
          };
      }

    } catch (error) {
      console.error(`❌ OnboardingRouter: Error loading data for step ${stepNumber}:`, error);
      return null;
    }
  }

  /**
   * Check if user can access a specific onboarding step
   */
  async canAccessStep(userId: string, targetStep: number): Promise<boolean> {
    try {
      const progress = await onboardingDataService.getOnboardingProgress(userId);
      
      if (!progress) {
        // New user can only access step 1
        return targetStep === 1;
      }

      // User can access current step or any previous step
      const currentStep = progress.current_step || 1;
      return targetStep <= currentStep + 1; // Allow accessing next step too

    } catch (error) {
      console.error('❌ OnboardingRouter: Error checking step access:', error);
      return targetStep === 1; // Default to allowing only step 1 on error
    }
  }
}

// ===== EXPORT SINGLETON INSTANCE =====
export const onboardingRouter = OnboardingRouter.getInstance();
export default onboardingRouter;
