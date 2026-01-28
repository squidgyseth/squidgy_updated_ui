import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  AssistantPersonalization, 
  OnboardingProgress, 
  AvatarStyle, 
  CommunicationTone 
} from '@/types/onboarding.types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import BusinessFlowLoader, { AgentConfig } from '@/services/businessFlowLoader';
import { onboardingRouter } from '@/services/onboardingRouter';
import { onboardingDataService } from '@/services/onboardingDataService';

interface SelectedAssistant {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  agentConfig?: string | null;
  presetupRequired?: boolean;
  presetupPage?: string | null;
}

export default function PersonalizeAssistants() {
  const navigate = useNavigate();
  const { isReady, userId } = useUser();
  const [personalizations, setPersonalizations] = useState<AssistantPersonalization[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<SelectedAssistant[]>([]);
  const [avatarStyleOptions, setAvatarStyleOptions] = useState<Array<{ value: string; label: string; description: string }>>([]);
  const [communicationToneOptions, setCommunicationToneOptions] = useState<Array<{ value: string; label: string; description: string }>>([]);
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());
  const [activeConfigComponent, setActiveConfigComponent] = useState<{[key: string]: React.ComponentType<any>}>({});
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 4,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Configure Assistants', 'Website Details', 'Business Details', 'Welcome']
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
        const [personalizationConfig, flowConfig] = await Promise.all([
          flowLoader.getPersonalizationOptions(),
          flowLoader.getFlowConfig()
        ]);

        setAvatarStyleOptions(personalizationConfig.avatar_styles);
        setCommunicationToneOptions(personalizationConfig.communication_tones);
        setProgress({
          currentStep: 4,
          totalSteps: flowConfig.total_steps,
          stepTitles: flowConfig.step_titles
        });

        // Load existing onboarding data from database
        let assistantData: { selectedAssistants?: string[]; selectedDepartments?: string[] } = {};
        let existingPersonalizations: any[] = [];
        
        if (userId) {
          const savedData = await onboardingRouter.loadOnboardingDataForStep(userId, 4);
          if (savedData) {
            assistantData = {
              selectedAssistants: savedData.selectedAssistants,
              selectedDepartments: savedData.selectedDepartments
            };
          }
          
          // Load existing personalizations
          existingPersonalizations = await onboardingDataService.getAssistantPersonalizations(userId);
        }
        
        // Fallback to localStorage for compatibility if no database data loaded
        if (!assistantData.selectedAssistants || !assistantData.selectedDepartments) {
          const savedState = localStorage.getItem('onboarding_state');
          if (savedState) {
            try {
              const state = JSON.parse(savedState);
              assistantData = {
                selectedAssistants: state.selectedAssistants || assistantData.selectedAssistants || [],
                selectedDepartments: state.selectedDepartments || assistantData.selectedDepartments || []
              };
              
              if (state.personalizations) {
                existingPersonalizations = state.personalizations;
              }
            } catch (error) {
              console.error('Error loading local onboarding state:', error);
            }
          }
        }
        
        // Process assistant data if available
        if (assistantData.selectedAssistants && assistantData.selectedAssistants.length > 0 && assistantData.selectedDepartments) {
          // Find assistant details using the hierarchical flow
          const selectedAssistantDetails: SelectedAssistant[] = [];
          
          // Get all agents for the selected departments
          const agentsByDepartment = await flowLoader.getAgentsByDepartment(assistantData.selectedDepartments);
          
          // Search through all departments to find the selected assistants
          const addedAgentIds = new Set<string>(); // Track added agents to prevent duplicates
          
          Object.values(agentsByDepartment).forEach(departmentAgents => {
            departmentAgents.forEach((agent: {id: string} & AgentConfig) => {
              if (assistantData.selectedAssistants!.includes(agent.id) && !addedAgentIds.has(agent.id)) {
                selectedAssistantDetails.push({
                  id: agent.id,
                  name: agent.name,
                  icon: agent.icon,
                  iconColor: agent.icon_color,
                  agentConfig: agent.agent_config_file,
                  presetupRequired: agent.presetup_required || false,
                  presetupPage: agent.presetup_page || null
                });
                addedAgentIds.add(agent.id); // Mark this agent as added
              }
            });
          });

          setSelectedAssistants(selectedAssistantDetails);
          
          // Convert existing personalizations to the expected format
          if (existingPersonalizations.length > 0) {
            const convertedPersonalizations: AssistantPersonalization[] = existingPersonalizations.map(p => ({
              assistantId: p.assistant_id,
              customName: p.custom_name || '',
              avatarStyle: p.avatar_style as AvatarStyle,
              communicationTone: p.communication_tone as CommunicationTone
            }));
            setPersonalizations(convertedPersonalizations);
          } else {
            // Initialize personalizations with defaults for new assistants
            const defaultAvatarStyle = personalizationConfig.avatar_styles[0]?.value || 'professional';
            const defaultCommunicationTone = personalizationConfig.communication_tones[0]?.value || 'professional';
            
            const initialPersonalizations: AssistantPersonalization[] = selectedAssistantDetails.map(assistant => ({
              assistantId: assistant.id,
              customName: '',
              avatarStyle: defaultAvatarStyle as AvatarStyle,
              communicationTone: defaultCommunicationTone as CommunicationTone
            }));
            setPersonalizations(initialPersonalizations);
          }
        }
      } catch (error) {
        console.error('Error loading personalization configuration:', error);
        toast.error('Failed to load personalization options');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, [isReady, userId]);

  const updatePersonalization = (assistantId: string, field: keyof AssistantPersonalization, value: any) => {
    setPersonalizations(prev => {
      const existingIndex = prev.findIndex(p => p.assistantId === assistantId);
      
      if (existingIndex !== -1) {
        // Update existing personalization
        return prev.map(p => 
          p.assistantId === assistantId 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        // Add new personalization
        const newPersonalization: AssistantPersonalization = {
          assistantId,
          customName: '',
          avatarStyle: 'professional',
          communicationTone: 'professional',
          [field]: value
        };
        return [...prev, newPersonalization];
      }
    });
  };

  const handleContinue = async () => {
    if (!userId) {
      toast.error('Authentication required. Please try logging in again.');
      return;
    }

    try {
      // Convert personalizations to database format and save
      const personalizationsToSave = personalizations.map(p => ({
        user_id: userId,
        assistant_id: p.assistantId,
        custom_name: p.customName || null,
        avatar_style: p.avatarStyle,
        communication_tone: p.communicationTone,
        is_enabled: true
      }));

      const success = await onboardingDataService.saveMultiplePersonalizations(personalizationsToSave);
      
      if (!success) {
        toast.error('Failed to save personalization settings. Please try again.');
        return;
      }

      // Also save step progress
      await onboardingRouter.saveStepProgress(userId, 4, {});

      // Update localStorage for compatibility
      const savedState = localStorage.getItem('onboarding_state');
      let onboardingState;
      try {
        onboardingState = savedState ? JSON.parse(savedState) : {};
      } catch {
        onboardingState = {};
      }
      
      onboardingState.currentStep = 4;
      onboardingState.personalizations = personalizations;
      
      localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

      toast.success('Your AI assistants have been personalized and are ready to work!');
      navigate('/onboarding/website-details');

    } catch (error) {
      console.error('Error saving personalization settings:', error);
      toast.error('Failed to save personalization settings. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/ai-onboarding/choose-assistants');
  };

  const handleSkip = () => {
    navigate('/onboarding/website-details');
  };

  const getPersonalization = (assistantId: string): AssistantPersonalization => {
    const found = personalizations.find(p => p.assistantId === assistantId);
    const defaultAvatarStyle = avatarStyleOptions[0]?.value || 'professional';
    const defaultCommunicationTone = communicationToneOptions[0]?.value || 'professional';
    
    const defaultPersonalization = {
      assistantId,
      customName: '',
      avatarStyle: defaultAvatarStyle as AvatarStyle,
      communicationTone: defaultCommunicationTone as CommunicationTone
    };
    
    return found || defaultPersonalization;
  };

  const toggleConfigExpansion = async (assistantId: string) => {
    setExpandedConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assistantId)) {
        newSet.delete(assistantId);
      } else {
        newSet.add(assistantId);
        // Load the configuration component dynamically when expanding
        loadConfigComponent(assistantId);
      }
      return newSet;
    });
  };

  const loadConfigComponent = async (assistantId: string) => {
    const assistant = selectedAssistants.find(a => a.id === assistantId);
    if (!assistant?.presetupPage) return;

    // Dynamic component mapping based on presetup_page
    const componentMap: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
      '/solar-config': () => import('../../pages/SolarConfig'),
      // Add more configuration components here as needed
    };

    try {
      const importFn = componentMap[assistant.presetupPage];
      if (importFn) {
        const component = await importFn();
        setActiveConfigComponent(prev => ({
          ...prev,
          [assistantId]: component.default
        }));
      }
    } catch (error) {
      console.error(`Failed to load config component for ${assistantId}:`, error);
    }
  };

  if (loading || !isReady) {
    return (
      <OnboardingLayout
        progress={progress}
        stepTitle="Configure your AI assistants"
        stepDescription="Set custom names and communication preferences for your selected AI assistants. Each assistant has their own unique personality and expertise. This step is optional - you can always configure these settings later."
        onBack={() => navigate('/ai-onboarding/choose-assistants')}
        onContinue={() => {}}
        onSkip={() => {}}
        continueText="Continue"
      >
        <div className="flex items-center justify-center mt-8 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {!isReady ? 'Initializing...' : 'Loading personalization options...'}
          </span>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Configure your AI assistants"
      stepDescription="Set custom names and communication preferences for your selected AI assistants. Each assistant has their own unique personality and expertise. This step is optional - you can always configure these settings later."
      onBack={handleBack}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueText="Continue"
    >
      {selectedAssistants.length === 0 ? (
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
            No assistants selected yet
          </h3>
          <p className="text-gray-600 font-['Open_Sans'] mb-6">
            You haven't selected any assistants in the previous step. You can go back to choose some assistants to personalize.
          </p>
          <button
            onClick={() => navigate('/ai-onboarding/choose-assistants')}
            className="px-6 py-3 bg-[#6017E8] text-white font-semibold rounded-lg hover:bg-[#5015d6] transition-colors font-['Open_Sans']"
          >
            Go Back to Choose Assistants
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {selectedAssistants.map((assistant) => {
          const personalization = getPersonalization(assistant.id);
          
          return (
            <Card key={assistant.id} className="p-6">
              <CardContent className="p-0">
                {/* Assistant Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                    {assistant.icon.startsWith('http') ? (
                      <img 
                        src={assistant.icon} 
                        alt={assistant.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-2xl"
                        style={{ backgroundColor: assistant.iconColor }}
                      >
                        {assistant.icon}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
                      {assistant.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-['Open_Sans']">
                      Configure name and communication preferences
                    </p>
                  </div>
                </div>

                {/* Personalization Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Custom Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`name-${assistant.id}`} className="text-sm font-semibold text-gray-700 font-['Open_Sans']">
                      Custom Name (Optional)
                    </Label>
                    <Input
                      id={`name-${assistant.id}`}
                      placeholder={assistant.name}
                      value={personalization.customName || ''}
                      onChange={(e) => updatePersonalization(assistant.id, 'customName', e.target.value)}
                      className="font-['Open_Sans']"
                    />
                    <p className="text-xs text-gray-500 font-['Open_Sans']">
                      Give your assistant a personal name
                    </p>
                  </div>

                  {/* Communication Tone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 font-['Open_Sans']">
                      Communication Tone
                    </Label>
                    <Select
                      key={`${assistant.id}-tone-${personalization.communicationTone}`}
                      value={personalization.communicationTone}
                      onValueChange={(value) => updatePersonalization(assistant.id, 'communicationTone', value as CommunicationTone)}
                    >
                      <SelectTrigger className="font-['Open_Sans']">
                        <SelectValue placeholder="Choose tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {communicationToneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="font-['Open_Sans']">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 font-['Open_Sans']">
                      How your assistant communicates
                    </p>
                  </div>
                </div>

                {/* Presetup Configuration Section */}
                {assistant.presetupRequired && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => toggleConfigExpansion(assistant.id)}
                      className="w-full flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-amber-600" />
                        <div className="text-left">
                          <p className="font-semibold text-amber-800 font-['Open_Sans']">
                            Setup Required
                          </p>
                          <p className="text-sm text-amber-600 font-['Open_Sans']">
                            This assistant needs initial configuration to work properly
                          </p>
                        </div>
                      </div>
                      {expandedConfigs.has(assistant.id) ? (
                        <ChevronUp className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-600" />
                      )}
                    </button>

                    {expandedConfigs.has(assistant.id) && (
                      <div className="mt-4">
                        {activeConfigComponent[assistant.id] ? (
                          // Render the embedded configuration component
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-0 [&_.min-h-screen]:min-h-0 [&_.min-h-screen]:bg-transparent [&_.sticky]:static [&_.max-w-7xl]:max-w-none [&_.max-w-4xl]:max-w-none [&_.px-6]:px-0 [&_.py-8]:py-0 [&_.shadow-xl]:shadow-none [&_.bg-white\\/80]:bg-transparent">
                              {React.createElement(activeConfigComponent[assistant.id])}
                            </div>
                          </div>
                        ) : (
                          // Loading state while component loads
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">
                                Loading {assistant.name} Configuration...
                              </h4>
                              <p className="text-gray-600 font-['Open_Sans']">
                                Please wait while we prepare the configuration interface.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>
      )}

      {/* Pro Tip */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-sm">💡</span>
          </div>
          <div>
            <p className="text-blue-800 font-semibold text-sm font-['Open_Sans'] mb-1">
              Pro tip: You can change these settings anytime
            </p>
            <p className="text-blue-600 text-sm font-['Open_Sans']">
              Each assistant will remember your preferences and adapt their responses accordingly. 
              You can always update names, avatars, and communication styles from the assistant settings.
            </p>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
