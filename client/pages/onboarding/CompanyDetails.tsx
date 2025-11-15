import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CompanyDetails as CompanyDetailsType, OnboardingProgress } from '@/types/onboarding.types';
import { toast } from 'sonner';

export default function CompanyDetails() {
  const navigate = useNavigate();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsType>({
    companyName: '',
    website: '',
    specialty: '',
    teamSize: '',
    primaryLocation: '',
    phoneNumber: '',
    description: ''
  });

  const progress: OnboardingProgress = {
    currentStep: 5,
    totalSteps: 6,
    stepTitles: ['Business Type', 'Support Areas', 'Choose Assistants', 'Personalize', 'Company Details', 'Welcome']
  };

  useEffect(() => {
    // Load existing onboarding state
    const savedState = localStorage.getItem('onboarding_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.companyDetails) {
          setCompanyDetails(state.companyDetails);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
      }
    }
  }, []);

  const updateCompanyDetail = (field: keyof CompanyDetailsType, value: string) => {
    setCompanyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    if (!companyDetails.companyName?.trim()) {
      toast.error('Please enter your company name to continue');
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
    
    onboardingState.currentStep = 5;
    onboardingState.companyDetails = companyDetails;
    
    localStorage.setItem('onboarding_state', JSON.stringify(onboardingState));

    toast.success('Company details saved! Your AI assistants will now provide personalized support.');
    navigate('/ai-onboarding/welcome');
  };

  const handleBack = () => {
    navigate('/ai-onboarding/personalize');
  };

  const handleSkip = () => {
    navigate('/ai-onboarding/welcome');
  };

  const descriptionCharCount = companyDetails.description?.length || 0;
  const maxDescriptionLength = 500;

  return (
    <OnboardingLayout
      progress={progress}
      stepTitle="Company details"
      stepDescription="This information helps your AI assistants provide more personalized and relevant support for your solar business."
      onBack={handleBack}
      onContinue={handleContinue}
      onSkip={handleSkip}
      continueDisabled={!companyDetails.companyName?.trim()}
      continueText="Continue"
      className="max-w-3xl mx-auto"
    >
      {/* Company Icon */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8H26V24H6V8Z" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 12H22" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 16H18" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 20H14" stroke="#6017E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Main Heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
          Tell us about your company
        </h2>
        <p className="text-gray-600 font-['Open_Sans']">
          This information helps your AI assistants provide more personalized and relevant support for your 
          solar business.
        </p>
      </div>

      {/* Company Details Form */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                <span className="text-blue-600">🏢</span>
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., SolarTech Solutions"
                value={companyDetails.companyName}
                onChange={(e) => updateCompanyDetail('companyName', e.target.value)}
                className="font-['Open_Sans']"
                required
              />
              <p className="text-xs text-gray-500 font-['Open_Sans']">
                This helps your assistants know how to introduce and represent your business
              </p>
            </div>

            {/* Company Website and Solar Specialty Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                  <span className="text-blue-600">🌐</span>
                  Company Website
                </Label>
                <Input
                  id="website"
                  placeholder="e.g., https://www.yoursolarcompany.com"
                  value={companyDetails.website}
                  onChange={(e) => updateCompanyDetail('website', e.target.value)}
                  className="font-['Open_Sans']"
                />
                <p className="text-xs text-gray-500 font-['Open_Sans']">
                  Your assistants can reference your website for accurate information about your services
                </p>
              </div>

              {/* Solar Specialty */}
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                  <span className="text-yellow-600">☀️</span>
                  Solar Specialty
                </Label>
                <Input
                  id="specialty"
                  placeholder="e.g., Residential Solar, Commercial"
                  value={companyDetails.specialty}
                  onChange={(e) => updateCompanyDetail('specialty', e.target.value)}
                  className="font-['Open_Sans']"
                />
              </div>
            </div>

            {/* Team Size and Primary Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Size */}
              <div className="space-y-2">
                <Label htmlFor="teamSize" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                  <span className="text-green-600">👥</span>
                  Team Size
                </Label>
                <Input
                  id="teamSize"
                  placeholder="e.g., 10-50 employees"
                  value={companyDetails.teamSize}
                  onChange={(e) => updateCompanyDetail('teamSize', e.target.value)}
                  className="font-['Open_Sans']"
                />
              </div>

              {/* Primary Location */}
              <div className="space-y-2">
                <Label htmlFor="primaryLocation" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                  <span className="text-red-600">📍</span>
                  Primary Location
                </Label>
                <Input
                  id="primaryLocation"
                  placeholder="e.g., California, USA"
                  value={companyDetails.primaryLocation}
                  onChange={(e) => updateCompanyDetail('primaryLocation', e.target.value)}
                  className="font-['Open_Sans']"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700 font-['Open_Sans'] flex items-center gap-2">
                <span className="text-blue-600">📞</span>
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                placeholder="e.g., (555) 123-4567"
                value={companyDetails.phoneNumber}
                onChange={(e) => updateCompanyDetail('phoneNumber', e.target.value)}
                className="font-['Open_Sans']"
              />
            </div>

            {/* Brief Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 font-['Open_Sans']">
                Brief Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us about your business, what makes you unique, your target customers, service areas, etc."
                value={companyDetails.description}
                onChange={(e) => updateCompanyDetail('description', e.target.value)}
                className="font-['Open_Sans'] min-h-[120px]"
                maxLength={maxDescriptionLength}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 font-['Open_Sans']">
                  Help your assistants understand your business better
                </p>
                <p className="text-xs text-gray-500 font-['Open_Sans']">
                  {descriptionCharCount}/{maxDescriptionLength} characters
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How this helps section */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-sm">🤖</span>
          </div>
          <div>
            <h3 className="text-blue-800 font-semibold font-['Open_Sans'] mb-2">
              How this helps your AI assistants:
            </h3>
            <ul className="space-y-1 text-blue-600 text-sm font-['Open_Sans']">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Provide accurate, context-aware responses about your company
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Generate quotes and proposals using your actual business details
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Qualify leads based on your service areas and specialties
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Reference your website when answering customer questions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}