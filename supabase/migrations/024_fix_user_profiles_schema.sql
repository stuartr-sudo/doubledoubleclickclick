-- Fix user_profiles schema to match application expectations
-- Add missing columns for user permissions and fix topics_onboarding_completed_at type

-- 1. Fix topics_onboarding_completed_at - should be JSONB map, not single timestamp
DO $$ 
BEGIN
    -- Check if column exists and is the wrong type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_onboarding_completed_at'
        AND data_type = 'timestamp with time zone'
    ) THEN
        -- Drop and recreate with correct type
        ALTER TABLE public.user_profiles DROP COLUMN topics_onboarding_completed_at;
        ALTER TABLE public.user_profiles ADD COLUMN topics_onboarding_completed_at JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- If it doesn't exist at all, add it as JSONB
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_onboarding_completed_at'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics_onboarding_completed_at JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Add access_level column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'access_level'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN access_level TEXT DEFAULT 'edit';
    END IF;
END $$;

-- 3. Add show_publish_options column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'show_publish_options'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN show_publish_options BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Add department column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'department'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN department TEXT DEFAULT '';
    END IF;
END $$;

-- 5. Ensure topics is JSONB array (should already be, but let's verify)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 6. Ensure topics_timer_override exists (should be from migration 009)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_timer_override'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics_timer_override JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 7. Ensure topics_timer_hours exists (should be from migration 009)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'topics_timer_hours'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN topics_timer_hours JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add comment explaining the schema
COMMENT ON COLUMN public.user_profiles.topics_onboarding_completed_at IS 'JSONB map of username -> ISO timestamp string when topics onboarding was completed';
COMMENT ON COLUMN public.user_profiles.topics IS 'JSONB array of usernames that have completed topics onboarding';
COMMENT ON COLUMN public.user_profiles.topics_timer_override IS 'JSONB map of username -> boolean indicating if timer should be bypassed';
COMMENT ON COLUMN public.user_profiles.topics_timer_hours IS 'JSONB map of username -> number of hours to wait after onboarding';
COMMENT ON COLUMN public.user_profiles.access_level IS 'User access level: view, edit, or full';
COMMENT ON COLUMN public.user_profiles.show_publish_options IS 'Whether to show publish options in the editor';
COMMENT ON COLUMN public.user_profiles.department IS 'User department or team name';

