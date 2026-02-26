import { toast } from "sonner";
import {
  profilesApi,
  calendarSetupApi,
  chatHistoryApi,
  websiteAnalysisApi,
  facebookIntegrationsApi,
  ghlSubaccountsApi,
  notificationPreferencesApi,
  solarSetupApi,
  businessDetailsApi
} from './supabase-api';

// API client for Squidgy backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Authentication interfaces
interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
  termsAccepted?: boolean;
  aiProcessingConsent?: boolean;
  marketingConsent?: boolean;
  termsViewed?: boolean;
  termsScrolledToBottom?: boolean;
  privacyViewed?: boolean;
  privacyScrolledToBottom?: boolean;
}

interface SignInData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

interface AuthResponse {
  user: any;
  profile?: any;
  needsEmailConfirmation?: boolean;
  message?: string;
  detail?: string;
}

// Website Analysis Response Types
interface WebsiteAnalysisResponse {
  company_description?: string;
  value_proposition?: string;
  business_niche?: string;
  tags?: string[];
  screenshot_url?: string;
  favicon_url?: string;
}

// Error handling utility
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    const errorMessage = error.detail || error.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

// Generic API client
export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleApiResponse<T>(response);
    } catch (error) {
      toast.error(`GET ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleApiResponse<T>(response);
    } catch (error) {
      toast.error(`POST ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleApiResponse<T>(response);
    } catch (error) {
      toast.error(`PUT ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return handleApiResponse<T>(response);
    } catch (error) {
      toast.error(`DELETE ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },
};

// Website Analysis APIs
export const websiteApi = {
  analyzeWebsite: async (data: { url: string; user_id: string; session_id: string }): Promise<WebsiteAnalysisResponse> => {
    try {
      const result = await apiClient.post<WebsiteAnalysisResponse>('/api/website/full-analysis', data);
      return result;
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('Website analysis API error:', error);
      
      // Check if it's a network/server error
      if (error.response) {
        throw new Error(`Analysis failed: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network error: Could not connect to analysis service');
      } else {
        throw new Error(`Analysis error: ${error.message}`);
      }
    }
  },
  
  captureScreenshot: async (data: { url: string; user_id: string }) => {
    return apiClient.post('/api/website/screenshot', data);
  },
  
  getFavicon: async (data: { url: string }) => {
    return apiClient.post('/api/website/favicon', data);
  },
};


// Business Details APIs
export const businessApi = {
  saveBusinessDetails: async (data: {
    user_id: string;
    agent_id: string;
    business_data: any;
  }) => {
    return apiClient.post('/api/business/details', data);
  },
  
  getBusinessDetails: async (userId: string, agentId: string) => {
    return apiClient.get(`/api/business/details/${userId}/${agentId}`);
  },
};

// Solar Setup APIs
export const solarApi = {
  saveSolarSetup: async (data: {
    user_id: string;
    agent_id: string;
    solar_data: any;
  }) => {
    return apiClient.post('/api/solar/setup', data);
  },
  
  getSolarSetup: async (userId: string, agentId: string) => {
    return apiClient.get(`/api/solar/setup/${userId}/${agentId}`);
  },
};

// Calendar APIs
export const calendarApi = {
  saveCalendarSetup: async (data: {
    user_id: string;
    agent_id: string;
    calendar_data: any;
  }) => {
    return apiClient.post('/api/calendar/setup', data);
  },
  
  getCalendarSetup: async (userId: string, agentId: string) => {
    return apiClient.get(`/api/calendar/setup/${userId}/${agentId}`);
  },
};

// Notification APIs
export const notificationApi = {
  saveNotificationPreferences: async (data: {
    user_id: string;
    agent_id: string;
    notification_data: any;
  }) => {
    return apiClient.post('/api/notifications/preferences', data);
  },
  
  getNotificationPreferences: async (userId: string, agentId: string) => {
    return apiClient.get(`/api/notifications/preferences/${userId}/${agentId}`);
  },
};

// Solar Setup API
interface SolarSetupData {
  firm_user_id: string;
  agent_id: string;
  installation_price: number;
  dealer_fee: number;
  broker_fee: number;
  allow_financed: boolean;
  allow_cash: boolean;
  financing_apr: number;
  financing_term: number;
  energy_price: number;
  yearly_electric_cost_increase: number;
  installation_lifespan: number;
  typical_panel_count: number;
  max_roof_segments: number;
  solar_incentive: number;
  property_type: string;
  setup_status?: string;
}

export const saveSolarSetup = async (data: SolarSetupData): Promise<{ success: boolean; message: string }> => {
  try {
    
    // First, let's check if this user exists in profiles table (same logic as other saves)
    const { data: profileCheck, error: profileError } = await profilesApi.getByUserId(data.firm_user_id);
    
    if (profileError || !profileCheck) {
      console.error('Profile not found for user_id:', data.firm_user_id, profileError);
      
      // Try checking by id instead
      const { data: profileById, error: profileByIdError } = await profilesApi.getById(data.firm_user_id);
        
      if (profileByIdError || !profileById) {
        console.error('Profile not found by id either:', data.firm_user_id, profileByIdError);
        throw new Error('User profile not found. Please ensure you are logged in properly.');
      } else {
        // Use the user_id from the found profile
        data.firm_user_id = profileById.user_id;
      }
    } else {
    }
    
    // Fetch GHL data from ghl_subaccounts table  
    const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(data.firm_user_id);
    const ghlData = Array.isArray(ghlDataArray) ? ghlDataArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    if (ghlData) {
    } else {
    }
    
    // Check if record exists for UPSERT logic
    const { data: existingRecordArray } = await solarSetupApi.getByUserId(data.firm_user_id);
    const existingRecord = Array.isArray(existingRecordArray) ? existingRecordArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    // Generate UUID for new records
    const recordId = existingRecord?.id || crypto.randomUUID();
    const createdAt = existingRecord?.created_at || new Date().toISOString();
    
    if (existingRecord?.id) {
    } else {
    }
    
    // Create setup_json object with proper formatting
    const setupJson = {
      brokerFee: data.broker_fee || 0,
      financingApr: (data.financing_apr || 5) / 100, // Convert percentage to decimal
      maxRoofSegments: data.max_roof_segments || 4,
      dealerFeePercent: (data.dealer_fee || 15) / 100, // Convert percentage to decimal
      energyPricePerKwh: data.energy_price || 0.17,
      typicalPanelCount: data.typical_panel_count || 40,
      cashPurchaseEnabled: data.allow_cash ?? true,
      financingTermMonths: data.financing_term || 240,
      solarIncentivePercent: (data.solar_incentive || 3) / 100, // Convert percentage to decimal
      financedPurchaseEnabled: data.allow_financed ?? true,
      installationPricePerWatt: data.installation_price || 2,
      installationLifespanYears: data.installation_lifespan || 20,
      yearlyElectricCostIncreasePercent: (data.yearly_electric_cost_increase || 4) / 100, // Convert percentage to decimal
      propertyType: data.property_type || 'Residential'
    };

    // Prepare data for database insert (keeping both individual columns and setup_json)
    const insertData: any = {
      id: recordId, // Add UUID
      firm_user_id: data.firm_user_id,
      agent_id: data.agent_id || 'SOL',
      installation_price: data.installation_price,
      dealer_fee: data.dealer_fee,
      broker_fee: data.broker_fee,
      allow_financed: data.allow_financed,
      allow_cash: data.allow_cash,
      financing_apr: data.financing_apr,
      financing_term: data.financing_term,
      energy_price: data.energy_price,
      yearly_electric_cost_increase: data.yearly_electric_cost_increase,
      installation_lifespan: data.installation_lifespan,
      typical_panel_count: data.typical_panel_count,
      max_roof_segments: data.max_roof_segments,
      solar_incentive: data.solar_incentive,
      property_type: data.property_type,
      setup_status: data.setup_status || 'completed',
      setup_json: setupJson, // Add the JSON configuration
      created_at: createdAt, // Add creation timestamp
      last_updated_timestamp: new Date().toISOString() // Add update timestamp
    };
    
    // Add GHL fields if available
    if (ghlData) {
      insertData.ghl_location_id = ghlData.ghl_location_id;
      insertData.ghl_user_id = ghlData.soma_ghl_user_id;
    }


    // Use UPDATE for existing records, INSERT for new records
    let result, error;
    if (existingRecord?.id) {
      ({ data: result, error } = await solarSetupApi.updateById(existingRecord.id, insertData));
    } else {
      ({ data: result, error } = await solarSetupApi.create(insertData));
    }

    if (error) {
      console.error('Supabase solar setup upsert error:', error);
      throw new Error(`Failed to save solar setup: ${error.message}`);
    }


    return {
      success: true,
      message: 'Solar setup saved successfully'
    };
  } catch (error) {
    console.error('Save solar setup error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save solar setup');
  }
};

// Calendar Setup API
interface CalendarSetupData {
  firm_user_id: string;
  agent_id: string;
  calendar_name: string;
  description?: string;
  call_duration: number;
  max_calls_per_day: number;
  notice_hours: number;
  book_ahead_days: number;
  auto_confirm: boolean;
  allow_rescheduling: boolean;
  allow_cancellations: boolean;
  business_hours: Record<string, { enabled: boolean; start: string; end: string }>;
  setup_status?: string;
}

export const saveCalendarSetup = async (data: CalendarSetupData): Promise<{ success: boolean; message: string }> => {
  try {
    
    // First, let's check if this user exists in profiles table (same logic as other saves)
    const { data: profileCheck, error: profileError } = await profilesApi.getByUserId(data.firm_user_id);
    
    if (profileError || !profileCheck) {
      console.error('Profile not found for user_id:', data.firm_user_id, profileError);
      
      // Try checking by id instead
      const { data: profileById, error: profileByIdError } = await profilesApi.getById(data.firm_user_id);
        
      if (profileByIdError || !profileById) {
        console.error('Profile not found by id either:', data.firm_user_id, profileByIdError);
        throw new Error('User profile not found. Please ensure you are logged in properly.');
      } else {
        // Use the user_id from the found profile
        data.firm_user_id = profileById.user_id;
      }
    } else {
    }
    
    // Fetch GHL data from ghl_subaccounts table
    const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(data.firm_user_id);
    const ghlData = Array.isArray(ghlDataArray) ? ghlDataArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;

    if (ghlData) {
    } else {
    }

    // Check if record exists for UPDATE/INSERT logic
    const { data: existingRecordArray } = await calendarSetupApi.getByUserId(data.firm_user_id);
    const existingRecord = Array.isArray(existingRecordArray) ? existingRecordArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    // Generate UUID for new records
    const recordId = existingRecord?.id || crypto.randomUUID();
    const createdAt = existingRecord?.created_at || new Date().toISOString();
    
    if (existingRecord?.id) {
    } else {
    }

    // Prepare data for database operation
    const insertData = {
      id: recordId,
      firm_user_id: data.firm_user_id,
      agent_id: data.agent_id || 'SOL',
      calendar_name: data.calendar_name,
      description: data.description || null,
      call_duration: data.call_duration,
      max_calls_per_day: data.max_calls_per_day,
      notice_hours: data.notice_hours,
      book_ahead_days: data.book_ahead_days,
      auto_confirm: data.auto_confirm,
      allow_rescheduling: data.allow_rescheduling,
      allow_cancellations: data.allow_cancellations,
      business_hours: data.business_hours,
      setup_status: data.setup_status || 'completed',
      created_at: createdAt,
      last_updated_timestamp: new Date().toISOString(),
      ...(ghlData && {
        ghl_location_id: ghlData.ghl_location_id,
        ghl_user_id: ghlData.soma_ghl_user_id
      })
    };


    // Use UPDATE for existing records, INSERT for new records
    let result, error;
    if (existingRecord?.id) {
      ({ data: result, error } = await calendarSetupApi.updateById(existingRecord.id, insertData));
    } else {
      ({ data: result, error } = await calendarSetupApi.create(insertData));
    }

    if (error) {
      console.error('Supabase calendar setup upsert error:', error);
      throw new Error(`Failed to save calendar setup: ${error.message}`);
    }


    return {
      success: true,
      message: 'Calendar setup saved successfully'
    };
  } catch (error) {
    console.error('Save calendar setup error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save calendar setup');
  }
};

// Notification Preferences API
interface NotificationPreferencesData {
  firm_user_id: string;
  agent_id: string;
  email_enabled: boolean;
  messenger_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  ghl_enabled: boolean;
  notification_email: string;
  appointment_confirmations: boolean;
  appointment_reminders: boolean;
  cancellations_reschedules: boolean;
  setup_status?: string;
}

export const saveNotificationPreferences = async (data: NotificationPreferencesData): Promise<{ success: boolean; message: string }> => {
  try {
    
    // First, let's check if this user exists in profiles table (same logic as other saves)
    const { data: profileCheck, error: profileError } = await profilesApi.getByUserId(data.firm_user_id);
    
    if (profileError || !profileCheck) {
      console.error('Profile not found for user_id:', data.firm_user_id, profileError);
      
      // Try checking by id instead
      const { data: profileById, error: profileByIdError } = await profilesApi.getById(data.firm_user_id);
        
      if (profileByIdError || !profileById) {
        console.error('Profile not found by id either:', data.firm_user_id, profileByIdError);
        throw new Error('User profile not found. Please ensure you are logged in properly.');
      } else {
        // Use the user_id from the found profile
        data.firm_user_id = profileById.user_id;
      }
    } else {
    }
    
    // Fetch GHL data from ghl_subaccounts table
    const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(data.firm_user_id);
    const ghlData = Array.isArray(ghlDataArray) ? ghlDataArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;

    if (ghlData) {
    } else {
    }

    // Check if record exists for UPDATE/INSERT logic
    const { data: existingRecordArray } = await notificationPreferencesApi.getByUserId(data.firm_user_id);
    const existingRecord = Array.isArray(existingRecordArray) ? existingRecordArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    // Generate UUID for new records
    const recordId = existingRecord?.id || crypto.randomUUID();
    const createdAt = existingRecord?.created_at || new Date().toISOString();
    
    if (existingRecord?.id) {
    } else {
    }

    // Prepare data for database operation
    const insertData = {
      id: recordId,
      firm_user_id: data.firm_user_id,
      agent_id: data.agent_id || 'SOL',
      email_enabled: data.email_enabled,
      messenger_enabled: data.messenger_enabled,
      sms_enabled: data.sms_enabled,
      whatsapp_enabled: data.whatsapp_enabled,
      ghl_enabled: data.ghl_enabled,
      notification_email: data.notification_email,
      appointment_confirmations: data.appointment_confirmations,
      appointment_reminders: data.appointment_reminders,
      cancellations_reschedules: data.cancellations_reschedules,
      setup_status: data.setup_status || 'completed',
      created_at: createdAt,
      last_updated_timestamp: new Date().toISOString(),
      ...(ghlData && {
        ghl_location_id: ghlData.ghl_location_id,
        ghl_user_id: ghlData.soma_ghl_user_id
      })
    };


    // Use UPDATE for existing records, INSERT for new records
    let result, error;
    if (existingRecord?.id) {
      ({ data: result, error } = await notificationPreferencesApi.updateById(existingRecord.id, insertData));
    } else {
      ({ data: result, error } = await notificationPreferencesApi.create(insertData));
    }

    if (error) {
      console.error('Supabase notification preferences upsert error:', error);
      throw new Error(`Failed to save notification preferences: ${error.message}`);
    }


    return {
      success: true,
      message: 'Notification preferences saved successfully'
    };
  } catch (error) {
    console.error('Save notification preferences error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save notification preferences');
  }
};

// Facebook Integration APIs
export const facebookApi = {
  connectFacebook: async (data: {
    user_id: string;
    agent_id: string;
    facebook_data: any;
  }) => {
    return apiClient.post('/api/facebook/connect', data);
  },
  
  getFacebookConnection: async (userId: string, agentId: string) => {
    return apiClient.get(`/api/facebook/connection/${userId}/${agentId}`);
  },

  // Get Facebook connection status for step completion check
  getFacebookConnectionStatus: async (firmUserId: string) => {
    const response = await fetch(`${BACKEND_URL}/api/facebook/get-connection-status?firm_user_id=${firmUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

// Authentication API endpoints - now using Supabase client-side authentication
import { authService } from './auth-service';

export const signUp = async (userData: SignUpData): Promise<AuthResponse> => {
  return authService.signUp(userData);
};

export const signIn = async (credentials: SignInData): Promise<AuthResponse> => {
  return authService.signIn(credentials);
};

export const sendPasswordResetEmail = async (data: ForgotPasswordData): Promise<{ message: string }> => {
  return authService.sendPasswordResetEmail(data);
};

export const resetPassword = async (data: ResetPasswordData): Promise<{ message: string }> => {
  return authService.resetPassword(data);
};

export const signOut = async (): Promise<void> => {
  return authService.signOut();
};

export const getCurrentUser = async (): Promise<{ user: any; profile: any | null }> => {
  return authService.getCurrentUser();
};

// Check PIT token status WITHOUT triggering any automation
// Used for social media agent to verify setup status only
export const checkPitTokenStatus = async (firmUserId: string): Promise<{ 
  hasPitToken: boolean; 
  error?: string;
}> => {
  try {
    // Check ghl_subaccounts for pit_token
    const { data: ghlDataArray, error } = await ghlSubaccountsApi.getByUserId(firmUserId);
    
    if (error) {
      console.error('[PIT CHECK] Error checking GHL subaccounts:', error);
      return { hasPitToken: false, error: error.message };
    }
    
    // Find the SOL agent record (default agent)
    const ghlData = Array.isArray(ghlDataArray) 
      ? ghlDataArray.find(item => item.agent_id === 'SOL') 
      : null;
    
    // If no GHL record exists, PIT token doesn't exist
    if (!ghlData) {
      console.log('[PIT CHECK] No GHL subaccount found - no PIT token');
      return { hasPitToken: false };
    }
    
    // Check if pit_token exists
    const hasPitToken = !!ghlData.pit_token;
    console.log(`[PIT CHECK] PIT token status: ${hasPitToken ? 'exists' : 'missing'}`);
    
    return { hasPitToken };
  } catch (error) {
    console.error('[PIT CHECK] Error:', error);
    return { 
      hasPitToken: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// GHL Onboarding Check - Check if pit_token exists, trigger retry if missing
// ONLY for existing users - does NOT run for newly registered users
export const checkAndTriggerGhlOnboarding = async (firmUserId: string): Promise<{ 
  hasPitToken: boolean; 
  triggered: boolean;
  error?: string;
}> => {
  try {
    // Check ghl_subaccounts for pit_token
    const { data: ghlDataArray, error } = await ghlSubaccountsApi.getByUserId(firmUserId);
    
    if (error) {
      console.error('[GHL CHECK] Error checking GHL subaccounts:', error);
      return { hasPitToken: false, triggered: false, error: error.message };
    }
    
    // Find the SOL agent record (default agent)
    const ghlData = Array.isArray(ghlDataArray) 
      ? ghlDataArray.find(item => item.agent_id === 'SOL') 
      : null;
    
    // If no GHL record exists = NEW USER - initiate automation immediately
    if (!ghlData) {
      console.log('[GHL CHECK] No GHL subaccount found - new user, initiating automation...');
      
      // Get user profile to get actual email and name
      try {
        // Get user profile first to have the correct email
        const { data: profile } = await profilesApi.getByUserId(firmUserId);
        
        if (!profile || !profile.email) {
          console.error('[GHL CHECK] No user profile found or missing email');
          return { hasPitToken: false, triggered: false, error: 'User profile not found' };
        }
        
        // Trigger automation for new user using registration endpoint
        const response = await fetch(`${BACKEND_URL}/api/ghl/create-subaccount-and-user-registration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            full_name: profile.full_name || 'Solar User',
            email: profile.email,
            phone: profile.phone || '+17166044029',
            address: profile.address || '456 Solar Demo Avenue',
            city: profile.city || 'Buffalo',
            state: profile.state || 'NY',
            country: profile.country || 'US',
            postal_code: profile.postal_code || '14201',
            website: profile.website || 'https://example.com'
          })
        });
        
        if (response.ok) {
          console.log('[GHL CHECK] New user automation triggered successfully');
          return { hasPitToken: false, triggered: true };
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[GHL CHECK] Failed to trigger new user automation:', errorData);
          return { hasPitToken: false, triggered: false, error: errorData.detail || 'Failed to trigger automation' };
        }
      } catch (error) {
        console.error('[GHL CHECK] Error triggering new user automation:', error);
        return { hasPitToken: false, triggered: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    // Record exists = EXISTING USER - proceed with pit_token check
    console.log('[GHL CHECK] GHL subaccount exists - checking pit_token for existing user');
    
    // Check automation status - don't trigger if already running or pending
    const automationStatus = ghlData.automation_status;
    const creationStatus = ghlData.creation_status;
    const updatedAt = ghlData.updated_at;
    
    // Check if automation is stuck (running for more than 1 minute for local dev, 10 for production)
    const stuckThresholdMinutes = 1; // Changed from 10 to 1 for faster local testing
    let isStuck = false;
    if ((automationStatus === 'running' || automationStatus === 'pit_running' || automationStatus === 'token_refresh_running') && updatedAt) {
      const updatedTime = new Date(updatedAt);
      const currentTime = new Date();
      const minutesRunning = (currentTime.getTime() - updatedTime.getTime()) / (1000 * 60);
      
      if (minutesRunning > stuckThresholdMinutes) {
        console.log(`[GHL CHECK] Automation stuck in '${automationStatus}' for ${minutesRunning.toFixed(1)} minutes - will retry`);
        isStuck = true;
      }
    }
    
    // Skip if automation is actively running (not stuck) or pending creation
    if (!isStuck && (automationStatus === 'running' || automationStatus === 'pit_running' || 
        automationStatus === 'token_refresh_running' || 
        creationStatus === 'pending' || creationStatus === 'creating')) {
      console.log(`[GHL CHECK] Automation already in progress (creation: ${creationStatus}, automation: ${automationStatus}) - skipping`);
      return { hasPitToken: false, triggered: false };
    }
    
    // Check if pit_token exists (only check pit_token, not access_token)
    const hasPitToken = !!ghlData.pit_token;
    
    // CRITICAL: If automation is stuck, retry regardless of token presence
    // Otherwise, only trigger retry if pit_token is missing OR status is empty/null
    const shouldRetry = ghlData.ghl_location_id && (
      // Case 1: Automation is stuck (force retry even if token exists)
      isStuck ||
      // Case 2: Status is empty/null/undefined (incomplete setup)
      (!automationStatus || automationStatus === '') ||
      // Case 3: Creation failed and automation not started (needs retry)
      (creationStatus === 'failed' && automationStatus === 'not_started') ||
      // Case 4: No token AND (failed status OR completed without proper token)
      (!hasPitToken && (
        automationStatus === 'failed' || 
        automationStatus === 'pit_failed' || 
        automationStatus === 'token_capture_failed' || 
        automationStatus === 'completed'
      ))
    );
    
    if (shouldRetry) {
      const reason = isStuck 
        ? 'Automation stuck - forcing retry' 
        : (!automationStatus || automationStatus === '')
          ? 'Automation status empty - incomplete setup'
          : (creationStatus === 'failed' && automationStatus === 'not_started')
            ? 'Creation failed and automation not started - retrying'
            : 'PIT token missing for existing user';
      console.log(`[GHL CHECK] ${reason} - triggering retry automation...`);
      
      // Trigger retry automation endpoint
      const response = await fetch(`${BACKEND_URL}/api/ghl/retry-automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_user_id: firmUserId })
      });
      
      if (response.ok) {
        console.log('[GHL CHECK] Retry automation triggered successfully');
        return { hasPitToken, triggered: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[GHL CHECK] Failed to trigger retry automation:', errorData);
        return { hasPitToken, triggered: false, error: errorData.detail || 'Failed to trigger automation' };
      }
    }
    
    console.log(`[GHL CHECK] No action needed (hasPitToken: ${hasPitToken}, status: ${automationStatus})`);
    return { hasPitToken, triggered: false };
  } catch (error) {
    console.error('[GHL CHECK] Error:', error);
    return { 
      hasPitToken: false, 
      triggered: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// N8N Webhook API
interface N8NWebhookRequest {
  user_id: string;
  user_mssg: string;
  session_id: string;
  agent_name: string;
  timestamp_of_call_made: string;
  request_id: string;
}

interface N8NWebhookResponse {
  user_id: string;
  session_id: string;
  agent_name: string;
  timestamp_of_call_made: string;
  request_id: string;
  agent_response: string;
}

export const callN8NWebhook = async (data: N8NWebhookRequest): Promise<N8NWebhookResponse> => {
  try {
    // Use the N8N webhook URL from environment variables
    const n8nUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('N8N webhook error:', error);
    throw new Error(error instanceof Error ? error.message : 'N8N webhook failed');
  }
};

// Get existing website analysis data
export const getWebsiteAnalysis = async (userId: string, agentId: string = 'SOL'): Promise<any> => {
  try {
    
    // Use firm_user_id field for website_analysis table  
    const { data: dataArray, error } = await websiteAnalysisApi.getByUserId(userId);
    const data = Array.isArray(dataArray) ? dataArray.find(item => item.agent_id === agentId) : null;
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching website analysis:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Get website analysis error:', error);
    return null;
  }
};

// Get existing business details data
export const getBusinessDetails = async (userId: string, agentId: string = 'SOL'): Promise<any> => {
  try {
    
    const { data: dataArray, error } = await businessDetailsApi.getByUserId(userId);
    const data = Array.isArray(dataArray) ? dataArray.find(item => item.agent_id === agentId) : null;
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business details:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Get business details error:', error);
    return null;
  }
};

// Get existing solar setup data
export const getSolarSetup = async (userId: string, agentId: string = 'SOL'): Promise<any> => {
  try {
    
    const { data: dataArray, error } = await solarSetupApi.getByUserId(userId);
    const data = Array.isArray(dataArray) ? dataArray.find(item => item.agent_id === agentId) : null;
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching solar setup:', error);
      return null;
    }
    
    // If setup_json exists, merge it with the regular columns for backward compatibility
    if (data && data.setup_json) {
      
      // Convert from JSON format back to database format if needed
      // This ensures the UI gets values in the expected format (percentages as numbers, not decimals)
      const jsonData = data.setup_json;
      return {
        ...data,
        // Override with values from setup_json, converting back to UI format
        broker_fee: jsonData.brokerFee ?? data.broker_fee,
        financing_apr: jsonData.financingApr ? jsonData.financingApr * 100 : data.financing_apr, // Convert decimal to percentage
        max_roof_segments: jsonData.maxRoofSegments ?? data.max_roof_segments,
        dealer_fee: jsonData.dealerFeePercent ? jsonData.dealerFeePercent * 100 : data.dealer_fee, // Convert decimal to percentage
        energy_price: jsonData.energyPricePerKwh ?? data.energy_price,
        typical_panel_count: jsonData.typicalPanelCount ?? data.typical_panel_count,
        allow_cash: jsonData.cashPurchaseEnabled ?? data.allow_cash,
        financing_term: jsonData.financingTermMonths ?? data.financing_term,
        solar_incentive: jsonData.solarIncentivePercent ? jsonData.solarIncentivePercent * 100 : data.solar_incentive, // Convert decimal to percentage
        allow_financed: jsonData.financedPurchaseEnabled ?? data.allow_financed,
        installation_price: jsonData.installationPricePerWatt ?? data.installation_price,
        installation_lifespan: jsonData.installationLifespanYears ?? data.installation_lifespan,
        yearly_electric_cost_increase: jsonData.yearlyElectricCostIncreasePercent ? jsonData.yearlyElectricCostIncreasePercent * 100 : data.yearly_electric_cost_increase, // Convert decimal to percentage
        property_type: jsonData.propertyType ?? data.property_type
      };
    }
    
    return data || null;
  } catch (error) {
    console.error('Get solar setup error:', error);
    return null;
  }
};

// Get existing calendar setup data
export const getCalendarSetup = async (userId: string, agentId: string = 'SOL'): Promise<any> => {
  try {
    
    const { data: dataArray, error } = await calendarSetupApi.getByUserId(userId);
    const data = Array.isArray(dataArray) ? dataArray.find(item => item.agent_id === agentId) : null;
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching calendar setup:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Get calendar setup error:', error);
    return null;
  }
};

// Get existing notification preferences data
export const getNotificationPreferences = async (userId: string, agentId: string = 'SOL'): Promise<any> => {
  try {
    
    const { data: dataArray, error } = await notificationPreferencesApi.getByUserId(userId);
    const data = Array.isArray(dataArray) ? dataArray.find(item => item.agent_id === agentId) : null;
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
    
    return data || null;
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return null;
  }
};

// Helper function to get the correct user_id from profiles table
// Get the correct user_id from profiles table using email
export const getProfileUserId = async (email: string): Promise<string | null> => {
  try {
    
    // Get the profile user_id from the email
    const { data: profile, error } = await profilesApi.getByEmail(email);
    
    if (error) {
      console.error('❌ getProfileUserId: Error:', error);
      return null;
    }
    
    if (profile?.user_id) {
      return profile.user_id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting profile user_id:', error);
    return null;
  }
};

// Check setup completion status for all steps
export const checkSetupStatus = async (userId: string, agentId: string = 'SOL'): Promise<{
  websiteDetails: boolean;
  businessDetails: boolean;
  solarSetup: boolean;
  calendarSetup: boolean;
  notificationPreferences: boolean;
  facebookConnect: boolean;
}> => {
  try {
    
    // Use userId directly as firm_user_id in all 5 tables
    const [website, business, solar, calendar, notifications] = await Promise.all([
      getWebsiteAnalysis(userId, agentId),
      getBusinessDetails(userId, agentId),
      getSolarSetup(userId, agentId),
      getCalendarSetup(userId, agentId),
      getNotificationPreferences(userId, agentId)
    ]);
    
    
    // Check Facebook connection status
    let facebookStatus = false;
    try {
      const fbStatus = await facebookApi.getFacebookConnectionStatus(userId);
      facebookStatus = fbStatus?.is_connected || false;
    } catch (error) {
      console.error('Error checking Facebook connection status:', error);
      facebookStatus = false;
    }

    return {
      websiteDetails: !!website,
      businessDetails: !!business,
      solarSetup: !!solar,
      calendarSetup: !!calendar,
      notificationPreferences: !!notifications,
      facebookConnect: facebookStatus
    };
  } catch (error) {
    console.error('Check setup status error:', error);
    return {
      websiteDetails: false,
      businessDetails: false,
      solarSetup: false,
      calendarSetup: false,
      notificationPreferences: false,
      facebookConnect: false
    };
  }
};

// Website Analysis API
interface WebsiteAnalysisData {
  firm_user_id: string;
  agent_id: string;
  website_url: string;
  company_name?: string;
  company_description?: string;
  value_proposition?: string;
  business_niche?: string;
  tags?: string[];
  screenshot_url?: string;
  favicon_url?: string;
  analysis_status?: string;
}

export const saveWebsiteAnalysis = async (data: WebsiteAnalysisData & { isAnalyzeButton?: boolean }): Promise<{ success: boolean; message: string; id?: string; data?: any }> => {
  try {
    
    // Get firm_id from profiles table - REQUIRED field
    const { data: profileData, error: profileError } = await profilesApi.getByUserId(data.firm_user_id);
    
    if (profileError || !profileData) {
      console.error('Profile not found for user_id:', data.firm_user_id, profileError);
      
      // Try checking by id instead
      const { data: profileById, error: profileByIdError } = await profilesApi.getById(data.firm_user_id);
        
      if (profileByIdError || !profileById) {
        console.error('Profile not found by id either:', data.firm_user_id, profileByIdError);
        throw new Error('User profile not found. Please ensure you are logged in properly.');
      } else {
        data.firm_user_id = profileById.user_id;
        var firm_id = profileById.company_id;
      }
    } else {
      var firm_id = profileData.company_id;
    }
    
    // Validate firm_id - cannot be null
    if (!firm_id) {
      throw new Error('Company ID not found in user profile. Please contact support.');
    }
    
    // Fetch GHL data from ghl_subaccounts table
    const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(data.firm_user_id);
    const ghlData = Array.isArray(ghlDataArray) ? ghlDataArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    if (ghlData) {
    } else {
    }
    
    // Check if user has ANY existing website analysis record (not URL-specific)
    const { data: existingRecordArray } = await websiteAnalysisApi.getByUserId(data.firm_user_id);
    const existingRecord = Array.isArray(existingRecordArray) ? existingRecordArray.find(item => 
      item.agent_id === (data.agent_id || 'SOL') && item.firm_id === firm_id
    ) : null;
    
    if (existingRecord) {
    } else {
    }
    
    // Generate UUID for new records
    const recordId = existingRecord?.id || crypto.randomUUID();
    const preserveCreatedAt = existingRecord?.created_at || new Date().toISOString();
    
    // Prepare base data for database upsert
    const upsertData: any = {
      id: recordId,
      firm_user_id: data.firm_user_id,
      agent_id: data.agent_id || 'SOL',
      firm_id: firm_id,
      website_url: data.website_url,
      company_name: data.company_name || null,
      company_description: data.company_description || null,
      value_proposition: data.value_proposition || null,
      business_niche: data.business_niche || null,
      tags: data.tags || null,
      analysis_status: data.analysis_status || 'completed',
      created_at: preserveCreatedAt,
      last_updated_timestamp: new Date().toISOString()
    };
    
    // Add GHL fields if available
    if (ghlData) {
      upsertData.ghl_location_id = ghlData.ghl_location_id;
      upsertData.ghl_user_id = ghlData.soma_ghl_user_id;
    }
    
    // Only include screenshot/favicon URLs when "Analyze" button is clicked
    if (data.isAnalyzeButton === true) {
      upsertData.screenshot_url = data.screenshot_url || null;
      upsertData.favicon_url = data.favicon_url || null;
    } else {
    }


    // Use upsert - if existing record found, update it; otherwise insert new
    const { data: result, error } = await websiteAnalysisApi.upsert(upsertData);

    if (error) {
      console.error('Supabase upsert error:', error);
      throw new Error(`Failed to save website analysis: ${error.message}`);
    }


    return {
      success: true,
      message: 'Website analysis saved successfully',
      id: result?.id || result?.[0]?.id, // Handle both single object and array response
      data: result // Include full data for debugging
    };
  } catch (error) {
    console.error('Save website analysis error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save website analysis');
  }
};

// Business Details API
interface BusinessDetailsData {
  firm_user_id: string;
  agent_id: string;
  business_name: string;
  business_email: string;
  phone_number: string;
  emergency_numbers?: string[];
  country?: string;
  address_method?: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  setup_status?: string;
}

export const saveBusinessDetails = async (data: BusinessDetailsData): Promise<{ success: boolean; message: string }> => {
  try {
    
    // First, let's check if this user exists in profiles table (same logic as website analysis)
    const { data: profileCheck, error: profileError } = await profilesApi.getByUserId(data.firm_user_id);
    
    if (profileError || !profileCheck) {
      console.error('Profile not found for user_id:', data.firm_user_id, profileError);
      
      // Try checking by id instead
      const { data: profileById, error: profileByIdError } = await profilesApi.getById(data.firm_user_id);
        
      if (profileByIdError || !profileById) {
        console.error('Profile not found by id either:', data.firm_user_id, profileByIdError);
        throw new Error('User profile not found. Please ensure you are logged in properly.');
      } else {
        // Use the user_id from the found profile
        data.firm_user_id = profileById.user_id;
      }
    } else {
    }
    
    // Fetch GHL data from ghl_subaccounts table
    const { data: ghlDataArray } = await ghlSubaccountsApi.getByUserId(data.firm_user_id);
    const ghlData = Array.isArray(ghlDataArray) ? ghlDataArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    if (ghlData) {
    } else {
    }
    
    // Check if record exists for UPSERT logic
    const { data: existingRecordArray } = await businessDetailsApi.getByUserId(data.firm_user_id);
    const existingRecord = Array.isArray(existingRecordArray) ? existingRecordArray.find(item => item.agent_id === (data.agent_id || 'SOL')) : null;
    
    // Generate UUID for new records
    const recordId = existingRecord?.id || crypto.randomUUID();
    const createdAt = existingRecord?.created_at || new Date().toISOString();
    
    if (existingRecord?.id) {
    } else {
    }
    
    // Prepare data for database insert
    const insertData: any = {
      id: recordId, // Add UUID
      firm_user_id: data.firm_user_id,
      agent_id: data.agent_id || 'SOL',
      business_name: data.business_name,
      business_email: data.business_email,
      phone_number: data.phone_number,
      emergency_numbers: data.emergency_numbers && data.emergency_numbers.length > 0 ? data.emergency_numbers : null,
      country: data.country || 'US',
      address_method: data.address_method || 'manual',
      address_line: data.address_line,
      city: data.city,
      state: data.state,
      postal_code: data.postal_code,
      setup_status: data.setup_status || 'completed',
      created_at: createdAt, // Add creation timestamp
      last_updated_timestamp: new Date().toISOString() // Add update timestamp
    };
    
    // Add GHL fields if available
    if (ghlData) {
      insertData.ghl_location_id = ghlData.ghl_location_id;
      insertData.ghl_user_id = ghlData.soma_ghl_user_id;
    }


    // Use UPDATE for existing records, INSERT for new records
    let result, error;
    if (existingRecord?.id) {
      ({ data: result, error } = await businessDetailsApi.updateById(existingRecord.id, insertData));
    } else {
      ({ data: result, error } = await businessDetailsApi.create(insertData));
    }

    if (error) {
      console.error('Supabase business details upsert error:', error);
      throw new Error(`Failed to save business details: ${error.message}`);
    }


    return {
      success: true,
      message: 'Business details saved successfully'
    };
  } catch (error) {
    console.error('Save business details error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save business details');
  }
};

// Admin Impersonation APIs
export const adminApi = {
  impersonateUser: async (targetUserId: string, adminUserId: string): Promise<{ success: boolean; profile: any; impersonation_data: any; message: string }> => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://squidgy-backend.onrender.com';
    const response = await fetch(`${backendUrl}/admin/impersonate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_user_id: targetUserId,
        admin_user_id: adminUserId
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to impersonate user' }));
      throw new Error(error.detail || 'Failed to impersonate user');
    }
    
    return response.json();
  }
};
