import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { profilesApi } from "../lib/supabase-api";
import { getSupabaseConfig, getBackendUrl, getFrontendUrl } from '@/lib/envConfig';

// Helper function to generate logger ID
const generateLoggerId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function FacebookOAuthTest() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [didLogin, setDidLogin] = useState<'yes' | 'no' | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showPages, setShowPages] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [firmUserId, setFirmUserId] = useState<string | null>(null);

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
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = getBackendUrl();

      // First check if we have a GHL location ID
      const checkResponse = await fetch(`${backendUrl}/api/facebook/check-integration-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      const checkData = await checkResponse.json();
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
      const response = await fetch(`${backendUrl}/api/facebook/extract-oauth-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firmUserId,
          locationId: locationId
        })
      });
      
      const data = await response.json();
      
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
            userId: locationId,
            type: 'facebook',
            source: 'squidgy_oauth_test'
          }),
          logger_id: data.params.logger_id || generateLoggerId()
        });

        const finalOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`;
        setOauthUrl(finalOAuthUrl);
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
      const backendUrl = getBackendUrl();

      // Fetch pages using the endpoint
      const response = await fetch(`${backendUrl}/api/facebook/get-pages-from-integration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });

      const result = await response.json();

      if (!response.ok) {
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
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/facebook/connect-selected-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          selected_page_ids: selectedPages
        })
      });

      const result = await response.json();

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Facebook OAuth Test</h1>
          <p className="text-gray-600">
            Test the manual confirmation flow for Facebook integration
          </p>
        </div>

        {!showPages ? (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-2">How this works:</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Click "Log into Facebook" to open OAuth in a new window</li>
                    <li>Complete the Facebook login and permissions</li>
                    <li>The popup will redirect to GHL's finish endpoint</li>
                    <li>Close the popup and return to this page</li>
                    <li>Select "Yes" to confirm you completed the login</li>
                    <li>Click "Next" to fetch your Facebook pages</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Log into Facebook Button */}
            <button
              onClick={handleLogIntoFacebook}
              disabled={isLoading || !oauthUrl}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-3 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log into Facebook
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>

            {/* Did you successfully log in? */}
            <div className="mb-8">
              <p className="font-semibold text-gray-800 mb-4">Did you successfully log into Facebook?</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: didLogin === 'yes' ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="didLogin"
                    value="yes"
                    checked={didLogin === 'yes'}
                    onChange={() => setDidLogin('yes')}
                    className="w-5 h-5 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 font-medium">Yes, I completed the Facebook login</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ borderColor: didLogin === 'no' ? '#3b82f6' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="didLogin"
                    value="no"
                    checked={didLogin === 'no'}
                    onChange={() => setDidLogin('no')}
                    className="w-5 h-5 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-800 font-medium">No, I need to try again</span>
                </label>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={isLoading || didLogin !== 'yes'}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg py-4 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading Pages...' : 'Next - Fetch My Pages'}
            </button>
          </>
        ) : (
          <>
            {/* Logged in User */}
            <div className="mb-6 flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-700">Logged in as:</p>
                  <p className="font-semibold text-green-800">{loggedInUser}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPages(false);
                  setDidLogin(null);
                  setPages([]);
                  setSelectedPages([]);
                }}
                className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
            </div>

            {/* Page Selection */}
            <div className="mb-8">
              <p className="font-semibold text-gray-800 mb-4">
                Select the Facebook pages you want to connect ({pages.length} found)
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pages.map((page) => (
                  <label 
                    key={page.id} 
                    className="flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ borderColor: selectedPages.includes(page.id) ? '#8b5cf6' : '#e5e7eb' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={() => handlePageToggle(page.id)}
                      className="w-5 h-5 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{page.name}</p>
                      <p className="text-sm text-gray-500">ID: {page.id}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Connect & Finish Button */}
            <button
              onClick={handleConnectFinish}
              disabled={isLoading || selectedPages.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg py-4 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : `Connect ${selectedPages.length} Page${selectedPages.length !== 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 font-mono">
            User ID: {firmUserId || 'Loading...'}
          </p>
          <p className="text-xs text-gray-600 font-mono">
            OAuth URL: {oauthUrl ? '✅ Ready' : '⏳ Generating...'}
          </p>
        </div>
      </div>
    </div>
  );
}
