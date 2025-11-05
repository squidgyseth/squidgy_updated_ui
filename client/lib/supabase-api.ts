// supabase-api.ts - Direct Supabase REST API utility to replace hanging Supabase client calls
// This bypasses the Supabase JS client which hangs in production environments

interface SupabaseApiConfig {
  url: string;
  key: string;
}

class SupabaseDirectApi {
  private config: SupabaseApiConfig;

  constructor() {
    this.config = {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY
    };
  }

  private getHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'apikey': this.config.key,
      'Authorization': `Bearer ${authToken || this.config.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.config.url}/rest/v1${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }
    
    return url.toString();
  }

  // SELECT operations
  async select<T = any>(
    table: string, 
    columns: string = '*', 
    filters?: Record<string, any>,
    options?: {
      single?: boolean;
      order?: string;
      limit?: number;
      authToken?: string;
    }
  ): Promise<{ data: T | T[], error: any }> {
    try {
      console.log(`🌐 SUPABASE_API: SELECT from ${table}`, { columns, filters, options });
      
      let endpoint = `/${table}`;
      const params: Record<string, any> = {};
      
      // Add select columns
      if (columns !== '*') {
        params.select = columns;
      }
      
      // Add filters
      if (filters) {
        Object.keys(filters).forEach(key => {
          params[`${key}`] = `eq.${filters[key]}`;
        });
      }
      
      // Add ordering
      if (options?.order) {
        params.order = options.order;
      }
      
      // Add limit
      if (options?.limit) {
        params.limit = options.limit;
      }
      
      const url = this.buildUrl(endpoint, params);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(options?.authToken)
      });
      
      const endTime = Date.now();
      console.log(`⏱️ SUPABASE_API: SELECT completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SUPABASE_API: SELECT failed:`, response.status, errorText);
        return { data: [] as any, error: { message: errorText, status: response.status } };
      }
      
      const data = await response.json();
      console.log(`📋 SUPABASE_API: SELECT result:`, Array.isArray(data) ? `${data.length} rows` : 'single row');
      
      if (options?.single) {
        return { data: data.length > 0 ? data[0] : null, error: null };
      }
      
      return { data, error: null };
      
    } catch (error: any) {
      console.error(`❌ SUPABASE_API: SELECT exception:`, error);
      return { data: [] as any, error: { message: error.message } };
    }
  }

  // INSERT operations
  async insert<T = any>(
    table: string, 
    data: any | any[], 
    options?: {
      authToken?: string;
      onConflict?: string;
    }
  ): Promise<{ data: T | T[], error: any }> {
    try {
      console.log(`🌐 SUPABASE_API: INSERT into ${table}`, { data, options });
      
      const endpoint = `/${table}`;
      const url = this.buildUrl(endpoint);
      const startTime = Date.now();
      
      const headers = this.getHeaders(options?.authToken);
      if (options?.onConflict) {
        headers['Prefer'] = `return=representation,resolution=merge-duplicates`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      const endTime = Date.now();
      console.log(`⏱️ SUPABASE_API: INSERT completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SUPABASE_API: INSERT failed:`, response.status, errorText);
        return { data: [] as any, error: { message: errorText, status: response.status } };
      }
      
      const result = await response.json();
      console.log(`✅ SUPABASE_API: INSERT successful`);
      
      return { data: result, error: null };
      
    } catch (error: any) {
      console.error(`❌ SUPABASE_API: INSERT exception:`, error);
      return { data: [] as any, error: { message: error.message } };
    }
  }

  // UPDATE operations
  async update<T = any>(
    table: string, 
    data: any, 
    filters: Record<string, any>,
    options?: {
      authToken?: string;
    }
  ): Promise<{ data: T | T[], error: any }> {
    try {
      console.log(`🌐 SUPABASE_API: UPDATE ${table}`, { data, filters, options });
      
      let endpoint = `/${table}`;
      const params: Record<string, any> = {};
      
      // Add filters
      Object.keys(filters).forEach(key => {
        params[`${key}`] = `eq.${filters[key]}`;
      });
      
      const url = this.buildUrl(endpoint, params);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(options?.authToken),
        body: JSON.stringify(data)
      });
      
      const endTime = Date.now();
      console.log(`⏱️ SUPABASE_API: UPDATE completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SUPABASE_API: UPDATE failed:`, response.status, errorText);
        return { data: [] as any, error: { message: errorText, status: response.status } };
      }
      
      const result = await response.json();
      console.log(`✅ SUPABASE_API: UPDATE successful`);
      
      return { data: result, error: null };
      
    } catch (error: any) {
      console.error(`❌ SUPABASE_API: UPDATE exception:`, error);
      return { data: [] as any, error: { message: error.message } };
    }
  }

  // UPSERT operations - improved to handle conflicts properly
  async upsert<T = any>(
    table: string, 
    data: any | any[], 
    options?: {
      onConflict?: string;
      authToken?: string;
    }
  ): Promise<{ data: T | T[], error: any }> {
    try {
      console.log(`🌐 SUPABASE_API: UPSERT into ${table}`, { data, options });
      
      // Fall back to INSERT with proper upsert headers
      const endpoint = `/${table}`;
      const url = this.buildUrl(endpoint);
      const startTime = Date.now();
      
      const headers = this.getHeaders(options?.authToken);
      headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      const endTime = Date.now();
      console.log(`⏱️ SUPABASE_API: UPSERT completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SUPABASE_API: UPSERT failed:`, response.status, errorText);
        return { data: [] as any, error: { message: errorText, status: response.status } };
      }
      
      const result = await response.json();
      console.log(`✅ SUPABASE_API: UPSERT successful`);
      
      return { data: result, error: null };
      
    } catch (error: any) {
      console.error(`❌ SUPABASE_API: UPSERT exception:`, error);
      return { data: [] as any, error: { message: error.message } };
    }
  }

  // DELETE operations
  async delete<T = any>(
    table: string, 
    filters: Record<string, any>,
    options?: {
      authToken?: string;
    }
  ): Promise<{ data: T | T[], error: any }> {
    try {
      console.log(`🌐 SUPABASE_API: DELETE from ${table}`, { filters, options });
      
      let endpoint = `/${table}`;
      const params: Record<string, any> = {};
      
      // Add filters
      Object.keys(filters).forEach(key => {
        params[`${key}`] = `eq.${filters[key]}`;
      });
      
      const url = this.buildUrl(endpoint, params);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(options?.authToken)
      });
      
      const endTime = Date.now();
      console.log(`⏱️ SUPABASE_API: DELETE completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ SUPABASE_API: DELETE failed:`, response.status, errorText);
        return { data: [] as any, error: { message: errorText, status: response.status } };
      }
      
      const result = await response.json();
      console.log(`✅ SUPABASE_API: DELETE successful`);
      
      return { data: result, error: null };
      
    } catch (error: any) {
      console.error(`❌ SUPABASE_API: DELETE exception:`, error);
      return { data: [] as any, error: { message: error.message } };
    }
  }
}

// Export singleton instance
export const supabaseApi = new SupabaseDirectApi();

// Helper functions for common patterns
export const profilesApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('profiles', '*', { id }, { single: true, authToken }),
  
  getByEmail: (email: string, authToken?: string) => 
    supabaseApi.select('profiles', '*', { email }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('profiles', '*', { user_id }, { single: true, authToken }),
  
  create: (profileData: any, authToken?: string) =>
    supabaseApi.insert('profiles', profileData, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('profiles', updateData, { id }, { authToken })
};

// Calendar Setup API
export const calendarSetupApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('calendar_setup', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('calendar_setup', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('calendar_setup', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('calendar_setup', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('calendar_setup', data, { onConflict: 'firm_user_id,agent_id', authToken })
};

// Chat History API
export const chatHistoryApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('chat_history', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('chat_history', '*', { user_id }, { authToken }),
  
  getBySessionId: (session_id: string, authToken?: string) => 
    supabaseApi.select('chat_history', '*', { session_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('chat_history', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('chat_history', updateData, { id }, { authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('chat_history', { id }, { authToken })
};

// Website Analysis API
export const websiteAnalysisApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('website_analysis', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('website_analysis', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('website_analysis', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('website_analysis', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('website_analysis', data, { onConflict: 'firm_user_id,agent_id', authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('website_analysis', { id }, { authToken })
};

// Facebook Integrations API
export const facebookIntegrationsApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('facebook_integrations', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('facebook_integrations', '*', { firm_user_id: user_id }, { single: true, authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('facebook_integrations', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('facebook_integrations', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('facebook_integrations', data, { onConflict: 'firm_user_id,agent_id', authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('facebook_integrations', { id }, { authToken })
};

// GHL Subaccounts API
export const ghlSubaccountsApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('ghl_subaccounts', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('ghl_subaccounts', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('ghl_subaccounts', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('ghl_subaccounts', updateData, { id }, { authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('ghl_subaccounts', { id }, { authToken })
};

// Notification Preferences API
export const notificationPreferencesApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('notification_preferences', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('notification_preferences', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('notification_preferences', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('notification_preferences', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('notification_preferences', data, { onConflict: 'firm_user_id,agent_id', authToken })
};

// Solar Setup API
export const solarSetupApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('solar_setup', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('solar_setup', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('solar_setup', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('solar_setup', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('solar_setup', data, { onConflict: 'firm_user_id,agent_id', authToken })
};

// Business Details API
export const businessDetailsApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('business_details', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('business_details', '*', { firm_user_id: user_id }, { authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('business_details', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('business_details', updateData, { id }, { authToken }),
    
  upsert: (data: any, authToken?: string) =>
    supabaseApi.upsert('business_details', data, { onConflict: 'firm_user_id,agent_id', authToken })
};

// History Newsletters API
export const newslettersApi = {
  getById: (id: string, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { id }, { single: true, authToken }),
  
  getByUserId: (user_id: string, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { user_id }, { order: 'updated_at.desc', authToken }),
  
  getBySessionId: (session_id: string, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { session_id }, { order: 'updated_at.desc', authToken }),
    
  getByAgentId: (user_id: string, agent_id: string, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { user_id, agent_id }, { order: 'updated_at.desc', authToken }),
    
  getByChatHistoryId: (chat_history_id: string, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { chat_history_id }, { single: true, authToken }),
  
  create: (data: any, authToken?: string) =>
    supabaseApi.insert('history_newsletters', data, { authToken }),
  
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('history_newsletters', updateData, { id }, { authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('history_newsletters', { id }, { authToken }),
    
  // Get recent newsletters for user
  getRecent: (user_id: string, limit: number = 10, authToken?: string) => 
    supabaseApi.select('history_newsletters', '*', { user_id }, { order: 'updated_at.desc', limit, authToken }),
    
  // Create newsletter from chat history
  createFromChatHistory: (data: {
    user_id: string;
    session_id?: string;
    chat_history_id?: string;
    agent_id?: string;
    title: string;
    content: string;
    call_to_actions?: any[];
  }, authToken?: string) =>
    supabaseApi.insert('history_newsletters', {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { authToken }),
    
  // Find newsletter by unique combination (avoid duplicates)
  findByUniqueCombination: async (user_id: string, session_id?: string, chat_history_id?: string, authToken?: string) => {
    const filters: any = { user_id };
    if (session_id) filters.session_id = session_id;
    if (chat_history_id) filters.chat_history_id = chat_history_id;
    
    return supabaseApi.select('history_newsletters', '*', filters, { single: true, authToken });
  },
  
  // Update or create (upsert) based on unique combination
  upsertByChat: async (data: {
    user_id: string;
    session_id?: string;
    chat_history_id?: string;
    agent_id?: string;
    title: string;
    content: string;
    call_to_actions?: any[];
  }, authToken?: string) => {
    // First try to find existing
    const existing = await newslettersApi.findByUniqueCombination(
      data.user_id, 
      data.session_id, 
      data.chat_history_id, 
      authToken
    );
    
    if (existing.data && !existing.error) {
      // Update existing
      return newslettersApi.updateById(existing.data.id, {
        ...data,
        updated_at: new Date().toISOString()
      }, authToken);
    } else {
      // Create new
      return newslettersApi.create({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, authToken);
    }
  }
};

// Content Repurposer API
export const contentRepurposerApi = {
  // Get content repurposer by ID
  getById: (id: string, authToken?: string) =>
    supabaseApi.select('history_content_repurposer', '*', { id }, { single: true, authToken }),
    
  // Get all content repurposers for a user
  getByUserId: (user_id: string, authToken?: string) =>
    supabaseApi.select('history_content_repurposer', '*', { user_id }, { order: 'updated_at.desc', authToken }),
    
  // Get content repurposers by session
  getBySessionId: (session_id: string, authToken?: string) =>
    supabaseApi.select('history_content_repurposer', '*', { session_id }, { order: 'updated_at.desc', authToken }),
    
  // Get content repurposer by agent ID
  getByAgentId: (agent_id: string, authToken?: string) =>
    supabaseApi.select('history_content_repurposer', '*', { agent_id }, { order: 'updated_at.desc', authToken }),
    
  // Get content repurposer by chat history ID
  getByChatHistoryId: (chat_history_id: string, authToken?: string) =>
    supabaseApi.select('history_content_repurposer', '*', { chat_history_id }, { single: true, authToken }),
    
  // Create new content repurposer
  create: (data: {
    user_id: string;
    title: string;
    content: string;
    session_id?: string;
    chat_history_id?: string;
    agent_id?: string;
    repurposed_content?: any[];
    source_type?: string;
    target_formats?: string[];
    created_at?: string;
    updated_at?: string;
  }, authToken?: string) =>
    supabaseApi.insert('history_content_repurposer', data, { authToken }),
    
  // Update content repurposer
  updateById: (id: string, updateData: any, authToken?: string) =>
    supabaseApi.update('history_content_repurposer', updateData, { id }, { authToken }),
    
  deleteById: (id: string, authToken?: string) =>
    supabaseApi.delete('history_content_repurposer', { id }, { authToken }),
    
  // Get recent content repurposers for user
  getRecent: (user_id: string, limit: number = 10, authToken?: string) => 
    supabaseApi.select('history_content_repurposer', '*', { user_id }, { order: 'updated_at.desc', limit, authToken }),
    
  // Create content repurposer from chat history
  createFromChatHistory: (data: {
    user_id: string;
    session_id?: string;
    chat_history_id?: string;
    agent_id?: string;
    title: string;
    content: string;
    repurposed_content?: any[];
    source_type?: string;
    target_formats?: string[];
  }, authToken?: string) =>
    supabaseApi.insert('history_content_repurposer', {
      ...data,
      agent_id: data.agent_id || 'content_repurposer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { authToken }),
    
  // Find content repurposer by unique combination (avoid duplicates)
  findByUniqueCombination: async (user_id: string, session_id?: string, chat_history_id?: string, authToken?: string) => {
    const filters: any = { user_id };
    if (session_id) filters.session_id = session_id;
    if (chat_history_id) filters.chat_history_id = chat_history_id;
    
    return supabaseApi.select('history_content_repurposer', '*', filters, { single: true, authToken });
  },
  
  // Update or create (upsert) based on unique combination
  upsertByChat: async (data: {
    user_id: string;
    session_id?: string;
    chat_history_id?: string;
    agent_id?: string;
    title: string;
    content: string;
    repurposed_content?: any[];
    source_type?: string;
    target_formats?: string[];
  }, authToken?: string) => {
    // First try to find existing
    const existing = await contentRepurposerApi.findByUniqueCombination(
      data.user_id, 
      data.session_id, 
      data.chat_history_id, 
      authToken
    );
    
    if (existing.data && !existing.error) {
      // Update existing
      return contentRepurposerApi.updateById(existing.data.id, {
        ...data,
        updated_at: new Date().toISOString()
      }, authToken);
    } else {
      // Create new
      return contentRepurposerApi.create({
        ...data,
        agent_id: data.agent_id || 'content_repurposer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, authToken);
    }
  }
};