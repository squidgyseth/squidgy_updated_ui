import OnboardingService, { OnboardingAgentData } from './onboardingService';
import OptimizedAgentService from './optimizedAgentService';
import { supabase } from '../lib/supabase';

export interface AgentEnablementData {
  agentId: string;
  customName?: string;
  communicationTone?: 'professional' | 'friendly' | 'casual' | 'formal';
  targetAudience?: 'b2c' | 'b2b' | 'both' | 'enterprise';
  primaryGoals?: string[];
  brandVoice?: string;
}

class AgentEnablementService {
  private static instance: AgentEnablementService;
  private agentNameToIdMap: Record<string, string> = {};

  constructor() {
    this.buildAgentNameMapping();
  }

  static getInstance(): AgentEnablementService {
    if (!AgentEnablementService.instance) {
      AgentEnablementService.instance = new AgentEnablementService();
    }
    return AgentEnablementService.instance;
  }

  /**
   * Build dynamic agent name to ID mapping from config files
   */
  private buildAgentNameMapping(): void {
    try {
      const agentService = OptimizedAgentService.getInstance();
      const allAgents = agentService.getAllAgents();
      
      // Build mapping from config files
      this.agentNameToIdMap = {};
      allAgents.forEach(config => {
        if (config.agent?.name && config.agent?.id) {
          this.agentNameToIdMap[config.agent.name] = config.agent.id;
        }
      });
      
      console.log('🔄 AgentEnablementService: Built dynamic agent mapping:', this.agentNameToIdMap);
    } catch (error) {
      console.error('❌ AgentEnablementService: Error building agent mapping:', error);
      // Fallback to prevent crashes
      this.agentNameToIdMap = {};
    }
  }

  /**
   * Enable an agent after Step 5 completion
   * This function is designed to be called from N8N webhook responses
   */
  async enableAgentFromOnboarding(data: AgentEnablementData, userId?: string): Promise<boolean> {
    try {
      console.log('🎯 AgentEnablementService: Enabling agent from onboarding:', data);
      console.log('🎯 AgentEnablementService: Using provided userId:', userId);

      let actualUserId = userId;

      // If no userId provided, fall back to auth lookup
      if (!actualUserId) {
        console.log('🔄 AgentEnablementService: No userId provided, falling back to auth lookup');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ AgentEnablementService: No authenticated user');
          return false;
        }

        // Get the correct user_id from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('❌ AgentEnablementService: Error fetching profile:', profileError);
          return false;
        }

        actualUserId = profile.user_id;
      }
      
      console.log(`🔍 AgentEnablementService: Using user_id: ${actualUserId}`);

      // Prepare agent data for onboarding service
      const agentData: OnboardingAgentData = {
        user_id: actualUserId,
        assistant_id: data.agentId,
        custom_name: data.customName,
        communication_tone: data.communicationTone || 'professional',
        target_audience: data.targetAudience,
        primary_goals: data.primaryGoals,
        brand_voice: data.brandVoice,
        is_enabled: true
      };

      // Enable the agent
      const onboardingService = OnboardingService.getInstance();
      const success = await onboardingService.enableAgent(agentData);

