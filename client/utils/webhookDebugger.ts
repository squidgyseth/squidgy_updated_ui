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
      console.log('📊 Webhook Logs Summary:');
      console.log(`✅ Successful: ${logs.success.length}`);
      console.log(`❌ Failed: ${logs.errors.length}`);
      console.log('\n📝 Detailed Logs:');
      console.log('Success:', logs.success);
      console.log('Errors:', logs.errors);
      return logs;
    },

    // Clear all logs
    clearLogs: () => {
      newsletterWebhookService.clearWebhookLogs();
      console.log('🧹 Webhook logs cleared');
    },

    // Check specific webhook status
    checkStatus: (trackingId: string) => {
      const status = newsletterWebhookService.getWebhookStatus(trackingId);
      console.log(`📡 Webhook Status for ${trackingId}:`, status);
      return status;
    },

    // View last successful webhook
    getLastSuccess: () => {
      const logs = newsletterWebhookService.getWebhookLogs();
      const lastSuccess = logs.success[logs.success.length - 1];
      if (lastSuccess) {
        console.log('✅ Last Successful Webhook:');
        console.log('Timestamp:', lastSuccess.timestamp);
        console.log('Payload:', lastSuccess.payload);
        console.log('Response:', lastSuccess.response);
      } else {
        console.log('No successful webhooks found');
      }
      return lastSuccess;
    },

    // View last error
    getLastError: () => {
      const logs = newsletterWebhookService.getWebhookLogs();
      const lastError = logs.errors[logs.errors.length - 1];
      if (lastError) {
        console.log('❌ Last Failed Webhook:');
        console.log('Timestamp:', lastError.timestamp);
        console.log('Payload:', lastError.payload);
        console.log('Error:', lastError.error);
      } else {
        console.log('No failed webhooks found');
      }
      return lastError;
    },

    // Test webhook with sample data
    testWebhook: async () => {
      console.log('🧪 Testing webhook with sample data...');
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
        console.log('✅ Test webhook triggered successfully (running in background)');
        console.log('Check logs in a few seconds with webhookDebugger.getLogs()');
      } catch (error) {
        console.error('❌ Test webhook failed:', error);
      }
    }
  };

  console.log(`
🚀 Newsletter Webhook Debugger Loaded!
Available commands:
- webhookDebugger.getLogs()      - View all webhook logs
- webhookDebugger.clearLogs()    - Clear all logs
- webhookDebugger.getLastSuccess() - View last successful webhook
- webhookDebugger.getLastError()  - View last failed webhook
- webhookDebugger.testWebhook()   - Test webhook with sample data
- webhookDebugger.checkStatus(id) - Check specific webhook status
  `);
}

export default (window as any).webhookDebugger;