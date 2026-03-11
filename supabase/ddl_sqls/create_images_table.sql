-- Create table for storing image metadata
CREATE TABLE IF NOT EXISTS content_repurposer_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    content TEXT,
    image_url TEXT NOT NULL,
    prompt TEXT,
    generation_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'auto', 'upload'
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_user_id ON content_repurposer_images(user_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_agent_id ON content_repurposer_images(agent_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_post_id ON content_repurposer_images(post_id);
CREATE INDEX IF NOT EXISTS idx_content_repurposer_images_platform ON content_repurposer_images(platform);

-- Create trigger to update updated_date on row changes
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_repurposer_images_updated_date 
    BEFORE UPDATE ON content_repurposer_images 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_date_column();