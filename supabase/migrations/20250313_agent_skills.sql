-- Agent Skills Table
-- Stores reusable skills that can be referenced by agents
-- Each skill contains the skill content, name, and a brief description

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS agent_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Skill information
  skill_name TEXT NOT NULL,                    -- Name of the skill (e.g., "Email Writing", "SEO Optimization")
  brief TEXT NOT NULL,                         -- Brief description of what the skill does
  skill_content TEXT NOT NULL,                 -- Full content/instructions for the skill

  -- Metadata
  agent_id TEXT NOT NULL,                      -- Agent this skill belongs to (e.g., 'social_media', 'newsletter')
  is_global BOOLEAN DEFAULT false,             -- Whether this skill is available to all agents
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(skill_name, agent_id)                 -- Prevent duplicate skill names per agent
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_skills_name
  ON agent_skills(skill_name);

CREATE INDEX IF NOT EXISTS idx_agent_skills_global
  ON agent_skills(is_global)
  WHERE is_global = true;

CREATE INDEX IF NOT EXISTS idx_agent_skills_agent
  ON agent_skills(agent_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_skills_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_skills_updated
  BEFORE UPDATE ON agent_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_skills_timestamp();

-- RLS Policies
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

-- Users can view all skills (filtered by agent_id in application logic)
CREATE POLICY agent_skills_select_policy ON agent_skills
  FOR SELECT
  USING (true);

-- Service role can insert skills
CREATE POLICY agent_skills_insert_policy ON agent_skills
  FOR INSERT
  WITH CHECK (true);

-- Service role can update skills
CREATE POLICY agent_skills_update_policy ON agent_skills
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Service role can delete skills
CREATE POLICY agent_skills_delete_policy ON agent_skills
  FOR DELETE
  USING (true);

-- Comments for documentation
COMMENT ON TABLE agent_skills IS 'Stores reusable skills that can be referenced by AI agents';
COMMENT ON COLUMN agent_skills.skill_name IS 'Name of the skill';
COMMENT ON COLUMN agent_skills.brief IS 'Brief description of what the skill does';
COMMENT ON COLUMN agent_skills.skill_content IS 'Full content/instructions for the skill';
COMMENT ON COLUMN agent_skills.agent_id IS 'Agent this skill belongs to';
COMMENT ON COLUMN agent_skills.is_global IS 'Whether this skill is available to all agents';
