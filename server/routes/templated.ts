import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Get templates for a business
router.get('/templates/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    console.log(`🔍 Fetching templates for business ID: ${businessId}`);

    // This would typically integrate with Templated.io API
    // For now, returning a mock response that matches the expected format
    const mockResponse = {
      success: true,
      templates: [],
      total: 0,
      enabledCount: 0,
      availableCount: 0,
      userId: businessId,
      debug: {
        totalFetched: 0,
        afterFilter: 0,
        showeveryoneTemplates: 0,
        userSpecificTemplates: 0
      }
    };

    console.log(`✅ Returning template response for business ${businessId}`);
    res.json(mockResponse);

  } catch (error: any) {
    console.error('❌ Error fetching templates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch templates',
      details: error.message 
    });
  }
});

// Toggle a template on/off
router.post('/templates/toggle', async (req, res) => {
  try {
    const { template_id, user_id, enable } = req.body;

    console.log(`${enable ? '✅' : '❌'} ${enable ? 'Enabling' : 'Disabling'} template ${template_id} for business ${user_id}`);

    // Mock response - in real implementation this would update the database
    const response = {
      success: true,
      message: `Template ${enable ? 'enabled' : 'disabled'} successfully`,
      template_id: template_id,
      tags: [],
      isEnabled: enable
    };

    console.log(`✅ Template ${template_id} ${enable ? 'enabled' : 'disabled'} successfully`);
    res.json(response);

  } catch (error: any) {
    console.error('❌ Error toggling template:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update template',
      details: error.message 
    });
  }
});

// Bulk toggle templates
router.post('/templates/bulk-toggle', async (req, res) => {
  try {
    const { template_ids, user_id, enable } = req.body;

    console.log(`${enable ? '✅' : '❌'} ${enable ? 'Enabling' : 'Disabling'} ${template_ids?.length || 0} templates for business ${user_id}`);

    // Mock response - in real implementation this would update multiple database records
    const response = {
      success: true,
      results: (template_ids || []).map((id: string) => ({
        template_id: id,
        success: true
      })),
      errors: [],
      totalProcessed: template_ids?.length || 0,
      totalErrors: 0
    };

    console.log(`✅ ${response.totalProcessed} templates updated successfully`);
    res.json(response);

  } catch (error: any) {
    console.error('❌ Error bulk toggling templates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update templates',
      details: error.message 
    });
  }
});

// Debug endpoint - get all templates
router.get('/templates/debug/all', async (req, res) => {
  try {
    console.log(`🔍 Debug: Fetching all templates`);

    // Mock response for debugging
    const debugResponse = {
      success: true,
      templates: [],
      total: 0,
      debug: {
        totalFetched: 0,
        afterFilter: 0,
        showeveryoneTemplates: 0,
        userSpecificTemplates: 0
      }
    };

    console.log(`✅ Debug: Returned ${debugResponse.total} templates`);
    res.json(debugResponse);

  } catch (error: any) {
    console.error('❌ Error in debug templates endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Debug endpoint failed',
      details: error.message 
    });
  }
});

export default router;
