-- Fix onboarding flow - Add missing completed_tutorial_ids column
-- This is critical for the Welcome -> Getting Started flow to work

-- 1. Add completed_tutorial_ids column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'completed_tutorial_ids'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN completed_tutorial_ids JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added completed_tutorial_ids column';
    ELSE
        RAISE NOTICE 'completed_tutorial_ids column already exists';
    END IF;
END $$;

-- 2. Add other potentially missing onboarding-related columns

-- token_balance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'token_balance'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN token_balance NUMERIC DEFAULT 20;
        
        RAISE NOTICE 'Added token_balance column';
    END IF;
END $$;

-- plan_price_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'plan_price_id'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN plan_price_id TEXT;
        
        RAISE NOTICE 'Added plan_price_id column';
    END IF;
END $$;

-- 3. Ensure all existing users have empty tutorial array (not null)
UPDATE public.user_profiles 
SET completed_tutorial_ids = '[]'::jsonb
WHERE completed_tutorial_ids IS NULL;

-- 4. Add helpful comment
COMMENT ON COLUMN public.user_profiles.completed_tutorial_ids IS 'Array of tutorial IDs that the user has completed (e.g., ["welcome_onboarding", "getting_started_scrape"])';

-- 5. Verify the column exists and show sample data
SELECT 
    'Column Check' as test,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'completed_tutorial_ids';

-- 6. Show current user profiles with onboarding status
SELECT 
    id,
    email,
    full_name,
    role,
    completed_tutorial_ids,
    CASE 
        WHEN completed_tutorial_ids @> '["welcome_onboarding"]'::jsonb THEN 'Welcome Complete ✓'
        ELSE 'Welcome Pending'
    END as welcome_status,
    CASE 
        WHEN completed_tutorial_ids @> '["getting_started_scrape"]'::jsonb THEN 'Getting Started Complete ✓'
        ELSE 'Getting Started Pending'
    END as getting_started_status,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 7. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

