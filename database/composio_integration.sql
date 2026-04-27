-- Composio integration schema (Day 3 of the Composio integration spike)
--
-- Adds the per-agent tool declaration columns to `agents` and a new
-- `composio_connections` table that records each end-user's OAuth status
-- per toolkit. End-user OAuth flows are orchestrated by the Python backend
-- routes in squidgy_updated_backend/routes/composio.py; this schema is the
-- persistence layer they read/write.
--
-- Idempotent: each statement uses IF NOT EXISTS so re-runs are safe.
-- Apply order: this file standalone, after agents_schema.sql exists.

-- =====================================================
-- agents: per-agent Composio tool configuration
-- =====================================================
-- tools_composio: array of Composio tool slugs the agent's MCP server allows
--   (e.g., ["SLACK_SEND_MESSAGE", "GMAIL_SEND_EMAIL"]).
-- required_auth: array of toolkit slugs the user must connect before using
--   the agent (e.g., ["slack", "gmail"]). Drives the frontend connect prompts.
-- composio_mcp_server_id: Composio's UUID for the per-agent custom MCP server,
--   created via POST /api/v3/mcp/servers/custom by the agent builder. The N8N
--   workflow's mcpClientTool node URL embeds this ID.
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tools_composio JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS required_auth JSONB DEFAULT '[]'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS composio_mcp_server_id TEXT;

-- =====================================================
-- composio_connections: per-user, per-toolkit OAuth state
-- =====================================================
-- One row per (squidgy user, toolkit). Created when a user clicks "Connect Slack"
-- (status='initiated'), flipped to 'active' by the Composio OAuth callback,
-- and to 'revoked' on disconnect.
--
-- composio_user_id is what the Python backend passes to Composio when initiating
-- the connection. We default it to the squidgy user_id so MCP URL templating in
-- N8N workflows can use the same identifier on both sides.
CREATE TABLE IF NOT EXISTS composio_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  toolkit TEXT NOT NULL,
  composio_connection_id TEXT NOT NULL,
  composio_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'active', 'expired', 'revoked', 'failed')),
  redirect_url TEXT,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, toolkit)
);

CREATE INDEX IF NOT EXISTS idx_composio_connections_user
  ON composio_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_composio_connections_status
  ON composio_connections (user_id, status);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION composio_connections_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_composio_connections_updated_at ON composio_connections;
CREATE TRIGGER trg_composio_connections_updated_at
  BEFORE UPDATE ON composio_connections
  FOR EACH ROW EXECUTE FUNCTION composio_connections_set_updated_at();

-- =====================================================
-- RLS: scope each user to their own connections
-- =====================================================
-- Mirrors the pattern used by ghl_subaccounts. Service role retains full access
-- via the bypass policy; users may only read/manipulate their own rows.
ALTER TABLE composio_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS composio_connections_user_select ON composio_connections;
CREATE POLICY composio_connections_user_select
  ON composio_connections FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS composio_connections_user_update ON composio_connections;
CREATE POLICY composio_connections_user_update
  ON composio_connections FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS composio_connections_service_all ON composio_connections;
CREATE POLICY composio_connections_service_all
  ON composio_connections FOR ALL
  USING (auth.role() = 'service_role');
