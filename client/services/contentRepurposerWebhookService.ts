/**
 * Content Repurposer Webhook Service
 * Handles async webhook calls for content repurpose questions generation
 * This runs independently of database operations to prevent blocking
 * Also handles creating content_repurposer_images records from webhook response
 */

import { supabase } from '../lib/supabase';

interface ContentRepurposerWebhookPayload {
  id: string;
  user_id: string;
  session_id: string;
  chat_history_id?: string;
  content: string;
  timestamp?: string;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
  data?: any; // Webhook response data containing social media posts
}

interface SocialMediaPost {
  platform: string;
  content: string;
  image_prompt?: string;
  hashtags?: string[];
}

class ContentRepurposerWebhookService {
  private static instance: ContentRepurposerWebhookService;
  private webhookUrl = 'https://n8n.theaiteam.uk/webhook/content_repurpose_questions_new';
  private retryAttempts = 1; // Only 1 retry (2 total attempts)
  private retryDelay = 2000; // 2 seconds

  private constructor() {}

  static getInstance(): ContentRepurposerWebhookService {
    if (!ContentRepurposerWebhookService.instance) {
      ContentRepurposerWebhookService.instance = new ContentRepurposerWebhookService();
    }
    return ContentRepurposerWebhookService.instance;
  }

  /**
   * Fire webhook asynchronously without blocking the UI
   * This method returns immediately and handles the webhook in the background
   */
  async fireWebhookAsync(
    contentData: {
      id: string;
      user_id: string;
      session_id?: string;
      chat_history_id?: string;
      content: string;
    }
  ): Promise<void> {
    const payload: ContentRepurposerWebhookPayload = {
      id: contentData.id,
      user_id: contentData.user_id,
      session_id: contentData.session_id || contentData.id,
      chat_history_id: contentData.chat_history_id || '',
      content: contentData.content,
      timestamp: new Date().toISOString()
    };

    // Fire and forget - don't await this
    this.sendWebhookWithRetry(payload).catch(error => {
      // Log error but don't throw - this is truly async
      console.warn('[Content Repurposer Webhook] Background webhook failed:', error);
      this.logWebhookError(error, payload);
    });

    // Return immediately - don't wait for webhook
    console.log('[Content Repurposer Webhook] Webhook queued for background processing');
  }

