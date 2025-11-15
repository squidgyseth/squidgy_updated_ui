import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { BusinessType, BusinessTypeOption, OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

// Business type options data
const businessTypeOptions: BusinessTypeOption[] = [
  {
    id: 'ecommerce',
    title: 'E-commerce',
    description: 'Online retail, product sales, inventory management',
    icon: '🛒',
    iconColor: '#6017E8'
  },
  {
    id: 'agency_creative',
    title: 'Agency / Creative Studio',
    description: 'Marketing, design, content creation, client services',
    icon: '🎨',
    iconColor: '#FB252A'
  },
  {
    id: 'saas_tech',
    title: 'SaaS / Tech Startup',
    description: 'Software development, product management, growth',
    icon: '🚀',
    iconColor: '#51A2FF'
  },
  {
    id: 'consultant_freelancer',
    title: 'Consultant / Freelancer',
    description: 'Professional services, client management, expertise',
    icon: '👤',
    iconColor: '#FB7A2A'
  },
  {
    id: 'education',
    title: 'Education',
    description: 'Training, curriculum, student management, research',
    icon: '🎓',
    iconColor: '#28A745'
  },
  {
    id: 'enterprise_corporate',
    title: 'Enterprise / Corporate',
    description: 'Large organization, multiple departments, compliance',
    icon: '🏢',
    iconColor: '#51A2FF'
  },
  {
    id: 'other',
    title: 'Other',
    description: 'Tell us more about your unique business needs',
    icon: '❓',
    iconColor: '#6C757D'
  }
];

export default function BusinessTypeSelection() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [userName, setUserName] = useState<string>('Aleksa Jagolnik');

  const progress: OnboardingProgress = {
    currentStep: 1,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  };

  useEffect(() => {
    // Load any existing onboarding state from localStorage or API
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.businessType) {
          setSelectedBusinessType(state.businessType);
        }
        if (state.userName) {
          setUserName(state.userName);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

  const handleBusinessTypeSelect = (id: string) => {
    setSelectedBusinessType(id as BusinessType);
  };

  const handleContinue = () => {
    if (!selectedBusinessType) {
      toast.error('Please select a business type to continue');
      return;
    }

    // Save state to localStorage
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
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/support-areas');
  };

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
            iconColor={option.iconColor}
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