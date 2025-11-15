import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from '@/hooks/useUser';
import { onboardingRouter } from '@/services/onboardingRouter';

export default function Index() {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();
  const { userId } = useUser();

  const handleOnboardingClick = async () => {
    if (userId) {
      // Use smart routing to determine where to go
      const routeDecision = await onboardingRouter.handleOnboardingIconClick(userId);
      navigate(routeDecision.redirectPath);
    } else {
      // No userId, start fresh onboarding
      navigate('/ai-onboarding/business-type');
    }
  };

  if (!showModal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-squidgy-text-primary mb-4">Welcome to Squidgy!</h1>
          <p className="text-squidgy-text-secondary mb-6">You can reopen the welcome modal anytime.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-squidgy-gradient text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Show Welcome Modal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full">
      {/* Background Image */}
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/7132d4367431f4961e3e9053caa76e48cac8bfd0?width=2900"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Blur Overlay */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center p-2.5"
        style={{
          background: 'rgba(1, 1, 1, 0.06)',
          backdropFilter: 'blur(25px)',
        }}
      >
        {/* Modal Container */}
        <div className="relative w-full max-w-[400px] bg-white rounded-2xl border border-squidgy-border p-6 flex flex-col items-center">
          {/* Close Button */}
          <button
            onClick={handleOnboardingClick}
            className="absolute top-4 right-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-squidgy-text-primary" strokeWidth={1.5} />
          </button>

          {/* Robot Image */}
          <div className="py-5 mb-2">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/f8b62880c037006fb3e2224ef98d3a0ac9cbab84?width=292"
              alt="Squidgy Robot"
              className="w-[146px] h-[140px] object-contain"
            />
          </div>

          {/* Title */}
          <div className="pb-4 w-full">
            <h1 className="text-squidgy-text-primary text-center font-semibold text-2xl leading-[30px]">
              Welcome to Squidgy!
            </h1>
          </div>

          {/* Description */}
          <div className="pb-8 w-full">
            <p className="text-squidgy-text-secondary text-center text-base leading-6">
              Start by creating your own AI Solar Sales agent to help your customers find the perfect solar energy solutions.
            </p>
          </div>

          {/* Button Container */}
          <div className="flex flex-col gap-2 w-full">
            {/* Primary Gradient Button */}
            <button 
              onClick={handleOnboardingClick}
              className="w-full py-3 px-5 bg-squidgy-gradient text-white font-bold text-[15px] leading-6 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Create your agent
            </button>

            {/* Secondary Button */}
            <button 
              onClick={handleOnboardingClick}
              className="w-full py-3 px-5 text-squidgy-primary font-bold text-[15px] leading-6 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
