/**
 * Newsletter Webhook Service
 * Handles async webhook calls for newsletter questions generation
 * This runs independently of database operations to prevent blocking
 */

interface WebhookPayload {
  user_id: string;
  id: string;
  session_id: string;
  ghl_location_id?: string;
  combined_description: string;
  ghl_user_id?: string;
  timestamp?: string;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}

class NewsletterWebhookService {
  private static instance: NewsletterWebhookService;
  private webhookUrl = 'https://n8n.theaiteam.uk/webhook/newsletter_questions';
  private retryAttempts = 3;
  private retryDelay = 2000; // 2 seconds

  private constructor() {}

  static getInstance(): NewsletterWebhookService {
    if (!NewsletterWebhookService.instance) {
      NewsletterWebhookService.instance = new NewsletterWebhookService();
    }
    return NewsletterWebhookService.instance;
  }

  /**
   * Fire webhook asynchronously without blocking the UI
   * This method returns immediately and handles the webhook in the background
   */
  async fireWebhookAsync(
    websiteData: {
      firm_user_id: string;
      id: string;
      ghl_location_id?: string;
      company_description?: string;
      value_proposition?: string;
      business_niche?: string;
      ghl_user_id?: string;
    }
  ): Promise<void> {
    // Combine descriptions
    const combinedDescription = [
      websiteData.company_description,
      websiteData.value_proposition,
      websiteData.business_niche
    ].filter(Boolean).join(' | ');

    const payload: WebhookPayload = {
      user_id: websiteData.firm_user_id,
      id: websiteData.id,
      session_id: websiteData.id,
      ghl_location_id: websiteData.ghl_location_id || '',
      combined_description: combinedDescription,
      ghl_user_id: websiteData.ghl_user_id || '',
      timestamp: new Date().toISOString()
    };

    // Fire and forget - don't await this
    this.sendWebhookWithRetry(payload).catch(error => {
      // Log error but don't throw - this is truly async
      console.warn('[Newsletter Webhook] Background webhook failed:', error);
      // You could also send this to an error tracking service
      this.logWebhookError(error, payload);
    });

    // Return immediately - don't wait for webhook
    console.log('[Newsletter Webhook] Webhook queued for background processing');
  }

  /**
   * Send webhook with retry logic
   * This runs in the background
   */
  private async sendWebhookWithRetry(
    payload: WebhookPayload,
    attempt: number = 1
  ): Promise<WebhookResponse> {
    try {
      console.log(`[Newsletter Webhook] Sending webhook (attempt ${attempt}/${this.retryAttempts})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
      console.log('[Newsletter Webhook] Success:', data);
      
      // Optionally store success in localStorage for debugging
      this.logWebhookSuccess(payload, data);
      
      return {
        success: true,
        message: 'Webhook sent successfully',
        requestId: data.requestId || data.id
      };
    } catch (error) {
      console.error(`[Newsletter Webhook] Attempt ${attempt} failed:`, error);
      
      if (attempt < this.retryAttempts) {
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
    websiteData: {
      firm_user_id: string;
      id: string;
      ghl_location_id?: string;
      company_description?: string;
      value_proposition?: string;
      business_niche?: string;
      ghl_user_id?: string;
    }
  ): Promise<{ trackingId: string; promise: Promise<WebhookResponse> }> {
    const trackingId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const combinedDescription = [
      websiteData.company_description,
      websiteData.value_proposition,
      websiteData.business_niche
    ].filter(Boolean).join(' | ');

    const payload: WebhookPayload = {
      user_id: websiteData.firm_user_id,
      id: websiteData.id,
      session_id: websiteData.id,
      ghl_location_id: websiteData.ghl_location_id || '',
      combined_description: combinedDescription,
      ghl_user_id: websiteData.ghl_user_id || '',
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
    const stored = localStorage.getItem(`webhook_status_${trackingId}`);
    return stored ? JSON.parse(stored) : { status: 'unknown' };
  }

  /**
   * Update tracking status in localStorage
   */
  private updateTrackingStatus(trackingId: string, status: string, data?: any): void {
    localStorage.setItem(
      `webhook_status_${trackingId}`,
      JSON.stringify({
        status,
        data,
        timestamp: new Date().toISOString()
      })
    );

    // Clean up old tracking data (older than 1 hour)
    this.cleanupOldTrackingData();
  }

  /**
   * Log successful webhook for debugging
   */
  private logWebhookSuccess(payload: WebhookPayload, response: any): void {
    const logs = JSON.parse(localStorage.getItem('webhook_success_logs') || '[]');
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
    
    localStorage.setItem('webhook_success_logs', JSON.stringify(logs));
  }

  /**
   * Log webhook errors for debugging
   */
  private logWebhookError(error: any, payload: WebhookPayload): void {
    const logs = JSON.parse(localStorage.getItem('webhook_error_logs') || '[]');
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
    
    localStorage.setItem('webhook_error_logs', JSON.stringify(logs));
  }

  /**
   * Clean up old tracking data from localStorage
   */
  private cleanupOldTrackingData(): void {
    const oneHourAgo = Date.now() - 3600000;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('webhook_status_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const timestamp = new Date(data.timestamp).getTime();
          if (timestamp < oneHourAgo) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid data, remove it
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
      success: JSON.parse(localStorage.getItem('webhook_success_logs') || '[]'),
      errors: JSON.parse(localStorage.getItem('webhook_error_logs') || '[]')
    };
  }

  /**
   * Clear webhook logs
   */
  clearWebhookLogs(): void {
    localStorage.removeItem('webhook_success_logs');
    localStorage.removeItem('webhook_error_logs');
  }
}

export default NewsletterWebhookService.getInstance();