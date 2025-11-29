import { useState, useEffect } from 'react';
import { Calendar, ExternalLink, Check, AlertCircle, Settings, Trash2 } from 'lucide-react';
import { googleCalendarService } from '../lib/googleCalendar';
import { toast } from 'sonner';

interface GoogleCalendarIntegrationProps {
  onIntegrationChange?: (isConnected: boolean) => void;
}

export function GoogleCalendarIntegration({ onIntegrationChange }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeZone, setTimeZone] = useState('America/New_York');

  useEffect(() => {
    // Check if already connected
    const connected = googleCalendarService.isAuthenticated();
    setIsConnected(connected);
    onIntegrationChange?.(connected);

    // Handle OAuth callback if present
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'google_calendar_auth') {
      handleAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onIntegrationChange]);

  const handleAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      const success = await googleCalendarService.handleAuthCallback(code);
      if (success) {
        setIsConnected(true);
        onIntegrationChange?.(true);
        toast.success('Successfully connected to Google Calendar!');
      } else {
        toast.error('Failed to connect to Google Calendar');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      toast.error('Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    const authUrl = googleCalendarService.getAuthUrl();
    // Add state parameter to track this flow
    const urlWithState = `${authUrl}&state=google_calendar_auth`;
    window.location.href = urlWithState;
  };

  const handleDisconnect = () => {
    googleCalendarService.disconnect();
    setIsConnected(false);
    onIntegrationChange?.(false);
    toast.success('Disconnected from Google Calendar');
  };

  const handleTimeZoneChange = (newTimeZone: string) => {
    setTimeZone(newTimeZone);
    googleCalendarService.setTimeZone(newTimeZone);
    toast.success('Time zone updated');
  };

  const commonTimeZones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'British Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  ];

  if (!isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Google Calendar
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sync appointments directly with your Google Calendar. This allows automatic scheduling, 
              real-time availability checking, and seamless calendar management.
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Automatic appointment creation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Real-time availability checking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Meeting link generation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Automatic reminders and notifications</span>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Connect to Google Calendar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Google Calendar Connected
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your calendar is successfully connected. Appointments will be automatically 
              created and managed in your Google Calendar.
            </p>

            {showSettings && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Calendar Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => handleTimeZoneChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {commonTimeZones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-amber-800 font-medium mb-1">
                          Calendar Access
                        </p>
                        <p className="text-xs text-amber-700">
                          We can read your calendar availability and create new events. 
                          We cannot access or modify your existing personal events.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showSettings ? 'Hide Settings' : 'Settings'}
              </button>
              
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}