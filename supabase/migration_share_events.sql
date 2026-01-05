-- ShowTheRate Migration: Share Events Table
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE SHARE_EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS share_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
    comparison_id UUID REFERENCES comparisons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- LO who owns the comparison
    event_type TEXT NOT NULL, -- 'share_page_view' | 'cta_click'
    cta_type TEXT, -- 'call' | 'text' | 'email' | 'x' | 'instagram' | 'tiktok' | 'facebook'
    device TEXT, -- 'desktop' | 'mobile' | 'tablet'
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_events_share ON share_events(share_id);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_type ON share_events(event_type);

-- Note: No RLS for share_events as it's written by anonymous visitors
-- We use server-side API validation instead
