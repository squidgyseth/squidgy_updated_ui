/**
 * Newsletters Webhook Service
 * Handles async webhook calls for newsletter content repurpose questions generation
 * This runs independently of database operations to prevent blocking
 */

interface NewslettersWebhookPayload {
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

class NewslettersWebhookService {
  private static instance: NewslettersWebhookService;
  private webhookUrl = 'https://n8n.theaiteam.uk/webhook/content_repurpose_questions_new';
  private retryAttempts = 1; // Only 1 retry (2 total attempts)
  private retryDelay = 2000; // 2 seconds

  private constructor() {}

  static getInstance(): NewslettersWebhookService {
    if (!NewslettersWebhookService.instance) {
      NewslettersWebhookService.instance = new NewslettersWebhookService();
    }
    return NewslettersWebhookService.instance;
  }

  /**
   * Fire webhook asynchronously without blocking the UI
   * This method returns immediately and handles the webhook in the background
   */
  async fireWebhookAsync(
    newsletterData: {
      id: string;
      user_id: string;
      session_id?: string;
      chat_history_id?: string;
      content: string;
    }
  ): Promise<void> {
    const payload: NewslettersWebhookPayload = {
      id: newsletterData.id,
      user_id: newsletterData.user_id,
      session_id: newsletterData.session_id || newsletterData.id,
      chat_history_id: newsletterData.chat_history_id || '',
      content: newsletterData.content,
      timestamp: new Date().toISOString()
    };

    // Fire and forget - don't await this
    this.sendWebhookWithRetry(payload).catch(error => {
      // Log error but don't throw - this is truly async
      console.warn('[Newsletters Webhook] Background webhook failed:', error);
      this.logWebhookError(error, payload);
    });

    // Return immediately - don't wait for webhook
    console.log('[Newsletters Webhook] Webhook queued for background processing');
  }

  /**
   * Send webhook with retry logic
   * This runs in the background
   */
  private async sendWebhookWithRetry(
    payload: NewslettersWebhookPayload,
    attempt: number = 1
  ): Promise<WebhookResponse> {
    try {
      console.log(`[Newsletters Webhook] Sending webhook (attempt ${attempt}/${this.retryAttempts + 1})`);
      
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
      console.log('[Newsletters Webhook] Success:', data);
      
      this.logWebhookSuccess(payload, data);
      
      return {
        success: true,
        message: 'Newsletters webhook sent successfully',
        requestId: data.requestId || data.id
      };
    } catch (error) {
      console.error(`[Newsletters Webhook] Attempt ${attempt} failed:`, error);
      
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
    newsletterData: {
      id: string;
      user_id: string;
      session_id?: string;
      chat_history_id?: string;
      content: string;
    }
  ): Promise<{ trackingId: string; promise: Promise<WebhookResponse> }> {
    const trackingId = `newsletter_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const payload: NewslettersWebhookPayload = {
      id: newsletterData.id,
      user_id: newsletterData.user_id,
      session_id: newsletterData.session_id || newsletterData.id,
      chat_history_id: newsletterData.chat_history_id || '',
      content: newsletterData.content,
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
    const stored = localStorage.getItem(`newsletter_webhook_status_${trackingId}`);
    return stored ? JSON.parse(stored) : { status: 'unknown' };
  }

  /**
   * Update tracking status in localStorage
   */
  private updateTrackingStatus(trackingId: string, status: string, data?: any): void {
    localStorage.setItem(
      `newsletter_webhook_status_${trackingId}`,
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
  private logWebhookSuccess(payload: NewslettersWebhookPayload, response: any): void {
    const logs = JSON.parse(localStorage.getItem('newsletter_webhook_success_logs') || '[]');
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
    
    localStorage.setItem('newsletter_webhook_success_logs', JSON.stringify(logs));
  }

  /**
   * Log webhook errors for debugging
   */
  private logWebhookError(error: any, payload: NewslettersWebhookPayload): void {
    const logs = JSON.parse(localStorage.getItem('newsletter_webhook_error_logs') || '[]');
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
    
    localStorage.setItem('newsletter_webhook_error_logs', JSON.stringify(logs));
  }

  /**
   * Clean up old tracking data from localStorage
   */
  private cleanupOldTrackingData(): void {
    const oneHourAgo = Date.now() - 3600000;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('newsletter_webhook_status_')) {
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
      success: JSON.parse(localStorage.getItem('newsletter_webhook_success_logs') || '[]'),
      errors: JSON.parse(localStorage.getItem('newsletter_webhook_error_logs') || '[]')
    };
  }

  /**
   * Clear webhook logs
   */
  clearWebhookLogs(): void {
    localStorage.removeItem('newsletter_webhook_success_logs');
    localStorage.removeItem('newsletter_webhook_error_logs');
  }
}

export default NewslettersWebhookService.getInstance();
