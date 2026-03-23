import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CreateAgentRequest {
  agent_id: string;
  name: string;
  emoji?: string;
  category: string;
  description: string;
  specialization?: string;
  tagline?: string;
  avatar_url?: string;
  pinned?: boolean;
  enabled?: boolean;
  admin_only?: boolean;
  initial_message?: string;
  sidebar_greeting?: string;
  capabilities?: string[];
  recent_actions?: string[];
  skills?: Array<{
    name: string;
    description: string;
    file?: string;
  }>;
  ui_config?: any;
  interface_config?: {
    type: string;
    features?: string[];
  };
  suggestions?: string[];
  personality?: {
    tone: string;
    style: string;
    approach: string;
  };
  webhook_url: string;
  uses_conversation_state?: boolean;
  platforms?: any;
  domain_config?: any;
}

router.post('/create', async (req: Request, res: Response) => {
  try {
    const agentData: CreateAgentRequest = req.body;

    if (!agentData.agent_id || !agentData.name || !agentData.category || !agentData.description || !agentData.webhook_url) {
      return res.status(400).json({
        error: 'Missing required fields: agent_id, name, category, description, webhook_url'
      });
    }

    const { data: existingAgent } = await supabase
      .from('agents')
      .select('agent_id')
      .eq('agent_id', agentData.agent_id)
      .single();

    if (existingAgent) {
      return res.status(409).json({
        error: `Agent with ID "${agentData.agent_id}" already exists`
      });
    }

    const agentRecord = {
      agent_id: agentData.agent_id,
      name: agentData.name,
      emoji: agentData.emoji || '🤖',
      category: agentData.category.toUpperCase(),
      description: agentData.description,
      specialization: agentData.specialization || null,
      tagline: agentData.tagline || null,
      avatar_url: agentData.avatar_url || null,
      pinned: agentData.pinned || false,
      enabled: agentData.enabled !== false,
      admin_only: agentData.admin_only || false,
      is_default: false,
      display_order: 999,
      initial_message: agentData.initial_message || null,
      sidebar_greeting: agentData.sidebar_greeting || null,
      capabilities: agentData.capabilities || [],
      recent_actions: agentData.recent_actions || [],
      skills: agentData.skills || [],
      ui_config: agentData.ui_config || {},
      interface_config: agentData.interface_config || { type: 'chat', features: ['text_input', 'file_upload'] },
      suggestions: agentData.suggestions || [],
      personality: agentData.personality || {},
      webhook_url: agentData.webhook_url,
      uses_conversation_state: agentData.uses_conversation_state || false,
      platforms: agentData.platforms || {},
      domain_config: agentData.domain_config || {},
      raw_config: {
        agent: {
          id: agentData.agent_id,
          name: agentData.name,
          emoji: agentData.emoji,
          category: agentData.category,
          description: agentData.description,
          specialization: agentData.specialization,
          tagline: agentData.tagline,
          avatar: agentData.avatar_url,
          pinned: agentData.pinned,
          enabled: agentData.enabled,
          admin_only: agentData.admin_only,
          initial_message: agentData.initial_message,
          sidebar_greeting: agentData.sidebar_greeting,
          capabilities: agentData.capabilities,
          recent_actions: agentData.recent_actions,
        },
        n8n: {
          webhook_url: agentData.webhook_url
        },
        skills: agentData.skills,
        ui_use: agentData.ui_config,
        interface: agentData.interface_config,
        suggestions: agentData.suggestions,
        personality: agentData.personality,
        platforms: agentData.platforms,
        domain_config: agentData.domain_config
      }
    };

    const { data, error } = await supabase
      .from('agents')
      .insert(agentRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return res.status(500).json({
        error: 'Failed to create agent',
        details: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: `Agent "${agentData.name}" created successfully`,
      agent: data
    });

  } catch (error) {
    console.error('Error in create agent endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/update/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const updates: Partial<CreateAgentRequest> = req.body;

    const { data: existingAgent } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (!existingAgent) {
      return res.status(404).json({
        error: `Agent with ID "${agentId}" not found`
      });
    }

    const updateRecord: any = {};
    
    if (updates.name) updateRecord.name = updates.name;
    if (updates.emoji) updateRecord.emoji = updates.emoji;
    if (updates.category) updateRecord.category = updates.category.toUpperCase();
    if (updates.description) updateRecord.description = updates.description;
    if (updates.specialization !== undefined) updateRecord.specialization = updates.specialization;
    if (updates.tagline !== undefined) updateRecord.tagline = updates.tagline;
    if (updates.avatar_url !== undefined) updateRecord.avatar_url = updates.avatar_url;
    if (updates.pinned !== undefined) updateRecord.pinned = updates.pinned;
    if (updates.enabled !== undefined) updateRecord.enabled = updates.enabled;
    if (updates.admin_only !== undefined) updateRecord.admin_only = updates.admin_only;
    if (updates.initial_message !== undefined) updateRecord.initial_message = updates.initial_message;
    if (updates.sidebar_greeting !== undefined) updateRecord.sidebar_greeting = updates.sidebar_greeting;
    if (updates.capabilities) updateRecord.capabilities = updates.capabilities;
    if (updates.recent_actions) updateRecord.recent_actions = updates.recent_actions;
    if (updates.skills) updateRecord.skills = updates.skills;
    if (updates.ui_config) updateRecord.ui_config = updates.ui_config;
    if (updates.interface_config) updateRecord.interface_config = updates.interface_config;
    if (updates.suggestions) updateRecord.suggestions = updates.suggestions;
    if (updates.personality) updateRecord.personality = updates.personality;
    if (updates.webhook_url) updateRecord.webhook_url = updates.webhook_url;
    if (updates.uses_conversation_state !== undefined) updateRecord.uses_conversation_state = updates.uses_conversation_state;
    if (updates.platforms) updateRecord.platforms = updates.platforms;
    if (updates.domain_config) updateRecord.domain_config = updates.domain_config;

    const { data, error } = await supabase
      .from('agents')
      .update(updateRecord)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return res.status(500).json({
        error: 'Failed to update agent',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agent "${agentId}" updated successfully`,
      agent: data
    });

  } catch (error) {
    console.error('Error in update agent endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/list', async (req: Request, res: Response) => {
  try {
    const { includeDisabled, adminOnly } = req.query;

    let query = supabase
      .from('agents')
      .select('*')
      .order('pinned', { ascending: false })
      .order('display_order', { ascending: true })
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (includeDisabled !== 'true') {
      query = query.eq('enabled', true);
    }

    if (adminOnly === 'true') {
      query = query.eq('admin_only', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return res.status(500).json({
        error: 'Failed to fetch agents',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      agents: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in list agents endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: `Agent with ID "${agentId}" not found`
      });
    }

    return res.status(200).json({
      success: true,
      agent: data
    });

  } catch (error) {
    console.error('Error in get agent endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (agentId === 'personal_assistant') {
      return res.status(403).json({
        error: 'Cannot delete the Personal Assistant agent'
      });
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      return res.status(500).json({
        error: 'Failed to delete agent',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agent "${agentId}" deleted successfully`
    });

  } catch (error) {
    console.error('Error in delete agent endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
