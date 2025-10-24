-- ========================================
-- FIX FEATURE FLAGS TABLE SCHEMA
-- ========================================
-- Run this in Supabase SQL Editor to fix the feature flags table

-- Step 1: Add missing columns
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS flag_name TEXT,
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'function',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Step 2: Copy data from old columns to new columns
UPDATE public.feature_flags 
SET 
    flag_name = COALESCE(flag_name, name),
    is_enabled = COALESCE(is_enabled, enabled_globally, true)
WHERE flag_name IS NULL OR is_enabled IS NULL;

-- Step 3: Drop old columns if they exist
ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS name;
ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS enabled_globally;

-- Step 4: Add constraints
ALTER TABLE public.feature_flags ADD CONSTRAINT unique_flag_name UNIQUE (flag_name);

-- Step 5: Update RLS policies
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

CREATE POLICY "Anyone can read feature flags"
    ON public.feature_flags FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage feature flags"
    ON public.feature_flags FOR ALL
    USING (public.is_current_user_admin());

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 7: Verify the fix worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feature_flags' 
ORDER BY ordinal_position;
