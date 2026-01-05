-- Add source and tags columns to clients table for import/export feature
-- Source: tracks where the client came from (e.g., referral, website, import)
-- Tags: JSON array for client categorization (e.g., VIP, first-time buyer, refinance)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add index for faster tag queries
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN (tags);

-- Comment on columns
COMMENT ON COLUMN clients.source IS 'Client source/origin (e.g., referral, website, import)';
COMMENT ON COLUMN clients.tags IS 'JSON array of client tags for categorization';
