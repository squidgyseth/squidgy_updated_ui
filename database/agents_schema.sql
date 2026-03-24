-- Minimal schema for agents and conversations
-- Only what's needed for the Figma to page flow

-- =====================================================
-- AGENTS TABLE - Complete Configuration Storage
-- =====================================================
-- This table stores ALL agent configuration data
-- Allows agent_builder to create new agents without file system access
-- Frontend reads from this table instead of compiled JSON files

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Identity
  agent_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  emoji VARCHAR(10),
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  specialization VARCHAR(200),
  tagline VARCHAR(200),
  avatar_url TEXT,
  
  -- Display & Behavior
  pinned BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Platform Control
  is_enabled BOOLEAN DEFAULT true,
  admin_only BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  
  -- Messaging
  initial_message TEXT,
  sidebar_greeting TEXT,
  
  -- Capabilities & Actions (stored as JSONB arrays)
  capabilities JSONB DEFAULT '[]'::jsonb,
  recent_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Skills Configuration (stored as JSONB array of objects)
  -- Each skill: { name, description, file }
  skills JSONB DEFAULT '[]'::jsonb,
  
  -- UI Configuration (stored as JSONB object)
  -- Contains: page_type, figma_url, generated_component_path, etc.
  ui_config JSONB DEFAULT '{}'::jsonb,
  
  -- Interface Configuration (stored as JSONB object)
  -- Contains: input_placeholder, submit_button_text, etc.
  interface_config JSONB DEFAULT '{}'::jsonb,
  
  -- Suggestions (stored as JSONB array)
  suggestions JSONB DEFAULT '[]'::jsonb,
  
  -- Personality Configuration (stored as JSONB object)
  -- Contains: tone, style, communication_preferences, etc.
  personality JSONB DEFAULT '{}'::jsonb,
  
  -- N8N Integration
  webhook_url TEXT,
  uses_conversation_state BOOLEAN DEFAULT false,
  
  -- Platform Integrations (stored as JSONB object)
  -- Contains: ghl, facebook, google_calendar, etc.
  platforms JSONB DEFAULT '{}'::jsonb,
  
  -- Domain-specific Configuration (stored as JSONB object)
  -- For specialized agents like solar, newsletter, etc.
  domain_config JSONB DEFAULT '{}'::jsonb,
  
  -- Full raw configuration (backup of complete YAML)
  raw_config JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_modified_by UUID REFERENCES auth.users(id)
);

-- 2. Agent conversations table (simplified)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  message_content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_agent_id ON agents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_is_enabled ON agents(is_enabled);
CREATE INDEX IF NOT EXISTS idx_agents_admin_only ON agents(admin_only);
CREATE INDEX IF NOT EXISTS idx_agents_pinned ON agents(pinned);
CREATE INDEX IF NOT EXISTS idx_agents_display_order ON agents(display_order);

-- GIN indexes for JSONB fields (for efficient querying)
CREATE INDEX IF NOT EXISTS idx_agents_capabilities ON agents USING GIN (capabilities);
CREATE INDEX IF NOT EXISTS idx_agents_skills ON agents USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_agents_ui_config ON agents USING GIN (ui_config);
CREATE INDEX IF NOT EXISTS idx_agents_platforms ON agents USING GIN (platforms);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session ON agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON agent_conversations(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_sender ON agent_conversations(is_user_message);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_agents_updated_at ON agents;
CREATE TRIGGER trigger_update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Active agents for frontend consumption
CREATE OR REPLACE VIEW vw_active_agents AS
SELECT 
  agent_id,
  name,
  emoji,
  category,
  description,
  specialization,
  tagline,
  avatar_url,
  pinned,
  is_enabled as enabled,
  admin_only,
  display_order,
  initial_message,
  sidebar_greeting,
  capabilities,
  recent_actions,
  skills,
  ui_config,
  interface_config,
  suggestions,
  personality,
  webhook_url,
  uses_conversation_state,
  platforms,
  domain_config,
  updated_at
FROM agents
WHERE is_enabled = true
ORDER BY 
  pinned DESC,
  display_order ASC,
  category ASC,
  name ASC;

-- View: All agents (for admin panel)
CREATE OR REPLACE VIEW vw_all_agents AS
SELECT 
  id,
  agent_id,
  name,
  emoji,
  category,
  description,
  specialization,
  tagline,
  avatar_url,
  pinned,
  is_enabled as enabled,
  admin_only,
  display_order,
  initial_message,
  sidebar_greeting,
  capabilities,
  recent_actions,
  skills,
  ui_config,
  interface_config,
  suggestions,
  personality,
  webhook_url,
  uses_conversation_state,
  platforms,
  domain_config,
  created_at,
  updated_at,
  created_by,
  last_modified_by
FROM agents
ORDER BY 
  category ASC,
  pinned DESC,
  display_order ASC,
  name ASC;