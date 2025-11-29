import { useState } from "react";
import { X, Menu, CheckCircle, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatInterface } from "../components/ChatInterface";
import { UserAccountDropdown } from "../components/UserAccountDropdown";

// Check Icon Component
function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17L4 12" stroke="#028833" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Main Setup Complete Page Component
export default function SetupComplete() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleToggleActive = () => {
    setIsActive(!isActive);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-grey-700 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/864daee3c48065f4ab3fdbb7a217feae74f1f24a?width=188" 
            alt="Squidgy Logo" 
            className="h-8"
          />
          <UserAccountDropdown />
        </div>
        <button 
          onClick={handleClose}
          className="text-squidgy-purple font-bold text-sm px-5 py-3 rounded-button hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
      
      {/* Progress Bar - Full */}
      <div className="h-1 bg-grey-800">
        <div className="h-full w-full bg-squidgy-gradient"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="p-5">
          <ChatInterface 
            agentName="Solar sales agent"
            agentDescription="rmsenergy.com"
            context="setup_complete"
          />
        </div>

        {/* Main Form Content */}
        <div className="flex-1 max-w-lg mx-auto p-10 pb-10">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#E5F6EC] rounded-[20px] flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-sm">
              <CheckIcon />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2 leading-[30px]">Setup complete!</h2>
            <p className="text-text-secondary text-sm leading-5">
              Your AI solar sales agent is ready to bring in new sales leads. Preview the customer-facing agent in the "Sales" tab.
            </p>
          </div>

          {/* Status Section */}
          <div className="mb-5">
            <div className="flex items-center justify-between gap-2 pb-5">
              <div className="flex-1">
                <label className="text-text-primary text-sm font-semibold leading-6">
                  Current sales agent status:
                </label>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white ${
                isActive ? 'bg-[#DA078C]' : 'bg-[#444652]'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </div>
              <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <HelpCircle className="w-6 h-6 text-text-primary" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button 
                onClick={handleToggleActive}
                className={`w-full font-bold text-sm py-3 px-5 rounded-button transition-all leading-6 ${
                  isActive 
                    ? 'border-2 border-squidgy-purple text-squidgy-purple hover:bg-purple-50'
                    : 'bg-squidgy-gradient text-white hover:opacity-90'
                }`}
              >
                {isActive ? 'Set as inactive' : 'Set as active'}
              </button>
              
              <button 
                onClick={handleGoToDashboard}
                className="w-full border-2 border-squidgy-purple text-squidgy-purple font-bold text-sm py-3 px-5 rounded-button hover:bg-purple-50 transition-colors leading-6"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full bg-white w-80">
            <div className="p-4">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-4"
              >
                <X className="w-5 h-5 text-text-primary" />
              </button>
              <p className="text-text-primary">Sidebar content placeholder</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
