import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { OnboardingProgress, OnboardingState } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader from '@/services/businessFlowLoader';
import { onboardingRouter } from '@/services/onboardingRouter';
import { onboardingDataService } from '@/services/onboardingDataService';

export default function Welcome() {
  const navigate = useNavigate();
  const { isReady, userId, profile } = useUser();
  const [onboardingData, setOnboardingData] = useState<OnboardingState | null>(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);

  const flowLoader = BusinessFlowLoader.getInstance();

  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 6,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  });

  useEffect(() => {
    const loadConfiguration = async () => {
      // Wait for authentication to be ready before loading configuration
      if (!isReady) {
        return;
      }
      
      try {
        // Load flow configuration
        const flowConfig = await flowLoader.getFlowConfig();
        setProgress({
          currentStep: 6,
          totalSteps: flowConfig.total_steps,
          stepTitles: flowConfig.step_titles
        });

        // Load onboarding data from database
        if (userId) {
          const progress = await onboardingDataService.getOnboardingProgress(userId);
          if (progress) {
            // Create onboarding data summary from database
            const onboardingDataSummary: OnboardingState = {
              currentStep: progress.current_step || 6,
              businessType: progress.business_type || 'other',
              selectedDepartments: progress.selected_departments || [],
              selectedAssistants: progress.selected_assistants || [],
              personalizations: [], // We could load this too if needed
              companyDetails: null // We could load this too if needed
            };
            setOnboardingData(onboardingDataSummary);
          }
          
          // Get user name from profile (full_name field)
          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else {
            // Fallback to company name if no profile name
            const companyDetails = await onboardingDataService.getCompanyDetails(userId);
            if (companyDetails?.company_name) {
              setUserName(companyDetails.company_name);
            }
          }
        }
        
        // Fallback to localStorage for compatibility
        if (!onboardingData) {
          const savedState = localStorage.getItem('onboarding_state');
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              setOnboardingData(state);
              if (state.userName || state.companyDetails?.companyName) {
                setUserName(state.userName || state.companyDetails?.companyName || 'User');
              }
            } catch (error) {
              console.error('Error loading local onboarding state:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading welcome configuration:', error);
        toast.error('Failed to load onboarding summary');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId, profile, onboardingData]);

  const handleGetStarted = async () => {
    if (!userId) {
      toast.error('Authentication required. Please try logging in again.');
      return;
    }

    try {
      // Mark onboarding as completed in the database
      const success = await onboardingDataService.markOnboardingCompleted(userId);
      
      if (!success) {
        toast.error('Failed to save completion status. Please try again.');
        return;
      }

      // Clear onboarding state from localStorage
      localStorage.removeItem('onboarding_state');
      localStorage.setItem('onboarding_completed', 'true');
      
      toast.success('Welcome to Squidgy! Your AI team is ready to help.');
      navigate('/dashboard');

    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/ai-onboarding/company-details');
  };

  if (loading || !isReady || !onboardingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-600">
            {!isReady ? 'Initializing...' : 'Loading onboarding summary...'}
          </span>
        </div>
      </div>
    );
  }

  const businessTypeLabels: Record<string, string> = {
    'ecommerce': 'E-commerce',
    'agency_creative': 'Agency / Creative Studio',
    'saas_tech': 'SaaS / Tech Startup',
    'consultant_freelancer': 'Consultant / Freelancer',
    'education': 'Education',
    'enterprise_corporate': 'Enterprise / Corporate',
    'other': 'Other'
  };

  const businessTypeLabel = businessTypeLabels[onboardingData.businessType || 'other'] || 'your business';

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Welcome to Squidgy!"
      stepDescription={`Congratulations! Your AI team is ready to transform how you work.`}
      onBack={() => navigate('/ai-onboarding/company-details')}
      onContinue={handleGetStarted}
      continueText="Get Started"
      showSkip={false}
    >
      <div className="max-w-4xl mx-auto text-center">
          {/* Squidgy Star Icon - Smaller and Round */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-[#FB252A] to-[#6017E8] rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2L16.235 9.265L24 10L16.235 10.735L14 18L11.765 10.735L4 10L11.765 9.265L14 2Z" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 font-['Open_Sans'] mb-4">
              Welcome to Squidgy, {userName}! 🎉
            </h1>
            <p className="text-lg text-gray-600 font-['Open_Sans'] max-w-2xl mx-auto">
              Your AI team is ready to transform how you work. Here's what we've set up for your{' '}
              <span className="font-semibold text-gray-800">{businessTypeLabel}</span> business:
            </p>
          </div>

          {/* Setup Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Departments */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                {onboardingData.selectedDepartments.length}
              </h3>
              <p className="text-gray-600 font-['Open_Sans']">
                {onboardingData.selectedDepartments.length === 1 ? 'Department' : 'Departments'}
              </p>
              <p className="text-sm text-gray-500 font-['Open_Sans'] mt-1">
                AI support across your key business areas
              </p>
            </div>

            {/* AI Assistants */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6C12 8.20914 10.2091 10 8 10C5.79086 10 4 8.20914 4 6C4 3.79086 5.79086 2 8 2C10.2091 2 12 3.79086 12 6Z" stroke="#51A2FF" strokeWidth="2"/>
                  <path d="M20 6C20 8.20914 18.2091 10 16 10C13.7909 10 12 8.20914 12 6C12 3.79086 13.7909 2 16 2C18.2091 2 20 3.79086 20 6Z" stroke="#51A2FF" strokeWidth="2"/>
                  <path d="M8 12C5.79086 12 4 13.7909 4 16V20C4 20.5523 4.44772 21 5 21H11C11.5523 21 12 20.5523 12 20V16C12 13.7909 10.2091 12 8 12Z" stroke="#51A2FF" strokeWidth="2"/>
                  <path d="M16 12C13.7909 12 12 13.7909 12 16V20C12 20.5523 12.4477 21 13 21H19C19.5523 21 20 20.5523 20 20V16C20 13.7909 18.2091 12 16 12Z" stroke="#51A2FF" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                {onboardingData.selectedAssistants.length}
              </h3>
              <p className="text-gray-600 font-['Open_Sans']">
                AI Assistant{onboardingData.selectedAssistants.length === 1 ? '' : 's'}
              </p>
              <p className="text-sm text-gray-500 font-['Open_Sans'] mt-1">
                Specialized AI team members ready to help
              </p>
            </div>

            {/* Personalized Setup */}
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1046 2 14 2.89543 14 4V5.26756C16.2596 6.01915 18 8.20034 18 10.8V14.8944L20.4472 17.3416C20.786 17.6805 20.786 18.2311 20.4472 18.5699C20.1084 18.9088 19.5578 18.9088 19.2189 18.5699L16.2 15.551C15.6 16.2 14.8 16.6 14 16.8V18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18V16.8C8.44772 16.4 7 15.2 7 13.5V10.8C7 8.20034 8.74036 6.01915 11 5.26756V4C11 2.89543 11.8954 2 12 2Z" stroke="#FB252A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
                Personalized Setup
              </h3>
              <p className="text-gray-600 font-['Open_Sans']">
                Tailored Configuration
              </p>
              <p className="text-sm text-gray-500 font-['Open_Sans'] mt-1">
                Tailored for your {businessTypeLabel} workflow
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-6">
              Here's how to get started:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Start Conversation */}
              <Card 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/chat')}
              >
                <CardContent className="p-0 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 12H8.01M12 12H12.01M16 12H16.01M9 19C9 19 10 18 12 18C14 18 15 19 15 19M21 12C21 16.9706 16.9706 21 12 21C10.2 21 8.54639 20.4262 7.18179 19.4372L3 21L4.56275 16.8182C3.57379 15.4536 3 13.8 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                    Start your first conversation
                  </h3>
                  <p className="text-sm text-gray-600 font-['Open_Sans']">
                    Ask any of your AI assistants a question
                  </p>
                </CardContent>
              </Card>

              {/* Invite Team */}
              <Card 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/team-settings')}
              >
                <CardContent className="p-0 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 21V19C16 16.7909 14.2091 15 12 15H6C3.79086 15 2 16.7909 2 19V21M22 21V19C22 16.7909 20.2091 15 18 15H17M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7ZM19 7C19 9.20914 17.2091 11 15 11C13.7909 11 12 9.20914 12 8" stroke="#51A2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                    Invite your team
                  </h3>
                  <p className="text-sm text-gray-600 font-['Open_Sans']">
                    Collaborate with colleagues and AI together
                  </p>
                </CardContent>
              </Card>

              {/* Add More Assistants */}
              <Card 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/ai-onboarding/choose-assistants')}
              >
                <CardContent className="p-0 text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 6V18M6 12H18" stroke="#FB252A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                    Add more assistants
                  </h3>
                  <p className="text-sm text-gray-600 font-['Open_Sans']">
                    Expand your AI team as your needs grow
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">🚀</span>
              </div>
              <div>
                <p className="text-green-800 font-semibold font-['Open_Sans']">
                  You're all set!
                </p>
                <p className="text-green-600 text-sm font-['Open_Sans'] mt-1">
                  Your AI assistants are pre-configured with knowledge about your business type and ready to help. 
                  They'll learn and adapt to your specific needs as you work together.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps Info */}
          <div className="space-y-2 mt-8">
            <p className="text-sm text-gray-500 font-['Open_Sans']">
              <strong>Next steps:</strong> Start a conversation with any assistant, invite your team, or explore the features.
            </p>
            <p className="text-xs text-gray-400 font-['Open_Sans']">
              <strong>Need help?</strong> Your Personal Assistant is always available for questions and guidance.
            </p>
          </div>
      </div>
    </OnboardingLayout>
  );
}