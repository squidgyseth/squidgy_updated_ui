import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Badge } from '@/components/ui/badge';
import { DepartmentType, DepartmentOption, OnboardingProgress, BusinessType } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader, { DepartmentConfig } from '@/services/businessFlowLoader';
import { onboardingRouter } from '@/services/onboardingRouter';

export default function SupportAreasSelection() {
  const navigate = useNavigate();
  const { isReady, userId } = useUser();
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentType[]>([]);
  const [businessType, setBusinessType] = useState<BusinessType>('saas_tech');
  const [recommendedDepartments, setRecommendedDepartments] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{id: string} & DepartmentConfig>>([]);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 2,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  });
  const [loading, setLoading] = useState(true);

  const flowLoader = BusinessFlowLoader.getInstance();

  // Function to get recommended departments based on business type
  const getRecommendedDepartments = (businessType: BusinessType): DepartmentType[] => {
    const recommendationMap: Record<BusinessType, DepartmentType[]> = {
      'ecommerce': ['marketing', 'sales', 'customer_support', 'finance'],
      'agency_creative': ['marketing', 'sales', 'management_strategy', 'hr_people'],
      'saas_tech': ['marketing', 'sales', 'product_dev', 'customer_support'],
      'consultant_freelancer': ['sales', 'personal_assistant', 'finance', 'marketing'],
      'education': ['marketing', 'hr_people', 'management_strategy', 'customer_support'],
      'enterprise_corporate': ['hr_people', 'management_strategy', 'finance', 'customer_support'],
      'other': ['marketing', 'sales', 'personal_assistant', 'customer_support']
    };
    
    return recommendationMap[businessType] || ['marketing', 'sales', 'customer_support', 'personal_assistant'];
  };

  useEffect(() => {
    const loadConfiguration = async () => {
      // Wait for authentication to be ready before loading configuration
      if (!isReady) {
        return;
      }
      
      try {
        // Load configuration from YAML file
        const [departments, flowConfig] = await Promise.all([
          flowLoader.getDepartments(),
          flowLoader.getFlowConfig()
        ]);

        setDepartmentOptions(departments);
        setProgress({
          currentStep: 2,
          totalSteps: flowConfig.total_steps,
          stepTitles: flowConfig.step_titles
        });

        // Load existing onboarding data from database
        if (userId) {
          const savedData = await onboardingRouter.loadOnboardingDataForStep(userId, 2);
          if (savedData) {
            if (savedData.businessType) {
              setBusinessType(savedData.businessType);
              const recommended = getRecommendedDepartments(savedData.businessType);
              setRecommendedDepartments(recommended);
              // Auto-select recommended departments if no selection exists
              if (!savedData.selectedDepartments?.length) {
                setSelectedDepartments(recommended);
              }
            }
            if (savedData.selectedDepartments) {
              setSelectedDepartments(savedData.selectedDepartments);
            }
          }
        }

        // Fallback to localStorage for compatibility
        const localState = localStorage.getItem('onboarding_state');
        if (localState && !userId) {
          try {
            const state = JSON.parse(localState);
            if (state.businessType) {
              setBusinessType(state.businessType);
              const recommended = getRecommendedDepartments(state.businessType);
              setRecommendedDepartments(recommended);
              setSelectedDepartments(recommended);
            }
            if (state.selectedDepartments) {
              setSelectedDepartments(state.selectedDepartments);
            }
          } catch (error) {
            console.error('Error loading local onboarding state:', error);
          }
        }
      } catch (error) {
        console.error('Error loading onboarding configuration:', error);
        toast.error('Failed to load departments configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId]);

  const handleDepartmentSelect = (id: string) => {
    const departmentId = id as DepartmentType;
    setSelectedDepartments(prev => 
      prev.includes(departmentId)
        ? prev.filter(d => d !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleContinue = async () => {
    if (selectedDepartments.length === 0) {
      toast.error('Please select at least one department to continue');
      return;
    }

    if (!userId) {
      toast.error('Authentication required. Please try logging in again.');
      return;
    }

    try {
      // Save to database
      const success = await onboardingRouter.saveStepProgress(userId, 2, {
        selectedDepartments
      });

      if (!success) {
        toast.error('Failed to save progress. Please try again.');
        return;
      }

      // Also save to localStorage for compatibility
      const savedState = localStorage.getItem('onboarding_state');
      let onboardingState;
      try {
        onboardingState = savedState ? JSON.parse(savedState) : {};
      } catch {
        onboardingState = {};
      }
      
      onboardingState.currentStep = 2;
      onboardingState.selectedDepartments = selectedDepartments;
      
      localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

      toast.success(`Great! We'll set up AI assistants for ${selectedDepartments.length} departments.`);
      navigate('/ai-onboarding/choose-assistants');

    } catch (error) {
      console.error('Error saving departments selection:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/ai-onboarding/business-type');
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/choose-assistants');
  };

  // Update department options with dynamic recommendations
  const updatedDepartmentOptions = departmentOptions.map(dept => ({
    ...dept,
    isRecommended: recommendedDepartments.includes(dept.id as DepartmentType),
    isPopular: false, // Can be added to config if needed
    iconColor: dept.icon_color
  }));

  if (loading || !isReady) {
    return (
      <OnboardingLayout
        progress={progress}
        stepTitle="Which areas need AI support?"
        stepDescription="Select all departments where you'd like AI support. You can always add more later."
        onBack={() => navigate('/ai-onboarding/business-type')}
        onContinue={() => {}}
        onSkip={() => {}}
        continueDisabled={true}
        continueText="Continue"
      >
        <div className="flex items-center justify-center mt-8 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {!isReady ? 'Initializing...' : 'Loading departments...'}
          </span>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Which areas need AI support?"
      stepDescription="Select all departments where you'd like AI support. You can always add more later."
      onBack={handleBack}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueDisabled={selectedDepartments.length === 0}
      continueText="Continue"
    >
      {/* Recommended Section */}
      {recommendedDepartments.length > 0 && (
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 mb-4">
            <span className="text-sm font-semibold text-purple-700 font-['Open_Sans']">
              ⭐ Recommended for your business
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {recommendedDepartments.map((deptId) => {
              const dept = departmentOptions.find(d => d.id === deptId);
              return dept ? (
                <Badge
                  key={deptId}
                  variant={selectedDepartments.includes(deptId) ? "default" : "outline"}
                  className={`px-4 py-2 text-sm cursor-pointer transition-all font-['Open_Sans'] ${
                    selectedDepartments.includes(deptId)
                      ? "bg-[#6017E8] text-white"
                      : "border-[#6017E8] text-[#6017E8] hover:bg-[#6017E8] hover:text-white"
                  }`}
                  onClick={() => handleDepartmentSelect(deptId)}
                >
                  {dept.title}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Department Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {updatedDepartmentOptions.map((option) => (
          <SelectableCard
            key={option.id}
            id={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            iconColor={option.iconColor}
            isSelected={selectedDepartments.includes(option.id as DepartmentType)}
            isRecommended={option.isRecommended}
            isPopular={option.isPopular}
            onClick={handleDepartmentSelect}
            className="h-full"
          />
        ))}
      </div>

      {/* Selection Summary */}
      {selectedDepartments.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">{selectedDepartments.length}</span>
            </div>
            <div>
              <p className="text-blue-800 font-semibold font-['Open_Sans']">
                {selectedDepartments.length} department{selectedDepartments.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-blue-600 text-sm font-['Open_Sans']">
                We'll recommend the best AI assistants for these areas in the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}