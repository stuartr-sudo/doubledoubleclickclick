-- Add policies to allow admins to manage all user profiles

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- Allow admins and superadmins to view all user profiles
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR  -- Users can still view their own profile
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND (up.role = 'admin' OR up.role = 'superadmin' OR up.is_superadmin = true)
        )
    );

-- Allow admins and superadmins to update all user profiles
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR  -- Users can still update their own profile
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND (up.role = 'admin' OR up.role = 'superadmin' OR up.is_superadmin = true)
        )
    )
    WITH CHECK (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND (up.role = 'admin' OR up.role = 'superadmin' OR up.is_superadmin = true)
        )
    );

-- Allow admins to delete user profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles"
    ON public.user_profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND (up.role = 'admin' OR up.role = 'superadmin' OR up.is_superadmin = true)
        )
    );

