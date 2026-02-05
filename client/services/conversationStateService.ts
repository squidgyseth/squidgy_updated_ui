import { supabase } from '../lib/supabase';

/**
 * Default conversation state structure
 * Used for agents like Newsletter Multi, Social Media Multi, etc.
 */
export interface ConversationState {
  phase: 'initial' | 'topic_selection' | 'gathering' | 'ready' | 'completed';
  selected_topics: string[];
  current_topic_index: number;
  current_question_index: number;
  answers: Record<string, Record<string, string>>;
  [key: string]: unknown; // Allow additional properties for agent-specific data
}

export interface ConversationStateRecord {
  id: string;
  session_id: string;
  agent_id: string;
  firm_user_id: string;
  state: ConversationState;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/**
 * Default conversation state
 * Used for any agent with uses_conversation_state: true in YAML config
 */
export const DEFAULT_STATE: ConversationState = {
  phase: 'topic_selection',
  selected_topics: [],
  current_topic_index: 0,
  current_question_index: 0,
  answers: {}
};

/**
 * Service for managing multi-turn conversation state for AI agents
 * This allows agents to maintain context across multiple messages
 */
class ConversationStateService {
  private static instance: ConversationStateService;

  static getInstance(): ConversationStateService {
    if (!ConversationStateService.instance) {
      ConversationStateService.instance = new ConversationStateService();
    }
    return ConversationStateService.instance;
  }

  /**
   * Get the default state for any agent with conversation state enabled
   */
  getDefaultState(): ConversationState {
    return { ...DEFAULT_STATE };
  }

  /**
   * Get conversation state for a session
   * Returns null if no state exists
   */
  async getState(sessionId: string, agentId: string): Promise<ConversationState | null> {
    try {

      const { data, error } = await supabase
        .from('agent_conversation_state')
        .select('state')
        .eq('session_id', sessionId)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        console.error('❌ Error fetching conversation state:', error);
        throw error;
      }

      return data.state as ConversationState;
    } catch (error) {
      console.error('❌ Error in getState:', error);
      return null;
    }
  }

  /**
   * Get or create conversation state
   * If state exists, returns it; otherwise creates new with default state
   */
  async getOrCreateState(
    sessionId: string,
    agentId: string,
    userId: string
  ): Promise<ConversationState> {
    try {

      // Try to get existing state
      const existingState = await this.getState(sessionId, agentId);
      if (existingState) {
        return existingState;
      }

      // Create new state
      const defaultState = this.getDefaultState();

      const { data, error } = await supabase
        .from('agent_conversation_state')
        .insert({
          session_id: sessionId,
          agent_id: agentId,
          firm_user_id: userId,
          state: defaultState,
          status: 'active'
        })
        .select('state')
        .single();

      if (error) {
        // Handle race condition - if another request created the state
        if (error.code === '23505') { // Unique violation
          const existingState = await this.getState(sessionId, agentId);
          return existingState || defaultState;
        }
        console.error('❌ Error creating conversation state:', error);
        throw error;
      }

      return data.state as ConversationState;
    } catch (error) {
      console.error('❌ Error in getOrCreateState:', error);
      // Return default state as fallback
      return this.getDefaultState();
    }
  }

  /**
   * Update conversation state
   */
  async updateState(
    sessionId: string,
    agentId: string,
    newState: ConversationState,
    status: 'active' | 'completed' | 'abandoned' = 'active'
  ): Promise<boolean> {
    try {

      const { error } = await supabase
        .from('agent_conversation_state')
        .update({
          state: newState,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('agent_id', agentId);

      if (error) {
        console.error('❌ Error updating conversation state:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in updateState:', error);
      return false;
    }
  }

  /**
   * Save state from AI response
   * Parses AI response JSON and extracts state for persistence
   */
  async saveStateFromAIResponse(
    sessionId: string,
    agentId: string,
    aiResponseJson: string | object
  ): Promise<boolean> {
    try {

      let parsed: { state?: ConversationState; Status?: string };

      if (typeof aiResponseJson === 'string') {
        parsed = JSON.parse(aiResponseJson);
      } else {
        parsed = aiResponseJson as { state?: ConversationState; Status?: string };
      }

      if (!parsed.state) {
        return false;
      }

      // Determine status based on AI response
      const status = parsed.Status === 'Ready' ? 'completed' : 'active';

      return await this.updateState(sessionId, agentId, parsed.state, status);
    } catch (error) {
      console.error('❌ Error in saveStateFromAIResponse:', error);
      return false;
    }
  }

  /**
   * Mark conversation as completed
   */
  async markCompleted(sessionId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_conversation_state')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('agent_id', agentId);

      if (error) {
        console.error('❌ Error marking conversation as completed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in markCompleted:', error);
      return false;
    }
  }

  /**
   * Mark conversation as abandoned
   */
  async markAbandoned(sessionId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_conversation_state')
        .update({
          status: 'abandoned',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('agent_id', agentId);

      if (error) {
        console.error('❌ Error marking conversation as abandoned:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in markAbandoned:', error);
      return false;
    }
  }

  /**
   * Delete conversation state (for cleanup)
   */
  async deleteState(sessionId: string, agentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_conversation_state')
        .delete()
        .eq('session_id', sessionId)
        .eq('agent_id', agentId);

      if (error) {
        console.error('❌ Error deleting conversation state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in deleteState:', error);
      return false;
    }
  }

  /**
   * Get all active conversations for a user and agent
   */
  async getActiveConversations(userId: string, agentId: string): Promise<ConversationStateRecord[]> {
    try {
      const { data, error } = await supabase
        .from('agent_conversation_state')
        .select('*')
        .eq('firm_user_id', userId)
        .eq('agent_id', agentId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching active conversations:', error);
        throw error;
      }

      return (data || []) as ConversationStateRecord[];
    } catch (error) {
      console.error('❌ Error in getActiveConversations:', error);
      return [];
    }
  }

  /**
   * Reset conversation state to initial
   * Useful when user wants to start over
   */
  async resetState(sessionId: string, agentId: string): Promise<boolean> {
    try {
      const defaultState = this.getDefaultState();

      const { error } = await supabase
        .from('agent_conversation_state')
        .update({
          state: defaultState,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('agent_id', agentId);

      if (error) {
        console.error('❌ Error resetting conversation state:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in resetState:', error);
      return false;
    }
  }
}

export const conversationStateService = ConversationStateService.getInstance();
export default ConversationStateService;
