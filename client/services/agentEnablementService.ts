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

      // Check actions_performed for Enable_Agent tool call (SOURCE OF TRUTH)
      if (typeof actualData === 'object' && Array.isArray(actualData.actions_performed)) {
        const enableAction = actualData.actions_performed.find((action: any) =>
          action.action === 'Enable_Agent' && action.result === 'success'
        );

        if (enableAction && enableAction.input?.fieldValues2_Field_Value) {
          const agentId = enableAction.input.fieldValues2_Field_Value;
          console.log('✅ AgentEnablementService: Detected Enable_Agent in actions_performed');
          console.log('   agent_id:', agentId);

          const enablementData = {
            agent_data: {
              agent_id: agentId,
              agent_name: agentId.replace(/_/g, ' ')
            },
            user_id: actualData.user_id
          };

          return this.handleStructuredEnablement(enablementData);
        }
      }

      console.log('❌ AgentEnablementService: No agent enablement action detected');
      console.log('   Expected: actions_performed array with Enable_Agent action');
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
