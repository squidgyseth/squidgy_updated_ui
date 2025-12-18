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

-- 3. Chat history table (primary conversation storage)
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  agent_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  message_hash TEXT,  -- For deduplication
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- MCP Integration
  mcp_tool_used TEXT,
  mcp_context JSONB
);

-- Indexes for performance
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_conversations_session ON agent_conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON agent_conversations(session_id, timestamp);
CREATE INDEX idx_conversations_sender ON agent_conversations(is_user_message);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp DESC);
CREATE INDEX idx_chat_history_user_agent ON chat_history(user_id, agent_id);