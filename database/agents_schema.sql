-- Minimal schema for agents and conversations
-- Only what's needed for the Figma to page flow

-- 1. Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  avatar_url TEXT,
  
  -- UI Configuration
  page_type VARCHAR(20) DEFAULT 'standard', -- 'standard' or 'figma'
  figma_url TEXT,
  generated_component_path TEXT,
  
  -- N8N Integration
  n8n_webhook_url TEXT,
  
  -- Platform Control
  is_enabled BOOLEAN DEFAULT true NOT NULL,
  admin_only BOOLEAN DEFAULT false NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Agent conversations table (simplified)
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  message_content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
);

-- Indexes for performance
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_is_enabled ON agents(is_enabled);
CREATE INDEX idx_agents_admin_only ON agents(admin_only);
CREATE INDEX idx_conversations_session ON agent_conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON agent_conversations(session_id, timestamp);
CREATE INDEX idx_conversations_sender ON agent_conversations(is_user_message);