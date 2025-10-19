-- Fix tutorial_videos table structure
-- This script adds the missing assigned_page_name column

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutorial_videos' 
        AND column_name = 'assigned_page_name'
    ) THEN
        ALTER TABLE tutorial_videos ADD COLUMN assigned_page_name TEXT;
    END IF;
END $$;

-- Add the missing column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tutorial_videos' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE tutorial_videos ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update RLS policies for tutorial_videos if they don't exist
DO $$
BEGIN
    -- Enable RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tutorial_videos' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable read access for authenticated users" ON tutorial_videos
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;
