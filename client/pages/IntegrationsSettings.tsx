import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle, XCircle, RefreshCw, ExternalLink, Facebook, X } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { supabase } from '../lib/supabase';
import { profilesApi } from '../lib/supabase-api';
import { toast } from 'sonner';

interface GHLIntegration {
  id: string;
  ghl_location_id: string;
  subaccount_name: string;
  creation_status: string;
  automation_status: string;
  PIT_Token: string | null;
  soma_ghl_user_id: string | null;
  created_at: string;
}

export default function IntegrationsSettings() {
  const { user } = useUser();
  const [ghlIntegrations, setGhlIntegrations] = useState<GHLIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [ghlUserId, setGhlUserId] = useState<string | null>(null);
  const [pitToken, setPitToken] = useState<string | null>(null);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState<boolean>(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [outlookCalendarConnected, setOutlookCalendarConnected] = useState<boolean>(false);
  const [outlookCalendarEmail, setOutlookCalendarEmail] = useState<string | null>(null);
  const [ghlUserName, setGhlUserName] = useState<string | null>(null);
  const [ghlUserEmail, setGhlUserEmail] = useState<string | null>(null);
  const [checkingCalendar, setCheckingCalendar] = useState<boolean>(false);
  const [facebookOAuthUrl, setFacebookOAuthUrl] = useState<string | null>(null);
  const [facebookDidLogin, setFacebookDidLogin] = useState<'yes' | 'no' | null>(null);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [facebookAdAccounts, setFacebookAdAccounts] = useState<any[]>([]);
  const [selectedFacebookPages, setSelectedFacebookPages] = useState<string[]>([]);
  const [selectedFacebookAdAccounts, setSelectedFacebookAdAccounts] = useState<string[]>([]);
  const [showFacebookPages, setShowFacebookPages] = useState(false);
  const [showAddPages, setShowAddPages] = useState(false);
  const [showAddAdAccounts, setShowAddAdAccounts] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [firmUserId, setFirmUserId] = useState<string | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Social Media Posting states
  const [socialMediaPages, setSocialMediaPages] = useState<any[]>([]);
  const [socialMediaOAuthId, setSocialMediaOAuthId] = useState<string | null>(null);
  const [showSocialMediaPages, setShowSocialMediaPages] = useState(false);
  const [socialMediaLoading, setSocialMediaLoading] = useState(false);
  const [manualOAuthId, setManualOAuthId] = useState<string>('');
  const [connectedSocialMediaAccounts, setConnectedSocialMediaAccounts] = useState<any[]>([]);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<'facebook' | 'instagram'>('facebook');

  useEffect(() => {
    getUserFirmId();
  }, [user]);

  useEffect(() => {
    if (firmUserId) {
      refreshFirebaseToken();
      fetchGHLIntegrations();
    }
  }, [firmUserId]);

  // Disabled auto-fetch to prevent 401 errors - users can manually click "Connect Facebook" button
  // useEffect(() => {
  //   if (locationId && firebaseToken && accessToken && !showFacebookPages) {
  //     Promise.all([
  //       fetchFacebookPagesFromGHL().catch(err => {
  //         console.log('⚠️ Skipping Facebook pages auto-fetch:', err.message);
  //       }),
  //       fetchFacebookAdAccountsFromGHL().catch(err => {
  //         console.log('⚠️ Skipping Facebook ad accounts auto-fetch:', err.message);
  //       })
  //     ]);
  //   }
  // }, [locationId, firebaseToken, accessToken]);

  useEffect(() => {
    // Auto-fetch connected social media accounts when tokens are available
    if (locationId && firebaseToken && accessToken) {
      fetchConnectedSocialMediaAccounts();
    }
  }, [locationId, firebaseToken, accessToken]);

  useEffect(() => {
    // Auto-check Google Calendar connection when tokens and ghlUserId are available
    if (ghlUserId && locationId && firebaseToken && accessToken) {
      checkGoogleCalendarConnection();
    }
  }, [ghlUserId, locationId, firebaseToken, accessToken]);

  const refreshFirebaseToken = async () => {
    if (!firmUserId) return;
    
    try {
      console.log('🔄 Checking Firebase token freshness...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/ghl/refresh-firebase-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.token_refreshed) {
          console.log('✅ Firebase token refresh started in background');
        } else {
          console.log(`✅ Firebase token is fresh (age: ${result.token_age_minutes} minutes)`);
        }
        // After refresh check, fetch the tokens
        await fetchTokensFromDatabase();
      }
    } catch (error) {
      console.error('❌ Error refreshing Firebase token:', error);
      // Don't show error to user - this is a background operation
    }
  };

  const fetchTokensFromDatabase = async () => {
    if (!firmUserId) return;
    
    try {
      console.log('🔑 Fetching tokens from database...');
      
      // Fetch from ghl_subaccounts table
      const { data: ghlData, error: ghlError } = await supabase
        .from('ghl_subaccounts')
        .select('"Firebase Token", PIT_Token, ghl_location_id')
        .eq('firm_user_id', firmUserId)
        .single();
      
      if (ghlError) throw ghlError;
      
      // Also fetch access_token from facebook_integrations table
      const { data: fbData } = await supabase
        .from('facebook_integrations')
        .select('access_token')
        .eq('firm_user_id', firmUserId)
        .single();
      
      if (ghlData) {
        const fbToken = ghlData['Firebase Token'];
        const pitTok = ghlData['PIT_Token'];
        const locId = ghlData['ghl_location_id'];
        const accessTok = fbData?.access_token || pitTok; // Use access_token if available, fallback to PIT
        
        setFirebaseToken(fbToken);
        setAccessToken(accessTok);
        setPitToken(pitTok);
        setLocationId(locId);
        
        console.log('✅ Tokens fetched:', {
          hasFirebaseToken: !!fbToken,
          hasAccessToken: !!accessTok,
          hasPITToken: !!pitTok,
          locationId: locId
        });
      }
    } catch (error) {
      console.error('❌ Error fetching tokens:', error);
    }
  };

  const checkGoogleCalendarConnection = async () => {
    if (!ghlUserId || !locationId || !firebaseToken || !accessToken) {
      return;
    }
    
    setCheckingCalendar(true);
    try {
      console.log('📅 Checking Google Calendar connection...');
      
      const calendarUrl = `https://services.leadconnectorhq.com/calendars/connections/calendars?locationId=${locationId}&userId=${ghlUserId}`;
      
      const response = await fetch(calendarUrl, {
        method: 'GET',
        headers: {
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GHL API error: ${response.status}`);
      }
      
      const calendarData = await response.json();
      console.log('✅ Calendar connections response:', calendarData);
      
      // Check if Google calendar is connected
      const googleCalendars = calendarData.thirdPartyCalendars?.google || {};
      const hasGoogleCalendar = Object.keys(googleCalendars).length > 0;
      
      // Check if Outlook calendar is connected
      const outlookCalendars = calendarData.thirdPartyCalendars?.outlook || {};
      const hasOutlookCalendar = Object.keys(outlookCalendars).length > 0;
      
      // Extract Google calendar email and user info
      let googleEmail = null;
      let userName = null;
      
      if (hasGoogleCalendar) {
        // Get the first email key from google calendars
        const emailKeys = Object.keys(googleCalendars);
        if (emailKeys.length > 0) {
          googleEmail = emailKeys[0];
          const calendars = googleCalendars[googleEmail];
          if (calendars && calendars.length > 0) {
            userName = calendars[0].accountName;
          }
        }
      }
      
      // Extract Outlook calendar email
      let outlookEmail = null;
      if (hasOutlookCalendar) {
        const emailKeys = Object.keys(outlookCalendars);
        if (emailKeys.length > 0) {
          outlookEmail = emailKeys[0];
        }
      }
      
      setGoogleCalendarConnected(hasGoogleCalendar);
      setGoogleCalendarEmail(googleEmail);
      setOutlookCalendarConnected(hasOutlookCalendar);
      setOutlookCalendarEmail(outlookEmail);
      setGhlUserName(userName);
      setGhlUserEmail(googleEmail);
      
      console.log(`📅 Google Calendar connected: ${hasGoogleCalendar}`, googleEmail ? `(${googleEmail})` : '');
      console.log(`📅 Outlook Calendar connected: ${hasOutlookCalendar}`, outlookEmail ? `(${outlookEmail})` : '');
    } catch (error: any) {
      console.error('❌ Error checking Google Calendar:', error);
    } finally {
      setCheckingCalendar(false);
    }
  };

  const fetchFacebookAdAccountsFromGHL = async () => {
    if (!locationId || !firebaseToken || !accessToken) {
      return;
    }
    
    try {
      console.log('📊 Fetching connected Facebook Ad Account from GHL backend API...');
      
      const ghlBackendUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/adAccount`;
      
      const response = await fetch(ghlBackendUrl, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        // No ad account connected, that's okay
        console.log('ℹ️ No ad account connected');
        setFacebookAdAccounts([]);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Facebook Ad Account response:', data);
      
      // Check if we have a connected ad account
      if (data.adAccountId && data.adAccountName) {
        const account = {
          id: data.adAccountId,
          name: data.adAccountName,
          ...data
        };
        setFacebookAdAccounts([account]);
        console.log(`✅ Connected ad account: ${data.adAccountName}`);
      } else {
        setFacebookAdAccounts([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching Facebook ad account:', error);
      setFacebookAdAccounts([]);
    }
  };

  const fetchFacebookPagesFromGHL = async () => {
    if (!locationId || !firebaseToken || !accessToken) {
      toast.error('Missing required tokens. Please wait for token refresh.');
      return;
    }
    
    setFacebookLoading(true);
    try {
      console.log('📄 Fetching Facebook pages from GHL backend API...');
      
      // First, get connected pages
      const connectedPagesUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/pages`;
      const connectedResponse = await fetch(`${connectedPagesUrl}?getAll=true`, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      let connectedPages = [];
      if (connectedResponse.ok) {
        const connectedData = await connectedResponse.json();
        console.log('✅ Connected pages response:', connectedData);
        connectedPages = connectedData.pages || [];
      }
      
      // Then, get all available pages
      const allPagesUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/allPages`;
      const allPagesResponse = await fetch(`${allPagesUrl}?limit=100`, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      if (!allPagesResponse.ok) {
        throw new Error(`GHL API error: ${allPagesResponse.status}`);
      }
      
      const allPagesData = await allPagesResponse.json();
      console.log('✅ All available pages response:', allPagesData);
      
      const rawPages = allPagesData.pages || [];
      const connectedPageIds = new Set(connectedPages.map((p: any) => p.facebookPageId));
      
      // Map GHL response format to our UI format and mark connected pages
      const pages = rawPages.map((page: any) => ({
        id: page.facebookPageId,
        name: page.facebookPageName,
        isConnected: connectedPageIds.has(page.facebookPageId),
        ...page
      }));
      
      setFacebookPages(pages);
      console.log(`✅ Found ${pages.length} total pages (${connectedPages.length} connected)`);
    } catch (error: any) {
      console.error('❌ Error fetching Facebook pages:', error);
      toast.error(error.message || 'Failed to fetch Facebook pages');
    } finally {
      setFacebookLoading(false);
    }
  };

  const getUserFirmId = async () => {
    if (!user?.email) return;
    try {
      const { data: profile } = await profilesApi.getByEmail(user.email);
      if (profile?.user_id) {
        setFirmUserId(profile.user_id);
      }
    } catch (error) {
      console.error('Error getting firm user ID:', error);
    }
  };

  useEffect(() => {
    if (locationId) {
      checkGoogleCalendarConnection();
    }
  }, [locationId]);

  useEffect(() => {
    // Listen for OAuth callback messages from popup
    const handleOAuthCallback = (event: MessageEvent) => {
      // Check if message is from GHL OAuth
      if (event.data?.type === 'oauth-success' || event.data === 'oauth-success') {
        console.log('OAuth success detected, refreshing connection status...');
        // Refresh connection status after OAuth completes
        setTimeout(() => {
          checkGoogleCalendarConnection();
        }, 2000); // Wait 2 seconds for GHL to process the connection
      }
    };

    // Listen for window focus to refresh status when user returns from OAuth popup
    const handleWindowFocus = () => {
      if (locationId && pitToken) {
        console.log('Window focused, refreshing connection status...');
        setTimeout(() => {
          checkGoogleCalendarConnection();
        }, 1000);
      }
    };

    window.addEventListener('message', handleOAuthCallback);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('message', handleOAuthCallback);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [locationId, pitToken]);

  const fetchGHLIntegrations = async () => {
    if (!firmUserId) return;
    
    try {
      setLoading(true);
      
      // Query Supabase directly for GHL integrations using firm_user_id
      const { data, error: supabaseError } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('firm_user_id', firmUserId);
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      setGhlIntegrations(data || []);
      
      // Extract location_id, ghl_user_id, and PIT_Token from the first integration
      if (data && data.length > 0) {
        setLocationId(data[0].ghl_location_id);
        setGhlUserId(data[0].soma_ghl_user_id || null);
        setPitToken(data[0].PIT_Token || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleAccountConnect = () => {
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://api.leadconnectorhq.com/gmail/start_oauth?locationId=${locationId}&userId=${ghlUserId}`;
    
    // Open in a centered popup window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      oauthUrl,
      'GoogleAccountOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleGoogleCalendarConnect = () => {
    if (!locationId) {
      alert('Unable to connect: Location ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    // Use hardcoded userId that works for this account
    const userId = 'k2uP8MkaoPU3Xas79npg';
    const oauthUrl = `https://services.leadconnectorhq.com/social-media-posting/oauth/google/start?locationId=${locationId}&userId=${userId}`;
    
    // Open in a centered popup window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      'GoogleCalendarOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    // Monitor popup for completion
    if (popup) {
      const pollTimer = setInterval(() => {
        try {
          // Check if popup is closed
          if (popup.closed) {
            clearInterval(pollTimer);
            console.log('OAuth popup closed, refreshing connection status...');
            setTimeout(() => {
              checkGoogleCalendarConnection();
            }, 2000);
            return;
          }

          // Try to access popup URL to detect redirect to success page
          try {
            const popupUrl = popup.location.href;
            // Check if redirected to success/completion page
            if (popupUrl.includes('success') || popupUrl.includes('complete') || popupUrl.includes('callback')) {
              console.log('OAuth success detected from URL:', popupUrl);
              popup.close();
              clearInterval(pollTimer);
              setTimeout(() => {
                checkGoogleCalendarConnection();
              }, 2000);
            }
          } catch (e) {
            // Cross-origin error - popup is still on OAuth provider domain, continue polling
          }
        } catch (e) {
          // Error accessing popup, it may be closed
          clearInterval(pollTimer);
        }
      }, 500); // Check every 500ms
    }
  };

  const generateLoggerId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateFacebookOAuthUrl = async () => {
    if (!firmUserId) {
      console.log('🔍 No firmUserId available');
      return;
    }

    console.log('🚀 Starting Facebook OAuth URL generation for firmUserId:', firmUserId);
    setFacebookLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      const checkResponse = await fetch(`${backendUrl}/api/facebook/check-integration-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      const checkData = await checkResponse.json();
      let fbLocationId = checkData.ghl_location_id;
      
      if (!fbLocationId) {
        const ghlResponse = await fetch(`${backendUrl}/api/ghl/get-location-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firm_user_id: firmUserId })
        });
        
        if (ghlResponse.ok) {
          const ghlData = await ghlResponse.json();
          fbLocationId = ghlData.location_id;
        }
      }
      
      if (!fbLocationId) {
        toast.error('GHL account setup is still in progress. Please wait and try again.');
        return;
      }
      
      const response = await fetch(`${backendUrl}/api/facebook/extract-oauth-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: firmUserId,
          locationId: fbLocationId
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.params) {
        const enhancedScope = 'email,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_posts,pages_manage_engagement,pages_read_user_content,business_management,public_profile,read_insights,pages_manage_ads,leads_retrieval,ads_read,pages_messaging,ads_management,instagram_basic,instagram_manage_messages,instagram_manage_comments,catalog_management';
        
        const oauthParams = new URLSearchParams({
          response_type: data.params.response_type || 'code',
          client_id: data.params.client_id,
          redirect_uri: 'https://services.leadconnectorhq.com/integrations/oauth/finish',
          scope: enhancedScope,
          state: JSON.stringify({
            locationId: fbLocationId,
            userId: fbLocationId,
            type: 'facebook',
            source: 'squidgy_integrations'
          }),
          logger_id: data.params.logger_id || generateLoggerId()
        });

        const finalOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${oauthParams.toString()}`;
        setFacebookOAuthUrl(finalOAuthUrl);
        console.log('✅ Successfully generated Facebook OAuth URL');
      } else {
        throw new Error('Invalid OAuth response from server');
      }
    } catch (error: any) {
      console.error('❌ Facebook OAuth generation error:', error);
      toast.error(error.message || 'Failed to generate Facebook login');
    } finally {
      setFacebookLoading(false);
    }
  };

  useEffect(() => {
    if (firmUserId && !facebookOAuthUrl && !showFacebookPages) {
      generateFacebookOAuthUrl();
    }
  }, [firmUserId]);

  const handleFacebookLogin = async () => {
    if (!firmUserId) {
      toast.error('User ID not available. Please refresh the page.');
      return;
    }
    
    setFacebookLoading(true);
    try {
      console.log('🔗 Starting Facebook OAuth automation...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      // Step 1: Start backend automation that will intercept tokens
      const response = await fetch(`${backendUrl}/api/facebook/start-oauth-with-interception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to start OAuth automation');
      }
      
      if (result.success && result.oauth_url) {
        console.log('✅ Automation started, opening OAuth popup...');
        
        // Step 2: Open OAuth URL in popup window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          result.oauth_url,
          'Facebook OAuth',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );
        
        if (popup) {
          toast.success('Facebook login window opened. The automation is capturing your tokens in the background.');
          console.log('✅ OAuth popup opened, session_id:', result.session_id);
          
          // Store session ID for status checking
          sessionStorage.setItem('fb_oauth_session_id', result.session_id);
        } else {
          toast.error('Popup blocked! Please allow popups for this site and try again.');
          console.error('❌ Popup was blocked by browser');
        }
      } else {
        throw new Error(result.message || 'Failed to start OAuth automation');
      }
    } catch (error: any) {
      console.error('❌ Error starting OAuth automation:', error);
      toast.error(error.message || 'Failed to start OAuth automation');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleFacebookNext = async () => {
    // Fetch both pages and ad accounts
    await Promise.all([
      fetchFacebookPagesFromGHL(),
      fetchFacebookAdAccountsFromGHL()
    ]);
  };

  const handleFacebookPageToggle = (pageId: string) => {
    setSelectedFacebookPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      } else {
        return [...prev, pageId];
      }
    });
  };

  const handleFacebookConnectFinish = async () => {
    if (selectedFacebookPages.length === 0) {
      toast.error('Please select at least one page');
      return;
    }

    if (!locationId || !firebaseToken || !accessToken) {
      toast.error('Missing required tokens');
      return;
    }

    setFacebookLoading(true);
    try {
      console.log('🔗 Connecting selected pages to GHL...');
      
      // Get full page data for selected pages
      const selectedPagesData = facebookPages.filter(page => 
        selectedFacebookPages.includes(page.id)
      );
      
      // POST to GHL backend API to connect pages
      const ghlBackendUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/pages`;
      
      const response = await fetch(ghlBackendUrl, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          pages: selectedPagesData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to connect pages: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Pages connected successfully:', result);
      
      toast.success(`Successfully connected ${selectedFacebookPages.length} Facebook page${selectedFacebookPages.length !== 1 ? 's' : ''}!`);
      
      // Reset state
      setShowFacebookPages(false);
      setFacebookDidLogin(null);
      setSelectedFacebookPages([]);
      setFacebookPages([]);
    } catch (error: any) {
      console.error('❌ Error connecting pages:', error);
      toast.error(error.message || 'Failed to connect pages');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleOutlookCalendarConnect = () => {
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://api.leadconnectorhq.com/api/outlook/start_oauth?location_id=${locationId}&user_id=${ghlUserId}&requestedBy=${ghlUserId}`;
    
    // Open in a centered popup window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      oauthUrl,
      'OutlookCalendarOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // Social Media Posting Functions
  const handleSocialMediaFacebookConnect = () => {
    setSocialMediaPlatform('facebook');
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://backend.leadconnectorhq.com/social-media-posting/oauth/facebook/start?locationId=${locationId}&userId=${ghlUserId}`;
    
    // Open in a centered popup window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      'FacebookSocialMediaOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    // Listen for messages from the popup (OAuth callback may send OAuth ID)
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.oAuthId) {
        console.log('✅ Received OAuth ID from popup:', event.data.oAuthId);
        window.removeEventListener('message', messageHandler);
        fetchSocialMediaAccountsWithOAuthId(event.data.oAuthId, 'facebook');
      }
    };
    window.addEventListener('message', messageHandler);

    // Also check for popup closure as fallback
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        // After OAuth, try to fetch OAuth connections and then accounts
        fetchSocialMediaAccounts('facebook');
      }
    }, 1000);
  };

  const handleSocialMediaInstagramConnect = () => {
    setSocialMediaPlatform('instagram');
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://backend.leadconnectorhq.com/social-media-posting/oauth/instagram/start?locationId=${locationId}&userId=${ghlUserId}&loginType=instagram`;
    
    // Open in a centered popup window
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      oauthUrl,
      'InstagramSocialMediaOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    // Listen for messages from the popup (OAuth callback may send OAuth ID)
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.oAuthId) {
        console.log('✅ Received Instagram OAuth ID from popup:', event.data.oAuthId);
        window.removeEventListener('message', messageHandler);
        fetchSocialMediaAccountsWithOAuthId(event.data.oAuthId, 'instagram');
      }
    };
    window.addEventListener('message', messageHandler);

    // Also check for popup closure as fallback
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        // After OAuth, try to fetch OAuth connections and then accounts
        fetchSocialMediaAccounts('instagram');
      }
    }, 1000);
  };

  const fetchConnectedSocialMediaAccounts = async () => {
    if (!locationId || !firebaseToken || !accessToken) {
      return;
    }

    try {
      const accountsUrl = `https://backend.leadconnectorhq.com/social-media-posting/${locationId}/accounts`;
      
      const response = await fetch(accountsUrl, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.results && data.results.accounts) {
          setConnectedSocialMediaAccounts(data.results.accounts);
          console.log('✅ Connected social media accounts:', data.results.accounts);
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching connected social media accounts:', error);
    }
  };

  const fetchSocialMediaAccounts = async (platform: 'facebook' | 'instagram' = 'facebook') => {
    if (!locationId || !firebaseToken || !accessToken) {
      toast.error('Missing required tokens. Please wait for token refresh.');
      return;
    }

    setSocialMediaLoading(true);
    setShowSocialMediaPages(true);
    setSocialMediaPlatform(platform);
    
    let attempts = 0;
    const maxAttempts = 12; // 12 attempts * 5 seconds = 1 minute max
    
    const pollForAccounts = async () => {
      try {
        attempts++;
        console.log(`📱 Polling for social media OAuth connections (attempt ${attempts}/${maxAttempts})...`);
        
        // Fetch all accounts (connected + available to connect) with fetchAll=true
        const accountsUrl = `https://backend.leadconnectorhq.com/social-media-posting/${locationId}/accounts?fetchAll=true`;
        
        const response = await fetch(accountsUrl, {
          method: 'GET',
          headers: {
            'authorization': `Bearer ${accessToken}`,
            'token-id': firebaseToken,
            'version': '2021-07-28',
            'channel': 'APP',
            'source': 'WEB_USER',
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ All accounts response (fetchAll=true):', data);
          
          // Check if we have accounts with oauthId
          if (data.success && data.results && data.results.accounts && data.results.accounts.length > 0) {
            // Filter accounts by platform
            const platformAccounts = data.results.accounts.filter((acc: any) => acc.platform === platform);
            
            if (platformAccounts.length > 0) {
              const account = platformAccounts[0];
              const oAuthId = account.oauthId;
              
              console.log(`✅ Found ${platform} account with OAuth ID:`, oAuthId);
              console.log(`🔗 Will fetch ${platform} accounts from:`, `https://backend.leadconnectorhq.com/social-media-posting/oauth/${locationId}/${platform}/accounts/${oAuthId}`);
              
              if (oAuthId) {
                await fetchSocialMediaAccountsWithOAuthId(oAuthId, platform);
                setSocialMediaLoading(false);
                return; // Stop polling
              } else {
                console.warn(`⚠️ ${platform} account found but no oauthId, will retry...`);
              }
            } else {
              console.log(`⏳ No ${platform} accounts found yet, waiting for OAuth completion...`);
            }
          } else {
            console.log('⏳ No accounts found yet, waiting for OAuth completion...');
          }
        }
        
        // If we haven't found OAuth connection yet and haven't exceeded max attempts, poll again
        if (attempts < maxAttempts) {
          setTimeout(pollForAccounts, 5000); // Poll every 5 seconds
        } else {
          console.log('⏱️ Max polling attempts reached');
          toast.info('OAuth completed. Please click "Connect Facebook" again to see available pages.');
          setSocialMediaLoading(false);
        }
        
      } catch (error: any) {
        console.error('❌ Error polling for accounts:', error);
        if (attempts < maxAttempts) {
          setTimeout(pollForAccounts, 5000); // Continue polling on error
        } else {
          toast.error('Failed to fetch accounts. Please try again.');
          setSocialMediaLoading(false);
        }
      }
    };
    
    // Start polling
    pollForAccounts();
  };

  const fetchSocialMediaAccountsWithOAuthId = async (oAuthId: string, platform: 'facebook' | 'instagram' = 'facebook') => {
    if (!locationId || !firebaseToken || !accessToken) {
      return;
    }

    setSocialMediaLoading(true);
    setSocialMediaPlatform(platform);
    try {
      console.log(`📱 Fetching ${platform} accounts with OAuth ID:`, oAuthId);
      
      const url = `https://backend.leadconnectorhq.com/social-media-posting/oauth/${locationId}/${platform}/accounts/${oAuthId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json',
          'accept-encoding': 'gzip, deflate, br, zstd',
          'accept-language': 'en-US,en;q=0.9,en-GB;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Social media accounts response:', data);
      
      if (data.success && data.results?.pages) {
        setSocialMediaPages(data.results.pages);
        setSocialMediaOAuthId(oAuthId);
        setShowSocialMediaPages(true);
      } else if (data.success && data.results?.accounts) {
        // Instagram returns accounts instead of pages
        setSocialMediaPages(data.results.accounts);
        setSocialMediaOAuthId(oAuthId);
        setShowSocialMediaPages(true);
      }
    } catch (error: any) {
      console.error('❌ Error fetching social media accounts:', error);
      toast.error(error.message || 'Failed to fetch social media accounts');
    } finally {
      setSocialMediaLoading(false);
    }
  };

  const connectSocialMediaPage = async (page: any) => {
    if (!locationId || !firebaseToken || !accessToken || !socialMediaOAuthId) {
      toast.error('Missing required information');
      return;
    }

    setSocialMediaLoading(true);
    try {
      console.log(`🔗 Connecting ${socialMediaPlatform} account:`, page);
      
      const url = `https://backend.leadconnectorhq.com/social-media-posting/oauth/${locationId}/${socialMediaPlatform}/accounts/${socialMediaOAuthId}`;
      
      console.log('📄 Page/Account object:', page);
      console.log('📄 Page/Account originId:', page.originId);
      console.log('📄 Page/Account id:', page.id);

      // Extract originId - ensure it's a string
      const originId = String(page.originId || page.id || '').trim();
      
      if (!originId) {
        throw new Error('Page originId is missing');
      }

      console.log('📄 Using originId:', originId);

      const requestBody = {
        originId: originId,
        platform: socialMediaPlatform,
        type: socialMediaPlatform === 'facebook' ? 'page' : 'account',
        name: page.name || '',
        avatar: page.avatar || ''
      };

      console.log('📤 POST request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ API Error Response:', errorData);
        console.error('❌ Request Body:', requestBody);
        throw new Error(`API error: ${response.status} - ${errorData?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Connected social media page:', data);
      
      if (data.success) {
        toast.success(`Connected ${page.name} successfully!`);
        // Refresh the accounts list
        fetchSocialMediaAccountsWithOAuthId(socialMediaOAuthId, socialMediaPlatform);
      }
    } catch (error: any) {
      console.error('❌ Error connecting social media page:', error);
      toast.error(error.message || 'Failed to connect page');
    } finally {
      setSocialMediaLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'created': { label: 'Active', variant: 'default' },
      'pit_completed': { label: 'Connected', variant: 'default' },
      'pit_running': { label: 'Connecting...', variant: 'secondary' },
      'pit_failed': { label: 'Failed', variant: 'destructive' },
      'pending': { label: 'Pending', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <SettingsLayout title="Integrations">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your connected services and integrations
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Google Account Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Google Account</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your location's Google Account
                  </p>
                </div>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={handleGoogleAccountConnect}
                  disabled={loading || !locationId || !ghlUserId}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  {loading ? 'Loading...' : 'Sign in with Google'}
                </Button>
                {!loading && (!locationId || !ghlUserId) && (
                  <p className="text-xs text-red-500">
                    Please set up a GHL subaccount first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar Integration */}
          <Card className="hover:shadow-lg transition-shadow bg-white">
            <CardContent className="pt-6 bg-white">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2 relative">
                  <img 
                    src="https://w7.pngwing.com/pngs/44/943/png-transparent-google-calendar-logo-icon.png" 
                    alt="Google Calendar"
                    className="w-full h-full object-contain"
                  />
                  {googleCalendarConnected && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">Google Calendar</h3>
                    {googleCalendarConnected && (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    )}
                  </div>
                  {googleCalendarConnected ? (
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="font-medium">{ghlUserName}</p>
                      <p className="text-xs text-gray-500">{googleCalendarEmail || ghlUserEmail}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Google Calendar to sync events and appointments
                    </p>
                  )}
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleGoogleCalendarConnect}
                  disabled={loading || !locationId || !ghlUserId || checkingCalendar}
                >
                  {checkingCalendar ? 'Checking...' : loading ? 'Loading...' : googleCalendarConnected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
                </Button>
                {!loading && (!locationId || !ghlUserId) && (
                  <p className="text-xs text-red-500">
                    Please set up a GHL subaccount first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Facebook / Instagram Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-lg flex overflow-hidden relative">
                  <div className="w-1/2 bg-blue-600 flex items-center justify-center">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="w-1/2 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  {(facebookPages.length > 0 || facebookAdAccounts.length > 0) && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">Facebook/Instagram Ads</h3>
                    {(facebookPages.length > 0 || facebookAdAccounts.length > 0) && (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {(facebookPages.length > 0 || facebookAdAccounts.length > 0)
                      ? `${facebookPages.length} page${facebookPages.length !== 1 ? 's' : ''}, ${facebookAdAccounts.length} ad account${facebookAdAccounts.length !== 1 ? 's' : ''}`
                      : 'Connect your Facebook account and Instagram for ads management'
                    }
                  </p>
                  {facebookPages.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Pages:</p>
                      {facebookPages.filter(p => p.isConnected).map(p => (
                        <div key={p.id} className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {facebookAdAccounts.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Ad Accounts:</p>
                      <p>{facebookAdAccounts.map(a => a.name).join(', ')}</p>
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={() => setShowFacebookPages(true)}
                  disabled={loading || !locationId}
                >
                  {(facebookPages.length > 0 || facebookAdAccounts.length > 0) ? 'Manage Integration' : 'Connect Facebook'}
                </Button>
                {!loading && !locationId && (
                  <p className="text-xs text-red-500">
                    Please set up a GHL subaccount first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facebook Management Modal/Section */}
        {showFacebookPages && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              {!facebookDidLogin ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Facebook Connected</p>
                        <p className="text-sm text-green-600">Found {facebookPages.length} pages</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowFacebookPages(false);
                        setFacebookDidLogin(null);
                        setFacebookPages([]);
                        setSelectedFacebookPages([]);
                      }}
                    >
                      Start Over
                    </Button>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-4">Select the Facebook pages you want to connect</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {facebookPages.map((page) => (
                        <label 
                          key={page.id} 
                          className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg hover:bg-gray-50 transition-colors ${page.isConnected ? 'bg-green-50' : ''}`}
                          style={{ borderColor: page.isConnected ? '#10b981' : (selectedFacebookPages.includes(page.id) ? '#8b5cf6' : '#e5e7eb') }}
                        >
                          {page.isConnected ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedFacebookPages.includes(page.id)}
                              onChange={() => handleFacebookPageToggle(page.id)}
                              className="w-4 h-4 text-purple-500"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">{page.name}</p>
                              {page.isConnected && (
                                <Badge variant="default" className="bg-green-500 text-xs">Connected</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">ID: {page.id}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    onClick={handleFacebookConnectFinish}
                    disabled={facebookLoading || selectedFacebookPages.length === 0}
                  >
                    {facebookLoading ? 'Connecting...' : `Connect ${selectedFacebookPages.length} Page${selectedFacebookPages.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Integration Cards Grid - Continued */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Outlook Calendar Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2 relative">
                  <img 
                    src="https://img.icons8.com/color/480/outlook-calendar.png" 
                    alt="Outlook Calendar"
                    className="w-full h-full object-contain"
                  />
                  {outlookCalendarConnected && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-900">Outlook Calendar</h3>
                    {outlookCalendarConnected && (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    )}
                  </div>
                  {outlookCalendarConnected ? (
                    <div className="text-sm text-gray-600 mt-1">
                      <p className="text-xs text-gray-500">{outlookCalendarEmail}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Outlook Calendar to sync events and appointments
                    </p>
                  )}
                </div>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleOutlookCalendarConnect}
                  disabled={loading || !locationId || !ghlUserId || checkingCalendar}
                >
                  {checkingCalendar ? 'Checking...' : loading ? 'Loading...' : outlookCalendarConnected ? 'Reconnect Outlook Calendar' : 'Connect Outlook Calendar'}
                </Button>
                {!loading && (!locationId || !ghlUserId) && (
                  <p className="text-xs text-red-500">
                    Please set up a GHL subaccount first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Social Media Integrations Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Facebook Social Media Posting */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://techstory.in/wp-content/uploads/2023/09/Facebook_Logo_2019-1024x1024.png" 
                      alt="Facebook"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Facebook Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect Facebook pages for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook').length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook').length} Page{connectedSocialMediaAccounts.filter(a => a.platform === 'facebook').length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook').map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img 
                                src={account.avatar} 
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Facebook Page</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    onClick={handleSocialMediaFacebookConnect}
                    disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                  >
                    {socialMediaLoading ? 'Loading...' : 'Connect Facebook'}
                  </Button>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instagram Social Media Posting */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://static.vecteezy.com/system/resources/previews/018/930/413/non_2x/instagram-logo-instagram-icon-transparent-free-png.png" 
                      alt="Instagram"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Instagram Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect Instagram accounts for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram').length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram').length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'instagram').length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram').map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img 
                                src={account.avatar} 
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Instagram Account</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    onClick={handleSocialMediaInstagramConnect}
                    disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                  >
                    {socialMediaLoading ? 'Loading...' : 'Connect Instagram'}
                  </Button>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Media Pages Modal */}
        {showSocialMediaPages && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {socialMediaPlatform === 'instagram' ? 'Instagram Social Media Accounts' : 'Facebook Social Media Pages'}
                  </CardTitle>
                  <CardDescription>
                    {socialMediaPlatform === 'instagram' 
                      ? 'Select Instagram accounts to connect for social media posting'
                      : 'Select pages to connect for social media posting'
                    }
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSocialMediaPages(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {socialMediaLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading {socialMediaPlatform === 'instagram' ? 'accounts' : 'pages'}...</p>
                </div>
              ) : socialMediaPages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No {socialMediaPlatform === 'instagram' ? 'accounts' : 'pages'} available. Please complete OAuth first.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    After OAuth, you'll need to provide the OAuth ID to fetch {socialMediaPlatform === 'instagram' ? 'accounts' : 'pages'}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialMediaPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {page.avatar && (
                          <img
                            src={page.avatar}
                            alt={page.name}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-xs text-gray-500">ID: {page.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {page.isConnected ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => connectSocialMediaPage(page)}
                            disabled={socialMediaLoading}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coming Soon Section */}
        <Card className="border-dashed mt-8">
          <CardHeader>
            <CardTitle className="text-gray-400">More Integrations Coming Soon</CardTitle>
            <CardDescription>
              We're working on adding more integrations to help you connect your favorite tools
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </SettingsLayout>
  );
}
