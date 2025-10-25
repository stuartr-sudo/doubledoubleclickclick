-- Fix onboarding - Column type mismatch
-- The column exists as text[] but app expects jsonb

-- 1. Check current column type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'completed_tutorial_ids';

-- 2. Fix the column type by converting text[] to jsonb
DO $$ 
BEGIN
    -- Check if column exists and is wrong type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'completed_tutorial_ids'
        AND data_type = 'ARRAY'  -- This means it's text[]
    ) THEN
        RAISE NOTICE 'Found completed_tutorial_ids as text[] - converting to jsonb...';
        
        -- Create a temporary column
        ALTER TABLE public.user_profiles 
        ADD COLUMN completed_tutorial_ids_temp JSONB DEFAULT '[]'::jsonb;
        
        -- Migrate data from text[] to jsonb
        -- Convert text array to jsonb array
        UPDATE public.user_profiles
        SET completed_tutorial_ids_temp = 
            CASE 
                WHEN completed_tutorial_ids IS NULL OR array_length(completed_tutorial_ids, 1) IS NULL 
                THEN '[]'::jsonb
                ELSE to_jsonb(completed_tutorial_ids)
            END;
        
        -- Drop old column
        ALTER TABLE public.user_profiles 
        DROP COLUMN completed_tutorial_ids;
        
        -- Rename temp column to original name
        ALTER TABLE public.user_profiles 
        RENAME COLUMN completed_tutorial_ids_temp TO completed_tutorial_ids;
        
        RAISE NOTICE 'Successfully converted completed_tutorial_ids to jsonb type';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'completed_tutorial_ids'
        AND udt_name = 'jsonb'
    ) THEN
        RAISE NOTICE 'completed_tutorial_ids is already jsonb - no conversion needed';
    ELSE
        RAISE NOTICE 'completed_tutorial_ids does not exist - creating as jsonb...';
        ALTER TABLE public.user_profiles 
        ADD COLUMN completed_tutorial_ids JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Ensure all users have valid jsonb arrays (not null)
UPDATE public.user_profiles 
SET completed_tutorial_ids = '[]'::jsonb
WHERE completed_tutorial_ids IS NULL;

-- 4. Add other missing columns if needed
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

-- 5. Verify the fix
SELECT 
    'After Fix' as status,
    column_name,
    data_type,
    udt_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name IN ('completed_tutorial_ids', 'token_balance', 'plan_price_id')
ORDER BY column_name;

-- 6. Show user onboarding status
SELECT 
    email,
    full_name,
    completed_tutorial_ids,
    CASE 
        WHEN completed_tutorial_ids @> '["welcome_onboarding"]'::jsonb THEN '✓ Welcome Complete'
        ELSE '○ Welcome Pending'
    END as welcome_status,
    CASE 
        WHEN completed_tutorial_ids @> '["getting_started_scrape"]'::jsonb THEN '✓ Getting Started Complete'
        ELSE '○ Getting Started Pending'
    END as getting_started_status
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- 7. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- SUCCESS! The column is now the correct type (jsonb) and the onboarding flow will work.

