-- Fix user_profiles RLS policies to prevent login loop

-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Create a single, simple SELECT policy that allows:
-- 1. Users to view their own profile (no recursion)
-- 2. Admins to view all profiles
CREATE POLICY "Allow users to view profiles"
    ON public.user_profiles FOR SELECT
    USING (
        -- Always allow users to see their own profile
        auth.uid() = id
        OR
        -- Allow admins/superadmins to see all profiles
        -- Use a simpler check to avoid recursion
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (
                user_profiles.role IN ('admin', 'superadmin')
                OR user_profiles.is_superadmin = true
            )
        )
    );

-- Create a single UPDATE policy
CREATE POLICY "Allow users to update profiles"
    ON public.user_profiles FOR UPDATE
    USING (
        -- Users can update their own profile
        auth.uid() = id
        OR
        -- Admins can update all profiles
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (
                user_profiles.role IN ('admin', 'superadmin')
                OR user_profiles.is_superadmin = true
            )
        )
    )
    WITH CHECK (
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (
                user_profiles.role IN ('admin', 'superadmin')
                OR user_profiles.is_superadmin = true
            )
        )
    );

