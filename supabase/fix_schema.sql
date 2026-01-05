-- Fix missing schema for Clients and Comparisons
-- Run this in Supabase SQL Editor to ensure all tables and columns exist

-- 1. Create Clients table if not exists
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Lead',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add client_id to comparisons if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'comparisons'
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.comparisons 
        ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add enhanced columns (source, tags) if they are missing (from pending migration)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 4. Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies (drop first to avoid errors)
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
CREATE POLICY "Users can manage their own clients"
ON public.clients
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Add Indexes
CREATE INDEX IF NOT EXISTS idx_comparisons_client_id ON public.comparisons(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
