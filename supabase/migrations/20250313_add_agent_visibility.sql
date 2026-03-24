-- Add admin_only column to agents table
-- This column determines whether an agent should only be displayed to admin users
-- Regular users will not see agents with admin_only = true

ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS admin_only BOOLEAN DEFAULT false NOT NULL;

-- Create index for filtering admin-only agents
CREATE INDEX IF NOT EXISTS idx_agents_admin_only 
  ON agents(admin_only);

-- Comment for documentation
COMMENT ON COLUMN agents.admin_only IS 'Whether this agent should only be displayed to admin users in the UI';

-- Note: This migration adds the admin_only column
-- The build script will sync this field from agent config.yaml files
