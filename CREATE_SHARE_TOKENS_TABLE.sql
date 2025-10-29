-- Create table for storing temporary guest share links
-- These links allow non-authenticated users to view individual opportunities
-- Links expire after 24 hours

CREATE TABLE IF NOT EXISTS opportunity_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  topic_id TEXT NOT NULL,
  topic_number TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON opportunity_share_tokens(token) WHERE is_active = TRUE;

-- Create index for topic lookups
CREATE INDEX IF NOT EXISTS idx_share_tokens_topic_id ON opportunity_share_tokens(topic_id);

-- Create index for cleanup (finding expired tokens)
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires_at ON opportunity_share_tokens(expires_at) WHERE is_active = TRUE;

-- Add RLS policies
ALTER TABLE opportunity_share_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active, non-expired tokens (for guest access)
CREATE POLICY "Anyone can read active non-expired tokens"
  ON opportunity_share_tokens
  FOR SELECT
  USING (
    is_active = TRUE 
    AND expires_at > NOW()
  );

-- Allow authenticated users to create tokens
CREATE POLICY "Authenticated users can create tokens"
  ON opportunity_share_tokens
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to view their own tokens
CREATE POLICY "Users can view their own tokens"
  ON opportunity_share_tokens
  FOR SELECT
  USING (created_by = auth.uid());

-- Allow users to deactivate their own tokens
CREATE POLICY "Users can deactivate their own tokens"
  ON opportunity_share_tokens
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create a function to automatically clean up expired tokens (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_share_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deactivate expired tokens older than 7 days
  UPDATE opportunity_share_tokens
  SET is_active = FALSE
  WHERE expires_at < NOW() - INTERVAL '7 days'
    AND is_active = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE opportunity_share_tokens IS 'Temporary guest access tokens for sharing individual SBIR/STTR opportunities without requiring authentication. Tokens expire after 24 hours.';
COMMENT ON COLUMN opportunity_share_tokens.token IS 'Secure random token (64 characters) used in the share URL';
COMMENT ON COLUMN opportunity_share_tokens.views_count IS 'Number of times this link has been accessed';
COMMENT ON COLUMN opportunity_share_tokens.is_active IS 'Whether the token is still valid (can be manually deactivated)';

