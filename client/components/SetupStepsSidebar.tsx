import { useNavigate } from "react-router-dom";
import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { checkSetupStatus } from "../lib/api";
import { useUser } from "../hooks/useUser";

interface Step {
  id: number;
  label: string;
  status: "current" | "completed" | "future";
  path: string;
}

interface SetupStepsSidebarProps {
  currentStep: number;
  onRetryFacebook?: () => void;
  isRetrying?: boolean;
}

export function SetupStepsSidebar({ currentStep, onRetryFacebook, isRetrying }: SetupStepsSidebarProps) {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [completionStatus, setCompletionStatus] = useState({
    websiteDetails: false,
    businessDetails: false,
    solarSetup: false,
    calendarSetup: false,
    notificationPreferences: false,
    facebookConnect: false
  });
  
  useEffect(() => {
    const loadCompletionStatus = async () => {
      if (userId) {
        console.log('🔍 SetupStepsSidebar: Using userId from hook:', userId);
        const status = await checkSetupStatus(userId);
        console.log('✅ SetupStepsSidebar: Completion status loaded:', status);
        setCompletionStatus(status);
      } else {
        console.log('⚠️ SetupStepsSidebar: No userId found');
      }
    };
    
    loadCompletionStatus();
  }, [userId]);

  const steps: Step[] = [
    { id: 1, label: "1. Website details", status: "future", path: "/website-details" },
    { id: 2, label: "2. Business details", status: "future", path: "/business-details" },
    { id: 3, label: "3. Solar setup", status: "future", path: "/solar-setup" },
    { id: 4, label: "4. Calendar setup", status: "future", path: "/calendar-setup" },
    { id: 5, label: "5. Notifications preferences", status: "future", path: "/notifications-preferences" },
    { id: 6, label: "6. Connect to Facebook", status: "future", path: "/facebook-connect" },
  ];

  // Update step statuses based on database completion status
  const updatedSteps = steps.map(step => {
    // Check if this step is completed in database
    let isCompleted = false;
    switch(step.id) {
      case 1: isCompleted = completionStatus.websiteDetails; break;
      case 2: isCompleted = completionStatus.businessDetails; break;
      case 3: isCompleted = completionStatus.solarSetup; break;
      case 4: isCompleted = completionStatus.calendarSetup; break;
      case 5: isCompleted = completionStatus.notificationPreferences; break;
      case 6: isCompleted = completionStatus.facebookConnect; break;
    }
    
    if (step.id === currentStep) {
      return { ...step, status: "current" as const };
    } else if (isCompleted) {
      return { ...step, status: "completed" as const };
    } else {
      return { ...step, status: "future" as const };
    }
  });

  const handleStepClick = (step: Step) => {
    // Only allow navigation to completed steps or current step
    if (step.status === "completed" || step.status === "current") {
      navigate(step.path);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-grey-700 h-full flex flex-col p-5">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-6">Setup steps</h3>
      </div>
      
      <div className="space-y-2">
        {updatedSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
              step.status === "current"
                ? "border-squidgy-purple bg-white"
                : step.status === "completed"
                ? "border-green-500 bg-white"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="p-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  step.status === "current" 
                    ? "bg-squidgy-purple" 
                    : step.status === "completed"
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
            </div>
            <span
              className={`text-sm flex-1 ${
                step.status === "current" || step.status === "completed" 
                  ? "text-text-primary" 
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
            {step.status === "completed" && (
              <button 
                onClick={() => handleStepClick(step)}
                className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
                title="Edit this step"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        ))}
        
        {/* Retry Facebook Connection Button - as a separate block */}
        {currentStep === 6 && onRetryFacebook && (
          <div className="mt-4">
            <button
              onClick={onRetryFacebook}
              disabled={isRetrying}
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-orange-400 bg-white hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              </div>
              <span className="text-sm flex-1 text-orange-600 font-medium text-left">
                {isRetrying ? 'Retrying Facebook Connection...' : 'Retry Facebook Connection'}
              </span>
              {isRetrying ? (
                <svg className="animate-spin w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
