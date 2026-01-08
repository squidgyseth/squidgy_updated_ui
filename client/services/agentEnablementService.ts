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
  async enableAgentFromOnboarding(data: AgentEnablementData): Promise<boolean> {
    try {
      console.log('🎯 AgentEnablementService: Enabling agent from onboarding:', data);

      // Get current user from auth
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

      const actualUserId = profile.user_id;
      console.log(`🔍 AgentEnablementService: Using user_id from profiles: ${actualUserId}`);

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
   * This extracts agent data from N8N response patterns
   */
  parseOnboardingResponse(responseText: string): AgentEnablementData | null {
    try {
      console.log('🔍 AgentEnablementService: Parsing response text:', responseText.substring(0, 200) + '...');
      
      // Get all agents dynamically from config files
      const agentService = OptimizedAgentService.getInstance();
      const allAgents = agentService.getAllAgents();
      
      // Convert response to lowercase for flexible matching
      const responseTextLower = responseText.toLowerCase();
      
      // Keywords that indicate agent enablement
      const enablementKeywords = ['enabled', 'configured', 'ready', 'available'];
      const enablementIndicators = ['✅', '✓', 'perfect!', 'great!', 'nice!'];
      
      // Check for agent enablement using flexible keyword matching
      for (const config of allAgents) {
        const agentName = config.agent.name;
        const agentId = config.agent.id;
        
        // Extract key words from agent name for flexible matching
        const agentNameWords = agentName.toLowerCase().split(/\s+/);
        
        // Check if response contains agent name words AND enablement keywords
        const hasAgentNameWords = agentNameWords.every(word => 
          word.length > 2 && responseTextLower.includes(word)
        );
        
        const hasEnablementKeyword = enablementKeywords.some(keyword => 
          responseTextLower.includes(keyword)
        );
        
        const hasEnablementIndicator = enablementIndicators.some(indicator => 
          responseText.includes(indicator) // Check original text for emojis
        );
        
        // If we find agent name words + enablement keywords/indicators, consider it enabled
        if (hasAgentNameWords && (hasEnablementKeyword || hasEnablementIndicator)) {
          console.log(`✅ AgentEnablementService: Found ${agentName} -> ${agentId} enablement via keyword matching`);
          console.log(`🔍 Agent name words found: ${agentNameWords.join(', ')}`);
          console.log(`🔍 Enablement keyword found: ${hasEnablementKeyword}`);
          console.log(`🔍 Enablement indicator found: ${hasEnablementIndicator}`);
          
          return {
            agentId: agentId,
            customName: agentName
          };
        }
      }

      console.log('❌ AgentEnablementService: No agent enablement pattern matched using flexible keyword matching');
      console.log('🔍 AgentEnablementService: Available agents:', allAgents.map(a => a.agent.name));
      console.log('🔍 AgentEnablementService: Response text to parse:', responseText.substring(0, 500));
      
      // Fallback: Look for specific phrases like "configured and enabled" or "successfully set up"
      for (const config of allAgents) {
        const agentName = config.agent.name;
        const agentId = config.agent.id;
        
        // Look for common enablement phrases in the text
        const enablementPhrases = [
          `${agentName} configured and enabled`,
          `${agentName} is now configured and enabled`,
          `successfully set up the ${agentName}`,
          `${agentName} configured and ready`,
          `${agentName} Assistant configured and enabled`,
          `${agentName} Agent configured and enabled`,
          'configured and enabled'  // Generic fallback
        ];
        
        const foundPhrase = enablementPhrases.find(phrase => 
          responseTextLower.includes(phrase.toLowerCase())
        );
        
        if (foundPhrase) {
          console.log(`✅ AgentEnablementService: Found ${agentName} -> ${agentId} enablement via fallback phrase: "${foundPhrase}"`);
          
          return {
            agentId: agentId,
            customName: agentName
          };
        }
      }
      
      console.log('❌ AgentEnablementService: No enablement patterns found with any method');
      return null;

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
  async handleOnboardingResponse(responseData: any): Promise<void> {
    try {
      console.log('🔍 AgentEnablementService: Received responseData:', responseData);
      
      // Handle structured format (object with finished: true)
      if (typeof responseData === 'object' && responseData.finished === true && responseData.agent_data) {
        console.log('✅ AgentEnablementService: Processing structured agent enablement');
        
        const agentData: AgentEnablementData = {
          agentId: responseData.agent_data.agent_id,
          customName: responseData.agent_data.agent_name,
          communicationTone: responseData.agent_data.communication_tone,
          targetAudience: responseData.agent_data.target_audience,
          primaryGoals: responseData.agent_data.primary_goals,
          brandVoice: responseData.agent_data.brand_voice
        };

        await this.enableAgentFromOnboarding(agentData);
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