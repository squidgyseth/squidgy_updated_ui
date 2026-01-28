import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { BusinessType, BusinessTypeOption, OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader, { BusinessTypeConfig } from '@/services/businessFlowLoader';
import { onboardingRouter } from '@/services/onboardingRouter';

export default function BusinessTypeSelection() {
  const navigate = useNavigate();
  const { userId, isReady } = useUser();
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [userName, setUserName] = useState<string>('User');
  const [businessTypeOptions, setBusinessTypeOptions] = useState<Array<{id: string} & BusinessTypeConfig>>([]);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 1,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  });
  const [loading, setLoading] = useState(true);

  const flowLoader = BusinessFlowLoader.getInstance();

  useEffect(() => {
    const loadConfiguration = async () => {
      // Wait for authentication to be ready before loading configuration
      if (!isReady) {
        return;
      }
      
      try {
        // Load configuration from YAML files
        const [businessTypes, flowConfig] = await Promise.all([
          flowLoader.getBusinessTypes(),
          flowLoader.getFlowConfig()
        ]);

        setBusinessTypeOptions(businessTypes);
        setProgress({
          currentStep: 1,
          totalSteps: flowConfig.total_steps,
          stepTitles: flowConfig.step_titles
        });

        // Load existing onboarding data from database
        if (userId) {
          const savedData = await onboardingRouter.loadOnboardingDataForStep(userId, 1);
          if (savedData?.businessType) {
            setSelectedBusinessType(savedData.businessType);
          }
        }

        // Fallback to localStorage for compatibility
        const localState = localStorage.getItem('onboarding_state');
        if (localState) {
          try {
            const state = JSON.parse(localState);
            if (state.businessType && !selectedBusinessType) {
              setSelectedBusinessType(state.businessType);
            }
            if (state.userName) {
              setUserName(state.userName);
            }
          } catch (error) {
            console.error('Error loading local onboarding state:', error);
          }
        }
      } catch (error) {
        console.error('Error loading onboarding configuration:', error);
        toast.error('Failed to load onboarding configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId]);

  const handleBusinessTypeSelect = (id: string) => {
    setSelectedBusinessType(id as BusinessType);
  };

  const handleContinue = async () => {
    if (!selectedBusinessType) {
      toast.error('Please select a business type to continue');
      return;
    }

    if (!userId) {
      toast.error('Authentication required. Please try logging in again.');
      return;
    }

    try {
      // Save to database
      const success = await onboardingRouter.saveStepProgress(userId, 1, {
        businessType: selectedBusinessType
      });

      if (!success) {
        toast.error('Failed to save progress. Please try again.');
        return;
      }

      // Also save to localStorage for compatibility
      const onboardingState = {
        currentStep: 1,
        businessType: selectedBusinessType,
        selectedDepartments: [],
        selectedAssistants: [],
        personalizations: [],
        companyDetails: {},
        userName: userName
      };
      
      localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

      // Show success message for selected business type
      const selectedOption = businessTypeOptions.find(opt => opt.id === selectedBusinessType);
      if (selectedOption) {
        toast.success(`Great choice! We'll customize your AI assistants for ${selectedOption.title}.`);
      }

      // Navigate to next step
      navigate('/ai-onboarding/support-areas');

    } catch (error) {
      console.error('Error saving business type:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/support-areas');
  };

  if (loading || !isReady) {
    return (
      <OnboardingLayout
        progress={progress}
        stepTitle="What's your business type?"
        stepDescription={`Hi ${userName}! Let's set up your AI team\n\nTell us about your business so we can recommend the perfect AI assistants for your workflow.`}
        onContinue={handleContinue}
        onSkip={handleSkip}
        continueDisabled={true}
        continueText="Continue"
      >
        <div className="flex items-center justify-center mt-8 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {!isReady ? 'Initializing...' : 'Loading business types...'}
          </span>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="What's your business type?"
      stepDescription={`Hi ${userName}! Let's set up your AI team\n\nTell us about your business so we can recommend the perfect AI assistants for your workflow.`}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueDisabled={!selectedBusinessType}
      continueText="Continue"
    >
      {/* Business Type Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {businessTypeOptions.map((option) => (
          <SelectableCard
            key={option.id}
            id={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            iconColor={option.icon_color}
            isSelected={selectedBusinessType === option.id}
            onClick={handleBusinessTypeSelect}
            className="h-full"
          />
        ))}
      </div>

      {/* Selected Business Type Confirmation */}
      {selectedBusinessType && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#28A745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-green-800 font-semibold font-['Open_Sans']">
                Great choice! We'll customize your AI assistants for {businessTypeOptions.find(opt => opt.id === selectedBusinessType)?.title}.
              </p>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