      if (success) {
        console.log('✅ AgentEnablementService: Agent enabled successfully');
        
        // Refresh the sidebar to show the new agent
        this.refreshAgentSidebar();
        
        // Show notification if available
        this.showEnablementNotification(data.agentId, data.customName);
        
        return true;
      } else {
        console.error('❌ AgentEnablementService: Failed to enable agent');
        return false;
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error enabling agent:', error);
      return false;
    }
  }

  /**
   * Parse onboarding response for agent enablement
   * Single fallback method: checks agent name from config + (agent/assistant) + enablement keywords
   */
  parseOnboardingResponse(responseText: string): AgentEnablementData | null {
    try {
      console.log('🔍 AgentEnablementService: Parsing response for agent enablement');

      // Get all agents dynamically from config files
      const agentService = OptimizedAgentService.getInstance();
      const allAgents = agentService.getAllAgents();

      // Convert response to lowercase for matching
      const textLower = responseText.toLowerCase();

      // Enablement keywords and indicators
      const enablementKeywords = ['enabled', 'configured', 'ready', 'available', 'activated', 'set up'];
      const enablementIndicators = ['✅', '✓', '🎉'];

      // Check for "agent" or "assistant" word in text
      const hasAgentOrAssistant = textLower.includes('agent') || textLower.includes('assistant');

      // Check for enablement keyword or indicator
      const hasEnablement = enablementKeywords.some(kw => textLower.includes(kw)) ||
                           enablementIndicators.some(ind => responseText.includes(ind));

      // If no enablement signals, exit early
      if (!hasEnablement) {
        console.log('❌ AgentEnablementService: No enablement keywords/indicators found');
        return null;
      }

      // Check each agent from config
      for (const config of allAgents) {
        const agentName = config.agent.name;
        const agentId = config.agent.id;

        // Skip Personal Assistant - already enabled by default
        if (agentId === 'personal_assistant') {
          continue;
        }

        // Get significant words from agent name (exclude "agent"/"assistant", keep words > 2 chars)
        const nameWords = agentName.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2 && word !== 'agent' && word !== 'assistant');

        // Check if ALL significant name words exist in the text
        const hasAllNameWords = nameWords.every(word => textLower.includes(word));

        // Match if: all name words found + (agent/assistant word OR just enablement)
        if (hasAllNameWords && (hasAgentOrAssistant || hasEnablement)) {
          console.log(`✅ AgentEnablementService: Matched "${agentName}" (${agentId})`);
          console.log(`   Name words found: [${nameWords.join(', ')}]`);

          return {
            agentId: agentId,
            customName: agentName
          };
        }
      }

      console.log('❌ AgentEnablementService: No agent matched from config');
      console.log('   Available agents:', allAgents.map(a => `${a.agent.name} (${a.agent.id})`).join(', '));
      return null;

    } catch (error) {
      console.error('❌ AgentEnablementService: Error parsing response:', error);
      return null;
    }
  }

  /**
   * Refresh the agent sidebar
   */
  private refreshAgentSidebar(): void {
    try {
      // Call the global refresh function exposed by the sidebar
      if ((window as any).refreshAgentSidebar) {
        (window as any).refreshAgentSidebar();
        console.log('🔄 AgentEnablementService: Refreshed agent sidebar');
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error refreshing sidebar:', error);
    }
  }

  /**
   * Show notification for agent enablement
   */
  private showEnablementNotification(agentId: string, customName?: string): void {
    try {
      const agentName = customName || agentId.replace('_', ' ');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Agent Enabled! 🎉', {
          body: `${agentName} is now configured and ready to help!`,
          icon: '/favicon.ico'
        });
      }
      
      // Also try to show a toast if available
      if ((window as any).showToast) {
        (window as any).showToast(`✅ ${agentName} enabled and ready!`, 'success');
      }
      
      console.log(`🎉 AgentEnablementService: ${agentName} enabled notification sent`);
    } catch (error) {
      console.error('❌ AgentEnablementService: Error showing notification:', error);
    }
  }

  /**
   * Check if agent enablement should be triggered from a response
   */
  shouldTriggerEnablement(responseText: string): boolean {
    const textLower = responseText.toLowerCase();
    const enablementKeywords = ['enabled', 'configured', 'ready', 'available', 'activated', 'set up'];
    const enablementIndicators = ['✅', '✓', '🎉'];

    return enablementKeywords.some(kw => textLower.includes(kw)) ||
           enablementIndicators.some(ind => responseText.includes(ind));
  }

  /**
   * Refresh agent mapping from config files
   * Call this when new agents are added
   */
  refreshAgentMapping(): void {
    console.log('🔄 AgentEnablementService: Refreshing agent mapping...');
    this.buildAgentNameMapping();
  }

  /**
   * Get current agent mapping (for debugging)
   */
  getAgentMapping(): Record<string, string> {
    return { ...this.agentNameToIdMap };
  }

  /**
   * Main function to be called from N8N response handler
   * Handles both structured JSON and legacy text responses
   */
  async handleOnboardingResponse(responseData: any, userId?: string): Promise<void> {
    try {
      console.log('🔍 AgentEnablementService: Received responseData:', responseData);
      console.log('🔍 AgentEnablementService: Response type:', typeof responseData);
      console.log('🔍 AgentEnablementService: Response length:', typeof responseData === 'string' ? responseData.length : 'N/A');
      
      // Handle N8N array format - extract first item if it's an array
      let actualData = responseData;
      if (Array.isArray(responseData) && responseData.length > 0) {
        actualData = responseData[0];
        console.log('🔍 AgentEnablementService: Extracted data from array format:', actualData);
      }
      
      // Handle structured format (object with finished: true)
      console.log('🔍 AgentEnablementService: Checking structured format conditions:');
      console.log('🔍 typeof actualData === object:', typeof actualData === 'object');
      console.log('🔍 actualData.finished:', actualData.finished);
      console.log('🔍 actualData.finished === true:', actualData.finished === true);
      console.log('🔍 actualData.agent_data exists:', !!actualData.agent_data);
      console.log('🔍 Full actualData:', actualData);
      
      // If N8N didn't send structured format but we see enablement text, create it manually
      if (typeof actualData === 'object' && actualData.agent_response && 
          typeof actualData.agent_response === 'string' &&
          (actualData.agent_response.includes('is now configured and enabled') ||
           actualData.agent_response.includes('configured and enabled'))) {
        console.log('🔄 AgentEnablementService: Creating structured format from enablement text');
        
        // Extract agent info from the text
        const agentInfo = this.parseOnboardingResponse(actualData.agent_response);
        if (agentInfo) {
          const enablementData = {
            finished: true,
            agent_data: agentInfo,
            user_id: actualData.user_id
          };
          
          console.log('✅ AgentEnablementService: Created structured enablement from text:', enablementData);
          return this.handleStructuredEnablement(enablementData);
        }
      }
      
      if (typeof actualData === 'object' && actualData.finished === true && actualData.agent_data) {
        console.log('✅ AgentEnablementService: Processing structured agent enablement');
        
        const userId = actualData.user_id;
        const agentId = actualData.agent_data.agent_id;
        const customName = actualData.agent_data.agent_name;
        const communicationTone = actualData.agent_data.communication_tone;
        
        console.log(`🔧 AgentEnablementService: Enabling ${agentId} for user ${userId}`);

        // Validate required fields before database operation
        if (!userId || !agentId) {
          console.error('❌ AgentEnablementService: Missing required fields - userId:', userId, 'agentId:', agentId);
          return;
        }

        const upsertData = {
          user_id: userId,
          assistant_id: agentId,
          custom_name: customName || agentId,
          communication_tone: communicationTone || 'professional',
          is_enabled: true,
          last_updated: new Date().toISOString()
        };

        console.log('🔧 AgentEnablementService: Upserting data:', upsertData);

        // Direct database insert/update
        const { error, data } = await supabase
          .from('assistant_personalizations')
          .upsert(upsertData)
          .select();

        if (error) {
          console.error('❌ AgentEnablementService: Database error:', error);
          console.error('❌ AgentEnablementService: Failed upsert data:', upsertData);
        } else {
          console.log('✅ AgentEnablementService: Agent enabled successfully, data:', data);
          this.refreshAgentSidebar();
        }
        return;
      }

      // Handle legacy text parsing
      if (typeof responseData === 'string') {
        console.log('🔄 AgentEnablementService: Using legacy text parsing');
        return this.handleLegacyResponse(responseData);
      }

      console.log('❌ AgentEnablementService: No agent enablement action detected - unsupported format');
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling onboarding response:', error);
    }
  }

  /**
   * Handle structured enablement format (with finished: true and agent_data)
   */
  private async handleStructuredEnablement(data: any): Promise<void> {
    try {
      const userId = data.user_id;
      const agentData = data.agent_data;
      
      console.log(`🔧 AgentEnablementService: Processing structured enablement for ${agentData.agentId} (user: ${userId})`);
      
      // Direct database upsert
      const { error } = await supabase
        .from('assistant_personalizations')
        .upsert({
          user_id: userId,
          assistant_id: agentData.agentId,
          custom_name: agentData.customName,
          is_enabled: true,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('❌ AgentEnablementService: Database error:', error);
      } else {
        console.log('✅ AgentEnablementService: Agent enabled successfully via structured format');
        this.refreshAgentSidebar();
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling structured enablement:', error);
    }
  }

  /**
   * Legacy text-based parsing (fallback for old responses)
   */
  private async handleLegacyResponse(responseText: string): Promise<void> {
    try {
      if (!this.shouldTriggerEnablement(responseText)) {
        return;
      }

      const agentData = this.parseOnboardingResponse(responseText);
      if (agentData) {
        await this.enableAgentFromOnboarding(agentData);
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling legacy response:', error);
    }
  }
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;