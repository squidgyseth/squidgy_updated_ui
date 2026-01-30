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
}

class ChatSessionService {
  private static instance: ChatSessionService;

  static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Get recent chat sessions for a user and agent
   */
  async getRecentSessions(userId: string, agentId: string, limit = 2): Promise<ChatSession[]> {
    try {
      console.log(`🔍 getRecentSessions: Fetching sessions for userId=${userId}, agentId=${agentId}`);
      
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

      console.log(`📊 Found ${data?.length || 0} total messages for user+agent`);

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

      console.log(`📋 Grouped into ${sessionMap.size} unique sessions`);

      // Filter out sessions that only have intro messages (no user messages)
      // Convert to array and sort by latest timestamp (most recent first)
      const sessions = Array.from(sessionMap.values())
        .filter(session => session.has_user_message) // Only show sessions with actual conversations
        .sort((a, b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime())
        .slice(0, limit);

      console.log(`✅ Filtered to ${sessions.length} sessions with real conversations`);
      console.log(`✅ Returning ${sessions.length} most recent sessions`);
      sessions.forEach((session, index) => {
        console.log(`📝 Session ${index + 1}: ${session.session_id} (${session.message_count} messages, latest: ${session.latest_timestamp})`);
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
      console.log(`📨 getSessionMessages: Fetching messages for sessionId=${sessionId}`);
      
      const { data, error } = await supabase
        .from('chat_history')
        .select(`
          id,
          session_id,
          sender,
          message,
          timestamp,
          agent_name,
          agent_id
        `)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error fetching session messages:', error);
        throw error;
      }

      console.log(`📊 Found ${data?.length || 0} messages for session ${sessionId}`);
      if (data && data.length > 0) {
        console.log(`📝 First message: ${data[0].message.substring(0, 50)}...`);
        console.log(`📝 Last message: ${data[data.length - 1].message.substring(0, 50)}...`);
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
   */
  async getOrCreateActiveSession(userId: string, agentId: string): Promise<string> {
    try {
      console.log(`🔄 getOrCreateActiveSession: Checking for active session for userId=${userId}, agentId=${agentId}`);
      
      // Get the most recent session for this user+agent
      const recentSessions = await this.getRecentSessions(userId, agentId, 1);
      
      if (recentSessions.length > 0) {
        const mostRecentSession = recentSessions[0];
        const lastActivity = new Date(mostRecentSession.last_message_timestamp);
        const now = new Date();
        const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        console.log(`⏱️ Last activity: ${lastActivity.toISOString()}`);
        console.log(`⏱️ Hours since last activity: ${hoursSinceLastActivity.toFixed(2)}`);
        
        if (hoursSinceLastActivity < 1) {
          console.log(`✅ Session still active within 1 hour, continuing session: ${mostRecentSession.session_id}`);
          return mostRecentSession.session_id;
        } else {
          console.log(`⏰ Session expired (${hoursSinceLastActivity.toFixed(2)} hours), creating new session`);
        }
      } else {
        console.log(`📭 No recent sessions found, creating new session`);
      }
      
      // Create new session
      const newSessionId = this.generateSessionId(userId, agentId);
      console.log(`🆕 Created new session: ${newSessionId}`);
      return newSessionId;
      
    } catch (error) {
      console.error('❌ Error in getOrCreateActiveSession:', error);
      // Fallback to creating new session
      const newSessionId = this.generateSessionId(userId, agentId);
      console.log(`🆘 Fallback: Created new session due to error: ${newSessionId}`);
      return newSessionId;
    }
  }
}

export const chatSessionService = ChatSessionService.getInstance();
export default ChatSessionService;