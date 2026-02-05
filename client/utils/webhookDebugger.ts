/**
 * Webhook Debugger Utility
 * Helper functions to debug and monitor webhook calls
 */

import newsletterWebhookService from '../services/newsletterWebhookService';

// Add this to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).webhookDebugger = {
    // View all webhook logs
    getLogs: () => {
      const logs = newsletterWebhookService.getWebhookLogs();
      return logs;
    },

    // Clear all logs
    clearLogs: () => {
      newsletterWebhookService.clearWebhookLogs();
    },

    // Check specific webhook status
    checkStatus: (trackingId: string) => {
      const status = newsletterWebhookService.getWebhookStatus(trackingId);
      return status;
    },

    // View last successful webhook
    getLastSuccess: () => {
      const logs = newsletterWebhookService.getWebhookLogs();
      const lastSuccess = logs.success[logs.success.length - 1];
      if (lastSuccess) {
      } else {
      }
      return lastSuccess;
    },

    // View last error
    getLastError: () => {
      const logs = newsletterWebhookService.getWebhookLogs();
      const lastError = logs.errors[logs.errors.length - 1];
      if (lastError) {
      } else {
      }
      return lastError;
    },

    // Test webhook with sample data
    testWebhook: async () => {
      const testData = {
        firm_user_id: 'test_user_123',
        id: 'test_id_456',
        ghl_location_id: 'test_location',
        company_description: 'Test Company - Solar Installation Services',
        value_proposition: 'We provide affordable solar solutions',
        business_niche: 'Residential Solar',
        ghl_user_id: 'test_ghl_user'
      };
      
      try {
        await newsletterWebhookService.fireWebhookAsync(testData);
      } catch (error) {
        console.error('❌ Test webhook failed:', error);
      }
    }
  };

}

export default (window as any).webhookDebugger;
