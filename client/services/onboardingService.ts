import { supabase } from '../lib/supabase';

export interface OnboardingAgentData {
  user_id: string;
  assistant_id: string;
  custom_name?: string;
  avatar_style?: 'professional' | 'friendly' | 'corporate' | 'creative';
  communication_tone?: 'professional' | 'friendly' | 'casual' | 'formal';
  custom_instructions?: string;
  is_enabled: boolean;
  // Additional onboarding-specific data
  target_audience?: 'b2c' | 'b2b' | 'both' | 'enterprise';
  primary_goals?: string;
  website_analysis?: string;
  brand_voice?: string;
}

export interface OnboardingSession {
  userId: string;
  websiteAnalyzed?: boolean;
  websiteUrl?: string;
  websiteAnalysis?: string;
  completedAgents: string[];
  currentStep?: number;
}

class OnboardingService {
  private static instance: OnboardingService;
  private currentSession: OnboardingSession | null = null;

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Initialize onboarding session for user
   */
  initializeSession(userId: string): OnboardingSession {
    this.currentSession = {
      userId,
      completedAgents: [],
      currentStep: 1
    };
    return this.currentSession;
  }

  /**
   * Get current onboarding session
   */
  getCurrentSession(): OnboardingSession | null {
    return this.currentSession;
  }

  /**
   * Store website analysis results
   */
  setWebsiteAnalysis(websiteUrl: string, analysis: string): void {
    if (this.currentSession) {
      this.currentSession.websiteAnalyzed = true;
      this.currentSession.websiteUrl = websiteUrl;
      this.currentSession.websiteAnalysis = analysis;
    }
  }

  /**
   * Enable an agent after completing onboarding
   */
  async enableAgent(agentData: OnboardingAgentData): Promise<boolean> {
    try {

      // Check if agent is already enabled
      const { data: existing, error: checkError } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', agentData.user_id)
        .eq('assistant_id', agentData.assistant_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ OnboardingService: Error checking existing agent:', checkError);
        throw checkError;
      }

      if (existing) {
        // Update existing agent
        const { error: updateError } = await supabase
          .from('assistant_personalizations')
          .update({
            is_enabled: true,
            communication_tone: agentData.communication_tone,
            custom_name: agentData.custom_name,
            custom_instructions: this.buildCustomInstructions(agentData),
            last_updated: new Date().toISOString()
          })
          .eq('user_id', agentData.user_id)
          .eq('assistant_id', agentData.assistant_id);

        if (updateError) {
          console.error('❌ OnboardingService: Error updating agent:', updateError);
          throw updateError;
        }

      } else {
        // Create new agent entry
        const { error: insertError } = await supabase
          .from('assistant_personalizations')
          .insert({
            user_id: agentData.user_id,
            assistant_id: agentData.assistant_id,
            custom_name: agentData.custom_name,
            avatar_style: agentData.avatar_style || 'professional',
            communication_tone: agentData.communication_tone || 'professional',
            custom_instructions: this.buildCustomInstructions(agentData),
            is_enabled: true
          });

        if (insertError) {
          console.error('❌ OnboardingService: Error creating agent:', insertError);
          throw insertError;
        }

      }

      // Add to completed agents in session
      if (this.currentSession) {
        if (!this.currentSession.completedAgents.includes(agentData.assistant_id)) {
          this.currentSession.completedAgents.push(agentData.assistant_id);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to enable agent:', error);
      return false;
    }
  }

  /**
   * Get enabled agents for a user
   */
  async getEnabledAgents(userId: string): Promise<OnboardingAgentData[]> {
    try {

      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) {
        console.error('❌ OnboardingService: Error fetching enabled agents:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ OnboardingService: Failed to fetch enabled agents:', error);
      return [];
    }
  }

  /**
   * Get count of enabled agents for a user
   */
  async getEnabledAgentsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('assistant_personalizations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true);

      if (error) {
        console.error('❌ OnboardingService: Error counting enabled agents:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to count enabled agents:', error);
      return 0;
    }
  }

  /**
   * Check if an agent is enabled for a user
   */
  async isAgentEnabled(userId: string, agentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('is_enabled')
        .eq('user_id', userId)
        .eq('assistant_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ OnboardingService: Error checking agent status:', error);
        return false;
      }

      return data?.is_enabled || false;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to check agent status:', error);
      return false;
    }
  }

  /**
   * Disable an agent for a user
   */
  async disableAgent(userId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assistant_personalizations')
        .update({ 
          is_enabled: false,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('assistant_id', agentId);

      if (error) {
        console.error('❌ OnboardingService: Error disabling agent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to disable agent:', error);
      return false;
    }
  }

  /**
   * Build custom instructions based on onboarding data
   */
  private buildCustomInstructions(agentData: OnboardingAgentData): string {
    const instructions: string[] = [];

    if (agentData.communication_tone) {
      instructions.push(`Communication tone: ${agentData.communication_tone}`);
    }

    if (agentData.target_audience) {
      instructions.push(`Target audience: ${agentData.target_audience.toUpperCase()}`);
    }

    if (agentData.primary_goals) {
      instructions.push(`Primary goals: ${agentData.primary_goals}`);
    }

    if (agentData.brand_voice) {
      instructions.push(`Brand voice: ${agentData.brand_voice}`);
    }

    if (this.currentSession?.websiteAnalysis) {
      instructions.push(`Company context: ${this.currentSession.websiteAnalysis}`);
    }

    return instructions.join(' | ');
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
  }

  /**
   * Get agent configuration for enabled agents
   */
  async getAgentCustomization(userId: string, agentId: string): Promise<OnboardingAgentData | null> {
    try {
      const { data, error } = await supabase
        .from('assistant_personalizations')
        .select('*')
        .eq('user_id', userId)
        .eq('assistant_id', agentId)
        .eq('is_enabled', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ OnboardingService: Error fetching agent customization:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to fetch agent customization:', error);
      return null;
    }
  }

  /**
   * Update agent customization
   */
  async updateAgentCustomization(userId: string, agentId: string, updates: Partial<OnboardingAgentData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assistant_personalizations')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('assistant_id', agentId);

      if (error) {
        console.error('❌ OnboardingService: Error updating agent customization:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ OnboardingService: Failed to update agent customization:', error);
      return false;
    }
  }
}

export default OnboardingService;