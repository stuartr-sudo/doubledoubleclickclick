-- Fix feature_flags table schema mismatch
-- The application expects 'flag_name' and 'is_enabled' columns but the table has 'name' and 'enabled_globally'

-- First, let's check if the columns exist and rename them if needed
DO $$
BEGIN
    -- Check if 'name' column exists and rename to 'flag_name'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'feature_flags' AND column_name = 'name') THEN
        ALTER TABLE public.feature_flags RENAME COLUMN name TO flag_name;
    END IF;
    
    -- Check if 'enabled_globally' column exists and rename to 'is_enabled'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'feature_flags' AND column_name = 'enabled_globally') THEN
        ALTER TABLE public.feature_flags RENAME COLUMN enabled_globally TO is_enabled;
    END IF;
END $$;

-- Add missing columns if they don't exist
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS flag_name TEXT,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'function',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Update existing records to have proper flag_name and is_enabled values
UPDATE public.feature_flags 
SET flag_name = name, is_enabled = enabled_globally 
WHERE flag_name IS NULL AND name IS NOT NULL;

-- Drop the old columns if they still exist
ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS name;
ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS enabled_globally;

-- Add unique constraint on flag_name
ALTER TABLE public.feature_flags ADD CONSTRAINT unique_flag_name UNIQUE (flag_name);

-- Update RLS policies to work with new column names
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

-- Create new policies
CREATE POLICY "Anyone can read feature flags"
    ON public.feature_flags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage feature flags"
    ON public.feature_flags FOR ALL
    USING (public.is_current_user_admin());

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
