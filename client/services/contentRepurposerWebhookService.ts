/**
 * Content Repurposer Webhook Service
 * Handles async webhook calls for content repurpose questions generation
 * This runs independently of database operations to prevent blocking
 */

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
      
      this.logWebhookSuccess(payload, data);
      
      return {
        success: true,
        message: 'Content repurposer webhook sent successfully',
        requestId: data.requestId || data.id
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
}

export default ContentRepurposerWebhookService.getInstance();