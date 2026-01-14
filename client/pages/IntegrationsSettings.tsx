import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { supabase } from '../lib/supabase';

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
  const [checkingCalendar, setCheckingCalendar] = useState<boolean>(false);

  useEffect(() => {
    fetchGHLIntegrations();
  }, [user]);

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
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Query Supabase directly for GHL integrations using firm_user_id
      const { data, error: supabaseError } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('firm_user_id', user.id);
      
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

  const checkGoogleCalendarConnection = async () => {
    if (!locationId || !pitToken) return;
    
    try {
      setCheckingCalendar(true);
      const response = await fetch(`https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`, {
        headers: {
          'Authorization': `Bearer ${pitToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if Google Calendar is in the social media accounts
        const hasGoogleCalendar = data.accounts?.some((account: any) => 
          account.type === 'google_calendar' || account.provider === 'google' || account.name?.toLowerCase().includes('google')
        ) || false;
        setGoogleCalendarConnected(hasGoogleCalendar);
      }
    } catch (err) {
      console.error('Failed to check Google Calendar connection:', err);
      setGoogleCalendarConnected(false);
    } finally {
      setCheckingCalendar(false);
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

  const handleFacebookInstagramConnect = async () => {
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    try {
      // Show loading state
      setCheckingCalendar(true);
      console.log('[OAUTH] 🚀 Initiating admin automation to get OAuth URL...');
      
      // Call backend to automate admin login and get OAuth URL
      const response = await fetch('http://localhost:8000/api/ghl/oauth/facebook/get-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location_id: locationId,
          user_id: ghlUserId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get OAuth URL from automation');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.oauth_url) {
        throw new Error(result.message || 'Failed to capture OAuth URL');
      }
      
      console.log('[OAUTH] ✅ OAuth URL captured, opening popup for user...');
      const oauthUrl = result.oauth_url;
      
      // Open in a centered popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        oauthUrl,
        'FacebookInstagramOAuth',
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
    } catch (error) {
      console.error('[OAUTH] ❌ Error during OAuth automation:', error);
      alert(`Failed to initiate OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCheckingCalendar(false);
    }
  };

  const handleOutlookCalendarConnect = () => {
    if (!locationId || !ghlUserId) {
      alert('Unable to connect: Location ID or User ID not found. Please ensure you have a GHL subaccount set up.');
      return;
    }
    
    const oauthUrl = `https://api.leadconnectorhq.com/outlook/start_oauth?locationId=${locationId}&userId=${ghlUserId}`;
    
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
                  <p className="text-sm text-gray-500 mt-1">
                    {googleCalendarConnected 
                      ? 'Your Google Calendar is connected and syncing'
                      : 'Connect your Google Calendar to sync events and appointments'
                    }
                  </p>
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
                <div className="w-20 h-20 mx-auto rounded-lg flex overflow-hidden">
                  {/* Split logo: Half Facebook (blue), Half Instagram (gradient) */}
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
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Facebook / Instagram</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your Facebook account and Instagram for social media management
                  </p>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white"
                  onClick={handleFacebookInstagramConnect}
                  disabled={loading || !locationId || !ghlUserId}
                >
                  {loading ? 'Loading...' : 'Connect'}
                </Button>
                {!loading && (!locationId || !ghlUserId) && (
                  <p className="text-xs text-red-500">
                    Please set up a GHL subaccount first
                  </p>
                )}
                {(!loading && locationId && ghlUserId) && (
                  <p className="text-xs text-gray-400">
                    Connect your Instagram account with a Facebook Page
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Outlook Calendar Integration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                  <img 
                    src="https://img.icons8.com/color/480/outlook-calendar.png" 
                    alt="Outlook Calendar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Outlook Calendar</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Connect your Outlook Calendar to sync events and appointments
                  </p>
                </div>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleOutlookCalendarConnect}
                  disabled={loading || !locationId || !ghlUserId}
                >
                  {loading ? 'Loading...' : 'Connect Outlook Calendar'}
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

        {/* Coming Soon Section */}
        <Card className="border-dashed">
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
