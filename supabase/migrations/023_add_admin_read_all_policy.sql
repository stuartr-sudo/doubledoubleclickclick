-- Add policy for admins to read all user profiles
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check admin status

-- First, create a helper function that checks if current user is admin
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

