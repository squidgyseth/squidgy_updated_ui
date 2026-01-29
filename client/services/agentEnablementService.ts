import OptimizedAgentService from './optimizedAgentService';

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
          console.log('🔍 AgentEnablementService: n8n Enable Agent tool already saved to database');
          console.log('   → Just refreshing sidebar to display the enabled agent');

          // n8n Enable_Agent tool already inserted into assistant_personalizations
          // n8n Save_User_Settings tool already updated profiles table
          // Frontend just needs to: refresh sidebar + show notification
          this.refreshAgentSidebar();
          this.showEnablementNotification(agentId);

          console.log('✅ AgentEnablementService: Agent enablement handled successfully');
          return;
        }
      }

      console.log('❌ AgentEnablementService: No agent enablement action detected');
      console.log('   Expected: actions_performed array with Enable_Agent action');
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling onboarding response:', error);
    }
  }
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;
