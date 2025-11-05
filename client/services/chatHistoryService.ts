/**
 * Chat History Service
 * Handles all database operations for chat_history table
 */

import { supabase } from '../lib/supabase';

export interface ChatHistoryRecord {
  id?: string;
  user_id: string;
  session_id: string;
  sender: 'User' | 'Agent';
  message: string;
  timestamp?: string;
  created_at?: string;
  agent_name: string;
  agent_id: string;
  message_hash?: string;
}

export interface ChatSession {
  session_id: string;
  agent_name: string;
  agent_id: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
}

export interface NewsletterHistory {
  id: string;
  session_id: string;
  agent_id: string;
  message: string;
  timestamp: string;
  created_at: string;
}

export interface SocialContentHistory {
  id: string;
  session_id: string;
  message: string;
  timestamp: string;
  created_at: string;
}

export class ChatHistoryService {
  private static instance: ChatHistoryService;

  private constructor() {}

  static getInstance(): ChatHistoryService {
    if (!ChatHistoryService.instance) {
      ChatHistoryService.instance = new ChatHistoryService();
    }
    return ChatHistoryService.instance;
  }

  /**
   * Save a message to chat history
   */
  async saveMessage(record: ChatHistoryRecord): Promise<boolean> {
    try {
      // Generate message hash for deduplication
      const messageHash = await this.generateMessageHash(
        record.user_id,
        record.session_id,
        record.message,
        record.sender
      );

      const chatHistoryId = crypto.randomUUID();
      
      const { error } = await supabase
        .from('chat_history')
        .insert({
          id: chatHistoryId,
          user_id: record.user_id,
          session_id: record.session_id,
          sender: record.sender,
          message: record.message,
          timestamp: record.timestamp || new Date().toISOString(),
          agent_name: record.agent_name,
          agent_id: record.agent_id,
          message_hash: messageHash
        });

      if (error) {
        console.error('Error saving chat message:', error);
        return false;
      }

      // If this is a content_repurposer agent response, save to history_content_repurposer table
      if (record.agent_id === 'content_repurposer' && record.sender === 'Agent') {
        try {
          const { contentRepurposerApi } = await import('../lib/supabase-api');
          
          // Generate title with format
          const currentDate = new Date().toISOString().split('T')[0];
          const contentNumber = Math.floor(Math.random() * 9999) + 1;
          const generatedTitle = `ContentRepurpose_${contentNumber}_${currentDate}`;
          
          await contentRepurposerApi.upsertByChat({
            user_id: record.user_id,
            session_id: record.session_id,
            chat_history_id: chatHistoryId,
            agent_id: 'content_repurposer',
            title: generatedTitle,
            content: record.message,
            source_type: 'chat',
            target_formats: ['twitter', 'linkedin', 'instagram'] // Default formats
          });
        } catch (err) {
          console.error('Error saving to history_content_repurposer:', err);
          // Don't fail the main save if this fails
        }
      }

      // If this is a newsletter agent response, save to history_newsletters table
      if (record.agent_id === 'newsletter' && record.sender === 'Agent') {
        try {
          const { newslettersApi } = await import('../lib/supabase-api');
          
          // Generate title with format
          const currentDate = new Date().toISOString().split('T')[0];
          const newsletterNumber = Math.floor(Math.random() * 9999) + 1;
          const generatedTitle = `Newsletter_${newsletterNumber}_${currentDate}`;
          
          await newslettersApi.upsertByChat({
            user_id: record.user_id,
            session_id: record.session_id,
            chat_history_id: chatHistoryId,
            agent_id: 'newsletter',
            title: generatedTitle,
            content: record.message
          });
        } catch (err) {
          console.error('Error saving to history_newsletters:', err);
          // Don't fail the main save if this fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return false;
    }
  }

  /**
   * Get chat history for a specific session
   */
  async getSessionHistory(sessionId: string): Promise<ChatHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching session history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessionHistory:', error);
      return [];
    }
  }

