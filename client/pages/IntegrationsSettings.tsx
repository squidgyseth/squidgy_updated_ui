import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle, XCircle, RefreshCw, ExternalLink, Facebook, X, Trash2 } from 'lucide-react';
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
  pit_token: string | null;
  soma_ghl_user_id: string | null;
  created_at: string;
}

interface TemplateLayer {
  name: string;
  type: string;
  description?: string;
  text?: string;
  fontFamily?: string;
  color?: string;
  imageUrl?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  size: { width: number; height: number };
  layers: TemplateLayer[];
  isEnabled: boolean;
}

export default function IntegrationsSettings() {
  const { user } = useUser();
  const [ghlIntegrations, setGhlIntegrations] = useState<GHLIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [ghlUserId, setGhlUserId] = useState<string | null>(null);
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
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
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [tokenRefreshRequested, setTokenRefreshRequested] = useState(false);
  const [pollingForToken, setPollingForToken] = useState(false);
  
  // Social Media Posting states
  const [socialMediaPages, setSocialMediaPages] = useState<any[]>([]);
  const [socialMediaOAuthId, setSocialMediaOAuthId] = useState<string | null>(null);
  const [showSocialMediaPages, setShowSocialMediaPages] = useState(false);
  const [socialMediaLoading, setSocialMediaLoading] = useState(false);
  const [manualOAuthId, setManualOAuthId] = useState<string>('');
  const [connectedSocialMediaAccounts, setConnectedSocialMediaAccounts] = useState<any[]>([]);
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<'facebook' | 'instagram' | 'linkedin' | 'threads' | 'gbp' | 'tiktok' | 'youtube' | 'pinterest' | 'community' | 'bluesky' | 'teams' | 'slack'>('facebook');
  const [socialMediaPolling, setSocialMediaPolling] = useState(false);
  const [oauthWindowOpen, setOauthWindowOpen] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managePlatform, setManagePlatform] = useState<'facebook' | 'instagram' | 'linkedin' | 'threads' | 'gbp' | 'tiktok' | 'youtube' | 'pinterest' | 'community' | 'bluesky' | 'teams' | 'slack'>('facebook');

  // Templates states
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [togglingTemplateId, setTogglingTemplateId] = useState<string | null>(null);

  // Helper function to decode Firebase token and extract user_id
  const decodeFirebaseToken = (token: string): string | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.user_id || null;
    } catch (error) {
      console.error('Error decoding Firebase token:', error);
      return null;
    }
  };

  // Helper function to check if Firebase token is expired
  const isFirebaseTokenExpired = (token: string): boolean => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;

      if (!exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now >= exp;

      if (isExpired) {
      }

      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  // Helper function to get placeholder avatar for social media platforms
  const getPlaceholderAvatar = (platform?: string, accountName?: string): string => {
    // Use dicebear API with platform name as seed for consistent placeholder
    const seed = accountName || platform || 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  useEffect(() => {
    getUserFirmId();
  }, [user]);

  useEffect(() => {
    if (firmUserId) {
      fetchTokensFromDatabase(true); // Check age on initial load
      fetchGHLIntegrations();
    }
  }, [firmUserId]);

  // Extract user_id from Firebase token when it changes
  useEffect(() => {
    if (firebaseToken) {
      const userId = decodeFirebaseToken(firebaseToken);
      if (userId) {
        setFirebaseUserId(userId);
      }
    }
  }, [firebaseToken]);

  useEffect(() => {
    // Auto-fetch Facebook pages and ad accounts when tokens are available
    if (locationId && firebaseToken && accessToken && !refreshingToken) {
      Promise.all([
        fetchFacebookPagesFromGHL().catch(err => {
        }),
        fetchFacebookAdAccountsFromGHL().catch(err => {
        })
      ]);
    }
  }, [locationId, firebaseToken, accessToken, refreshingToken]);

  useEffect(() => {
    // Auto-fetch connected social media accounts when tokens are available
    if (locationId && firebaseToken && accessToken) {
      fetchConnectedSocialMediaAccounts();
    }
  }, [locationId, firebaseToken, accessToken]);

  // Real-time polling for social media account updates
  useEffect(() => {
    if (!socialMediaPolling || !firmUserId) return;

    const pollInterval = setInterval(() => {
      fetchConnectedSocialMediaAccounts();
    }, 5000); // Poll every 5 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setSocialMediaPolling(false);
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [socialMediaPolling, firmUserId]);

  // Monitor OAuth window and trigger refresh when closed
  useEffect(() => {
    if (!oauthWindowOpen) return;

    const checkWindowClosed = setInterval(() => {
      // OAuth window was closed, trigger refresh
      fetchConnectedSocialMediaAccounts();
    }, 3000); // Check every 3 seconds

    // Stop checking after 5 minutes
    const timeout = setTimeout(() => {
      setOauthWindowOpen(false);
    }, 300000);

    return () => {
      clearInterval(checkWindowClosed);
      clearTimeout(timeout);
    };
  }, [oauthWindowOpen]);

  useEffect(() => {
    // Auto-check Google Calendar connection when tokens and ghlUserId are available
    if (ghlUserId && locationId && firebaseToken && accessToken) {
      checkGoogleCalendarConnection();
    }
  }, [ghlUserId, locationId, firebaseToken, accessToken]);

  const refreshFirebaseToken = async () => {
    if (!firmUserId || tokenRefreshRequested) return; // Prevent duplicate requests
    
    setRefreshingToken(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/ghl/refresh-firebase-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.token_refreshed) {
        } else {
          const ageText = result.token_age_minutes !== undefined && result.token_age_minutes !== null 
            ? `${result.token_age_minutes} minutes` 
            : 'unknown';
          // Token is fresh, fetch it now
          await fetchTokensFromDatabase(false);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing Firebase token:', error);
      setTokenRefreshRequested(false);
    } finally {
      setRefreshingToken(false);
    }
  };

  const fetchTokensFromDatabase = async (checkAge = false) => {
    if (!firmUserId) return;
    
    try {
      
      // Fetch from ghl_subaccounts table including token timestamp
      const { data: ghlData, error: ghlError } = await supabase
        .from('ghl_subaccounts')
        .select('firebase_token, pit_token, ghl_location_id, firebase_token_time')
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
        const fbToken = ghlData.firebase_token;
        const pitTok = ghlData.pit_token;
        const locId = ghlData.ghl_location_id;
        const tokenTime = ghlData.firebase_token_time;
        const accessTok = fbData?.access_token || pitTok; // Use access_token if available, fallback to PIT
        
        // Only check age on initial load, not during polling
        if (checkAge && !tokenRefreshRequested) {
          let tokenNeedsRefresh = false;
          if (tokenTime && fbToken) {
            const tokenDate = new Date(tokenTime);
            const now = new Date();
            const ageInMinutes = (now.getTime() - tokenDate.getTime()) / (1000 * 60);
            
            if (ageInMinutes > 60) {
              tokenNeedsRefresh = true;
            }
          } else if (!fbToken || !tokenTime) {
            tokenNeedsRefresh = true;
          }
          
          // Trigger refresh ONCE and start polling
          if (tokenNeedsRefresh) {
            setTokenRefreshRequested(true);
            await refreshFirebaseToken();
            startTokenPolling();
            return; // Don't set tokens yet, wait for refresh
          }
        }
        
        setFirebaseToken(fbToken);
        setAccessToken(accessTok);
        setPitToken(pitTok);
        setLocationId(locId);
        
      }
    } catch (error) {
      console.error('❌ Error fetching tokens:', error);
    }
  };

  const startTokenPolling = () => {
    if (pollingForToken) return; // Already polling
    
    setPollingForToken(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const { data: ghlData } = await supabase
          .from('ghl_subaccounts')
          .select('firebase_token, firebase_token_time')
          .eq('firm_user_id', firmUserId)
          .single();
        
        if (ghlData && ghlData.firebase_token) {
          const tokenTime = ghlData.firebase_token_time;
          if (tokenTime) {
            const tokenDate = new Date(tokenTime);
            const now = new Date();
            const ageInMinutes = (now.getTime() - tokenDate.getTime()) / (1000 * 60);
            
            
            // If token is fresh (less than 5 minutes old), it's been updated
            if (ageInMinutes < 5) {
              clearInterval(pollInterval);
              setPollingForToken(false);
              setTokenRefreshRequested(false);
              // Reload the page to get fresh data
              window.location.reload();
            }
          }
        }
      } catch (error) {
        console.error('❌ Error polling for token:', error);
      }
    }, 5000); // Poll every 5 seconds
    
    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingForToken(false);
      setTokenRefreshRequested(false);
    }, 300000); // 5 minutes
  };

  const checkGoogleCalendarConnection = async () => {
    // Use firebaseUserId (from token) if available, fallback to ghlUserId (from database)
    const userIdToUse = firebaseUserId || ghlUserId;
    
    if (!userIdToUse || !locationId || !firebaseToken || !accessToken) {
      return;
    }
    
    // Check if token is expired before making API call
    if (isFirebaseTokenExpired(firebaseToken)) {
      setCheckingCalendar(false);
      await refreshFirebaseToken();
      startTokenPolling();
      return;
    }
    
    setCheckingCalendar(true);
    try {
      
      const calendarUrl = `https://services.leadconnectorhq.com/calendars/connections/calendars?locationId=${locationId}&userId=${userIdToUse}`;
      
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
      
      const ghlBackendUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/allAdAccounts?limit=100`;

      const response = await fetch(ghlBackendUrl, {
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
        setFacebookAdAccounts([]);
        return;
      }
      
      const data = await response.json();
      
      const adAccounts = data.adAccounts || [];
      setFacebookAdAccounts(adAccounts);
    } catch (error: any) {
      console.error('❌ Error fetching Facebook ad accounts:', error);
      setFacebookAdAccounts([]);
    }
  };

  const fetchFacebookPagesFromGHL = async () => {
    if (!locationId || !firebaseToken || !accessToken) {
      if (!refreshingToken) {
      }
      return;
    }
    
    setFacebookLoading(true);
    try {
      
      // First, fetch connected pages
      const connectedPagesUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/pages?getAll=true`;
      const connectedResponse = await fetch(connectedPagesUrl, {
        method: 'GET',
        headers: {
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      let connectedPageIds = new Set();
      if (connectedResponse.ok) {
        const connectedData = await connectedResponse.json();
        const connectedPages = connectedData.pages || [];
        connectedPageIds = new Set(connectedPages.map((p: any) => p.facebookPageId));
      }
      
      // Then, fetch all available pages
      const allPagesUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/allPages?limit=20`;
      const allPagesResponse = await fetch(allPagesUrl, {
        method: 'GET',
        headers: {
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'accept': 'application/json'
        }
      });
      
      if (!allPagesResponse.ok) {
        setFacebookPages([]);
        return;
      }
      
      const allPagesData = await allPagesResponse.json();
      
      const pages = (allPagesData.pages || []).map((page: any) => ({
        ...page,
        isConnected: connectedPageIds.has(page.facebookPageId || page.id)
      }));
      
      setFacebookPages(pages);
    } catch (error: any) {
      console.error('❌ Error fetching Facebook pages:', error);
      if (!refreshingToken) {
        toast.error(error.message || 'Failed to fetch Facebook pages');
      }
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

  // Fetch templates from Templated.io
  const fetchTemplates = async () => {
    if (!firmUserId) return;
    
    setTemplatesLoading(true);
    setTemplatesError(null);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/templated/templates/${firmUserId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
        console.log(`✅ Loaded ${data.templates?.length || 0} templates (${data.enabledCount || 0} enabled)`);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error);
      setTemplatesError(error.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Toggle template enabled/disabled for user
  const handleToggleTemplate = async (templateId: string, enable: boolean) => {
    if (!firmUserId) {
      toast.error('User ID not available');
      return;
    }
    
    setTogglingTemplateId(templateId);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/templated/templates/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          user_id: firmUserId,
          enable: enable
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, isEnabled: enable } : t
        ));
        toast.success(`Template ${enable ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(data.message || 'Failed to update template');
      }
    } catch (error: any) {
      console.error('❌ Error toggling template:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setTogglingTemplateId(null);
    }
  };

  useEffect(() => {
    if (locationId) {
      checkGoogleCalendarConnection();
    }
  }, [locationId]);

  // Fetch templates when firmUserId is available
  useEffect(() => {
    if (firmUserId) {
      fetchTemplates();
    }
  }, [firmUserId]);

  useEffect(() => {
    // Listen for OAuth callback messages from popup
    const handleOAuthCallback = (event: MessageEvent) => {
      // Check if message is from GHL OAuth
      if (event.data?.type === 'oauth-success' || event.data === 'oauth-success') {
        // Refresh connection status after OAuth completes
        setTimeout(() => {
          checkGoogleCalendarConnection();
        }, 2000); // Wait 2 seconds for GHL to process the connection
      }
    };

    // Listen for window focus to refresh status when user returns from OAuth popup
    const handleWindowFocus = () => {
      if (locationId && pitToken) {
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

      // Query Supabase for ALL GHL integrations to display in table
      const { data: allData, error: allError } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('firm_user_id', firmUserId);

      if (allError) {
        throw new Error(allError.message);
      }

      setGhlIntegrations(allData || []);

      // Query specifically for SOL agent (Social Media) to get tokens
      // This ensures we use the correct location for social media integrations
      const { data: solData, error: solError } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('firm_user_id', firmUserId)
        .eq('agent_id', 'SOL')
        .single();

      if (solError) {
        // Fallback to first integration if SOL not found
        if (allData && allData.length > 0) {
          setLocationId(allData[0].ghl_location_id);
          setGhlUserId(allData[0].soma_ghl_user_id || null);
          setPitToken(allData[0].pit_token || null);
        }
      } else if (solData) {
        // Use SOL agent's location for social media integrations
        setLocationId(solData.ghl_location_id);
        setGhlUserId(solData.soma_ghl_user_id || null);
        setPitToken(solData.pit_token || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleAccountConnect = () => {
    const userIdToUse = firebaseUserId || ghlUserId;
    
    if (!locationId || !userIdToUse) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://api.leadconnectorhq.com/gmail/start_oauth?locationId=${locationId}&userId=${userIdToUse}`;
    
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

  const handleSlackOAuth = () => {
    if (!firmUserId || !locationId) {
      toast.error('Missing user or location information');
      return;
    }

    // Slack app client ID (get from environment or hardcode your Slack app client ID)
    const slackClientId = import.meta.env.VITE_SLACK_CLIENT_ID || '394243081714.4376892619942';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Slack bot scopes
    const botScopes = [
      'channels:manage', 'channels:read', 'channels:join',
      'chat:write', 'chat:write.customize', 'chat:write.public',
      'commands', 'files:write',
      'im:read', 'im:write',
      'mpim:read', 'mpim:write',
      'team:read',
      'users.profile:read', 'users:read', 'users:read.email',
      'workflow.steps:execute'
    ].join(',');

    // Slack user scopes
    const userScopes = [
      'channels:history', 'channels:read', 'channels:write',
      'chat:write',
      'emoji:read',
      'files:read', 'files:write',
      'groups:history', 'groups:read', 'groups:write',
      'im:read', 'im:write',
      'mpim:read', 'mpim:write',
      'reactions:read', 'reminders:write',
      'search:read', 'stars:read',
      'team:read',
      'users.profile:write', 'users:read', 'users:read.email'
    ].join(',');

    const state = encodeURIComponent(JSON.stringify({
      locationId: locationId,
      userId: firmUserId,
      type: 'slack',
      source: 'squidgy_integrations'
    }));

    // Use GHL's configured redirect URI (already set up in Slack app settings)
    const redirectUri = 'https://services.leadconnectorhq.com/appengine/slack/oauth-connect';

    const oauthParams = new URLSearchParams({
      client_id: slackClientId,
      scope: botScopes,
      user_scope: userScopes,
      redirect_uri: redirectUri,
      state: state,
      granular_bot_scope: '1',
      single_channel: '0'
    });

    const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?${oauthParams.toString()}`;
    window.open(slackOAuthUrl, 'slack-oauth', 'width=600,height=700');
  };

  const handleTeamsOAuth = () => {
    if (!firmUserId || !locationId) {
      toast.error('Missing user or location information');
      return;
    }

    // Microsoft Teams app client ID (get from environment or Azure AD app registration)
    const teamsClientId = import.meta.env.VITE_TEAMS_CLIENT_ID || 'YOUR_TEAMS_CLIENT_ID';
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    // Microsoft Teams/Graph API scopes
    const scopes = [
      'openid',
      'profile',
      'email',
      'offline_access',
      'User.Read',
      'Team.ReadBasic.All',
      'Channel.ReadBasic.All',
      'ChannelMessage.Send',
      'Chat.ReadWrite',
      'ChatMessage.Send'
    ].join(' ');

    const state = encodeURIComponent(JSON.stringify({
      locationId: locationId,
      userId: firmUserId,
      type: 'teams',
      source: 'squidgy_integrations'
    }));

    const redirectUri = `${backendUrl}/api/teams/oauth-callback`;

    const oauthParams = new URLSearchParams({
      client_id: teamsClientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: scopes,
      state: state
    });

    const teamsOAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${oauthParams.toString()}`;
    window.open(teamsOAuthUrl, 'teams-oauth', 'width=600,height=700');
  };

  const generateFacebookOAuthUrl = async () => {
    if (!firmUserId) {
      return;
    }

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
    // Facebook Ads integration disabled (causes 404)
    // Uncomment if you need Facebook Ads integration
    /*
    await Promise.all([
      fetchFacebookPagesFromGHL(),
      fetchFacebookAdAccountsFromGHL()
    ]);
    */
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

  const handleFacebookPageDisconnect = async (pageToRemove: any) => {
    if (!locationId || !firebaseToken || !accessToken) {
      toast.error('Missing required tokens');
      return;
    }

    // Confirm deletion
    const pageId = pageToRemove.facebookPageId || pageToRemove.id;
    const pageName = pageToRemove.facebookPageName || pageToRemove.name;
    if (!window.confirm(`Are you sure you want to disconnect "${pageName}"?`)) {
      return;
    }

    setFacebookLoading(true);
    try {
      
      // Get all currently connected pages except the one to remove
      const remainingPages = facebookPages
        .filter(page => {
          const currentPageId = page.facebookPageId || page.id;
          return page.isConnected && currentPageId !== pageId;
        })
        .map(page => ({
          facebookPageId: page.facebookPageId || page.id,
          facebookPageName: page.facebookPageName || page.name,
          facebookIgnoreMessages: false
        }));
      
      
      // POST updated list to GHL backend API
      const ghlBackendUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/pages`;

      const response = await fetch(ghlBackendUrl, {
        method: 'POST',
        headers: {
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER',
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          pages: remainingPages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to disconnect page: ${response.status}`);
      }

      const result = await response.json();
      
      toast.success(`Successfully disconnected ${pageName}`);
      
      // Refresh the pages list to show updated connection status
      await fetchFacebookPagesFromGHL();
      
    } catch (error: any) {
      console.error('❌ Error disconnecting page:', error);
      toast.error(error.message || 'Failed to disconnect page');
    } finally {
      setFacebookLoading(false);
    }
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
      
      // Get full page data for selected pages and format payload
      const selectedPagesData = facebookPages
        .filter(page => {
          const pageId = page.facebookPageId || page.id;
          return selectedFacebookPages.includes(pageId);
        })
        .map(page => ({
          facebookPageId: page.facebookPageId || page.id,
          facebookPageName: page.facebookPageName || page.name,
          facebookIgnoreMessages: false
        }));
      
      
      // POST to GHL backend API to connect pages
      const ghlBackendUrl = `https://backend.leadconnectorhq.com/integrations/facebook/${locationId}/pages`;

      const response = await fetch(ghlBackendUrl, {
        method: 'POST',
        headers: {
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
      
      toast.success(`Successfully connected ${selectedFacebookPages.length} Facebook page${selectedFacebookPages.length !== 1 ? 's' : ''}!`);
      
      // Refresh the pages list to show updated connection status
      await fetchFacebookPagesFromGHL();
      
      // Reset selection
      setSelectedFacebookPages([]);
      setShowFacebookPages(false);
    } catch (error: any) {
      console.error('❌ Error connecting pages:', error);
      toast.error(error.message || 'Failed to connect pages');
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleOutlookCalendarConnect = () => {
    const userIdToUse = firebaseUserId || ghlUserId;
    
    if (!locationId || !userIdToUse) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://api.leadconnectorhq.com/api/outlook/start_oauth?location_id=${locationId}&user_id=${userIdToUse}&requestedBy=${userIdToUse}`;
    
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
  const handleSocialMediaFacebookConnect = async () => {
    setSocialMediaPlatform('facebook');
    if (!firmUserId) {
      alert('Unable to connect: User ID not found. Please ensure you are logged in.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Call backend to get OAuth URL
      const response = await fetch(`${backendUrl}/api/social/facebook/start-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          agent_id: 'SOL'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate OAuth URL');
      }

      const data = await response.json();

      if (!data.success || !data.oauth_url) {
        throw new Error('Invalid response from server');
      }

      // Open OAuth URL in a centered popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        data.oauth_url,
        'FacebookSocialMediaOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (popup) {
        // Start real-time polling for account updates
        setSocialMediaPolling(true);
        setOauthWindowOpen(true);
      }

      // Declare checkPopup variable first so it can be referenced in messageHandler
      let checkPopup: NodeJS.Timeout;

      // Listen for messages from the popup (OAuth callback sends accountId via postMessage)
      const messageHandler = (event: MessageEvent) => {
        // GHL's OAuth callback sends: { actionType: "close", platform: "facebook", accountId: "...", ... }
        if (event.data && event.data.accountId && event.data.platform === 'facebook') {
          window.removeEventListener('message', messageHandler);
          clearInterval(checkPopup);
          fetchSocialMediaAccountsWithOAuthId(event.data.accountId, 'facebook');
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
        }
      };
      window.addEventListener('message', messageHandler);

      // Also check for popup closure as fallback
      checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
          // After OAuth, try to fetch OAuth connections and then accounts
          fetchSocialMediaAccounts('facebook');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error starting Facebook OAuth:', error);
      toast.error(error.message || 'Failed to start Facebook OAuth');
    }
  };

  const handleSocialMediaInstagramConnect = async () => {
    setSocialMediaPlatform('instagram');
    if (!firmUserId) {
      alert('Unable to connect: User ID not found. Please ensure you are logged in.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Call backend to get OAuth URL
      const response = await fetch(`${backendUrl}/api/social/instagram/start-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firm_user_id: firmUserId,
          agent_id: 'SOL'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate OAuth URL');
      }

      const data = await response.json();

      if (!data.success || !data.oauth_url) {
        throw new Error('Invalid response from server');
      }

      // Open OAuth URL in a centered popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        data.oauth_url,
        'InstagramSocialMediaOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (popup) {
        // Start real-time polling for account updates
        setSocialMediaPolling(true);
        setOauthWindowOpen(true);
      }

      // Declare checkPopup variable first so it can be referenced in messageHandler
      let checkPopup: NodeJS.Timeout;

      // Listen for messages from the popup (OAuth callback sends accountId via postMessage)
      const messageHandler = (event: MessageEvent) => {
        // GHL's OAuth callback sends: { actionType: "close", platform: "instagram", accountId: "...", ... }
        if (event.data && event.data.accountId && event.data.platform === 'instagram') {
          window.removeEventListener('message', messageHandler);
          clearInterval(checkPopup);
          fetchSocialMediaAccountsWithOAuthId(event.data.accountId, 'instagram');
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
        }
      };
      window.addEventListener('message', messageHandler);

      // Also check for popup closure as fallback
      checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
          // After OAuth, try to fetch OAuth connections and then accounts
          fetchSocialMediaAccounts('instagram');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error starting Instagram OAuth:', error);
      toast.error(error.message || 'Failed to start Instagram OAuth');
    }
  };

  const handleSocialMediaLinkedInConnect = async () => {
    setSocialMediaPlatform('linkedin');
    if (!locationId || !ghlUserId) {
      toast.error('Missing location ID or user ID. Please ensure GHL integration is set up.');
      return;
    }

    try {
      // Construct GHL's LinkedIn OAuth URL directly
      const oauthUrl = `https://backend.leadconnectorhq.com/social-media-posting/oauth/linkedin/start?locationId=${locationId}&userId=${ghlUserId}`;

      // Open OAuth URL in a centered popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        oauthUrl,
        'LinkedInSocialMediaOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (popup) {
        // Start real-time polling for account updates
        setSocialMediaPolling(true);
        setOauthWindowOpen(true);
      }

      // Declare checkPopup variable first so it can be referenced in messageHandler
      let checkPopup: NodeJS.Timeout;

      // Listen for messages from the popup (OAuth callback sends accountId via postMessage)
      const messageHandler = (event: MessageEvent) => {
        // GHL's OAuth callback sends: { actionType: "close", platform: "linkedin", accountId: "...", ... }
        if (event.data && event.data.accountId && event.data.platform === 'linkedin') {
          window.removeEventListener('message', messageHandler);
          clearInterval(checkPopup);
          fetchSocialMediaAccountsWithOAuthId(event.data.accountId, 'linkedin');
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
        }
      };
      window.addEventListener('message', messageHandler);

      // Also check for popup closure as fallback
      checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
          // After OAuth, try to fetch OAuth connections and then accounts
          fetchSocialMediaAccounts('linkedin');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error starting LinkedIn OAuth:', error);
      toast.error(error.message || 'Failed to start LinkedIn OAuth');
    }
  };

  // Generic handler for new social media platforms using direct GHL OAuth
  const handleSocialMediaConnect = async (platform: 'threads' | 'gbp' | 'tiktok' | 'youtube' | 'pinterest' | 'community' | 'bluesky' | 'teams' | 'slack') => {
    setSocialMediaPlatform(platform);
    if (!locationId || !ghlUserId) {
      toast.error('Missing location ID or user ID. Please ensure GHL integration is set up.');
      return;
    }

    try {
      // Construct GHL's OAuth URL directly
      const oauthUrl = `https://backend.leadconnectorhq.com/social-media-posting/oauth/${platform}/start?locationId=${locationId}&userId=${ghlUserId}`;

      // Open OAuth URL in a centered popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        oauthUrl,
        `${platform.charAt(0).toUpperCase() + platform.slice(1)}SocialMediaOAuth`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (popup) {
        setSocialMediaPolling(true);
        setOauthWindowOpen(true);
      }

      let checkPopup: NodeJS.Timeout;

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data && event.data.accountId && event.data.platform === platform) {
          window.removeEventListener('message', messageHandler);
          clearInterval(checkPopup);
          fetchSocialMediaAccountsWithOAuthId(event.data.accountId, platform);
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
        }
      };
      window.addEventListener('message', messageHandler);

      // Also check for popup closure as fallback
      checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          setSocialMediaPolling(false);
          setOauthWindowOpen(false);
          fetchSocialMediaAccounts(platform);
        }
      }, 1000);

    } catch (error: any) {
      console.error(`❌ Error starting ${platform} OAuth:`, error);
      toast.error(error.message || `Failed to start ${platform} OAuth`);
    }
  };

  const fetchConnectedSocialMediaAccounts = async () => {
    if (!locationId || !firebaseToken || !accessToken) {
      return;
    }

    try {

      // Call GHL's accounts endpoint directly to get all connected accounts
      const accountsEndpoint = `https://backend.leadconnectorhq.com/social-media-posting/${locationId}/accounts?fetchAll=true`;

      const response = await fetch(accountsEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER'
        }
      });

      if (!response.ok) {
        console.error('❌ GHL API error:', response.status);
        return;
      }

      const data = await response.json();

      if (data.success && data.results && data.results.accounts) {
        // Filter out deleted accounts and ensure each has platform field
        const allAccounts = data.results.accounts
          .filter((acc: any) => !acc.deleted)
          .map((acc: any) => ({
            ...acc,
            platform: acc.platform || 'unknown'
          }));

        setConnectedSocialMediaAccounts(allAccounts);
      } else {
        setConnectedSocialMediaAccounts([]);
      }

    } catch (error: any) {
      console.error('❌ Error fetching connected social media accounts from GHL:', error);
    }
  };

  const fetchSocialMediaAccounts = async (platform: 'facebook' | 'instagram' | 'linkedin' = 'facebook') => {
    if (!locationId || !firebaseToken || !accessToken) {
      toast.error('Missing authentication tokens. Please ensure you are logged in.');
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

        // Call GHL's accounts endpoint directly to get OAuth IDs
        const accountsEndpoint = `https://backend.leadconnectorhq.com/social-media-posting/${locationId}/accounts?fetchAll=true`;

        const response = await fetch(accountsEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${accessToken}`,
            'token-id': firebaseToken,
            'version': '2021-07-28',
            'channel': 'APP',
            'source': 'WEB_USER'
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Filter accounts by platform and get OAuth ID
          // Note: We don't filter by deleted here because we need the OAuth ID to fetch available pages/accounts
          // The OAuth connection exists even if specific pages/accounts were deleted
          if (data.success && data.results && data.results.accounts) {
            const platformAccounts = data.results.accounts.filter((acc: any) => 
              acc.platform === platform
            );


            if (platformAccounts.length > 0) {
              // Get the first OAuth ID for this platform
              const oAuthId = platformAccounts[0].oauthId;
              
              if (oAuthId) {
                await fetchSocialMediaAccountsWithOAuthId(oAuthId, platform);
                setSocialMediaLoading(false);
                return; // Stop polling
              }
            } else {
            }
          }
        } else {
          console.error(`❌ GHL API error (${response.status})`);
        }

        // If we haven't found OAuth connection yet and haven't exceeded max attempts, poll again
        if (attempts < maxAttempts) {
          setTimeout(pollForAccounts, 5000); // Poll every 5 seconds
        } else {
          toast.info(`OAuth completed. Please click "Connect ${platform === 'facebook' ? 'Facebook' : 'Instagram'}" again to see available ${platform === 'facebook' ? 'pages' : 'accounts'}.`);
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

  const fetchSocialMediaAccountsWithOAuthId = async (oAuthId: string, platform: 'facebook' | 'instagram' | 'linkedin' | 'threads' | 'gbp' | 'tiktok' | 'youtube' | 'pinterest' | 'community' | 'bluesky' | 'teams' | 'slack' = 'facebook') => {
    if (!locationId || !firebaseToken || !accessToken) {
      console.error('Missing required tokens for GHL API call');
      return;
    }

    setSocialMediaLoading(true);
    setSocialMediaPlatform(platform);
    try {

      // Call GHL's backend API directly - matching exact pattern from HAR file
      const endpoint = `https://backend.leadconnectorhq.com/social-media-posting/oauth/${locationId}/${platform}/accounts/${oAuthId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ GHL API error (${response.status}):`, errorText);
        throw new Error(`GHL API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.results) {
        // GHL returns pages in results.pages for Facebook, accounts in results.accounts for Instagram, profile in results.profile for LinkedIn
        
        // Check for non-empty arrays - empty arrays are truthy but we need items
        const items = (data.results.pages && data.results.pages.length > 0) ? data.results.pages
          : (data.results.accounts && data.results.accounts.length > 0) ? data.results.accounts
          : (data.results.profile && data.results.profile.length > 0) ? data.results.profile
          : [];
        
        if (items.length > 0) {
          setSocialMediaPages(items);
          setSocialMediaOAuthId(oAuthId);
          setShowSocialMediaPages(true);
          const itemType = platform === 'facebook' ? 'page' : platform === 'linkedin' ? 'profile' : 'account';
          toast.success(`Found ${items.length} available ${itemType}${items.length !== 1 ? 's' : ''}`);
        } else {
          const itemType = platform === 'facebook' ? 'pages' : platform === 'linkedin' ? 'profiles' : 'accounts';
          toast.info(`No ${itemType} found for this OAuth connection`);
        }
      } else {
        throw new Error('Invalid response from GHL API');
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${platform} accounts from GHL:`, error);
      toast.error(error.message || `Failed to fetch ${platform} accounts`);
    } finally {
      setSocialMediaLoading(false);
    }
  };

  const connectSocialMediaPage = async (page: any) => {
    if (!socialMediaOAuthId) {
      toast.error('Missing OAuth ID');
      return;
    }

    // For LinkedIn and all new platforms, call GHL API directly (no backend needed)
    const directGHLPlatforms = ['linkedin', 'threads', 'gbp', 'tiktok', 'youtube', 'pinterest', 'community', 'bluesky', 'teams', 'slack'];
    if (directGHLPlatforms.includes(socialMediaPlatform)) {
      if (!locationId || !firebaseToken || !accessToken) {
        toast.error('Missing authentication tokens');
        return;
      }

      setSocialMediaLoading(true);
      try {

        // Call GHL's API directly to connect account
        const endpoint = `https://backend.leadconnectorhq.com/social-media-posting/oauth/${locationId}/${socialMediaPlatform}/accounts/${socialMediaOAuthId}`;

        // Match GHL's exact POST body format
        // Map platform-specific types to GHL expected values
        let accountType = page.type || (socialMediaPlatform === 'linkedin' ? 'profile' : 'account');
        
        // Pinterest returns "PINNER" but GHL expects "profile"
        if (accountType === 'PINNER') {
          accountType = 'profile';
        }
        
        const requestBody = {
          originId: page.id,
          type: accountType,
          name: page.name,
          avatar: page.avatar,
          ...(page.urn && { urn: page.urn })
        };


        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'token-id': firebaseToken,
            'version': '2021-07-28',
            'channel': 'APP',
            'source': 'WEB_USER'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ GHL API error:', errorText);
          throw new Error(`Failed to connect account: ${response.status}`);
        }

        const data = await response.json();

        toast.success(`Connected ${page.name} successfully!`);
        
        // Refresh the accounts list
        fetchSocialMediaAccountsWithOAuthId(socialMediaOAuthId, socialMediaPlatform);
        
        // Refresh connected accounts to update the UI
        fetchConnectedSocialMediaAccounts();
        
        return;
      } catch (error: any) {
        console.error(`❌ Error connecting ${socialMediaPlatform} account:`, error);
        toast.error(error.message || `Failed to connect ${socialMediaPlatform} account`);
        setSocialMediaLoading(false);
        return;
      }
    }

    // For Facebook and Instagram, use backend endpoints
    if (!firmUserId || !socialMediaOAuthId) {
      toast.error('Missing required information');
      return;
    }

    setSocialMediaLoading(true);
    try {

      // Extract originId - ensure it's a string
      const originId = String(page.originId || page.id || '').trim();

      if (!originId) {
        throw new Error(`${socialMediaPlatform === 'facebook' ? 'Page' : 'Account'} originId is missing`);
      }


      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Use backend endpoint
      const endpoint = socialMediaPlatform === 'facebook'
        ? `${backendUrl}/api/social/facebook/connect-page`
        : `${backendUrl}/api/social/instagram/connect-account`;

      const requestBody = {
        firm_user_id: firmUserId,
        agent_id: 'SOL',
        oauth_id: socialMediaOAuthId,
        origin_id: originId,
        name: page.name || '',
        avatar: page.avatar || ''
      };


      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ API Error Response:', errorData);
        console.error('❌ Request Body:', requestBody);
        throw new Error(errorData?.detail || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Connected ${page.name} successfully!`);
        // Refresh the accounts list
        fetchSocialMediaAccountsWithOAuthId(socialMediaOAuthId, socialMediaPlatform);
        // Also refresh the connected accounts
        fetchConnectedSocialMediaAccounts();
      }
    } catch (error: any) {
      console.error(`❌ Error connecting ${socialMediaPlatform} ${socialMediaPlatform === 'facebook' ? 'page' : 'account'}:`, error);
      toast.error(error.message || `Failed to connect ${socialMediaPlatform === 'facebook' ? 'page' : 'account'}`);
    } finally {
      setSocialMediaLoading(false);
    }
  };

  const deleteSocialMediaAccount = async (account: any) => {
    if (!locationId || !firebaseToken || !accessToken || !ghlUserId) {
      toast.error('Missing authentication tokens');
      return;
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`)) {
      return;
    }

    try {

      // Call GHL's DELETE endpoint
      // Format: /social-media-posting/{locationId}/accounts/{accountId}?userId={userId}
      const endpoint = `https://backend.leadconnectorhq.com/social-media-posting/${locationId}/accounts/${account.id}?userId=${ghlUserId}`;


      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': `Bearer ${accessToken}`,
          'token-id': firebaseToken,
          'version': '2021-07-28',
          'channel': 'APP',
          'source': 'WEB_USER'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GHL API error:', errorText);
        throw new Error(`Failed to delete account: ${response.status}`);
      }

      const data = await response.json();

      toast.success(`Successfully deleted ${account.name}`);

      // Refresh the connected accounts list
      fetchConnectedSocialMediaAccounts();

    } catch (error: any) {
      console.error('❌ Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
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
        <div className="relative">
          {(refreshingToken || pollingForToken) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Refreshing authentication...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait while we update your tokens</p>
              </div>
            </div>
          )}
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
          <Card className="hover:shadow-lg transition-shadow relative">
            <CardContent className="pt-6">
              {refreshingToken && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                  <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}
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
                  <h3 className="font-semibold text-lg text-gray-900">Facebook/Instagram Ads</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your Facebook account and Instagram for ads management
                  </p>
                  {(facebookPages.length > 0 || facebookAdAccounts.length > 0) && (
                    <div className="mt-3 space-y-2">
                      <Badge variant="default" className="bg-green-500">
                        {facebookPages.length + facebookAdAccounts.length} Connected
                      </Badge>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">Ad Accounts:</p>
                        <div className="space-y-2">
                          {facebookAdAccounts.map((account) => (
                            <div key={account.id || account.adAccountId} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img 
                                src="https://techstory.in/wp-content/uploads/2023/09/Facebook_Logo_2019-1024x1024.png" 
                                alt="Facebook"
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name || account.adAccountName}</p>
                                <p className="text-xs text-gray-500">Ad Account</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">Pages:</p>
                        <div className="space-y-2">
                          {facebookPages.filter(page => page.isConnected).map((page) => {
                            const pageId = page.facebookPageId || page.id;
                            const pageName = page.facebookPageName || page.name;
                            return (
                              <div key={pageId} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                                <img 
                                  src="https://techstory.in/wp-content/uploads/2023/09/Facebook_Logo_2019-1024x1024.png" 
                                  alt="Facebook"
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{pageName}</p>
                                  <p className="text-xs text-gray-500">Facebook Page</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                  onClick={() => handleFacebookPageDisconnect(page)}
                                  disabled={facebookLoading}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    onClick={() => {
                      if (locationId && ghlUserId) {
                        const oauthUrl = `https://backend.leadconnectorhq.com/integrations/oauth/start?locationId=${locationId}&userId=${ghlUserId}&type=facebook`;
                        window.open(oauthUrl, 'facebook-oauth', 'width=600,height=700');
                      }
                    }}
                    disabled={loading || !locationId || !ghlUserId || facebookLoading}
                  >
                    {facebookLoading ? 'Loading...' : 'Add New Account'}
                  </Button>
                  {(facebookPages.length > 0 || facebookAdAccounts.length > 0) && (
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowFacebookPages(true)}
                    >
                      Manage
                    </Button>
                  )}
                </div>
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
                  <div>
                    <p className="font-semibold text-gray-800 mb-4">Select the Facebook pages you want to connect</p>
                    <div className="space-y-3">
                      {facebookPages.map((page) => {
                        const pageId = page.facebookPageId || page.id;
                        const pageName = page.facebookPageName || page.name;
                        return (
                          <div 
                            key={pageId} 
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img 
                                src="https://techstory.in/wp-content/uploads/2023/09/Facebook_Logo_2019-1024x1024.png" 
                                alt="Facebook"
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{pageName}</p>
                                  {page.isConnected ? (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      Not Connected
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {pageId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {page.isConnected ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleFacebookPageDisconnect(page)}
                                    disabled={facebookLoading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                </>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedFacebookPages.includes(pageId)}
                                  onChange={() => handleFacebookPageToggle(pageId)}
                                  className="w-4 h-4 text-purple-500 cursor-pointer"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
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
        </div>

        {/* Workspace Integrations Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Workspace Integrations</h2>
          <p className="text-sm text-gray-500 mb-6">Connect your team collaboration and communication tools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Microsoft Teams Integration */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img
                      src="https://cdn.worldvectorlogo.com/logos/microsoft-teams-1.svg"
                      alt="Microsoft Teams"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Microsoft Teams</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Microsoft Teams account for workspace collaboration and team communication
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'teams' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'teams' && !a.deleted).length} Team{connectedSocialMediaAccounts.filter(a => a.platform === 'teams' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'teams' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('teams', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Teams Workspace</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={handleTeamsOAuth}
                      disabled={loading || !locationId || !firmUserId}
                    >
                      {loading ? 'Loading...' : 'Add New Team'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'teams' && !a.deleted).length > 0 && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('teams');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Slack Integration */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg"
                      alt="Slack"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Slack</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect your Slack account for workspace collaboration and team communication
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'slack' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'slack' && !a.deleted).length} Workspace{connectedSocialMediaAccounts.filter(a => a.platform === 'slack' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'slack' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('slack', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Slack Workspace</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      onClick={handleSlackOAuth}
                      disabled={loading || !locationId || !firmUserId}
                    >
                      {loading ? 'Loading...' : 'Add New Workspace'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'slack' && !a.deleted).length > 0 && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('slack');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show modal for Teams if Teams is selected */}
            {showSocialMediaPages && socialMediaPlatform === 'teams' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Microsoft Teams Workspaces</CardTitle>
                      <CardDescription>Select Teams workspaces to connect</CardDescription>
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
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Loading Teams workspaces...</p>
                    </div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">No Teams workspaces found. Please complete OAuth first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <img
                              src={workspace.avatar || getPlaceholderAvatar('teams', workspace.name)}
                              alt={workspace.name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{workspace.name}</p>
                              <p className="text-xs text-gray-500 mt-1">ID: {workspace.id}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => connectSocialMediaPage(workspace)}
                            disabled={socialMediaLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Connect
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show manage modal for Teams */}
            {showManageModal && managePlatform === 'teams' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Microsoft Teams Integrations</CardTitle>
                      <CardDescription>View and manage all connected Teams workspaces</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts
                      .filter(a => a.platform === 'teams' && !a.deleted)
                      .map((account) => {
                        const isExpired = account.isExpired || false;
                        const expireDate = account.expire ? new Date(account.expire) : null;
                        const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <div
                            key={account.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={account.avatar || getPlaceholderAvatar('teams', account.name)}
                                alt={account.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{account.name}</p>
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Expires in {daysUntilExpire} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                                {expireDate && (
                                  <p className="text-xs text-gray-400">
                                    Expires: {expireDate.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteSocialMediaAccount(account)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show modal for Slack if Slack is selected */}
            {showSocialMediaPages && socialMediaPlatform === 'slack' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Slack Workspaces</CardTitle>
                      <CardDescription>Select Slack workspaces to connect</CardDescription>
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
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-600">Loading Slack workspaces...</p>
                    </div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">No Slack workspaces found. Please complete OAuth first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <img
                              src={workspace.avatar || getPlaceholderAvatar('slack', workspace.name)}
                              alt={workspace.name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{workspace.name}</p>
                              <p className="text-xs text-gray-500 mt-1">ID: {workspace.id}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => connectSocialMediaPage(workspace)}
                            disabled={socialMediaLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Connect
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show manage modal for Slack */}
            {showManageModal && managePlatform === 'slack' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Slack Integrations</CardTitle>
                      <CardDescription>View and manage all connected Slack workspaces</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts
                      .filter(a => a.platform === 'slack' && !a.deleted)
                      .map((account) => {
                        const isExpired = account.isExpired || false;
                        const expireDate = account.expire ? new Date(account.expire) : null;
                        const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <div
                            key={account.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={account.avatar || getPlaceholderAvatar('slack', account.name)}
                                alt={account.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{account.name}</p>
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Expires in {daysUntilExpire} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                                {expireDate && (
                                  <p className="text-xs text-gray-400">
                                    Expires: {expireDate.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteSocialMediaAccount(account)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Social Media Integrations Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Integrations</h2>
          <div className="relative">
            {(refreshingToken || pollingForToken) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Refreshing authentication...</p>
                  <p className="text-xs text-gray-500 mt-1">Please wait while we update your tokens</p>
                </div>
              </div>
            )}
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
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook' && !a.deleted).length} Page{connectedSocialMediaAccounts.filter(a => a.platform === 'facebook' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('facebook', account.name)}
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
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      onClick={handleSocialMediaFacebookConnect}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'facebook' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('facebook');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show account selection modal for Facebook social media */}
            {showSocialMediaPages && socialMediaPlatform === 'facebook' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Facebook Social Media Accounts</CardTitle>
                      <CardDescription>Select Facebook pages to connect for social media posting</CardDescription>
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
                      <p className="text-gray-500">Loading accounts...</p>
                    </div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={page.avatar || getPlaceholderAvatar('facebook', page.name)}
                              alt={page.name}
                              className="w-10 h-10 rounded-full"
                            />
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

            {/* Show manage modal for Facebook social media */}
            {showManageModal && managePlatform === 'facebook' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Facebook Integrations</CardTitle>
                      <CardDescription>View and manage all connected accounts</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts
                      .filter(a => a.platform === 'facebook' && !a.deleted)
                      .map((account) => {
                        const isExpired = account.isExpired || false;
                        const expireDate = account.expire ? new Date(account.expire) : null;
                        const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <div
                            key={account.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={account.avatar || getPlaceholderAvatar('facebook', account.name)}
                                alt={account.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{account.name}</p>
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Expires in {daysUntilExpire} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                                {expireDate && (
                                  <p className="text-xs text-gray-400">
                                    Expires: {expireDate.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSocialMediaAccount(account)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram' && !a.deleted).length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'instagram' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('instagram', account.name)}
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
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                      onClick={handleSocialMediaInstagramConnect}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'instagram' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('instagram');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show account selection modal for Instagram social media */}
            {showSocialMediaPages && socialMediaPlatform === 'instagram' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Instagram Social Media Accounts</CardTitle>
                      <CardDescription>Select Instagram accounts to connect for social media posting</CardDescription>
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
                      <p className="text-gray-500">Loading accounts...</p>
                    </div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={page.avatar || getPlaceholderAvatar('instagram', page.name)}
                              alt={page.name}
                              className="w-10 h-10 rounded-full"
                            />
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

            {/* Show manage modal for Instagram social media */}
            {showManageModal && managePlatform === 'instagram' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage Instagram Integrations</CardTitle>
                      <CardDescription>View and manage all connected accounts</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts
                      .filter(a => a.platform === 'instagram' && !a.deleted)
                      .map((account) => {
                        const isExpired = account.isExpired || false;
                        const expireDate = account.expire ? new Date(account.expire) : null;
                        const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <div
                            key={account.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={account.avatar || getPlaceholderAvatar('instagram', account.name)}
                                alt={account.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{account.name}</p>
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Expires in {daysUntilExpire} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                                {expireDate && (
                                  <p className="text-xs text-gray-400">
                                    Expires: {expireDate.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSocialMediaAccount(account)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* LinkedIn Social Media Posting */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                      alt="LinkedIn"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">LinkedIn Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect LinkedIn profiles for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'linkedin' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'linkedin' && !a.deleted).length} Profile{connectedSocialMediaAccounts.filter(a => a.platform === 'linkedin' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'linkedin' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('linkedin', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">LinkedIn Profile</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
                      onClick={handleSocialMediaLinkedInConnect}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'linkedin' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('linkedin');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show account selection modal for LinkedIn social media */}
            {showSocialMediaPages && socialMediaPlatform === 'linkedin' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>LinkedIn Social Media Accounts</CardTitle>
                      <CardDescription>Select LinkedIn profiles to connect for social media posting</CardDescription>
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
                      <p className="text-gray-500">Loading accounts...</p>
                    </div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((page) => (
                        <div
                          key={page.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={page.avatar || getPlaceholderAvatar('linkedin', page.name)}
                              alt={page.name}
                              className="w-10 h-10 rounded-full"
                            />
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

            {/* Show manage modal for LinkedIn social media */}
            {showManageModal && managePlatform === 'linkedin' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Manage LinkedIn Integrations</CardTitle>
                      <CardDescription>View and manage all connected accounts</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManageModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts
                      .filter(a => a.platform === 'linkedin' && !a.deleted)
                      .map((account) => {
                        const isExpired = account.isExpired || false;
                        const expireDate = account.expire ? new Date(account.expire) : null;
                        const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        return (
                          <div
                            key={account.id}
                            className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <img
                                src={account.avatar || getPlaceholderAvatar('linkedin', account.name)}
                                alt={account.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900">{account.name}</p>
                                  {isExpired ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Expired
                                    </Badge>
                                  ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Expires in {daysUntilExpire} days
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-500 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                                {expireDate && (
                                  <p className="text-xs text-gray-400">
                                    Expires: {expireDate.toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSocialMediaAccount(account)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Threads Social Media */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://img.freepik.com/premium-vector/threads-logo-vector-eps-svg-ai-free-download-threads-app-logotype-logo-threads-instagram-meta_691560-10895.jpg?w=1480" 
                      alt="Threads"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Threads Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect Threads accounts for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'threads' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'threads' && !a.deleted).length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'threads' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'threads' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('threads', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Threads Account</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-black to-gray-800 hover:from-gray-900 hover:to-gray-700 text-white"
                      onClick={() => handleSocialMediaConnect('threads')}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'threads' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('threads');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show modal directly after Threads card if Threads is selected */}
            {showSocialMediaPages && socialMediaPlatform === 'threads' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Threads Social Media Accounts</CardTitle>
                  <CardDescription>Select Threads accounts to connect for social media posting</CardDescription>
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
                  <p className="text-gray-500">Loading accounts...</p>
                </div>
              ) : socialMediaPages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialMediaPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={page.avatar || getPlaceholderAvatar('threads', page.name)}
                          alt={page.name}
                          className="w-10 h-10 rounded-full"
                        />
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

            {/* Show manage modal directly after Threads card if Threads is being managed */}
            {showManageModal && managePlatform === 'threads' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Threads Integrations</CardTitle>
                  <CardDescription>View and manage all connected accounts</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedSocialMediaAccounts
                  .filter(a => a.platform === 'threads' && !a.deleted)
                  .map((account) => {
                    const isExpired = account.isExpired || false;
                    const expireDate = account.expire ? new Date(account.expire) : null;
                    const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <div
                        key={account.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <img
                            src={account.avatar || getPlaceholderAvatar('threads', account.name)}
                            alt={account.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{account.name}</p>
                              {isExpired ? (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  Expires in {daysUntilExpire} days
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                            {expireDate && (
                              <p className="text-xs text-gray-400">
                                Expires: {expireDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSocialMediaAccount(account)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
              </Card>
            )}

            {/* TikTok Social Media */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://static.vecteezy.com/system/resources/previews/016/716/450/original/tiktok-icon-free-png.png" 
                      alt="TikTok"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">TikTok Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect TikTok accounts for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'tiktok' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'tiktok' && !a.deleted).length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'tiktok' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'tiktok' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('tiktok', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">TikTok Account</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-black to-pink-600 hover:from-gray-900 hover:to-pink-700 text-white"
                      onClick={() => handleSocialMediaConnect('tiktok')}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'tiktok' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('tiktok');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show modal directly after TikTok card if TikTok is selected */}
            {showSocialMediaPages && socialMediaPlatform === 'tiktok' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>TikTok Social Media Accounts</CardTitle>
                  <CardDescription>Select TikTok accounts to connect for social media posting</CardDescription>
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
                  <p className="text-gray-500">Loading accounts...</p>
                </div>
              ) : socialMediaPages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialMediaPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={page.avatar || getPlaceholderAvatar('tiktok', page.name)}
                          alt={page.name}
                          className="w-10 h-10 rounded-full"
                        />
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

            {/* Show manage modal directly after TikTok card if TikTok is being managed */}
            {showManageModal && managePlatform === 'tiktok' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage TikTok Integrations</CardTitle>
                  <CardDescription>View and manage all connected accounts</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedSocialMediaAccounts
                  .filter(a => a.platform === 'tiktok' && !a.deleted)
                  .map((account) => {
                    const isExpired = account.isExpired || false;
                    const expireDate = account.expire ? new Date(account.expire) : null;
                    const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <div
                        key={account.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <img
                            src={account.avatar || getPlaceholderAvatar('tiktok', account.name)}
                            alt={account.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{account.name}</p>
                              {isExpired ? (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  Expires in {daysUntilExpire} days
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                            {expireDate && (
                              <p className="text-xs text-gray-400">
                                Expires: {expireDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSocialMediaAccount(account)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
              </Card>
            )}

            {/* YouTube Social Media */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" 
                      alt="YouTube"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">YouTube Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect YouTube channels for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('youtube', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">YouTube Channel</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
                      onClick={() => handleSocialMediaConnect('youtube')}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('youtube');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* YouTube inline modals */}
            {showSocialMediaPages && socialMediaPlatform === 'youtube' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>YouTube Social Media Channels</CardTitle>
                      <CardDescription>Select YouTube channels to connect for social media posting</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowSocialMediaPages(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {socialMediaLoading ? (
                    <div className="text-center py-8"><p className="text-gray-500">Loading channels...</p></div>
                  ) : socialMediaPages.length === 0 ? (
                    <div className="text-center py-8"><p className="text-gray-500">No channels available.</p></div>
                  ) : (
                    <div className="space-y-3">
                      {socialMediaPages.map((page) => (
                        <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <img src={page.avatar || getPlaceholderAvatar('youtube', page.name)} alt={page.name} className="w-10 h-10 rounded-full" />
                            <div><p className="font-medium">{page.name}</p><p className="text-xs text-gray-500">ID: {page.id}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            {page.isConnected ? (
                              <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
                            ) : (
                              <Button size="sm" onClick={() => connectSocialMediaPage(page)} disabled={socialMediaLoading}>Connect</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {showManageModal && managePlatform === 'youtube' && (
              <Card className="col-span-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle>Manage YouTube Integrations</CardTitle><CardDescription>View and manage all connected channels</CardDescription></div>
                    <Button variant="ghost" size="sm" onClick={() => setShowManageModal(false)}><X className="w-4 h-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'youtube' && !a.deleted).map((account) => {
                      const isExpired = account.isExpired || false;
                      const expireDate = account.expire ? new Date(account.expire) : null;
                      const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                      return (
                        <div key={account.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start gap-3 flex-1">
                            <img src={account.avatar || getPlaceholderAvatar('youtube', account.name)} alt={account.name} className="w-12 h-12 rounded-full" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">{account.name}</p>
                                {isExpired ? <Badge variant="destructive" className="text-xs">Expired</Badge> : daysUntilExpire !== null && daysUntilExpire < 30 ? <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Expires in {daysUntilExpire} days</Badge> : <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>}
                              </div>
                              <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                              {expireDate && <p className="text-xs text-gray-400">Expires: {expireDate.toLocaleDateString()}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => deleteSocialMediaAccount(account)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pinterest Social Media */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png" 
                      alt="Pinterest"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Pinterest Social Media</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Connect Pinterest accounts for social media posting
                    </p>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'pinterest' && !a.deleted).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Badge variant="default" className="bg-green-500">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'pinterest' && !a.deleted).length} Account{connectedSocialMediaAccounts.filter(a => a.platform === 'pinterest' && !a.deleted).length !== 1 ? 's' : ''} Connected
                        </Badge>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {connectedSocialMediaAccounts.filter(a => a.platform === 'pinterest' && !a.deleted).map((account) => (
                            <div key={account.id} className="flex items-center gap-2 text-left bg-gray-50 p-2 rounded">
                              <img
                                src={account.avatar || getPlaceholderAvatar('pinterest', account.name)}
                                alt={account.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{account.name}</p>
                                <p className="text-xs text-gray-500">Pinterest Account</p>
                              </div>
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white"
                      onClick={() => handleSocialMediaConnect('pinterest')}
                      disabled={loading || !locationId || !ghlUserId || socialMediaLoading}
                    >
                      {socialMediaLoading ? 'Loading...' : 'Add New Account'}
                    </Button>
                    {connectedSocialMediaAccounts.filter(a => a.platform === 'pinterest' && !a.deleted).length > 0 && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setManagePlatform('pinterest');
                          setShowManageModal(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                  {!loading && (!locationId || !ghlUserId) && (
                    <p className="text-xs text-red-500">
                      Please set up a GHL subaccount first
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show modal directly after Pinterest card if Pinterest is selected */}
            {showSocialMediaPages && socialMediaPlatform === 'pinterest' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pinterest Social Media Accounts</CardTitle>
                  <CardDescription>Select Pinterest accounts to connect for social media posting</CardDescription>
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
                  <p className="text-gray-500">Loading accounts...</p>
                </div>
              ) : socialMediaPages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No accounts available. Please complete OAuth first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {socialMediaPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={page.avatar || getPlaceholderAvatar('pinterest', page.name)}
                          alt={page.name}
                          className="w-10 h-10 rounded-full"
                        />
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

            {/* Show manage modal directly after Pinterest card if Pinterest is being managed */}
            {showManageModal && managePlatform === 'pinterest' && (
              <Card className="col-span-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Pinterest Integrations</CardTitle>
                  <CardDescription>View and manage all connected accounts</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedSocialMediaAccounts
                  .filter(a => a.platform === 'pinterest' && !a.deleted)
                  .map((account) => {
                    const isExpired = account.isExpired || false;
                    const expireDate = account.expire ? new Date(account.expire) : null;
                    const daysUntilExpire = expireDate ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                    return (
                      <div
                        key={account.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <img
                            src={account.avatar || getPlaceholderAvatar('pinterest', account.name)}
                            alt={account.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{account.name}</p>
                              {isExpired ? (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              ) : daysUntilExpire !== null && daysUntilExpire < 30 ? (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  Expires in {daysUntilExpire} days
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">ID: {account.id}</p>
                            {expireDate && (
                              <p className="text-xs text-gray-400">
                                Expires: {expireDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteSocialMediaAccount(account)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
              </Card>
            )}

            </div>
          </div>
        </div>

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
