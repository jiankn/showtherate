-- Add notes column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure status column exists and has proper default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'status'
    ) THEN
        ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;
