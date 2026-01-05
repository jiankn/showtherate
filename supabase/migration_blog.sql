-- Blog Feature Migration
-- Run this in Supabase SQL Editor to add Blog functionality
-- This file ONLY contains the new changes (Posts table), so it won't conflict with your existing tables.

-- 1. Create Posts Table
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

-- 2. Create Indices
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);

-- 3. Trigger for updated_at
-- (We check if trigger exists by dropping it first to ensure idempotency)
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
-- We drop existing policies first to allow re-running this script without errors
DROP POLICY IF EXISTS posts_select_published ON posts;
CREATE POLICY posts_select_published ON posts FOR SELECT USING (published = TRUE);

DROP POLICY IF EXISTS posts_all_auth ON posts;
CREATE POLICY posts_all_auth ON posts FOR ALL USING (auth.role() = 'authenticated');