  /**
   * Send webhook with retry logic
   * This runs in the background
   */
  private async sendWebhookWithRetry(
    payload: ContentRepurposerWebhookPayload,
    attempt: number = 1
  ): Promise<WebhookResponse> {
    try {
      console.log(`[Content Repurposer Webhook] Sending webhook (attempt ${attempt}/${this.retryAttempts + 1})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Content Repurposer Webhook] Success:', data);
      
      // Process webhook response and create image records
      await this.processWebhookResponse(payload, data);
      
      this.logWebhookSuccess(payload, data);
      
      return {
        success: true,
        message: 'Content repurposer webhook sent successfully',
        requestId: data.requestId || data.id,
        data: data
      };
    } catch (error) {
      console.error(`[Content Repurposer Webhook] Attempt ${attempt} failed:`, error);
      
      if (attempt <= this.retryAttempts) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.sendWebhookWithRetry(payload, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Process webhook response and create content_repurposer_images records
   * This extracts individual posts from the webhook response and stores them
   */
  private async processWebhookResponse(
    payload: ContentRepurposerWebhookPayload,
    webhookData: any
  ): Promise<void> {
    try {
      console.log('[Content Repurposer Webhook] Processing webhook response:', webhookData);
      
      // Extract social media posts from webhook response
      const posts = this.extractSocialMediaPosts(webhookData);
      
      if (posts.length === 0) {
        console.log('[Content Repurposer Webhook] No social media posts found in response');
        return;
      }

      // Create content_repurposer_images records for each post with new schema
      const imageRecords = posts.map((post, index) => ({
        user_id: payload.user_id,
        agent_id: 'content_repurposer',
        platform: post.platform,
        post_id: `${payload.session_id}_${post.platform.toLowerCase()}_${index + 1}`,
        content: post.content,
        image_url: null, // Will be generated on-demand
        prompt: post.image_prompt || '',
        generation_type: 'webhook',
        session_id: payload.session_id,
        history_content_repurposer_id: payload.id, // Link to parent history_content_repurposer record
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        in_use: true
      }));

      // Insert into Supabase
      const { data: insertedRecords, error } = await supabase
        .from('content_repurposer_images')
        .insert(imageRecords)
        .select();

      if (error) {
        console.error('[Content Repurposer Webhook] Failed to insert image records:', error);
        throw error;
      }

      console.log(`[Content Repurposer Webhook] Successfully created ${insertedRecords?.length || 0} image records`);
      
      // Update repurposed_content in history_content_repurposer table
      await this.syncRepurposedContentToHistory(payload.id, webhookData);
    } catch (error) {
      console.error('[Content Repurposer Webhook] Error processing webhook response:', error);
      // Don't throw - this shouldn't break the main webhook flow
    }
  }

  /**
   * Extract social media posts from webhook response
   * Handles different response formats from the webhook
   */
  private extractSocialMediaPosts(webhookData: any): SocialMediaPost[] {
    const posts: SocialMediaPost[] = [];

    try {
      // Handle different response formats
      let contentData = webhookData;
      
      // If webhook data has a data property, use that
      if (webhookData.data) {
        contentData = webhookData.data;
      }

      // If it's a string, parse it as JSON
      if (typeof contentData === 'string') {
        contentData = JSON.parse(contentData);
      }

      // Handle new platform-based format (LinkedIn, InstagramFacebook, TikTokReels)
      if (contentData.LinkedIn || contentData.InstagramFacebook || contentData.TikTokReels) {
        this.extractPostsFromNewFormat(contentData, posts);
      }
      // Handle array format
      else if (Array.isArray(contentData)) {
        contentData.forEach((item: any) => {
          if (item.ContentRepurposerPosts) {
            this.extractPostsFromContentRepurposer(item.ContentRepurposerPosts, posts);
          }
          // Also check for new format in array items
          if (item.LinkedIn || item.InstagramFacebook || item.TikTokReels) {
            this.extractPostsFromNewFormat(item, posts);
          }
        });
      } 
      // Handle object format
      else if (contentData.ContentRepurposerPosts) {
        this.extractPostsFromContentRepurposer(contentData.ContentRepurposerPosts, posts);
      }
      // Handle direct posts format
      else if (contentData.posts) {
        this.extractPostsFromDirectFormat(contentData.posts, posts);
      }

      console.log(`[Content Repurposer Webhook] Extracted ${posts.length} social media posts`);
    } catch (error) {
      console.error('[Content Repurposer Webhook] Error extracting social media posts:', error);
    }

    return posts;
  }

  /**
   * Extract posts from new platform-based format
   * Format: { LinkedIn: { Post1: { Caption: "...", ImagePrompt: "..." } }, InstagramFacebook: {...}, TikTokReels: {...} }
   */
  private extractPostsFromNewFormat(contentData: any, posts: SocialMediaPost[]): void {
    // Process LinkedIn posts
    if (contentData.LinkedIn) {
      Object.entries(contentData.LinkedIn).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Caption || postData.Script)) {
          posts.push({
            platform: 'LinkedIn',
            content: postData.Caption || postData.Script || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }

    // Process Instagram/Facebook posts
    if (contentData.InstagramFacebook) {
      Object.entries(contentData.InstagramFacebook).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Caption || postData.Script)) {
          posts.push({
            platform: 'Instagram',
            content: postData.Caption || postData.Script || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }

    // Process TikTok/Reels posts
    if (contentData.TikTokReels) {
      Object.entries(contentData.TikTokReels).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Script || postData.Idea)) {
          posts.push({
            platform: 'TikTok',
            content: postData.Script || postData.Idea || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }
  }

  /**
   * Extract posts from ContentRepurposerPosts format (legacy)
   */
  private extractPostsFromContentRepurposer(contentRepurposerPosts: any, posts: SocialMediaPost[]): void {
    // LinkedIn Posts
    if (contentRepurposerPosts.LinkedInPost1) {
      posts.push({
        platform: 'LinkedIn',
        content: contentRepurposerPosts.LinkedInPost1,
        image_prompt: contentRepurposerPosts.LinkedInImagePrompt1 || ''
      });
    }
    if (contentRepurposerPosts.LinkedInPost2) {
      posts.push({
        platform: 'LinkedIn',
        content: contentRepurposerPosts.LinkedInPost2,
        image_prompt: contentRepurposerPosts.LinkedInImagePrompt2 || ''
      });
    }

    // Instagram/Facebook Posts
    if (contentRepurposerPosts.InstagramFacebookPost1) {
      posts.push({
        platform: 'Instagram/Facebook',
        content: contentRepurposerPosts.InstagramFacebookPost1,
        image_prompt: contentRepurposerPosts.InstagramFacebookImagePrompt1 || '',
        hashtags: contentRepurposerPosts.InstagramFacebookHashtags1 || []
      });
    }
    if (contentRepurposerPosts.InstagramFacebookPost2) {
      posts.push({
        platform: 'Instagram/Facebook',
        content: contentRepurposerPosts.InstagramFacebookPost2,
        image_prompt: contentRepurposerPosts.InstagramFacebookImagePrompt2 || '',
        hashtags: contentRepurposerPosts.InstagramFacebookHashtags2 || []
      });
    }

    // TikTok/Reels Posts
    if (contentRepurposerPosts.TikTokReelsPost1) {
      posts.push({
        platform: 'TikTok/Reels',
        content: contentRepurposerPosts.TikTokReelsPost1,
        image_prompt: contentRepurposerPosts.TikTokReelsImagePrompt1 || '',
        hashtags: contentRepurposerPosts.TikTokReelsHashtags1 || []
      });
    }
    if (contentRepurposerPosts.TikTokReelsPost2) {
      posts.push({
        platform: 'TikTok/Reels',
        content: contentRepurposerPosts.TikTokReelsPost2,
        image_prompt: contentRepurposerPosts.TikTokReelsImagePrompt2 || '',
        hashtags: contentRepurposerPosts.TikTokReelsHashtags2 || []
      });
    }
  }

  /**
   * Extract posts from direct posts format
   */
  private extractPostsFromDirectFormat(posts: any[], postArray: SocialMediaPost[]): void {
    posts.forEach((post: any) => {
      postArray.push({
        platform: post.platform || 'Unknown',
        content: post.content || '',
        image_prompt: post.image_prompt || post.imagePrompt || '',
        hashtags: post.hashtags || []
      });
    });
  }

  /**
   * Sync repurposed content back to history table
   * This ensures both tables stay in sync when webhook completes
   */
  private async syncRepurposedContentToHistory(historyRecordId: string, webhookData: any): Promise<void> {
    try {
      console.log('[Content Repurposer Webhook] Syncing repurposed content to history table');
      
      // Update the repurposed_content column with the webhook response
      const { error } = await supabase
        .from('history_content_repurposer')
        .update({
          repurposed_content: webhookData,
          updated_at: new Date().toISOString()
        })
        .eq('id', historyRecordId);

      if (error) {
        console.error('[Content Repurposer Webhook] Failed to sync repurposed content:', error);
        throw error;
      }

      console.log('[Content Repurposer Webhook] Successfully synced repurposed content to history table');
    } catch (error) {
      console.error('[Content Repurposer Webhook] Error syncing repurposed content:', error);
      // Don't throw - this is supplementary sync, shouldn't break main flow
    }
  }

  /**
   * Alternative: Send webhook and get a promise to track status
   * Use this if you want to show loading state but still non-blocking
   */
  async fireWebhookWithTracking(
    contentData: {
      id: string;
      user_id: string;
      session_id?: string;
      chat_history_id?: string;
      content: string;
    }
  ): Promise<{ trackingId: string; promise: Promise<WebhookResponse> }> {
    const trackingId = `content_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload: ContentRepurposerWebhookPayload = {
      id: contentData.id,
      user_id: contentData.user_id,
      session_id: contentData.session_id || contentData.id,
      chat_history_id: contentData.chat_history_id || '',
      content: contentData.content,
      timestamp: new Date().toISOString()
    };

    // Store tracking status
    this.updateTrackingStatus(trackingId, 'pending');

    const promise = this.sendWebhookWithRetry(payload)
      .then(result => {
        this.updateTrackingStatus(trackingId, 'success', result);
        return result;
      })
      .catch(error => {
        this.updateTrackingStatus(trackingId, 'failed', error);
        throw error;
      });

    return { trackingId, promise };
  }

  /**
   * Check webhook status (for tracking mode)
   */
  getWebhookStatus(trackingId: string): { status: string; data?: any } {
    const stored = localStorage.getItem(`content_webhook_status_${trackingId}`);
    return stored ? JSON.parse(stored) : { status: 'unknown' };
  }

  /**
   * Update tracking status in localStorage
   */
  private updateTrackingStatus(trackingId: string, status: string, data?: any): void {
    localStorage.setItem(
      `content_webhook_status_${trackingId}`,
      JSON.stringify({
        status,
        data,
        timestamp: new Date().toISOString()
      })
    );

    this.cleanupOldTrackingData();
  }

  /**
   * Log successful webhook for debugging
   */
  private logWebhookSuccess(payload: ContentRepurposerWebhookPayload, response: any): void {
    const logs = JSON.parse(localStorage.getItem('content_webhook_success_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      payload,
      response,
      type: 'success'
    });
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    localStorage.setItem('content_webhook_success_logs', JSON.stringify(logs));
  }

  /**
   * Log webhook errors for debugging
   */
  private logWebhookError(error: any, payload: ContentRepurposerWebhookPayload): void {
    const logs = JSON.parse(localStorage.getItem('content_webhook_error_logs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      payload,
      error: error.message || error,
      type: 'error'
    });
    
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    localStorage.setItem('content_webhook_error_logs', JSON.stringify(logs));
  }

  /**
   * Clean up old tracking data from localStorage
   */
  private cleanupOldTrackingData(): void {
    const oneHourAgo = Date.now() - 3600000;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('content_webhook_status_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const timestamp = new Date(data.timestamp).getTime();
          if (timestamp < oneHourAgo) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Get webhook logs for debugging
   */
  getWebhookLogs(): { success: any[]; errors: any[] } {
    return {
      success: JSON.parse(localStorage.getItem('content_webhook_success_logs') || '[]'),
      errors: JSON.parse(localStorage.getItem('content_webhook_error_logs') || '[]')
    };
  }

  /**
   * Clear webhook logs
   */
  clearWebhookLogs(): void {
    localStorage.removeItem('content_webhook_success_logs');
    localStorage.removeItem('content_webhook_error_logs');
  }

  /**
   * Process existing content from history_content_repurposer that has repurposed_content
   * but no corresponding records in content_repurposer_images
   * This helps backfill the images table with already generated content
   */
  async processExistingContentFromHistory(historyRecord: any): Promise<void> {
    try {
      console.log('[Content Repurposer Webhook] Processing existing content from history:', historyRecord.id);
      
      if (!historyRecord.repurposed_content) {
        console.log('[Content Repurposer Webhook] No repurposed content found in history record');
        return;
      }

      const payload = {
        id: historyRecord.id,
        user_id: historyRecord.user_id,
        session_id: historyRecord.session_id || historyRecord.id,
        chat_history_id: historyRecord.chat_history_id || '',
        content: historyRecord.content,
        timestamp: new Date().toISOString()
      };

      // Process the repurposed content as if it came from webhook
      await this.processWebhookResponse(payload, historyRecord.repurposed_content);
      
      console.log('[Content Repurposer Webhook] Successfully processed existing content from history');
    } catch (error) {
      console.error('[Content Repurposer Webhook] Error processing existing content from history:', error);
    }
  }
}

export default ContentRepurposerWebhookService.getInstance();