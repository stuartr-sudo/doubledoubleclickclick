-- ========================================
-- APPLY THIS SQL TO YOUR SUPABASE DATABASE
-- ========================================
-- Instructions:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run" to execute
-- ========================================

-- ========================================
-- MIGRATION 023: Add admin read all policy
-- ========================================

-- Create helper function that checks if current user is admin
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_is_superadmin BOOLEAN;
BEGIN
    -- Get current user's role and superadmin status directly
    SELECT role, is_superadmin
    INTO user_role, user_is_superadmin
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Return true if admin or superadmin
    RETURN (user_role = 'admin' OR user_is_superadmin = true);
END;
$$;

-- Drop the overly restrictive existing SELECT policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;

-- Create a combined policy that allows:
-- 1. Users to read their own profile
-- 2. Admins/superadmins to read all profiles (using SECURITY DEFINER function)
CREATE POLICY "Users can read own profile or admins can read all"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        -- User can read their own profile
        auth.uid() = id
        OR
        -- OR user is an admin/superadmin (checked via SECURITY DEFINER function)
        public.is_current_user_admin() = true
    );

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;


-- ========================================
-- MIGRATION 024: Fix user_profiles schema
-- ========================================

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

-- Add comments explaining the schema
COMMENT ON COLUMN public.user_profiles.topics_onboarding_completed_at IS 'JSONB map of username -> ISO timestamp string when topics onboarding was completed';
COMMENT ON COLUMN public.user_profiles.topics IS 'JSONB array of usernames that have completed topics onboarding';
COMMENT ON COLUMN public.user_profiles.topics_timer_override IS 'JSONB map of username -> boolean indicating if timer should be bypassed';
COMMENT ON COLUMN public.user_profiles.topics_timer_hours IS 'JSONB map of username -> number of hours to wait after onboarding';
COMMENT ON COLUMN public.user_profiles.access_level IS 'User access level: view, edit, or full';
COMMENT ON COLUMN public.user_profiles.show_publish_options IS 'Whether to show publish options in the editor';
COMMENT ON COLUMN public.user_profiles.department IS 'User department or team name';


-- ========================================
-- VERIFICATION QUERIES (run these after)
-- ========================================

-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if admin function exists
SELECT proname FROM pg_proc WHERE proname = 'is_current_user_admin';

-- Test if you can see all users (run as admin)
SELECT id, email, full_name, role, is_superadmin, token_balance, completed_tutorial_ids
FROM user_profiles 
LIMIT 10;

