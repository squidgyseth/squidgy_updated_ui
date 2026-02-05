import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AssistantCard } from '@/components/onboarding/AssistantCard';
import { DepartmentType, AssistantOption, OnboardingProgress } from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import BusinessFlowLoader, { AgentConfig } from '@/services/businessFlowLoader';
import { onboardingRouter } from '@/services/onboardingRouter';

export default function ChooseAssistants() {
  const navigate = useNavigate();
  const { isReady, userId } = useUser();
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentType[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
  const [assistantsByDepartment, setAssistantsByDepartment] = useState<Record<DepartmentType, AssistantOption[]>>({} as Record<DepartmentType, AssistantOption[]>);
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 3,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  });
  const [loading, setLoading] = useState(true);

  const flowLoader = BusinessFlowLoader.getInstance();

  // Helper function to convert AgentConfig to AssistantOption
  const convertAgentConfig = (config: {id: string} & AgentConfig, department: DepartmentType): AssistantOption => ({
    id: config.id,
    name: config.name,
    department,
    description: config.description,
    icon: config.icon,
    iconColor: config.icon_color,
    isRecommended: config.is_recommended || false,
    keyCapabilities: (config.key_capabilities || []).map(cap => ({ name: cap })),
    agentConfig: config.agent_config_file // Link to actual agent config file
  });

  useEffect(() => {
    const loadConfiguration = async () => {
      // Wait for authentication to be ready before loading configuration
      if (!isReady) {
        return;
      }
      
      try {
        // Load configuration from YAML files
        const flowConfig = await flowLoader.getFlowConfig();

        // Load existing onboarding data from database
        let departments: string[] = [];
        if (userId) {
          const savedData = await onboardingRouter.loadOnboardingDataForStep(userId, 3);
          if (savedData) {
            if (savedData.selectedDepartments) {
              departments = savedData.selectedDepartments;
              setSelectedDepartments(savedData.selectedDepartments);
            }
            if (savedData.selectedAssistants) {
              setSelectedAssistants(savedData.selectedAssistants);
            }
          }
        }
        
        // Fallback to localStorage for compatibility
        if (!departments.length) {
          const savedState = localStorage.getItem('onboarding_state');
          if (savedState && !userId) {
            try {
              const state = JSON.parse(savedState);
              departments = state.selectedDepartments || [];
            } catch (error) {
              console.error('Error loading onboarding state:', error);
            }
          }
        }

        let assistantsData: Record<DepartmentType, AssistantOption[]> = {} as Record<DepartmentType, AssistantOption[]>;
        
        if (departments.length > 0) {
          const agentsByDepartment = await flowLoader.getAgentsByDepartment(departments);
          
          Object.entries(agentsByDepartment).forEach(([deptId, agents]) => {
            assistantsData[deptId as DepartmentType] = agents.map(agent => 
              convertAgentConfig(agent, deptId as DepartmentType)
            );
          });
        }

        setAssistantsByDepartment(assistantsData);
        setProgress({
          currentStep: 3,
          totalSteps: flowConfig.total_steps,
          stepTitles: flowConfig.step_titles
        });

        // Auto-select recommended assistants if none selected yet (only for new users)
        if (!selectedAssistants.length && departments.length > 0) {
          const recommendedAssistants: string[] = [];
          departments.forEach((dept: DepartmentType) => {
            const deptAssistants = assistantsData[dept] || [];
            deptAssistants.forEach(assistant => {
              if (assistant.isRecommended) {
                recommendedAssistants.push(assistant.id);
              }
            });
          });
          setSelectedAssistants(recommendedAssistants);
        }

        // Also fallback to localStorage for compatibility
        const localState = localStorage.getItem('onboarding_state');
        if (localState && !userId && !departments.length) {
          try {
            const state = JSON.parse(localState);
            if (state.selectedDepartments) {
              setSelectedDepartments(state.selectedDepartments);
              if (state.selectedAssistants) {
                setSelectedAssistants(state.selectedAssistants);
              }
            }
          } catch (error) {
            console.error('Error loading local onboarding state:', error);
          }
        }
      } catch (error) {
        console.error('Error loading assistants configuration:', error);
        toast.error('Failed to load assistants configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId]);

  const handleAssistantSelect = (assistantId: string) => {
    setSelectedAssistants(prev => 
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  const handleContinue = async () => {
    if (selectedAssistants.length === 0) {
      toast.error('Please select at least one AI assistant to continue');
      return;
    }

    if (!userId) {
      toast.error('Authentication required. Please try logging in again.');
      return;
    }

    try {
      // Save to database
      const success = await onboardingRouter.saveStepProgress(userId, 3, {
        selectedAssistants
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
      
      onboardingState.currentStep = 3;
      onboardingState.selectedAssistants = selectedAssistants;
      
      localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

      toast.success(`Perfect! ${selectedAssistants.length} AI assistants will be pre-configured and ready to help.`);
      navigate('/ai-onboarding/personalize');

    } catch (error) {
      console.error('Error saving assistants selection:', error);
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/ai-onboarding/support-areas');
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/personalize');
  };

  // Get all assistants for selected departments
  const availableAssistants = selectedDepartments.flatMap(dept => 
    assistantsByDepartment[dept] || []
  );

  const departmentTitles: Record<DepartmentType, string> = {
    hr_people: 'HR & People Ops',
    marketing: 'Marketing',
    sales: 'Sales',
    management_strategy: 'Management & Strategy',
    customer_support: 'Customer Support',
    personal_assistant: 'Personal Assistant',
    finance: 'Finance',
    product_dev: 'Product / Dev'
  };

  if (loading || !isReady) {
    return (
      <OnboardingLayout
        progress={progress}
        stepTitle="Choose your AI assistants"
        stepDescription="Based on your selected departments, here are the AI assistants we recommend. Select the ones that best fit your needs."
        onBack={() => navigate('/ai-onboarding/support-areas')}
        onContinue={() => {}}
        onSkip={() => {}}
        continueDisabled={true}
        continueText="Continue"
      >
        <div className="flex items-center justify-center mt-8 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {!isReady ? 'Initializing...' : 'Loading assistants...'}
          </span>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Choose your AI assistants"
      stepDescription="Based on your selected departments, here are the AI assistants we recommend. Select the ones that best fit your needs."
      onBack={handleBack}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueDisabled={selectedAssistants.length === 0}
      continueText="Continue"
    >
      {/* Assistants by Department */}
      <div className="space-y-8">
        {selectedDepartments.map(dept => {
          const deptAssistants = assistantsByDepartment[dept] || [];
          if (deptAssistants.length === 0) return null;
          
          return (
            <div key={dept}>
              {/* Department Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#6017E8]"></div>
                <h2 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">
                  {departmentTitles[dept]}
                </h2>
              </div>
              
              {/* Department Assistants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {deptAssistants.map(assistant => (
                  <AssistantCard
                    key={assistant.id}
                    assistant={assistant}
                    isSelected={selectedAssistants.includes(assistant.id)}
                    onSelect={handleAssistantSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedAssistants.length > 0 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">{selectedAssistants.length}</span>
            </div>
            <div>
              <p className="text-green-800 font-semibold font-['Open_Sans']">
                {selectedAssistants.length} AI assistant{selectedAssistants.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-green-600 text-sm font-['Open_Sans']">
                Your AI team will be pre-configured and ready to help immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
