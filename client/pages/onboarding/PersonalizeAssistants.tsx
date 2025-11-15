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
import { toast } from 'sonner';

// Mock assistant data - in a real app this would come from the previous step
const mockSelectedAssistants = [
  { id: 'onboarding_specialist', name: 'Onboarding Specialist', icon: '🎯', iconColor: '#28A745' },
  { id: 'proposal_writer', name: 'Proposal Writer', icon: '📄', iconColor: '#28A745' },
  { id: 'crm_assistant', name: 'CRM Assistant', icon: '📊', iconColor: '#6017E8' },
  { id: 'social_media_manager', name: 'Social Media Manager', icon: '📱', iconColor: '#FB252A' },
  { id: 'content_strategist', name: 'Content Strategist', icon: '✍️', iconColor: '#6017E8' }
];

const avatarStyleOptions: { value: AvatarStyle; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal business style' },
  { value: 'friendly', label: 'Friendly', description: 'Approachable and warm' },
  { value: 'corporate', label: 'Corporate', description: 'Traditional corporate style' },
  { value: 'creative', label: 'Creative', description: 'Modern and innovative' }
];

const communicationToneOptions: { value: CommunicationTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'formal', label: 'Formal', description: 'Traditional and structured' }
];

export default function PersonalizeAssistants() {
  const navigate = useNavigate();
  const [personalizations, setPersonalizations] = useState<AssistantPersonalization[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<typeof mockSelectedAssistants>([]);

  const progress: OnboardingProgress = {
    currentStep: 4,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  };

  useEffect(() => {
    // Load existing onboarding state
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // In a real app, we'd fetch assistant details based on selectedAssistants IDs
        // For now, use mock data filtered by selected IDs
        if (state.selectedAssistants) {
          const filteredAssistants = mockSelectedAssistants.filter(assistant =>
            state.selectedAssistants.includes(assistant.id)
          );
          setSelectedAssistants(filteredAssistants);
          
          // Initialize personalizations with defaults
          const initialPersonalizations: AssistantPersonalization[] = filteredAssistants.map(assistant => ({
            assistantId: assistant.id,
            customName: '',
            avatarStyle: 'professional',
            communicationTone: 'professional'
          }));
          setPersonalizations(initialPersonalizations);
        }

        // Load existing personalizations if any
        if (state.personalizations) {
          setPersonalizations(state.personalizations);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

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

  const handleContinue = () => {
    // Update state in localStorage
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
    navigate('/ai-onboarding/company-details');
  };

  const handleBack = () => {
    navigate('/ai-onboarding/choose-assistants');
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/company-details');
  };

  const getPersonalization = (assistantId: string): AssistantPersonalization => {
    const found = personalizations.find(p => p.assistantId === assistantId);
    const defaultPersonalization = {
      assistantId,
      customName: '',
      avatarStyle: 'professional' as AvatarStyle,
      communicationTone: 'professional' as CommunicationTone
    };
    
    return found || defaultPersonalization;
  };

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Personalize your assistants"
      stepDescription="Make your AI team truly yours by customizing their names, appearance, and communication style.\n\nThis step is optional - you can always personalize later."
      onBack={handleBack}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueText="Continue"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {selectedAssistants.map((assistant) => {
          const personalization = getPersonalization(assistant.id);
          
          return (
            <Card key={assistant.id} className="p-6">
              <CardContent className="p-0">
                {/* Assistant Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: assistant.iconColor }}
                  >
                    {assistant.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">
                      {assistant.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-['Open_Sans']">
                      Customize this assistant's personality
                    </p>
                  </div>
                </div>

                {/* Personalization Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                  {/* Avatar Style */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 font-['Open_Sans']">
                      Avatar Style
                    </Label>
                    <Select
                      key={`${assistant.id}-avatar-${personalization.avatarStyle}`}
                      value={personalization.avatarStyle}
                      onValueChange={(value) => updatePersonalization(assistant.id, 'avatarStyle', value as AvatarStyle)}
                    >
                      <SelectTrigger className="font-['Open_Sans']">
                        <SelectValue placeholder="Choose avatar style" />
                      </SelectTrigger>
                      <SelectContent>
                        {avatarStyleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="font-['Open_Sans']">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 font-['Open_Sans']">
                      Visual style for your assistant
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
              </CardContent>
            </Card>
          );
        })}
      </div>

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