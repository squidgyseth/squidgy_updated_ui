import { supabase } from '../lib/supabase';

export interface ChatSession {
  session_id: string;
  agent_id: string;
  agent_name: string;
  last_message_timestamp: string;
  last_message_preview: string;
  message_count: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: string;
  message: string;
  timestamp: string;
  agent_name: string;
  agent_id: string;
  execution_id?: string | number;
  workflow_id?: string;
  file_url?: string;
  file_name?: string;
}

class ChatSessionService {
  private static instance: ChatSessionService;
  private readonly SESSION_STORAGE_KEY = 'squidgy_active_sessions';

  static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Get stored session ID from localStorage for a specific agent
   */
  private getStoredSessionId(userId: string, agentId: string): string | null {
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        const key = `${userId}_${agentId}`;
        const sessionData = sessions[key];
        if (sessionData) {
          // Check if session was created within the last hour
          const createdAt = new Date(sessionData.createdAt);
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreation < 1) {
            return sessionData.sessionId;
          }
        }
      }
    } catch (error) {
      console.error('Error reading stored session:', error);
    }
    return null;
  }

  /**
   * Store session ID in localStorage for a specific agent
   */
  public storeSessionId(userId: string, agentId: string, sessionId: string): void {
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      const sessions = stored ? JSON.parse(stored) : {};
      const key = `${userId}_${agentId}`;
      sessions[key] = {
        sessionId,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Clear stored session ID for a specific agent (called when user clicks New Chat)
   */
  clearStoredSessionId(userId: string, agentId: string): void {
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        const key = `${userId}_${agentId}`;
        delete sessions[key];
        localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error clearing stored session:', error);
    }
  }

  /**
   * Get recent chat sessions for a user and agent
   */
  async getRecentSessions(userId: string, agentId: string, limit = 2): Promise<ChatSession[]> {
    try {
      
      const { data, error } = await supabase
        .from('chat_history')
        .select(`
          session_id,
          agent_id,
          agent_name,
          timestamp,
          message,
          sender
        `)
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error fetching chat sessions:', error);
        throw error;
      }


      if (!data || data.length === 0) {
        return [];
      }

      // Group messages by session_id and get session stats
      const sessionMap = new Map<string, {
        session_id: string;
        agent_id: string;
        agent_name: string;
        latest_timestamp: string;
        latest_message: string;
        message_count: number;
        has_user_message: boolean;
      }>();

      data.forEach(row => {
        const existingSession = sessionMap.get(row.session_id);
        
        if (!existingSession) {
          // Create new session entry
          sessionMap.set(row.session_id, {
            session_id: row.session_id,
            agent_id: row.agent_id,
            agent_name: row.agent_name,
            latest_timestamp: row.timestamp,
            latest_message: row.message.substring(0, 100), // Preview first 100 chars
            message_count: 1,
            has_user_message: row.sender === 'User'
          });
        } else {
          // Update existing session
          existingSession.message_count++;
          // Check if this session has any user messages
          if (row.sender === 'User') {
            existingSession.has_user_message = true;
          }
          // Since data is sorted by timestamp DESC, the first message for each session is the latest
          // So we don't need to update latest_timestamp and latest_message after the first one
        }
      });


      // Filter out sessions that only have intro messages (no user messages)
      // Convert to array and sort by latest timestamp (most recent first)
      const sessions = Array.from(sessionMap.values())
        .filter(session => session.has_user_message) // Only show sessions with actual conversations
        .sort((a, b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime())
        .slice(0, limit);

      sessions.forEach((session, index) => {
      });

      return sessions.map(session => ({
        session_id: session.session_id,
        agent_id: session.agent_id,
        agent_name: session.agent_name,
        last_message_timestamp: session.latest_timestamp,
        last_message_preview: session.latest_message,
        message_count: session.message_count
      }));

    } catch (error) {
      console.error('❌ Error in getRecentSessions:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a specific session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      
      const { data, error } = await supabase
        .from('chat_history')
        .select(`
          id,
          session_id,
          sender,
          message,
          timestamp,
          agent_name,
          agent_id,
          execution_id,
          workflow_id,
          file_url,
          file_name
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error fetching session messages:', error);
        throw error;
      }

      if (data && data.length > 0) {
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getSessionMessages:', error);
      throw error;
    }
  }

  /**
   * Save a chat message to the database
   */
  async saveMessage(
    userId: string,
    sessionId: string,
    sender: string,
    message: string,
    agentName: string,
    agentId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          user_id: userId,
          session_id: sessionId,
          sender: sender,
          message: message,
          agent_name: agentName,
          agent_id: agentId,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving chat message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveMessage:', error);
      throw error;
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Generate a new session ID
   */
  generateSessionId(userId: string, agentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${agentId}_${timestamp}_${random}`;
  }

  /**
   * Get or create session with 1-hour persistence logic
   * Returns existing session if active within 1 hour, otherwise creates new one
   * Also checks localStorage for sessions without messages yet (preserves across navigation)
   */
  async getOrCreateActiveSession(userId: string, agentId: string): Promise<string> {
    try {
      
      // First check localStorage for a session that hasn't had messages yet
      const storedSessionId = this.getStoredSessionId(userId, agentId);
      if (storedSessionId) {
        return storedSessionId;
      }
      
      // Get the most recent session for this user+agent from database
      const recentSessions = await this.getRecentSessions(userId, agentId, 1);
      
      if (recentSessions.length > 0) {
        const mostRecentSession = recentSessions[0];
        const lastActivity = new Date(mostRecentSession.last_message_timestamp);
        const now = new Date();
        const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        
        if (hoursSinceLastActivity < 1) {
          // Store in localStorage for future navigation
          this.storeSessionId(userId, agentId, mostRecentSession.session_id);
          return mostRecentSession.session_id;
        } else {
        }
      } else {
      }
      
      // Create new session and store in localStorage
      const newSessionId = this.generateSessionId(userId, agentId);
      this.storeSessionId(userId, agentId, newSessionId);
      return newSessionId;
      
    } catch (error) {
      console.error('❌ Error in getOrCreateActiveSession:', error);
      // Fallback to creating new session
      const newSessionId = this.generateSessionId(userId, agentId);
      this.storeSessionId(userId, agentId, newSessionId);
      return newSessionId;
    }
  }
}

export const chatSessionService = ChatSessionService.getInstance();
export default ChatSessionService;