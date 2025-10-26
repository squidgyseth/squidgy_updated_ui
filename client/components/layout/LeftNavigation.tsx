import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../lib/auth-service";

interface LeftNavigationProps {
  currentPage?: 'chat' | 'dashboard' | 'home';
}

export default function LeftNavigation({ currentPage }: LeftNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect current page if not provided
  const detectCurrentPage = () => {
    if (currentPage) return currentPage;
    const path = location.pathname;
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/welcome')) return 'home';
    return 'home';
  };

  const activePage = detectCurrentPage();

  const handleChatClick = () => {
    navigate('/chat');
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleCreateAgentClick = () => {
    navigate('/welcome');
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');
      await authService.signOut();
      console.log('Logout successful, redirecting to login...');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect to login even if logout fails
      navigate('/login');
    }
  };

  return (
    <div className="w-[60px] bg-white border-r border-purple-200 flex flex-col items-center py-7 h-screen fixed left-0 top-0 z-10">
      {/* Top navigation items */}
      <div className="flex flex-col items-center gap-4">
        {/* Chat Icon */}
        <button 
          onClick={handleChatClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${
            activePage === 'chat' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 22V4C2.5 3.45 2.69583 2.97917 3.0875 2.5875C3.47917 2.19583 3.95 2 4.5 2H20.5C21.05 2 21.5208 2.19583 21.9125 2.5875C22.3042 2.97917 22.5 3.45 22.5 4V16C22.5 16.55 22.3042 17.0208 21.9125 17.4125C21.5208 17.8042 21.05 18 20.5 18H6.5L2.5 22Z" fill="url(#chatGradient)"/>
              <defs>
                <linearGradient id="chatGradient" x1="2.5" y1="2" x2="21.6521" y2="22.7814" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center">
            Chats
          </span>
        </button>
        
        {/* Home Icon */}
        <button 
          onClick={handleHomeClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${
            activePage === 'home' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="27" height="27" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#homeClip)">
                <path d="M11.7499 21.3746V15.7496H16.2499V21.3746C16.2499 21.9933 16.7562 22.4996 17.3749 22.4996H20.7499C21.3687 22.4996 21.8749 21.9933 21.8749 21.3746V13.4996H23.7874C24.3049 13.4996 24.5524 12.8583 24.1587 12.5208L14.7537 4.04957C14.3262 3.66707 13.6737 3.66707 13.2462 4.04957L3.84118 12.5208C3.45868 12.8583 3.69493 13.4996 4.21243 13.4996H6.12493V21.3746C6.12493 21.9933 6.63118 22.4996 7.24993 22.4996H10.6249C11.2437 22.4996 11.7499 21.9933 11.7499 21.3746Z" fill="url(#homeGradient)"/>
              </g>
              <defs>
                <linearGradient id="homeGradient" x1="3.65234" y1="3.7627" x2="21.3629" y2="24.9935" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
                <clipPath id="homeClip">
                  <rect width="27" height="27" fill="white" transform="translate(0.5)"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Home
          </span>
        </button>
        
        {/* Create Agent Icon */}
        <button 
          onClick={handleCreateAgentClick}
          className="flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#createAgentGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="url(#createAgentGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#createAgentGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="createAgentGradient" x1="2" y1="2" x2="18.7851" y2="24.74" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Create
          </span>
        </button>
        
        {/* Menu Icon */}
        <div className="flex flex-col items-center p-2 w-full">
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="url(#menuGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="menuGradient" x1="3" y1="6" x2="13.2851" y2="22.74" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Menu
          </span>
        </div>
      </div>
      
      {/* Spacer to push bottom items to the very bottom */}
      <div className="flex-1"></div>
      
      {/* Bottom section - positioned at the very bottom */}
      <div className="flex flex-col items-center gap-4">
        {/* Log Out */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="25" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.875 21.875H5.70833C5.1558 21.875 4.62589 21.6555 4.23519 21.2648C3.84449 20.8741 3.625 20.3442 3.625 19.7917V5.20833C3.625 4.6558 3.84449 4.12589 4.23519 3.73519C4.62589 3.34449 5.1558 3.125 5.70833 3.125H9.875M17.1667 17.7083L22.375 12.5M22.375 12.5L17.1667 7.29167M22.375 12.5H9.875" stroke="url(#logoutGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="logoutGradient" x1="3.625" y1="3.125" x2="21.5801" y2="22.6076" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Log Out
          </span>
        </button>

        {/* Profile Section */}
        <div className="flex flex-col items-center p-2 w-full">
          <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center overflow-hidden">
            <img src="https://api.builder.io/api/v1/image/assets/TEMP/84d0b086716590166781f74d276307d7cb0735bb?width=64" alt="Assistant" className="w-full h-full rounded-full object-cover" />
          </div>
          <span className="text-gray-500 text-[8.5px] font-normal leading-4 text-center w-[46px]">
            WasteLess
          </span>
        </div>
      </div>
    </div>
  );
}
