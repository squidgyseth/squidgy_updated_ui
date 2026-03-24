import DatabaseAgentService from './databaseAgentService';

// ============================================================================
// DEV IMPLEMENTATION (COMMENTED OUT)
// This implementation uses OnboardingService and handles structured enablement
// with profile updates. Uncomment if you need this approach instead of relying
// on n8n Enable_Agent tool.
// ============================================================================
/*
import OnboardingService, { OnboardingAgentData } from './onboardingService';
import { supabase } from '../lib/supabase';

export interface AgentEnablementData {
  agentId: string;
  customName?: string;
  communicationTone?: 'professional' | 'friendly' | 'casual' | 'formal';
  targetAudience?: 'b2c' | 'b2b' | 'both' | 'enterprise';
  primaryGoals?: string[];
  brandVoice?: string;
}

// DEV: enableAgentFromOnboarding method
async enableAgentFromOnboarding(data: AgentEnablementData, userId?: string): Promise<boolean> {
  try {

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

// DEV: parseOnboardingResponse method
async parseOnboardingResponse(responseText: string): Promise<AgentEnablementData | null> {
  try {

    const agentService = DatabaseAgentService.getInstance();
    const allAgents = await agentService.getAllAgents();

    const sortedAgents = [...allAgents].sort((a, b) =>
      b.agent.name.length - a.agent.name.length
    );

    const textLower = responseText.toLowerCase();

    const enablementKeywords = ['enabled', 'configured', 'ready', 'available', 'activated', 'set up'];
    const enablementIndicators = ['✅', '✓', '🎉'];

    const hasAgentOrAssistant = textLower.includes('agent') || textLower.includes('assistant');
    const hasEnablement = enablementKeywords.some(kw => textLower.includes(kw)) ||
                         enablementIndicators.some(ind => responseText.includes(ind));

    if (!hasEnablement) {
      return null;
    }

    for (const config of sortedAgents) {
      const agentName = config.agent.name;
      const agentId = config.agent.id;

      if (agentId === 'personal_assistant') {
        continue;
      }

      const nameWords = agentName.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && word !== 'agent' && word !== 'assistant');

      const hasAllNameWords = nameWords.every(word => textLower.includes(word));

      if (hasAllNameWords && (hasAgentOrAssistant || hasEnablement)) {
        return {
          agentId: agentId,
          customName: agentName
        };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ AgentEnablementService: Error parsing response:', error);
    return null;
  }
}

// DEV: shouldTriggerEnablement method
shouldTriggerEnablement(responseText: string): boolean {
  const textLower = responseText.toLowerCase();
  const enablementKeywords = ['enabled', 'configured', 'ready', 'available', 'activated', 'set up'];
  const enablementIndicators = ['✅', '✓', '🎉'];

  return enablementKeywords.some(kw => textLower.includes(kw)) ||
         enablementIndicators.some(ind => responseText.includes(ind));
}

// DEV: handleStructuredEnablement method
private async handleStructuredEnablement(data: any): Promise<void> {
  try {
    const passedUserId = data.user_id;
    const agentData = data.agent_data;

    const agentId = agentData.agentId || agentData.agent_id;
    const customName = agentData.customName || agentData.agent_name;
    const communicationTone = agentData.communication_tone || agentData.communicationTone;
    const targetAudience = agentData.target_audience || agentData.targetAudience;
    const primaryGoals = agentData.primary_goals || agentData.primaryGoals;

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
      }
    }

    if (!actualUserId || !agentId) {
      console.error('❌ AgentEnablementService: Missing required fields');
      return;
    }

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

      if (targetAudience && targetAudience !== 'REUSE_EXISTING') {
        const profileUpdate: Record<string, any> = {};

        if (targetAudience && targetAudience !== 'REUSE_EXISTING') {
          profileUpdate.target_audience = targetAudience;
        }

        if (primaryGoals && primaryGoals !== 'REUSE_EXISTING') {
          profileUpdate.primary_goals = Array.isArray(primaryGoals) ? primaryGoals : [primaryGoals];
        }

        if (Object.keys(profileUpdate).length > 0) {
          await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('user_id', actualUserId);
        }
      }

      this.refreshAgentSidebar();
    }
  } catch (error) {
    console.error('❌ AgentEnablementService: Error handling structured enablement:', error);
  }
}
*/
// ============================================================================
// END DEV IMPLEMENTATION
// ============================================================================

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

  private async buildAgentNameMapping(): Promise<void> {
    try {
      const agentService = DatabaseAgentService.getInstance();
      const allAgents = await agentService.getAllAgents();
      
      this.agentNameToIdMap = {};
      allAgents.forEach(config => {
        if (config.agent?.name && config.agent?.id) {
          this.agentNameToIdMap[config.agent.name] = config.agent.id;
        }
      });
      
    } catch (error) {
      console.error('❌ AgentEnablementService: Error building agent mapping:', error);
      this.agentNameToIdMap = {};
    }
  }

  private refreshAgentSidebar(): void {
    try {
      if ((window as any).refreshAgentSidebar) {
        (window as any).refreshAgentSidebar();
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error refreshing sidebar:', error);
    }
  }

  private showEnablementNotification(agentId: string): void {
    try {
      // Convert agent_id to readable name (e.g., social_media_agent → Social Media Agent)
      const agentName = agentId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

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

  refreshAgentMapping(): void {
    this.buildAgentNameMapping();
  }

  getAgentMapping(): Record<string, string> {
    return { ...this.agentNameToIdMap };
  }

  async handleOnboardingResponse(responseData: any, userId?: string): Promise<void> {
    try {

      let actualData = responseData;
      if (Array.isArray(responseData) && responseData.length > 0) {
        actualData = responseData[0];
      }

      // Check actions_performed for Enable_Agent tool call (SOURCE OF TRUTH)
      if (typeof actualData === 'object' && Array.isArray(actualData.actions_performed)) {
        const enableAction = actualData.actions_performed.find((action: any) =>
          action.action === 'Enable_Agent' && action.result === 'success'
        );

        if (enableAction && enableAction.input?.fieldValues2_Field_Value) {
          const agentId = enableAction.input.fieldValues2_Field_Value;

          // n8n Enable_Agent tool already inserted into assistant_personalizations
          // n8n Save_User_Settings tool already updated profiles table
          // Frontend just needs to: refresh sidebar + show notification
          this.refreshAgentSidebar();
          this.showEnablementNotification(agentId);

          return;
        }
      }

    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling onboarding response:', error);
    }
  }
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;
