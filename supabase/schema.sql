-- ShowTheRate Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (managed by NextAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    first_name TEXT,
    last_name TEXT,
    contact_email TEXT,
    nmls TEXT,
    phone TEXT,
    x_handle TEXT,
    facebook TEXT,
    tiktok TEXT,
    instagram TEXT,
    email_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nmls TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS x_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;

-- ============================================
-- 2. NEXTAUTH TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ============================================
-- 3. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- ============================================
-- 4. ENTITLEMENTS TABLE (Quotas)
-- ============================================
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'starter_pass_7d' | 'subscription'
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    -- Share link quota
    share_quota INTEGER NOT NULL DEFAULT 0,
    share_used INTEGER NOT NULL DEFAULT 0,
    -- Property fetch quota
    property_quota INTEGER NOT NULL DEFAULT 0,
    property_used INTEGER NOT NULL DEFAULT 0,
    -- AI generation quota
    ai_quota INTEGER NOT NULL DEFAULT 0,
    ai_used INTEGER NOT NULL DEFAULT 0,
    -- Stripe reference
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_active ON entitlements(user_id, ends_at);

-- ============================================
-- 5. USAGE LEDGER (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entitlement_id UUID REFERENCES entitlements(id) ON DELETE SET NULL,
    kind TEXT NOT NULL, -- 'share_create' | 'property_fetch' | 'ai_generate'
    delta INTEGER NOT NULL DEFAULT 1,
    ref_id TEXT, -- shareId / addressHash / aiRunId
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_ledger_user ON usage_ledger(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_ledger_idempotency ON usage_ledger(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================
-- 6. COMPARISONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Comparison',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_created ON comparisons(user_id, created_at DESC);

-- ============================================
-- 7. SCENARIOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'New Scenario',
    inputs_json JSONB NOT NULL DEFAULT '{}',
    outputs_json JSONB,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_comparison ON scenarios(comparison_id);

-- ============================================
-- 8. SHARES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comparison_id UUID NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
    share_id TEXT UNIQUE NOT NULL, -- Public share ID (short)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0,
    snapshot_json JSONB, -- Frozen copy of comparison at share time
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_share_id ON shares(share_id);
CREATE INDEX IF NOT EXISTS idx_shares_comparison ON shares(comparison_id);

-- ============================================
-- 9. PROPERTY CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS property_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    normalized_address TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'US',
    provider TEXT NOT NULL DEFAULT 'rentcast',
    payload_json JSONB NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(normalized_address, country_code)
);

CREATE INDEX IF NOT EXISTS idx_property_cache_address ON property_cache(normalized_address, country_code);
CREATE INDEX IF NOT EXISTS idx_property_cache_expires ON property_cache(expires_at);

-- ============================================
-- 10. AI RUNS TABLE (Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'summary' | 'tone_professional' | 'tone_friendly' | 'tone_urgency'
    input_hash TEXT NOT NULL,
    output_text TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER,
    cost_estimate DECIMAL(10, 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_share ON ai_runs(share_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_cache ON ai_runs(input_hash, type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS comparisons_select_own ON comparisons;
CREATE POLICY comparisons_select_own ON comparisons FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS comparisons_insert_own ON comparisons;
CREATE POLICY comparisons_insert_own ON comparisons FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS comparisons_update_own ON comparisons;
CREATE POLICY comparisons_update_own ON comparisons FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS comparisons_delete_own ON comparisons;
CREATE POLICY comparisons_delete_own ON comparisons FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS scenarios_select_own ON scenarios;
CREATE POLICY scenarios_select_own ON scenarios FOR SELECT 
    USING (comparison_id IN (SELECT id FROM comparisons WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS scenarios_insert_own ON scenarios;
CREATE POLICY scenarios_insert_own ON scenarios FOR INSERT 
    WITH CHECK (comparison_id IN (SELECT id FROM comparisons WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS scenarios_update_own ON scenarios;
CREATE POLICY scenarios_update_own ON scenarios FOR UPDATE 
    USING (comparison_id IN (SELECT id FROM comparisons WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS scenarios_delete_own ON scenarios;
CREATE POLICY scenarios_delete_own ON scenarios FOR DELETE 
    USING (comparison_id IN (SELECT id FROM comparisons WHERE user_id = auth.uid()));

-- Shares are publicly readable by share_id
DROP POLICY IF EXISTS shares_select_public ON shares;
CREATE POLICY shares_select_public ON shares FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS shares_insert_own ON shares;
CREATE POLICY shares_insert_own ON shares FOR INSERT 
    WITH CHECK (comparison_id IN (SELECT id FROM comparisons WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS entitlements_select_own ON entitlements;
CREATE POLICY entitlements_select_own ON entitlements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
CREATE POLICY subscriptions_select_own ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comparisons_updated_at ON comparisons;
CREATE TRIGGER update_comparisons_updated_at BEFORE UPDATE ON comparisons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entitlements_updated_at ON entitlements;
CREATE TRIGGER update_entitlements_updated_at BEFORE UPDATE ON entitlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT, -- Markdown
    cover_image TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
DROP POLICY IF EXISTS posts_select_published ON posts;
CREATE POLICY posts_select_published ON posts FOR SELECT USING (published = TRUE);

-- Only authenticated users (admins) can CRUD (For now, assuming all auth users are admins or we use dashboard)
-- Actually, for now, let's keep it simple: Public read, Auth write
DROP POLICY IF EXISTS posts_all_auth ON posts;
CREATE POLICY posts_all_auth ON posts FOR ALL USING (auth.role() = 'authenticated');