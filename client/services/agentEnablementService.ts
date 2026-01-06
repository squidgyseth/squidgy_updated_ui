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

class AgentEnablementService {
  private static instance: AgentEnablementService;

  static getInstance(): AgentEnablementService {
    if (!AgentEnablementService.instance) {
      AgentEnablementService.instance = new AgentEnablementService();
    }
    return AgentEnablementService.instance;
  }

  /**
   * Enable an agent after Step 5 completion
   * This function is designed to be called from N8N webhook responses
   */
  async enableAgentFromOnboarding(data: AgentEnablementData): Promise<boolean> {
    try {
      console.log('🎯 AgentEnablementService: Enabling agent from onboarding:', data);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ AgentEnablementService: No authenticated user');
        return false;
      }

      // Prepare agent data for onboarding service
      const agentData: OnboardingAgentData = {
        user_id: user.id,
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
   * This extracts agent data from N8N response patterns
   */
  parseOnboardingResponse(responseText: string): AgentEnablementData | null {
    try {
      // Simplified: look for any agent name followed by enablement words
      const step5Patterns = [
        /(.+?) (?:Agent|Assistant)? is now (?:configured|enabled|ready)/i,
        /Your (.+?) is now (?:configured|enabled|ready)/i,
        /(.+?) is available in .+ sidebar/i
      ];

      let agentName = '';
      for (const pattern of step5Patterns) {
        const match = responseText.match(pattern);
        if (match) {
          agentName = match[1].trim();
          break;
        }
      }

      if (!agentName) {
        return null;
      }

      // Simple agent name to ID mapping - using exact names from config files
      const agentNameToId: Record<string, string> = {
        'SMM Assistant': 'smm_assistant',
        'Content Repurposer': 'content_repurposer', 
        'Newsletter Agent': 'newsletter',
        'SOL Bot': 'SOL'
      };

      // Direct mapping - no aggressive cleaning
      const agentId = agentNameToId[agentName] || agentName.toLowerCase().replace(/ /g, '_');

      // Extract additional data from conversation context
      const data: AgentEnablementData = {
        agentId,
        customName: agentName !== agentId ? agentName : undefined
      };

      // Try to extract communication tone
      const tonePatterns = [
        /tone of voice.*?(\w+)/i,
        /brand voice.*?(\w+)/i,
        /communication.*?(\w+)/i
      ];

      for (const pattern of tonePatterns) {
        const match = responseText.match(pattern);
        if (match) {
          const tone = match[1].toLowerCase();
          if (['professional', 'friendly', 'casual', 'formal'].includes(tone)) {
            data.communicationTone = tone as any;
            break;
          }
        }
      }

      // Try to extract target audience
      const audiencePatterns = [
        /target audience.*?(B2C|B2B|Enterprise|Both)/i,
        /targeting.*?(B2C|B2B|Enterprise|Both)/i
      ];

      for (const pattern of audiencePatterns) {
        const match = responseText.match(pattern);
        if (match) {
          const audience = match[1].toLowerCase();
          switch (audience) {
            case 'b2c':
              data.targetAudience = 'b2c';
              break;
            case 'b2b':
              data.targetAudience = 'b2b';
              break;
            case 'both':
              data.targetAudience = 'both';
              break;
            case 'enterprise':
              data.targetAudience = 'enterprise';
              break;
          }
          break;
        }
      }

      // Try to extract primary goals
      const goalPatterns = [
        /Generate more leads/i,
        /Close more deals/i,
        /Improve customer support/i,
        /Streamline marketing/i,
        /Manage sales pipeline/i,
        /All of the above/i
      ];

      const extractedGoals: string[] = [];
      for (const pattern of goalPatterns) {
        if (pattern.test(responseText)) {
          extractedGoals.push(pattern.source.replace(/[/\\^$*+?.()|[\]{}]/g, ''));
        }
      }

      if (extractedGoals.length > 0) {
        data.primaryGoals = extractedGoals;
      }

      console.log('🎯 AgentEnablementService: Parsed onboarding data:', data);
      return data;

    } catch (error) {
      console.error('❌ AgentEnablementService: Error parsing onboarding response:', error);
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
    // Simplified: just look for basic enablement indicators
    const triggerPatterns = [
      /is now configured/i,
      /is now enabled/i,
      /is now ready/i,
      /Agent is available/i
    ];

    return triggerPatterns.some(pattern => pattern.test(responseText));
  }

  /**
   * Main function to be called from N8N response handler
   */
  async handleOnboardingResponse(responseText: string): Promise<void> {
    try {
      if (!this.shouldTriggerEnablement(responseText)) {
        return;
      }

      const agentData = this.parseOnboardingResponse(responseText);
      if (agentData) {
        await this.enableAgentFromOnboarding(agentData);
      }
    } catch (error) {
      console.error('❌ AgentEnablementService: Error handling onboarding response:', error);
    }
  }
}

// Expose to window for N8N webhook integration
(window as any).agentEnablementService = AgentEnablementService.getInstance();

export default AgentEnablementService;