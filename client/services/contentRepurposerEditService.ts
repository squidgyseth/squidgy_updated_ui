/**
 * Content Repurposer Edit Service
 * Handles editing, deletion, and bi-directional sync for content repurposer posts
 */

import { supabase } from '../lib/supabase';

export interface ContentRepurposerPost {
  id: string;
  user_id: string;
  agent_id: string;
  platform: string;
  post_id: string;
  content: string;
  image_url?: string | null;
  prompt: string;
  generation_type: string;
  session_id: string;
  history_content_repurposer_id: string;
  created_date: string;
  updated_date: string;
  in_use: boolean;
}

export interface EditPostData {
  content?: string;
  prompt?: string;
  image_url?: string | null;
}

class ContentRepurposerEditService {
  private static instance: ContentRepurposerEditService;

  private constructor() {}

  static getInstance(): ContentRepurposerEditService {
    if (!ContentRepurposerEditService.instance) {
      ContentRepurposerEditService.instance = new ContentRepurposerEditService();
    }
    return ContentRepurposerEditService.instance;
  }

  /**
   * Update a post's content and/or image data
   */
  async updatePost(postId: string, updates: EditPostData): Promise<boolean> {
    try {
      console.log('📝 ContentRepurposerEditService: Updating post', postId, updates);

      // Update the post in content_repurposer_images
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .update({
          ...updates,
          updated_date: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('in_use', true) // Only update active posts
        .select('history_content_repurposer_id')
        .single();

      if (error) {
        console.error('❌ Failed to update post:', error);
        return false;
      }

      if (!data) {
        console.error('❌ Post not found or inactive:', postId);
        return false;
      }

      // Sync changes back to history table
      await this.syncToHistoryTable(data.history_content_repurposer_id);

      console.log('✅ Post updated successfully and synced to history table');
      return true;
    } catch (error) {
      console.error('❌ Error updating post:', error);
      return false;
    }
  }

  /**
   * Delete just the image (set image_url to null)
   */
  async deleteImage(postId: string): Promise<boolean> {
    try {
      console.log('🗑️ ContentRepurposerEditService: Deleting image for post', postId);

      return await this.updatePost(postId, {
        image_url: null
      });
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return false;
    }
  }

  /**
   * Delete entire post (set in_use to false)
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      console.log('🗑️ ContentRepurposerEditService: Deleting entire post', postId);

      // Soft delete the post
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .update({
          in_use: false,
          updated_date: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('in_use', true) // Only delete currently active posts
        .select('history_content_repurposer_id')
        .single();

      if (error) {
        console.error('❌ Failed to delete post:', error);
        return false;
      }

      if (!data) {
        console.error('❌ Post not found or already deleted:', postId);
        return false;
      }

      // Sync changes back to history table
      await this.syncToHistoryTable(data.history_content_repurposer_id);

      console.log('✅ Post deleted successfully and synced to history table');
      return true;
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      return false;
    }
  }

  /**
   * Restore a deleted post (set in_use back to true)
   */
  async restorePost(postId: string): Promise<boolean> {
    try {
      console.log('🔄 ContentRepurposerEditService: Restoring post', postId);

      // Restore the post
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .update({
          in_use: true,
          updated_date: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('in_use', false) // Only restore currently deleted posts
        .select('history_content_repurposer_id')
        .single();

      if (error) {
        console.error('❌ Failed to restore post:', error);
        return false;
      }

      if (!data) {
        console.error('❌ Post not found or already active:', postId);
        return false;
      }

      // Sync changes back to history table
      await this.syncToHistoryTable(data.history_content_repurposer_id);

      console.log('✅ Post restored successfully and synced to history table');
      return true;
    } catch (error) {
      console.error('❌ Error restoring post:', error);
      return false;
    }
  }

  /**
   * Sync all posts for a history record back to the repurposed_content column
   * This rebuilds the JSON structure from individual posts
   */
  private async syncToHistoryTable(historyRecordId: string): Promise<void> {
    try {
      console.log('🔄 ContentRepurposerEditService: Syncing to history table', historyRecordId);

      // Get all active posts for this history record
      const { data: posts, error: postsError } = await supabase
        .from('content_repurposer_images')
        .select('*')
        .eq('history_content_repurposer_id', historyRecordId)
        .eq('in_use', true)
        .order('created_date');

      if (postsError) {
        console.error('❌ Failed to fetch posts for sync:', postsError);
        return;
      }

      // Rebuild JSON structure from posts
      const rebuiltContent = this.rebuiltContentFromPosts(posts || []);

      // Update the history table
      const { error: updateError } = await supabase
        .from('history_content_repurposer')
        .update({
          repurposed_content: rebuiltContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', historyRecordId);

      if (updateError) {
        console.error('❌ Failed to sync to history table:', updateError);
        return;
      }

      console.log('✅ Successfully synced to history table');
    } catch (error) {
      console.error('❌ Error syncing to history table:', error);
    }
  }

  /**
   * Rebuild JSON content structure from individual posts
   */
  private rebuiltContentFromPosts(posts: ContentRepurposerPost[]): any {
    const content: any = {
      LinkedIn: {},
      InstagramFacebook: {},
      TikTokReels: {},
      GeneralAssets: {
        Quotes: [],
        Questions: [],
        DataPoints: []
      }
    };

    let linkedInCount = 1;
    let instagramCount = 1;
    let tiktokCount = 1;

    posts.forEach(post => {
      switch (post.platform) {
        case 'LinkedIn':
          content.LinkedIn[`Post${linkedInCount++}`] = {
            Caption: post.content,
            ImagePrompt: post.prompt || ''
          };
          break;
        
        case 'Instagram/Facebook':
          content.InstagramFacebook[`Post${instagramCount++}`] = {
            Caption: post.content,
            ImagePrompt: post.prompt || ''
          };
          break;
        
        case 'TikTok':
          content.TikTokReels[`Video${tiktokCount++}`] = {
            Script: post.content,
            Idea: post.prompt || ''
          };
          break;
      }
    });

    return content;
  }

  /**
   * Get all posts for a specific history record
   */
  async getPostsForHistory(historyRecordId: string): Promise<ContentRepurposerPost[]> {
    try {
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .select('*')
        .eq('history_content_repurposer_id', historyRecordId)
        .eq('in_use', true)
        .order('created_date');

      if (error) {
        console.error('❌ Failed to fetch posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching posts:', error);
      return [];
    }
  }

  /**
   * Get all deleted posts for a specific history record (for potential recovery)
   */
  async getDeletedPostsForHistory(historyRecordId: string): Promise<ContentRepurposerPost[]> {
    try {
      const { data, error } = await supabase
        .from('content_repurposer_images')
        .select('*')
        .eq('history_content_repurposer_id', historyRecordId)
        .eq('in_use', false)
        .order('updated_date', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch deleted posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching deleted posts:', error);
      return [];
    }
  }
}

export default ContentRepurposerEditService.getInstance();