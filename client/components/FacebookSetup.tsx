// client/components/FacebookSetup.tsx
import React, { useState, useEffect } from 'react';
import { Facebook, ExternalLink, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { profilesApi } from '../lib/supabase-api';
import { toast } from 'sonner';
import { getBackendUrl } from '@/lib/envConfig';

interface FacebookSetupProps {
  onComplete: () => void;
  onSkip: () => void;
  userId?: string;
}

interface FacebookPage {
  page_id: string;
  page_name: string;
  instagram_available: boolean;
  connected: boolean;
}

const FacebookSetup: React.FC<FacebookSetupProps> = ({ 
  onComplete, 
  onSkip,
  userId 
}) => {
  const [step, setStep] = useState<'oauth' | 'waiting' | 'pages' | 'complete'>('oauth');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [firmUserId, setFirmUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ No authenticated user found');
          toast.error('Please log in to continue');
          return;
        }


        // Get profile to get firm_user_id
        const { data: profile, error: profileError } = await profilesApi.getByEmail(user.email);

        if (profileError) {
          console.error('❌ Error getting profile:', profileError);
          toast.error('Profile not found. Please complete registration first.');
          return;
        }

        if (profile?.user_id) {
          setFirmUserId(profile.user_id);
        } else {
          console.error('❌ No user_id found in profile');
          toast.error('User profile incomplete. Please contact support.');
        }
      } catch (error) {
        console.error('❌ Error getting user data:', error);
        toast.error('Failed to get user information');
      }
    };

    getUserData();
  }, []);

  // Don't check for integration on mount - let user initiate the flow

  const checkIntegrationStatus = async () => {
    if (!firmUserId) return;

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/facebook/check-integration-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });

      const data = await response.json();

      setIntegrationStatus(data);
      if (data.exists && data.has_tokens) {
        setHasIntegration(true);
        // If integration exists with tokens, we can skip to pages step
        if (step === 'waiting') {
          setStep('pages');
          clearInterval(checkInterval!);
          setCheckInterval(null);
        }
      }
    } catch (error) {
      console.error('Error checking integration:', error);
    }
  };

  // Step 1: Generate OAuth URL
  const generateOAuthUrl = async () => {
    if (!firmUserId) {
      toast.error('User ID not found. Please refresh the page.');
      return;
    }

    setIsLoading(true);
    try {
      
      // First, get the integration status to ensure we have ghl_location_id
      await checkIntegrationStatus();
      
      if (!integrationStatus || !integrationStatus.ghl_location_id) {
        throw new Error('Facebook integration not set up. Please complete the registration flow first.');
      }

      const locationId = integrationStatus.ghl_location_id;

      const backendUrl = getBackendUrl();

      // Use existing endpoint for OAuth generation with proper locationId
      const response = await fetch(`${backendUrl}/api/facebook/extract-oauth-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firmUserId,
          locationId: locationId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OAuth generation failed:', response.status, errorText);
        throw new Error(`Failed to generate OAuth URL: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.params) {
        // Build OAuth URL with proper parameters
        const oauthParams = new URLSearchParams({
          response_type: result.params.response_type || 'code',
          client_id: result.params.client_id,
          redirect_uri: 'https://services.leadconnectorhq.com/integrations/oauth/finish',
          scope: result.params.scope || 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,pages_manage_ads,leads_retrieval,ads_read,pages_messaging,ads_management,business_management,email,public_profile',
          state: JSON.stringify({
            locationId: locationId,
            userId: firmUserId,
            type: 'facebook',
            source: 'squidgy_facebook_setup'
          }),
          logger_id: result.params.logger_id || generateLoggerId()
        });

        const finalUrl = `https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`;
        setOauthUrl(finalUrl);
        toast.success('Facebook login URL generated successfully!');
      } else {
        throw new Error('Invalid OAuth response from server');
      }
    } catch (error: any) {
      console.error('❌ OAuth generation error:', error);
      if (error.message.includes('integration not set up')) {
        toast.error('Please complete the registration process first');
      } else {
        toast.error(error.message || 'Failed to generate Facebook login URL');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateLoggerId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Open Facebook OAuth
  const openFacebookOAuth = () => {
    if (!oauthUrl) {
      toast.error('Please generate the login URL first');
      return;
    }

    window.open(oauthUrl, '_blank');
    toast.info('Complete the Facebook login in the new window, then click "I have logged in"');
  };

  // Confirm OAuth completion and start checking
  const confirmOAuthComplete = () => {
    setStep('waiting');
    setTimeElapsed(0);
    
    // Start polling for integration status
    const interval = setInterval(() => {
      checkIntegrationStatus();
      setTimeElapsed(prev => prev + 5);
    }, 5000);
    
    setCheckInterval(interval);
    toast.info('Checking for Facebook integration...');
  };

  // Step 2: Load Facebook pages
  const loadFacebookPages = async () => {
    if (!firmUserId) {
      toast.error('User ID not found');
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/facebook/get-pages-from-integration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      if (result.success && result.pages) {
        setPages(result.pages);
        toast.success(`Found ${result.pages.length} Facebook pages!`);
      } else {
        throw new Error(result.message || 'No pages found');
      }
    } catch (error: any) {
      console.error('Error loading pages:', error);
      
      // Handle specific error cases
      if (error.message?.includes('401') || error.message?.includes('token')) {
        toast.error('Authentication expired. Please complete the registration process again.');
        // Optionally navigate back to registration
        // navigate('/website-details');
      } else if (error.message?.includes('404')) {
        toast.error('Facebook integration not found. Please complete setup first.');
      } else {
        toast.error(error.message || 'Failed to load Facebook pages');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save selected pages
  const saveSelectedPages = async () => {
    if (!firmUserId || selectedPages.length === 0) {
      toast.error('Please select at least one page');
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/facebook/save-selected-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          selected_page_ids: selectedPages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save pages');
      }

      const result = await response.json();
      
      if (result.success) {
        setStep('complete');
        toast.success('Facebook pages connected successfully!');
        setTimeout(onComplete, 2000);
      } else {
        throw new Error(result.message || 'Failed to save pages');
      }
    } catch (error: any) {
      console.error('Error saving pages:', error);
      toast.error(error.message || 'Failed to save selected pages');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  // Load pages when step changes to 'pages'
  useEffect(() => {
    if (step === 'pages' && pages.length === 0) {
      loadFacebookPages();
    }
  }, [step]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Facebook className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connect to Facebook</h3>
          <p className="text-sm text-gray-500">Connect to reach your sales leads on Facebook</p>
        </div>
      </div>

      {/* Step Content */}
      {step === 'oauth' && (
        <div className="space-y-4">
          {/* Simple flow - just show the buttons */}
          {!firmUserId ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading user information...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Click the button below to log into your Facebook account in a separate window. Return to this page after.
              </p>
              
              {!oauthUrl ? (
                <button
                  onClick={async () => {
                    // Simple direct OAuth URL generation
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
                        toast.error('GHL account setup is still in progress. Please wait a few moments and try again.');
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
                        // Build OAuth URL with correct format
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

                        const finalUrl = `https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`;
                        setOauthUrl(finalUrl);
                        toast.success('Facebook login ready! Click the button to connect.');
                      } else {
                        throw new Error('Invalid OAuth response from server');
                      }
                    } catch (error: any) {
                      console.error('OAuth generation error:', error);
                      toast.error(error.message || 'Failed to generate Facebook login');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Facebook className="w-5 h-5" />
                  )}
                  <span>{isLoading ? 'Preparing...' : 'Connect Facebook'}</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={openFacebookOAuth}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Log into Facebook</span>
                  </button>
                  
                  <button
                    onClick={confirmOAuthComplete}
                    className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>I have logged in</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'waiting' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
          <h4 className="text-lg font-medium">Checking Facebook Connection...</h4>
          <p className="text-gray-600">
            Waiting for Facebook integration to complete. This may take a few moments.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Checking for {timeElapsed} seconds...</span>
          </div>
          {integrationStatus && !integrationStatus.has_tokens && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Integration found but tokens are being generated. Please wait...
            </div>
          )}
          <button
            onClick={() => setStep('oauth')}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            Go back
          </button>
        </div>
      )}

      {step === 'pages' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Select Your Facebook Pages</h4>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : pages.length > 0 ? (
            <>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                {pages.map((page) => (
                  <label
                    key={page.page_id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.page_id)}
                      onChange={() => togglePageSelection(page.page_id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{page.page_name}</p>
                      {page.instagram_available && (
                        <p className="text-xs text-gray-500">Instagram available</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              <button
                onClick={saveSelectedPages}
                disabled={selectedPages.length === 0 || isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span>
                  {isLoading 
                    ? 'Connecting...' 
                    : `Connect ${selectedPages.length} Selected Page${selectedPages.length !== 1 ? 's' : ''}`}
                </span>
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {pages.length === 0 ? 'No Facebook pages found.' : 'Failed to load pages.'}
              </p>
              <button
                onClick={loadFacebookPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry Loading Pages
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Make sure you've completed the Facebook OAuth process
              </p>
            </div>
          )}
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900">Facebook Connected!</h4>
          <p className="text-gray-600">
            Your Facebook pages have been successfully connected to Squidgy.
          </p>
        </div>
      )}

      {/* Skip button */}
      {step !== 'complete' && (
        <div className="mt-6 text-center">
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip Facebook setup
          </button>
        </div>
      )}
    </div>
  );
};

export default FacebookSetup;
