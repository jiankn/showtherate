-- Profile Feature Migration
-- Run this in Supabase SQL Editor to add Profile fields to users table

-- Add columns for Profile Settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nmls TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS x_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Verify columns exist (optional, just for confirmation in output)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
