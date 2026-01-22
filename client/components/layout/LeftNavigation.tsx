import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../lib/auth-service";
import { useCompanyBranding } from "../../hooks/useCompanyBranding";
import { useUser } from "../../hooks/useUser";
import { onboardingRouter } from "../../services/onboardingRouter";

interface LeftNavigationProps {
  currentPage?: 'chat' | 'dashboard' | 'home' | 'leads' | 'referrals' | 'settings' | 'onboarding';
}

function LeftNavigation({ currentPage }: LeftNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyName, faviconUrl, isLoading } = useCompanyBranding();
  const { userId } = useUser();


  // Auto-detect current page if not provided
  const detectCurrentPage = () => {
    if (currentPage) return currentPage;
    const path = location.pathname;
    if (path.includes('/ai-onboarding')) return 'onboarding';
    if (path.includes('/settings') || path.includes('/account-settings') || path.includes('/business-settings') || path.includes('/team-settings') || path.includes('/personalisation-settings') || path.includes('/billing-settings')) return 'settings';
    if (path.includes('/referrals') || path.includes('/referral')) return 'referrals';
    if (path.includes('/leads')) return 'leads';
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

  const handleLeadsClick = () => {
    navigate('/leads');
  };

  const handleReferralClick = () => {
    navigate('/referrals');
  };

  const handleOnboardingClick = async () => {
    if (userId) {
      // Use smart routing to determine where to go (editing mode)
      const routeDecision = await onboardingRouter.handleOnboardingIconClick(userId);
      navigate(routeDecision.redirectPath);
    } else {
      // No userId, show onboarding modal on dashboard
      navigate('/dashboard?onboarding=true');
    }
  };

  const handleSettingsClick = () => {
    navigate('/account-settings');
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
        {/* Home Icon */}
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${activePage === 'home' ? 'bg-gray-50' : ''
            }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="27" height="27" viewBox="0 0 28 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#homeClip)">
                <path d="M11.7499 21.3746V15.7496H16.2499V21.3746C16.2499 21.9933 16.7562 22.4996 17.3749 22.4996H20.7499C21.3687 22.4996 21.8749 21.9933 21.8749 21.3746V13.4996H23.7874C24.3049 13.4996 24.5524 12.8583 24.1587 12.5208L14.7537 4.04957C14.3262 3.66707 13.6737 3.66707 13.2462 4.04957L3.84118 12.5208C3.45868 12.8583 3.69493 13.4996 4.21243 13.4996H6.12493V21.3746C6.12493 21.9933 6.63118 22.4996 7.24993 22.4996H10.6249C11.2437 22.4996 11.7499 21.9933 11.7499 21.3746Z" fill="url(#homeGradient)" />
              </g>
              <defs>
                <linearGradient id="homeGradient" x1="3.65234" y1="3.7627" x2="21.3629" y2="24.9935" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A" />
                  <stop offset="0.5" stopColor="#A61D92" />
                  <stop offset="1" stopColor="#6017E8" />
                </linearGradient>
                <clipPath id="homeClip">
                  <rect width="27" height="27" fill="white" transform="translate(0.5)" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Home
          </span>
        </button>

        {/* Create Agent Icon - Hidden for now */}
        {/* <button 
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
            Create Agents
          </span>
        </button> */}

        {/* Chat Icon */}
        <button
          onClick={handleChatClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${activePage === 'chat' ? 'bg-gray-50' : ''
            }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 22V4C2.5 3.45 2.69583 2.97917 3.0875 2.5875C3.47917 2.19583 3.95 2 4.5 2H20.5C21.05 2 21.5208 2.19583 21.9125 2.5875C22.3042 2.97917 22.5 3.45 22.5 4V16C22.5 16.55 22.3042 17.0208 21.9125 17.4125C21.5208 17.8042 21.05 18 20.5 18H6.5L2.5 22Z" fill="url(#chatGradient)" />
              <defs>
                <linearGradient id="chatGradient" x1="2.5" y1="2" x2="21.6521" y2="22.7814" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A" />
                  <stop offset="0.5" stopColor="#A61D92" />
                  <stop offset="1" stopColor="#6017E8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center">
            Chats
          </span>
        </button>

        {/* Leads Icon - Hidden */}
        {/* <button 
          onClick={handleLeadsClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${
            activePage === 'leads' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="url(#leadsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="url(#leadsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 21V19C19.9993 18.1137 19.7044 17.2528 19.1614 16.5523C18.6184 15.8519 17.8581 15.3516 17 15.13" stroke="url(#leadsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 3.13C14.8604 3.35031 15.623 3.85071 16.1676 4.55232C16.7122 5.25392 17.0078 6.11683 17.0078 7.005C17.0078 7.89318 16.7122 8.75608 16.1676 9.45769C15.623 10.1593 14.8604 10.6597 14 10.88" stroke="url(#leadsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="leadsGradient" x1="1" y1="3" x2="18.4656" y2="22.3574" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center">
            Leads
          </span>
        </button> */}

        {/* Referrals Icon - Hidden */}
        {/* <button 
          onClick={handleReferralClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${
            activePage === 'referrals' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 12.5C16.8284 12.5 17.5 11.8284 17.5 11C17.5 10.1716 16.8284 9.5 16 9.5C15.1716 9.5 14.5 10.1716 14.5 11C14.5 11.8284 15.1716 12.5 16 12.5Z" fill="url(#referralGradient)"/>
              <path d="M8 12.5C8.82843 12.5 9.5 11.8284 9.5 11C9.5 10.1716 8.82843 9.5 8 9.5C7.17157 9.5 6.5 10.1716 6.5 11C6.5 11.8284 7.17157 12.5 8 12.5Z" fill="url(#referralGradient)"/>
              <path d="M12 8.5C12.8284 8.5 13.5 7.82843 13.5 7C13.5 6.17157 12.8284 5.5 12 5.5C11.1716 5.5 10.5 6.17157 10.5 7C10.5 7.82843 11.1716 8.5 12 8.5Z" fill="url(#referralGradient)"/>
              <path d="M12 20.5C12.8284 20.5 13.5 19.8284 13.5 19C13.5 18.1716 12.8284 17.5 12 17.5C11.1716 17.5 10.5 18.1716 10.5 19C10.5 19.8284 11.1716 20.5 12 20.5Z" fill="url(#referralGradient)"/>
              <path d="M10.5 7L9 9.5M14.5 9.5L13 7M9.5 11L10.5 17.5M13.5 17.5L14.5 11" stroke="url(#referralGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="referralGradient" x1="6.5" y1="5.5" x2="17.8" y2="18.9" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center">
            Referrals
          </span>
        </button> */}

        {/* Onboarding Icon - Hidden */}
        {/* <button 
          onClick={handleOnboardingClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${
            activePage === 'onboarding' ? 'bg-gray-50' : ''
          }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="url(#onboardingGradient)"/>
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" stroke="url(#onboardingGradient)" strokeWidth="0.5"/>
              <defs>
                <linearGradient id="onboardingGradient" x1="2" y1="2" x2="18.7851" y2="18.74" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A"/>
                  <stop offset="0.5" stopColor="#A61D92"/>
                  <stop offset="1" stopColor="#6017E8"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Onboarding
          </span>
        </button> */}

        {/* Menu Icon - Hidden for now */}
        {/* <div className="flex flex-col items-center p-2 w-full">
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
        </div> */}
      </div>

      {/* Spacer to push bottom items to the very bottom */}
      <div className="flex-1"></div>

      {/* Bottom section - positioned at the very bottom */}
      <div className="flex flex-col items-center gap-4">
        {/* Settings */}
        <button
          onClick={handleSettingsClick}
          className={`flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors ${activePage === 'settings' ? 'bg-gray-50' : ''
            }`}
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="url(#settingsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01127 9.77251C4.28054 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="url(#settingsGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="settingsGradient" x1="1" y1="1" x2="19.7851" y2="23.74" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A" />
                  <stop offset="0.5" stopColor="#A61D92" />
                  <stop offset="1" stopColor="#6017E8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-squidgy-text text-[9px] font-normal leading-4 text-center w-[46px]">
            Settings
          </span>
        </button>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 w-full hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex justify-center items-center mb-1">
            <svg width="25" height="25" viewBox="0 0 26 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.875 21.875H5.70833C5.1558 21.875 4.62589 21.6555 4.23519 21.2648C3.84449 20.8741 3.625 20.3442 3.625 19.7917V5.20833C3.625 4.6558 3.84449 4.12589 4.23519 3.73519C4.62589 3.34449 5.1558 3.125 5.70833 3.125H9.875M17.1667 17.7083L22.375 12.5M22.375 12.5L17.1667 7.29167M22.375 12.5H9.875" stroke="url(#logoutGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logoutGradient" x1="3.625" y1="3.125" x2="21.5801" y2="22.6076" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FB252A" />
                  <stop offset="0.5" stopColor="#A61D92" />
                  <stop offset="1" stopColor="#6017E8" />
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
          <div className="w-8 h-8 rounded-full mb-1 flex items-center justify-center overflow-hidden bg-gray-100">
            {!isLoading && faviconUrl && faviconUrl.trim() !== '' ? (
              <img
                src={faviconUrl}
                alt={`${companyName} logo`}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  console.log('Company favicon failed to load, falling back to Squidgy logo');
                  // Fallback to Squidgy logo if company favicon fails to load
                  e.currentTarget.src = "https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=64";
                }}
              />
            ) : (
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=64"
                alt="Squidgy logo"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  console.log('Squidgy logo failed to load');
                  // If Squidgy logo fails, show text fallback
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.innerHTML = '<div class="w-full h-full rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium">S</div>';
                  }
                }}
              />
            )}
          </div>
          <span className="text-gray-500 text-[8.5px] font-normal leading-4 text-center w-[46px] truncate">
            {isLoading ? 'Loading...' : (companyName && companyName.trim() !== '' ? companyName : '')}
          </span>
        </div>
      </div>
    </div>
  );
}

export { LeftNavigation };
export default LeftNavigation;
