import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Badge } from '@/components/ui/badge';
import { DepartmentType, DepartmentOption, OnboardingProgress, BusinessType } from '@/types/onboarding.types';
import { toast } from 'sonner';

// Department options data
const departmentOptions: DepartmentOption[] = [
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Social media, campaigns, content creation, SEO',
    icon: '📈',
    iconColor: '#6017E8',
    isRecommended: true
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'Lead generation, CRM, proposals, customer outreach',
    icon: '📊',
    iconColor: '#FB252A',
    isRecommended: true
  },
  {
    id: 'management_strategy',
    title: 'Management & Strategy',
    description: 'Planning, analytics, reporting, decision support',
    icon: '⚙️',
    iconColor: '#51A2FF',
    isPopular: true
  },
  {
    id: 'hr_people',
    title: 'HR & People Ops',
    description: 'Recruiting, onboarding, employee engagement, policies',
    icon: '👥',
    iconColor: '#FB7A2A'
  },
  {
    id: 'personal_assistant',
    title: 'Personal Assistant',
    description: 'Scheduling, reminders, email management, research',
    icon: '👤',
    iconColor: '#28A745'
  },
  {
    id: 'customer_support',
    title: 'Customer Support',
    description: 'Help desk, ticket management, customer communication',
    icon: '🎧',
    iconColor: '#51A2FF',
    isRecommended: true
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Budgeting, expense tracking, financial analysis, invoicing',
    icon: '💰',
    iconColor: '#FFC107'
  },
  {
    id: 'product_dev',
    title: 'Product / Dev',
    description: 'Feature planning, user research, development support',
    icon: '💻',
    iconColor: '#6017E8',
    isRecommended: true
  }
];

// Function to get recommended departments based on business type
function getRecommendedDepartments(businessType: BusinessType): DepartmentType[] {
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
}

export default function SupportAreasSelection() {
  const navigate = useNavigate();
  const [selectedDepartments, setSelectedDepartments] = useState<DepartmentType[]>([]);
  const [businessType, setBusinessType] = useState<BusinessType>('saas_tech');
  const [recommendedDepartments, setRecommendedDepartments] = useState<DepartmentType[]>([]);

  const progress: OnboardingProgress = {
    currentStep: 2,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  };

  useEffect(() => {
    // Load existing onboarding state
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.businessType) {
          setBusinessType(state.businessType);
          const recommended = getRecommendedDepartments(state.businessType);
          setRecommendedDepartments(recommended);
          // Auto-select recommended departments
          setSelectedDepartments(recommended);
        }
        if (state.selectedDepartments) {
          setSelectedDepartments(state.selectedDepartments);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

  const handleDepartmentSelect = (id: string) => {
    const departmentId = id as DepartmentType;
    setSelectedDepartments(prev => 
      prev.includes(departmentId)
        ? prev.filter(d => d !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleContinue = () => {
    if (selectedDepartments.length === 0) {
      toast.error('Please select at least one department to continue');
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
    
    onboardingState.currentStep = 2;
    onboardingState.selectedDepartments = selectedDepartments;
    
    localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

    toast.success(`Great! We'll set up AI assistants for ${selectedDepartments.length} departments.`);
    navigate('/ai-onboarding/choose-assistants');
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
    isRecommended: recommendedDepartments.includes(dept.id)
  }));

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
            isSelected={selectedDepartments.includes(option.id)}
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