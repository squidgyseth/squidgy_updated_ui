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

  private buildAgentNameMapping(): void {
    try {
      const agentService = OptimizedAgentService.getInstance();
      const allAgents = agentService.getAllAgents();
      
      this.agentNameToIdMap = {};
      allAgents.forEach(config => {
        if (config.agent?.name && config.agent?.id) {
          this.agentNameToIdMap[config.agent.name] = config.agent.id;
        }
      });
      
      console.log('🔄 AgentEnablementService: Built dynamic agent mapping:', this.agentNameToIdMap);
    } catch (error) {
      console.error('❌ AgentEnablementService: Error building agent mapping:', error);
      this.agentNameToIdMap = {};
    }
  }

  async enableAgentFromOnboarding(data: AgentEnablementData, userId?: string): Promise<boolean> {
    try {
      console.log('🎯 AgentEnablementService: Enabling agent from onboarding:', data);

      let actualUserId = userId;

      if (!actualUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ AgentEnablementService: No authenticated user');
          return false;
        }

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

      const onboardingService = OnboardingService.getInstance();
      const success = await onboardingService.enableAgent(agentData);

      if (success) {
        console.log('✅ AgentEnablementService: Agent enabled successfully');
        this.refreshAgentSidebar();
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

      // IMPORTANT: Sort agents by name length (longest first) to match more specific agents first
      // This ensures "Newsletter Agent Multi" is matched before "Newsletter Agent"
      const sortedAgents = [...allAgents].sort((a, b) =>
        b.agent.name.length - a.agent.name.length
      );

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

      // Check each agent from config (sorted by name length, longest first)
      for (const config of sortedAgents) {
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

  private refreshAgentSidebar(): void {
    try {
      if ((window as any).refreshAgentSidebar) {
        (window as any).refreshAgentSidebar();
        console.log('🔄 AgentEnablementService: Refreshed agent sidebar');
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error refreshing sidebar:', error);
    }
  }

  private showEnablementNotification(agentId: string, customName?: string): void {
    try {
      const agentName = customName || agentId.replace('_', ' ');
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Agent Enabled! 🎉', {
          body: `${agentName} is now configured and ready to help!`,
          icon: '/favicon.ico'
        });
      }
      
      if ((window as any).showToast) {
        (window as any).showToast(`✅ ${agentName} enabled and ready!`, 'success');
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error showing notification:', error);
    }
  }

  shouldTriggerEnablement(responseText: string): boolean {
    const textLower = responseText.toLowerCase();
    const enablementKeywords = ['enabled', 'configured', 'ready', 'available', 'activated', 'set up'];
    const enablementIndicators = ['✅', '✓', '🎉'];

    return enablementKeywords.some(kw => textLower.includes(kw)) ||
           enablementIndicators.some(ind => responseText.includes(ind));
  }

  refreshAgentMapping(): void {
    this.buildAgentNameMapping();
  }

  getAgentMapping(): Record<string, string> {
    return { ...this.agentNameToIdMap };
  }

  async handleOnboardingResponse(responseData: any, userId?: string): Promise<void> {
    try {
      console.log('🔍 AgentEnablementService: Received responseData:', responseData);
      
      let actualData = responseData;
      if (Array.isArray(responseData) && responseData.length > 0) {
        actualData = responseData[0];
      }

      // PRIORITY 1: Handle structured format with agent_data (preferred - use exact data from N8N)
      if (typeof actualData === 'object' && actualData.finished === true && actualData.agent_data) {
        console.log('✅ AgentEnablementService: Processing structured agent enablement with agent_data');
        console.log('   agent_id:', actualData.agent_data.agent_id);
        console.log('   agent_name:', actualData.agent_data.agent_name);
        return this.handleStructuredEnablement(actualData);
      }

      // PRIORITY 2: Fallback - parse enablement text when agent_data is not present
      if (typeof actualData === 'object' && actualData.agent_response &&
          typeof actualData.agent_response === 'string' &&
          (actualData.agent_response.includes('is now configured and enabled') ||
           actualData.agent_response.includes('configured and enabled'))) {
        console.log('🔄 AgentEnablementService: Fallback - parsing enablement text (no agent_data found)');

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

      // Handle legacy text parsing
      if (typeof responseData === 'string') {
        console.log('🔄 AgentEnablementService: Using legacy text parsing');
        const agentData = this.parseOnboardingResponse(responseData);
        if (agentData) {
          await this.enableAgentFromOnboarding(agentData);
        }
        return;
      }

      console.log('❌ AgentEnablementService: No agent enablement action detected');
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling onboarding response:', error);
    }
  }

  private async handleStructuredEnablement(data: any): Promise<void> {
    try {
      const passedUserId = data.user_id;
      const agentData = data.agent_data;

      // Support both camelCase (from parseOnboardingResponse) and snake_case (from N8N)
      const agentId = agentData.agentId || agentData.agent_id;
      const customName = agentData.customName || agentData.agent_name;
      const communicationTone = agentData.communication_tone || agentData.communicationTone;
      const targetAudience = agentData.target_audience || agentData.targetAudience;
      const primaryGoals = agentData.primary_goals || agentData.primaryGoals;

      // IMPORTANT: Get the correct user_id from profiles table (same as sidebar uses)
      // The passed userId might be the auth user id, but we need profile.user_id
      let actualUserId = passedUserId;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('id', user.id)
          .single();

        if (profile?.user_id) {
          actualUserId = profile.user_id;
          console.log(`🔧 AgentEnablementService: Using profile.user_id: ${actualUserId} (passed was: ${passedUserId})`);
        }
      }

      console.log(`🔧 AgentEnablementService: Processing structured enablement for ${agentId} (user: ${actualUserId})`);

      if (!actualUserId || !agentId) {
        console.error('❌ AgentEnablementService: Missing required fields - userId:', actualUserId, 'agentId:', agentId);
        return;
      }

      // Save agent to assistant_personalizations
      const { error } = await supabase
        .from('assistant_personalizations')
        .upsert({
          user_id: actualUserId,
          assistant_id: agentId,
          custom_name: customName,
          communication_tone: communicationTone || 'professional',
          is_enabled: true,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('❌ AgentEnablementService: Database error:', error);
      } else {
        console.log('✅ AgentEnablementService: Agent enabled successfully via structured format');

        // Save ONE-TIME config to profiles table (only if not "REUSE_EXISTING")
        // This ensures first agent sets these values, additional agents skip
        if (targetAudience && targetAudience !== 'REUSE_EXISTING') {
          console.log('📝 AgentEnablementService: Saving one-time config to profiles (first agent)');

          const profileUpdate: Record<string, any> = {};

          if (targetAudience && targetAudience !== 'REUSE_EXISTING') {
            profileUpdate.target_audience = targetAudience;
          }

          if (primaryGoals && primaryGoals !== 'REUSE_EXISTING') {
            // Store as comma-separated string
            profileUpdate.primary_goals = Array.isArray(primaryGoals) ? primaryGoals.join(', ') : primaryGoals;
          }

          if (Object.keys(profileUpdate).length > 0) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdate)
              .eq('user_id', actualUserId);

            if (profileError) {
              console.error('❌ AgentEnablementService: Error saving one-time config to profiles:', profileError);
            } else {
              console.log('✅ AgentEnablementService: One-time config saved to profiles:', profileUpdate);
            }
          }
        } else {
          console.log('ℹ️ AgentEnablementService: Additional agent - skipping one-time config save (REUSE_EXISTING)');
        }

        this.refreshAgentSidebar();
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling structured enablement:', error);
    }
  }
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;
