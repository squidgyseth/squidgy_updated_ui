// templates-api.ts - Service for Templated.io API calls via our backend
// Follows the same pattern as supabase-api.ts for consistency

import { getBackendUrl } from './envConfig';

const BACKEND_URL = getBackendUrl();

interface TemplateLayer {
  name: string;
  type: string;
  description?: string;
  text?: string;
  fontFamily?: string;
  color?: string;
  imageUrl?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  size: { width: number; height: number };
  layers: TemplateLayer[];
  isEnabled: boolean;
  isAvailable?: boolean;
  groupName?: string;
  groupTemplates?: Template[];
  groupCount?: number;
  tags?: string[];
}

export interface TemplatesResponse {
  success: boolean;
  templates: Template[];
  total: number;
  enabledCount: number;
  availableCount: number;
  userId?: string;
  debug?: {
    totalFetched: number;
    afterFilter: number;
    showeveryoneTemplates: number;
    userSpecificTemplates: number;
  };
}

export interface ToggleTemplateResponse {
  success: boolean;
  message: string;
  template_id: string;
  tags: string[];
  isEnabled: boolean;
}

export interface BulkToggleResponse {
  success: boolean;
  results: Array<{ template_id: string; success: boolean }>;
  errors: Array<{ template_id: string; error: string }>;
  totalProcessed: number;
  totalErrors: number;
}