  /**
   * Get all chat sessions for a user and specific agent
   */
  async getUserAgentSessions(
    userId: string, 
    agentId: string, 
    limit: number = 10
  ): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('session_id, agent_name, agent_id, message, timestamp')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching user agent sessions:', error);
        return [];
      }

      // Group by session and get the latest message for each
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach(record => {
        const existing = sessionMap.get(record.session_id);
        if (!existing) {
          sessionMap.set(record.session_id, {
            session_id: record.session_id,
            agent_name: record.agent_name,
            agent_id: record.agent_id,
            last_message: record.message,
            last_timestamp: record.timestamp,
            message_count: 1
          });
        } else {
          existing.message_count++;
          // Keep the latest timestamp and message
          if (new Date(record.timestamp) > new Date(existing.last_timestamp)) {
            existing.last_message = record.message;
            existing.last_timestamp = record.timestamp;
          }
        }
      });

      return Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getUserAgentSessions:', error);
      return [];
    }
  }

  /**
   * Get all sessions for a user (across all agents)
   */
  async getUserSessions(userId: string, limit: number = 20): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('session_id, agent_name, agent_id, message, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      // Group by session and get the latest message for each
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach(record => {
        const existing = sessionMap.get(record.session_id);
        if (!existing) {
          sessionMap.set(record.session_id, {
            session_id: record.session_id,
            agent_name: record.agent_name,
            agent_id: record.agent_id,
            last_message: record.message,
            last_timestamp: record.timestamp,
            message_count: 1
          });
        } else {
          existing.message_count++;
          if (new Date(record.timestamp) > new Date(existing.last_timestamp)) {
            existing.last_message = record.message;
            existing.last_timestamp = record.timestamp;
          }
        }
      });

      return Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  }

  /**
   * Delete a session (all messages in the session)
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  /**
   * Generate a hash for message deduplication
   */
  private async generateMessageHash(
    userId: string,
    sessionId: string,
    message: string,
    sender: string
  ): Promise<string> {
    const data = `${userId}-${sessionId}-${message}-${sender}-${Date.now()}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get summary statistics for a user
   */
  async getUserChatStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    agentBreakdown: { agent_name: string; session_count: number }[];
  }> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('session_id, agent_name')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user chat stats:', error);
        return { totalSessions: 0, totalMessages: 0, agentBreakdown: [] };
      }

      const sessions = new Set(data?.map(d => d.session_id) || []);
      const agentMap = new Map<string, number>();
      
      data?.forEach(record => {
        const count = agentMap.get(record.agent_name) || 0;
        agentMap.set(record.agent_name, count + 1);
      });

      const agentBreakdown = Array.from(agentMap.entries()).map(([agent_name, session_count]) => ({
        agent_name,
        session_count
      }));

      return {
        totalSessions: sessions.size,
        totalMessages: data?.length || 0,
        agentBreakdown
      };
    } catch (error) {
      console.error('Error in getUserChatStats:', error);
      return { totalSessions: 0, totalMessages: 0, agentBreakdown: [] };
    }
  }

  /**
   * Get all content_repurposer agent messages for a user
   */
  async getContentRepurposerHistory(userId: string): Promise<ChatHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', 'content_repurposer')
        .eq('sender', 'Agent')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching content repurposer history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getContentRepurposerHistory:', error);
      return [];
    }
  }

  /**
   * Get previous newsletters (HTML content from newsletter agent)
   */
  async getPreviousNewsletters(userId: string): Promise<NewsletterHistory[]> {
    try {
      console.log('🔍 QUERY: Fetching newsletters from history_newsletters for user:', userId);
      console.log('🔍 User ID type:', typeof userId);
      
      // Get newsletters from dedicated history_newsletters table
      const { data, error } = await supabase
        .from('history_newsletters')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);

      console.log('📰 QUERY RESULT: newsletters from history_newsletters count:', data?.length || 0);
      console.log('📰 QUERY ERROR:', error);
      console.log('📰 QUERY DATA:', data);

      if (error) {
        console.error('Error fetching newsletter history from history_newsletters:', error);
        return [];
      }

      // Map to NewsletterHistory format
      return (data || []).map(record => ({
        id: record.chat_history_id || record.id, // Use chat_history_id for compatibility with existing code
        session_id: record.session_id,
        agent_id: record.agent_id || 'newsletter',
        message: record.content, // Use content field instead of message
        timestamp: record.updated_at,
        created_at: record.created_at,
        title: record.title, // Additional field from history table
        call_to_actions: record.call_to_actions // Additional field from history table
      }));
    } catch (error) {
      console.error('Error getting previous newsletters:', error);
      return [];
    }
  }

  /**
   * Get previous social media content from content_repurposer_images table
   */
  async getPreviousSocialContent(userId: string): Promise<SocialContentHistory[]> {
    try {
      console.log('🔍 QUERY: Fetching social content from content_repurposer_images for user:', userId);
      
      // Get social media content from content_repurposer_images table grouped by session
      // Only get records that have a valid session_id (exclude orphaned records)
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .select(`
          *,
          history_content_repurposer:history_content_repurposer_id (
            title,
            content,
            created_at,
            session_id,
            chat_history_id
          )
        `)
        .eq('user_id', userId)
        .not('session_id', 'is', null)  // Exclude records with null session_id
        .order('created_date', { ascending: false })
        .limit(100);

      console.log('📱 QUERY RESULT: social content from content_repurposer_images count:', data?.length || 0);

      if (error) {
        console.error('Error fetching social content from content_repurposer_images:', error);
        return [];
      }

      // Get the most recent record for each session_id based on created_date
      const sessionGroups = new Map<string, any>();
      
      (data || []).forEach(record => {
        const sessionId = record.session_id || 'unknown';
        const existing = sessionGroups.get(sessionId);
        
        // Only keep the record with the latest created_date for each session
        if (!existing || new Date(record.created_date) > new Date(existing.created_date)) {
          const historyData = record.history_content_repurposer;
          
          sessionGroups.set(sessionId, {
            id: historyData?.chat_history_id || record.id,
            session_id: sessionId,
            message: this.createSocialContentSummary(data?.filter(d => d.session_id === sessionId) || []),
            timestamp: record.created_date,
            created_at: record.created_date,
            title: historyData?.title || `Social Content ${sessionId}`,
            platform_count: data?.filter(d => d.session_id === sessionId).length || 0
          });
        }
      });

      return Array.from(sessionGroups.values());
    } catch (error) {
      console.error('Error getting previous social content:', error);
      return [];
    }
  }

  /**
   * Create a summary of social content for display
   */
  private createSocialContentSummary(posts: any[]): string {
    const platformCounts = posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = Object.entries(platformCounts)
      .map(([platform, count]) => `${platform}: ${count} post${(count as number) > 1 ? 's' : ''}`)
      .join(', ');

    return `Social media content generated: ${summary}`;
  }

  /**
   * Group content by date for tabs
   */
  static groupContentByDate<T extends { timestamp: string; created_at: string }>(
    content: T[]
  ): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};

    content.forEach(item => {
      // Use timestamp if available, otherwise use created_at
      const dateStr = item.timestamp || item.created_at;
      const date = new Date(dateStr);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  }

  /**
   * Format date for display
   */
  static formatDate(dateStr: string): string {
    // Handle timezone issues by parsing date components directly
    if (dateStr.includes('T')) {
      // Full timestamp - use regular parsing
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } else {
      // Date-only string - parse as local date to avoid timezone shift
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  /**
   * Get unique session count for display
   */
  static getUniqueSessionsCount(content: { session_id: string }[]): number {
    const uniqueSessions = new Set(content.map(item => item.session_id));
    return uniqueSessions.size;
  }
}

export default ChatHistoryService;