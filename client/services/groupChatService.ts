import { supabase } from '../lib/supabase';

export interface GroupChat {
  id: string;
  name: string;
  user_id: string;
  participants: string[]; // Array of agent IDs
  created_at: string;
  updated_at: string;
}

export interface GroupChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  sender_type: 'user' | 'assistant';
  sender_id: string; // agent_id for assistants, user_id for users
  content: string;
  created_at: string;
}

class GroupChatService {
  private static instance: GroupChatService;

  static getInstance(): GroupChatService {
    if (!GroupChatService.instance) {
      GroupChatService.instance = new GroupChatService();
    }
    return GroupChatService.instance;
  }

  /**
   * Create a new group chat
   */
  async createGroupChat(userId: string, name: string, participants: string[]): Promise<GroupChat | null> {
    try {
      console.log(`🆕 createGroupChat: Creating group "${name}" for userId=${userId} with participants:`, participants);
      
      const { data, error } = await supabase
        .from('group_chats')
        .insert({
          name,
          user_id: userId,
          participants
        })
        .select()
        .single();

      if (error) {
        console.error('❌ createGroupChat error:', error);
        throw error;
      }

      console.log('✅ createGroupChat: Created group chat:', data);
      return data;
    } catch (error) {
      console.error('❌ createGroupChat failed:', error);
      return null;
    }
  }

  /**
   * Get group chat by ID
   */
  async getGroupChat(groupId: string): Promise<GroupChat | null> {
    try {
      console.log(`🔍 getGroupChat: Fetching group chat ${groupId}`);
      
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('❌ getGroupChat error:', error);
        throw error;
      }

      console.log('✅ getGroupChat: Found group chat:', data);
      return data;
    } catch (error) {
      console.error('❌ getGroupChat failed:', error);
      return null;
    }
  }

  /**
   * Get all group chats for a user
   */
  async getUserGroupChats(userId: string): Promise<GroupChat[]> {
    try {
      console.log(`🔍 getUserGroupChats: Fetching group chats for userId=${userId}`);
      
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ getUserGroupChats error:', error);
        throw error;
      }

      console.log('✅ getUserGroupChats: Found group chats:', data);
      return data || [];
    } catch (error) {
      console.error('❌ getUserGroupChats failed:', error);
      return [];
    }
  }

  /**
   * Get messages for a group chat
   */
  async getGroupMessages(groupId: string): Promise<GroupChatMessage[]> {
    try {
      console.log(`🔍 getGroupMessages: Fetching messages for groupId=${groupId}`);
      
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ getGroupMessages error:', error);
        throw error;
      }

      console.log('✅ getGroupMessages: Found messages:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ getGroupMessages failed:', error);
      return [];
    }
  }

  /**
   * Save a message to a group chat
   */
  async saveGroupMessage(
    groupId: string, 
    userId: string, 
    senderType: 'user' | 'assistant',
    senderId: string,
    content: string
  ): Promise<GroupChatMessage | null> {
    try {
      console.log(`💾 saveGroupMessage: Saving ${senderType} message to group ${groupId}`);
      
      const { data, error } = await supabase
        .from('group_chat_messages')
        .insert({
          group_id: groupId,
          user_id: userId,
          sender_type: senderType,
          sender_id: senderId,
          content
        })
        .select()
        .single();

      if (error) {
        console.error('❌ saveGroupMessage error:', error);
        throw error;
      }

      // Update the group's updated_at timestamp
      await supabase
        .from('group_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', groupId);

      console.log('✅ saveGroupMessage: Saved message:', data);
      return data;
    } catch (error) {
      console.error('❌ saveGroupMessage failed:', error);
      return null;
    }
  }

  /**
   * Delete a group chat and all its messages
   */
  async deleteGroupChat(groupId: string): Promise<boolean> {
    try {
      console.log(`🗑️ deleteGroupChat: Deleting group ${groupId}`);
      
      // Delete messages first (foreign key constraint)
      await supabase
        .from('group_chat_messages')
        .delete()
        .eq('group_id', groupId);

      // Delete the group chat
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('❌ deleteGroupChat error:', error);
        throw error;
      }

      console.log('✅ deleteGroupChat: Deleted group chat');
      return true;
    } catch (error) {
      console.error('❌ deleteGroupChat failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique group chat ID
   */
  generateGroupId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `group_${userId}_${timestamp}_${random}`;
  }
}

export default GroupChatService;