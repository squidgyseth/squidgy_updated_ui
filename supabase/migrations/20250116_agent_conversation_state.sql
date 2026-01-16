-- Agent Conversation State Table
-- Stores multi-turn conversation state for agents like Newsletter Multi, Social Media Multi, etc.
-- This allows agents to maintain context across multiple messages in a conversation.

CREATE TABLE IF NOT EXISTS agent_conversation_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core identifiers
  session_id TEXT NOT NULL,                    -- Unique session identifier (e.g., chat session ID)
  agent_id TEXT NOT NULL,                      -- Agent identifier (e.g., 'newsletter_multi', 'social_media_multi')
  firm_user_id UUID REFERENCES auth.users(id), -- User who owns this conversation

  -- State data
  state JSONB NOT NULL DEFAULT '{
    "phase": "initial",
    "selected_topics": [],
    "current_topic_index": 0,
    "current_question_index": 0,
    "answers": {}
  }'::jsonb,

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'), -- Auto-expire after 24 hours

  -- Constraints
  UNIQUE(session_id, agent_id)  -- One state per session per agent
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_conversation_state_session
  ON agent_conversation_state(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_state_user_agent
  ON agent_conversation_state(firm_user_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_state_active
  ON agent_conversation_state(firm_user_id, agent_id, status)
  WHERE status = 'active';

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_conversation_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_conversation_state_updated
  BEFORE UPDATE ON agent_conversation_state
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_conversation_state_timestamp();

-- RLS Disabled - Using service role for all access
-- ALTER TABLE agent_conversation_state ENABLE ROW LEVEL SECURITY;

-- Function to get or create conversation state
CREATE OR REPLACE FUNCTION get_or_create_conversation_state(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_user_id UUID,
  p_default_state JSONB DEFAULT '{
    "phase": "initial",
    "selected_topics": [],
    "current_topic_index": 0,
    "current_question_index": 0,
    "answers": {}
  }'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_state JSONB;
BEGIN
  -- Try to get existing state
  SELECT state INTO v_state
  FROM agent_conversation_state
  WHERE session_id = p_session_id
    AND agent_id = p_agent_id
    AND status = 'active';

  -- If not found, create new one
  IF v_state IS NULL THEN
    INSERT INTO agent_conversation_state (session_id, agent_id, firm_user_id, state)
    VALUES (p_session_id, p_agent_id, p_user_id, p_default_state)
    RETURNING state INTO v_state;
  END IF;

  RETURN v_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation state
CREATE OR REPLACE FUNCTION update_conversation_state(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_new_state JSONB,
  p_status TEXT DEFAULT 'active'
)
RETURNS VOID AS $$
BEGIN
  UPDATE agent_conversation_state
  SET state = p_new_state,
      status = p_status,
      updated_at = NOW()
  WHERE session_id = p_session_id
    AND agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for expired states (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_conversation_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_conversation_state
  WHERE expires_at < NOW()
    OR (status = 'completed' AND updated_at < NOW() - INTERVAL '1 hour');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE agent_conversation_state IS 'Stores multi-turn conversation state for AI agents';
COMMENT ON COLUMN agent_conversation_state.session_id IS 'Unique identifier for the conversation session';
COMMENT ON COLUMN agent_conversation_state.agent_id IS 'Agent identifier (e.g., newsletter_multi, social_media_multi)';
COMMENT ON COLUMN agent_conversation_state.state IS 'JSONB containing the conversation state (phase, topics, answers, etc.)';
COMMENT ON COLUMN agent_conversation_state.status IS 'Conversation status: active, completed, or abandoned';
