import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LeftNavigation } from './LeftNavigation';
import { useUser } from '../../hooks/useUser';
import { useCompanyBranding } from '../../hooks/useCompanyBranding';
import { Search, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '../NotificationBell';

interface SettingsLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function SettingsLayout({ children, title }: SettingsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { companyName, faviconUrl, isLoading } = useCompanyBranding();

  const getCurrentSettingsPage = () => {
    const path = location.pathname;
    if (path.includes('/account-settings')) return 'Profile';
    if (path.includes('/business-settings')) return 'Business';
    if (path.includes('/team-settings')) return 'Team';
    if (path.includes('/personalisation-settings')) return 'Personalisation';
    if (path.includes('/integrations-settings')) return 'Integrations';
    if (path.includes('/templates-settings')) return 'Templates';
    if (path.includes('/billing-settings')) return 'Billing & Subscription';
    return 'Settings';
  };

  const isActivePage = (page: string) => {
    const currentPage = getCurrentSettingsPage();
    return currentPage === page;
  };

  return (
    <div className="min-h-screen bg-white">
      <LeftNavigation currentPage="settings" />

      {/* Main Content Area */}
      <div className="ml-[60px] bg-gray-50 p-8">
        <div className="max-w-full mx-auto space-y-6 px-4">
          {/* Header - Same as Dashboard and Leads */}
          <div className="flex items-center justify-between bg-gray-50 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/e6ed19c13dbe3dffb61007c6e83218b559da44fe?width=290"
                  alt="Squidgy"
                  className="w-[100px] h-[40px]"
                />
                <div>
                  <h1 className="text-[15px] font-bold text-black font-open-sans">{title}</h1>
                  <p className="text-[11px] text-gray-500 font-open-sans">AI that works like a team — built for the way you work</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Search className="w-6 h-6 text-gray-500" />
              </Button>

              <NotificationBell />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {isLoading ? 'Loading...' : `${companyName} Team`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                  {!isLoading && faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt={`${companyName} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to checkmark icon if favicon fails to load
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                  ) : null}
                  <CheckCircle className="w-6 h-6 text-white" style={{ display: faviconUrl ? 'none' : 'block' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="flex">
            {/* Settings Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-140px)] rounded-l-lg">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Settings</h2>

                <nav className="space-y-2">
                  <button
                    onClick={() => navigate('/account-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Profile')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Profile
                  </button>

                  <button
                    onClick={() => navigate('/business-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Business')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 21H21M5 21V7L12 3L19 7V21M9 9H15M9 13H15M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Business
                  </button>

                  <button
                    onClick={() => navigate('/team-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Team')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Team
                  </button>

                  <button
                    onClick={() => navigate('/personalisation-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Personalisation')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Personalisation
                  </button>

                  <button
                    onClick={() => navigate('/integrations-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Integrations')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Integrations
                  </button>

                  <button
                    onClick={() => navigate('/templates-settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${isActivePage('Templates')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 3H5C3.89543 3 3 3.89543 3 5V7C3 8.10457 3.89543 9 5 9H7C8.10457 9 9 8.10457 9 7V5C9 3.89543 8.10457 3 7 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 3H17C15.8954 3 15 3.89543 15 5V7C15 8.10457 15.8954 9 17 9H19C20.1046 9 21 8.10457 21 7V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 15H5C3.89543 15 3 15.8954 3 17V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19V17C9 15.8954 8.10457 15 7 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 15H17C15.8954 15 15 15.8954 15 17V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19V17C21 15.8954 20.1046 15 19 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Templates
                  </button>

                  {/* 
                <button
                  onClick={() => navigate('/billing-settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    isActivePage('Billing & Subscription') 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Billing & Subscription
                </button>
                */}
                </nav>
              </div>
            </div>

            {/* Main Settings Content */}
            <div className="flex-1 bg-white p-8 rounded-r-lg">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
