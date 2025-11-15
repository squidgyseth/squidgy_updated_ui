import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AssistantCard } from '@/components/onboarding/AssistantCard';
import { DepartmentType, AssistantOption, OnboardingProgress } from '@/types/onboarding.types';
import { toast } from 'sonner';

// AI Assistants data organized by department
const assistantsByDepartment: Record<DepartmentType, AssistantOption[]> = {
  hr_people: [
    {
      id: 'recruiting_assistant',
      name: 'Recruiting Assistant',
      department: 'hr_people',
      description: 'Sources candidates, screens resumes, schedules interviews',
      icon: '👥',
      iconColor: '#FB7A2A',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Candidate sourcing' },
        { name: 'Resume screening' },
        { name: 'Interview scheduling' },
        { name: 'Pipeline management' }
      ]
    },
    {
      id: 'onboarding_specialist',
      name: 'Onboarding Specialist',
      department: 'hr_people',
      description: 'Guides new hires through onboarding process',
      icon: '🎯',
      iconColor: '#28A745',
      keyCapabilities: [
        { name: 'Onboarding workflow' },
        { name: 'Documentation' },
        { name: 'Training coordination' },
        { name: 'Progress tracking' }
      ]
    },
    {
      id: 'policy_advisor',
      name: 'Policy Advisor',
      department: 'hr_people',
      description: 'Helps with HR policies, compliance, and employee questions',
      icon: '📋',
      iconColor: '#6017E8',
      keyCapabilities: [
        { name: 'Policy guidance' },
        { name: 'Compliance checks' },
        { name: 'Employee support' },
        { name: 'Documentation' }
      ]
    }
  ],
  marketing: [
    {
      id: 'social_media_manager',
      name: 'Social Media Manager',
      department: 'marketing',
      description: 'Creates posts, schedules content, analyzes engagement',
      icon: '📱',
      iconColor: '#FB252A',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Content creation' },
        { name: 'Scheduling' },
        { name: 'Analytics' },
        { name: 'Engagement tracking' }
      ]
    },
    {
      id: 'content_strategist',
      name: 'Content Strategist',
      department: 'marketing',
      description: 'Develops content plans, SEO optimization, blog writing',
      icon: '✍️',
      iconColor: '#6017E8',
      isRecommended: true,
      keyCapabilities: [
        { name: 'SEO optimization' },
        { name: 'Blog writing' },
        { name: 'Content planning' },
        { name: 'Keyword research' }
      ]
    },
    {
      id: 'campaign_manager',
      name: 'Campaign Manager',
      department: 'marketing',
      description: 'Plans and executes marketing campaigns across channels',
      icon: '🎯',
      iconColor: '#51A2FF',
      keyCapabilities: [
        { name: 'Campaign planning' },
        { name: 'Multi-channel execution' },
        { name: 'Performance tracking' },
        { name: 'Budget optimization' }
      ]
    }
  ],
  sales: [
    {
      id: 'lead_qualifier',
      name: 'Lead Qualifier',
      department: 'sales',
      description: 'Scores leads, prioritizes prospects, generates insights',
      icon: '🎯',
      iconColor: '#FB252A',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Lead scoring' },
        { name: 'Prospect research' },
        { name: 'Pipeline management' },
        { name: 'Data insights' }
      ]
    },
    {
      id: 'proposal_writer',
      name: 'Proposal Writer',
      department: 'sales',
      description: 'Creates compelling proposals and sales materials',
      icon: '📄',
      iconColor: '#28A745',
      keyCapabilities: [
        { name: 'Proposal creation' },
        { name: 'Sales collateral' },
        { name: 'Pricing strategies' },
        { name: 'Contract templates' }
      ]
    },
    {
      id: 'crm_assistant',
      name: 'CRM Assistant',
      department: 'sales',
      description: 'Manages contacts, tracks interactions, updates records',
      icon: '📊',
      iconColor: '#6017E8',
      keyCapabilities: [
        { name: 'Contact management' },
        { name: 'Activity tracking' },
        { name: 'Data hygiene' },
        { name: 'Reporting' }
      ]
    }
  ],
  management_strategy: [
    {
      id: 'strategy_advisor',
      name: 'Strategy Advisor',
      department: 'management_strategy',
      description: 'Provides strategic insights and decision support',
      icon: '🧠',
      iconColor: '#6017E8',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Strategic planning' },
        { name: 'Market analysis' },
        { name: 'Decision support' },
        { name: 'Risk assessment' }
      ]
    },
    {
      id: 'performance_analyst',
      name: 'Performance Analyst',
      department: 'management_strategy',
      description: 'Tracks KPIs, generates reports, identifies trends',
      icon: '📈',
      iconColor: '#51A2FF',
      keyCapabilities: [
        { name: 'KPI tracking' },
        { name: 'Report generation' },
        { name: 'Trend analysis' },
        { name: 'Performance insights' }
      ]
    },
    {
      id: 'project_coordinator',
      name: 'Project Coordinator',
      department: 'management_strategy',
      description: 'Manages tasks, timelines, and team coordination',
      icon: '📅',
      iconColor: '#FB7A2A',
      keyCapabilities: [
        { name: 'Task management' },
        { name: 'Timeline tracking' },
        { name: 'Team coordination' },
        { name: 'Resource planning' }
      ]
    }
  ],
  customer_support: [
    {
      id: 'help_desk_agent',
      name: 'Help Desk Agent',
      department: 'customer_support',
      description: 'Handles customer inquiries and support tickets',
      icon: '🎧',
      iconColor: '#51A2FF',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Ticket management' },
        { name: 'Customer communication' },
        { name: 'Issue resolution' },
        { name: 'Knowledge base' }
      ]
    },
    {
      id: 'knowledge_manager',
      name: 'Knowledge Manager',
      department: 'customer_support',
      description: 'Maintains help articles and knowledge base',
      icon: '📚',
      iconColor: '#28A745',
      keyCapabilities: [
        { name: 'Knowledge base' },
        { name: 'Documentation' },
        { name: 'Self-service resources' },
        { name: 'Content updates' }
      ]
    }
  ],
  personal_assistant: [
    {
      id: 'executive_assistant',
      name: 'Executive Assistant',
      department: 'personal_assistant',
      description: 'Manages calendar, emails, and daily tasks',
      icon: '👤',
      iconColor: '#6017E8',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Calendar management' },
        { name: 'Email organization' },
        { name: 'Task prioritization' },
        { name: 'Meeting coordination' }
      ]
    },
    {
      id: 'research_specialist',
      name: 'Research Specialist',
      department: 'personal_assistant',
      description: 'Conducts research, compiles reports, fact checking',
      icon: '🔍',
      iconColor: '#51A2FF',
      keyCapabilities: [
        { name: 'Market research' },
        { name: 'Competitive analysis' },
        { name: 'Report compilation' },
        { name: 'Fact verification' }
      ]
    }
  ],
  finance: [
    {
      id: 'budget_analyst',
      name: 'Budget Analyst',
      department: 'finance',
      description: 'Tracks expenses, forecasts budgets, financial planning',
      icon: '📊',
      iconColor: '#FFC107',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Budget tracking' },
        { name: 'Expense analysis' },
        { name: 'Financial forecasting' },
        { name: 'Cost optimization' }
      ]
    },
    {
      id: 'invoice_manager',
      name: 'Invoice Manager',
      department: 'finance',
      description: 'Manages invoicing, payments, and financial records',
      icon: '💰',
      iconColor: '#28A745',
      keyCapabilities: [
        { name: 'Invoicing' },
        { name: 'Payment tracking' },
        { name: 'Financial records' },
        { name: 'Collections' }
      ]
    }
  ],
  product_dev: [
    {
      id: 'product_strategist',
      name: 'Product Strategist',
      department: 'product_dev',
      description: 'Helps with roadmaps, user research, feature planning',
      icon: '💡',
      iconColor: '#6017E8',
      isRecommended: true,
      keyCapabilities: [
        { name: 'Product roadmaps' },
        { name: 'User research' },
        { name: 'Feature analysis' },
        { name: 'Market validation' }
      ]
    },
    {
      id: 'development_assistant',
      name: 'Development Assistant',
      department: 'product_dev',
      description: 'Code review, documentation, technical planning',
      icon: '💻',
      iconColor: '#51A2FF',
      keyCapabilities: [
        { name: 'Code reviews' },
        { name: 'Documentation' },
        { name: 'Technical planning' },
        { name: 'Testing support' }
      ]
    }
  ]
};

export default function ChooseAssistants() {
  const navigate = useNavigate();
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentType[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);

  const progress: OnboardingProgress = {
    currentStep: 3,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  };

  useEffect(() => {
    // Load existing onboarding state
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.selectedDepartments) {
          setSelectedDepartments(state.selectedDepartments);
          // Auto-select recommended assistants
          const recommendedAssistants: string[] = [];
          state.selectedDepartments.forEach((dept: DepartmentType) => {
            const deptAssistants = assistantsByDepartment[dept] || [];
            deptAssistants.forEach(assistant => {
              if (assistant.isRecommended) {
                recommendedAssistants.push(assistant.id);
              }
            });
          });
          setSelectedAssistants(recommendedAssistants);
        }
        if (state.selectedAssistants) {
          setSelectedAssistants(state.selectedAssistants);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

  const handleAssistantSelect = (assistantId: string) => {
    setSelectedAssistants(prev => 
      prev.includes(assistantId)
        ? prev.filter(id => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  const handleContinue = () => {
    if (selectedAssistants.length === 0) {
      toast.error('Please select at least one AI assistant to continue');
      return;
    }

    // Update state in localStorage
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