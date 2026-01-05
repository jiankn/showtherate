-- ShowTheRate Migration: Clients Table
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Lead', -- 'Lead' | 'Active' | 'Closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_email ON clients(user_id, email);

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select_own ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY clients_insert_own ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY clients_update_own ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY clients_delete_own ON clients FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. ADD CLIENT_ID TO COMPARISONS
-- ============================================
ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Index for client lookup
CREATE INDEX IF NOT EXISTS idx_comparisons_client ON comparisons(user_id, client_id);
