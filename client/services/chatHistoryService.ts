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
      console.log('🔍 QUERY: Fetching newsletters for user:', userId);
      
      // Get newsletters with optimized query - filter for HTML content
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', 'newsletter')
        .eq('sender', 'Agent')
        .like('message', '%<!DOCTYPE html>%')
        .order('timestamp', { ascending: false });

      console.log('📰 QUERY RESULT: newsletters raw data count:', data?.length || 0);

      if (error) {
        console.error('Error fetching newsletter history:', error);
        return [];
      }

      // Deduplicate by created_date + message_hash - keep only the most recent for each unique combination
      const seenCombinations = new Set<string>();
      const uniqueNewsletters = (data || []).filter(record => {
        const createdDate = record.created_at ? new Date(record.created_at).toISOString().split('T')[0] : 'unknown';
        const messageHash = record.message_hash || 'no-hash';
        const combinationKey = `${createdDate}_${messageHash}`;
        
        if (seenCombinations.has(combinationKey)) {
          return false;
        }
        seenCombinations.add(combinationKey);
        return true;
      });

      return uniqueNewsletters.map(record => ({
        id: record.id || crypto.randomUUID(),
        session_id: record.session_id,
        agent_id: record.agent_id,
        message: record.message,
        timestamp: record.timestamp || record.created_at || new Date().toISOString(),
        created_at: record.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting previous newsletters:', error);
      return [];
    }
  }

  /**
   * Get previous social media content (JSON content)
   */
  async getPreviousSocialContent(userId: string): Promise<SocialContentHistory[]> {
    try {
      console.log('🔍 QUERY: Fetching social content for user:', userId);
      
      // Get social media content with optimized query - filter for JSON content
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', 'content_repurposer')
        .eq('sender', 'Agent')
        .like('message', '%Post1%')
        .order('timestamp', { ascending: false });

      console.log('📱 QUERY RESULT: social content raw data count:', data?.length || 0);

      if (error) {
        console.error('Error fetching social content history:', error);
        return [];
      }

      // Deduplicate by created_date + message_hash - keep only the most recent for each unique combination
      const seenCombinations = new Set<string>();
      const uniqueSocialContent = (data || []).filter(record => {
        const createdDate = record.created_at ? new Date(record.created_at).toISOString().split('T')[0] : 'unknown';
        const messageHash = record.message_hash || 'no-hash';
        const combinationKey = `${createdDate}_${messageHash}`;
        
        if (seenCombinations.has(combinationKey)) {
          return false;
        }
        seenCombinations.add(combinationKey);
        return true;
      });

      return uniqueSocialContent.map(record => ({
        id: record.id || crypto.randomUUID(),
        session_id: record.session_id,
        message: record.message,
        timestamp: record.timestamp || record.created_at || new Date().toISOString(),
        created_at: record.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting previous social content:', error);
      return [];
    }
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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