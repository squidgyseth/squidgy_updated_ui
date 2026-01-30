import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingProgress } from '@/types/onboarding.types';
import { LeftNavigation } from '../layout/LeftNavigation';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  progress: OnboardingProgress;
  stepTitle: string;
  stepDescription?: string;
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  continueText?: string;
  continueDisabled?: boolean;
  showSkip?: boolean;
  className?: string;
  hideStepIndicator?: boolean;
  customStepText?: string;
}

export function OnboardingLayout({
  children,
  progress,
  stepTitle,
  stepDescription,
  onBack,
  onContinue,
  onSkip,
  continueText = "Continue",
  continueDisabled = false,
  showSkip = true,
  className = "",
  hideStepIndicator = false,
  customStepText
}: OnboardingLayoutProps) {
  const navigate = useNavigate();

  const progressPercentage = (progress.currentStep / progress.totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Navigation */}
      <LeftNavigation currentPage="onboarding" />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-[60px]">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-1">
          <div 
            className="h-full bg-gradient-to-r from-[#FB252A] to-[#6017E8] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

      {/* Header */}
      <div className="px-6 sm:px-12 lg:px-16 xl:px-20 2xl:px-24 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Step Info */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FB252A] to-[#6017E8] text-white flex items-center justify-center text-sm font-bold">
                {customStepText === "Setup Complete!" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  progress.currentStep
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-['Open_Sans']">
                  {stepTitle}
                </h1>
                {!hideStepIndicator && (
                  <p className="text-sm text-gray-600 font-['Open_Sans']">
                    {customStepText || `Step ${progress.currentStep} of ${progress.totalSteps}`}
                  </p>
                )}
              </div>
            </div>

            {/* Skip Button */}
            {showSkip && onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 font-['Open_Sans']"
              >
                Skip for now
              </Button>
            )}
          </div>

          {/* Step Description */}
          {stepDescription && (
            <p className="mt-4 text-gray-600 text-center max-w-2xl mx-auto font-['Open_Sans']">
              {stepDescription}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`px-6 sm:px-12 lg:px-16 xl:px-20 2xl:px-24 pb-24 ${className}`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 sm:px-12 lg:px-16 xl:px-20 2xl:px-24 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Progress Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: progress.totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index + 1 === progress.currentStep
                    ? "w-8 bg-gradient-to-r from-[#FB252A] to-[#6017E8]"
                    : index + 1 < progress.currentStep
                    ? "bg-gray-400"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2 font-['Open_Sans']"
              >
                <ChevronLeft size={16} />
                Back
              </Button>
            )}
            
            {onContinue && (
              <Button
                onClick={onContinue}
                disabled={continueDisabled}
                className="bg-gradient-to-r from-[#FB252A] to-[#6017E8] hover:opacity-90 text-white px-8 font-['Open_Sans']"
              >
                {continueText}
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
