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

  parseOnboardingResponse(responseText: string): AgentEnablementData | null {
    try {
      const agentService = OptimizedAgentService.getInstance();
      const allAgents = agentService.getAllAgents();
      const responseTextLower = responseText.toLowerCase();
      
      // Alias mapping for agent names that differ from config names
      const agentAliases: Record<string, string> = {
        'content strategist': 'content_repurposer',
        'content strategist assistant': 'content_repurposer',
        'content strategist agent': 'content_repurposer'
      };
      
      // Check for alias matches first
      for (const [alias, agentId] of Object.entries(agentAliases)) {
        if (responseTextLower.includes(alias) && 
            (responseTextLower.includes('enabled') || responseTextLower.includes('configured'))) {
          const config = allAgents.find(c => c.agent.id === agentId);
          if (config) {
            console.log(`✅ AgentEnablementService: Found ${alias} -> ${agentId} via alias mapping`);
            return { agentId, customName: config.agent.name };
          }
        }
      }
      
      const enablementKeywords = ['enabled', 'configured', 'ready', 'available'];
      const enablementIndicators = ['✅', '✓', 'perfect!', 'great!', 'nice!'];
      
      for (const config of allAgents) {
        const agentName = config.agent.name;
        const agentId = config.agent.id;
        
        if (agentId === 'personal_assistant') continue;
        
        const agentNameWords = agentName.toLowerCase().split(/\s+/);
        
        let hasAgentNameWords = agentNameWords.every(word => 
          word.length > 2 && responseTextLower.includes(word)
        );
        
        if (!hasAgentNameWords && agentName.toLowerCase().includes('agent')) {
          const assistantVariation = agentNameWords.map(word => 
            word === 'agent' ? 'assistant' : word
          );
          hasAgentNameWords = assistantVariation.every(word => 
            word.length > 2 && responseTextLower.includes(word)
          );
        }
        
        const hasEnablementKeyword = enablementKeywords.some(keyword => 
          responseTextLower.includes(keyword)
        );
        
        const hasEnablementIndicator = enablementIndicators.some(indicator => 
          responseText.includes(indicator)
        );
        
        if (hasAgentNameWords && (hasEnablementKeyword || hasEnablementIndicator)) {
          console.log(`✅ AgentEnablementService: Found ${agentName} -> ${agentId} enablement`);
          return { agentId, customName: agentName };
        }
      }

      if (responseTextLower.includes('configured and enabled')) {
        for (const config of allAgents) {
          const agentName = config.agent.name;
          const agentId = config.agent.id;
          
          if (agentId === 'personal_assistant') continue;
          
          const agentWords = agentName.toLowerCase().split(/\s+/);
          let hasAllWords = agentWords.every(word => 
            word.length > 2 && responseTextLower.includes(word)
          );
          
          if (!hasAllWords && agentName.toLowerCase().includes('agent')) {
            const assistantVariation = agentWords.map(word => 
              word === 'agent' ? 'assistant' : word
            );
            hasAllWords = assistantVariation.every(word => 
              word.length > 2 && responseTextLower.includes(word)
            );
          }
          
          if (hasAllWords) {
            console.log(`✅ AgentEnablementService: Found ${agentName} -> ${agentId} via word matching`);
            return { agentId, customName: agentName };
          }
        }
      }
      
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
    const triggerPatterns = [
      /is now configured/i,
      /is now enabled/i,
      /is now ready/i,
      /Agent is available/i
    ];
    return triggerPatterns.some(pattern => pattern.test(responseText));
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
      
      // If we see enablement text in agent_response, create structured format
      if (typeof actualData === 'object' && actualData.agent_response && 
          typeof actualData.agent_response === 'string' &&
          (actualData.agent_response.includes('is now configured and enabled') ||
           actualData.agent_response.includes('configured and enabled'))) {
        console.log('🔄 AgentEnablementService: Creating structured format from enablement text');
        
        const agentInfo = this.parseOnboardingResponse(actualData.agent_response);
        if (agentInfo) {
          const enablementData = {
            finished: true,
            agent_data: agentInfo,
            user_id: actualData.user_id
          };
          
          console.log('✅ AgentEnablementService: Created structured enablement:', enablementData);
          return this.handleStructuredEnablement(enablementData);
        }
      }
      
      // Handle structured format (object with finished: true)
      if (typeof actualData === 'object' && actualData.finished === true && actualData.agent_data) {
        console.log('✅ AgentEnablementService: Processing structured agent enablement');
        return this.handleStructuredEnablement(actualData);
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
      
      const { error } = await supabase
        .from('assistant_personalizations')
        .upsert({
          user_id: actualUserId,
          assistant_id: agentId,
          custom_name: customName,
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
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;
