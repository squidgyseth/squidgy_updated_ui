import { useState, useEffect } from "react";
import { X, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatInterface } from "../components/ChatInterface";
import { UserAccountDropdown } from "../components/UserAccountDropdown";
import { SetupStepsSidebar } from "../components/SetupStepsSidebar";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { profilesApi } from "../lib/supabase-api";

// Helper function to generate logger ID
const generateLoggerId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function FacebookConnect() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [didLogin, setDidLogin] = useState<'yes' | 'no' | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showPages, setShowPages] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [firmUserId, setFirmUserId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Get user data on mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please log in to continue');
          navigate('/login');
          return;
        }

        // Get profile to get firm_user_id
        const { data: profile } = await profilesApi.getByEmail(user.email);

        if (profile?.user_id) {
          setFirmUserId(profile.user_id);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };

    getUserData();
  }, [navigate]);

  // Generate OAuth URL on mount
  useEffect(() => {
    if (firmUserId && !oauthUrl) {
      generateOAuthUrl();
    }
  }, [firmUserId]);

  const generateOAuthUrl = async () => {
    if (!firmUserId) {
      console.log('🔍 generateOAuthUrl: No firmUserId available');
      return;
    }

    console.log('🚀 generateOAuthUrl: Starting OAuth URL generation for firmUserId:', firmUserId);
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      console.log('🔍 generateOAuthUrl: Using backend URL:', backendUrl);
      
      // First check if we have a GHL location ID
      console.log('🔍 generateOAuthUrl: Checking integration status...');
      const checkResponse = await fetch(`${backendUrl}/api/facebook/check-integration-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      console.log('🔍 generateOAuthUrl: Check response status:', checkResponse.status);
      const checkData = await checkResponse.json();
      console.log('🔍 generateOAuthUrl: Check data:', checkData);
      let locationId = checkData.ghl_location_id;
      
      if (!locationId) {
        // Try to get from ghl_subaccounts table
        const ghlResponse = await fetch(`${backendUrl}/api/ghl/get-location-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firm_user_id: firmUserId })
        });
        
        if (ghlResponse.ok) {
          const ghlData = await ghlResponse.json();
          locationId = ghlData.location_id;
        }
      }
      
      if (!locationId) {
        toast.error('GHL account setup is still in progress. Please wait and try again.');
        return;
      }
      
      // Generate OAuth URL
      console.log('🔍 generateOAuthUrl: Generating OAuth URL with locationId:', locationId);
      console.log('🔄 generateOAuthUrl: Using same locationId for both locationId and userId parameters');
      const response = await fetch(`${backendUrl}/api/facebook/extract-oauth-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firmUserId,        // Backend will look up ghl_location_id using this
          locationId: locationId     // This is the ghl_location_id
        })
      });
      
      console.log('🔍 generateOAuthUrl: OAuth response status:', response.status);
      const data = await response.json();
      console.log('🔍 generateOAuthUrl: OAuth response data:', data);
      
      if (data.success && data.params) {
        // Build OAuth URL properly from parameters
        const enhancedScope = 'email,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,pages_manage_engagement,pages_read_user_content,business_management,public_profile,read_insights,pages_manage_ads,leads_retrieval,ads_read,pages_messaging,ads_management,instagram_basic,instagram_manage_messages,instagram_manage_comments,catalog_management';
        
        const oauthParams = new URLSearchParams({
          response_type: data.params.response_type || 'code',
          client_id: data.params.client_id,
          redirect_uri: 'https://services.leadconnectorhq.com/integrations/oauth/finish',
          scope: enhancedScope,
          state: JSON.stringify({
            locationId: locationId,
            userId: locationId,  // Use same locationId for both
            type: 'facebook',
            source: 'squidgy_step1'
          }),
          logger_id: data.params.logger_id || generateLoggerId()
        });

        const finalOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`;
        setOauthUrl(finalOAuthUrl);
        console.log('✅ generateOAuthUrl: Successfully generated OAuth URL:', finalOAuthUrl);
      } else {
        console.error('❌ generateOAuthUrl: Invalid OAuth response structure');
        throw new Error('Invalid OAuth response from server');
      }
    } catch (error: any) {
      console.error('❌ generateOAuthUrl: OAuth generation error:', error);
      toast.error(error.message || 'Failed to generate Facebook login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogIntoFacebook = () => {
    if (!oauthUrl) {
      toast.error('OAuth URL not ready. Please wait...');
      return;
    }
    window.open(oauthUrl, '_blank');
  };

  const handleNext = async () => {
    if (didLogin !== 'yes') {
      toast.error('Please confirm that you have logged into Facebook');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 handleNext: Getting Facebook pages for user:', firmUserId);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // Directly try to fetch pages using our new simple endpoint
      const response = await fetch(`${backendUrl}/api/facebook/get-pages-from-integration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });

      console.log('🔍 handleNext: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 handleNext: Response data:', result);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          toast.error('Please complete Facebook OAuth first by clicking the "Log into Facebook" button above.');
          return;
        }
        if (response.status === 400 && result.detail?.includes('Missing tokens')) {
          toast.error('Facebook OAuth not completed yet. Please try the OAuth login again.');
          return;
        }
        throw new Error(result.detail || result.message || 'Failed to fetch pages');
      }

      if (result.success && result.pages && result.pages.length > 0) {
        setPages(result.pages);
        setLoggedInUser('Facebook User');
        setShowPages(true);
        toast.success(`Found ${result.pages.length} Facebook pages!`);
        console.log('✅ handleNext: Successfully loaded pages:', result.pages);
      } else {
        throw new Error(result.message || 'No Facebook pages found for your account');
      }
    } catch (error: any) {
      console.error('❌ handleNext: Error loading pages:', error);
      toast.error(error.message || 'Failed to load Facebook pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleConnectFinish = async () => {
    if (selectedPages.length === 0) {
      toast.error('Please select at least one page');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 handleConnectFinish: Connecting pages:', selectedPages);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/facebook/connect-selected-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          selected_page_ids: selectedPages
        })
      });

      console.log('🔍 handleConnectFinish: Response status:', response.status);
      const result = await response.json();
      console.log('🔍 handleConnectFinish: Response data:', result);

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Failed to connect pages');
      }

      if (result.success) {
        const connectedCount = result.connected_pages?.length || 0;
        const totalCount = result.total_selected || selectedPages.length;
        
        if (connectedCount === totalCount) {
          toast.success(`Successfully connected all ${totalCount} Facebook pages!`);
        } else if (connectedCount > 0) {
          toast.success(`Connected ${connectedCount} of ${totalCount} Facebook pages. Some pages may require manual setup.`);
        } else {
          toast.success('Facebook pages saved! They will be connected shortly.');
        }
        
        console.log('✅ handleConnectFinish: Successfully connected pages');
        navigate('/setup-complete');
      } else {
        throw new Error(result.message || 'Failed to connect pages');
      }
    } catch (error: any) {
      console.error('Error saving pages:', error);
      toast.error(error.message || 'Failed to connect pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryTokenCapture = async () => {
    if (!firmUserId) {
      toast.error('User information not available');
      return;
    }

    setIsRetrying(true);
    try {
      console.log('🔄 handleRetryTokenCapture: Starting token capture retry for:', firmUserId);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/facebook/retry-token-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });

      console.log('🔄 handleRetryTokenCapture: Response status:', response.status);
      const result = await response.json();
      console.log('🔄 handleRetryTokenCapture: Response data:', result);

      if (!response.ok) {
        throw new Error(result.detail || result.message || 'Failed to start retry');
      }

      if (result.success) {
        toast.success('Token refresh started! This may take a few minutes. You can continue or check back later.');
        console.log('✅ handleRetryTokenCapture: Successfully started retry automation');
      } else {
        throw new Error(result.message || 'Failed to start retry automation');
      }
    } catch (error: any) {
      console.error('❌ handleRetryTokenCapture: Error:', error);
      toast.error(error.message || 'Failed to start token refresh');
    } finally {
      setIsRetrying(false);
    }
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
          
          <div className="w-6 h-6 bg-squidgy-gradient rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-bold text-lg text-text-primary">Squidgy</span>
          <UserAccountDropdown />
        </div>
        <button className="text-squidgy-purple font-bold text-sm px-5 py-3 rounded-button hover:bg-gray-50 transition-colors">
          Close (save draft)
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-grey-800">
        <div className="h-full bg-squidgy-gradient" style={{ width: '720px' }}></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="p-5">
          <ChatInterface 
            agentName="Solar sales agent"
            agentDescription=""
            context="facebook_setup"
          />
        </div>

        {/* Main Form Content */}
        <div className="flex-1 max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-8">Create an agent</h1>
          </div>

          {/* Form */}
          <div className="max-w-lg mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">6. Connect to Facebook</h2>
              <p className="text-text-secondary text-sm">
                Connect to reach your sales leads on Facebook
              </p>
            </div>

            {!showPages ? (
              <>
                {/* Instructions */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <div className="text-purple-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-purple-700">
                    Click the button below to log into your Facebook account in a separate window. Return to this page after.
                  </p>
                </div>

                {/* Log into Facebook Button */}
                <button
                  onClick={handleLogIntoFacebook}
                  disabled={isLoading || !oauthUrl}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base py-4 px-5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-3 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Log into Facebook
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>

                {/* Did you successfully log in? */}
                <div className="mb-8">
                  <p className="font-semibold text-text-primary mb-4">Did you successfully log into Facebook?</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="didLogin"
                        value="yes"
                        checked={didLogin === 'yes'}
                        onChange={() => setDidLogin('yes')}
                        className="w-5 h-5 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
                      />
                      <span className="text-text-primary">Yes</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="didLogin"
                        value="no"
                        checked={didLogin === 'no'}
                        onChange={() => setDidLogin('no')}
                        className="w-5 h-5 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
                      />
                      <span className="text-text-primary">No</span>
                    </label>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={isLoading || didLogin !== 'yes'}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base py-4 px-5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Next'}
                </button>
              </>
            ) : (
              <>
                {/* Logged in User */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">Logged in as:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-text-primary">{loggedInUser}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setShowPages(false);
                        setDidLogin(null);
                        setPages([]);
                        setSelectedPages([]);
                      }}
                      className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                      Log out
                    </button>
                  </div>
                </div>


                {/* Page Selection */}
                <div className="mb-8">
                  <p className="font-semibold text-text-primary mb-4">
                    Select the Facebook pages you want to connect to
                  </p>
                  <div className="space-y-3">
                    {pages.map((page) => (
                      <label key={page.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                          className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                        />
                        <span className="text-text-primary">{page.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Connect & Finish Button */}
                <button
                  onClick={handleConnectFinish}
                  disabled={isLoading || selectedPages.length === 0}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-base py-4 px-5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect & Finish'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Setup Steps Sidebar */}
        <div className="hidden lg:block">
          <SetupStepsSidebar 
            currentStep={6} 
            onRetryFacebook={handleRetryTokenCapture}
            isRetrying={isRetrying}
          />
        </div>
      </div>

      {/* Mobile Setup Steps Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full">
            <SetupStepsSidebar 
              currentStep={6} 
              onRetryFacebook={handleRetryTokenCapture}
              isRetrying={isRetrying}
            />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}