class TemplatesApiService {
  /**
   * Get business_settings.id for a user
   * This is needed to fetch/toggle templates
   */
  async getBusinessId(userEmail: string): Promise<{ businessId: string | null; error: any }> {
    try {
      // Import dynamically to avoid circular dependencies
      const { profilesApi } = await import('./supabase-api');
      const { supabase } = await import('./supabase');

      // 1. Get profile by email
      const { data: profile, error: profileError } = await profilesApi.getByEmail(userEmail);

      if (profileError || !profile?.user_id) {
        console.error('❌ No profile found for email:', userEmail);
        return {
          businessId: null,
          error: { message: 'User profile not found', code: 'PROFILE_NOT_FOUND' }
        };
      }

      // 2. Get business_settings by user_id
      const { data: businessSettings, error: businessError } = await supabase
        .from('business_settings')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

      if (businessError || !businessSettings?.id) {
        console.warn('⚠️ No business_settings found for user_id:', profile.user_id, '- Creating default record...');
        
        // Auto-create business_settings with default values
        try {
          const { data: newBusinessSettings, error: createError } = await supabase
            .from('business_settings')
            .insert({
              user_id: profile.user_id,
              business_email: profile.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (createError || !newBusinessSettings?.id) {
            console.error('❌ Failed to create business_settings:', createError);
            return {
              businessId: null,
              error: { message: 'Failed to create business settings', code: 'CREATE_FAILED' }
            };
          }

          console.log('✅ Auto-created business_settings with ID:', newBusinessSettings.id);
          return { businessId: newBusinessSettings.id, error: null };
        } catch (createErr: any) {
          console.error('❌ Error creating business_settings:', createErr);
          return {
            businessId: null,
            error: { message: 'Failed to create business settings', code: 'CREATE_ERROR' }
          };
        }
      }

      return { businessId: businessSettings.id, error: null };
    } catch (error: any) {
      console.error('❌ Error getting business ID:', error);
      return { businessId: null, error: { message: error.message, code: 'UNKNOWN_ERROR' } };
    }
  }

  /**
   * Fetch all templates visible to a business
   */
  async getTemplates(businessId: string): Promise<{ data: TemplatesResponse | null; error: any }> {
    try {
      console.log(`🔍 Fetching templates for business ID: ${businessId}`);

      const response = await fetch(`${BACKEND_URL}/api/templated/templates/${businessId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        return {
          data: null,
          error: {
            message: `Failed to fetch templates: ${response.statusText}`,
            status: response.status
          }
        };
      }

      const data: TemplatesResponse = await response.json();

      if (!data.success) {
        return {
          data: null,
          error: { message: data.templates || 'Failed to fetch templates' }
        };
      }

      console.log(`✅ Loaded ${data.total} template groups`);
      console.log(`   - ${data.enabledCount} enabled`);
      console.log(`   - ${data.availableCount} available`);

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error);
      // Check for network errors
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        return {
          data: null,
          error: { message: 'Network error: Please check your internet connection and try again.' }
        };
      }
      return {
        data: null,
        error: { message: error.message || 'Failed to load templates' }
      };
    }
  }

  /**
   * Toggle a single template on/off
   */
  async toggleTemplate(
    templateId: string,
    businessId: string,
    enable: boolean
  ): Promise<{ data: ToggleTemplateResponse | null; error: any }> {
    try {
      console.log(`${enable ? '✅ Enabling' : '❌ Disabling'} template ${templateId} for business ${businessId}`);

      const response = await fetch(`${BACKEND_URL}/api/templated/templates/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          user_id: businessId,
          enable: enable
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        return {
          data: null,
          error: {
            message: `Failed to update template: ${response.statusText}`,
            status: response.status
          }
        };
      }

      const data: ToggleTemplateResponse = await response.json();

      if (!data.success) {
        return {
          data: null,
          error: { message: data.message || 'Failed to update template' }
        };
      }

      console.log(`✅ Template ${enable ? 'enabled' : 'disabled'} successfully`);

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Error toggling template:', error);
      // Check for network errors
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        return {
          data: null,
          error: { message: 'Network error: Please check your internet connection and try again.' }
        };
      }
      return {
        data: null,
        error: { message: error.message || 'Failed to update template' }
      };
    }
  }

  /**
   * Toggle multiple templates at once (for template groups)
   */
  async bulkToggleTemplates(
    templateIds: string[],
    businessId: string,
    enable: boolean
  ): Promise<{ data: BulkToggleResponse | null; error: any }> {
    try {
      console.log(`${enable ? '✅ Enabling' : '❌ Disabling'} ${templateIds.length} templates for business ${businessId}`);

      const response = await fetch(`${BACKEND_URL}/api/templated/templates/bulk-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_ids: templateIds,
          user_id: businessId,
          enable: enable
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        return {
          data: null,
          error: {
            message: `Failed to update templates: ${response.statusText}`,
            status: response.status
          }
        };
      }

      const data: BulkToggleResponse = await response.json();

      if (!data.success) {
        return {
          data: null,
          error: { message: 'Some templates failed to update', partialSuccess: true, data }
        };
      }

      console.log(`✅ ${data.totalProcessed} templates updated successfully`);
      if (data.totalErrors > 0) {
        console.warn(`⚠️ ${data.totalErrors} templates failed to update`);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Error bulk toggling templates:', error);
      // Check for network errors
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('NetworkError')) {
        return {
          data: null,
          error: { message: 'Network error: Please check your internet connection and try again.' }
        };
      }
      return {
        data: null,
        error: { message: error.message || 'Failed to update templates' }
      };
    }
  }

  /**
   * Get all templates (debug endpoint)
   * Shows all templates with their tags
   */
  async debugAllTemplates(): Promise<{ data: any; error: any }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/templated/templates/debug/all`);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          data: null,
          error: { message: errorText, status: response.status }
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: { message: error.message }
      };
    }
  }
}

// Export singleton instance
export const templatesApi = new TemplatesApiService();

// Export convenience methods that match the supabase-api pattern
export const templatesService = {
  /**
   * Get business ID for user by email
   */
  getBusinessId: (userEmail: string) =>
    templatesApi.getBusinessId(userEmail),

  /**
   * Get all templates for a business
   */
  getByBusinessId: (businessId: string) =>
    templatesApi.getTemplates(businessId),

  /**
   * Enable a template for a business
   */
  enable: (templateId: string, businessId: string) =>
    templatesApi.toggleTemplate(templateId, businessId, true),

  /**
   * Disable a template for a business
   */
  disable: (templateId: string, businessId: string) =>
    templatesApi.toggleTemplate(templateId, businessId, false),

  /**
   * Enable multiple templates at once
   */
  enableMultiple: (templateIds: string[], businessId: string) =>
    templatesApi.bulkToggleTemplates(templateIds, businessId, true),

  /**
   * Disable multiple templates at once
   */
  disableMultiple: (templateIds: string[], businessId: string) =>
    templatesApi.bulkToggleTemplates(templateIds, businessId, false),

  /**
   * Debug: Get all templates with tags
   */
  debugAll: () =>
    templatesApi.debugAllTemplates()
};
